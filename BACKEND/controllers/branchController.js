import db from "../config/db.js";

export const getAllBranch = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT branch_id, name, address, phone, status, created_at FROM branches"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const createBranch = async (req, res) => {
  try {
    let { name, address, phone, status } = req.body;
    if (typeof name === "string") name = name.trim();
    if (typeof address === "string") address = address.trim();
    if (typeof phone === "string") phone = phone.trim();
    if (typeof status === "string") status = status.trim();

    for (let [key, value] of Object.entries({ name, address, phone, status })) {
      if (
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return res.status(400).json({
          message: `'${key}' cannot be blank or contain only spaces`,
        });
      }
    }


    if (!/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number. Must contain 9-11 digits only.",
      });
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Only 'ACTIVE' or 'INACTIVE' is accepted",
      });
    }

    const [exists] = await db.query("SELECT * FROM branches WHERE name = ?", [
      name,
    ]);
    if (exists.length > 0) {
      return res.status(400).json({ message: "The branch name already exists" });
    }

    await db.query(
      "INSERT INTO branches (name, address, phone, status, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name, address, phone, status]
    );

    return res.status(201).json({ message: "Branch created successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, address, phone, status } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM branches WHERE branch_id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "No branch found" });
    }
    const oldData = rows[0];

    if (typeof name === "string") name = name.trim();
    if (typeof address === "string") address = address.trim();
    if (typeof phone === "string") phone = phone.trim();
    if (typeof status === "string") status = status.trim().toUpperCase();

    for (let [key, value] of Object.entries({ name, address, phone, status })) {
      if (
        value !== undefined &&
        typeof value === "string" &&
        value.trim() === ""
      ) {
        return res.status(400).json({
          message: `'${key}' cannot be blank or contain only spaces`,
        });
      }
    }

    if (phone && !/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number. Must contain 9-11 digits only.",
      });
    }

    if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Only 'ACTIVE' or 'INACTIVE' is accepted",
      });
    }

    name = name || oldData.name;
    address = address || oldData.address;
    phone = phone || oldData.phone;
    status = status || oldData.status;

    const noChange =
      name === oldData.name &&
      address === oldData.address &&
      phone === oldData.phone &&
      status === oldData.status;

    if (noChange) {
      return res
        .status(400)
        .json({ message: "No information has been changed" });
    }

    await db.query(
      "UPDATE branches SET name = ?, address = ?, phone = ?, status = ? WHERE branch_id = ?",
      [name, address, phone, status, id]
    );

    return res.json({ message: "Branch update successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM branches WHERE branch_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "No branch found" });

    await db.query("DELETE FROM branches WHERE branch_id = ?", [id]);
    return res.json({ message: "Branch deletion successful" });
  } catch (error) {
    console.error("ERROR WHEN DELETING BRANCH:", error);
    let errorMessage = "Server error";
    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
      errorMessage =
        "This branch cannot be deleted. There is data (such as orders, employees, imports, etc.) associated with it";
      return res.status(400).json({ message: errorMessage });
    }
    return res
      .status(500)
      .json({ message: errorMessage, error: error.message });
  }
};
