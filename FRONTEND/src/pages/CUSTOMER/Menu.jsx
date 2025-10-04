import { useEffect, useState } from "react";
import API from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/Menu.scss";
import Header from "../../components/Header";

export default function Menu() {

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
      alert("Order to cart success");
    } catch (err) {
      alert(err.response?.data?.message || "Cannot add to cart");
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className="body">
        <div className="body-product">
          <div className="sidebar-left">
            <h1>CATEGORY</h1>
            <div className="category">
              <a href="">PIZZA</a>
              <a href="">HAMBURGER</a>
              <a href="">BURRITO</a>
              <a href="">TACO</a>
              <a href="">DRINK</a>
              <a href="">PIZZA</a>
              <a href="">HAMBURGER</a>
              <a href="">BURRITO</a>
            </div>
          </div>
          <div className="menu">
            <h1>MENU</h1>
            <div className="menu-product">
              {menuItems.map((item) => (
              <div key={item.item_id} className="product">
                {item.image ? (
                    <img
                      src={`http://localhost:3000${item.image}`}
                      alt={item.name}
                    />
                  ) : (
                    "Không có ảnh"
                  )}
                <p>category</p>
                <h3 className="product-name">{item.name}</h3>
                <h4 className="product-price">{Number(item.price).toLocaleString('vi-VN')} đ</h4>
                <div className="product-button">
                  <button className="product-order" onClick={() => handleAddToCart(item.item_id)}>Order now</button>
                  <button className="product-detail">More Detail</button>
                </div>
              </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
