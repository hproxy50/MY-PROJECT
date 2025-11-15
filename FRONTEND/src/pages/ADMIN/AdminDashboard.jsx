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
import AdminStaffCRUD from "./AdminStaffCRUD";
import AdminBranches from "./AdminBranches";
import AdminPromtion from "./AdminPromotion";
import AdminStat from "./AdminStat";

function SidebarContent({ onLinkClick }) {
  return (
    <Nav className="flex-column">
      <Nav.Link
        as={Link}
        to="/admin/adminStat"
        className="text-white"
        onClick={onLinkClick}
      >
        Dashboard
      </Nav.Link>
      <Nav.Link
        as={Link}
        to="/admin/staffCRUD"
        className="text-white"
        onClick={onLinkClick}
      >
        Account manager
      </Nav.Link>
      <Nav.Link
        as={Link}
        to="/admin/adminBranches"
        className="text-white"
        onClick={onLinkClick}
      >
        Branches
      </Nav.Link>
      <Nav.Link
        as={Link}
        to="/admin/adminPromotion"
        className="text-white"
        onClick={onLinkClick}
      >
        Promotion
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
        <Navbar.Brand href="#">Admin Dashboard</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll" className="justify-content-end">
          <Nav>
            <Nav.Link
              onClick={() => {
                const confirmed = window.confirm("Are you sure to log out?");
                if (confirmed) {
                  localStorage.removeItem("token");
                  navigate("/");
                }
              }}
            >
              Logout
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
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
            <h4 className="text-center mb-4">Admin Panel</h4>
            <SidebarContent onLinkClick={null} />
          </Col>
          <Offcanvas
            show={showSidebar}
            onHide={handleSidebarClose}
            className="bg-dark text-white d-lg-none"
            responsive="lg"
          >
            <Offcanvas.Header closeButton closeVariant="white">
              <Offcanvas.Title>Admin Panel</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <SidebarContent onLinkClick={handleSidebarClose} />
            </Offcanvas.Body>
          </Offcanvas>
          <Col xs={12} lg={{ span: 10, offset: 2 }} className="p-4">
            <Routes>
              <Route path="staffCRUD" element={<AdminStaffCRUD />} />
              <Route path="adminBranches" element={<AdminBranches />} />
              <Route path="adminPromotion" element={<AdminPromtion />} />
              <Route path="adminStat" element={<AdminStat />} />
            </Routes>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
