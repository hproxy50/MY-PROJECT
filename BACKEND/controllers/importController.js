import db from "../config/db.js";

// ================= TẠO PHIẾU NHẬP KHO MỚI =================
export const createImport = async (req, res) => {
  try {
    const staffId = req.user.user_id; // từ session / JWT
    const { note } = req.body;

    // Lấy branch_id của staff
    const [staff] = await db.query(
      "SELECT branch_id FROM users WHERE user_id=? AND role='STAFF'",
      [staffId]
    );
    if (staff.length === 0) {
      return res.status(403).json({ message: "Không phải nhân viên hợp lệ" });
    }
    const branchId = staff[0].branch_id;

    // Tạo phiếu nhập mới
    const [result] = await db.query(
      `INSERT INTO imports (branch_id, staff_id, status, note, created_at)
       VALUES (?, ?, 'PENDING', ?, NOW())`,
      [branchId, staffId, note || null]
    );

    return res.status(201).json({
      message: "Tạo phiếu nhập mới thành công",
      import_id: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

export const addItemToImport = async (req, res) => {
  const { import_id, items } = req.body;

  // 1. Validate dữ liệu
  if (!import_id || !items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({
        message: "Dữ liệu không hợp lệ. Cần import_id và một mảng 'items'.",
      });
  }

  // 2. Kiểm tra phiếu nhập
  const [imports] = await db.query(
    "SELECT * FROM imports WHERE import_id=? AND status='PENDING'",
    [import_id]
  );
  if (imports.length === 0) {
    return res
      .status(404)
      .json({ message: "Phiếu nhập không tồn tại hoặc đã hoàn tất" });
  }

  // 3. Bắt đầu Transaction
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 4. Chuẩn bị dữ liệu cho batch insert
    const values = [];
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!item.item_id || isNaN(qty) || qty < 1) {
        // Nếu có 1 item không hợp lệ, hủy toàn bộ
        throw new Error(
          `Sản phẩm (ID: ${item.item_id}) có số lượng không hợp lệ: ${item.quantity}`
        );
      }
      values.push([import_id, item.item_id, qty]);
    }

    // 5. Query batch insert
    // Logic này giả định bạn chỉ insert 1 lần.
    // Nếu bạn muốn "thêm" vào phiếu đã có, bạn cần logic "ON DUPLICATE KEY UPDATE"
    // Nhưng với UI mới, chúng ta sẽ gửi toàn bộ 1 lần -> chỉ cần INSERT
    await connection.query(
      "INSERT INTO import_items (import_id, item_id, quantity) VALUES ?",
      [values]
    );

    // 6. Commit
    await connection.commit();
    return res.json({ message: "Thêm hàng loạt vào phiếu nhập thành công" });
  } catch (error) {
    // 7. Rollback nếu lỗi
    await connection.rollback();
    console.error("Lỗi khi thêm hàng loạt vào phiếu:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  } finally {
    // 8. Trả connection
    connection.release();
  }
};

// ================= LẤY CHI TIẾT PHIẾU NHẬP =================
export const getImportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [imports] = await db.query(
      "SELECT * FROM imports WHERE import_id=?",
      [id]
    );
    if (imports.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiếu nhập" });
    }

    const [items] = await db.query(
      `SELECT ii.import_item_id, ii.item_id, m.name, ii.quantity
       FROM import_items ii
       JOIN menu_items m ON ii.item_id = m.item_id
       WHERE ii.import_id=?`,
      [id]
    );

    return res.json({ ...imports[0], items });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= CẬP NHẬT SỐ LƯỢNG HÀNG =================
export const updateImportItem = async (req, res) => {
  try {
    const { id } = req.params; // import_item_id
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Số lượng phải >= 1" });
    }

    const [rows] = await db.query(
      "SELECT * FROM import_items WHERE import_item_id=?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy import_item" });
    }

    await db.query(
      "UPDATE import_items SET quantity=? WHERE import_item_id=?",
      [quantity, id]
    );

    return res.json({ message: "Cập nhật số lượng thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÓA HÀNG TRONG PHIẾU NHẬP =================
export const deleteImportItem = async (req, res) => {
  try {
    const { id } = req.params; // import_item_id

    const [rows] = await db.query(
      "SELECT * FROM import_items WHERE import_item_id=?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy import_item" });
    }

    await db.query("DELETE FROM import_items WHERE import_item_id=?", [id]);

    return res.json({ message: "Xóa hàng khỏi phiếu nhập thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÁC NHẬN PHIẾU NHẬP (CỘNG STOCK) =================
export const completeImport = async (req, res) => {
  try {
    const { id } = req.params; // import_id

    // (Code kiểm tra phiếu nhập và lấy items giữ nguyên)
    const [imports] = await db.query(
      "SELECT * FROM imports WHERE import_id=? AND status='PENDING'",
      [id]
    );
    if (imports.length === 0) {
      return res
        .status(404)
        .json({ message: "Phiếu nhập không tồn tại hoặc đã hoàn tất" });
    }
    const [items] = await db.query(
      "SELECT * FROM import_items WHERE import_id=?",
      [id]
    );

    // *** THAY ĐỔI LOGIC ***
    // Bỏ check `IS NOT NULL`, luôn cập nhật stock và availability
    for (const item of items) {
      await db.query(
        `UPDATE menu_items
         SET
           stock_quantity = stock_quantity + ?,
           is_available = CASE
             -- Luôn kiểm tra, vì stock_quantity không còn là NULL
             WHEN (stock_quantity + ?) > 0 THEN 1
             ELSE 0
           END
         WHERE item_id = ?`,
        [item.quantity, item.quantity, item.item_id] // Truyền item.quantity 2 lần
      );
    }

    // Đổi status -> COMPLETE
    await db.query("UPDATE imports SET status='COMPLETE' WHERE import_id=?", [
      id,
    ]);

    return res.json({
      message: "Hoàn tất phiếu nhập, đã cộng stock thành công",
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
