import db from "../config/db.js";

// ================= TẠO PHIẾU NHẬP KHO MỚI =================
export const createImport = async (req, res) => {
  try {
    const staffId = req.user.user_id; // từ session / JWT
    const { note } = req.body;

    // Lấy branch_id của staff
    const [staff] = await db.query("SELECT branch_id FROM users WHERE user_id=? AND role='STAFF'", [staffId]);
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

// ================= THÊM HÀNG VÀO PHIẾU NHẬP =================
export const addItemToImport = async (req, res) => {
  try {
    const { import_id, item_id, quantity } = req.body;

    if (!import_id || !item_id || !quantity) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: "Số lượng phải >= 1" });
    }

    // Kiểm tra import có tồn tại và đang PENDING
    const [imports] = await db.query("SELECT * FROM imports WHERE import_id=? AND status='PENDING'", [import_id]);
    if (imports.length === 0) {
      return res.status(404).json({ message: "Phiếu nhập không tồn tại hoặc đã hoàn tất" });
    }

    // Kiểm tra xem item đã có trong phiếu chưa
    const [existing] = await db.query(
      "SELECT * FROM import_items WHERE import_id=? AND item_id=?",
      [import_id, item_id]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + quantity;
      await db.query(
        "UPDATE import_items SET quantity=? WHERE import_item_id=?",
        [newQty, existing[0].import_item_id]
      );
    } else {
      await db.query(
        `INSERT INTO import_items (import_id, item_id, quantity)
         VALUES (?, ?, ?)`,
        [import_id, item_id, quantity]
      );
    }

    return res.json({ message: "Thêm hàng vào phiếu nhập thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= LẤY CHI TIẾT PHIẾU NHẬP =================
export const getImportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [imports] = await db.query("SELECT * FROM imports WHERE import_id=?", [id]);
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

    const [rows] = await db.query("SELECT * FROM import_items WHERE import_item_id=?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy import_item" });
    }

    await db.query("UPDATE import_items SET quantity=? WHERE import_item_id=?", [quantity, id]);

    return res.json({ message: "Cập nhật số lượng thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÓA HÀNG TRONG PHIẾU NHẬP =================
export const deleteImportItem = async (req, res) => {
  try {
    const { id } = req.params; // import_item_id

    const [rows] = await db.query("SELECT * FROM import_items WHERE import_item_id=?", [id]);
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

    // Kiểm tra phiếu nhập
    const [imports] = await db.query("SELECT * FROM imports WHERE import_id=? AND status='PENDING'", [id]);
    if (imports.length === 0) {
      return res.status(404).json({ message: "Phiếu nhập không tồn tại hoặc đã hoàn tất" });
    }

    // Lấy các import_items
    const [items] = await db.query("SELECT * FROM import_items WHERE import_id=?", [id]);

    // Cộng stock_quantity cho từng item
    for (const item of items) {
      await db.query(
        `UPDATE menu_items SET stock_quantity = stock_quantity + ? WHERE item_id=?`,
        [item.quantity, item.item_id]
      );
    }

    // Đổi status -> COMPLETE
    await db.query("UPDATE imports SET status='COMPLETE' WHERE import_id=?", [id]);

    return res.json({ message: "Hoàn tất phiếu nhập, đã cộng stock thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
