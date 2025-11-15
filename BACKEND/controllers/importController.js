import db from "../config/db.js";

export const createImport = async (req, res) => {
  try {
    const staffId = req.user.user_id;
    const { note } = req.body;

    const [staff] = await db.query(
      "SELECT branch_id FROM users WHERE user_id=? AND role='STAFF'",
      [staffId]
    );
    if (staff.length === 0) {
      return res.status(403).json({ message: "Not a valid employee" });
    }
    const branchId = staff[0].branch_id;

    const [result] = await db.query(
      `INSERT INTO imports (branch_id, staff_id, status, note, created_at)
       VALUES (?, ?, 'PENDING', ?, NOW())`,
      [branchId, staffId, note || null]
    );

    return res.status(201).json({
      message: "New import form created successfully",
      import_id: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const addItemToImport = async (req, res) => {
  const { import_id, items } = req.body;

  if (!import_id || !items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({
        message: "Invalid data. Expected import_id and an array of 'items'",
      });
  }

  const [imports] = await db.query(
    "SELECT * FROM imports WHERE import_id=? AND status='PENDING'",
    [import_id]
  );
  if (imports.length === 0) {
    return res
      .status(404)
      .json({ message: "The entry form does not exist or has been completed." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const values = [];
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!item.item_id || isNaN(qty) || qty < 1) {
        throw new Error(
          `Product (ID: ${item.item_id}) has invalid quantity: ${item.quantity}`
        );
      }
      values.push([import_id, item.item_id, qty]);
    }

    await connection.query(
      "INSERT INTO import_items (import_id, item_id, quantity) VALUES ?",
      [values]
    );

    await connection.commit();
    return res.json({ message: "Batch add to entry form successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error when adding batch to ticket:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    connection.release();
  }
};

export const getImportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [imports] = await db.query(
      "SELECT * FROM imports WHERE import_id=?",
      [id]
    );
    if (imports.length === 0) {
      return res.status(404).json({ message: "No entry form found" });
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
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updateImportItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be >= 1" });
    }

    const [rows] = await db.query(
      "SELECT * FROM import_items WHERE import_item_id=?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Import_item not found" });
    }

    await db.query(
      "UPDATE import_items SET quantity=? WHERE import_item_id=?",
      [quantity, id]
    );

    return res.json({ message: "Quantity update successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const deleteImportItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM import_items WHERE import_item_id=?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Import_item not found" });
    }

    await db.query("DELETE FROM import_items WHERE import_item_id=?", [id]);

    return res.json({ message: "Delete row from import receipt successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const completeImport = async (req, res) => {
  try {
    const { id } = req.params;

    const [imports] = await db.query(
      "SELECT * FROM imports WHERE import_id=? AND status='PENDING'",
      [id]
    );
    if (imports.length === 0) {
      return res
        .status(404)
        .json({ message: "The entry form does not exist or has been completed." });
    }
    const [items] = await db.query(
      "SELECT * FROM import_items WHERE import_id=?",
      [id]
    );

    for (const item of items) {
      await db.query(
        `UPDATE menu_items
         SET
           stock_quantity = stock_quantity + ?,
           is_available = CASE
             WHEN (stock_quantity + ?) > 0 THEN 1
             ELSE 0
           END
         WHERE item_id = ?`,
        [item.quantity, item.quantity, item.item_id]
      );
    }

    await db.query("UPDATE imports SET status='COMPLETE' WHERE import_id=?", [
      id,
    ]);

    return res.json({
      message: "Completed import form, stock added successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
