let branchIds = [];

if (req.user.role === "STAFF") {
  if (!req.user.branch_id) {
    return res.status(400).json({ message: "Tài khoản nhân viên không có branch_id" });
  }
  branchIds = [req.user.branch_id];
} else if (req.user.role === "ADMIN") {
  const [branches] = await db.query("SELECT branch_id FROM branches WHERE status = 'ACTIVE'");
  if (branches.length === 0) {
    return res.status(400).json({ message: "Không có chi nhánh nào để áp dụng món ăn" });
  }
  branchIds = branches.map(b => b.branch_id);
} else {
  return res.status(403).json({ message: "Không có quyền tạo món ăn" });
}



for (const branchId of branchIds) {
  await db.query(
    "INSERT INTO menu_items (name, image, category_id, description, price, branch_id, stock_quantity, is_available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
    [
      name,
      image,
      category_id,
      description,
      price,
      branchId,
      stock_quantity,
      is_available ?? 1,
    ]
  );
}
