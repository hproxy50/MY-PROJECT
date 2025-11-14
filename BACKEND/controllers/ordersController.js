console.log("--- ordersController.js ĐÃ ĐƯỢC TẢI (PHIÊN BẢN MỚI) ---");
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
      `SELECT oi.order_item_id, m.name, m.image, oi.quantity, oi.unit_price, oi.line_total, oi.option_summary
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
    return res.status(500).json({ message: "Sever error", error });
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
      message,
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
    if (order_type === "TAKEAWAY" && !scheduled_time) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn giờ cho TAKEAWAY" });
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
            payment_method=?,
            message=? 
        WHERE order_id=?`,
      [
        customer_name,
        customer_phone,
        order_type,
        scheduled_time || null,
        delivery_address || null,
        payment_method,
        message || null,
        id,
      ]
    );

    return res.json({ message: "Xác nhận đặt đơn thành công", order_id: id });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÁC NHẬN ĐẶT ĐƠN QR =================
export const confirmOrderQR = async (req, res) => {
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
      message,
    } = req.body;

    // Validate order
    const [orders] = await db.query(
      `SELECT * FROM orders WHERE order_id = ? AND user_id = ? AND status = 'DRAFT'`,
      [id, userId]
    );
    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No shopping cart found to confirm" });
    }

    // Validate dữ liệu theo order_type
    if (
      order_type === "TAKEAWAY" &&
      (!scheduled_time || scheduled_time.trim() === "")
    ) {
      return res
        .status(400)
        .json({ message: "Please select a time for TAKEAWAY" });
    }

    if (order_type === "DELIVERY" && !delivery_address) {
      return res.status(400).json({ message: "Please enter shipping address" });
    }

    await db.query(
      `UPDATE orders
        SET status='PENDING',
            customer_name=?, customer_phone=?,
            order_type=?, scheduled_time=?, delivery_address=?, 
            payment_method=?,
            message=?
        WHERE order_id=? AND status='DRAFT'`,
      [
        customer_name,
        customer_phone,
        order_type,
        scheduled_time || null,
        delivery_address || null,
        payment_method,
        message || null,
        id,
      ]
    );
    return res.json({
      message: "QR order confirmation successful",
      order_id: id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
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
      //message: "Discount code applied successfully",
      order_id: id,
      discount,
      total_price: order.total_price,
      final_price: finalPrice,
      promo_id: promo.promo_id,
      discount_amount: discount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

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
      description: `Order payment #${order.order_id}`,
      returnUrl: `http://localhost:5173/payment-success?orderId=${order.order_id}&branchId=${order.branch_id}`,
      cancelUrl: `http://localhost:5173/payment-cancel?orderId=${order.order_id}&branchId=${order.branch_id}`,
    });

    res.json({ paymentUrl: response.checkoutUrl });
  } catch (error) {
    console.error("Lỗi PayOS:", error.response?.data || error.message || error);
    res.status(500).json({ message: "Payment failed", error: error.message });
  }
};

// ================= Webhook trả về của payos =================
export const payOSWebhook = async (req, res) => {
  try {
    const data = req.body;

    console.log("--- PAYOS WEBHOOK RECEIVED ---");
    console.log(JSON.stringify(data, null, 2));

    const verified = await payos.webhooks.verify(
      data,
      req.headers["x-signature"]
    );
    if (!verified) {
      console.log("!!! Webhook signature INVALID");
      return res.status(400).json({ message: "Invalid signature" });
    }
    console.log("Webhook signature VERIFIED");

    // Lấy orderCode
    const orderCode = data.data?.orderCode;
    console.log(`Extracted orderCode: [${orderCode}]`);

    // Kiểm tra điều kiện thanh toán
    if (data.code === "00" && data.success) {
      console.log(`SUCCESS condition met for order [${orderCode}].`);

      if (!orderCode) {
        console.log("!!! ERROR: orderCode is undefined, cannot update DB.");
        return res.json({
          message: "Webhook processed, but orderCode missing.",
        });
      }
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        const [orders] = await connection.query(
          `SELECT status FROM orders WHERE order_id = ? AND status = 'PENDING' FOR UPDATE`,
          [orderCode]
        );

        if (orders.length === 0) {
          await connection.rollback();
          console.log(
            `Order [${orderCode}] not found or not in PENDING state. Skipping.`
          );
          return res.json({ message: "Webhook processed, order not pending." });
        }
        const [itemsToDecrement] = await connection.query(
          `SELECT item_id, quantity FROM order_items WHERE order_id = ?`,
          [orderCode]
        );

        const itemIds = [];
        for (const item of itemsToDecrement) {
          itemIds.push(item.item_id);
          await connection.query(
            `UPDATE menu_items
            SET stock_quantity = stock_quantity - ?
            WHERE item_id = ?`,
            [item.quantity, item.item_id]
          );
        }

        if (itemIds.length > 0) {
          await connection.query(
            `UPDATE menu_items
            SET is_available = 0
            WHERE item_id IN (?) AND stock_quantity = 0`,
            [itemIds]
          );
        }
        const [result] = await connection.query(
          `UPDATE orders SET status='PREPARING' WHERE order_id=? AND status='PENDING'`,
          [orderCode]
        );

        await connection.commit();
        console.log(
          `Database update (PREPARING) and stock decrement complete for [${orderCode}]. Info:`,
          result.info
        );
      } catch (err) {
        await connection.rollback();
        console.error(
          `!!! CRITICAL WEBHOOK TRANSACTION ERROR for order [${orderCode}]:`,
          err
        );
        return res.json({
          message: "Webhook processed, DB transaction failed.",
        });
      } finally {
        connection.release();
      } 
    } else {
      console.log(
        `Webhook reported NON-SUCCESS. Code: [${data.code}], Success: [${data.success}]`
      );
      await db.query(
        `UPDATE orders SET status='CANCELLED' WHERE order_id=? AND status='PENDING'`,
        [orderCode]
      );
      console.log(`Order [${orderCode}] set to CANCELLED.`);
    }

    res.json({ message: "Webhook processed" });
  } catch (err) {
    console.error("!!! CRITICAL WEBHOOK ERROR:", err);
    res.status(500).json({ message: "Webhook error" });
  }
};

// ================= HỦY ĐƠN HÀNG BỞI NGƯỜI DÙNG =================
export const cancelOrderByUser = async (req, res) => {
  try {
    const { id } = req.params; // order_id
    const userId = req.user.user_id;

    const [result] = await db.query(
      `UPDATE orders 
      SET status='CANCELED' 
      WHERE order_id=? AND user_id=? AND status='PENDING'`,
      [id, userId]
    );

    console.log(
      `User requested cancel for order ${id}. Rows affected: ${result.affectedRows}`
    );
    return res.json({ message: "Cancellation request processed." });
  } catch (error) {
    console.error("cancelOrderByUser error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
