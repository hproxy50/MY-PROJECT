// seedAdmin.js
import pool from "./config/db.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");

async function createStaff() {
  try {
    const email = "Staff5@gmail.com";
    const name = "Staff5";
    const password = "123"; // sau khi chạy hãy đổi mật khẩu
    const phone = "0543217890";
    const branch_id = 5;

    const [exists] = await pool.execute("SELECT user_id FROM users WHERE email = ?", [email]);
    if (exists.length) {
      console.log("Staff already exists");
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, phone, role, branch_id) VALUES (?, ?, ?, ?, 'STAFF', ?)",
      [name, email, hashed, phone, branch_id]
    );
    console.log("Staff created with id:", result.insertId);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createStaff();
