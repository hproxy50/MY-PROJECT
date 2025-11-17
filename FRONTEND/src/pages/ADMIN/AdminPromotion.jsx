// AdminPromotion.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
  Row,
  Col,
  Card,
  InputGroup,
} from "react-bootstrap";
import API from "../../api/api.js";
import { format } from "date-fns";

const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  } catch (e) {
    console.error("Lỗi định dạng ngày:", e);
    return "";
  }
};

export default function AdminPromotion() {
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);

  // --- STATE MODAL XÓA ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- STATE FORM ---
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_type: "PERCENT",
    discount_value: 0,
    min_order_value: 0,
    start_date: "",
    end_date: "",
    branch_id: "",
  });

  // --- 1. GỌI API (FETCH DATA) ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Lấy danh sách promotions và branches song song
      const [promoRes, branchRes] = await Promise.all([
        API.get("/promotion"), // API endpoint từ promoRoutes.js
        API.get("/branch"), // API endpoint từ branchRoutes.js
      ]);
      setPromotions(promoRes.data);
      setBranches(branchRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Lỗi khi tải dữ liệu. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...promotions];

    if (selectedBranchFilter) {
      filtered = filtered.filter(
        (promo) => promo.branch_id === parseInt(selectedBranchFilter)
      );
    }

    setFilteredPromotions(filtered);
  }, [promotions, selectedBranchFilter]);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentPromo(null);
    setFormData({
      title: "",
      description: "",
      discount_type: "PERCENT",
      discount_value: 0,
      min_order_value: 0,
      start_date: "",
      end_date: "",
      branch_id: "",
    });
  };

  const handleShowAddModal = () => {
    setIsEditing(false);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setFormData({
      title: "",
      description: "",
      discount_type: "PERCENT",
      discount_value: 10,
      min_order_value: 0,
      start_date: formatDateForInput(now.toISOString()),
      end_date: formatDateForInput(tomorrow.toISOString()),
      branch_id: "",
    });
    setShowModal(true);
  };

  const handleShowEditModal = (promo) => {
    setIsEditing(true);
    setCurrentPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order_value: promo.min_order_value || 0,
      start_date: formatDateForInput(promo.start_date),
      end_date: formatDateForInput(promo.end_date),
      branch_id: promo.branch_id,
    });
    setShowModal(true);
  };

  const handleShowDeleteModal = (promo) => {
    setCurrentPromo(promo);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setCurrentPromo(null);
    setShowDeleteModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetFeedback = () => {
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Validate frontend đơn giản
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setFeedback({
        type: "danger",
        message: "Ngày kết thúc phải sau ngày bắt đầu.",
      });
      resetFeedback();
      return;
    }
    if (
      formData.discount_type === "PERCENT" &&
      (formData.discount_value <= 0 || formData.discount_value > 100)
    ) {
      setFeedback({ type: "danger", message: "Giá trị % phải từ 1 đến 100." });
      resetFeedback();
      return;
    }
    if (formData.discount_type === "AMOUNT" && formData.discount_value <= 0) {
      setFeedback({ type: "danger", message: "Giá trị giảm phải lớn hơn 0." });
      resetFeedback();
      return;
    }
    if (!formData.branch_id) {
      setFeedback({ type: "danger", message: "Vui lòng chọn chi nhánh." });
      resetFeedback();
      return;
    }

    try {
      if (isEditing) {
        // --- CẬP NHẬT ---
        await API.put(`/promotion/update/${currentPromo.promo_id}`, formData);
        setFeedback({
          type: "success",
          message: "Cập nhật khuyến mãi thành công!",
        });
      } else {
        // --- THÊM MỚI ---
        await API.post("/promotion/add", formData);
        setFeedback({
          type: "success",
          message: "Thêm khuyến mãi thành công!",
        });
      }
      handleCloseModal();
      fetchData(); // Tải lại toàn bộ dữ liệu
    } catch (err) {
      setFeedback({
        type: "danger",
        message:
          err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.",
      });
    }
    resetFeedback();
  };

  const handleDeleteConfirm = async () => {
    if (!currentPromo) return;
    setFeedback(null);
    try {
      await API.delete(`/promotion/delete/${currentPromo.promo_id}`);
      setFeedback({
        type: "success",
        message: "Xóa khuyến mãi thành công!",
      });
      handleCloseDeleteModal();
      fetchData(); // Tải lại
    } catch (err) {
      setFeedback({
        type: "danger",
        message: err.response?.data?.message || "Lỗi khi xóa khuyến mãi.",
      });
    }
    resetFeedback();
  };

  // --- 5. RENDER HELPER ---
  const getPromoStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now < startDate) return { text: "Sắp diễn ra", bg: "info" };
    if (now > endDate) return { text: "Đã kết thúc", bg: "secondary" };
    return { text: "Đang diễn ra", bg: "success" };
  };

  return (
    <Container fluid>
      <Row className="mb-3 align-items-center">
        <Col md={6}>
          <h2>Quản lý Khuyến mãi</h2>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="primary" onClick={handleShowAddModal}>
            <i className="bi bi-plus-lg me-2"></i> Thêm Khuyến mãi
          </Button>
        </Col>
      </Row>

      {/* Hiển thị thông báo */}
      {feedback && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback(null)}
          dismissible
        >
          {feedback.message}
        </Alert>
      )}

      <Card>
        <Card.Body>
          {/* BỘ LỌC CHI NHÁNH */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="branchFilter">
                <Form.Label>Lọc theo chi nhánh</Form.Label>
                <Form.Select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                >
                  <option value="">Tất cả chi nhánh</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* HIỂN THỊ LOADING HOẶC BẢNG */}
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>Tiêu đề</th>
                  <th>Chi nhánh</th>
                  <th>Loại</th>
                  <th>Giá trị</th>
                  <th>Đơn tối thiểu</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromotions.map((promo) => {
                  const status = getPromoStatus(
                    promo.start_date,
                    promo.end_date
                  );
                  return (
                    <tr key={promo.promo_id}>
                      <td className="fw-bold">{promo.title}</td>
                      <td>{promo.branch_name || "N/A"}</td>
                      <td>
                        <Badge
                          bg={
                            promo.discount_type === "PERCENT"
                              ? "primary"
                              : "warning"
                          }
                        >
                          {promo.discount_type}
                        </Badge>
                      </td>
                      <td>
                        {" "}
                        {promo.discount_type === "PERCENT"
                          ? `${promo.discount_value}%`
                          : `${Number(promo.discount_value).toLocaleString(
                              "vi-VN"
                            )} đ`}
                        {" "}
                      </td>
                      {" "}
                      <td>
                        {" "}
                        {Number(promo.min_order_value) > 0
                          ? `${Number(promo.min_order_value).toLocaleString(
                              "vi-VN"
                            )} đ`
                          : "Zero"}{" "}
                      </td>
                      <td>
                        {format(new Date(promo.start_date), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td>
                        {format(new Date(promo.end_date), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td>
                        <Badge bg={status.bg}>{status.text}</Badge>
                      </td>
                      <td>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowEditModal(promo)}
                        >
                          <i className="bi bi-pencil-fill"></i> Sửa
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleShowDeleteModal(promo)}
                        >
                          <i className="bi bi-trash-fill"></i> Xóa
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* --- MODAL THÊM/SỬA --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Chỉnh sửa Khuyến mãi" : "Thêm Khuyến mãi mới"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tiêu đề</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả (Không bắt buộc)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại giảm giá</Form.Label>
                  <Form.Select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleChange}
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="AMOUNT">Số tiền (VND)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá trị giảm</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="discount_value"
                      value={formData.discount_value}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                    <InputGroup.Text>
                      {formData.discount_type === "PERCENT" ? "%" : "VND"}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Thời gian bắt đầu</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Thời gian kết thúc</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            {/* SỬA LẠI ROW CUỐI CÙNG TRONG MODAL */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Áp dụng cho chi nhánh</Form.Label>
                  <Form.Select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* <-- THÊM TRƯỜNG NHẬP LIỆU MỚI --> */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá trị đơn tối thiểu</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="min_order_value"
                      value={formData.min_order_value}
                      onChange={handleChange}
                      min="0"
                    />
                    <InputGroup.Text>VND</InputGroup.Text>
                  </InputGroup>
                  <Form.Text muted>
                    Để 0 nếu không yêu cầu giá trị tối thiểu.
                  </Form.Text>
                </Form.Group>
              </Col>
              {/* <-- KẾT THÚC THÊM --> */}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {isEditing ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* --- MODAL XÓA --- */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận Xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa khuyến mãi{" "}
          <strong>{currentPromo?.title}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
