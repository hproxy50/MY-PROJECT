import express from "express";
import { getDeliveryOrderDetails, getDeliveryOrdersForShipper, completeOrders, cancelOrdersForShipper } from "../controllers/shipperOderController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.get("/orders", verifyToken,authorizeRoles("RECEPTIONIST"), getDeliveryOrdersForShipper);
router.get("/orders/:id", verifyToken, authorizeRoles("RECEPTIONIST"), getDeliveryOrderDetails);
router.post("/orders/complete",verifyToken, authorizeRoles("RECEPTIONIST"), completeOrders);
router.post("/orders/cancel", verifyToken, authorizeRoles("RECEPTIONIST"), cancelOrdersForShipper);

export default router;
