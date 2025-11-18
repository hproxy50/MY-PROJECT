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
  const { token } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post(`/auth/reset-password/${token}`, { password });
      setMessage(res.data.message + "You will be redirected to the login page...");
      
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Reset new password</h2>
      <form
        onSubmit={handleSubmit}
        className="mx-auto"
        style={{ maxWidth: "400px" }}
      >
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label">New password:</label>
          <input
            type="password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm password:</label>
          <input
            type="password"
            className="form-control"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading || message}>
          {loading ? "Saving..." : "Save password"}
        </button>

         {message && (
           <p className="mt-3 text-center">
             <Link to="/login">Go to Sign In Now</Link>
           </p>
         )}
      </form>
    </div>
  );
}