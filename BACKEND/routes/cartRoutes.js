import express from "express";
import {
  createOrder, addItemToOrder, getOrderById, updateOrderItem, deleteOrderItem,
} from "../controllers/cartController.js";
import { verifyToken} from "../middlewares/authMiddlewares.js";

const router = express.Router();


router.post("/",verifyToken, createOrder);


router.get("/:id",verifyToken, getOrderById);


router.post("/items",verifyToken, addItemToOrder);


router.put("/items/:id",verifyToken, updateOrderItem);


router.delete("/items/:id",verifyToken, deleteOrderItem);

export default router;
