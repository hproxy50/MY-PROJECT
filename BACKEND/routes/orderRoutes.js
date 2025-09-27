// routes/orders.js
import express from "express";
import { verifyToken} from "../middlewares/authMiddlewares.js";
import { getCheckoutInfo, confirmOrder } from "../controllers/ordersController.js";
const router = express.Router();

router.get("/:id/checkout",verifyToken, getCheckoutInfo);
router.post("/:id/confirm",verifyToken, confirmOrder);

export default router;