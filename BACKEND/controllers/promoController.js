import db from "../config/db.js";

//promoController.js
// ================= LẤY DANH SÁCH VOUCHER =================
export const getPromotions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, b.name as branch_name
       FROM promotions p
       LEFT JOIN branches b ON p.branch_id = b.branch_id
       ORDER BY p.created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= LẤY CHI TIẾT 1 VOUCHER =================
export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT p.*, b.name as branch_name
       FROM promotions p
       LEFT JOIN branches b ON p.branch_id = b.branch_id
       WHERE promo_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= TẠO VOUCHER =================
export const createPromotion = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    let {
      title,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      branch_id,
    } = req.body;

    // Trim
    if (typeof title === "string") title = title.trim();
    if (typeof description === "string") description = description.trim();

    // Validate
    if (!title) return res.status(400).json({ message: "Tên voucher không được để trống" });
    if (!discount_type || !["PERCENT", "AMOUNT"].includes(discount_type)) {
      return res.status(400).json({ message: "discount_type phải là PERCENT hoặc AMOUNT" });
    }
    if (!discount_value || isNaN(discount_value)) {
      return res.status(400).json({ message: "discount_value phải là số hợp lệ" });
    }
    discount_value = Number(discount_value);
    if (discount_type === "PERCENT" && (discount_value <= 0 || discount_value > 100)) {
      return res.status(400).json({ message: "Giá trị phần trăm phải trong khoảng 1-100" });
    }
    if (discount_type === "AMOUNT" && discount_value <= 0) {
      return res.status(400).json({ message: "Giá trị giảm phải lớn hơn 0" });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ message: "Ngày bắt đầu và kết thúc không được để trống" });
    }
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" });
    }

    // Kiểm tra branch_id
    if (branch_id) {
      const [branchRows] = await db.query("SELECT * FROM branches WHERE branch_id = ?", [branch_id]);
      if (branchRows.length === 0) {
        return res.status(400).json({ message: "Chi nhánh không tồn tại" });
      }
    } else {
      branch_id = null; // toàn bộ chi nhánh
    }

    await db.query(
      `INSERT INTO promotions 
       (title, description, discount_type, discount_value, start_date, end_date, branch_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, discount_type, discount_value, start_date, end_date, branch_id]
    );

    return res.status(201).json({ message: "Thêm voucher thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= CẬP NHẬT VOUCHER =================
export const updatePromotion = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { id } = req.params;
    let {
      title,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      branch_id,
    } = req.body;

    // Lấy dữ liệu cũ
    const [rows] = await db.query("SELECT * FROM promotions WHERE promo_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy voucher" });
    const oldData = rows[0];

    // Trim
    if (typeof title === "string") title = title.trim();
    if (typeof description === "string") description = description.trim();

    // Validate cơ bản
    if (title !== undefined && title === "") {
      return res.status(400).json({ message: "Tên voucher không được để trống" });
    }

    if (discount_type !== undefined && !["PERCENT", "AMOUNT"].includes(discount_type)) {
      return res.status(400).json({ message: "discount_type phải là PERCENT hoặc AMOUNT" });
    }

    if (discount_value !== undefined) {
      discount_value = Number(discount_value);
      if (isNaN(discount_value)) {
        return res.status(400).json({ message: "discount_value phải là số hợp lệ" });
      }
      if (discount_type === "PERCENT" && (discount_value <= 0 || discount_value > 100)) {
        return res.status(400).json({ message: "Giá trị phần trăm phải trong khoảng 1-100" });
      }
      if (discount_type === "AMOUNT" && discount_value <= 0) {
        return res.status(400).json({ message: "Giá trị giảm phải lớn hơn 0" });
      }
    }

    if (start_date !== undefined && end_date !== undefined) {
      if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({ message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" });
      }
    }

    // Kiểm tra branch_id
    if (branch_id !== undefined && branch_id !== null) {
      const [branchRows] = await db.query("SELECT * FROM branches WHERE branch_id = ?", [branch_id]);
      if (branchRows.length === 0) {
        return res.status(400).json({ message: "Chi nhánh không tồn tại" });
      }
    }

    // Giữ nguyên dữ liệu cũ nếu không truyền mới
    title = title || oldData.title;
    description = description || oldData.description;
    discount_type = discount_type || oldData.discount_type;
    discount_value = discount_value !== undefined ? discount_value : oldData.discount_value;
    start_date = start_date || oldData.start_date;
    end_date = end_date || oldData.end_date;
    branch_id = branch_id !== undefined ? branch_id : oldData.branch_id;

    // Check no change
    const noChange =
      title === oldData.title &&
      description === oldData.description &&
      discount_type === oldData.discount_type &&
      discount_value === oldData.discount_value &&
      new Date(start_date).getTime() === new Date(oldData.start_date).getTime() &&
      new Date(end_date).getTime() === new Date(oldData.end_date).getTime() &&
      branch_id === oldData.branch_id;

    if (noChange) {
      return res.status(400).json({ message: "Không có thông tin nào được thay đổi" });
    }

    await db.query(
      `UPDATE promotions 
       SET title=?, description=?, discount_type=?, discount_value=?, start_date=?, end_date=?, branch_id=?, updated_at=NOW() 
       WHERE promo_id=?`,
      [title, description, discount_type, discount_value, start_date, end_date, branch_id, id]
    );

    return res.json({ message: "Cập nhật voucher thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÓA VOUCHER =================
export const deletePromotion = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM promotions WHERE promo_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy voucher" });

    await db.query("DELETE FROM promotions WHERE promo_id = ?", [id]);
    return res.json({ message: "Xóa voucher thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
