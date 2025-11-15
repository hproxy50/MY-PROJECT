// ChefDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Navbar,
  ListGroup,
  Badge,
} from "react-bootstrap";
import API from "../../api/api.js";

function OrderTicket({ order, onApprove, isApproving }) {
  return (
    <div>
          <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center bg-white">
          <Card.Title className="h5 mb-0 text-dark">
            Đơn #{order.order_id}
          </Card.Title>
          <small className="text-muted">
            {new Date(order.scheduled_time).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </Card.Header>

        <ListGroup variant="flush">
          {order.items.map((item, index) => (
            <ListGroup.Item key={index} className="px-3 py-2">
              <div className="d-flex align-items-start">
                <Badge
                  pill
                  bg="dark"
                  className="me-2 px-2"
                  style={{ fontSize: "0.9rem", marginTop: "3px" }}
                >
                  {item.quantity}x
                </Badge>
                <div className="flex-grow-1">
                  <strong className="d-block">{item.name}</strong>
                  {item.option_summary && (
                    <small className="text-danger d-block">
                      {item.option_summary}
                    </small>
                  )}
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <Card.Footer className="p-2 bg-white border-top-0">
          <Button
            variant="success"
            className="w-100 fw-bold"
            onClick={() => onApprove(order.order_id)}
            disabled={isApproving}
          >
            {isApproving ? (
              <Spinner as="span" animation="border" size="sm" role="status" />
            ) : (
              "HOÀN THÀNH"
            )}
          </Button>
        </Card.Footer>
      </Card>
    </Col>
    </div>
  );
}

// Component chính
export default function ChefDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State này dùng để hiển thị spinner trên đúng nút đã bấm
  const [approvingId, setApprovingId] = useState(null);

  // --- 1. HÀM TẢI DỮ LIỆU ---
  const fetchOrders = async () => {
    // Chỉ set loading cho lần tải đầu tiên, các lần refresh sau sẽ im lặng
    if (!orders.length) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await API.get("/chef/orders/preparing");
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi tải đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HÀM DUYỆT ĐƠN ---
  const handleApprove = async (orderId) => {
    setApprovingId(orderId); // Bắt đầu loading trên nút này
    setError(null);

    try {
      // API của bạn hỗ trợ cả { order_id: ... }
      await API.patch("/chef/orders/approve", { order_id: orderId });

      // Xóa đơn đã duyệt khỏi danh sách trên UI ngay lập tức
      setOrders((prevOrders) =>
        prevOrders.filter((o) => o.order_id !== orderId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi duyệt đơn. Vui lòng thử lại."
      );
    } finally {
      setApprovingId(null); // Dừng loading
    }
  };

  // --- 3. TẢI ĐƠN KHI MOUNT & TỰ ĐỘNG REFRESH ---
  useEffect(() => {
    fetchOrders(); // Tải lần đầu

    // Thiết lập tự động làm mới sau mỗi 30 giây
    const interval = setInterval(() => {
      console.log("Tự động làm mới đơn bếp...");
      fetchOrders();
    }, 30000); // 30 giây

    // Hủy interval khi component unmount
    return () => clearInterval(interval);
  }, []); // Chỉ chạy 1 lần khi mount

  // --- RENDER GIAO DIỆN ---
  return (
    <>
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        className="shadow-sm sticky-top"
      >
        <Container fluid>
          <Navbar.Brand href="#home" className="fw-bold">
            <i className="bi bi-person-fill-gear me-2"></i>
            BẾP - Đơn Chờ Xử Lý
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Button
              variant="light"
              onClick={fetchOrders}
              disabled={loading}
              size="sm"
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              {loading ? "Đang tải..." : "Làm mới"}
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Vùng nội dung chính */}
      <Container fluid className="bg-light p-3" style={{ minHeight: "100vh" }}>
        {/* Hiển thị lỗi nếu có */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* Trạng thái Loading ban đầu */}
        {loading && (
          <div className="text-center py-5">
            <Spinner
              animation="border"
              variant="primary"
              style={{ width: "3rem", height: "3rem" }}
            />
            <p className="mt-2">Đang tải đơn hàng...</p>
          </div>
        )}

        {/* Trạng thái không có đơn */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-cup-straw" style={{ fontSize: "3rem" }}></i>
            <h4 className="mt-2">Không có đơn hàng nào</h4>
            <p>Tất cả đơn hàng đã được hoàn thành.</p>
          </div>
        )}

        {/* Hiển thị danh sách đơn hàng */}
        <Row>
          {orders.map((order) => (
            <OrderTicket
              key={order.order_id}
              order={order}
              onApprove={handleApprove}
              isApproving={approvingId === order.order_id} // Chỉ loading nút được bấm
            />
          ))}
        </Row>
      </Container>
    </>
  );
}
