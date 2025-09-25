import db from "../config/db.js";

// ================= LẤY DANH SÁCH CATEGORY CHI NHÁNH =================
export const getCategory = async (req, res) => {
  try {
    const branchId =
      req.user.role === "STAFF" ? req.user.branch_id : req.query.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Thiếu branch_id" });
    }

    const [rows] = await db.query(
      "SELECT category_id, branch_id, food_type FROM category WHERE branch_id = ?",
      [branchId]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= LẤY CHI TIẾT 1 CATEGORY =================
export const getCategoryId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT category_id, branch_id, food_type FROM category WHERE category_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    const category = rows[0];

    // STAFF chỉ xem được món ăn thuộc chi nhánh mình
    if (req.user.role === "STAFF" && category.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "Không có quyền của chi nhánh khác" });
    }

    return res.json(category);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= TẠO CATEGORY =================
export const createCategory = async (req, res) => {
  try {
    let { food_type } = req.body;

    const branchId =
      req.user.role === "STAFF" ? req.user.branch_id : req.body.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Thiếu branch_id" });
    }

    // Trim
    if (typeof food_type === "string") food_type = food_type.trim();

    // Validate
    if (!food_type)
      return res
        .status(400)
        .json({ message: "Tên category không được để trống" });

    await db.query(
      "INSERT INTO category (branch_id, food_type) VALUES (?, ?)",
      [branchId, food_type]
    );

    return res.status(201).json({ message: "Thêm category thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= UPDATE CATEGORY =================
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let { food_type } = req.body;

    // Lấy dữ liệu cũ
    const [rows] = await db.query(
      "SELECT * FROM category WHERE category_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy category" });
    const oldData = rows[0];

    // Staff chỉ được sửa món ăn thuộc chi nhánh mình
    if (req.user.role === "STAFF" && oldData.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "Không có quyền sửa của chi nhánh khác" });
    }

    // Trim chuỗi
    if (typeof food_type === "string") food_type = food_type.trim();

    // Validate
    //Validate: Nếu truyền name rỗng => báo lỗi

    if (food_type !== undefined && food_type === "") {
      return res
        .status(400)
        .json({ message: "Tên category không được để trống" });
    }

    // Dùng dữ liệu cũ nếu không truyền mới
    food_type = food_type || oldData.name;

    // Check no change
    const noChange =
      food_type === oldData.food_type;

    if (noChange) {
      return res
        .status(400)
        .json({ message: "Không có thông tin nào được thay đổi" });
    }

    // Update DB
    await db.query(
      "UPDATE category SET food_type=? WHERE category_id=?",
      [food_type, id]
    );

    return res.json({ message: "Cập category thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÓA MÓN ĂN =================
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM category WHERE category_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy category" });

    const item = rows[0];

    // Staff chỉ được xóa món ăn thuộc chi nhánh mình
    if (req.user.role === "STAFF" && item.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "Không có quyền xóa của chi nhánh khác" });
    }

    await db.query("DELETE FROM category WHERE category_id = ?", [id]);
    return res.json({ message: "Xóa category thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
