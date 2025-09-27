import express from "express";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";
import {createImport, addItemToImport, getImportById, updateImportItem, deleteImportItem, completeImport } from "../controllers/importController.js"

const router = express.Router();

router.post("/", verifyToken, authorizeRoles("STAFF", "ADMIN"), createImport);
router.get("/:id", verifyToken, authorizeRoles("STAFF", "ADMIN"), getImportById);
router.post("/add", verifyToken, authorizeRoles("STAFF", "ADMIN"), addItemToImport);
router.put("/update/:id",verifyToken, authorizeRoles("STAFF", "ADMIN"), updateImportItem );
router.delete("/delete/:id",verifyToken, authorizeRoles("STAFF", "ADMIN"), deleteImportItem);
router.put("/confirm/:id",verifyToken, authorizeRoles("STAFF", "ADMIN"), completeImport);

export default router;