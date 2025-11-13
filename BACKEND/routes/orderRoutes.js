// routes/orders.js
console.log("--- ĐANG TẢI FILE: routes/orderRoutes.js (BẢN CHÍNH XÁC) ---");
import express from "express";
import { verifyToken} from "../middlewares/authMiddlewares.js";
import { getCheckoutInfo, confirmOrder, applyPromotion, createPayOSPayment, payOSWebhook, confirmOrderQR, cancelOrderByUser} from "../controllers/ordersController.js";
const router = express.Router();

// THÊM MIDDLEWARE LOG NÀY VÀO
router.use((req, res, next) => {
  console.log(`--- REQUEST ĐÃ ĐẾN orderRoutes.js: ${req.method} ${req.path} ---`);
  next();
});

router.get("/:id/checkout",verifyToken, getCheckoutInfo);
router.post("/:id/confirm",verifyToken, confirmOrder);
router.post("/:id/confirmQR",verifyToken, confirmOrderQR);
router.post("/:id/apply-promo", verifyToken, applyPromotion);


router.post("/:id/payment-payos", verifyToken, createPayOSPayment);

router.post("/:id/cancel-by-user", verifyToken, cancelOrderByUser);

router.post("/payos/webhook", payOSWebhook);



export default router;