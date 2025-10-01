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

    // Lấy orders thuộc branch của staff với các status được yêu cầu
    const [orders] = await db.query(
      `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone, b.name AS branch_name, b.address AS branch_address
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       JOIN branches b ON o.branch_id = b.branch_id
       WHERE o.branch_id = ? AND o.status IN (?)
       ORDER BY o.created_at DESC`,
      [staffBranchId, statuses]
    );

    return res.json({ orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// PATCH single order status (validate transitions)
export const updateOrderStatus = async (req, res) => {
  try {
    if (!ensureStaff(req, res)) return;
    const staffBranchId = req.user.branch_id;
    const { orderId } = req.params;
    const { newStatus } = req.body; // PREPARING or COMPLETED

    // Lấy order
    const [rows] = await db.query(`SELECT * FROM orders WHERE order_id = ?`, [
      orderId,
    ]);
    if (rows.length === 0) return res.status(404).json({ message: "Order không tồn tại" });
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
    if (!allowedTransitions[current] || !allowedTransitions[current].includes(newStatus)) {
      return res.status(400).json({ message: `Không hợp lệ: ${current} → ${newStatus}` });
    }

    // Update
    await db.query(`UPDATE orders SET status = ? WHERE order_id = ?`, [newStatus, orderId]);

    // Trả về order cập nhật (nếu cần, lấy lại)
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

// PATCH bulk update (body: { orderIds: [1,2,3], newStatus: "PREPARING" })
export const bulkUpdateOrderStatus = async (req, res) => {
  try {
    if (!ensureStaff(req, res)) return;
    const staffBranchId = req.user.branch_id;
    const { orderIds, newStatus } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "orderIds required" });
    }

    // Lấy orders thuộc branch staff AND id in (orderIds)
    const [orders] = await db.query(
      `SELECT order_id, status, branch_id FROM orders WHERE order_id IN (?)`,
      [orderIds]
    );

    // Kiểm tra branch id và transitions
    const allowedTransitions = {
      PENDING: ["PREPARING"],
      PAID: ["PREPARING"],
      PREPARING: ["COMPLETED"],
    };

    const toUpdate = [];
    for (const o of orders) {
      if (o.branch_id !== staffBranchId) continue; // bỏ qua orders không thuộc branch
      const cur = o.status;
      if (allowedTransitions[cur] && allowedTransitions[cur].includes(newStatus)) {
        toUpdate.push(o.order_id);
      }
    }

    if (toUpdate.length === 0) {
      return res.status(400).json({ message: "Không có order hợp lệ để cập nhật" });
    }

    // Update bằng single query
    await db.query(`UPDATE orders SET status = ? WHERE order_id IN (?)`, [newStatus, toUpdate]);

    return res.json({ message: "Cập nhật bulk thành công", updatedCount: toUpdate.length, updatedIds: toUpdate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
