import express from "express";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";
import { createCategory, getCategory, getCategoryId, updateCategory, deleteCategory } from "../controllers/categoryController.js";
const router = express.Router();

// Staff chỉ CRUD trong chi nhánh của họ, Admin CRUD tất cả
router.post("/create", verifyToken, authorizeRoles("STAFF", "ADMIN"), createCategory);

router.get("/", verifyToken, authorizeRoles("STAFF", "ADMIN","CUSTOMER"), getCategory);

router.get("/:id", verifyToken, authorizeRoles("STAFF", "ADMIN", "CUSTOMER"), getCategoryId);

router.put("/update/:id", verifyToken, authorizeRoles("STAFF", "ADMIN"), updateCategory);

router.delete("/delete/:id", verifyToken, authorizeRoles("STAFF", "ADMIN"), deleteCategory);

export default router;