import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CheckoutPage() {
  const { orderId } = useParams(); // ✅

  const [checkoutData, setCheckoutData] = useState(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    order_type: "DINE_IN",
    scheduled_time: "",
    delivery_address: "",
    payment_method: "CASH",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get(`/orders/${orderId}/checkout`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCheckoutData(res.data);
        setForm((f) => ({
          ...f,
          customer_name: res.data.user.name,
          customer_phone: res.data.user.phone,
        }));
      } catch (err) {
        console.error("Lỗi khi gọi API /checkout:", err);
        if (err.response) {
          console.error("Lỗi:", err.message);
        }
      }
    };

    if (orderId) fetchData(); // ✅ tránh gọi API nếu chưa có orderId
  }, [orderId, token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleConfirm = async () => {
    try {
      await API.post(`/orders/${orderId}/confirm`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Đặt đơn thành công!");
      window.location.href = "/"; // hoặc chuyển sang trang "đơn hàng của tôi"
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi đặt đơn");
    }
  };

  if (!checkoutData) return <p>Đang tải...</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">🧾 Thanh toán</h2>

      {/* Thông tin người đặt */}
      <div className="card mb-3 p-3">
        <h5>Thông tin người đặt</h5>
        <div className="mb-2">
          <label>Tên</label>
          <input
            type="text"
            className="form-control"
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label>Số điện thoại</label>
          <input
            type="text"
            className="form-control"
            name="customer_phone"
            value={form.customer_phone}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Thông tin chi nhánh */}
      <div className="card mb-3 p-3">
        <h5>Chi nhánh</h5>
        <p>
          <b>{checkoutData.branch.name}</b> - {checkoutData.branch.address}
        </p>
      </div>

      {/* Danh sách món */}
      <div className="card mb-3 p-3">
        <h5>Món ăn</h5>
        <table className="table">
          <thead>
            <tr>
              <th>Món</th>
              <th>Số lượng</th>
              <th>Tổng</th>
            </tr>
          </thead>
          <tbody>
            {checkoutData.items.map((i) => (
              <tr key={i.order_item_id}>
                <td>{i.name}</td>
                <td>{i.quantity}</td>
                <td>{i.line_total.toLocaleString()} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h5 className="text-end text-danger">
          Tổng: {checkoutData.total_price.toLocaleString()} đ
        </h5>
      </div>

      {/* Loại đơn hàng */}
      <div className="card mb-3 p-3">
        <h5>Phương thức đặt đơn</h5>
        <select
          name="order_type"
          className="form-select"
          value={form.order_type}
          onChange={handleChange}
        >
          <option value="DINE_IN">Ăn tại chỗ</option>
          <option value="TAKEAWAY">Mang đi</option>
          <option value="DELIVERY">Giao tận nơi</option>
        </select>

        {["DINE_IN", "TAKEAWAY"].includes(form.order_type) && (
          <div className="mt-2">
            <label>Chọn giờ</label>
            <input
              type="datetime-local"
              name="scheduled_time"
              className="form-control"
              value={form.scheduled_time}
              onChange={handleChange}
            />
          </div>
        )}

        {form.order_type === "DELIVERY" && (
          <div className="mt-2">
            <label>Địa chỉ giao hàng</label>
            <textarea
              className="form-control"
              name="delivery_address"
              value={form.delivery_address}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {/* Thanh toán */}
      <div className="card mb-3 p-3">
        <h5>Phương thức thanh toán</h5>
        <select
          name="payment_method"
          className="form-select"
          value={form.payment_method}
          onChange={handleChange}
        >
          <option value="CASH">Tiền mặt</option>
          <option value="QR">QR Code (chưa hỗ trợ)</option>
        </select>
      </div>

      <button className="btn btn-success w-100" onClick={handleConfirm}>
        ✅ Xác nhận đặt đơn
      </button>
    </div>
  );
}
