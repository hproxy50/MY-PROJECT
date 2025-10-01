import db from "../config/db.js";
import payos from "../config/payos.js";

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
      branch: {
        id: order.branch_id,
        name: order.branch_name,
        address: order.branch_address,
      },
      user: { name: order.user_name, phone: order.user_phone },
      items,
      total_price: order.total_price,
      discount_amount: order.discount_amount || 0,
      final_price: order.final_price || order.total_price,
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
    const {
      customer_name,
      customer_phone,
      order_type,
      scheduled_time,
      delivery_address,
      payment_method,
    } = req.body;

    // Validate order
    const [orders] = await db.query(
      `SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND status = 'DRAFT'`,
      [id, userId]
    );
    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy giỏ hàng để xác nhận" });
    }

    // Validate dữ liệu theo order_type
    if (
      (order_type === "DINE_IN" || order_type === "TAKEAWAY") &&
      !scheduled_time
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn giờ cho DINE_IN hoặc TAKEAWAY" });
    }
    if (order_type === "DELIVERY" && !delivery_address) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập địa chỉ giao hàng" });
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

// ================ USE PROMOTION AND COUNTING PRICE ===========================

export const applyPromotion = async (req, res) => {
  try {
    const { id } = req.params; // order_id
    const { promo_id } = req.body;
    const userId = req.user.user_id;

    // Lấy order
    const [orders] = await db.query(
      `SELECT * FROM orders WHERE order_id=? AND user_id=? AND status='DRAFT'`,
      [id, userId]
    );
    if (orders.length === 0)
      return res.status(404).json({ message: "Không tìm thấy order DRAFT" });
    const order = orders[0];

    // Lấy promo
    const [promos] = await db.query(
      `SELECT * FROM promotions 
       WHERE promo_id=? 
         AND branch_id=? 
         AND start_date <= NOW() 
         AND end_date >= NOW()`,
      [promo_id, order.branch_id]
    );
    if (promos.length === 0)
      return res
        .status(400)
        .json({ message: "Mã giảm giá không hợp lệ hoặc đã hết hạn" });

    const promo = promos[0];

    // Tính giảm giá
    let discount = 0;
    if (promo.discount_type === "PERCENT") {
      discount = (order.total_price * promo.discount_value) / 100;
    } else if (promo.discount_type === "AMOUNT") {
      discount = promo.discount_value;
    }
    if (discount > order.total_price) discount = order.total_price; // không âm

    const finalPrice = order.total_price - discount;

    // Update order
    await db.query(
      `UPDATE orders SET promo_id=?, discount_amount=?, final_price=? WHERE order_id=?`,
      [promo.promo_id, discount, finalPrice, id]
    );

    return res.json({
      message: "Áp dụng mã giảm giá thành công",
      order_id: id,
      discount,
      final_price: finalPrice,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// // ================= TẠO QR THANH TOÁN VIETQR =================
// export const createVietQRPayment = async (req, res) => {
//   try {
//     const { id } = req.params; // order_id
//     const userId = req.user.user_id;

//     // Lấy order
//     const [orders] = await db.query(
//       `SELECT * FROM orders WHERE order_id=? AND user_id=? AND status='DRAFT'`,
//       [id, userId]
//     );
//     if (orders.length === 0) {
//       return res.status(404).json({ message: "Không tìm thấy giỏ hàng để thanh toán" });
//     }
//     const order = orders[0];

//     // Config tài khoản nhận tiền
//     const BANK_CODE = "BIDV"; // Vietcombank
//     const ACCOUNT_NO = "2170928129"; // STK nhận tiền
//     const ACCOUNT_NAME = "NGUYEN PHUC HUNG"; // Chủ tài khoản

//     // Nội dung chuyển khoản
//     const addInfo = `Thanh toan don hang #${order.order_id}`;

//     // QR link từ VietQR
//     const qrUrl = `https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NO}-qr_only.png?amount=${order.final_price}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

//     return res.json({ qrUrl, amount: order.final_price, addInfo });
//   } catch (error) {
//     console.error("Lỗi VietQR:", error);
//     return res.status(500).json({ message: "Lỗi tạo QR VietQR", error });
//   }
// };

// ================= TẠO THANH TOÁN BẰNG PAYOS =================
export const createPayOSPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await db.query("SELECT * FROM orders WHERE order_id = ?", [
      id,
    ]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orders[0];
    const amount = Math.round(order.final_price || order.total_price);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid order amount" });
    }

    const response = await payos.paymentRequests.create({
      orderCode: order.order_id,
      amount,
      description: `Thanh toán đơn hàng #${order.order_id}`,
      returnUrl: `http://localhost:5173/payment-success?orderId=${order.order_id}`,
      cancelUrl: `http://localhost:5173/payment-cancel?orderId=${order.order_id}`,
    });

    res.json({ paymentUrl: response.checkoutUrl });
  } catch (error) {
    console.error("Lỗi PayOS:", error.response?.data || error.message || error);
    res
      .status(500)
      .json({ message: "Thanh toán thất bại", error: error.message });
  }
};

// ================= Webhook trả về của payos =================
export const payOSWebhook = async (req, res) => {
  try {
    console.log("Webhook raw:", req.body);

    const data = req.body;

    // 1. Verify signature
    const verified = await payos.webhooks.verify(data, req.headers["x-signature"]);
    if (!verified) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // 2. Lấy orderCode từ webhook
    const orderCode = data.data?.orderCode;

    // 3. Xử lý theo kết quả thanh toán
    if (data.code === "00" && data.success) {
      // Thanh toán thành công
      await db.query(`UPDATE orders SET status='PAID' WHERE order_id=? AND status='DRAFT'`, [
        orderCode,
      ]);
    } else {
      // Nếu có hủy thanh toán hoặc thất bại thì update CANCELLED
      await db.query(`UPDATE orders SET status='CANCELLED' WHERE order_id=?`, [
        orderCode,
      ]);
    }

    res.json({ message: "Webhook processed" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ message: "Webhook error" });
  }
};


