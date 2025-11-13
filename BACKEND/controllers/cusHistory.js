import db from "../config/db.js";

export const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { branch_id } = req.query;
    let queryParams = [userId];
    let branchCondition = "";

    if (branch_id) {
      branchCondition = " AND o.branch_id = ? ";
      queryParams.push(branch_id);
    }
    const [orders] = await db.query(
      `SELECT 
          o.order_id,
          o.status,
          o.total_price,
          o.final_price,
          o.discount_amount,
          o.created_at,
          o.order_type,
          o.payment_method,
          o.customer_name,
          o.customer_phone,
          o.delivery_address,
          o.scheduled_time,
          o.message,
          b.name AS branch_name
        FROM orders o
        JOIN branches b ON o.branch_id = b.branch_id
        WHERE o.user_id = ?
          AND o.status NOT IN ('DRAFT')
          ${branchCondition}
        ORDER BY o.created_at DESC`,
        queryParams
    );

    if (orders.length === 0) {
      return res.json({ message: "No order now", orders: [] });
    }
    const orderIds = orders.map((o) => o.order_id);
    const [items] = await db.query(
      `SELECT 
          oi.order_id,
          oi.order_item_id,
          m.name,
          m.image,
          oi.quantity,
          oi.unit_price,
          oi.line_total,
          oi.option_summary
        FROM order_items oi
        JOIN menu_items m ON oi.item_id = m.item_id
        WHERE oi.order_id IN (?)`,
      [orderIds]
    );
    const orderMap = {};
    orders.forEach((order) => {
      orderMap[order.order_id] = { ...order, items: [] };
    });

    items.forEach((item) => {
      if (orderMap[item.order_id]) {
        orderMap[item.order_id].items.push(item);
      }
    });
    return res.json({
      orders: Object.values(orderMap),
    });
  } catch (error) {
    console.error("Error retrieving order history:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};


// POST /history/buy-again
export const buyAgain = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: "Missing order_id" });
    }

    // 1. Lấy chi tiết order gốc
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE order_id = ? AND user_id = ?",
      [order_id, userId]
    );
    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = orders[0];

    // 2. Kiểm tra giỏ hàng DRAFT hiện tại
    const [drafts] = await db.query(
      "SELECT order_id FROM orders WHERE user_id=? AND branch_id=? AND status='DRAFT'",
      [userId, order.branch_id]
    );

    let draftOrderId;
    if (drafts.length > 0) {
      draftOrderId = drafts[0].order_id;
      // Xóa hết item cũ trong giỏ DRAFT (nếu muốn reset)
      await db.query("DELETE FROM order_items WHERE order_id=?", [draftOrderId]);
    } else {
      // tạo mới giỏ hàng DRAFT
      const [result] = await db.query(
        "INSERT INTO orders (user_id, branch_id, status, total_price, final_price, created_at) VALUES (?, ?, 'DRAFT', 0, 0, NOW())",
        [userId, order.branch_id]
      );
      draftOrderId = result.insertId;
    }

    // 3. Lấy tất cả items của order gốc
    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id=?",
      [order_id]
    );

    // 4. Thêm từng item vào giỏ hàng DRAFT
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items 
        (order_id, item_id, quantity, unit_price, line_total, options, option_summary, options_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          draftOrderId,
          item.item_id,
          item.quantity,
          item.unit_price,
          item.line_total,
          item.options ? JSON.stringify(item.options) : null,
          item.option_summary ? JSON.stringify(item.option_summary) : null,
          item.options_hash,
        ]
      );
    }

    // 5. Cập nhật tổng tiền cho giỏ hàng DRAFT
    await db.query(
      `UPDATE orders 
       SET total_price=(SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id=?),
           final_price=(SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id=?)
       WHERE order_id=?`,
      [draftOrderId, draftOrderId, draftOrderId]
    );

    return res.json({ message: "Added to cart", order_id: draftOrderId });
  } catch (error) {
    console.error("buyAgain error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
