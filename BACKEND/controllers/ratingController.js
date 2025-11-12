import db from "../config/db.js";

export const createRating = async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    const user_id = req.user.user_id;

    if (!order_id || !rating)
      return res.status(400).json({ message: "Missing order_id or rating" });

    const [orderResult] = await db.query(
      `SELECT order_id, user_id, branch_id, status, created_at, customer_name 
       FROM orders 
       WHERE order_id = ? AND user_id = ?`,
      [order_id, user_id]
    );

    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be 1–5" });

    if (!orderResult.length)
      return res.status(404).json({ message: "Order not found" });

    const order = orderResult[0];

    if (order.status !== "COMPLETED")
      return res
        .status(400)
        .json({ message: "You can only rate completed orders" });

    const [existing] = await db.query(
      `SELECT rating_id FROM ratings WHERE order_id = ? AND user_id = ?`,
      [order_id, user_id]
    );
    if (existing.length)
      return res.status(400).json({ message: "You already rated this order" });

    await db.query(
      `INSERT INTO ratings (order_id, user_id, branch_id, rating, comment, customer_name, order_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        user_id,
        order.branch_id,
        rating,
        comment || null,
        order.customer_name,
        order.created_at,
      ]
    );

    res.json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getRatingsByBranch = async (req, res) => {
  try {
    const { branch_id } = req.params;

    const [ratings] = await db.query(
      `SELECT rating_id, rating, comment, customer_name, order_date, created_at
       FROM ratings
       WHERE branch_id = ?
       ORDER BY created_at DESC`,
      [branch_id]
    );

    const [avgResult] = await db.query(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total
       FROM ratings
       WHERE branch_id = ?`,
      [branch_id]
    );

    const summary = avgResult[0] || { avg_rating: 0, total: 0 };

    res.json({ summary, ratings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkRated = async (req, res) => {
  try {
    const { order_id } = req.params;
    const user_id = req.user.user_id;

    const [existing] = await db.query(
      `SELECT rating, comment FROM ratings WHERE order_id = ? AND user_id = ?`,
      [order_id, user_id]
    );

    if (!existing.length) return res.json({ rated: false });

    res.json({
      rated: true,
      rating: existing[0].rating,
      comment: existing[0].comment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateRating = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.user_id;

    if (!rating)
      return res.status(400).json({ message: "Missing rating" });

    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be 1–5" });

    const [existing] = await db.query(
      `SELECT rating_id FROM ratings WHERE order_id = ? AND user_id = ?`,
      [order_id, user_id]
    );

    if (!existing.length)
      return res.status(404).json({ message: "Rating not found" });

    await db.query(
      `UPDATE ratings 
       SET rating = ?, comment = ?
       WHERE order_id = ? AND user_id = ?`,
      [rating, comment || null, order_id, user_id]
    );

    res.json({ message: "Rating updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
