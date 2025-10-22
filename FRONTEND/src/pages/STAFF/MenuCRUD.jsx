// MenuCRUD.jsx
import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import API from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function MenuCRUD() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: null, // File or existing url
    stock_quantity: "",
    category_id: "",
    is_available: 1,
    branch_id: "",
  });

  // option groups state: array of { name, selection_type, is_required, choices: [{name, price_delta}] }
  const [optionsDef, setOptionsDef] = useState([]);

  // Fetch menu list
  const fetchMenu = async () => {
    try {
      const res = await API.get("/menu"); // adjust if you need branch_id param
      setMenuItems(res.data);
    } catch (err) {
      console.error("Lỗi lấy menu:", err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await API.get("/category");
      setCategories(res.data);
    } catch (err) {
      console.error("Lỗi khi load category:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchMenu();
  }, []);

  // Open modal: if editing, fetch full item detail (including optionGroups)
  const handleShowModal = async (item = null) => {
    if (item) {
      setEditingItem(item);
      try {
        const res = await API.get(`/menu/${item.item_id}`);
        const detail = res.data;
        setFormData({
          name: detail.name || "",
          price: detail.price || "",
          description: detail.description || "",
          image: detail.image ? `http://localhost:3000${detail.image}` : null,
          stock_quantity: detail.stock_quantity ?? "",
          category_id: detail.category_id,
          is_available: detail.is_available ?? 1,
          branch_id: detail.branch_id ?? "",
        });

        // Convert optionGroups from backend to optionsDef format
        const groups = (detail.optionGroups || []).map((g) => ({
          name: g.group_name || "",
          selection_type: g.selection_type || "SINGLE",
          is_required: Number(g.is_required) === 1 ? 1 : 0,
          // choices from backend: choice_id, choice_name, price_delta
          choices: (g.choices || []).map((c) => ({
            name: c.choice_name || c.name,
            price_delta: c.price_delta ?? 0,
          })),
        }));
        setOptionsDef(groups);
      } catch (err) {
        console.error("Lỗi load detail:", err);
        // fallback populate basic data
        setFormData({
          name: item.name,
          price: item.price,
          description: item.description,
          image: item.image ? `http://localhost:3000${item.image}` : null,
          stock_quantity: item.stock_quantity ?? "",
          category_id: item.category_id,
          is_available: item.is_available ?? 1,
          branch_id: item.branch_id ?? "",
        });
        setOptionsDef([]);
      }
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        price: "",
        description: "",
        image: null,
        stock_quantity: "",
        category_id: "",
        is_available: 1,
        branch_id: "",
      });
      setOptionsDef([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // handle simple inputs
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "file") return;
    setFormData({ ...formData, [name]: value });
  };

  // handle image file selection (preview)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
      });
    }
  };

  // Option groups management
  const addGroup = () => {
    setOptionsDef([
      ...optionsDef,
      { name: "", selection_type: "SINGLE", is_required: 0, choices: [] },
    ]);
  };
  const removeGroup = (gi) => {
    const arr = [...optionsDef];
    arr.splice(gi, 1);
    setOptionsDef(arr);
  };
  const updateGroupField = (gi, field, value) => {
    const arr = [...optionsDef];
    arr[gi] = { ...arr[gi], [field]: value };
    setOptionsDef(arr);
  };

  // choices management
  const addChoice = (gi) => {
    const arr = [...optionsDef];
    arr[gi].choices = arr[gi].choices || [];
    arr[gi].choices.push({ name: "", price_delta: 0 });
    setOptionsDef(arr);
  };
  const removeChoice = (gi, ci) => {
    const arr = [...optionsDef];
    arr[gi].choices.splice(ci, 1);
    setOptionsDef(arr);
  };
  const updateChoiceField = (gi, ci, field, value) => {
    const arr = [...optionsDef];
    const choice = { ...arr[gi].choices[ci], [field]: value };
    arr[gi].choices[ci] = choice;
    setOptionsDef(arr);
  };

  // Submit create/update
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Basic client validation: name, price, category
      if (!formData.name || formData.name.trim() === "") {
        alert("Tên món không được để trống");
        return;
      }
      if (!formData.price || isNaN(formData.price)) {
        alert("Giá phải là số hợp lệ");
        return;
      }
      if (!formData.category_id) {
        alert("Hãy chọn danh mục");
        return;
      }

      const data = new FormData();
      // append simple fields
      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("description", formData.description || "");
      data.append("category_id", formData.category_id);
      if (formData.stock_quantity !== "")
        data.append("stock_quantity", formData.stock_quantity);
      data.append("is_available", formData.is_available ?? 1);
      // branch_id only for ADMIN case; if your backend ignores for STAFF it's fine
      if (formData.branch_id) data.append("branch_id", formData.branch_id);

      // append image if file
      if (formData.image && formData.image instanceof File) {
        data.append("image", formData.image);
      }

      if (Array.isArray(optionsDef)) {
        const cleaned = optionsDef
          .map((g) => ({
            name: (g.name || "").trim(),
            selection_type: g.selection_type === "MULTI" ? "MULTI" : "SINGLE",
            is_required: g.is_required ? 1 : 0,
            choices: (g.choices || [])
              .map((c) => ({
                name: (c.name || "").trim(),
                price_delta: Number(c.price_delta || 0),
              }))
              .filter((c) => c.name !== ""),
          }))
          .filter((g) => g.name !== ""); // drop empty groups

        // ALWAYS append optionsDef when editing (even empty array) so server knows user wants to update options
        // For create: appending [] is harmless but could be skipped if you prefer.
        if (editingItem) {
          data.append("optionsDef", JSON.stringify(cleaned)); // cleaned may be []
        } else if (cleaned.length > 0) {
          // for create: only append when non-empty to avoid clutter
          data.append("optionsDef", JSON.stringify(cleaned));
        }
      }

      if (editingItem) {
        await API.put(`/menu/update/${editingItem.item_id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Cập nhật món ăn thành công!");
      } else {
        await API.post("/menu/create", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Thêm món ăn thành công!");
      }

      handleCloseModal();
      fetchMenu();
    } catch (err) {
      console.error("Lỗi thêm/cập nhật:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa món ăn này?")) {
      try {
        await API.delete(`/menu/delete/${id}`);
        alert("Xóa thành công!");
        fetchMenu();
      } catch (err) {
        console.error("Lỗi xóa:", err);
      }
    }
  };

  // helper to show preview image url for file or existing url
  const getImagePreviewUrl = () => {
    if (!formData.image) return null;
    if (formData.image instanceof File) {
      return URL.createObjectURL(formData.image);
    }
    return formData.image; // assumed already a full url string
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Quản lý Menu</h2>
      <Button variant="primary" onClick={() => handleShowModal()}>
        + Thêm món ăn
      </Button>

      <table className="table table-striped mt-3">
        <thead className="table-dark">
          <tr>
            <th>Ảnh</th>
            <th>Tên món</th>
            <th>Mô tả</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Category</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {menuItems.map((item) => (
            <tr key={item.item_id}>
              <td>
                {item.image ? (
                  <img
                    src={`http://localhost:3000${item.image}`}
                    alt={item.name}
                    style={{
                      width: "70px",
                      height: "70px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "Không có ảnh"
                )}
              </td>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>{item.price} đ</td>
              <td>{item.stock_quantity ?? "-"}</td>
              <td>{item.food_type}</td>
              <td>{item.is_available ? "Còn hàng" : "Hết hàng"}</td>
              <td>
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => handleShowModal(item)}
                  className="me-2"
                >
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(item.item_id)}
                >
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal thêm/sửa */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? "Sửa món ăn" : "Thêm món ăn"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-2">
                  <Form.Label>Tên món</Form.Label>
                  <Form.Control
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Giá</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Số lượng</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Dropdown chọn category */}
                <Form.Group className="mb-2">
                  <Form.Label>Danh mục</Form.Label>
                  <Form.Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.food_type}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Ảnh món ăn</Form.Label>
                  <Form.Control
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {getImagePreviewUrl() && (
                    <img
                      src={getImagePreviewUrl()}
                      alt="Preview"
                      className="mt-2"
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    name="is_available"
                    value={formData.is_available}
                    onChange={(e) =>
                      setFormData({ ...formData, is_available: e.target.value })
                    }
                  >
                    <option value={1}>Còn hàng</option>
                    <option value={0}>Hết hàng</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Branch ID (nếu bạn là ADMIN)</Form.Label>
                  <Form.Control
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />

            {/* OptionsDef UI */}
            <div>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Tùy chỉnh món (Options)</h5>
                <Button size="sm" variant="outline-primary" onClick={addGroup}>
                  + Thêm nhóm tùy chỉnh
                </Button>
              </div>

              {optionsDef.length === 0 && (
                <div className="mt-2 text-muted">
                  Chưa có nhóm tùy chỉnh nào
                </div>
              )}

              {optionsDef.map((g, gi) => (
                <div key={gi} className="border rounded p-2 mt-2">
                  <Row className="align-items-center">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Tên nhóm</Form.Label>
                        <Form.Control
                          value={g.name}
                          onChange={(e) =>
                            updateGroupField(gi, "name", e.target.value)
                          }
                          placeholder="Ví dụ: Kích thước, Topping"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Loại chọn</Form.Label>
                        <Form.Select
                          value={g.selection_type}
                          onChange={(e) =>
                            updateGroupField(
                              gi,
                              "selection_type",
                              e.target.value
                            )
                          }
                        >
                          <option value="SINGLE">SINGLE (radio)</option>
                          <option value="MULTI">MULTI (checkbox)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Bắt buộc</Form.Label>
                        <Form.Select
                          value={g.is_required ? 1 : 0}
                          onChange={(e) =>
                            updateGroupField(
                              gi,
                              "is_required",
                              Number(e.target.value)
                            )
                          }
                        >
                          <option value={0}>Không</option>
                          <option value={1}>Có</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={1} className="text-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeGroup(gi)}
                      >
                        X
                      </Button>
                    </Col>
                  </Row>

                  {/* choices */}
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">Choices</small>
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => addChoice(gi)}
                      >
                        + Thêm choice
                      </Button>
                    </div>

                    {(g.choices || []).map((c, ci) => (
                      <InputGroup className="mb-2" key={ci}>
                        <Form.Control
                          placeholder="Tên lựa chọn (ví dụ: Size L, Thêm trứng)"
                          value={c.name}
                          onChange={(e) =>
                            updateChoiceField(gi, ci, "name", e.target.value)
                          }
                        />
                        <Form.Control
                          style={{ maxWidth: "140px" }}
                          placeholder="Giá phụ (vd: 20000)"
                          value={c.price_delta}
                          onChange={(e) =>
                            updateChoiceField(
                              gi,
                              ci,
                              "price_delta",
                              e.target.value
                            )
                          }
                        />
                        <Button
                          variant="outline-danger"
                          onClick={() => removeChoice(gi, ci)}
                        >
                          X
                        </Button>
                      </InputGroup>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-end mt-3">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="me-2"
              >
                Hủy
              </Button>
              <Button type="submit" variant="success">
                {editingItem ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
