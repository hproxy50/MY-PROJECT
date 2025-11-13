import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import API from "../../api/api"; // Giả sử bạn import API từ đây

export default function StaffProduct() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [importQuantity, setImportQuantity] = useState(1);
  const [importNote, setImportNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm lấy danh sách sản phẩm (từ menuController)
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      // API này sẽ tự lấy branch_id của staff
      const res = await API.get("/menu"); 
      setMenuItems(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách món ăn:", err);
      setError("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Mở Modal
  const handleShowModal = (item) => {
    setSelectedItem(item);
    setImportQuantity(1);
    setImportNote("");
    setShowModal(true);
  };

  // Đóng Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Xử lý xác nhận nhập kho
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (importQuantity < 1) {
      alert("Số lượng phải lớn hơn 0");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Tạo phiếu nhập mới
      const importRes = await API.post("/import/create", {
        note: importNote || `Nhập kho cho ${selectedItem.name}`,
      });
      const import_id = importRes.data.import_id;

      // 2. Thêm item vào phiếu nhập
      await API.post("/import/add-item", {
        import_id: import_id,
        item_id: selectedItem.item_id,
        quantity: importQuantity,
      });

      // 3. Hoàn tất phiếu nhập (trigger cộng stock ở backend)
      await API.post(`/import/complete/${import_id}`);

      alert("Nhập kho thành công!");
      handleCloseModal();
      fetchMenuItems(); // Tải lại danh sách để cập nhật stock
    } catch (err) {
      console.error("Lỗi khi nhập kho:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi nhập kho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải sản phẩm...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="p-3">
          <Row className="justify-content-between align-items-center">
            <Col xs="auto">
              <h3 className="mb-0">📦 Quản lý Kho hàng</h3>
            </Col>
            <Col xs="auto">
              <Button variant="outline-primary" onClick={fetchMenuItems}>
                Tải lại
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p className="text-muted">
            Đây là danh sách tất cả sản phẩm trong menu. Bạn có thể nhập thêm hàng
            cho các sản phẩm có quản lý số lượng (stock_quantity).
          </p>

          <Table striped bordered hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item.item_id}>
                  {/* Tên và Ảnh */}
                  <td>
                    <div className="d-flex align-items-center">
                      {item.image ? (
                        <img
                          src={`http://localhost:3000${item.image}`} // Thay bằng URL API của bạn
                          alt={item.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            marginRight: "12px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "50px",
                            height: "50px",
                            backgroundColor: "#f0f0f0",
                            borderRadius: "8px",
                            marginRight: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            color: "#888",
                          }}
                        >
                          No Img
                        </div>
                      )}
                      <span className="fw-semibold">{item.name}</span>
                    </div>
                  </td>
                  
                  {/* Danh mục */}
                  <td>{item.food_type}</td>
                  
                  {/* Tồn kho */}
                  <td>
                    {item.stock_quantity === null ? (
                      <span className="text-muted">Vô hạn</span>
                    ) : (
                      <strong className="fs-5">{item.stock_quantity}</strong>
                    )}
                  </td>
                  
                  {/* Trạng thái */}
                  <td>
                    {item.is_available ? (
                      <span className="badge bg-success">Còn hàng</span>
                    ) : (
                      <span className="badge bg-danger">Hết hàng</span>
                    )}
                  </td>

                  {/* Hành động */}
                  <td className="text-center">
                    {/* Chỉ cho phép nhập kho nếu stock_quantity không phải là NULL */}
                    {item.stock_quantity !== null ? (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleShowModal(item)}
                      >
                        Nhập kho
                      </Button>
                    ) : (
                      <Button variant="outline-secondary" size="sm" disabled>
                        Nhập kho
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Nhập kho */}
      {selectedItem && (
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Nhập kho cho: {selectedItem.name}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleImportSubmit}>
            <Modal.Body>
              <p>
                Tồn kho hiện tại:{" "}
                <strong>{selectedItem.stock_quantity}</strong>
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Số lượng nhập</Form.Label>
                <Form.Control
                  type="number"
                  value={importQuantity}
                  onChange={(e) =>
                    setImportQuantity(Math.max(1, parseInt(e.target.value)))
                  }
                  min={1}
                  required
                  autoFocus
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Ghi chú (Không bắt buộc)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={importNote}
                  onChange={(e) => setImportNote(e.target.value)}
                  placeholder="Ví dụ: Nhập hàng từ nhà cung cấp A"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Hủy
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" /> Đang xử lý...
                  </>
                ) : (
                  "Xác nhận nhập kho"
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </>
  );
}