// controllers/adminController.js
import db from "../config/db.js";
import bcrypt from "bcrypt";

// ================= LẤY DANH SÁCH USER =================
export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, name, email, phone, role, branch_id, created_at FROM users"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= LẤY USER THEO ID =================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT user_id, name, email, phone, role, branch_id, created_at FROM users WHERE user_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy user" });
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= TẠO CUSTOMER MỚI =================
export const createCustomer = async (req, res) => {
  try {
    let { name, email, password, phone } = req.body;

    // Trim chuỗi nếu có
    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof phone === "string") phone = phone.trim();

    // Kiểm tra chuỗi rỗng hoặc khoảng trắng
    for (let [key, value] of Object.entries({ name, email, password, phone })) {
      if (
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return res.status(400).json({
          message: `Trường '${key}' không được để trống hoặc chỉ chứa khoảng trắng`,
        });
      }
    }

    // Kiểm tra định dạng email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    // Kiểm tra email trùng
    const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Kiểm tra phone hợp lệ
    if (!/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ. Chỉ được chứa 9-11 chữ số.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, phone, role, created_at) VALUES (?, ?, ?, ?, 'CUSTOMER', NOW())",
      [name, email, hashedPassword, phone]
    );

    return res.status(201).json({ message: "Tạo customer thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= TẠO STAFF MỚI =================
export const createStaff = async (req, res) => {
  try {
    let { name, email, password, phone, branch_id } = req.body;

    // Trim chuỗi nếu là string
    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof phone === "string") phone = phone.trim();

    // Kiểm tra chuỗi rỗng hoặc toàn khoảng trắng
    for (let [key, value] of Object.entries({ name, email, password, phone })) {
      if (
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return res.status(400).json({
          message: `Trường '${key}' không được để trống hoặc chỉ chứa khoảng trắng`,
        });
      }
    }

    // Kiểm tra định dạng email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    // Kiểm tra email trùng
    const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Kiểm tra số điện thoại
    if (!/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ. Chỉ được chứa 9-11 chữ số.",
      });
    }

    // Kiểm tra chi nhánh
    const [branch] = await db.query(
      "SELECT * FROM branches WHERE branch_id = ?",
      [branch_id]
    );
    if (branch.length === 0) {
      return res.status(400).json({ message: "Chi nhánh không tồn tại" });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, phone, role, branch_id, created_at) VALUES (?, ?, ?, ?, 'STAFF', ?, NOW())",
      [name, email, hashedPassword, phone, branch_id]
    );

    return res.status(201).json({ message: "Tạo staff thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= CẬP NHẬT Customer =================
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, email, password, phone } = req.body;

    // Lấy thông tin cũ
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy user" });
    const oldData = rows[0];

    // Trim các chuỗi đầu vào (nếu là string)
    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof phone === "string") phone = phone.trim();

    // Kiểm tra chuỗi rỗng hoặc chỉ có khoảng trắng
    for (let [key, value] of Object.entries({ name, email, password, phone })) {
      if (
        value !== undefined &&
        typeof value === "string" &&
        value.trim() === ""
      ) {
        return res.status(400).json({
          message: `Trường '${key}' không được để trống hoặc chỉ chứa khoảng trắng`,
        });
      }
    }

    //Right email
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Email không hợp lệ.",
      });
    }

    // Kiểm tra email trùng nếu có thay đổi
    if (email && email !== oldData.email) {
      const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (exists.length > 0) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }
    }

    // Chỉ kiểm tra định dạng số nếu người dùng truyền phone
    if (phone !== undefined && !/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ. Chỉ được chứa 9-11 chữ số.",
      });
    }

    // Giữ lại giá trị cũ nếu không truyền
    name = name || oldData.name;
    email = email || oldData.email;
    phone = phone || oldData.phone;

    // Xử lý mật khẩu
    let hashedPassword = oldData.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    //So sánh nếu không có gì thay đổi
    const noChange =
      name === oldData.name &&
      email === oldData.email &&
      phone === oldData.phone &&
      hashedPassword === oldData.password;

    if (noChange) {
      return res
        .status(400)
        .json({ message: "Không có thông tin nào được thay đổi" });
    }

    // Cập nhật DB
    await db.query(
      "UPDATE users SET name=?, email=?, password=?, phone=? WHERE user_id=?",
      [name, email, hashedPassword, phone, id]
    );

    return res.json({ message: "Cập nhật customer thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= CẬP NHẬT Staff =================
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, email, password, phone, branch_id } = req.body;

    // Kiểm tra user tồn tại
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }
    const oldData = rows[0];

    // Trim các chuỗi đầu vào
    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof phone === "string") phone = phone.trim();

    // Kiểm tra chuỗi rỗng hoặc toàn khoảng trắng
    for (let [key, value] of Object.entries({ name, email, password, phone })) {
      if (
        value !== undefined &&
        typeof value === "string" &&
        value.trim() === ""
      ) {
        return res.status(400).json({
          message: `Trường '${key}' không được để trống hoặc chỉ chứa khoảng trắng`,
        });
      }
    }

    //Right email
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Email không hợp lệ.",
      });
    }

    // Chỉ kiểm tra định dạng số nếu người dùng truyền phone
    if (phone !== undefined && !/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ. Chỉ được chứa 9-11 chữ số.",
      });
    }

    // Kiểm tra email trùng nếu có thay đổi
    if (email && email !== oldData.email) {
      const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (exists.length > 0) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }
    }

    // Nếu có truyền branch_id → kiểm tra branch có tồn tại
    if (branch_id !== undefined && branch_id !== oldData.branch_id) {
      const [branch] = await db.query(
        "SELECT * FROM branches WHERE branch_id = ?",
        [branch_id]
      );
      if (branch.length === 0) {
        return res.status(400).json({ message: "Chi nhánh không tồn tại" });
      }
    }

    // Dùng thông tin cũ nếu không truyền gì mới
    name = name || oldData.name;
    email = email || oldData.email;
    phone = phone || oldData.phone;
    branch_id = branch_id || oldData.branch_id;

    let hashedPassword = oldData.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Kiểm tra nếu không có thay đổi gì
    const noChange =
      name === oldData.name &&
      email === oldData.email &&
      phone === oldData.phone &&
      branch_id === oldData.branch_id &&
      hashedPassword === oldData.password;

    if (noChange) {
      return res
        .status(400)
        .json({ message: "Không có thông tin nào được thay đổi" });
    }

    // Cập nhật
    await db.query(
      "UPDATE users SET name=?, email=?, password=?, phone=?, branch_id=? WHERE user_id=?",
      [name, email, hashedPassword, phone, branch_id, id]
    );

    return res.json({ message: "Cập nhật staff thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÓA USER =================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy user" });

    await db.query("DELETE FROM users WHERE user_id = ?", [id]);
    return res.json({ message: "Xóa user thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
