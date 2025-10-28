import db from "../config/db.js";
import crypto from "crypto";

// ================= TẠO ORDER (giỏ hàng) MỚI =================
// Khi khách bắt đầu chọn chi nhánh -> tạo giỏ hàng DRAFT
export const createOrder = async (req, res) => {
  try {
    const { branch_id } = req.body;
    const userId = req.user.user_id;

    if (!branch_id) {
      return res.status(400).json({ message: "Thiếu branch_id" });
    }

    // 1. Kiểm tra giỏ hàng DRAFT đã tồn tại chưa
    const [existingOrders] = await db.query(
      `SELECT order_id FROM orders WHERE user_id = ? AND branch_id = ? AND status = 'DRAFT'`,
      [userId, branch_id]
    );

    if (existingOrders.length > 0) {
      // Nếu đã có giỏ hàng DRAFT thì dùng lại
      return res.status(200).json({
        message: "Đã có giỏ hàng DRAFT, dùng lại",
        order_id: existingOrders[0].order_id,
      });
    }

    // 2. Nếu chưa có, tạo mới giỏ hàng
    const [result] = await db.query(
      `INSERT INTO orders (user_id, branch_id, status, total_price, created_at)
       VALUES (?, ?, 'DRAFT', 0, NOW())`,
      [userId, branch_id]
    );

    return res.status(201).json({
      message: "Tạo giỏ hàng mới thành công",
      order_id: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= THÊM MÓN VÀO GIỎ HÀNG  =================
export const addItemToOrder = async (req, res) => {
  try {
    // nhận payload
    const { order_id, item_id, quantity } = req.body;
    let { selectedOptions } = req.body; // optional

    // basic validation
    if (!order_id || !item_id || !quantity) {
      return res
        .status(400)
        .json({ message: "Thiếu dữ liệu (order_id, item_id, quantity)" });
    }
    if (Number(quantity) < 1) {
      return res.status(400).json({ message: "Số lượng phải >= 1" });
    }

    // Nếu frontend gửi selectedOptions như JSON string (multipart/form-data), parse nó
    if (typeof selectedOptions === "string") {
      try {
        selectedOptions = selectedOptions ? JSON.parse(selectedOptions) : [];
      } catch (e) {
        return res
          .status(400)
          .json({ message: "selectedOptions không phải JSON hợp lệ" });
      }
    }

    // Lấy price, tồn kho, is_available của món
    const [items] = await db.query(
      "SELECT price, stock_quantity, is_available FROM menu_items WHERE item_id = ?",
      [item_id]
    );
    if (items.length === 0) {
      return res
        .status(404)
        .json({ message: "Món ăn không tồn tại hoặc đã hết" });
    }
    const item = items[0];
    if (Number(item.is_available) !== 1) {
      return res.status(400).json({ message: "Món hiện không có sẵn" });
    }

    const basePrice = Number(item.price);
    const stock = item.stock_quantity; // có thể null nếu không quản lý tồn

    // ----------------- Xử lý selectedOptions -----------------
    // Chuẩn hoá input thành mảng các đối tượng { group_id, choice_id }
    let optionsArray = Array.isArray(selectedOptions)
      ? selectedOptions.slice()
      : [];

    // Lấy groups để validate SINGLE / required
    let totalDelta = 0;
    const [groups] = await db.query(
      "SELECT group_id, name AS group_name, selection_type, is_required FROM item_option_groups WHERE item_id = ?",
      [item_id]
    );
    const groupMap = {};
    groups.forEach((g) => {
      groupMap[g.group_id] = g;
    });

    // Chuẩn hoá kết quả lưu trữ (optionsToStore) và tính tổng price_delta
    let optionsToStore = [];

    if (optionsArray.length > 0) {
      // ensure choice_ids numbers
      const choiceIds = optionsArray.map((o) => Number(o.choice_id));

      // Lấy dữ liệu choice từ DB (chỉ những choice thuộc item này)
      const [choiceRows] = await db.query(
        `SELECT c.choice_id, c.group_id, c.name AS choice_name, c.price_delta, g.name AS group_name, g.selection_type
         FROM item_option_choices c
         JOIN item_option_groups g ON c.group_id = g.group_id
         WHERE c.choice_id IN (?) AND g.item_id = ?`,
        [choiceIds, item_id]
      );

      // Build map để validate
      const choiceMap = {};
      choiceRows.forEach((r) => {
        choiceMap[Number(r.choice_id)] = r;
      });

      // Validate mỗi selected choice và push vào optionsToStore
      for (const sel of optionsArray) {
        const cid = Number(sel.choice_id);
        const row = choiceMap[cid];
        if (!row) {
          return res.status(400).json({
            message: `Lựa chọn không hợp lệ hoặc không thuộc món này: ${cid}`,
          });
        }
        optionsToStore.push({
          group_id: Number(row.group_id),
          group_name: row.group_name,
          choice_id: Number(row.choice_id),
          choice_name: row.choice_name,
          price_delta: Number(row.price_delta || 0),
        });
        totalDelta += Number(row.price_delta || 0);
      }
      // Validate SINGLE (không chọn >1)
      const counts = {};
      optionsToStore.forEach((o) => {
        counts[o.group_id] = (counts[o.group_id] || 0) + 1;
      });
      for (const gidStr of Object.keys(counts)) {
        const gid = Number(gidStr);
        const g = groupMap[gid];
        if (!g) {
          return res
            .status(400)
            .json({ message: `Nhóm lựa chọn không tồn tại: ${gid}` });
        }
        if (g.selection_type === "SINGLE" && counts[gid] > 1) {
          return res.status(400).json({
            message: `Nhóm "${g.group_name}" chỉ cho phép 1 lựa chọn`,
          });
        }
      }
    }

    // Validate required groups
    for (const g of groups) {
      if (Number(g.is_required) === 1) {
        const found = optionsToStore.some(
          (o) => Number(o.group_id) === Number(g.group_id)
        );
        if (!found) {
          return res.status(400).json({
            message: `Cần chọn tùy chọn cho nhóm bắt buộc: ${g.group_name}`,
          });
        }
      }
    }

    // Nếu không có optionsToStore => dùng mảng rỗng để lưu nhất quán
    if (!Array.isArray(optionsToStore) || optionsToStore.length === 0) {
      optionsToStore = [];
    }

    // Normalise/sort để ổn định thứ tự => JSON.stringify và hash cũng ổn định
    optionsToStore.sort((a, b) => {
      if (a.group_id !== b.group_id) return a.group_id - b.group_id;
      return a.choice_id - b.choice_id;
    });

    const optionsJson = JSON.stringify(optionsToStore); // lưu vào DB
    const optionSummary = optionsToStore.map((o) => o.choice_name).join(", ");

    // compute md5 hash của optionsJson (để so sánh nhanh và ổn định)
    const optionsHash = crypto
      .createHash("md5")
      .update(optionsJson)
      .digest("hex");

    // ----------------- Tính giá và merge vào cart -----------------
    const unitPrice = basePrice + totalDelta;

    // Tìm existing bằng order_id + item_id + options_hash
    const [existing] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ? AND item_id = ? AND COALESCE(options_hash,'') = ?",
      [order_id, item_id, optionsHash]
    );

    if (existing.length > 0) {
      // merge: tăng số lượng
      const existingRow = existing[0];
      const newQty = Number(existingRow.quantity) + Number(quantity);
      if (stock !== null && stock !== undefined && newQty > stock) {
        return res.status(400).json({
          message: `Số lượng vượt quá tồn kho. Hiện chỉ còn ${stock} sản phẩm`,
        });
      }
      const newLineTotal = unitPrice * newQty;
      await db.query(
        "UPDATE order_items SET quantity=?, unit_price=?, line_total=?, option_summary=?, options = ?, options_hash = ? WHERE order_item_id=?",
        [
          newQty,
          unitPrice,
          newLineTotal,
          optionSummary,
          optionsJson,
          optionsHash,
          existingRow.order_item_id,
        ]
      );
    } else {
      // insert mới
      if (stock !== null && stock !== undefined && Number(quantity) > stock) {
        return res.status(400).json({
          message: `Số lượng vượt quá tồn kho. Hiện chỉ còn ${stock} sản phẩm`,
        });
      }
      const lineTotal = unitPrice * Number(quantity);
      await db.query(
        `INSERT INTO order_items (order_id, item_id, quantity, unit_price, line_total, options, option_summary, options_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          order_id,
          item_id,
          quantity,
          unitPrice,
          lineTotal,
          optionsJson,
          optionSummary,
          optionsHash,
        ]
      );
    }

    // Cập nhật tổng tiền trong orders (giữ logic cũ)
    await db.query(
      `UPDATE orders 
       SET total_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?),
           promo_id = NULL,
           discount_amount = 0,
           final_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?)
       WHERE order_id = ?`,
      [order_id, order_id, order_id]
    );

    return res.json({ message: "Thêm món vào giỏ hàng thành công" });
  } catch (error) {
    console.error("addItemToOrder error:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= LẤY CHI TIẾT GIỎ HÀNG (trả kèm options parsed) =================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // lấy order
    const [orders] = await db.query("SELECT * FROM orders WHERE order_id = ?", [
      id,
    ]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
    }
    const order = orders[0];

    // lấy items (bao gồm options & option_summary)
    const [items] = await db.query(
      `SELECT oi.order_item_id, oi.item_id, m.name, m.image, m.description, oi.quantity, oi.unit_price, oi.line_total, oi.options, oi.option_summary
       FROM order_items oi
       JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id = ?`,
      [id]
    );

    // parse options JSON (nếu có)
    items.forEach((it) => {
      try {
        it.options = it.options ? JSON.parse(it.options) : [];
      } catch (e) {
        it.options = [];
      }
    });

    return res.json({ ...order, items });
  } catch (error) {
    console.error("getOrderById error:", error);
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

    // Lấy tồn kho từ menu_items
    const [items] = await db.query(
      "SELECT stock_quantity FROM menu_items WHERE item_id = ?",
      [orderItem.item_id]
    );
    if (items.length === 0) {
      return res.status(404).json({ message: "Món ăn không tồn tại" });
    }
    const stock = items[0].stock_quantity;

    if (quantity > stock) {
      return res.status(400).json({
        message: `Số lượng vượt quá tồn kho. Hiện chỉ còn ${stock} sản phẩm`,
      });
    }

    const newLineTotal = orderItem.unit_price * quantity;

    await db.query(
      "UPDATE order_items SET quantity=?, line_total=? WHERE order_item_id=?",
      [quantity, newLineTotal, id]
    );

    // Cập nhật tổng tiền order + reset promo
    await db.query(
      `UPDATE orders 
   SET total_price = (SELECT SUM(line_total) FROM order_items WHERE order_id = ?),
       promo_id = NULL,
       discount_amount = 0,
       final_price = (SELECT SUM(line_total) FROM order_items WHERE order_id = ?)
   WHERE order_id = ?`,
      [orderItem.order_id, orderItem.order_id, orderItem.order_id]
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

    // Cập nhật lại tổng tiền order + reset promo
    await db.query(
      `UPDATE orders 
   SET total_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?),
       promo_id = NULL,
       discount_amount = 0,
       final_price = (SELECT COALESCE(SUM(line_total),0) FROM order_items WHERE order_id = ?)
   WHERE order_id = ?`,
      [orderItem.order_id, orderItem.order_id, orderItem.order_id]
    );

    return res.json({ message: "Xóa món khỏi giỏ hàng thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
