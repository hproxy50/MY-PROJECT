import React, { useEffect, useState } from "react";
import API from "../../api/api";
import OrdersTable from "./OrdersTable";

export default function StaffPreparingOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const token = localStorage.getItem("token");

  const fetchOrders = async () => {
    try {
      const res = await API.get(`/staff/orders?status=PREPARING,COMPLETED`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
      alert("Không tải được orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const handleSingleToCompleted = async (orderId) => {
    if (!window.confirm("Xác nhận hoàn thành đơn (COMPLETED)?")) return;
    try {
      await API.patch(`/staff/orders/${orderId}/status`, { newStatus: "COMPLETED" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật");
    }
  };

  const handleBulkToCompleted = async () => {
    if (selected.size === 0) return alert("Chưa chọn đơn nào");
    if (!window.confirm(`Hoàn thành ${selected.size} đơn?`)) return;
    try {
      await API.patch(`/staff/orders/bulk/status`, { orderIds: Array.from(selected), newStatus: "COMPLETED" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi bulk update");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Đang chuẩn bị / Hoàn thành (PREPARING / COMPLETED)</h3>

      <div className="d-flex justify-content-between align-items-center my-2">
        <div>
          <button className="btn btn-success me-2" onClick={handleBulkToCompleted}>Chuyển chọn → COMPLETED</button>
          <button className="btn btn-outline-secondary" onClick={fetchOrders}>Tải lại</button>
        </div>
        <div>{orders.length} đơn</div>
      </div>

      <OrdersTable
        orders={orders}
        selectable={true}
        selectedIds={selected}
        onToggleSelect={toggleSelect}
        onActionClick={handleSingleToCompleted}
        actionLabel="Hoàn thành"
      />
    </div>
  );
}
