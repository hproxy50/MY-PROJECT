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
} from "recharts";
import { useStaffDashboard } from "./useStaffDashboard"; 

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

function RevenueChart({ data, isLoading }) {
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Card.Title>Revenue for the last 7 days</Card.Title>
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
}

function TopItemsChart({ data, isLoading }) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Card.Title>Top 5 best-selling items</Card.Title>
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Row>
            <Col md={6}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total_sold"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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
            <Col md={6} className="d-flex align-items-center">
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

export default function StaffStat() {
  const { dashboardData, isLoading, isError } = useStaffDashboard();

  if (isError) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error!</Alert.Heading>
        <p>Unable to load dashboard data. Please try again</p>
      </Alert>
    );
  }
  const data = dashboardData || {
    revenue: {},
    order_counts: {},
    stock_status: {},
    charts: { revenue_by_day: [], top_5_items: [], rating: {} },
  };

  return (
    <Container fluid>
      <h2 className="mb-4">Branch Dashboard</h2>
      <Row>
        <Col md={6} lg={3}>
          <StatCard
            title="Today's revenue"
            value={formatCurrency(data.revenue.today)}
            icon="bi-cash-coin"
            bgColor="bg-success"
            isLoading={isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Order (Completed)"
            value={data.order_counts.completed || 0}
            icon="bi-check-circle"
            bgColor="bg-primary"
            isLoading={isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Almost out of stock (< 10)"
            value={data.stock_status.low_stock}
            icon="bi-box-seam"
            bgColor="bg-warning text-dark"
            isLoading={isLoading}
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Out of stock"
            value={data.stock_status.out_of_stock}
            icon="bi-x-circle"
            bgColor="bg-danger"
            isLoading={isLoading}
          />
        </Col>
      </Row>
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-3">
            <Card.Header>
              <Card.Title className="mb-0">Order status</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col>
                  <h5>Pending orders</h5>
                  <h3 className="text-info">
                    {isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      data.order_counts.pending || 0
                    )}
                  </h3>
                </Col>
                <Col>
                  <h5>Preparing orders</h5>
                  <h3 className="text-secondary">
                    {isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      data.order_counts.preparing || 0
                    )}
                  </h3>
                </Col>
                <Col>
                  <h5>In delivery progress orders</h5>
                  <h3 className="text-primary">
                    {isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      data.order_counts.delivery || 0
                    )}
                  </h3>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <StatCard
            title="Average Rating"
            value={`${data.charts.rating.average || 0} / 5 (${
              data.charts.rating.total || 0
            } ratings)`}
            icon="bi-star-fill"
            bgColor="bg-info"
            isLoading={isLoading}
          />
        </Col>
      </Row>

      <Row>
        <Col>
          <RevenueChart
            data={data.charts.revenue_by_day}//7d
            isLoading={isLoading}
          />
        </Col>
      </Row>

      <Row className="mt-3">
        <Col>
          <TopItemsChart data={data.charts.top_5_items} isLoading={isLoading} />
        </Col>
      </Row>
    </Container>
  );
}
