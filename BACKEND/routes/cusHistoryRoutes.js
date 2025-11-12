import express from "express";
import { getOrderHistory, buyAgain } from "../controllers/cusHistory.js";
import { verifyToken} from "../middlewares/authMiddlewares.js";

const router = express.Router();


router.get("/", verifyToken, getOrderHistory);
router.post("/buy-again", verifyToken, buyAgain);

export default router;
