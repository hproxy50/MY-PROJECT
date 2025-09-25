import express from "express";
import { getAllBranch, createBranch, updateBranch, deleteBranch } from "../controllers/adminController.js"; 
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();
router.get("/",verifyToken, getAllBranch);
router.post("/add",verifyToken, authorizeRoles("ADMIN"), createBranch);
router.put("/update/:id",verifyToken, authorizeRoles("ADMIN"), updateBranch);
router.delete("/delete/:id", verifyToken, authorizeRoles("ADMIN"), deleteBranch);

export default router;