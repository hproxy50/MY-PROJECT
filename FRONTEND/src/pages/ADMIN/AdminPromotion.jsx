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
    console.error("Date format error:", e);
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [promoRes, branchRes] = await Promise.all([
        API.get("/promotion"), 
        API.get("/branch"), 
      ]);
      setPromotions(promoRes.data);
      setBranches(branchRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Error loading data. Please try again."
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

    
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setFeedback({
        type: "danger",
        message: "The end date must be after the start date.",
      });
      resetFeedback();
      return;
    }
    if (
      formData.discount_type === "PERCENT" &&
      (formData.discount_value <= 0 || formData.discount_value > 100)
    ) {
      setFeedback({ type: "danger", message: "The % value must be between 1 and 100." });
      resetFeedback();
      return;
    }
    if (formData.discount_type === "AMOUNT" && formData.discount_value <= 0) {
      setFeedback({ type: "danger", message: "The decrease value must be greater than 0." });
      resetFeedback();
      return;
    }
    if (!formData.branch_id) {
      setFeedback({ type: "danger", message: "Please select a branch" });
      resetFeedback();
      return;
    }

    try {
      if (isEditing) {
        await API.put(`/promotion/update/${currentPromo.promo_id}`, formData);
        setFeedback({
          type: "success",
          message: "Promotion updated successfully!",
        });
      } else {
        await API.post("/promotion/add", formData);
        setFeedback({
          type: "success",
          message: "Promotion added successfully!",
        });
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      setFeedback({
        type: "danger",
        message:
          err.response?.data?.message || "An error occurred, please try again",
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
        message: "Promotion deleted successfully",
      });
      handleCloseDeleteModal();
      fetchData();
    } catch (err) {
      setFeedback({
        type: "danger",
        message: err.response?.data?.message || "Error when deleting promotion",
      });
    }
    resetFeedback();
  };

  const getPromoStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now < startDate) return { text: "Coming soon", bg: "info" };
    if (now > endDate) return { text: "Finished", bg: "secondary" };
    return { text: "In progress", bg: "success" };
  };

  return (
    <Container fluid>
      <Row className="mb-3 align-items-center">
        <Col md={6}>
          <h2>Promotion Management</h2>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="primary" onClick={handleShowAddModal}>
            <i className="bi bi-plus-lg me-2"></i> Add Promotion
          </Button>
        </Col>
      </Row>

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
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="branchFilter">
                <Form.Label>Filter by branch</Form.Label>
                <Form.Select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                >
                  <option value="">All branches</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

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
                  <th>Title</th>
                  <th>Branches</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Minimum order</th>
                  <th>Begin</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Action</th>
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
                          <i className="bi bi-pencil-fill"></i> Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleShowDeleteModal(promo)}
                        >
                          <i className="bi bi-trash-fill"></i> Delete
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

      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Edit Promotion" : "Add new Promotion"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
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
                  <Form.Label>Discount type</Form.Label>
                  <Form.Select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleChange}
                  >
                    <option value="PERCENT">Percent (%)</option>
                    <option value="AMOUNT">Amount (VND)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discounted value</Form.Label>
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
                  <Form.Label>Start time</Form.Label>
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
                  <Form.Label>End time</Form.Label>
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apply to branches</Form.Label>
                  <Form.Select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum order value</Form.Label>
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
                  Leave 0 if no minimum value is required.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {isEditing ? "Save changes" : "Submit"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the promotion?{" "}
          <strong>{currentPromo?.title}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
