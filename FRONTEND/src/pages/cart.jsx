import { useEffect, useState } from "react";
import API from "../api/api";

export default function Cart() {
  const [order, setOrder] = useState(null);

  const fetchCart = async () => {
    const orderId = localStorage.getItem("order_id");
    const res = await API.get(`/orders/${orderId}`);
    setOrder(res.data);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQty = async (orderItemId, qty) => {
    await API.put(`/orders/items/${orderItemId}`, { quantity: qty });
    fetchCart();
  };

  const deleteItem = async (orderItemId) => {
    await API.delete(`/orders/items/${orderItemId}`);
    fetchCart();
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <h2>Giỏ hàng</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Tên món</th>
            <th>Số lượng</th>
            <th>Giá</th>
            <th>Tổng</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it) => (
            <tr key={it.order_item_id}>
              <td>{it.name}</td>
              <td>
                <input
                  type="number"
                  value={it.quantity}
                  onChange={(e) =>
                    updateQty(it.order_item_id, Number(e.target.value))
                  }
                  style={{ width: "60px" }}
                />
              </td>
              <td>{it.unit_price}</td>
              <td>{it.line_total}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteItem(it.order_item_id)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Tổng cộng: {order.total_price} đ</h4>
    </div>
  );
}
