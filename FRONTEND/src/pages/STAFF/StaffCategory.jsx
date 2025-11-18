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
import API from "../../api/api.js";

const getToken = () => localStorage.getItem("token");

export default function StaffCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    food_type: "",
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await API.get("/category");
      setCategories(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Error loading list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.food_type.trim()) {
      alert("Category name cannot be blank");
      return;
    }

    try {
      if (isEditing) {
        await API.put(`/category/update/${currentId}`, formData);
        alert("Update successful!");
      } else {
        await API.post("/category/create", formData);
        alert("New addition successful!");
      }

      handleCloseModal();
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "An error occurred.");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? Dishes in this category will lose their category."
      )
    ) {
      try {
        await API.delete(`/category/delete/${id}`);
        alert("Deleted successfully!");
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.message || "Cannot be deleted");
      }
    }
  };

  return (
    <Container fluid className="p-0">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header className="p-3 bg-white">
          <Row className="justify-content-between align-items-center">
            <Col xs="auto">
              <h3 className="mb-0 text-dark">Category Management</h3>
            </Col>
            <Col xs="auto">
              <Button variant="primary" onClick={handleShowCreate}>
                + Add new Category
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
            <Table
              striped
              bordered
              hover
              responsive
              className="align-middle mb-0"
            >
              <thead className="table-light">
                <tr>
                  <th className="text-center" style={{ width: "60px" }}>
                    #
                  </th>
                  <th>Category Name (Food Type)</th>
                  <th style={{ width: "150px" }} className="text-center">
                    Action
                  </th>
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
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(cat.category_id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-muted">
                      No category data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Edit Category" : "Add Category"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Category Name (Food Type)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Example: Drinks, Appetizers..."
                value={formData.food_type}
                onChange={(e) =>
                  setFormData({ ...formData, food_type: e.target.value })
                }
                required
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              {isEditing ? "Edit" : "Add new"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
