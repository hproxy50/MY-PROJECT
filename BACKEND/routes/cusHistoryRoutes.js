import express from "express";
import { getOrderHistory , cancelOrder} from "../controllers/cusHistory.js";
import { verifyToken} from "../middlewares/authMiddlewares.js";

const router = express.Router();


router.get("/", verifyToken, getOrderHistory);
router.put("/:orderId/cancel", verifyToken, cancelOrder);
// router.post("/buy-again", verifyToken, buyAgain);

export default router;
