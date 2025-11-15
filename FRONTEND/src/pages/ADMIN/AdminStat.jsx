import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  ListGroup,
} from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useAdminDashboard } from "./useAdminDashboard"; 

// --- Helpers (Copy từ StaffStat) ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

function StatCard({ title, value, icon, bgColor, isLoading }) {
  return (
    <Card className={`text-white mb-3 shadow ${bgColor}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title">{title}</h5>
            <h3 className="mb-0">
              {isLoading ? <Spinner animation="grow" size="sm" /> : value}
            </h3>
          </div>
          <i className={`bi ${icon} fs-1 opacity-50`}></i>
        </div>
      </Card.Body>
    </Card>
  );
}

// --- Biểu đồ cho Admin ---

function RevenueByBranchChart({ data, isLoading }) {
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Card.Title>Doanh thu theo chi nhánh</Card.Title>
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis dataKey="branch_name" type="category" width={100} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total_revenue" fill="#8884d8" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
}

function RatingByBranchChart({ data, isLoading }) {
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Card.Title>Đánh giá trung bình theo chi nhánh</Card.Title>
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch_name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="average_rating"
                fill="#82ca9d"
                name="Rating (TB)"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
}

function CustomerGrowthChart({ data, isLoading }) {
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Card.Title>Khách hàng mới (12 tháng qua)</Card.Title>
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="new_customers"
                stroke="#ff7300"
                name="Khách hàng mới"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
}

function TopItemsChart({ data, isLoading }) {
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF",
    "#FF4560", "#775DD0", "#546E7A", "#26a69a", "#D10CE8"
  ];
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Card.Title>Top 10 món bán chạy</Card.Title>
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Row>
            <Col md={5}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total_sold"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    fill="#8884d8"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </Col>
            <Col md={7} className="d-flex align-items-center">
              <ListGroup variant="flush" className="w-100">
                {data.map((item, index) => (
                  <ListGroup.Item
                    key={index}
                    className="d-flex justify-content-between"
                  >
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "10px",
                          height: "10px",
                          backgroundColor: COLORS[index % COLORS.length],
                          marginRight: "8px",
                          borderRadius: "50%",
                        }}
                      ></span>
                      {item.name}
                    </span>
                    <strong>{item.total_sold}</strong>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}

// --- Component Chính ---
export default function AdminStat() {
  const { dashboardData, isLoading, isError } = useAdminDashboard();

  if (isError) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Lỗi!</Alert.Heading>
        <p>Không thể tải dữ liệu dashboard. Vui lòng thử lại.</p>
        <pre>{isError.response?.data?.message || isError.message}</pre>
      </Alert>
    );
  }

  // Gán giá trị mặc định khi đang loading
  const data = dashboardData || {
    kpi: {
      revenue: {},
      orders: {},
      order_status: {},
      users: {},
    },
    charts: {
      revenue_by_branch: [],
      rating_by_branch: [],
      customer_growth: [],
      top_10_items: [],
    },
  };

  return (
    <Container fluid>
      <h2 className="mb-4">Dashboard toàn hệ thống</h2>

      {/* Hàng 1: 4 Thẻ KPI chính */}
      <Row>
        <Col md={6} lg={3}>
          <StatCard
            title="Doanh thu hôm nay"
            value={formatCurrency(data.kpi.revenue.today)}
            icon="bi-cash-coin"
            bgColor="bg-success"
            isLoading={isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Đơn hàng hôm nay"
            value={data.kpi.orders.today || 0}
            icon="bi-receipt"
            bgColor="bg-info"
            isLoading={isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Tổng khách hàng"
            value={data.kpi.users.customers || 0}
            icon="bi-people"
            bgColor="bg-primary"
            isLoading={isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Tổng nhân viên"
            value={data.kpi.users.total_staff || 0}
            icon="bi-person-badge"
            bgColor="bg-secondary"
            isLoading={isLoading}
          />
        </Col>
      </Row>

      {/* Hàng 2: Trạng thái đơn hàng + Doanh thu/Đơn tuần/tháng */}
      <Row>
        <Col lg={5}>
          <Card className="shadow-sm mb-3">
            <Card.Header>
              <Card.Title className="mb-0">Trạng thái đơn (Live)</Card.Title>
            </Card.Header>
            <Card.Body className="text-center">
              <Row>
                <Col>
                  <h5>Đang chờ</h5>
                  <h3 className="text-info">
                    {isLoading ? <Spinner size="sm" /> : data.kpi.order_status.pending}
                  </h3>
                </Col>
                <Col>
                  <h5>Đang chuẩn bị</h5>
                  <h3 className="text-secondary">
                    {isLoading ? <Spinner size="sm" /> : data.kpi.order_status.preparing}
                  </h3>
                </Col>
                <Col>
                  <h5>Đang giao</h5>
                  <h3 className="text-primary">
                    {isLoading ? <Spinner size="sm" /> : data.kpi.order_status.delivery}
                  </h3>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={7}>
          <Card className="shadow-sm mb-3">
            <Card.Header>
              <Card.Title className="mb-0">Tổng quan Tuần / Tháng</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <strong>Doanh thu tuần:</strong>
                  <p className="fs-5 text-success">
                    {isLoading ? <Spinner size="sm" /> : formatCurrency(data.kpi.revenue.week)}
                  </p>
                </Col>
                <Col>
                  <strong>Doanh thu tháng:</strong>
                  <p className="fs-5 text-success">
                    {isLoading ? <Spinner size="sm" /> : formatCurrency(data.kpi.revenue.month)}
                  </p>
                </Col>
              </Row>
              <Row>
                 <Col>
                  <strong>Đơn hàng tuần:</strong>
                  <p className="fs-5 text-info">
                    {isLoading ? <Spinner size="sm" /> : data.kpi.orders.week}
                  </p>
                </Col>
                <Col>
                  <strong>Đơn hàng tháng:</strong>
                  <p className="fs-5 text-info">
                    {isLoading ? <Spinner size="sm" /> : data.kpi.orders.month}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Hàng 3: Biểu đồ Doanh thu + Rating */}
      <Row>
        <Col lg={7}>
          <RevenueByBranchChart
            data={data.charts.revenue_by_branch}
            isLoading={isLoading}
          />
        </Col>
        <Col lg={5}>
          <RatingByBranchChart
            data={data.charts.rating_by_branch}
            isLoading={isLoading}
          />
        </Col>
      </Row>

      {/* Hàng 4: Tăng trưởng KH + Top 10 */}
      <Row className="mt-3">
        <Col lg={6}>
          <CustomerGrowthChart
            data={data.charts.customer_growth}
            isLoading={isLoading}
          />
        </Col>
        <Col lg={6}>
          <TopItemsChart
            data={data.charts.top_10_items}
            isLoading={isLoading}
          />
        </Col>
      </Row>
    </Container>
  );
}