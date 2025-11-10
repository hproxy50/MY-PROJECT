// routes/staffOrders.js
import express from "express";
import { getDeliveryOrderDetails, getDeliveryOrdersForShipper, completeOrders } from "../controllers/shipperOderController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.get("/orders", verifyToken,authorizeRoles("SHIPPER"), getDeliveryOrdersForShipper);
router.get("/orders/:id", verifyToken, authorizeRoles("SHIPPER"), getDeliveryOrderDetails);
router.post("/orders/complete",verifyToken, authorizeRoles("SHIPPER"), completeOrders);

export default router;
