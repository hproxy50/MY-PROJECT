import { useState } from "react";
import API from "../../api/api"; 
import { useNavigate, Link } from "react-router-dom";
import "../../css/Login.scss";
import loginImage from "../../assets/image/login.png";

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

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login successful");
      const role = res.data.user.role;
      if (role === "STAFF") {
        navigate("/staff/orders");
      } else if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "CUSTOMER") {
        navigate("/branches");
      } else if (role === "CHEF") {
        navigate("/chef");
      } else if (role === "SHIPPER") {
        navigate("/shipper");
      } else {
        setError("User role not determined");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login error");
    }
  };

  return (
    <div className="Login">
      <div className="Login-body">
        <div className="Login-body-left">
          <img src={loginImage} alt="IMAGE" />
        </div>
        <div className="Login-body-right">
          <div className="Login-body-right-form">
            <h1>Login to eat!!!</h1>

            <form onSubmit={handleLogin}>
              <div className="Login-body-right-form-input">
                <input
                  className="Login-body-right-form-input-email"
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="Login-body-right-form-input-password"
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Link
                className="Login-body-right-form-forgot"
                to="/forgot-password"
                // style={{ display: "block", textDecoration: "none" }} 
              >
                Forget password?
              </Link>

              <button type="submit" className="Login-body-right-form-login">
                Login
              </button>
            </form>
            <p className="Login-body-right-register">
              No account yet? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
