import React from "react";
import { Container, Row, Col, Navbar, Nav, Card, Table, Button } from "react-bootstrap";
import { Routes, Route, Link } from "react-router-dom";
import StaffOrder from "./StaffOrder"

// ----- Sidebar -----
function Sidebar() {
  return (
    <div
      className="bg-dark text-white vh-100 position-fixed d-flex flex-column p-3"
      style={{ width: "220px" }}
    >
      <h4 className="text-center mb-4">Staff Panel</h4>
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/staff/dashboard" className="text-white">Dashboard</Nav.Link>
        <Nav.Link as={Link} to="/staff/user" className="text-white">Users</Nav.Link>
        <Nav.Link as={Link} to="/staff/orders" className="text-white">Orders</Nav.Link>
        <Nav.Link as={Link} to="/staff/products" className="text-white">Products</Nav.Link>
        <Nav.Link as={Link} to="/staff/settings" className="text-white">Settings</Nav.Link>
      </Nav>
    </div>
  );
}

// ----- Header -----
function Header() {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm sticky-top">
      <Container fluid>
        <Navbar.Brand href="#">Staff Dashboard</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll" className="justify-content-end">
          <Nav>
            <Nav.Link href="#">Logout</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

// ----- Dashboard -----
function Dashboard() {
  return (
    <div>
      <h3 className="mb-4">📊 Dashboard Overview</h3>
      <Row className="mb-4">
        {["Users", "Orders Today", "Revenue", "Pending"].map((title, i) => (
          <Col md={3} key={i}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>{title}</Card.Title>
                <h2>{[1245, 87, "$5,430", 12][i]}</h2>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

// ----- Users -----
function Users() {
  return (
    <div>
      <h3>👥 User Management</h3>
      <Card className="shadow-sm mt-3">
        <Card.Header>All Users</Card.Header>
        <Card.Body className="p-0">
          <Table striped hover responsive>
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Nguyễn Văn A</td>
                <td>a@gmail.com</td>
                <td>Admin</td>
                <td><Button size="sm" variant="primary">Edit</Button></td>
              </tr>
              <tr>
                <td>2</td>
                <td>Trần Thị B</td>
                <td>b@gmail.com</td>
                <td>Staff</td>
                <td><Button size="sm" variant="primary">Edit</Button></td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}


// ----- Layout chính -----
export default function StaffDashboard() {
  return (
    <div>
      <Header />
      <Container fluid>
        <Row>
          <Col md={2} className="p-0">
            <Sidebar />
          </Col>

          {/* Nội dung chính thay đổi */}
          <Col md={{ span: 10, offset: 2 }} className="p-4" style={{ marginLeft: "220px" }}>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="user" element={<Users />} />
              <Route path="orders" element={<StaffOrder />} /> 
              {/* có thể thêm các route con khác ở đây */}
            </Routes>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
