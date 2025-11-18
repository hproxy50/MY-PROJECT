import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";


export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    // if (!passwordRegex.test(password)) {
    //   return res.status(400).json({
    //     message: "Password must contain at least 8 characters, including 1 number and 1 special character (!@#$%^&*)"
    //   });
    // }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, phone, role, created_at) VALUES (?, ?, ?, ?, 'CUSTOMER', NOW())",
      [name, email, hashedPassword, phone]
    );

    return res.status(201).json({ message: "Account registration successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Incorrect email or password" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Incorrect email or password" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, branch_id: user.branch_id },
      "secret_key",
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(200)
        .json({ message: "If email exists, reset link will be sent" });
    }

    const user = rows[0];

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?",
      [hashedToken, expires, user.user_id]
    );

    const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `
      <h1>Password reset request</h1>
      <p>You have requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetURL}" clicktracking="off">${resetURL}</a>
      <p>This link will expire in 10 minutes.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Password reset request valid for 10 minutes",
      html: message,
    });

    return res.status(200).json({
      message: "Password reset link has been sent to your email",
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

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [hashedToken]
    );

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Token is invalid or expired" });
    }

    const user = rows[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?",
      [hashedPassword, user.user_id]
    );

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
