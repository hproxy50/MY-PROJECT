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
      return res.status(403).json({ message: "Only admin has permission" });
    }

    let {
      title,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      branch_id,
    } = req.body;

    // Trim
    if (typeof title === "string") title = title.trim();
    if (typeof description === "string") description = description.trim();

    
    if (!title) return res.status(400).json({ message: "Voucher name cannot be blank" });
    if (!discount_type || !["PERCENT", "AMOUNT"].includes(discount_type)) {
      return res.status(400).json({ message: "discount_type must be PERCENT or AMOUNT" });
    }
    if (!discount_value || isNaN(discount_value)) {
      return res.status(400).json({ message: "discount_value must be a valid number" });
    }
    discount_value = Number(discount_value);
    if (discount_type === "PERCENT" && (discount_value <= 0 || discount_value > 100)) {
      return res.status(400).json({ message: "Percentage value must be between 1-100" });
    }
    if (discount_type === "AMOUNT" && discount_value <= 0) {
      return res.status(400).json({ message: "The discount value must be greater than 0" });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ message: "Start and end dates cannot be blank" });
    }
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: "Start date must be less than end date" });
    }

    
    if (!branch_id) return res.status(400).json({message:"Branch cannot be blank"})

    if (branch_id) {
      const [branchRows] = await db.query("SELECT * FROM branches WHERE branch_id = ?", [branch_id]);
      if (branchRows.length === 0) {
        return res.status(400).json({ message: "Branch does not exist" });
      }
    } 

    await db.query(
      `INSERT INTO promotions 
       (title, description, discount_type, discount_value, start_date, end_date, branch_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, discount_type, discount_value, start_date, end_date, branch_id]
    );

    return res.status(201).json({ message: "Added voucher successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin has permission" });
    }

    const { id } = req.params;
    let {
      title,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      branch_id,
    } = req.body;

    
    const [rows] = await db.query("SELECT * FROM promotions WHERE promo_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Voucher not found" });
    const oldData = rows[0];

    
    if (typeof title === "string") title = title.trim();
    if (typeof description === "string") description = description.trim();

    
    if (title !== undefined && title === "") {
      return res.status(400).json({ message: "Voucher name cannot be blank" });
    }

    if (discount_type !== undefined && !["PERCENT", "AMOUNT"].includes(discount_type)) {
      return res.status(400).json({ message: "discount_type must be PERCENT or AMOUNT" });
    }

    if (discount_value !== undefined) {
      discount_value = Number(discount_value);
      if (isNaN(discount_value)) {
        return res.status(400).json({ message: "discount_value must be a valid number" });
      }
      if (discount_type === "PERCENT" && (discount_value <= 0 || discount_value > 100)) {
        return res.status(400).json({ message: "Percentage value must be between 1-100" });
      }
      if (discount_type === "AMOUNT" && discount_value <= 0) {
        return res.status(400).json({ message: "The discount value must be greater than 0" });
      }
    }

    if (start_date !== undefined && end_date !== undefined) {
      if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({ message: "Start date must be less than end date" });
      }
    }

    
    if (branch_id !== undefined && branch_id !== null) {
      const [branchRows] = await db.query("SELECT * FROM branches WHERE branch_id = ?", [branch_id]);
      if (branchRows.length === 0) {
        return res.status(400).json({ message: "Branch does not exist" });
      }
    }

    
    title = title || oldData.title;
    description = description || oldData.description;
    discount_type = discount_type || oldData.discount_type;
    discount_value = discount_value !== undefined ? discount_value : oldData.discount_value;
    start_date = start_date || oldData.start_date;
    end_date = end_date || oldData.end_date;
    branch_id = branch_id !== undefined ? branch_id : oldData.branch_id;

    
    const noChange =
      title === oldData.title &&
      description === oldData.description &&
      discount_type === oldData.discount_type &&
      discount_value === oldData.discount_value &&
      new Date(start_date).getTime() === new Date(oldData.start_date).getTime() &&
      new Date(end_date).getTime() === new Date(oldData.end_date).getTime() &&
      branch_id === oldData.branch_id;

    if (noChange) {
      return res.status(400).json({ message: "No information has been changed" });
    }

    await db.query(
      `UPDATE promotions 
       SET title=?, description=?, discount_type=?, discount_value=?, start_date=?, end_date=?, branch_id=?, updated_at=NOW() 
       WHERE promo_id=?`,
      [title, description, discount_type, discount_value, start_date, end_date, branch_id, id]
    );

    return res.json({ message: "Voucher update successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};


export const deletePromotion = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin has permission" });
    }

    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM promotions WHERE promo_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Voucher not found" });

    await db.query("DELETE FROM promotions WHERE promo_id = ?", [id]);
    return res.json({ message: "Voucher deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
