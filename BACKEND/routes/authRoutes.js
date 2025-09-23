// routes/authRoutes.js
import express from "express";
import { register, login } from "../controllers/authController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Đăng ký
router.post("/register", register);

// Đăng nhập
router.post("/login", login);

// Ví dụ: route test chỉ cho ADMIN truy cập
router.get("/admin-only", verifyToken, authorizeRoles("ADMIN"), (req, res) => {
  res.json({ message: "Xin chào ADMIN" });
});

// Ví dụ: route test cho STAFF
router.get("/staff-only", verifyToken, authorizeRoles("STAFF"), (req, res) => {
  res.json({ message: "Xin chào STAFF chi nhánh " + req.user.branch_id});
});

export default router;
