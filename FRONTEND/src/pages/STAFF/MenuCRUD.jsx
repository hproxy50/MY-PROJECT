// MenuCRUD.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import API from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function MenuCRUD() {
  const [menuItems, setMenuItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    stock_quantity: "",
    category_id: "",
  });

  // Mở modal thêm hoặc sửa
  const handleShowModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        stock_quantity: item.stock_quantity ?? "",
        category_id: item.category_id,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        price: "",
        description: "",
        image: "",
        stock_quantity: "",
        category_id: "",
      });
    }
    setShowModal(true);
  };

  // Đóng modal
  const handleCloseModal = () => setShowModal(false);

  // Xử lý input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Lấy danh sách món ăn
  const fetchMenu = async () => {
    try {
      const res = await API.get("/menu"); // gọi tới /menu
      setMenuItems(res.data);
    } catch (err) {
      console.error("Lỗi lấy menu:", err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Thêm hoặc cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await API.put(`/menu/update/${editingItem.item_id}`, formData);
        alert("Cập nhật món ăn thành công!");
      } else {
        await API.post("/menu/create", formData);
        alert("Thêm món ăn thành công!");
      }
      handleCloseModal();
      fetchMenu();
    } catch (err) {
      console.error("Lỗi thêm/cập nhật:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Xóa món ăn
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
                    src={item.image}
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
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? "Sửa món ăn" : "Thêm món ăn"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
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

            <Form.Group className="mb-2">
              <Form.Label>Category ID</Form.Label>
              <Form.Control
                type="number"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Ảnh (URL)</Form.Label>
              <Form.Control
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
              />
              {formData.image && (
                <img
                  src={formData.image}
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

            <div className="text-end">
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
