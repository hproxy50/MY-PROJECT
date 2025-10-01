import React, { useEffect, useState } from "react";
import API from "../../api/api";
import OrdersTable from "./OrdersTable";

export default function StaffIncomingOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const token = localStorage.getItem("token");

  const fetchOrders = async () => {
    try {
      const res = await API.get(`/staff/orders?status=PENDING,PAID`, {
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

  const handleSingleToPreparing = async (orderId) => {
    if (!window.confirm("Chuyển đơn sang PREPARING?")) return;
    try {
      await API.patch(`/staff/orders/${orderId}/status`, { newStatus: "PREPARING" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật");
    }
  };

  const handleBulkToPreparing = async () => {
    if (selected.size === 0) return alert("Chưa chọn đơn nào");
    if (!window.confirm(`Chuyển ${selected.size} đơn sang PREPARING?`)) return;
    try {
      await API.patch(`/staff/orders/bulk/status`, { orderIds: Array.from(selected), newStatus: "PREPARING" }, {
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
      <h3>Đơn chờ duyệt (PENDING / PAID)</h3>

      <div className="d-flex justify-content-between align-items-center my-2">
        <div>
          <button className="btn btn-success me-2" onClick={handleBulkToPreparing}>Chuyển chọn → PREPARING</button>
          <button className="btn btn-outline-secondary" onClick={fetchOrders}>Tải lại</button>
        </div>
        <div>{orders.length} đơn</div>
      </div>

      <OrdersTable
        orders={orders}
        selectable={true}
        selectedIds={selected}
        onToggleSelect={toggleSelect}
        onActionClick={handleSingleToPreparing}
        actionLabel="Duyệt → PREPARING"
      />
    </div>
  );
}
