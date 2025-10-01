// routes/promoRoutes.js
import express from "express";
import { getPromotionById, getPromotions, createPromotion, updatePromotion, deletePromotion  } from "../controllers/promoController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.get("/",verifyToken, getPromotions);
router.get("/:id", verifyToken, getPromotionById)
router.post("/add",verifyToken, authorizeRoles("ADMIN"), createPromotion );
router.put("/update/:id",verifyToken, authorizeRoles("ADMIN"), updatePromotion );
router.delete("/delete/:id", verifyToken, authorizeRoles("ADMIN"), deletePromotion );

export default router;