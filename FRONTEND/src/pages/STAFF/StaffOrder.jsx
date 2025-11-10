import React, { useEffect, useState } from "react";
import { Card, Table, Button, Spinner, Modal, Form, Badge } from "react-bootstrap";
import API from "../../api/api";

export default function StaffIncomingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");

  const fetchOrders = async () => {
    try {
      const res = await API.get(`/staff/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newOrders = res.data.orders || [];
      setOrders((prevOrders) => {
        const prevIds = new Set(prevOrders.map((o) => o.order_id));
        const newIds = new Set(newOrders.map((o) => o.order_id));
        const added = newOrders.filter((o) => !prevIds.has(o.order_id));
        const stillExist = prevOrders.filter((o) => newIds.has(o.order_id));
        return [...added, ...stillExist];
      });
    } catch (err) {
      console.error("Lỗi lấy đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleApproveSingle = async (orderId) => {
    if (!window.confirm("Xác nhận duyệt đơn này sang PREPARING?")) return;
    try {
      const res = await API.post(
        `/staff/orders/approve`,
        { order_id: orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Duyệt thành công!");
      fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi duyệt đơn!");
    }
  };

  const handleApproveBulk = async () => {
    if (selected.size === 0) return alert("Chưa chọn đơn nào!");
    if (!window.confirm(`Duyệt ${selected.size} đơn sang PREPARING?`)) return;
    try {
      const res = await API.post(
        `/staff/orders/approve`,
        { order_ids: Array.from(selected) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Duyệt thành công!");
      fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi duyệt nhiều đơn!");
    }
  };

  const handleView = async (orderId) => {
    try {
      const res = await API.get(`/staff/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Lỗi lấy chi tiết đơn:", err);
      alert("Không thể tải chi tiết đơn hàng!");
    }
  };

  if (loading)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <h6 className="text-muted">Đang tải đơn hàng...</h6>
      </div>
    );

  return (
    <div className="container my-4">
      <div className="text-center mb-4">
        <h3 className="fw-bold mb-2">📦 Đơn hàng chờ duyệt</h3>
        <p className="text-muted mb-0">Theo dõi và xử lý đơn hàng PENDING trong hệ thống</p>
      </div>

      <Card className="shadow-lg border-0 rounded-4 mb-4">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
            <div className="d-flex flex-wrap gap-2">
              <Button variant="success" onClick={handleApproveBulk}>
                ✅ Duyệt các đơn đã chọn
              </Button>
            </div>
            <div>
              <Badge bg="secondary" pill className="fs-6">
                {orders.length} đơn đang chờ
              </Badge>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover bordered className="align-middle mb-0">
              <thead className="table-light text-center">
                <tr>
                  <th style={{ width: "40px" }}>
                    <Form.Check
                      type="checkbox"
                      onChange={(e) =>
                        e.target.checked
                          ? setSelected(new Set(orders.map((o) => o.order_id)))
                          : setSelected(new Set())
                      }
                      checked={selected.size === orders.length && orders.length > 0}
                    />
                  </th>
                  <th>#</th>
                  <th>Khách hàng</th>
                  <th>Loại đơn</th>
                  <th>Tổng tiền</th>
                  <th>Thời gian mong muốn</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  orders.map((order, idx) => (
                    <tr key={order.order_id}>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={selected.has(order.order_id)}
                          onChange={() => toggleSelect(order.order_id)}
                        />
                      </td>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <div className="fw-semibold">{order.customer_name}</div>
                        <div className="text-muted small">{order.customer_phone}</div>
                        {order.order_type === "DELIVERY" && (
                          <div className="small text-muted mt-1">
                            <i className="bi bi-geo-alt"></i> {order.delivery_address}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        {order.order_type === "DELIVERY" ? (
                          <Badge bg="info">🚚 Giao hàng</Badge>
                        ) : (
                          <Badge bg="warning">🏠 Tại quán</Badge>
                        )}
                      </td>
                      <td className="text-end fw-semibold">
                        {order.final_price.toLocaleString()}₫
                      </td>
                      <td className="text-center">
                        {order.scheduled_time
                          ? new Date(order.scheduled_time).toLocaleString()
                          : "—"}
                      </td>
                      <td className="text-center">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline-info"
                            onClick={() => handleView(order.order_id)}
                          >
                            Xem
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApproveSingle(order.order_id)}
                          >
                            Duyệt
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* 🔍 Modal Chi tiết đơn */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            Chi tiết đơn #{selectedOrder?.order_id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder ? (
            <>
              <div className="mb-3">
                <p className="mb-1">
                  <strong>Khách hàng:</strong> {selectedOrder.customer_name} (
                  {selectedOrder.customer_phone})
                </p>
                <p className="mb-1">
                  <strong>Loại đơn:</strong> {selectedOrder.order_type}
                </p>
                {selectedOrder.delivery_address && (
                  <p className="mb-1">
                    <strong>Địa chỉ:</strong> {selectedOrder.delivery_address}
                  </p>
                )}
                {selectedOrder.scheduled_time && (
                  <p className="mb-1">
                    <strong>Thời gian mong muốn:</strong>{" "}
                    {new Date(selectedOrder.scheduled_time).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="table-responsive">
                <Table bordered hover size="sm" className="text-center">
                  <thead className="table-secondary">
                    <tr>
                      <th>Món</th>
                      <th>SL</th>
                      <th>Giá</th>
                      <th>Option</th>
                      <th>Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.order_item_id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit_price.toLocaleString()}₫</td>
                        <td className="text-muted small">
                          {item.options
                            ? Object.entries(item.options)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(", ")
                            : item.option_summary || "—"}
                        </td>
                        <td>{item.line_total.toLocaleString()}₫</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="text-end mt-3">
                <h5 className="fw-bold">
                  Tổng cộng:{" "}
                  <span className="text-success">
                    {selectedOrder.final_price.toLocaleString()}₫
                  </span>
                </h5>
              </div>
            </>
          ) : (
            <div className="text-center py-3 text-muted">Đang tải chi tiết...</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
