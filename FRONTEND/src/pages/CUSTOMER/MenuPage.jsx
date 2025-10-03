import { useEffect, useState } from "react";
import API from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../../components/Header.jsx";

export default function MenuPage() {
  const { branchId, orderId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuRes = await API.get(`/menu?branch_id=${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMenuItems(menuRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMenu();
  }, [branchId, token]);

  const handleAddToCart = async (itemId) => {
    try {
      await API.post(
        "/cart/items",
        { order_id: orderId, item_id: itemId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Đã thêm vào giỏ");
    } catch (err) {
      alert(err.response?.data?.message || "Không thể thêm vào giỏ hàng");
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className="container mt-4">
        <h3 className="mb-3">📋 Danh sách món ăn</h3>
        <div className="row">
          {menuItems.map((item) => (
            <div key={item.item_id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <img
                  src={item.image}
                  className="card-img-top"
                  alt={item.name}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text">{item.description}</p>
                  <p className="fw-bold text-danger">
                    {item.price.toLocaleString()} đ
                  </p>
                  <button
                    className="btn btn-success mt-auto"
                    onClick={() => handleAddToCart(item.item_id)}
                  >
                    ➕ Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-end">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`/cart/${orderId}`)}
          >
            🛒 Xem giỏ hàng
          </button>
        </div>
      </div>
    </>
  );
}
