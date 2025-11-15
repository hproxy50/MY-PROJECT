import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// ================= ĐĂNG KÝ =================
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
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
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const user = rows[0];

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, branch_id: user.branch_id },
      "secret_key", // nên lưu trong biến môi trường
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: userWithoutPassword,
    }); // gửi thêm user để FE lấy role
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= QUÊN MẬT KHẨU =================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Tìm user bằng email
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      // Bảo mật: Không thông báo "Email không tồn tại"
      return res
        .status(200)
        .json({ message: "Nếu email tồn tại, link reset sẽ được gửi." });
    }

    const user = rows[0];

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex"); // Hash token trước khi lưu vào DB

    // 4. Đặt thời gian hết hạn (10 phút)
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // 5. Lưu token đã hash vào CSDL
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?",
      [hashedToken, expires, user.user_id]
    );

    // 6. Tạo Reset URL
    // QUAN TRỌNG: Dùng URL của Frontend
    const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

    // 7. Gửi email
    const message = `
      <h1>Yêu cầu đặt lại mật khẩu</h1>
      <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link bên dưới để đặt lại mật khẩu của bạn:</p>
      <a href="${resetURL}" clicktracking="off">${resetURL}</a>
      <p>Link này sẽ hết hạn sau 10 phút.</p>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Yêu cầu đặt lại mật khẩu (hiệu lực 10 phút)",
      html: message,
    });

    return res.status(200).json({
      message: "Link đặt lại mật khẩu đã được gửi vào email của bạn.",
    });
  } catch (error) {
    try {
      await db.query(
        "UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE email = ?",
        [req.body.email]
      );
    } catch (err) {
      console.error("Failed to reset token on error:", err);
    }
  }
};

// ================= ĐẶT LẠI MẬT KHẨU =================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Hash token nhận được từ URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Tìm user bằng token đã hash VÀ kiểm tra thời gian hết hạn
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [hashedToken]
    );

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
    }

    const user = rows[0];

    // 3. Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Cập nhật mật khẩu mới và xóa token
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?",
      [hashedPassword, user.user_id]
    );

    return res.status(200).json({ message: "Đặt lại mật khẩu thành công." });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};
