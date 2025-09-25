import { useEffect, useState } from "react";
import API from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function MenuPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [order, setOrder] = useState(null);

  // Lấy token từ localStorage
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

    setSelectedBranch(branchId);
    try {
      // Gọi API tạo hoặc lấy giỏ hàng hiện có
      const orderRes = await API.post(
        "/orders",
        { branch_id: branchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderId = orderRes.data.order_id;

      // Lấy chi tiết giỏ hàng (bao gồm items)
      const orderDetailRes = await API.get(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(orderDetailRes.data);

      // Lấy menu theo chi nhánh
      const menuRes = await API.get(`/menu?branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems(menuRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Thêm món vào giỏ
  const handleAddToCart = async (itemId) => {
    try {
      await API.post(
        "/orders/items",
        { order_id: order.order_id, item_id: itemId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh giỏ
      const res = await API.get(`/orders/${order.order_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể thêm vào giỏ hàng");
      console.error(err);
    }
  };

  // Cập nhật số lượng
  const handleUpdateQty = async (orderItemId, qty) => {
    try {
      await API.put(
        `/orders/items/${orderItemId}`,
        { quantity: qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await API.get(`/orders/${order.order_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Xóa món
  const handleDeleteItem = async (orderItemId) => {
    try {
      await API.delete(`/orders/items/${orderItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await API.get(`/orders/${order.order_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể cập nhật số lượng");
      console.error(err);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">🍽 Chọn chi nhánh</h2>
      <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
        {branches.map((b) => (
          <button
            key={b.branch_id}
            className={`btn btn-${
              selectedBranch === b.branch_id ? "primary" : "outline-primary"
            }`}
            onClick={() => handleSelectBranch(b.branch_id)}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Hiển thị menu */}
      {menuItems.length > 0 && (
        <>
          <h3 className="mb-3">📋 Danh sách món ăn</h3>
          <div className="row">
            {menuItems.map((item) => (
              <div key={item.item_id} className="col-md-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={item.image || "https://via.placeholder.com/150"}
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
        </>
      )}

      {/* Hiển thị giỏ hàng */}
      {order && (
        <div className="mt-5">
          <h3>🛒 Giỏ hàng</h3>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Món</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Tổng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.order_item_id}>
                  <td>{item.name}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateQty(item.order_item_id, e.target.value)
                      }
                      className="form-control"
                      style={{ width: "80px" }}
                    />
                  </td>
                  <td>{item.unit_price.toLocaleString()} đ</td>
                  <td>{item.line_total.toLocaleString()} đ</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteItem(item.order_item_id)}
                    >
                      ❌ Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 className="text-end">
            Tổng tiền:{" "}
            <span className="text-danger fw-bold">
              {order.total_price?.toLocaleString()} đ
            </span>
          </h4>
        </div>
      )}
    </div>
  );
}
