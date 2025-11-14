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
  Badge,
  Nav,
  InputGroup,
} from "react-bootstrap";
import API from "../../api/api.js";

export default function AdminStaffCRUD() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formType, setFormType] = useState("CUSTOMER");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    branch_id: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get("/admin/users");
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await API.get("/branch");
      setBranches(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load branch list. Please try again.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  useEffect(() => {
    let tabFilteredUsers = [];
    if (activeTab === "all") {
      tabFilteredUsers = users;
    } else if (activeTab === "staff") {
      tabFilteredUsers = users.filter((u) =>
        ["STAFF", "CHEF", "SHIPPER"].includes(u.role)
      );
    } else if (activeTab === "customer") {
      tabFilteredUsers = users.filter((u) => u.role === "CUSTOMER");
    }
    if (searchTerm.trim() === "") {
      setFilteredUsers(tabFilteredUsers);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const searchedUsers = tabFilteredUsers.filter((user) =>
        user.name.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredUsers(searchedUsers);
    }
  }, [users, activeTab, searchTerm]);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setIsEditing(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "CUSTOMER",
      branch_id: "",
    });
    setFormType("CUSTOMER");
  };

  const handleShowCreate = () => {
    handleCloseModal();
    setIsEditing(false);
    setShowModal(true);
  };

  const handleShowEdit = (user) => {
    setEditingUser(user);
    setIsEditing(true);

    const type = ["STAFF", "CHEF", "SHIPPER"].includes(user.role)
      ? "STAFF"
      : "CUSTOMER";
    setFormType(type);

    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: "",
      role: user.role,
      branch_id: user.branch_id || "",
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    if (name === "role" && !isEditing) {
      const newType = ["STAFF", "CHEF", "SHIPPER"].includes(value)
        ? "STAFF"
        : "CUSTOMER";
      setFormType(newType);
      if (newType === "CUSTOMER") {
        newFormData.branch_id = "";
      }
    }
    setFormData(newFormData);
  };

  const handleFormTypeChange = (type) => {
    setFormType(type);
    if (type === "CUSTOMER") {
      setFormData({ ...formData, role: "CUSTOMER", branch_id: "" });
    } else {
      setFormData({ ...formData, role: "STAFF" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let apiCall;

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    if (isEditing) {
      if (formType === "CUSTOMER") {
        const url = `/admin/users/customer/${editingUser.user_id}`;
        apiCall = API.put(url, payload);
      } else {
        const url = `/admin/users/staff/${editingUser.user_id}`;
        payload.role = formData.role;
        payload.branch_id = formData.branch_id;
        apiCall = API.put(url, payload);
      }
    } else {
      if (!formData.password) {
        alert("Mật khẩu là bắt buộc khi tạo user mới.");
        return;
      }
      payload.password = formData.password;

      if (formType === "CUSTOMER") {
        const url = `/admin/users/customer`;
        apiCall = API.post(url, payload);
      } else {
        const url = `/admin/users/staff`;
        payload.role = formData.role;
        payload.branch_id = formData.branch_id;
        apiCall = API.post(url, payload);
      }
    }

    try {
      const response = await apiCall;

      alert(response.data.message);
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi kết nối server.");
    }
  };
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await API.delete(`/admin/users/${userToDelete.user_id}`);

      alert(response.data.message);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const renderRoleBadge = (role) => {
    let variant = "secondary";
    if (role === "CUSTOMER") variant = "success";
    if (role === "STAFF") variant = "primary";
    if (role === "CHEF") variant = "warning";
    if (role === "SHIPPER") variant = "info";
    if (role === "ADMIN") variant = "danger";
    return <Badge bg={variant}>{role}</Badge>;
  };

  const getBranchName = (branchId) => {
    if (!branchId) return "—";
    const branch = branches.find((b) => b.branch_id === branchId);
    return branch ? branch.name : "N/A";
  };

  return (
    <Container fluid className="p-0">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header className="p-3 bg-white">
          <Row className="justify-content-between align-items-center">
            <Col xs="auto">
              <h3 className="mb-0 text-dark">👥 Quản lý Người dùng</h3>
            </Col>
            <Col xs="auto">
              <Button variant="primary" onClick={handleShowCreate}>
                + Thêm Người dùng
              </Button>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body>
          <Nav
            variant="tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Nav.Item>
              <Nav.Link eventKey="all">Tất cả ({users.length})</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="staff">
                Nhân viên (
                {
                  users.filter((u) =>
                    ["STAFF", "CHEF", "SHIPPER"].includes(u.role)
                  ).length
                }
                )
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="customer">
                Khách hàng (
                {users.filter((u) => u.role === "CUSTOMER").length})
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Row className="mb-3">
            <Col md={5} lg={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

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
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Role</th>
                  <th>Chi nhánh</th>
                  <th className="text-center" style={{ width: "130px" }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td className="fw-semibold">{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{renderRoleBadge(user.role)}</td>
                      <td>{getBranchName(user.branch_id)}</td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="warning"
                          className="me-2"
                          onClick={() => handleShowEdit(user)}
                          disabled={user.role === "ADMIN"}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.role === "ADMIN"}
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      {/* SỬA: Hiển thị thông báo tìm kiếm */}
                      Không tìm thấy người dùng nào {searchTerm && `khớp với "${searchTerm}"`}.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* --- MODAL THÊM/SỬA --- */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing
              ? `Sửa User: ${editingUser?.name}`
              : "Tạo User Mới"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {!isEditing && (
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>
                  Loại User
                </Form.Label>
                <Col sm={9}>
                  <Button
                    variant={
                      formType === "CUSTOMER" ? "primary" : "outline-primary"
                    }
                    onClick={() => handleFormTypeChange("CUSTOMER")}
                    className="me-2"
                  >
                    Khách hàng
                  </Button>
                  <Button
                    variant={
                      formType === "STAFF" ? "primary" : "outline-primary"
                    }
                    onClick={() => handleFormTypeChange("STAFF")}
                  >
                    Nhân viên
                  </Button>
                </Col>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  isEditing ? "Để trống nếu không muốn đổi" : "Bắt buộc khi tạo mới"
                }
                required={!isEditing}
              />
            </Form.Group>

            {formType === "STAFF" && (
              <>
                <hr />
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role Nhân viên</Form.Label>
                      <Form.Select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required={formType === "STAFF"}
                        disabled={isEditing}
                      >
                        {!isEditing && (
                          <>
                            <option value="STAFF">STAFF (Bán hàng)</option>
                            <option value="CHEF">CHEF (Bếp)</option>
                            <option value="SHIPPER">SHIPPER (Giao hàng)</option>
                          </>
                        )}
                        {isEditing && (
                          <option value={formData.role}>{formData.role}</option>
                        )}
                      </Form.Select>
                      {isEditing && (
                        <Form.Text muted>
                          Không thể thay đổi role sau khi tạo.
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Chi nhánh</Form.Label>
                      <Form.Select
                        name="branch_id"
                        value={formData.branch_id}
                        onChange={handleChange}
                        required={formType === "STAFF"}
                      >
                        <option value="">-- Chọn chi nhánh --</option>
                        {branches.map((b) => (
                          <option key={b.branch_id} value={b.branch_id}>
                            {b.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="success" type="submit">
              {isEditing ? "Lưu thay đổi" : "Tạo User"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* --- MODAL XÁC NHẬN XÓA --- */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa user
          <strong>
            {" "}
            {userToDelete?.name} ({userToDelete?.email})
          </strong>
          ?
          <br />
          Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Xóa ngay
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}