import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import Header from "../../components/Header";

export default function CartPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchCart = async () => {
    try {
      const res = await API.get(`/cart/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [orderId]);

  const handleUpdateQty = async (orderItemId, qty) => {
    try {
      await API.put(
        `/cart/items/${orderItemId}`,
        { quantity: qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (orderItemId) => {
    try {
      await API.delete(`/cart/items/${orderItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể cập nhật số lượng");
      console.error(err);
    }
  };

  return (
    <div className="container mt-4">
      <h3>🛒 Giỏ hàng</h3>
      {order ? (
        <>
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
            <button
              className="btn btn-primary ms-3"
              onClick={() => navigate(`/checkout/${order.order_id}`)}
            >
              💳 Thanh toán
            </button>
          </h4>
          <button
            className="btn btn-secondary me-3"
            onClick={() =>
              navigate(`/menu/${order.branch_id}/${order.order_id}`)
            }
          >
            ⬅️ Quay lại sản phẩm
          </button>
        </>
      ) : (
        <p>Đang tải giỏ hàng...</p>
      )}
    </div>
  );
}
