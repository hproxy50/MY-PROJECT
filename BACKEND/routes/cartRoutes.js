import express from "express";
import {
  createOrder, addItemToOrder, getOrderById, updateOrderItem, deleteOrderItem,
} from "../controllers/cartController.js";
import { verifyToken} from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Tạo giỏ hàng mới
router.post("/",verifyToken, createOrder);

// Lấy chi tiết giỏ hàng
router.get("/:id",verifyToken, getOrderById);

// Thêm món vào giỏ
router.post("/items",verifyToken, addItemToOrder);

// Cập nhật số lượng món
router.put("/items/:id",verifyToken, updateOrderItem);

// Xóa món khỏi giỏ
router.delete("/items/:id",verifyToken, deleteOrderItem);

export default router;
