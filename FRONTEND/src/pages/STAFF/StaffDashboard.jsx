import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Navbar,
  Nav,
  Card,
  Table,
  Button,
  Offcanvas,
} from "react-bootstrap";
import { Routes, Route, Link } from "react-router-dom";
import StaffOrder from "./StaffOrder"
import StaffMenu from "./StaffMenu";
import StaffProduct from "./StaffProduct";
import StaffCategory from "./StaffCategory";
import StaffStat from "./StaffStat"

function SidebarContent({ onLinkClick }) {
  return (
    <Nav className="flex-column">
      <Nav.Link as={Link} to="/staff/stat" className="text-white" onClick={onLinkClick}>
        Dashboard
      </Nav.Link>
      <Nav.Link as={Link} to="/staff/category" className="text-white" onClick={onLinkClick}>
        Category
      </Nav.Link>
      <Nav.Link as={Link} to="/staff/menu" className="text-white" onClick={onLinkClick}>
        Menu
      </Nav.Link>
      <Nav.Link as={Link} to="/staff/orders" className="text-white" onClick={onLinkClick}>
        Orders
      </Nav.Link>
      <Nav.Link as={Link} to="/staff/products" className="text-white" onClick={onLinkClick}>
        Products
      </Nav.Link>
    </Nav>
  );
}


function Header({ onToggleSidebar }) {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm sticky-top">
      <Container fluid>
        <Button
          variant="outline-secondary"
          onClick={onToggleSidebar}
          className="d-lg-none me-2"
        >
          <i className="bi bi-list"></i>
          Menu
        </Button>

        <Navbar.Brand href="#">Staff Dashboard</Navbar.Brand>

      </Container>
    </Navbar>
  );
}

export default function StaffDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const handleSidebarClose = () => setShowSidebar(false);
  const handleSidebarToggle = () => setShowSidebar((prev) => !prev);

  return (
    <div>
      <Header onToggleSidebar={handleSidebarToggle} />
      <Container fluid>
        <Row>
          <Col
            lg={2}
            className="bg-dark text-white vh-100 position-fixed d-none d-lg-flex flex-column p-3"
            style={{ width: "220px" }}
          >
            <h4 className="text-center mb-4">Staff Panel</h4>
            <SidebarContent onLinkClick={null} />
          </Col>
          <Offcanvas
            show={showSidebar}
            onHide={handleSidebarClose}
            className="bg-dark text-white d-lg-none"
            responsive="lg"
          >
            <Offcanvas.Header closeButton closeVariant="white">
              <Offcanvas.Title>Staff Panel</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <SidebarContent onLinkClick={handleSidebarClose} />
            </Offcanvas.Body>
          </Offcanvas>
          <Col
            xs={12}
            lg={{ span: 10, offset: 2 }}
            className="p-4"
          >
            <Routes>
              <Route path="stat" element={<StaffStat />} />
              <Route path="menu" element={<StaffMenu />} />
              <Route path="orders" element={<StaffOrder/>} />
              <Route path="products" element={<StaffProduct/>} />
              <Route path="category" element={<StaffCategory/>} />
            </Routes>
          </Col>
        </Row>
      </Container>
    </div>
  );
}