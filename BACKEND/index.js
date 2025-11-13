// index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";
import staffOrderRoutes from "./routes/staffOrdersRoutes.js";
import chefOrderRoutes from "./routes/chefOrderRoutes.js";
import shipperOrderRoutes from "./routes/shipperOrderRoutes.js";
import { upload } from "./middlewares/uploadMiddlewares.js";
import cusHistoryRoutes from "./routes/cusHistoryRoutes.js"
import ratingRoutes from "./routes/ratingRoutes.js"

const app = express();

import cors from "cors";

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


app.use("/uploads", express.static("uploads"));

app.use(express.json());

// simple health
app.get("/", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/auth", authRoutes);

app.use("/admin", adminRoutes);

app.use("/menu", menuRoutes);

app.use("/cart", cartRoutes);

app.use("/category", categoryRoutes);

app.use("/branch", branchRoutes);

app.use("/import", importRoutes);

app.use("/orders", orderRoutes);

app.use("/promotion", promoRoutes);

app.use("/staff", staffOrderRoutes);

app.use("/chef", chefOrderRoutes);

app.use("/shipper", shipperOrderRoutes);

app.use("/history", cusHistoryRoutes);

app.use("/ratings", ratingRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
