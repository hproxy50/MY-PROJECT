// components/Auth/ResetPassword.jsx
import { useState } from "react";
import API from "../api/api.js";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { token } = useParams(); // Lấy token từ URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post(`/auth/reset-password/${token}`, { password });
      setMessage(res.data.message + " Bạn sẽ được chuyển về trang đăng nhập...");
      
      // Chờ vài giây rồi chuyển hướng
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || "Lỗi server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Đặt lại mật khẩu mới</h2>
      <form
        onSubmit={handleSubmit}
        className="mx-auto"
        style={{ maxWidth: "400px" }}
      >
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Mật khẩu mới:</label>
          <input
            type="password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Xác nhận mật khẩu:</label>
          <input
            type="password"
            className="form-control"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading || message}>
          {loading ? "Đang lưu..." : "Lưu mật khẩu"}
        </button>

         {message && (
           <p className="mt-3 text-center">
             <Link to="/login">Đi đến Đăng nhập ngay</Link>
           </p>
         )}
      </form>
    </div>
  );
}