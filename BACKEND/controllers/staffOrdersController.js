// staffOrdersController.js
import db from "../config/db.js";

const ensureStaff = (req, res) => {
  if (!req.user || req.user.role !== "STAFF") {
    return res.status(403).json({ message: "Only staff access" });
  }
  if (!req.user.branch_id) {
    return res.status(400).json({ message: "Employee has not assigned branch_id" });
  }
  return null;
};


export const getPendingOrdersForStaff = async (req, res) => {
  try {
    const err = ensureStaff(req, res);
    if (err) return;

    const branchId = req.user.branch_id;

    const [orders] = await db.query(
      `SELECT o.order_id, o.user_id, o.branch_id, o.status, o.total_price, o.final_price, o.message,
              o.customer_name, o.customer_phone, o.order_type, o.scheduled_time, o.delivery_address, o.created_at
       FROM orders o
       WHERE o.branch_id = ? AND o.status = 'PENDING' AND o.payment_method = 'CASH'
       ORDER BY o.created_at ASC`,
      [branchId]
    );

    if (!orders || orders.length === 0) {
      return res.json({ orders: [] });
    }

    const result = orders.map((o) => ({
      order_id: o.order_id,
      user_id: o.user_id,
      total_price: Number(o.total_price),
      final_price:
        o.final_price !== null ? Number(o.final_price) : Number(o.total_price),
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      order_type: o.order_type,
      scheduled_time: o.scheduled_time,
      delivery_address: o.order_type === "DELIVERY" ? o.delivery_address : null,
      message: o.message,
      created_at: o.created_at,
    }));

    return res.json({ orders: result });
  } catch (error) {
    console.error("getPendingOrdersForStaff error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const getPendingOrderDetails = async (req, res) => {
  try {
    const err = ensureStaff(req, res);
    if (err) return;

    const branchId = req.user.branch_id;
    const orderId = Number(req.params.id);

    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.phone AS user_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ? AND o.branch_id = ? AND o.status = 'PENDING'`, 
      [orderId, branchId]
    );
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        message: "No PENDING orders found for your branch",
      });
    }
    const order = orders[0];

    const [items] = await db.query(
      `SELECT oi.order_item_id, oi.order_id, oi.item_id, m.name AS item_name, m.image AS item_image,
              oi.quantity, oi.unit_price, oi.line_total, oi.option_summary, oi.options
       FROM order_items oi
       LEFT JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id = ?
       ORDER BY oi.order_item_id ASC`,
      [orderId]
    );

    const parsedItems = items.map((it) => {
      let parsedOptions = null;
      try {
        parsedOptions = it.options ? JSON.parse(it.options) : null;
      } catch (e) {
        parsedOptions = null;
      }
      return {
        order_item_id: it.order_item_id,
        item_id: it.item_id,
        name: it.item_name,
        image: it.item_image,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        line_total: Number(it.line_total),
        option_summary: it.option_summary,
        options: parsedOptions,
      };
    });

    const resp = {
      order_id: order.order_id,
      user_id: order.user_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      order_type: order.order_type,
      scheduled_time: order.scheduled_time,
      delivery_address:
        order.order_type === "DELIVERY" ? order.delivery_address : null,
      total_price: Number(order.total_price),
      final_price:
        order.final_price !== null
          ? Number(order.final_price)
          : Number(order.total_price),
      created_at: order.created_at,
      items: parsedItems,
      message: order.message || null,
    };

    return res.json(resp);
  } catch (error) {
    console.error("getPendingOrderDetails error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};


export const approveOrders = async (req, res) => {
  const err = ensureStaff(req, res);
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
    return res.status(400).json({
      message: "Please provide a valid order_id or order_ids",
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [itemsToUpdate] = await connection.query(
      `SELECT
          oi.item_id,
          SUM(oi.quantity) AS total_quantity_needed,
          mi.name AS item_name,
          mi.stock_quantity AS current_stock
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN menu_items mi ON oi.item_id = mi.item_id
      WHERE o.order_id IN (?)
        AND o.branch_id = ?
        AND o.status = 'PENDING'
        AND o.payment_method = 'CASH'
       GROUP BY oi.item_id, mi.name, mi.stock_quantity`,
      [orderIds, branchId]
    );

    const insufficientStockItems = [];
    for (const item of itemsToUpdate) {
      if (item.current_stock < item.total_quantity_needed) {
        insufficientStockItems.push({
          name: item.item_name,
          item_id: item.item_id,
          needed: item.total_quantity_needed,
          available: item.current_stock,
        });
      }
    }

    if (insufficientStockItems.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "Insufficient inventory to process order",
        insufficient_items: insufficientStockItems,
      });
    }

    for (const item of itemsToUpdate) {
      await connection.query(
        `UPDATE menu_items
         SET stock_quantity = stock_quantity - ?
         WHERE item_id = ?`,
        [item.total_quantity_needed, item.item_id]
      );
    }

    const itemIdsToCheck = itemsToUpdate.map((i) => i.item_id);
    if (itemIdsToCheck.length > 0) {
      await connection.query(
        `UPDATE menu_items
         SET is_available = 0
         WHERE item_id IN (?) AND stock_quantity <= 0`, 
        [itemIdsToCheck]
      );
    }

    const [updateOrdersResult] = await connection.query(
      `UPDATE orders
       SET status = 'PREPARING'
       WHERE order_id IN (?) AND branch_id = ? AND status = 'PENDING'`,
      [orderIds, branchId]
    );

    const affectedOrders = updateOrdersResult.affectedRows ?? 0;

    await connection.commit();

    return res.json({
      message: `Order approved and warehouse deducted successfully`,
      requested: orderIds.length,
      updated_count: affectedOrders,
    });
  } catch (error) {
    await connection.rollback();
    console.error("approveOrders error:", error);
    return res.status(500).json({ message: "Server error when approving order", error });
  } finally {
    connection.release();
  }
};



export const cancelOrders = async (req, res) => {
  try {
    const err = ensureStaff(req, res);
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
      return res.status(400).json({
        message: "Please provide a valid order_id or order_ids",
      });
    }

    const [updateResult] = await db.query(
      `UPDATE orders
      SET status = 'CANCELED'
      WHERE order_id IN (?) AND branch_id = ? AND status = 'PENDING'`,
      [orderIds, branchId]
    );

    const affected = updateResult.affectedRows ?? 0;

    return res.json({
      message: `Cancel order successful`,
      requested: orderIds.length,
      updated_count: affected,
    });
  } catch (error) {
    console.error("cancelOrders error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
