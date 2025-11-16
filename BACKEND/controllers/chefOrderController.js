import db from "../config/db.js";

const ensureChef = (req, res) => {
  if (!req.user || req.user.role !== "CHEF") {
    return res.status(403).json({ message: "Only CHEF has access" });
  }
  if (!req.user.branch_id) {
    return res.status(400).json({ message: "Chef has not assigned branch_id" });
  }
  return null;
};

export const getPreparingOrdersForChef = async (req, res) => {
  try {
    const err = ensureChef(req, res);
    if (err) return;

    const branchId = req.user.branch_id;

    const [orders] = await db.query(
      `SELECT o.order_id, o.scheduled_time, o.created_at, o.order_type, o.message
       FROM orders o
       WHERE o.branch_id = ? AND o.status = 'PREPARING'
       ORDER BY o.created_at ASC`,
      [branchId]
    );

    if (!orders || orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.order_id);

    const [items] = await db.query(
      `SELECT oi.order_id, m.name AS item_name, m.image AS item_image,
              oi.quantity, oi.option_summary, oi.options
       FROM order_items oi
       LEFT JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );

    const itemsByOrder = {};
    for (const it of items) {
      let parsedOptions = null;
      try {
        parsedOptions = it.options ? JSON.parse(it.options) : null;
      } catch (e) {
        parsedOptions = null;
      }

      const itemObj = {
        name: it.item_name,
        image: it.item_image,
        quantity: it.quantity,
        option_summary: it.option_summary,
        options: parsedOptions,
      };
      itemsByOrder[it.order_id] = itemsByOrder[it.order_id] || [];
      itemsByOrder[it.order_id].push(itemObj);
    }

    const result = orders.map((o) => ({
      order_id: o.order_id,
      scheduled_time: o.scheduled_time,
      created_at: o.created_at,
      order_type: o.order_type,
      message: o.message,
      items: itemsByOrder[o.order_id] || [],
    }));

    return res.json({ orders: result });
  } catch (error) {
    console.error("getPreparingOrdersForChef error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const approveOrdersForChef = async (req, res) => {
  try {
    const err = ensureChef(req, res);
    if (err) return;

    const branchId = req.user.branch_id;
    let orderIds = [];

    if (req.body.order_ids && Array.isArray(req.body.order_ids)) {
      orderIds = req.body.order_ids
        .map((id) => Number(id))
        .filter(Number.isInteger);
    } else if (req.body.order_id) {
      const id = Number(req.body.order_id);
      if (Number.isInteger(id)) orderIds = [id];
    }

    if (!orderIds.length) {
      return res
        .status(400)
        .json({ message: "Please provide a valid order_id or order_ids" });
    }

    const [updateResult] = await db.query(
      `UPDATE orders
       SET status = 'DELIVERY'
       WHERE order_id IN (?) AND branch_id = ? AND status = 'PREPARING'`,
      [orderIds, branchId]
    );

    const affected = updateResult.affectedRows ?? 0;

    const [updatedOrders] = await db.query(
      `SELECT order_id FROM orders WHERE order_id IN (?) AND branch_id = ? AND status = 'DELIVERY'`,
      [orderIds, branchId]
    );

    const updatedIds = updatedOrders.map((r) => r.order_id);

    return res.json({
      message: "Order transferred to DELIVERY successfully",
      requested: orderIds.length,
      updated_count: affected,
      updated_ids: updatedIds,
    });
  } catch (error) {
    console.error("approveOrdersForChef error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const cancelOrdersForChef = async (req, res) => {
  try {
    const err = ensureChef(req, res);
    if (err) return;

    const branchId = req.user.branch_id;
    let orderIds = [];

    if (req.body.order_ids && Array.isArray(req.body.order_ids)) {
      orderIds = req.body.order_ids
        .map((i) => Number(i))
        .filter((n) => Number.isInteger(n));
    } else if (req.body.order_id) {
      const id = Number(req.body.order_id);
      if (Number.isInteger(id)) orderIds = [id];
    }

    if (!orderIds || orderIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid order_id or order_ids" });
    }

    const [updateResult] = await db.query(
      `UPDATE orders
       SET status = 'CANCELED'
       WHERE order_id IN (?) AND branch_id = ? AND status = 'PREPARING'`,
      [orderIds, branchId]
    );

    const affected = updateResult.affectedRows ?? 0;

    return res.json({
      message: "Order canceled successfully (PREPARING -> CANCELED)",
      requested: orderIds.length,
      updated_count: affected,
    });
  } catch (error) {
    console.error("cancelOrdersForChef error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
