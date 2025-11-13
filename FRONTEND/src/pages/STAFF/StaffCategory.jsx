import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";

// Hàm lấy token (giữ nguyên logic của bạn)
const getToken = () => localStorage.getItem("token");

export default function StaffCategory() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- STATE CHO MODAL THÊM/SỬA ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form data chỉ cần food_type theo backend
  const [formData, setFormData] = useState({ 
    food_type: "" 
  });

  const API_URL = "http://localhost:3000/category";

  // --- 1. FETCH DATA ---
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(data);
        setError(null);
      } else {
        setError(data.message || "Lỗi khi tải danh sách");
      }
    } catch (err) {
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- 2. XỬ LÝ MODAL ---
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ food_type: "" });
    setError(null);
  };

  const handleShowCreate = () => {
    setIsEditing(false);
    setFormData({ food_type: "" });
    setShowModal(true);
  };

  const handleShowEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item.category_id);
    setFormData({ food_type: item.food_type });
    setShowModal(true);
  };

  // --- 3. SUBMIT FORM (THÊM/SỬA) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.food_type.trim()) {
      alert("Tên category không được để trống");
      return;
    }

    const url = isEditing 
      ? `${API_URL}/update/${currentId}` 
      : `${API_URL}/create`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
        fetchCategories();
        handleCloseModal();
      } else {
        alert(data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server");
    }
  };

  // --- 4. XỬ LÝ XÓA ---
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa category này?")) {
      try {
        const response = await fetch(`${API_URL}/delete/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          alert("Xóa thành công!");
          fetchCategories();
        } else {
          alert(data.message || "Không thể xóa");
        }
      } catch (err) {
        alert("Lỗi kết nối khi xóa");
      }
    }
  };

  // --- GIAO DIỆN CHÍNH (Updated Style) ---
  return (
    <Container fluid className="p-0"> 
      {/* Alerts thông báo lỗi/load chung */}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      <Card className="shadow-sm">
        {/* HEADER GIỐNG STAFF MENU */}
        <Card.Header className="p-3 bg-white">
          <Row className="justify-content-between align-items-center">
            <Col xs="auto">
              <h3 className="mb-0 text-dark">📂 Quản lý Category</h3>
            </Col>
            <Col xs="auto">
              <Button variant="primary" onClick={handleShowCreate}>
                + Thêm Category
              </Button>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            /* BẢNG DỮ LIỆU STYLE MỚI */
            <Table striped bordered hover responsive className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-center" style={{ width: "60px" }}>#</th>
                  <th>Tên Category (Food Type)</th>
                  <th style={{ width: "150px" }} className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat, index) => (
                    <tr key={cat.category_id}>
                      <td className="text-center">{index + 1}</td>
                      <td className="fw-semibold">{cat.food_type}</td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="warning"
                          className="me-2"
                          onClick={() => handleShowEdit(cat)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(cat.category_id)}
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-muted">
                      Chưa có dữ liệu category nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* MODAL THÊM / SỬA */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        backdrop="static" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Sửa Category" : "Thêm Category"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên Category (Food Type)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ví dụ: Đồ uống, Món khai vị..."
                value={formData.food_type}
                onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                required
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="success" type="submit">
              {isEditing ? "Cập nhật" : "Thêm mới"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}