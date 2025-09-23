// db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "190903",
  database: process.env.DB_NAME || "restaurant",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
