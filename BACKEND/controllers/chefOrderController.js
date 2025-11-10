// controllers/chefOrderController.js
import db from "../config/db.js";

/**
 * Middleware/Helper: kiểm tra role CHEF
 */
const ensureChef = (req, res) => {
  if (!req.user || req.user.role !== "CHEF") {
    return res.status(403).json({ message: "Chỉ CHEF mới được truy cập" });
  }
  if (!req.user.branch_id) {
    return res.status(400).json({ message: "Đầu bếp chưa gán branch_id" });
  }
  return null;
};

/**
 * GET /chef/orders/preparing
 * Lấy danh sách đơn PREPARING cho branch của đầu bếp
 */
export const getPreparingOrdersForChef = async (req, res) => {
  try {
    const err = ensureChef(req, res);
    if (err) return;

    const branchId = req.user.branch_id;

    // Lấy danh sách đơn PREPARING
    const [orders] = await db.query(
      `SELECT o.order_id, o.scheduled_time, o.created_at
       FROM orders o
       WHERE o.branch_id = ? AND o.status = 'PREPARING'
       ORDER BY o.created_at ASC`,
      [branchId]
    );

    if (!orders || orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.order_id);

    // Lấy thông tin món ăn của các đơn
    const [items] = await db.query(
      `SELECT oi.order_id, m.name AS item_name, m.image AS item_image,
              oi.quantity, oi.option_summary, oi.options
       FROM order_items oi
       LEFT JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );

    // Gom món ăn theo từng order
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

    // Tạo kết quả trả về
    const result = orders.map((o) => ({
      order_id: o.order_id,
      scheduled_time: o.scheduled_time,
      created_at: o.created_at,
      items: itemsByOrder[o.order_id] || [],
    }));

    return res.json({ orders: result });
  } catch (error) {
    console.error("getPreparingOrdersForChef error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * PATCH /chef/orders/approve
 * Duyệt đơn từ PREPARING → DELIVERY
 * Body: { order_ids: [1, 2, 3] }
 */
export const approveOrdersForChef = async (req, res) => {
  try {
    const err = ensureChef(req, res);
    if (err) return;

    const branchId = req.user.branch_id;
    let orderIds = [];

    if (req.body.order_ids && Array.isArray(req.body.order_ids)) {
      orderIds = req.body.order_ids.map((id) => Number(id)).filter(Number.isInteger);
    } else if (req.body.order_id) {
      const id = Number(req.body.order_id);
      if (Number.isInteger(id)) orderIds = [id];
    }

    if (!orderIds.length) {
      return res.status(400).json({ message: "Vui lòng cung cấp order_id hoặc order_ids hợp lệ" });
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
      message: "Chuyển đơn sang DELIVERY thành công",
      requested: orderIds.length,
      updated_count: affected,
      updated_ids: updatedIds,
    });
  } catch (error) {
    console.error("approveOrdersForChef error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
