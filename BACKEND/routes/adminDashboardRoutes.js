import express from "express";
import { verifyToken, authorizeRoles} from "../middlewares/authMiddlewares.js";
import { getAdminDashboardSummary } from "../controllers/adminDashboardController.js";

const router = express.Router();

router.get("/summary", verifyToken, authorizeRoles("ADMIN"), getAdminDashboardSummary);

export default router;