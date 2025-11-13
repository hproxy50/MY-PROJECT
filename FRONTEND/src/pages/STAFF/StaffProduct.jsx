import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Spinner,
  Row,
  Col,
  Alert,
  Offcanvas, 
  Form,
  InputGroup, 
  Badge,
} from "react-bootstrap";
import API from "../../api/api";

export default function StaffProduct() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // === THAY ĐỔI STATE: Quản lý phiếu nhập kho ===
  const [showSlip, setShowSlip] = useState(false); // Trạng thái đóng/mở Offcanvas
  const [importCart, setImportCart] = useState(new Map()); // Dùng Map: { item_id => { name, quantity } }
  const [importNote, setImportNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ===========================================

  // Hàm lấy danh sách sản phẩm (từ menuController)
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
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

  // === CÁC HÀM MỚI QUẢN LÝ PHIẾU NHẬP ===

  // Thêm item vào phiếu
  const handleAddItem = (item) => {
    setImportCart((prevCart) => {
      const newCart = new Map(prevCart);
      newCart.set(item.item_id, { name: item.name, quantity: 1 }); // Mặc định số lượng là 1
      return newCart;
    });
  };

  // Xóa item khỏi phiếu
  const handleRemoveItem = (itemId) => {
    setImportCart((prevCart) => {
      const newCart = new Map(prevCart);
      newCart.delete(itemId);
      return newCart;
    });
  };

  // Cập nhật số lượng trong phiếu
  const handleUpdateQuantity = (itemId, quantity) => {
    // Cho phép rỗng khi đang gõ, nhưng mặc định là 1 nếu xóa hết
    const newQuantity = Math.max(1, parseInt(quantity) || 1);
    setImportCart((prevCart) => {
      const newCart = new Map(prevCart);
      const item = newCart.get(itemId);
      if (item) {
        newCart.set(itemId, { ...item, quantity: newQuantity });
      }
      return newCart;
    });
  };

  // Đóng/Mở phiếu
  const handleCloseSlip = () => setShowSlip(false);
  const handleShowSlip = () => setShowSlip(true);

  // === HÀM SUBMIT ĐÃ VIẾT LẠI HOÀN TOÀN ===
  const handleImportSubmit = async () => {
    if (importCart.size === 0) {
      alert("Phiếu nhập đang trống. Vui lòng thêm sản phẩm.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Tạo phiếu nhập mới
      const importRes = await API.post("/import", {
        note: importNote || "Phiếu nhập kho hàng loạt",
      });
      const import_id = importRes.data.import_id;

      // 2. Chuẩn bị mảng 'items' để gửi
      const itemsToSubmit = Array.from(importCart.entries()).map(
        ([item_id, data]) => ({
          item_id: item_id,
          quantity: data.quantity,
        })
      );

      // 3. Thêm TẤT CẢ item vào phiếu nhập (API mới)
      // (Khớp với backend 'addItemToImport' đã sửa)
      await API.post("/import/add", {
        import_id: import_id,
        items: itemsToSubmit, // Gửi mảng items
      });

      // 4. Hoàn tất phiếu nhập (trigger cộng stock)
      // (Khớp với backend 'completeImport')
      await API.put(`/import/confirm/${import_id}`);

      alert("Nhập kho hàng loạt thành công!");
      handleCloseSlip();
      setImportCart(new Map()); // Xóa giỏ hàng
      setImportNote("");
      fetchMenuItems(); // Tải lại danh sách để cập nhật stock
    } catch (err) {
      console.error("Lỗi khi nhập kho:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi nhập kho.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // === KẾT THÚC HÀM SUBMIT MỚI ===

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
            {/* THAY ĐỔI: Thêm nút "Phiếu nhập" */}
            <Col xs="auto" className="d-flex gap-2">
              <Button variant="outline-primary" onClick={fetchMenuItems}>
                Tải lại
              </Button>
              <Button variant="success" onClick={handleShowSlip}>
                Phiếu nhập
                {importCart.size > 0 && (
                  <Badge pill bg="danger" className="ms-2">
                    {importCart.size}
                  </Badge>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p className="text-muted">
            Chọn "Thêm" để đưa sản phẩm vào phiếu nhập kho hàng loạt.
          </p>

          <Table striped bordered hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => {
                // Kiểm tra xem item đã có trong phiếu nhập chưa
                const isItemInCart = importCart.has(item.item_id);
                return (
                  <tr key={item.item_id}>
                    {/* Tên và Ảnh */}
                    <td>
                      <div className="d-flex align-items-center">
                        {item.image ? (
                          <img
                            src={`http://localhost:3000${item.image}`}
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

                    {/* Tồn kho (Đã áp dụng logic bỏ "null") */}
                    <td>
                      <strong className="fs-5">{item.stock_quantity}</strong>
                    </td>

                    {/* Trạng thái (Đã áp dụng logic bỏ "null") */}
                    <td>
                      {item.is_available ? (
                        <span className="badge bg-success">Còn hàng</span>
                      ) : (
                        <span className="badge bg-danger">Hết hàng</span>
                      )}
                    </td>

                    {/* THAY ĐỔI: Nút "Thêm" hoặc "Xóa" */}
                    <td className="text-center">
                      {isItemInCart ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveItem(item.item_id)}
                        >
                          Xóa
                        </Button>
                      ) : (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleAddItem(item)}
                        >
                          Thêm
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* === OFF CANVAS PHIẾU NHẬP (THAY THẾ MODAL) === */}
      <Offcanvas show={showSlip} onHide={handleCloseSlip} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Phiếu Nhập Kho</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          {importCart.size === 0 ? (
            <div className="text-center text-muted m-auto">
              <p>Phiếu nhập đang trống.</p>
              <small>Vui lòng chọn "Thêm" từ bảng sản phẩm.</small>
            </div>
          ) : (
            <>
              {/* Phần nội dung (cho phép cuộn) */}
              <div className="flex-grow-1" style={{ overflowY: "auto" }}>
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú (Không bắt buộc)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={importNote}
                    onChange={(e) => setImportNote(e.target.value)}
                    placeholder="Ví dụ: Nhập hàng đợt 1 từ nhà cung cấp A"
                  />
                </Form.Group>

                <hr />
                <h5 className="mb-3">Sản phẩm cần nhập</h5>

                <div className="d-flex flex-column gap-3">
                  {Array.from(importCart.entries()).map(
                    ([itemId, itemData]) => (
                      <div key={itemId}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">{itemData.name}</span>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0"
                            onClick={() => handleRemoveItem(itemId)}
                          >
                            Xóa
                          </Button>
                        </div>
                        <InputGroup>
                          <InputGroup.Text>Số lượng</InputGroup.Text>
                          <Form.Control
                            type="number"
                            min="1"
                            value={itemData.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(itemId, e.target.value)
                            }
                            autoFocus={true}
                          />
                        </InputGroup>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Phần Footer (Nút xác nhận) */}
              <div className="d-grid mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleImportSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" /> Đang xử
                      lý...
                    </>
                  ) : (
                    `Xác nhận nhập ${importCart.size} món`
                  )}
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}