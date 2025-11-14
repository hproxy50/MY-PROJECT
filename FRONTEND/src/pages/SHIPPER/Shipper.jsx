// ShipperDashboard.jsx
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
  Modal,
  Badge,
} from "react-bootstrap";
import API from "../../api/api.js";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

// Cài đặt: npm install date-fns

/**
 * Helper: Định dạng tiền tệ
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

/**
 * Component Con: Modal hiển thị chi tiết món ăn
 */
function OrderItemsModal({ order, show, onHide }) {
  if (!order) return null;

  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết Đơn #{order.order_id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup variant="flush">
          {order.items.map((item, index) => (
            <ListGroup.Item key={index} className="px-0">
              <div className="d-flex">
                <Badge pill bg="dark" className="me-2 px-2" style={{ fontSize: "1rem" }}>
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * Component Con: Thẻ (phiếu) giao hàng
 */
function DeliveryTicket({ order, onComplete, onShowItems, isCompleting }) {
  // Tính thời gian
  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: vi,
  });

  // Tính tổng số món
  const totalItems = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  

  return (
    <Col xs={12} md={6} lg={4} className="mb-4">
      <Card className="h-100 shadow-sm border-primary" style={{ borderLeftWidth: "4px" }}>
        <Card.Header className="d-flex justify-content-between align-items-center bg-white">
          <Card.Title className="h5 mb-0 text-primary">
            Đơn #{order.order_id}
          </Card.Title>
          <small className="text-muted">{timeAgo}</small>
        </Card.Header>

        <ListGroup variant="flush">
          {/* Thông tin khách hàng */}
          <ListGroup.Item>
            <strong className="d-block">Khách hàng:</strong>
            <span className="fs-5">{order.customer_name}</span>
          </ListGroup.Item>
          
          <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <div>
              <strong className="d-block">Số điện thoại:</strong>
              <span className="fs-5 text-dark">{order.customer_phone}</span>
            </div>
          </ListGroup.Item>
          
          <ListGroup.Item>
            <strong className="d-block">Địa chỉ giao:</strong>
            <p className="fs-5 mb-2">{order.delivery_address}</p>
          </ListGroup.Item>

          {/* Ghi chú */}
          {order.message && (
            <ListGroup.Item variant="warning">
              <strong className="d-block">Ghi chú của khách:</strong>
              <p className="fs-5 mb-0">{order.message}</p>
            </ListGroup.Item>
          )}

          {/* Thông tin thanh toán */}
          <ListGroup.Item variant="light">
            <span className="fs-5">Tổng số món:</span>
            <span className="fs-5 fw-bold float-end">{totalItems} món</span>
          </ListGroup.Item>
          <ListGroup.Item variant="success" className="text-black">
            <strong className="fs-4 d-block">TỔNG THU:</strong>
            <span className="h3 mb-0 fw-bold">
              {formatCurrency(order.final_price)}
            </span>
          </ListGroup.Item>
        </ListGroup>

        <Card.Footer className="p-2 bg-white d-grid gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => onShowItems(order.order_id)}
          >
            Xem {totalItems} Món
          </Button>
          <Button
            variant="primary"
            className="fw-bold py-2 fs-5"
            onClick={() => onComplete(order.order_id)}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <Spinner as="span" animation="border" size="sm" role="status" />
            ) : (
              "ĐÃ GIAO XONG"
            )}
          </Button>
        </Card.Footer>
      </Card>
    </Col>
  );
}

/**
 * Component chính
 */
export default function ShipperDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [showModalId, setShowModalId] = useState(null); // Lưu ID đơn hàng để xem

  // --- 1. HÀM TẢI DỮ LIỆU ---
  const fetchOrders = async () => {
    // Chỉ set loading cho lần tải đầu, refresh sau sẽ im lặng
    if (!orders.length) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await API.get("/shipper/orders");
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi tải đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HÀM HOÀN THÀNH ĐƠN ---
  const handleComplete = async (orderId) => {
    setCompletingId(orderId);
    setError(null);

    try {
      await API.post("/shipper/orders/complete", { order_id: orderId });
      // Xóa đơn đã hoàn thành khỏi UI
      setOrders((prevOrders) =>
        prevOrders.filter((o) => o.order_id !== orderId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi hoàn thành đơn."
      );
    } finally {
      setCompletingId(null);
    }
  };

  // --- 3. XỬ LÝ MODAL ---
  const handleShowItems = (orderId) => {
    setShowModalId(orderId);
  };
  const handleCloseModal = () => {
    setShowModalId(null);
  };
  
  // Tìm đơn hàng đang được chọn để xem
  const currentOrderDetails = orders.find(o => o.order_id === showModalId);

  // --- 4. TẢI ĐƠN KHI MOUNT & TỰ ĐỘNG REFRESH ---
  useEffect(() => {
    fetchOrders(); // Tải lần đầu

    // Tự động làm mới sau mỗi 60 giây
    const interval = setInterval(() => {
      console.log("Tự động làm mới đơn shipper...");
      fetchOrders();
    }, 60000); // 60 giây

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm sticky-top">
        <Container fluid>
          <Navbar.Brand href="#home" className="fw-bold">
            <i className="bi bi-truck me-2"></i>
            Order Fulfillment Team
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

      <Container fluid className="bg-light p-3" style={{ minHeight: "100vh" }}>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
            <p className="mt-2">Đang tìm đơn hàng mới...</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-check2-circle" style={{ fontSize: "3rem" }}></i>
            <h4 className="mt-2">Không có đơn cần giao</h4>
            <p>Bạn đã giao hết đơn hàng. Tốt lắm!</p>
          </div>
        )}

        <Row>
          {orders.map((order) => (
            <DeliveryTicket
              key={order.order_id}
              order={order}
              onComplete={handleComplete}
              onShowItems={handleShowItems}
              isCompleting={completingId === order.order_id}
            />
          ))}
        </Row>
      </Container>

      {/* Modal chi tiết món ăn (chỉ render khi cần) */}
      {currentOrderDetails && (
          <OrderItemsModal 
            order={currentOrderDetails}
            show={true}
            onHide={handleCloseModal}
          />
      )}
    </>
  );
}