import db from "../config/db.js";
import { upload } from "../middlewares/uploadMiddlewares.js";

// ================= LẤY DANH SÁCH MÓN ĂN THEO CHI NHÁNH =================
export const getMenuItems = async (req, res) => {
  try {
    const branchId =
      req.user.role === "STAFF" ? req.user.branch_id : req.query.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Thiếu branch_id" });
    }

    const [rows] = await db.query(
      `SELECT 
     mi.item_id, 
     mi.name, 
     mi.image, 
     mi.category_id,
     c.food_type,
     mi.description, 
     mi.price, 
     mi.is_available, 
     mi.stock_quantity, 
     mi.branch_id, 
     mi.created_at
   FROM menu_items mi
   JOIN category c ON mi.category_id = c.category_id
   WHERE mi.branch_id = ?`,
      [branchId]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= LẤY CHI TIẾT 1 MÓN ĂN =================
export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT item_id, name, image, category_id, description, price, is_available, branch_id, created_at FROM menu_items WHERE item_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    }

    const item = rows[0];

    if (req.user.role === "STAFF" && item.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "Không có quyền xem món ăn của chi nhánh khác" });
    }

    // Lấy option groups kèm choices
    const [groups] = await db.query(
      `SELECT og.group_id, og.name AS group_name, og.selection_type, og.is_required
       FROM item_option_groups og
       WHERE og.item_id = ?
       ORDER BY og.sort_order`,
      [id]
    );

    for (const g of groups) {
      const [choices] = await db.query(
        "SELECT choice_id, name AS choice_name, price_delta FROM item_option_choices WHERE group_id = ? ORDER BY sort_order",
        [g.group_id]
      );
      g.choices = choices;
    }

    return res.json({ ...item, optionGroups: groups });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= TẠO MÓN ĂN =================
export const createMenuItem = async (req, res) => {
  try {
    let {
      name,
      category_id,
      description,
      price,
      is_available,
      stock_quantity,
      optionsDef, 
    } = req.body;

    if (typeof optionsDef === "string") {
      try {
        optionsDef = JSON.parse(optionsDef);
      } catch (e) {
        return res
          .status(400)
          .json({ message: "optionsDef không phải JSON hợp lệ" });
      }
    }

    // Ảnh lấy từ file upload
    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const branchId =
      req.user.role === "STAFF" ? req.user.branch_id : req.body.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Thiếu branch_id" });
    }

    // Trim
    if (typeof name === "string") name = name.trim();
    if (typeof description === "string") description = description.trim();

    // Validate cơ bản (giữ logic bạn đã có)
    if (!name)
      return res
        .status(400)
        .json({ message: "Tên món ăn không được để trống" });

    if (!price || isNaN(price))
      return res.status(400).json({ message: "Giá món ăn phải là số hợp lệ" });

    is_available =
      is_available !== undefined ? (Number(is_available) === 1 ? 1 : 0) : 1;

    if (stock_quantity !== undefined && stock_quantity !== null) {
      stock_quantity = Number(stock_quantity);
      if (isNaN(stock_quantity) || stock_quantity < 0) {
        return res
          .status(400)
          .json({ message: "Số lượng phải là số >= 0 hoặc NULL" });
      }
      if (stock_quantity === 0) is_available = 0;
    } else {
      stock_quantity = null;
    }

    // Kiểm tra category_id hợp lệ (giữ code cũ)
    const [categoryRows] = await db.query(
      "SELECT * FROM category WHERE category_id = ?",
      [category_id]
    );
    if (categoryRows.length === 0) {
      return res.status(400).json({ message: "Category không tồn tại" });
    }

    const category = categoryRows[0];
    if (
      req.user.role === "STAFF" &&
      category.branch_id !== req.user.branch_id
    ) {
      return res
        .status(403)
        .json({ message: "Không có quyền sử dụng category này" });
    }

    // -------------- Insert menu_items --------------
    const [result] = await db.query(
      "INSERT INTO menu_items (name, image, category_id, description, price, branch_id, stock_quantity, is_available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        name,
        image,
        category_id,
        description,
        price,
        branchId,
        stock_quantity,
        is_available ?? 1,
      ]
    );

    const itemId = result.insertId;

    // -------------- Insert options nếu có --------------
    // optionsDef expected: [{ name, selection_type: 'SINGLE'|'MULTI', is_required:0|1, choices: [{name, price_delta}] }, ...]
    if (optionsDef && Array.isArray(optionsDef) && optionsDef.length > 0) {
      for (let gi = 0; gi < optionsDef.length; gi++) {
        const group = optionsDef[gi];
        // Basic validation per group
        if (!group.name) continue; // skip invalid group
        const selType = group.selection_type === "MULTI" ? "MULTI" : "SINGLE";
        const isReq = group.is_required ? 1 : 0;

        const [gRes] = await db.query(
          "INSERT INTO item_option_groups (item_id, name, selection_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?)",
          [itemId, group.name, selType, isReq, gi]
        );
        const groupId = gRes.insertId;

        if (group.choices && Array.isArray(group.choices)) {
          for (let ci = 0; ci < group.choices.length; ci++) {
            const choice = group.choices[ci];
            if (!choice || !choice.name) continue;
            const delta =
              choice.price_delta !== undefined ? Number(choice.price_delta) : 0;
            await db.query(
              "INSERT INTO item_option_choices (group_id, name, price_delta, sort_order) VALUES (?, ?, ?, ?)",
              [groupId, choice.name, isNaN(delta) ? 0 : delta, ci]
            );
          }
        }
      }
    }

    return res
      .status(201)
      .json({ message: "Thêm món ăn thành công", item_id: itemId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= CẬP NHẬT MÓN ĂN =================
export const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    let {
      name,
      category_id,
      description,
      price,
      is_available,
      stock_quantity,
    } = req.body;

    // Ảnh lấy từ file upload
    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    // Lấy dữ liệu cũ
    const [rows] = await db.query(
      "SELECT * FROM menu_items WHERE item_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    const oldData = rows[0];

    // Staff chỉ được sửa món ăn thuộc chi nhánh mình
    if (req.user.role === "STAFF" && oldData.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "Không có quyền sửa món ăn của chi nhánh khác" });
    }

    // Trim chuỗi
    if (typeof name === "string") name = name.trim();
    if (typeof description === "string") description = description.trim();

    // Validate
    // //Validate: Nếu truyền name rỗng => báo lỗi

    if (name !== undefined && name === "") {
      return res
        .status(400)
        .json({ message: "Tên món ăn không được để trống" });
    }

    if (price !== undefined && isNaN(price)) {
      return res.status(400).json({ message: "Giá món ăn phải là số hợp lệ" });
    }

    if (is_available !== undefined) {
      is_available = Number(is_available) === 1 ? 1 : 0;
    }

    // Validate stock_quantity
    if (stock_quantity !== undefined) {
      if (stock_quantity === null) {
        stock_quantity = null;
      } else {
        stock_quantity = Number(stock_quantity);
        if (isNaN(stock_quantity) || stock_quantity < 0) {
          return res
            .status(400)
            .json({ message: "Số lượng phải là số >= 0 hoặc NULL" });
        }
      }
    } else {
      stock_quantity = oldData.stock_quantity;
    }

    // Nếu stock_quantity = 0 thì tự động set is_available = 0
    if (stock_quantity === 0) {
      is_available = 0;
    }

    // Kiểm tra category_id hợp lệ
    const [categoryRows] = await db.query(
      "SELECT * FROM category WHERE category_id = ?",
      [category_id]
    );
    if (categoryRows.length === 0) {
      return res.status(400).json({ message: "Category không tồn tại" });
    }

    const category = categoryRows[0];
    if (
      req.user.role === "STAFF" &&
      category.branch_id !== req.user.branch_id
    ) {
      return res
        .status(403)
        .json({ message: "Không có quyền sử dụng category này" });
    }

    // Dùng dữ liệu cũ nếu không truyền mới
    name = name || oldData.name;
    image = image || oldData.image;
    category_id = category_id || oldData.category_id;
    description = description || oldData.description;
    price = price || oldData.price;
    //price = price !== undefined ? price : oldData.price;
    is_available =
      is_available !== undefined ? is_available : oldData.is_available;

    // Check no change
    const noChange =
      name === oldData.name &&
      image === oldData.image &&
      category_id === oldData.category_id &&
      description === oldData.description &&
      price === oldData.price &&
      is_available === oldData.is_available &&
      stock_quantity === oldData.stock_quantity;

    if (noChange) {
      return res
        .status(400)
        .json({ message: "Không có thông tin nào được thay đổi" });
    }

    // Update DB
    // Insert DB
    await db.query(
      `UPDATE menu_items
    SET name=?, image=?, category_id=?, description=?, price=?, stock_quantity=?, is_available=? 
    WHERE item_id=?`,
      [
        name,
        image,
        category_id,
        description,
        price,
        stock_quantity,
        is_available,
        id,
      ]
    );

    return res.json({ message: "Cập nhật món ăn thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÓA MÓN ĂN =================
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM menu_items WHERE item_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy món ăn" });

    const item = rows[0];

    // Staff chỉ được xóa món ăn thuộc chi nhánh mình
    if (req.user.role === "STAFF" && item.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "Không có quyền xóa món ăn của chi nhánh khác" });
    }

    await db.query("DELETE FROM menu_items WHERE item_id = ?", [id]);
    return res.json({ message: "Xóa món ăn thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
