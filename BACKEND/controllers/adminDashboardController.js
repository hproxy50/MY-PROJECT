import db from "../config/db.js";


export const getAdminDashboardSummary = async (req, res) => {
  try {
    // 1. Revenue (Today, Week, Month)
    const [revenueData] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN final_price ELSE 0 END), 0) AS revenue_today,
        COALESCE(SUM(CASE WHEN YEARWEEK(created_at) = YEARWEEK(CURDATE()) THEN final_price ELSE 0 END), 0) AS revenue_week,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN final_price ELSE 0 END), 0) AS revenue_month
      FROM orders
      WHERE status = 'COMPLETED'
    `);

    // 2. Total orders (Today, Week, Month) & Order status
    const [orderData] = await db.query(`
      SELECT 
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as orders_today,
        COUNT(CASE WHEN YEARWEEK(created_at) = YEARWEEK(CURDATE()) THEN 1 END) as orders_week,
        COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 END) as orders_month,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as orders_pending,
        SUM(CASE WHEN status = 'PREPARING' THEN 1 ELSE 0 END) as orders_preparing,
        SUM(CASE WHEN status = 'DELIVERY' THEN 1 ELSE 0 END) as orders_delivery
      FROM orders
    `);

    // 3. Total Users (Customers, Employees)
    const [userData] = await db.query(`
      SELECT 
        SUM(CASE WHEN role = 'CUSTOMER' THEN 1 ELSE 0 END) as total_customers,
        SUM(CASE WHEN role = 'STAFF' THEN 1 ELSE 0 END) as total_staff,
        SUM(CASE WHEN role = 'CHEF' THEN 1 ELSE 0 END) as total_chef,
        SUM(CASE WHEN role = 'SHIPPER' THEN 1 ELSE 0 END) as total_shipper
      FROM users
    `);

    // 4. CHART: Revenue by branch
    const [revenueByBranch] = await db.query(`
      SELECT b.name as branch_name, SUM(o.final_price) as total_revenue
      FROM orders o
      JOIN branches b ON o.branch_id = b.branch_id
      WHERE o.status = 'COMPLETED'
      GROUP BY o.branch_id, b.name
      ORDER BY total_revenue DESC
    `);

    // 5. CHART: Rating by branch
    const [ratingByBranch] = await db.query(`
      SELECT b.name as branch_name, COALESCE(AVG(r.rating), 0) as average_rating
      FROM branches b
      LEFT JOIN ratings r ON b.branch_id = r.branch_id
      GROUP BY b.branch_id, b.name
      ORDER BY average_rating DESC
    `);

    // 6. CHART: Customer growth (past 12 months)
    const [customerGrowth] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as new_customers
      FROM users
      WHERE role = 'CUSTOMER' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    // 7. CHART: Top 10 best-selling items
    const [top10Items] = await db.query(`
      SELECT m.name, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN menu_items m ON oi.item_id = m.item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status = 'COMPLETED'
      GROUP BY m.item_id, m.name
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    res.json({
      kpi: {
        revenue: {
          today: Number(revenueData[0].revenue_today),
          week: Number(revenueData[0].revenue_week),
          month: Number(revenueData[0].revenue_month),
        },
        orders: {
          today: Number(orderData[0].orders_today),
          week: Number(orderData[0].orders_week),
          month: Number(orderData[0].orders_month),
        },
        order_status: {
          pending: Number(orderData[0].orders_pending),
          preparing: Number(orderData[0].orders_preparing),
          delivery: Number(orderData[0].orders_delivery),
        },
        users: {
          customers: Number(userData[0].total_customers),
          staff: Number(userData[0].total_staff),
          chef: Number(userData[0].total_chef),
          shipper: Number(userData[0].total_shipper),
          total_staff: Number(userData[0].total_staff) + Number(userData[0].total_chef) + Number(userData[0].total_shipper)
        }
      },
      charts: {
        revenue_by_branch: revenueByBranch,
        rating_by_branch: ratingByBranch.map(r => ({ ...r, average_rating: Number(r.average_rating).toFixed(1) })),
        customer_growth: customerGrowth,
        top_10_items: top10Items
      }
    });

  } catch (error) {
    handleDBError(res, error, "Get admin dashboard data");
  }
};

const handleDBError = (res, error, context) => {
  console.error(`Error ${context}:`, error);
  res.status(500).json({ message: "Server error" });
};
