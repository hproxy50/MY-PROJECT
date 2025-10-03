import { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
export default function BranchSelectPage() {
  const [branches, setBranches] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Load danh sách chi nhánh
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await API.get("/branch", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBranches();
  }, [token]);

  // Khi chọn chi nhánh
  const handleSelectBranch = async (branchId) => {
    try {
      const orderRes = await API.post(
        "/cart",
        { branch_id: branchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderId = orderRes.data.order_id;

      navigate(`/menu/${branchId}/${orderId}`);
    } catch (err) {
      console.error(err);
      alert("Không thể chọn chi nhánh");
    }
  };

  return (
      <div className="container mt-4">
        <h2 className="mb-4 text-center">🍽 Chọn chi nhánh</h2>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {branches.map((b) => (
            <button
              key={b.branch_id}
              className="btn btn-outline-primary"
              onClick={() => handleSelectBranch(b.branch_id)}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>
  );
}
