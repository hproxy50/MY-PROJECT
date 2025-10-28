// staffOrdersController.js
import db from "../config/db.js";

/**
 * Middleware/Helper: kiểm tra role STAFF
 */
const ensureStaff = (req, res) => {
  if (!req.user || req.user.role !== "STAFF") {
    return res.status(403).json({ message: "Chỉ STAFF mới được truy cập" });
  }
  if (!req.user.branch_id) {
    return res.status(400).json({ message: "Nhân viên chưa gán branch_id" });
  }
  return null;
};

/**
 * GET /staff/orders/pending
 * Lấy danh sách đơn PENDING cho branch của nhân viên
 */
export const getPendingOrdersForStaff = async (req, res) => {
  try {
    const err = ensureStaff(req, res);
    if (err) return; // ensureStaff đã trả response

    const branchId = req.user.branch_id;

    const [orders] = await db.query(
      `SELECT o.order_id, o.user_id, o.branch_id, o.status, o.total_price, o.final_price,
              o.customer_name, o.customer_phone, o.order_type, o.scheduled_time, o.delivery_address, o.created_at
       FROM orders o
       WHERE o.branch_id = ? AND o.status = 'PENDING'
       ORDER BY o.created_at ASC`,
      [branchId]
    );

    if (!orders || orders.length === 0) {
      return res.json({ orders: [] });
    }

    // Lấy tất cả order_item cho các order này
    const orderIds = orders.map((o) => o.order_id);
    const [items] = await db.query(
      `SELECT oi.order_item_id, oi.order_id, oi.item_id, m.name AS item_name, m.image AS item_image,
              oi.quantity, oi.unit_price, oi.line_total, oi.option_summary, oi.options
       FROM order_items oi
       LEFT JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id IN (?)
       ORDER BY oi.order_item_id ASC`,
      [orderIds]
    );

    // Gom items theo order
    const itemsByOrder = {};
    for (const it of items) {
      const parsedOptions = (() => {
        try {
          return it.options ? JSON.parse(it.options) : null;
        } catch (e) {
          return null;
        }
      })();

      const itemObj = {
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
      itemsByOrder[it.order_id] = itemsByOrder[it.order_id] || [];
      itemsByOrder[it.order_id].push(itemObj);
    }

    // Build response orders with items
    const result = orders.map((o) => ({
      order_id: o.order_id,
      user_id: o.user_id,
      total_price: Number(o.total_price),
      final_price: o.final_price !== null ? Number(o.final_price) : Number(o.total_price),
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      order_type: o.order_type, // 'DINE_IN' | 'DELIVERY'
      scheduled_time: o.scheduled_time,
      delivery_address: o.order_type === "DELIVERY" ? o.delivery_address : null,
      created_at: o.created_at,
      items: itemsByOrder[o.order_id] || [],
    }));

    return res.json({ orders: result });
  } catch (error) {
    console.error("getPendingOrdersForStaff error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * GET /staff/orders/:id
 * Lấy chi tiết 1 order pending (kiểm tra branch + status)
 */
export const getPendingOrderDetails = async (req, res) => {
  try {
    const err = ensureStaff(req, res);
    if (err) return;

    const branchId = req.user.branch_id;
    const orderId = Number(req.params.id);

    // Lấy order và xác thực
    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.phone AS user_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ? AND o.branch_id = ? AND o.status = 'PENDING'`,
      [orderId, branchId]
    );
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy order PENDING thuộc chi nhánh của bạn" });
    }
    const order = orders[0];

    // Lấy items
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
      delivery_address: order.order_type === "DELIVERY" ? order.delivery_address : null,
      total_price: Number(order.total_price),
      final_price: order.final_price !== null ? Number(order.final_price) : Number(order.total_price),
      created_at: order.created_at,
      items: parsedItems,
      message: order.message || null,
    };

    return res.json(resp);
  } catch (error) {
    console.error("getPendingOrderDetails error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * POST /staff/orders/approve
 * Body: { order_ids: [1,2,3] } (hoặc { order_id: 1 } )
 * Chuyển trạng thái từ PENDING -> PREPARING cho tất cả order thuộc branch của staff.
 */
export const approveOrders = async (req, res) => {
  try {
    const err = ensureStaff(req, res);
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
      return res.status(400).json({ message: "Vui lòng cung cấp order_id hoặc order_ids (mảng) hợp lệ" });
    }

    // Cập nhật: chỉ update các order thuộc branch và status = 'PENDING'
    const [updateResult] = await db.query(
      `UPDATE orders
       SET status = 'PREPARING'
       WHERE order_id IN (?) AND branch_id = ? AND status = 'PENDING'`,
      [orderIds, branchId]
    );

    // updateResult.affectedRows hoặc changedRows tùy driver; dùng affectedRows
    const affected = updateResult.affectedRows ?? updateResult.affected_rows ?? 0;

    // Lấy danh sách order_id đã được chuyển thành preparing để trả về (optional)
    const [updatedOrders] = await db.query(
      `SELECT order_id FROM orders WHERE order_id IN (?) AND branch_id = ? AND status = 'PREPARING'`,
      [orderIds, branchId]
    );

    const updatedIds = updatedOrders.map((r) => r.order_id);

    return res.json({
      message: `Duyệt đơn thành công`,
      requested: orderIds.length,
      updated_count: affected,
      updated_ids: updatedIds,
    });
  } catch (error) {
    console.error("approveOrders error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
