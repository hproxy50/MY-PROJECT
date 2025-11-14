// AdminBranches.jsx
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
} from "react-bootstrap";
import API from "../../api/api.js";
import { format } from "date-fns";

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);


  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
    status: "ACTIVE",
  });
  const [currentBranch, setCurrentBranch] = useState(null);

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get("/branch");
      setBranches(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error loading branch list."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);


  const resetFeedback = () => {
    setTimeout(() => setFeedback(null), 3000);
  };


  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewBranch({ name: "", address: "", phone: "", status: "ACTIVE" }); 
  };
  const handleShowAddModal = () => setShowAddModal(true);

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCurrentBranch(null);
  };
  const handleShowEditModal = (branch) => {
    setCurrentBranch(branch);
    setShowEditModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentBranch(null);
  };
  const handleShowDeleteModal = (branch) => {
    setCurrentBranch(branch);
    setShowDeleteModal(true);
  };


  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setNewBranch((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentBranch((prev) => ({ ...prev, [name]: value }));
  };


  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await API.post("/branch/add", newBranch);
      setFeedback({ type: "success", message: "Branch created successfully!" });
      handleCloseAddModal();
      fetchBranches(); 
    } catch (err) {
      setFeedback({
        type: "danger",
        message:
          err.response?.data?.message || "Error creating branch.",
      });
    }
    resetFeedback();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentBranch) return;
    setFeedback(null);
    try {
      await API.put(
        `/branch/update/${currentBranch.branch_id}`,
        currentBranch
      );
      setFeedback({
        type: "success",
        message: "Branch update successful!",
      });
      handleCloseEditModal();
      fetchBranches(); 
    } catch (err) {
      setFeedback({
        type: "danger",
        message:
          err.response?.data?.message || "Error updating branch.",
      });
    }
    resetFeedback();
  };

  const handleDeleteConfirm = async () => {
    if (!currentBranch) return;
    setFeedback(null);
    try {
      await API.delete(`/branch/delete/${currentBranch.branch_id}`);
      setFeedback({
        type: "success",
        message: "Branch deleted successfully!",
      });
      handleCloseDeleteModal();
      fetchBranches(); 
    } catch (err) {
      setFeedback({
        type: "danger",
        message:
          err.response?.data?.message || "Error deleting branch.",
      });
    }
    resetFeedback();
  };

  return (
    <Container fluid>
      <Row className="mb-3 align-items-center">
        <Col>
          <h2>Branch Management</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={handleShowAddModal}>
            <i className="bi bi-plus-lg me-2"></i>+ Add Branch
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
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Card>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Phone number</th>
                  <th>Date created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.branch_id}>
                    <td>{branch.branch_id}</td>
                    <td>{branch.name}</td>
                    <td>{branch.address}</td>
                    <td>{branch.phone}</td>
                    <td>
                      {format(
                        new Date(branch.created_at),
                        "dd/MM/yyyy HH:mm"
                      )}
                    </td>
                    <td>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowEditModal(branch)}
                      >
                        <i className="bi bi-pencil-fill"></i> Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleShowDeleteModal(branch)}
                      >
                        <i className="bi bi-trash-fill"></i> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Branch</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Branch Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newBranch.name}
                onChange={handleAddFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={newBranch.address}
                onChange={handleAddFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone number</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={newBranch.phone}
                onChange={handleAddFormChange}
                required
                pattern="^\d{9,11}$"
                title="Phone number must be 9-11 digits"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseAddModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Branch</Modal.Title>
        </Modal.Header>
        {currentBranch && (
          <Form onSubmit={handleEditSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Branch Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={currentBranch.name}
                  onChange={handleEditFormChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={currentBranch.address}
                  onChange={handleEditFormChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone number</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={currentBranch.phone}
                  onChange={handleEditFormChange}
                  required
                  pattern="^\d{9,11}$"
                  title="Phone number must be 9-11 digits"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseEditModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save changes
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the branch?{" "}
          <strong>{currentBranch?.name}</strong>? This action cannot be undone.
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