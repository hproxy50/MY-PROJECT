// seedAdmin.js
import pool from "./config/db.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");

async function createAdmin() {
  try {
    const email = "admin@restaurant.com";
    const name = "Super Admin";
    const password = "Admin@123"; // sau khi chạy hãy đổi mật khẩu
    const phone = null;

    const [exists] = await pool.execute("SELECT user_id FROM users WHERE email = ?", [email]);
    if (exists.length) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, phone, role, branch_id) VALUES (?, ?, ?, ?, 'ADMIN', NULL)",
      [name, email, hashed, phone]
    );
    console.log("Admin created with id:", result.insertId);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
