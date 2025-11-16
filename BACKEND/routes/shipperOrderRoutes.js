import express from "express";
import { getDeliveryOrderDetails, getDeliveryOrdersForShipper, completeOrders, cancelOrdersForShipper } from "../controllers/shipperOderController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.get("/orders", verifyToken,authorizeRoles("SHIPPER"), getDeliveryOrdersForShipper);
router.get("/orders/:id", verifyToken, authorizeRoles("SHIPPER"), getDeliveryOrderDetails);
router.post("/orders/complete",verifyToken, authorizeRoles("SHIPPER"), completeOrders);
router.post("/orders/cancel", verifyToken, authorizeRoles("SHIPPER"), cancelOrdersForShipper);

export default router;
