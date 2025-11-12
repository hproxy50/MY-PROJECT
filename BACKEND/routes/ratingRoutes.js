// routes/ratingRoutes.js
import express from "express";
import { createRating, getRatingsByBranch, checkRated, updateRating } from "../controllers/ratingController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/", verifyToken,  createRating);
router.put("/:order_id", verifyToken, updateRating);
router.get("/branch/:branch_id", verifyToken, getRatingsByBranch);
router.get("/check/:order_id", verifyToken, checkRated);

export default router;