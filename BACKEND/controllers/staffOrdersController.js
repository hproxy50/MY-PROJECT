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
 * GET /staff/orders
 * Lấy danh sách đơn PENDING cho branch của nhân viên
 *
 * TỐI ƯU: Đã loại bỏ phần truy vấn 'order_items'.
 * Giao diện danh sách không cần chi tiết món ăn, chỉ cần thông tin order.
 * Chi tiết món ăn sẽ được lấy riêng khi gọi getPendingOrderDetails (ấn "Xem").
 */
export const getPendingOrdersForStaff = async (req, res) => {
  try {
    const err = ensureStaff(req, res);
    if (err) return; // ensureStaff đã trả response

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

    // Build response orders (đã bỏ items)
    const result = orders.map((o) => ({
      order_id: o.order_id,
      user_id: o.user_id,
      total_price: Number(o.total_price),
      final_price:
        o.final_price !== null ? Number(o.final_price) : Number(o.total_price),
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      order_type: o.order_type, // 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY'
      scheduled_time: o.scheduled_time,
      delivery_address: o.order_type === "DELIVERY" ? o.delivery_address : null,
      message: o.message,
      created_at: o.created_at,
      // items: [] // Không cần items ở danh sách
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
 * (Giữ nguyên, hàm này đã đúng)
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
       WHERE o.order_id = ? AND o.branch_id = ? AND o.status = 'PENDING'`, // Chỉ cho xem chi tiết đơn PENDING
      [orderId, branchId]
    );
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy order PENDING thuộc chi nhánh của bạn",
      });
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
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * POST /staff/orders/approve
 * Chuyển trạng thái từ PENDING -> PREPARING
 * (Giữ nguyên, hàm này đã đúng)
 */
export const approveOrders = async (req, res) => {
  const err = ensureStaff(req, res);
  if (err) return;

  const branchId = req.user.branch_id;
  let orderIds = [];

  // 1. Lấy orderIds từ body (giống code cũ)
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
      message: "Vui lòng cung cấp order_id hoặc order_ids (mảng) hợp lệ",
    });
  }

  // 2. Bắt đầu Transaction
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 3. Lấy tất cả items từ các order_ids (chỉ các đơn PENDING, thuộc branch này)
    // và gộp tổng số lượng cần trừ cho mỗi item_id
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
         AND mi.stock_quantity IS NOT NULL
       GROUP BY oi.item_id, mi.name, mi.stock_quantity`,
      [orderIds, branchId]
    );

    // 4. Kiểm tra tồn kho
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

    // Nếu có 1 món không đủ, báo lỗi và rollback
    if (insufficientStockItems.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "Không đủ tồn kho để duyệt đơn.",
        insufficient_items: insufficientStockItems,
      });
    }

    // 5. Nếu đủ kho, tiến hành trừ kho
    for (const item of itemsToUpdate) {
      // Dùng UPDATE ... SET stock = stock - X
      // Điều này an toàn nếu có 2 request duyệt cùng lúc (atomic)
      await connection.query(
        `UPDATE menu_items
         SET stock_quantity = stock_quantity - ?
         WHERE item_id = ?`,
        [item.total_quantity_needed, item.item_id]
      );
    }

    // 6. Cập nhật is_available = 0 cho các món vừa bị trừ về 0
    // (Chỉ cần chạy cho các item_id vừa bị ảnh hưởng)
    const itemIdsToCheck = itemsToUpdate.map((i) => i.item_id);
    if (itemIdsToCheck.length > 0) {
      await connection.query(
        `UPDATE menu_items
         SET is_available = 0
         WHERE item_id IN (?) AND stock_quantity = 0`,
        [itemIdsToCheck]
      );
    }

    // 7. Cập nhật trạng thái đơn hàng (chỉ các đơn PENDING thuộc branch)
    const [updateOrdersResult] = await connection.query(
      `UPDATE orders
       SET status = 'PREPARING'
       WHERE order_id IN (?) AND branch_id = ? AND status = 'PENDING'`,
      [orderIds, branchId]
    );

    const affectedOrders = updateOrdersResult.affectedRows ?? 0;

    // 8. Commit Transaction
    await connection.commit();

    return res.json({
      message: `Duyệt đơn và trừ kho thành công`,
      requested: orderIds.length,
      updated_count: affectedOrders,
    });
  } catch (error) {
    // 9. Rollback nếu có lỗi
    await connection.rollback();
    console.error("approveOrders error:", error);
    return res.status(500).json({ message: "Lỗi server khi duyệt đơn", error });
  } finally {
    // Luôn trả connection về pool
    connection.release();
  }
};

/**
 * BỔ SUNG:
 * POST /staff/orders/cancel
 * Body: { order_ids: [1,2,3] } (hoặc { order_id: 1 } )
 * Chuyển trạng thái từ PENDING -> CANCELED.
 * (Logic này áp dụng cho PENDING, không phải PREPARING như yêu cầu
 * vì component này chỉ quản lý đơn PENDING)
 */
export const cancelOrders = async (req, res) => {
  // ... (Giữ nguyên code cũ) ...
  // Lý do: Đơn PENDING bị hủy thì chưa trừ kho, nên không cần hoàn kho.
  // Code cũ của bạn (chỉ đổi status) là ĐÚNG.

  try {
    const err = ensureStaff(req, res);
    if (err) return;

    const branchId = req.user.branch_id;
    let orderIds = []; // Lấy ID từ body (giống hệt approveOrders)

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
        message: "Vui lòng cung cấp order_id hoặc order_ids (mảng) hợp lệ",
      });
    } // Cập nhật: chỉ update các order thuộc branch và status = 'PENDING'

    const [updateResult] = await db.query(
      `UPDATE orders
      SET status = 'CANCELED'
      WHERE order_id IN (?) AND branch_id = ? AND status = 'PENDING'`,
      [orderIds, branchId]
    );

    const affected = updateResult.affectedRows ?? 0;

    return res.json({
      message: `Hủy đơn thành công`,
      requested: orderIds.length,
      updated_count: affected,
    });
  } catch (error) {
    console.error("cancelOrders error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
