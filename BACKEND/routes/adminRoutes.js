// routes/adminRoutes.js
import express from "express";
import { getAllUsers, getUserById, deleteUser, createCustomer, updateCustomer, createStaff, updateStaff } from "../controllers/adminController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.use(verifyToken, authorizeRoles("ADMIN"));

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);

router.post("/users/customer", createCustomer);
router.put("/users/customer/:id", updateCustomer);

router.post("/users/staff", createStaff);
router.put("/users/staff/:id", updateStaff);

router.delete("/users/:id", deleteUser);

export default router;
