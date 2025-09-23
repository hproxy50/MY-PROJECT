import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function BranchSelect() {
  const [branchId, setBranchId] = useState("");
  const navigate = useNavigate();

  const handleSelect = async () => {
    try {
  const res = await API.post("/orders", { branch_id: branchId }, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}`}});
      const orderId = res.data.order_id;
      localStorage.setItem("order_id", orderId);
      navigate("/menu");
    } catch (err) {
      alert(err.response?.data?.message || "Tạo giỏ hàng thất bại");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Chọn cơ sở</h2>
      <input
        className="form-control mb-2"
        placeholder="Nhập branch_id"
        value={branchId}
        onChange={(e) => setBranchId(e.target.value)}
      />
      <button className="btn btn-success" onClick={handleSelect}>
        Vào menu
      </button>
    </div>
  );
}
