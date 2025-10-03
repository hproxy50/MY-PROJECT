import { useState } from "react";
import API from "../../api/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });
      // Lưu token và user
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Đăng nhập thành công");
      // Điều hướng theo role
      const role = res.data.user.role;
      if (role === "STAFF") {
        navigate("/staff/menu-crud");
      } else if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "CUSTOMER") {
        navigate("/branches");
      } else {
        setError("Không xác định được vai trò người dùng");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng nhập");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Đăng nhập</h2>
      <form
        onSubmit={handleLogin}
        className="mx-auto"
        style={{ maxWidth: "400px" }}
      >
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Email:</label>
          <input
            type="email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Mật khẩu:</label>
          <input
            type="password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Đăng nhập
        </button>

        <p className="mt-3 text-center">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </form>
    </div>
  );
}
