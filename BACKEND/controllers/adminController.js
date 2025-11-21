// controllers/adminController.js
import db from "../config/db.js";
import bcrypt from "bcrypt";

// const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
// const passwordRequirementMessage = "Password must contain at least 8 characters, including 1 number and 1 special character (!@#$%^&*).";

export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, name, email, phone, role, branch_id, created_at FROM users"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT user_id, name, email, phone, role, branch_id, created_at FROM users WHERE user_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "cant find user" });
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const createCustomer = async (req, res) => {
  try {
    let { name, email, password, phone } = req.body;
    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof phone === "string") phone = phone.trim();

    for (let [key, value] of Object.entries({ name, email, password, phone })) {
      if (
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return res.status(400).json({
          message: ` '${key}' cannot be blank or contain only spaces`,
        });
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email." });
    }

    const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number. Must contain 9-11 digits only.",
      });
    }

    // if (!passwordRegex.test(password)) {
    //   return res.status(400).json({
    //     message: passwordRequirementMessage,
    //   });
    // }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, phone, role, created_at) VALUES (?, ?, ?, ?, 'CUSTOMER', NOW())",
      [name, email, hashedPassword, phone]
    );

    return res.status(201).json({ message: "Create successful customers" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const createStaff = async (req, res) => {
  try {
    let { name, email, password, phone, branch_id, role } = req.body;

    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof phone === "string") phone = phone.trim();
    if (typeof role === "string") role = role.trim();
    if (typeof branch_id === "string") branch_id = branch_id.trim();

    for (let [key, value] of Object.entries({
      name,
      email,
      password,
      phone,
      role,
      branch_id
    })) {
      if (
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return res.status(400).json({
          message: `'${key}' cannot be blank or contain only spaces`,
        });
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email." });
    }

    const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number. Must contain 9-11 digits only.",
      });
    }
    const [branch] = await db.query(
      "SELECT * FROM branches WHERE branch_id = ?",
      [branch_id]
    );
    if (branch.length === 0) {
      return res.status(400).json({ message: "Invalid branch" });
    }

    const allowedRoles = ["STAFF", "CHEF", "RECEPTIONIST"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, phone, role, branch_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [name, email, hashedPassword, phone, role, branch_id]
    );

    return res.status(201).json({ message: `Create new '${role}' success` });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, email, password, phone } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    const oldData = rows[0];

    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof phone === "string") phone = phone.trim();

    for (let [key, value] of Object.entries({ name, email, password, phone })) {
      if (
        value !== undefined &&
        typeof value === "string" &&
        value.trim() === ""
      ) {
        return res.status(400).json({
          message: ` '${key}' cannot be blank or contain only spaces`,
        });
      }
    }

    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Invalid email.",
      });
    }

    if (email && email !== oldData.email) {
      const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (exists.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    if (phone !== undefined && !/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number. Must contain 9-11 digits only.",
      });
    }

    name = name || oldData.name;
    email = email || oldData.email;
    phone = phone || oldData.phone;

    let hashedPassword = oldData.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const noChange =
      name === oldData.name &&
      email === oldData.email &&
      phone === oldData.phone &&
      hashedPassword === oldData.password;

    if (noChange) {
      return res
        .status(400)
        .json({ message: "No info change" });
    }

    await db.query(
      "UPDATE users SET name=?, email=?, password=?, phone=? WHERE user_id=?",
      [name, email, hashedPassword, phone, id]
    );

    return res.json({ message: "Customer update successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, email, password, phone, branch_id, role } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Can't find that staff" });
    }
    const oldData = rows[0];

    if (typeof name === "string") name = name.trim();
    if (typeof email === "string") email = email.trim();
    if (typeof phone === "string") phone = phone.trim();
    if (typeof role === "string")  role = role.trim();
    if (typeof branch_id === "string") branch_id = branch_id.trim();

    for (let [key, value] of Object.entries({ name, email, password, phone, role, branch_id })) {
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

    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Invalid email",
      });
    }

    if (phone !== undefined && !/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number. Must contain 9-11 digits only",
      });
    }

    if (email && email !== oldData.email) {
      const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (exists.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    
    const allowedRoles = ["STAFF", "CHEF", "RECEPTIONIST"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (branch_id !== undefined && branch_id !== oldData.branch_id) {
      const [branch] = await db.query(
        "SELECT * FROM branches WHERE branch_id = ?",
        [branch_id]
      );
      if (branch.length === 0) {
        return res.status(400).json({ message: "Branch does not exist" });
      }
    }

    name = name || oldData.name;
    email = email || oldData.email;
    phone = phone || oldData.phone;
    branch_id = branch_id || oldData.branch_id;
    
    let hashedPassword = oldData.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const noChange =
      name === oldData.name &&
      email === oldData.email &&
      phone === oldData.phone &&
      branch_id === oldData.branch_id &&
      hashedPassword === oldData.password;

    if (noChange) {
      return res
        .status(400)
        .json({ message: "No information has been changed" });
    }

    await db.query(
      "UPDATE users SET name=?, email=?, password=?, phone=?, branch_id=? WHERE user_id=?",
      [name, email, hashedPassword, phone, branch_id, id]
    );

    return res.json({ message: "Staff update successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    await db.query("DELETE FROM users WHERE user_id = ?", [id]);
    return res.json({ message: "Delete user successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
