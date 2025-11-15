import db from "../config/db.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const { branch_id } = req.body;
    const userId = req.user.user_id;

    if (!branch_id) {
      return res.status(400).json({ message: "Missing branch_id" });
    }

    const [existingOrders] = await db.query(
      `SELECT order_id FROM orders WHERE user_id = ? AND branch_id = ? AND status = 'DRAFT'`,
      [userId, branch_id]
    );

    if (existingOrders.length > 0) {
      return res.status(200).json({
        message: "Already have a DRAFT cart, reuse it",
        order_id: existingOrders[0].order_id,
      });
    }

    const [result] = await db.query(
      `INSERT INTO orders (user_id, branch_id, status, total_price, created_at)
       VALUES (?, ?, 'DRAFT', 0, NOW())`,
      [userId, branch_id]
    );

    return res.status(201).json({
      message: "New cart created successfully",
      order_id: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const addItemToOrder = async (req, res) => {
  try {
    const { order_id, item_id, quantity } = req.body;
    let { selectedOptions } = req.body;

    if (!order_id || !item_id || !quantity) {
      return res
        .status(400)
        .json({ message: "Missing data (order_id, item_id, quantity)" });
    }
    if (Number(quantity) < 1) {
      return res.status(400).json({ message: "Quantity must be >= 1" });
    }

    if (typeof selectedOptions === "string") {
      try {
        selectedOptions = selectedOptions ? JSON.parse(selectedOptions) : [];
      } catch (e) {
        return res
          .status(400)
          .json({ message: "selectedOptions is not valid JSON" });
      }
    }

    const [items] = await db.query(
      "SELECT price, stock_quantity, is_available FROM menu_items WHERE item_id = ?",
      [item_id]
    );
    if (items.length === 0) {
      return res
        .status(404)
        .json({ message: "The dish does not exist or is out of stock." });
    }
    const item = items[0];
    if (Number(item.is_available) !== 1) {
      return res.status(400).json({ message: "This item is currently unavailable." });
    }

    const basePrice = Number(item.price);
    const stock = item.stock_quantity;


    let optionsArray = Array.isArray(selectedOptions)
      ? selectedOptions.slice()
      : [];


    let totalDelta = 0;
    const [groups] = await db.query(
      "SELECT group_id, name AS group_name, selection_type, is_required FROM item_option_groups WHERE item_id = ?",
      [item_id]
    );
    const groupMap = {};
    groups.forEach((g) => {
      groupMap[g.group_id] = g;
    });

    let optionsToStore = [];

    if (optionsArray.length > 0) {
      const choiceIds = optionsArray.map((o) => Number(o.choice_id));
      const [choiceRows] = await db.query(
        `SELECT c.choice_id, c.group_id, c.name AS choice_name, c.price_delta, g.name AS group_name, g.selection_type
         FROM item_option_choices c
         JOIN item_option_groups g ON c.group_id = g.group_id
         WHERE c.choice_id IN (?) AND g.item_id = ?`,
        [choiceIds, item_id]
      );
      const choiceMap = {};
      choiceRows.forEach((r) => {
        choiceMap[Number(r.choice_id)] = r;
      });
      for (const sel of optionsArray) {
        const cid = Number(sel.choice_id);
        const row = choiceMap[cid];
        if (!row) {
          return res.status(400).json({
            message: `Invalid or non-relevant selection: ${cid}`,
          });
        }
        optionsToStore.push({
          group_id: Number(row.group_id),
          group_name: row.group_name,
          choice_id: Number(row.choice_id),
          choice_name: row.choice_name,
          price_delta: Number(row.price_delta || 0),
        });
        totalDelta += Number(row.price_delta || 0);
      }
      const counts = {};
      optionsToStore.forEach((o) => {
        counts[o.group_id] = (counts[o.group_id] || 0) + 1;
      });
      for (const gidStr of Object.keys(counts)) {
        const gid = Number(gidStr);
        const g = groupMap[gid];
        if (!g) {
          return res
            .status(400)
            .json({ message: `The selection group does not exist: ${gid}` });
        }
        if (g.selection_type === "SINGLE" && counts[gid] > 1) {
          return res.status(400).json({
            message: ` "${g.group_name}" only allow 1 choice`,
          });
        }
      }
    }

    for (const g of groups) {
      if (Number(g.is_required) === 1) {
        const found = optionsToStore.some(
          (o) => Number(o.group_id) === Number(g.group_id)
        );
        if (!found) {
          return res.status(400).json({
            message: `Required group options must be selected: ${g.group_name}`,
          });
        }
      }
    }

    if (!Array.isArray(optionsToStore) || optionsToStore.length === 0) {
      optionsToStore = [];
    }

    optionsToStore.sort((a, b) => {
      if (a.group_id !== b.group_id) return a.group_id - b.group_id;
      return a.choice_id - b.choice_id;
    });

    const optionsJson = JSON.stringify(optionsToStore);
    const optionSummary = optionsToStore.map((o) => o.choice_name).join(", ");
    const optionsHash = crypto
      .createHash("md5")
      .update(optionsJson)
      .digest("hex");

    const unitPrice = basePrice + totalDelta;

    const [existing] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ? AND item_id = ? AND COALESCE(options_hash,'') = ?",
      [order_id, item_id, optionsHash]
    );

    if (existing.length > 0) {
      const existingRow = existing[0];
      const newQty = Number(existingRow.quantity) + Number(quantity);
      if (stock !== null && stock !== undefined && newQty > stock) {
        return res.status(400).json({
          message: `Quantity exceeds stock, only ${stock} product left`,
        });
      }
      const newLineTotal = unitPrice * newQty;
      await db.query(
        "UPDATE order_items SET quantity=?, unit_price=?, line_total=?, option_summary=?, options = ?, options_hash = ? WHERE order_item_id=?",
        [
          newQty,
          unitPrice,
          newLineTotal,
          optionSummary,
          optionsJson,
          optionsHash,
          existingRow.order_item_id,
        ]
      );
    } else {
      if (stock !== null && stock !== undefined && Number(quantity) > stock) {
        return res.status(400).json({
          message: `Quantity exceeds stock, only ${stock} product left`,
        });
      }
      const lineTotal = unitPrice * Number(quantity);
      await db.query(
        `INSERT INTO order_items (order_id, item_id, quantity, unit_price, line_total, options, option_summary, options_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          order_id,
          item_id,
          quantity,
          unitPrice,
          lineTotal,
          optionsJson,
          optionSummary,
          optionsHash,
        ]
      );
    }
    await db.query(
      `UPDATE orders 
       SET total_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?),
           promo_id = NULL,
           discount_amount = 0,
           final_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?)
       WHERE order_id = ?`,
      [order_id, order_id, order_id]
    );

    return res.json({ message: "Add item to cart successfully" });
  } catch (error) {
    console.error("addItemToOrder error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query("SELECT * FROM orders WHERE order_id = ?", [
      id,
    ]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }
    const order = orders[0];
    const [items] = await db.query(
      `SELECT oi.order_item_id, oi.item_id, m.name, m.image, m.description, oi.quantity, oi.unit_price, oi.line_total, oi.options, oi.option_summary
       FROM order_items oi
       JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id = ?`,
      [id]
    );
    items.forEach((it) => {
      try {
        it.options = it.options ? JSON.parse(it.options) : [];
      } catch (e) {
        it.options = [];
      }
    });

    return res.json({ ...order, items });
  } catch (error) {
    console.error("getOrderById error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updateOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be >= 1" });
    }
    const [rows] = await db.query(
      "SELECT * FROM order_items WHERE order_item_id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Order_item not found" });
    }
    const orderItem = rows[0];

    const [items] = await db.query(
      "SELECT stock_quantity FROM menu_items WHERE item_id = ?",
      [orderItem.item_id]
    );
    if (items.length === 0) {
      return res.status(404).json({ message: "The dish does not exist." });
    }
    const stock = items[0].stock_quantity;

    if (quantity > stock) {
      return res.status(400).json({
        message: `Quantity exceeds inventory. Only ${stock} of product left`,
      });
    }

    const newLineTotal = orderItem.unit_price * quantity;

    await db.query(
      "UPDATE order_items SET quantity=?, line_total=? WHERE order_item_id=?",
      [quantity, newLineTotal, id]
    );

    await db.query(
      `UPDATE orders 
   SET total_price = (SELECT SUM(line_total) FROM order_items WHERE order_id = ?),
       promo_id = NULL,
       discount_amount = 0,
       final_price = (SELECT SUM(line_total) FROM order_items WHERE order_id = ?)
   WHERE order_id = ?`,
      [orderItem.order_id, orderItem.order_id, orderItem.order_id]
    );

    return res.json({ message: "Update item successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const deleteOrderItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM order_items WHERE order_item_id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Order_item not found" });
    }
    const orderItem = rows[0];

    await db.query("DELETE FROM order_items WHERE order_item_id=?", [id]);

    await db.query(
      `UPDATE orders 
   SET total_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?),
       promo_id = NULL,
       discount_amount = 0,
       final_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?)
   WHERE order_id = ?`,
      [orderItem.order_id, orderItem.order_id, orderItem.order_id]
    );

    return res.json({ message: "Item removed from cart successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
