// routes/staffOrders.js
import express from "express";
import { getPendingOrderDetails, getPendingOrdersForStaff, approveOrders } from "../controllers/staffOrdersController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// tất cả endpoint dưới đây require auth (middleware đảm bảo req.user)
router.get("/orders", verifyToken,authorizeRoles("STAFF"), getPendingOrdersForStaff); // ?status=PENDING,PAID
router.get("/orders/:id", verifyToken, authorizeRoles("STAFF"), getPendingOrderDetails); // body: { newStatus: "PREPARING" }
router.post("/orders/approve",verifyToken, authorizeRoles("STAFF"), approveOrders); // body: { orderIds, newStatus }

export default router;
