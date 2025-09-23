import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const branchId = 2; // tạm fix, hoặc lấy từ localStorage
    API.get(`/menu?branch_id=${branchId}`).then((res) => setItems(res.data));
  }, []);

  const addToCart = async (itemId) => {
    try {
      const orderId = localStorage.getItem("order_id");
      await API.post("/orders/items", { order_id, item_id, quantity: 1 });
      alert("Đã thêm vào giỏ");
    } catch (err) {
      alert(err.response?.data?.message || "Thêm thất bại");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Menu</h2>
      <div className="row">
        {items.map((item) => (
          <div className="col-md-3" key={item.item_id}>
            <div className="card mb-3">
              <div className="card-body">
                <h5>{item.name}</h5>
                <p>{item.price} đ</p>
                <button
                  className="btn btn-primary"
                  onClick={() => addToCart(item.item_id)}
                >
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn btn-warning mt-3"
        onClick={() => navigate("/cart")}
      >
        Xem giỏ hàng
      </button>
    </div>
  );
}
