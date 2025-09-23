import db from "../config/db.js";

// ================= TẠO ORDER (giỏ hàng) MỚI =================
// Khi khách bắt đầu chọn chi nhánh -> tạo giỏ hàng DRAFT
export const createOrder = async (req, res) => {
  try {
    const { branch_id } = req.body;
    const userId = req.user.user_id; // giả sử req.user có từ middleware auth
    console.log("req.user = ", req.user);

    if (!branch_id) {
      return res.status(400).json({ message: "Thiếu branch_id" });
    }

    // Tạo giỏ hàng với status = DRAFT
    const [result] = await db.query(
      `INSERT INTO orders (user_id, branch_id, status, total_price, created_at)
       VALUES (?, ?, 'DRAFT', 0, NOW())`,
      [userId, branch_id]
    );

    return res.status(201).json({
      message: "Tạo giỏ hàng thành công",
      order_id: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= THÊM MÓN VÀO GIỎ HÀNG =================
export const addItemToOrder = async (req, res) => {
  try {
    const { order_id, item_id, quantity } = req.body;

    if (!order_id || !item_id || !quantity) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: "Số lượng phải >= 1" });
    }

    // Lấy giá món ăn
    const [items] = await db.query(
      "SELECT price FROM menu_items WHERE item_id = ? AND is_available = 1",
      [item_id]
    );
    if (items.length === 0) {
      return res.status(404).json({ message: "Món ăn không tồn tại hoặc đã hết" });
    }
    const unitPrice = items[0].price;
    const lineTotal = unitPrice * quantity;

    // Kiểm tra xem trong giỏ hàng đã có món này chưa
    const [existing] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ? AND item_id = ?",
      [order_id, item_id]
    );

    if (existing.length > 0) {
      // Nếu có rồi thì cộng thêm số lượng
      const newQty = existing[0].quantity + quantity;
      const newLineTotal = unitPrice * newQty;
      await db.query(
        "UPDATE order_items SET quantity=?, line_total=? WHERE order_item_id=?",
        [newQty, newLineTotal, existing[0].order_item_id]
      );
    } else {
      // Nếu chưa có thì thêm mới
      await db.query(
        `INSERT INTO order_items (order_id, item_id, quantity, unit_price, line_total, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [order_id, item_id, quantity, unitPrice, lineTotal]
      );
    }

    // Cập nhật tổng tiền trong orders
    await db.query(
      `UPDATE orders 
       SET total_price = (SELECT SUM(line_total) FROM order_items WHERE order_id = ?)
       WHERE order_id = ?`,
      [order_id, order_id]
    );

    return res.json({ message: "Thêm món vào giỏ hàng thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= LẤY CHI TIẾT GIỎ HÀNG =================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy order
    const [orders] = await db.query("SELECT * FROM orders WHERE order_id = ?", [
      id,
    ]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
    }
    const order = orders[0];

    // Lấy danh sách món trong giỏ
    const [items] = await db.query(
      `SELECT oi.order_item_id, oi.item_id, m.name, oi.quantity, oi.unit_price, oi.line_total
       FROM order_items oi
       JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id = ?`,
      [id]
    );

    return res.json({ ...order, items });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= CẬP NHẬT SỐ LƯỢNG MÓN =================
export const updateOrderItem = async (req, res) => {
  try {
    const { id } = req.params; // order_item_id
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Số lượng phải >= 1" });
    }

    // Lấy order_item cũ
    const [rows] = await db.query(
      "SELECT * FROM order_items WHERE order_item_id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy order_item" });
    }
    const orderItem = rows[0];

    const newLineTotal = orderItem.unit_price * quantity;

    await db.query(
      "UPDATE order_items SET quantity=?, line_total=? WHERE order_item_id=?",
      [quantity, newLineTotal, id]
    );

    // Cập nhật tổng tiền order
    await db.query(
      `UPDATE orders 
       SET total_price = (SELECT SUM(line_total) FROM order_items WHERE order_id = ?)
       WHERE order_id = ?`,
      [orderItem.order_id, orderItem.order_id]
    );

    return res.json({ message: "Cập nhật món thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÓA MÓN TRONG GIỎ =================
export const deleteOrderItem = async (req, res) => {
  try {
    const { id } = req.params; // order_item_id

    // Lấy order_item
    const [rows] = await db.query(
      "SELECT * FROM order_items WHERE order_item_id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy order_item" });
    }
    const orderItem = rows[0];

    // Xóa item
    await db.query("DELETE FROM order_items WHERE order_item_id=?", [id]);

    // Cập nhật lại tổng tiền order
    await db.query(
      `UPDATE orders 
       SET total_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?)
       WHERE order_id = ?`,
      [orderItem.order_id, orderItem.order_id]
    );

    return res.json({ message: "Xóa món khỏi giỏ hàng thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
