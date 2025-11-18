import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Spinner,
  Modal,
  Form,
  Badge,
} from "react-bootstrap";
import API from "../../api/api";

export default function StaffOrder() {
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

      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error in taking order:", err);
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
    if (!window.confirm("Confirm APPROVING this application to PREPARING?")) return;
    try {
      const res = await API.post(
        `/staff/orders/approve`,
        { order_id: orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Successfully approved!");
      fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Error approving order!");
    }
  };

  const handleApproveBulk = async () => {
    if (selected.size === 0) return alert("No orders have been selected for approval!");
    if (!window.confirm(`Browse ${selected.size} single to PREPARING?`)) return;
    try {
      const res = await API.post(
        `/staff/orders/approve`,
        { order_ids: Array.from(selected) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Successfully approved!");
      fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Error approving multiple orders!");
    }
  };

  const handleCancelSingle = async (orderId) => {
    if (!window.confirm("Confirm CANCEL this order? (Cannot be undone)"))
      return;
    try {
      const res = await API.post(
        `/staff/orders/cancel`,
        { order_id: orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Cancellation successful!");
      fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Order cancellation error!");
    }
  };

  const handleCancelBulk = async () => {
    if (selected.size === 0) return alert("No orders selected to cancel!");
    if (
      !window.confirm(`Cancel ${selected.size} selected order? (Cannot be undone)`)
    )
      return;
    try {
      const res = await API.post(
        `/staff/orders/cancel`,
        { order_ids: Array.from(selected) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Cancellation successful!");
      fetchOrders();
      setSelected(new Set());
    } catch (err) {
      alert(err.response?.data?.message || "Multiple order cancellation error!");
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
      console.error("Error getting single detail:", err);
      alert("Unable to load order details (order may have been approved/canceled)!");
    }
  };

  if (loading)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <h6 className="text-muted">Loading order...</h6>
      </div>
    );

  return (
    <>
      <div className="text-center mb-4">
        <h3 className="fw-bold mb-2">Pending orders</h3>
        <p className="text-muted mb-0">
          Track and process PENDING orders in the system
        </p>
      </div>

      <Card className="shadow-lg border-0 rounded-4 mb-4">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
            <div className="d-flex flex-wrap gap-2">
              <Button variant="success" onClick={handleApproveBulk}>
                Browse selected applications
              </Button>
              <Button variant="danger" onClick={handleCancelBulk}>
                Cancel selected orders
              </Button>
            </div>
            <div>
              <Badge bg="secondary" pill className="fs-6">
                {orders.length} Pending orders
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
                      checked={
                        selected.size === orders.length && orders.length > 0
                      }
                    />
                  </th>
                  <th>#</th>
                  <th>Customers</th>
                  <th>Order type</th>
                  {/* <th>Payment</th> */}
                  <th>Total amount</th>
                  <th>Desired time</th>
                  <th>Creation time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No orders
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
                        <div className="text-muted small">
                          {order.customer_phone}
                        </div>
                        {order.order_type === "DELIVERY" && (
                          <div className="small text-muted mt-1">
                            <i className="bi bi-geo-alt"></i>{" "}
                            {order.delivery_address}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        {order.order_type === "DELIVERY" ? (
                          <Badge bg="info">Delivery</Badge>
                        ) : order.order_type === "TAKEAWAY" ? (
                          <Badge bg="warning">Take away</Badge>
                        ) : (
                          <Badge bg="primary">At place</Badge>
                        )}
                      </td>
                      {/* <td>{order.payment_method}</td> */}
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
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApproveSingle(order.order_id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleCancelSingle(order.order_id)}
                          >
                            Cancel
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
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Order details #{selectedOrder?.order_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder ? (
            <>
              <div className="mb-3">
                <p className="mb-1">
                  <strong>Customer:</strong> {selectedOrder.customer_name} (
                  {selectedOrder.customer_phone})
                </p>
                <p className="mb-1">
                  <strong>Order type:</strong> {selectedOrder.order_type}
                </p>
                {selectedOrder.delivery_address && (
                  <p className="mb-1">
                    <strong>Address:</strong> {selectedOrder.delivery_address}
                  </p>
                )}
                {selectedOrder.scheduled_time && (
                  <p className="mb-1">
                    <strong>Desired time:</strong>{" "}
                    {new Date(selectedOrder.scheduled_time).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="table-responsive">
                <Table bordered hover size="sm" className="text-center">
                  <thead className="table-secondary">
                    <tr>
                      <th>Dish</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Option</th>
                      <th>Unit price</th>
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
                  Total:{" "}
                  <span className="text-success">
                    {selectedOrder.final_price.toLocaleString()}₫
                  </span>
                </h5>
              </div>
            </>
          ) : (
            <div className="text-center py-3 text-muted">
              Loading details...
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
