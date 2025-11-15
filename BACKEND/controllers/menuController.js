import db from "../config/db.js";
import { upload } from "../middlewares/uploadMiddlewares.js";

export const getMenuItems = async (req, res) => {
  try {
    const branchId =
      req.user.role === "STAFF" ? req.user.branch_id : req.query.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Missing branch_id" });
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
   WHERE mi.branch_id = ? `,
      // AND mi.is_available = 1
      // getMenuItems2
      [branchId]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT item_id, name, image, category_id, description, price, is_available, branch_id, stock_quantity, created_at FROM menu_items WHERE item_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No dishes found" });
    }

    const item = rows[0];

    if (req.user.role === "STAFF" && item.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "No permission to view other branch's dishes" });
    }

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
    return res.status(500).json({ message: "Server error", error });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    let {
      name,
      category_id,
      description,
      price,
      //is_available,
      stock_quantity,
      optionsDef,
    } = req.body;

    if (typeof optionsDef === "string") {
      try {
        optionsDef = JSON.parse(optionsDef);
      } catch (e) {
        return res
          .status(400)
          .json({ message: "optionsDef is not valid JSON" });
      }
    }

    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const branchId =
      req.user.role === "STAFF" ? req.user.branch_id : req.body.branch_id;

    if (!branchId) {
      return res.status(400).json({ message: "Missing branch_id" });
    }

    if (typeof name === "string") name = name.trim();
    if (typeof description === "string") description = description.trim();

    if (!name)
      return res
        .status(400)
        .json({ message: "Dish name cannot be blank" });

    if (!price || isNaN(price))
      return res.status(400).json({ message: "The price of the dish must be a valid number." });

    if (
      stock_quantity !== undefined &&
      stock_quantity !== null &&
      stock_quantity !== ""
    ) {
      stock_quantity = Number(stock_quantity);
      if (isNaN(stock_quantity) || stock_quantity < 0) {
        return res
          .status(400)
          .json({ message: "Quantity must be a number greater than or equal to 0" });
      }
    } else {
      stock_quantity = 0;
    }
    const is_available = stock_quantity > 0 ? 1 : 0;

    const [categoryRows] = await db.query(
      "SELECT * FROM category WHERE category_id = ?",
      [category_id]
    );
    if (categoryRows.length === 0) {
      return res.status(400).json({ message: "Category does not exist" });
    }

    const category = categoryRows[0];
    if (
      req.user.role === "STAFF" &&
      category.branch_id !== req.user.branch_id
    ) {
      return res
        .status(403)
        .json({ message: "No permission to use this category" });
    }

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

    // optionsDef expected: [{ name, selection_type: 'SINGLE'|'MULTI', is_required:0|1, choices: [{name, price_delta}] }, ...]
    if (optionsDef && Array.isArray(optionsDef) && optionsDef.length > 0) {
      for (let gi = 0; gi < optionsDef.length; gi++) {
        const group = optionsDef[gi];
        
        if (!group.name) continue; 
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
      .json({ message: "Add dish successfully", item_id: itemId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

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
      optionsDef,
    } = req.body;

    if (typeof optionsDef === "string" && optionsDef.trim() !== "") {
      try {
        optionsDef = JSON.parse(optionsDef);
      } catch (e) {
        return res
          .status(400)
          .json({ message: "optionsDef is not valid JSON" });
      }
    }

    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const [rows] = await db.query(
      "SELECT * FROM menu_items WHERE item_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "No food found" });
    const oldData = rows[0];

    if (req.user.role === "STAFF" && oldData.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "No right to edit other branch's dishes" });
    }

    
    if (typeof name === "string") name = name.trim();
    if (typeof description === "string") description = description.trim();

    
    if (name !== undefined && name === "") {
      return res
        .status(400)
        .json({ message: "Dish name cannot be blank" });
    }

    if (price !== undefined && isNaN(price)) {
      return res.status(400).json({ message: "The price of the dish must be a valid number" });
    }

    let final_stock = oldData.stock_quantity;
    let final_available = oldData.is_available;

    if (stock_quantity !== undefined) {
      if (stock_quantity === null || stock_quantity === "") {
        final_stock = 0;
      } else {
        final_stock = Number(stock_quantity);
        if (isNaN(final_stock) || final_stock < 0) {
          return res
            .status(400)
            .json({ message: "Quantity must be a number greater than or equal to 0" });
        }
      }
    }

    if (is_available !== undefined) {
      final_available = Number(is_available) === 1 ? 1 : 0;
    }

    if (final_stock <= 0) {
      final_available = 0;
    }

    
    if (category_id !== undefined && category_id !== null) {
      const [categoryRows] = await db.query(
        "SELECT * FROM category WHERE category_id = ?",
        [category_id]
      );
      if (categoryRows.length === 0) {
        return res.status(400).json({ message: "Category does not exist" });
      }
      const category = categoryRows[0];
      if (
        req.user.role === "STAFF" &&
        category.branch_id !== req.user.branch_id
      ) {
        return res
          .status(403)
          .json({ message: "No permission to use this category" });
      }
    }

    
    name = name || oldData.name;
    image = image || oldData.image;
    category_id = category_id || oldData.category_id;
    description = description || oldData.description;
    price = price || oldData.price;
    // is_available = is_available !== undefined ? is_available : oldData.is_available;

    const basicNoChange =
      name === oldData.name &&
      image === oldData.image &&
      category_id === oldData.category_id &&
      description === oldData.description &&
      String(price) === String(oldData.price) &&
      final_available === oldData.is_available &&
      final_stock === oldData.stock_quantity;

    if (basicNoChange && !optionsDef) {
      return res
        .status(400)
        .json({ message: "No information has been changed" });
    }

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
        final_stock,
        final_available,
        id,
      ]
    );

    if (optionsDef && Array.isArray(optionsDef)) {
      try {
        
        await db.query("DELETE FROM item_option_groups WHERE item_id = ?", [
          id,
        ]);

        
        for (let gi = 0; gi < optionsDef.length; gi++) {
          const group = optionsDef[gi];
          
          if (!group || !group.name || !String(group.name).trim()) continue;

          const selType = group.selection_type === "MULTI" ? "MULTI" : "SINGLE";
          const isReq = group.is_required ? 1 : 0;

          const [gRes] = await db.query(
            "INSERT INTO item_option_groups (item_id, name, selection_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?)",
            [id, group.name.trim(), selType, isReq, gi]
          );
          const groupId = gRes.insertId;

          if (group.choices && Array.isArray(group.choices)) {
            for (let ci = 0; ci < group.choices.length; ci++) {
              const choice = group.choices[ci];
              if (!choice || !choice.name || !String(choice.name).trim())
                continue;
              const delta =
                choice.price_delta !== undefined
                  ? Number(choice.price_delta)
                  : 0;
              await db.query(
                "INSERT INTO item_option_choices (group_id, name, price_delta, sort_order) VALUES (?, ?, ?, ?)",
                [groupId, choice.name.trim(), isNaN(delta) ? 0 : delta, ci]
              );
            }
          }
        }
      } catch (err) {
        
        console.error("Error updating options for item", id, err);
        return res.status(500).json({
          message: "Error updating food options",
          error: err.message || err,
        });
      }
    }

    return res.json({ message: "Dish update successful" });
  } catch (error) {
    console.error("updateMenuItem error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM menu_items WHERE item_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "No dishes found" });

    const item = rows[0];

    if (req.user.role === "STAFF" && item.branch_id !== req.user.branch_id) {
      return res
        .status(403)
        .json({ message: "No right to delete other branch's dishes" });
    }

    await db.query("DELETE FROM menu_items WHERE item_id = ?", [id]);
    return res.json({ message: "Deleted dish successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
