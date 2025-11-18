import db from "../config/db.js";

export const getPromotions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, b.name as branch_name
       FROM promotions p
       LEFT JOIN branches b ON p.branch_id = b.branch_id
       ORDER BY p.created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT p.*, b.name as branch_name
       FROM promotions p
       LEFT JOIN branches b ON p.branch_id = b.branch_id
       WHERE promo_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const createPromotion = async (req, res) => {
  try {
    
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    let {
      title,
      description,
      discount_type,
      discount_value,
      min_order_value,
      start_date,
      end_date,
      branch_id,
    } = req.body;

    if (typeof title === "string") title = title.trim();
    if (!title) return res.status(400).json({ message: "Title is required" });

    
    discount_value = Number(discount_value);
    if (isNaN(discount_value) || discount_value <= 0) {
      return res.status(400).json({ message: "Invalid discount value" });
    }
    if (discount_type === "PERCENT" && discount_value > 100) {
      return res.status(400).json({ message: "Percentage cannot exceed 100%" });
    }

    
    if (min_order_value === undefined || min_order_value === "")
      min_order_value = 0;
    min_order_value = Number(min_order_value);
    if (isNaN(min_order_value) || min_order_value < 0) {
      return res.status(400).json({ message: "Invalid minimum order value" });
    }

    
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (start >= end) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });
    }

    
    if (!branch_id)
      return res.status(400).json({ message: "Branch is required" });
  

    await db.query(
      `INSERT INTO promotions 
       (title, description, discount_type, discount_value, min_order_value, start_date, end_date, branch_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title,
        description,
        discount_type,
        discount_value,
        min_order_value,
        start_date,
        end_date,
        branch_id,
      ]
    );

    return res.status(201).json({ message: "Promotion created successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ message: "Access denied" });

    const { id } = req.params;
    
    let {
      title,
      description,
      discount_type,
      discount_value,
      min_order_value,
      start_date,
      end_date,
      branch_id,
    } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM promotions WHERE promo_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Promotion not found" });
    const oldData = rows[0];

    if (title !== undefined) title = title.trim();

    const newStartStr =
      start_date !== undefined ? start_date : oldData.start_date;
    const newEndStr = end_date !== undefined ? end_date : oldData.end_date;

    const newStart = new Date(newStartStr);
    const newEnd = new Date(newEndStr);

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      return res.status(400).json({ message: "Invalid date format provided" });
    }
    if (newStart >= newEnd) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });
    }

    if (discount_value !== undefined) {
      discount_value = Number(discount_value);
      if (isNaN(discount_value) || discount_value <= 0)
        return res.status(400).json({ message: "Invalid discount value" });
      const checkType = discount_type || oldData.discount_type;
      if (checkType === "PERCENT" && discount_value > 100)
        return res.status(400).json({ message: "Percent > 100" });
    }

    const uTitle = title !== undefined ? title : oldData.title;
    const uDesc = description !== undefined ? description : oldData.description;
    const uType =
      discount_type !== undefined ? discount_type : oldData.discount_type;
    const uValue =
      discount_value !== undefined ? discount_value : oldData.discount_value;
    const uMinOrder =
      min_order_value !== undefined
        ? Number(min_order_value)
        : oldData.min_order_value;
    const uBranch = branch_id !== undefined ? branch_id : oldData.branch_id;

    await db.query(
      `UPDATE promotions 
       SET title=?, description=?, discount_type=?, discount_value=?, min_order_value=?, start_date=?, end_date=?, branch_id=?, updated_at=NOW() 
       WHERE promo_id=?`,
      [uTitle, uDesc, uType, uValue, uMinOrder, newStart, newEnd, uBranch, id]
    );

    return res.json({ message: "Promotion updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ message: "Access denied" });
    const { id } = req.params;
    await db.query("DELETE FROM promotions WHERE promo_id = ?", [id]);
    return res.json({ message: "Promotion deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
