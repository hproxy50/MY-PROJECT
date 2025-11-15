import express from "express";
import {verifyToken,authorizeRoles} from "../middlewares/authMiddlewares.js";
import { getStaffDashboardMetrics, getStaffDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();


router.get("/metrics", verifyToken, authorizeRoles("STAFF"), getStaffDashboardMetrics);

  router.get("/summary",verifyToken, authorizeRoles("STAFF"), getStaffDashboardSummary);

export default router;