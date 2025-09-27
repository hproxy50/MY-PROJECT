import db from "../config/db.js";

// ================= LẤY DỮ LIỆU TRANG CHECKOUT =================
export const getCheckoutInfo = async (req, res) => {
  try {
    const { id } = req.params; // order_id
    const userId = req.user.user_id;

    // Lấy order DRAFT của user
    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.phone AS user_phone, b.name AS branch_name, b.address AS branch_address
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       JOIN branches b ON o.branch_id = b.branch_id
       WHERE o.order_id = ? AND o.user_id = ? AND o.status = 'DRAFT'`,
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng DRAFT" });
    }
    const order = orders[0];

    // Lấy items
    const [items] = await db.query(
      `SELECT oi.order_item_id, m.name, oi.quantity, oi.unit_price, oi.line_total
       FROM order_items oi
       JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id = ?`,
      [id]
    );

    return res.json({
      order_id: order.order_id,
      branch: { id: order.branch_id, name: order.branch_name, address: order.branch_address },
      user: { name: order.user_name, phone: order.user_phone },
      items,
      total_price: order.total_price,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÁC NHẬN ĐẶT ĐƠN =================
export const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params; // order_id
    const userId = req.user.user_id;
    const { customer_name, customer_phone, order_type, scheduled_time, delivery_address, payment_method } = req.body;

    // Validate order
    const [orders] = await db.query(
      `SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND status = 'DRAFT'`,
      [id, userId]
    );
    if (orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng để xác nhận" });
    }

    // Validate dữ liệu theo order_type
    if ((order_type === "DINE_IN" || order_type === "TAKEAWAY") && !scheduled_time) {
      return res.status(400).json({ message: "Vui lòng chọn giờ cho DINE_IN hoặc TAKEAWAY" });
    }
    if (order_type === "DELIVERY" && !delivery_address) {
      return res.status(400).json({ message: "Vui lòng nhập địa chỉ giao hàng" });
    }

    await db.query(
      `UPDATE orders 
       SET status='PENDING', 
           customer_name=?, customer_phone=?, 
           order_type=?, scheduled_time=?, delivery_address=?, 
           payment_method=? 
       WHERE order_id=?`,
      [
        customer_name,
        customer_phone,
        order_type,
        scheduled_time || null,
        delivery_address || null,
        payment_method,
        id,
      ]
    );

    return res.json({ message: "Xác nhận đặt đơn thành công", order_id: id });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};


