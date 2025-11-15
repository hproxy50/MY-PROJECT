import db from "../config/db.js";

export const getCategory = async (req, res) => {
  try {
    const branchId =
      req.user.role === "STAFF" ? req.user.branch_id : req.query.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Missing branch_id" });
    }

    const [rows] = await db.query(
      "SELECT category_id, branch_id, food_type FROM category WHERE branch_id = ?",
      [branchId]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const getCategoryId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT category_id, branch_id, food_type FROM category WHERE category_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const category = rows[0];

    if (req.user.role === "STAFF" && category.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "No permission to view other branch categories" });
    }

    return res.json(category);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const createCategory = async (req, res) => {
  try {
    let { food_type } = req.body;

    const branchId =
      req.user.role === "STAFF" ? req.user.branch_id : req.body.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Missing branch_id" });
    }

    if (typeof food_type === "string") food_type = food_type.trim();

    if (!food_type)
      return res
        .status(400)
        .json({ message: "Category name cannot be blank" });

    await db.query(
      "INSERT INTO category (branch_id, food_type) VALUES (?, ?)",
      [branchId, food_type]
    );

    return res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let { food_type } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM category WHERE category_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Category not found" });
    const oldData = rows[0];

    if (req.user.role === "STAFF" && oldData.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "No right to edit category of other branch" });
    }

    if (typeof food_type === "string") food_type = food_type.trim();

    if (food_type !== undefined && food_type === "") {
      return res
        .status(400)
        .json({ message: "Category name cannot be blank" });
    }

    food_type = food_type || oldData.name;

    const noChange =
      food_type === oldData.food_type;

    if (noChange) {
      return res
        .status(400)
        .json({ message: "No information has been changed" });
    }

    await db.query(
      "UPDATE category SET food_type=? WHERE category_id=?",
      [food_type, id]
    );

    return res.json({ message: "Category updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM category WHERE category_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Category not found" });

    const item = rows[0];

    if (req.user.role === "STAFF" && item.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "No right to delete category of other branch" });
    }

    await db.query("DELETE FROM category WHERE category_id = ?", [id]);
    return res.json({ message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
