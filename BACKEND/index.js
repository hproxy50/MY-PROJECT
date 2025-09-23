// index.js
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";



const app = express();

import cors from "cors";

app.use(cors({
  origin: "http://localhost:5173", // FE React
  credentials: true
}));


app.use(express.json());

// simple health
app.get("/", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/auth", authRoutes);

app.use("/admin", adminRoutes);

app.use("/menu", menuRoutes);

app.use("/orders", orderRoutes);

// error handler (basic)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
