// routes/staffOrders.js
import express from "express";
import { getOrdersForStaff, updateOrderStatus, bulkUpdateOrderStatus } from "../controllers/staffOrdersController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// tất cả endpoint dưới đây require auth (middleware đảm bảo req.user)
router.get("/orders", verifyToken,authorizeRoles("STAFF"), getOrdersForStaff); // ?status=PENDING,PAID
router.patch("/orders/:orderId/status", verifyToken,authorizeRoles("STAFF"), updateOrderStatus); // body: { newStatus: "PREPARING" }
router.patch("/orders/bulk/status", verifyToken,authorizeRoles("STAFF"), bulkUpdateOrderStatus); // body: { orderIds, newStatus }

export default router;
