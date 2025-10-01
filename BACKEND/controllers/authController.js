// controllers/authController.js
import db from "../config/db.js";
import bcrypt from "bcrypt"; // để hash password
import jwt from "jsonwebtoken"; // để tạo token đăng nhập

// ================= ĐĂNG KÝ =================
export const register = async (req, res) => {
  try {
    const { name, email, password, phone} = req.body;

    // Kiểm tra email đã tồn tại chưa
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Hash password trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm user mới
    await db.query(
      "INSERT INTO users (name, email, password, phone, role, created_at) VALUES (?, ?, ?, ?, 'CUSTOMER', NOW())",
      [name, email, hashedPassword, phone]
    );

    return res.status(201).json({ message: "Đăng ký tài khoản thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};


//authController.js
// ================= ĐĂNG NHẬP =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const user = rows[0];

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, branch_id: user.branch_id },
      "secret_key", // nên lưu trong biến môi trường
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.json({ message: "Đăng nhập thành công", token, user: userWithoutPassword, });// gửi thêm user để FE lấy role 
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
