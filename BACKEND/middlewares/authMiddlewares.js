// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// Middleware kiểm tra người dùng đã đăng nhập chưa
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

  jwt.verify(token, "secret_key", (err, user) => {
    if (err) return res.status(403).json({ message: "Token không hợp lệ" });
    req.user = user; // gắn thông tin user vào request
    next();
  });
};

// Middleware kiểm tra role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  };
};
