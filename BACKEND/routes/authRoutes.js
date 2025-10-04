// routes/authRoutes.js
import express from "express";
import { register, login } from "../controllers/authController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();


router.post("/register", register);


router.post("/login", login);


router.get("/admin-only", verifyToken, authorizeRoles("ADMIN"), (req, res) => {
  res.json({ message: "Xin chào ADMIN" });
});


router.get("/staff-only", verifyToken, authorizeRoles("STAFF"), (req, res) => {
  res.json({ message: "Xin chào STAFF chi nhánh " + req.user.branch_id});
});

export default router;
