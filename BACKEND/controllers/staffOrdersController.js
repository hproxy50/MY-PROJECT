// controllers/staffOrdersController.js
import db from "../config/db.js";

// helper: kiểm tra staff và branch
const ensureStaff = (req, res) => {
  if (!req.user || req.user.role !== "STAFF") {
    res.status(403).json({ message: "Chỉ staff được phép" });
    return false;
  }
  return true;
};

// GET /staff/orders?status=PENDING,PAID (status query có thể là comma separated)
export const getOrdersForStaff = async (req, res) => {
  try {
    if (!ensureStaff(req, res)) return;
    const staffBranchId = req.user.branch_id;
    const statusQuery = req.query.status || "PENDING,PAID"; // mặc định
    const statuses = statusQuery.split(",").map((s) => s.trim().toUpperCase());

    // Lấy orders
    const [orders] = await db.query(
      `SELECT o.*, 
              u.name AS customer_name, u.phone AS customer_phone, 
              b.name AS branch_name, b.address AS branch_address
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      JOIN branches b ON o.branch_id = b.branch_id
      WHERE o.branch_id = ? AND o.status IN (?)
      ORDER BY o.created_at DESC`,
      [staffBranchId, statuses]
    );

    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    // Lấy items cho toàn bộ order_id
    const orderIds = orders.map((o) => o.order_id);
    const [items] = await db.query(
      `SELECT oi.order_id, oi.item_id, oi.quantity, oi.unit_price,
              m.name, m.image
       FROM order_items oi
       JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );

    // Group items theo order_id
    const itemsByOrder = {};
    for (const it of items) {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push({
        item_id: it.item_id,
        name: it.name,
        image: it.image,
        quantity: it.quantity,
        unit_price: it.unit_price,
      });
    }

    // Gắn items vào orders
    const enriched = orders.map((o) => ({
      ...o,
      items: itemsByOrder[o.order_id] || [],
    }));

    return res.json({ orders: enriched });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// PATCH single order status
export const updateOrderStatus = async (req, res) => {
  try {
    if (!ensureStaff(req, res)) return;
    const staffBranchId = req.user.branch_id;
    const { orderId } = req.params;
    const { newStatus } = req.body;

    const [rows] = await db.query(`SELECT * FROM orders WHERE order_id = ?`, [
      orderId,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Order không tồn tại" });
    const order = rows[0];

    if (order.branch_id !== staffBranchId) {
      return res.status(403).json({ message: "Không có quyền trên order này" });
    }

    const allowedTransitions = {
      PENDING: ["PREPARING"],
      PAID: ["PREPARING"],
      PREPARING: ["COMPLETED"],
    };

    const current = order.status;
    if (
      !allowedTransitions[current] ||
      !allowedTransitions[current].includes(newStatus)
    ) {
      return res
        .status(400)
        .json({ message: `Không hợp lệ: ${current} → ${newStatus}` });
    }

    // Nếu duyệt sang PREPARING => trừ stock
    if (
      (current === "PENDING" || current === "PAID") &&
      newStatus === "PREPARING"
    ) {
      const [items] = await db.query(
        `SELECT item_id, quantity FROM order_items WHERE order_id=?`,
        [orderId]
      );

      for (const it of items) {
        await db.query(
          `UPDATE menu_items 
           SET stock_quantity = GREATEST(stock_quantity - ?, 0) 
           WHERE item_id=?`,
          [it.quantity, it.item_id]
        );
      }
    }

    // Update trạng thái
    await db.query(`UPDATE orders SET status = ? WHERE order_id = ?`, [
      newStatus,
      orderId,
    ]);

    const [updated] = await db.query(
      `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone
       FROM orders o JOIN users u ON o.user_id = u.user_id WHERE o.order_id = ?`,
      [orderId]
    );

    return res.json({ message: "Cập nhật thành công", order: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

export const bulkUpdateOrderStatus = async (req, res) => {
  try {
    if (!ensureStaff(req, res)) return;
    const staffBranchId = req.user.branch_id;
    const { orderIds, newStatus } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "orderIds required" });
    }

    const [orders] = await db.query(
      `SELECT order_id, status, branch_id FROM orders WHERE order_id IN (?)`,
      [orderIds]
    );

    const allowedTransitions = {
      PENDING: ["PREPARING"],
      PAID: ["PREPARING"],
      PREPARING: ["COMPLETED"],
    };

    const toUpdate = [];
    for (const o of orders) {
      if (o.branch_id !== staffBranchId) continue;
      const cur = o.status;
      if (
        allowedTransitions[cur] &&
        allowedTransitions[cur].includes(newStatus)
      ) {
        toUpdate.push(o.order_id);

        // Nếu duyệt sang PREPARING => trừ stock từng order
        if (
          (cur === "PENDING" || cur === "PAID") &&
          newStatus === "PREPARING"
        ) {
          const [items] = await db.query(
            `SELECT item_id, quantity FROM order_items WHERE order_id=?`,
            [o.order_id]
          );

          for (const it of items) {
            await db.query(
              `UPDATE menu_items 
               SET stock_quantity = GREATEST(stock_quantity - ?, 0) 
               WHERE item_id=?`,
              [it.quantity, it.item_id]
            );
          }
        }
      }
    }

    if (toUpdate.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có order hợp lệ để cập nhật" });
    }

    await db.query(`UPDATE orders SET status = ? WHERE order_id IN (?)`, [
      newStatus,
      toUpdate,
    ]);

    return res.json({
      message: "Cập nhật bulk thành công",
      updatedCount: toUpdate.length,
      updatedIds: toUpdate,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
