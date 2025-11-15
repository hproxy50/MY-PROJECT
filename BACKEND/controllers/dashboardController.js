import db from "../config/db.js";

export const getStaffDashboardMetrics = async (req, res) => {
  try {
    const staffBranchId = req.user.branch_id;

    if (!staffBranchId) {
      return res
        .status(400)
        .json({ message: "The employee has not been assigned to any branch." });
    }
    const sqlQuery = `
      SELECT 
        COALESCE(SUM(final_price), 0) AS total_revenue
      FROM orders
      WHERE 
        branch_id = ? 
        AND status = 'COMPLETED'
    `;

    const [rows] = await db.query(sqlQuery, [staffBranchId]);

    const totalRevenue = rows[0].total_revenue;

    res.json({
      branch_id: staffBranchId,
      total_revenue: Number(totalRevenue),
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu dashboard:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const getStaffDashboardSummary = async (req, res) => {
  try {
    const staffBranchId = req.user.branch_id;
    if (!staffBranchId) {
      return res
        .status(400)
        .json({ message: "The employee has not been assigned to any branch" });
    }

    // 1. Doanh thu (Ngày, Tuần, Tháng)
    const [revenueData] = await db.query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN final_price ELSE 0 END), 0) AS revenue_today,
        COALESCE(SUM(CASE WHEN YEARWEEK(created_at) = YEARWEEK(CURDATE()) THEN final_price ELSE 0 END), 0) AS revenue_week,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN final_price ELSE 0 END), 0) AS revenue_month
      FROM orders
      WHERE 
        branch_id = ? AND status = 'COMPLETED'
    `,
      [staffBranchId]
    );

    // 2. Trạng thái đơn hàng
    const [orderStatusData] = await db.query(
      `
      SELECT 
        status, 
        COUNT(*) as count
      FROM orders
      WHERE 
        branch_id = ? 
        AND status IN ('PENDING', 'PREPARING', 'DELIVERY', 'COMPLETED')
      GROUP BY status
    `,
      [staffBranchId]
    );

    // Chuyển mảng kết quả thành object cho dễ dùng
    const order_counts = orderStatusData.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] = item.count;
        return acc;
      },
      { pending: 0, preparing: 0, delivery: 0, completed: 0 }
    ); // Đảm bảo có giá trị default

    // 3. Tình trạng kho
    const [stockData] = await db.query(
      `
      SELECT 
        SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        SUM(CASE WHEN is_available = 1 AND stock_quantity < 10 THEN 1 ELSE 0 END) AS low_stock_count
      FROM menu_items
      WHERE branch_id = ?
    `,
      [staffBranchId]
    );

    // 4. Biểu đồ: Doanh thu 7 ngày qua
    const [revenueByDayData] = await db.query(
      `
      SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') as date,
      SUM(final_price) as revenue
      FROM orders
      WHERE 
      branch_id = ? 
      AND status = 'COMPLETED' 
      AND created_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY date
      ORDER BY date ASC
    `,
      [staffBranchId]
    );

    // 5. Biểu đồ: Top 5 món bán chạy
    const [topItemsData] = await db.query(
      `
      SELECT 
        m.name, 
        SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN menu_items m ON oi.item_id = m.item_id
      WHERE 
        o.branch_id = ? AND o.status = 'COMPLETED'
      GROUP BY m.item_id, m.name
      ORDER BY total_sold DESC
      LIMIT 5
    `,
      [staffBranchId]
    );

    // 6. Biểu đồ: Rating trung bình
    const [ratingData] = await db.query(
      `
      SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_ratings
      FROM ratings
      WHERE branch_id = ?
    `,
      [staffBranchId]
    );

    // Trả về tất cả dữ liệu
    res.json({
      revenue: {
        today: Number(revenueData[0].revenue_today),
        week: Number(revenueData[0].revenue_week),
        month: Number(revenueData[0].revenue_month),
      },
      order_counts: order_counts,
      stock_status: {
        low_stock: Number(stockData[0].low_stock_count),
        out_of_stock: Number(stockData[0].out_of_stock_count),
      },
      charts: {
        revenue_by_day: revenueByDayData,
        top_5_items: topItemsData,
        rating: {
          average: Number(ratingData[0].average_rating).toFixed(1),
          total: Number(ratingData[0].total_ratings),
        },
      },
    });
  } catch (error) {
    console.error("Error when retrieving summary dashboard data:", error);
    res.status(500).json({ message: "Server error" });
  }
};
