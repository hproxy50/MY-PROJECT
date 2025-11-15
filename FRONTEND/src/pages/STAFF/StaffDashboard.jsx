import React, { useState } from "react"; // BỔ SUNG: useState
import {
  Container,
  Row,
  Col,
  Navbar,
  Nav,
  Card,
  Table,
  Button,
  Offcanvas, // BỔ SUNG: Offcanvas
} from "react-bootstrap";
import { Routes, Route, Link } from "react-router-dom";
import StaffOrder from "./StaffOrder"
import StaffMenu from "./StaffMenu";
import StaffProduct from "./StaffProduct";
import StaffCategory from "./StaffCategory";
import StaffStat from "./StaffStat"

// ----- Sidebar Content (Tách riêng nội dung để tái sử dụng) -----
function SidebarContent({ onLinkClick }) {
  // onLinkClick để đóng Offcanvas khi bấm link trên mobile
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



// ----- Layout chính (Sửa) -----
export default function StaffDashboard() {
  // BỔ SUNG: State để quản lý đóng/mở Offcanvas
  const [showSidebar, setShowSidebar] = useState(false);
  const handleSidebarClose = () => setShowSidebar(false);
  const handleSidebarToggle = () => setShowSidebar((prev) => !prev);

  return (
    <div>
      {/* Truyền hàm toggle vào Header */}
      <Header onToggleSidebar={handleSidebarToggle} />
      <Container fluid>
        <Row>
          {/* THAY ĐỔI: Sidebar trên Desktop
            - Dùng d-none d-lg-block để ẩn trên mobile, hiện trên desktop
            - Vẫn giữ position-fixed
          */}
          <Col
            lg={2}
            className="bg-dark text-white vh-100 position-fixed d-none d-lg-flex flex-column p-3"
            style={{ width: "220px" }}
          >
            <h4 className="text-center mb-4">Staff Panel</h4>
            <SidebarContent onLinkClick={null} /> {/* Không cần đóng khi bấm link */}
          </Col>

          {/* BỔ SUNG: Sidebar trên Mobile (Offcanvas)
            - Dùng d-lg-none để chỉ hiện trên mobile
            - Bị điều khiển bởi state showSidebar
          */}
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

          {/* THAY ĐỔI: Nội dung chính
            - Bỏ style marginLeft
            - Dùng Col xs={12} để full-width trên mobile
            - Dùng lg={{ span: 10, offset: 2 }} để đẩy nội dung sang phải 
              (bằng với độ rộng Col sidebar) trên desktop
          */}
          <Col
            xs={12}
            lg={{ span: 10, offset: 2 }}
            className="p-4"
            // BỎ: style={{ marginLeft: "220px" }}
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