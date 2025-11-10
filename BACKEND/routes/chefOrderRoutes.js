// routes/chefOrdersRoutes.js
import express from "express";
import { getPreparingOrdersForChef, approveOrdersForChef } from "../controllers/chefOrderController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Yêu cầu token và role = CHEF
router.get("/orders/preparing", verifyToken, authorizeRoles("CHEF"), getPreparingOrdersForChef);
router.patch("/orders/approve", verifyToken, authorizeRoles("CHEF"), approveOrdersForChef);

export default router;
