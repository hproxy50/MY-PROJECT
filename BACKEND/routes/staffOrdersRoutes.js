// routes/staffOrders.js
import express from "express";
import {
  getPendingOrderDetails,
  getPendingOrdersForStaff,
  approveOrders,
  cancelOrders, 
} from "../controllers/staffOrdersController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// tất cả endpoint dưới đây require auth
router.get(
  "/orders",
  verifyToken,
  authorizeRoles("STAFF"),
  getPendingOrdersForStaff
);
router.get(
  "/orders/:id",
  verifyToken,
  authorizeRoles("STAFF"),
  getPendingOrderDetails
);
router.post(
  "/orders/approve",
  verifyToken,
  authorizeRoles("STAFF"),
  approveOrders
);

// BỔ SUNG ROUTE MỚI
router.post(
  "/orders/cancel",
  verifyToken,
  authorizeRoles("STAFF"),
  cancelOrders
);

export default router;