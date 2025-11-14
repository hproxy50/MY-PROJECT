import db from "../config/db.js";

// ================= Get all branch =================
export const getAllBranch = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT branch_id, name, address, phone, status, created_at FROM branches"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= Create new branch =================
export const createBranch = async (req, res) => {
  try {
    let { name, address, phone, status } = req.body;
    // Trim chuỗi nếu có
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
          message: `Trường '${key}' không được để trống hoặc chỉ chứa khoảng trắng`,
        });
      }
    }

    // Kiểm tra phone hợp lệ
    if (!/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ. Chỉ được chứa 9-11 chữ số.",
      });
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận 'ACTIVE' hoặc 'INACTIVE'.",
      });
    }

    // Kiểm tra trùng tên chi nhánh (tuỳ chọn)
    const [exists] = await db.query("SELECT * FROM branches WHERE name = ?", [
      name,
    ]);
    if (exists.length > 0) {
      return res.status(400).json({ message: "Tên chi nhánh đã tồn tại." });
    }

    await db.query(
      "INSERT INTO branches (name, address, phone, status, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name, address, phone, status]
    );

    return res.status(201).json({ message: "Tạo branch thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= Update branch =================
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, address, phone, status } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM branches WHERE branch_id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy chi nhánh" });
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
          message: `Trường '${key}' không được để trống hoặc chỉ chứa khoảng trắng.`,
        });
      }
    }

    if (phone && !/^\d{9,11}$/.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ. Chỉ được chứa 9-11 chữ số.",
      });
    }

    if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận 'ACTIVE' hoặc 'INACTIVE'.",
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
        .json({ message: "Không có thông tin nào được thay đổi." });
    }

    await db.query(
      "UPDATE branches SET name = ?, address = ?, phone = ?, status = ? WHERE branch_id = ?",
      [name, address, phone, status, id]
    );

    return res.json({ message: "Cập nhật chi nhánh thành công." });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================= XÓA Branch =================
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM branches WHERE branch_id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh" });

    await db.query("DELETE FROM branches WHERE branch_id = ?", [id]);
    return res.json({ message: "Xóa chi nhánh thành công" });
  } catch (error) {
    console.error("LỖI KHI XÓA CHI NHÁNH:", error);
    let errorMessage = "Lỗi server";
    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
      errorMessage =
        "Không thể xóa chi nhánh này. Đang có dữ liệu (như đơn hàng, nhân viên, nhập hàng,...) liên kết với nó.";
      return res.status(400).json({ message: errorMessage });
    }
    return res
      .status(500)
      .json({ message: errorMessage, error: error.message });
  }
};
