import express from "express";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";
import { upload } from "../middlewares/uploadMiddlewares.js";
import {createMenuItem, getMenuItems, getMenuItemById, updateMenuItem, deleteMenuItem} from "../controllers/menuController.js";
const router = express.Router();


router.post("/create", verifyToken,upload.single("image"), authorizeRoles("STAFF", "ADMIN"), createMenuItem);

router.get("/", verifyToken, authorizeRoles("STAFF", "ADMIN","CUSTOMER"), getMenuItems);

router.get("/:id", verifyToken, authorizeRoles("STAFF", "ADMIN", "CUSTOMER"), getMenuItemById);

router.put("/update/:id", verifyToken,upload.single("image"), authorizeRoles("STAFF", "ADMIN"), updateMenuItem);

router.delete("/delete/:id", verifyToken, authorizeRoles("STAFF", "ADMIN"), deleteMenuItem);

export default router;