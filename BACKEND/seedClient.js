// seedAdmin.js
import pool from "./config/db.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");

async function createCustomer() {
  try {
    const email = "Customer2@gmail.com";
    const name = "Customer2";
    const password = "123"; 
    const phone = null;

    const [exists] = await pool.execute("SELECT user_id FROM users WHERE email = ?", [email]);
    if (exists.length) {
      console.log("Customer already exists");
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, phone, role, branch_id) VALUES (?, ?, ?, ?, 'CUSTOMER', NULL)",
      [name, email, hashed, phone]
    );
    console.log("Customer created with id:", result.insertId);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createCustomer();
