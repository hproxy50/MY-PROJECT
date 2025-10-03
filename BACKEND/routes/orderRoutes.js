// routes/orders.js
import express from "express";
import { verifyToken} from "../middlewares/authMiddlewares.js";
import { getCheckoutInfo, confirmOrder, applyPromotion, createPayOSPayment, payOSWebhook} from "../controllers/ordersController.js";
const router = express.Router();

router.get("/:id/checkout",verifyToken, getCheckoutInfo);
router.post("/:id/confirm",verifyToken, confirmOrder);
router.post("/:id/confirmQR",verifyToken, confirmOrder);
router.post("/:id/apply-promo", verifyToken, applyPromotion);

// Tạo link thanh toán PayOS
router.post("/:id/payment-payos", verifyToken, createPayOSPayment);

// PayOS callback (webhook) — không verifyToken vì PayOS gọi trực tiếp
router.post("/payos/webhook", payOSWebhook);

export default router;