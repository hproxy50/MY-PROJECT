// shipperOrdersController.js
import db from "../config/db.js";

/**
 * Middleware/Helper: kiểm tra role SHIPPER
 */
const ensureShipper = (req, res) => {
  if (!req.user || req.user.role !== "SHIPPER") {
    return res.status(403).json({ message: "Chỉ SHIPPER mới được truy cập" });
  }
  if (!req.user.branch_id) {
    return res.status(400).json({ message: "Nhân viên giao hàng chưa gán branch_id" });
  }
  return null;
};

/**
 * GET /shipper/orders/delivery
 * Lấy danh sách đơn đang giao (DELIVERY) cho chi nhánh của shipper
 */
export const getDeliveryOrdersForShipper = async (req, res) => {
  try {
    const err = ensureShipper(req, res);
    if (err) return;

    const branchId = req.user.branch_id;

    const [orders] = await db.query(
      `SELECT o.order_id, o.customer_name, o.customer_phone, o.order_type,
              o.delivery_address, o.scheduled_time, o.message,
              o.total_price, o.final_price, o.created_at
       FROM orders o
       WHERE o.branch_id = ? AND o.status = 'DELIVERY'
       ORDER BY o.created_at ASC`,
      [branchId]
    );

    if (!orders || orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.order_id);

    const [items] = await db.query(
      `SELECT oi.order_item_id, oi.order_id, oi.item_id, m.name AS item_name,
              m.image AS item_image, oi.quantity, oi.option_summary, oi.options
       FROM order_items oi
       LEFT JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id IN (?)
       ORDER BY oi.order_item_id ASC`,
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
        order_item_id: it.order_item_id,
        item_id: it.item_id,
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
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      order_type: o.order_type, // DELIVERY hoặc DINE_IN (nhận tại cửa hàng)
      delivery_address: o.order_type === "DELIVERY" ? o.delivery_address : null,
      scheduled_time: o.scheduled_time,
      message: o.message,
      total_price: Number(o.total_price),
      final_price: o.final_price !== null ? Number(o.final_price) : Number(o.total_price),
      created_at: o.created_at,
      items: itemsByOrder[o.order_id] || [],
    }));

    return res.json({ orders: result });
  } catch (error) {
    console.error("getDeliveryOrdersForShipper error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * GET /shipper/orders/:id
 * Lấy chi tiết 1 đơn DELIVERY cụ thể
 */
export const getDeliveryOrderDetails = async (req, res) => {
  try {
    const err = ensureShipper(req, res);
    if (err) return;

    const branchId = req.user.branch_id;
    const orderId = Number(req.params.id);

    const [orders] = await db.query(
      `SELECT o.*
       FROM orders o
       WHERE o.order_id = ? AND o.branch_id = ? AND o.status = 'DELIVERY'`,
      [orderId, branchId]
    );

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn DELIVERY thuộc chi nhánh của bạn" });
    }

    const order = orders[0];

    const [items] = await db.query(
      `SELECT oi.order_item_id, oi.order_id, oi.item_id, m.name AS item_name, m.image AS item_image,
              oi.quantity, oi.option_summary, oi.options
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
        option_summary: it.option_summary,
        options: parsedOptions,
      };
    });

    const resp = {
      order_id: order.order_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      order_type: order.order_type,
      delivery_address: order.order_type === "DELIVERY" ? order.delivery_address : null,
      scheduled_time: order.scheduled_time,
      message: order.message || null,
      total_price: Number(order.total_price),
      final_price: order.final_price !== null ? Number(order.final_price) : Number(order.total_price),
      created_at: order.created_at,
      items: parsedItems,
    };

    return res.json(resp);
  } catch (error) {
    console.error("getDeliveryOrderDetails error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * POST /shipper/orders/complete
 * Body: { order_ids: [1,2,3] } hoặc { order_id: 1 }
 * Cập nhật trạng thái từ DELIVERY -> COMPLETED
 */
export const completeOrders = async (req, res) => {
  try {
    const err = ensureShipper(req, res);
    if (err) return;

    const branchId = req.user.branch_id;
    let orderIds = [];

    if (req.body.order_ids && Array.isArray(req.body.order_ids)) {
      orderIds = req.body.order_ids.map((i) => Number(i)).filter((n) => Number.isInteger(n));
    } else if (req.body.order_id) {
      const id = Number(req.body.order_id);
      if (Number.isInteger(id)) orderIds = [id];
    }

    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng cung cấp order_id hoặc order_ids hợp lệ" });
    }

    const [updateResult] = await db.query(
      `UPDATE orders
       SET status = 'COMPLETED'
       WHERE order_id IN (?) AND branch_id = ? AND status = 'DELIVERY'`,
      [orderIds, branchId]
    );

    const affected = updateResult.affectedRows ?? 0;

    const [updatedOrders] = await db.query(
      `SELECT order_id FROM orders WHERE order_id IN (?) AND branch_id = ? AND status = 'COMPLETED'`,
      [orderIds, branchId]
    );

    const updatedIds = updatedOrders.map((r) => r.order_id);

    return res.json({
      message: "Cập nhật đơn hàng thành công (DELIVERY → COMPLETED)",
      requested: orderIds.length,
      updated_count: affected,
      updated_ids: updatedIds,
    });
  } catch (error) {
    console.error("completeOrders error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
