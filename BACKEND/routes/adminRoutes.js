// routes/adminRoutes.js
import express from "express";
import { getAllUsers, getUserById, deleteUser, createCustomer, updateCustomer, createStaff, updateStaff, createBranch, getAllBranch, updateBranch, deleteBranch } from "../controllers/adminController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Tất cả route này chỉ cho ADMIN
router.use(verifyToken, authorizeRoles("ADMIN"));

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);

router.post("/users/customer", createCustomer);
router.put("/users/customer/:id", updateCustomer);

router.post("/users/staff", createStaff);
router.put("/users/staff/:id", updateStaff);

router.delete("/users/:id", deleteUser);

router.get("/branch",getAllBranch)
router.post("/branch/add", createBranch);
router.put("/branch/update/:id",updateBranch);
router.delete("/branch/delete/:id", deleteBranch);

export default router;
