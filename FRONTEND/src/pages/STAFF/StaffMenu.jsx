import { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  InputGroup,
  Card,
  Table,
} from "react-bootstrap";
import API from "../../api/api";

export default function StaffMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: null,
    stock_quantity: "",
    category_id: "",
    is_available: 1,
    branch_id: "", // STAFF
  });

  const [optionsDef, setOptionsDef] = useState([]);

  const fetchMenu = async () => {
    try {
      const res = await API.get("/menu");
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error getting menu:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/category");
      setCategories(res.data);
    } catch (err) {
      console.error("Error loading category:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchMenu();
  }, []);

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

        const groups = (detail.optionGroups || []).map((g) => ({
          name: g.group_name || "",
          selection_type: g.selection_type || "SINGLE",
          is_required: Number(g.is_required) === 1 ? 1 : 0,
          choices: (g.choices || []).map((c) => ({
            name: c.choice_name || c.name,
            price_delta: c.price_delta ?? 0,
          })),
        }));
        setOptionsDef(groups);
      } catch (err) {
        console.error("Error loading details:", err);
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
        stock_quantity: 0,
        category_id: "",
        is_available: 0,
        branch_id: "",
      });
      setOptionsDef([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "file") return;

    if (name === "stock_quantity") {
      const stockVal = value === "" ? "" : Number(value);
      if (stockVal <= 0 && value !== "") {
        setFormData({ ...formData, stock_quantity: value, is_available: 0 });
      } else if (stockVal > 0) {
        setFormData({ ...formData, stock_quantity: value, is_available: 1 });
      } else {
        setFormData({ ...formData, stock_quantity: "" });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
      });
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || formData.name.trim() === "") {
        alert("Dish name cannot be left blank");
        return;
      }
      if (!formData.price || isNaN(formData.price)) {
        alert("Price must be a valid number");
        return;
      }
      if (!formData.category_id) {
        alert("Please select a category");
        return;
      }

      const data = new FormData();
      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("description", formData.description || "");
      data.append("category_id", formData.category_id);
      let stock_qty_to_send = 0;

      if (formData.stock_quantity !== "" && formData.stock_quantity !== null) {
        stock_qty_to_send = Number(formData.stock_quantity);
        if (isNaN(stock_qty_to_send)) {
          alert("The inventory quantity must be a number.");
          return;
        }
        if (stock_qty_to_send < 0) {
          alert("The inventory quantity must not be less than 0.");
          return;
        }
      }

      const final_is_available = stock_qty_to_send > 0 ? 1 : 0;

      data.append("stock_quantity", stock_qty_to_send);
      data.append("is_available", final_is_available);

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
          .filter((g) => g.name !== "");

        if (editingItem) {
          data.append("optionsDef", JSON.stringify(cleaned));
        } else if (cleaned.length > 0) {
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
        alert(err.response?.data?.message || "Lỗi khi xóa món ăn");
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
  // END: Kết thúc phần copy logic

  // THAY ĐỔI: Giao diện
  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="p-3">
          <Row className="justify-content-between align-items-center">
            <Col xs="auto">
              <h3 className="mb-0">🍽️ Quản lý Menu</h3>
            </Col>
            <Col xs="auto">
              <Button variant="primary" onClick={() => handleShowModal()}>
                + Thêm món ăn
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {/* THAY ĐỔI: Dùng <Table responsive>
            Điều này sẽ tự động thêm thanh cuộn ngang trên màn hình nhỏ 
          */}
          <Table striped bordered hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Ảnh</th>
                <th>Tên món</th>
                <th>Giá</th>
                <th>Danh mục</th>
                <th>Số lượng</th>
                <th>Trạng thái</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item.item_id}>
                  <td>
                    {item.image ? (
                      <img
                        src={`http://localhost:3000${item.image}`} // Thay bằng URL API của bạn
                        alt={item.name}
                        style={{
                          width: "70px",
                          height: "70px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "70px",
                          height: "70px",
                          backgroundColor: "#f0f0f0",
                          textAlign: "center",
                          lineHeight: "70px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#888",
                        }}
                      >
                        No Img
                      </div>
                    )}
                  </td>
                  <td className="fw-semibold">{item.name}</td>
                  <td>{item.price.toLocaleString()} đ</td>
                  <td>{item.food_type}</td>
                  <td>{item.stock_quantity ?? "—"}</td>
                  <td>
                    {item.is_available ? (
                      <span className="badge bg-success">Còn hàng</span>
                    ) : (
                      <span className="badge bg-danger">Hết hàng</span>
                    )}
                  </td>
                  <td style={{ minWidth: "150px" }}>{item.description}</td>
                  <td style={{ minWidth: "130px" }}>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => handleShowModal(item)}
                      className="me-2 mb-1" // Thêm mb-1 cho responsive
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item.item_id)}
                      className="mb-1"
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal thêm/sửa (Giữ nguyên cấu trúc) */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? "Sửa món ăn" : "Thêm món ăn"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Form giữ nguyên, nó đã responsive sẵn nhờ <Row> và <Col md={X}> */}
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
                        borderRadius: "8px",
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
                    value={
                      Number(formData.stock_quantity) > 0
                        ? formData.is_available
                        : 0
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, is_available: e.target.value })
                    }
                    disabled={
                      Number(formData.stock_quantity) <= 0 ||
                      formData.stock_quantity === ""
                    }
                  >
                    <option value={1}>Còn hàng</option>
                    <option value={0}>Hết hàng</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Số lượng</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    placeholder="Default is 0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <hr />
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
                <div key={gi} className="border rounded p-2 mt-2 bg-light">
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
                    <Col md={1} className="text-end align-self-end">
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
                      <small className="text-muted">Lựa chọn (Choices)</small>
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => addChoice(gi)}
                      >
                        + Thêm lựa chọn
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
                          type="number"
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
    </>
  );
}
