// CategoryCRUD.jsx
import { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import API from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CategoryCRUD() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    food_type: "",
    //branch_id: "", // chỉ Admin mới nhập, Staff sẽ tự động backend gán
  });

  // Mở modal thêm/sửa
  const handleShowModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        food_type: item.food_type,
        branch_id: item.branch_id ?? "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        food_type: "",
        branch_id: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // Xử lý input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Lấy danh sách category
  const fetchCategories = async () => {
    try {
      const res = await API.get("/category"); // gọi API backend
      setCategories(res.data);
    } catch (err) {
      console.error("Lỗi khi load category:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Thêm hoặc cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await API.put(`/category/update/${editingItem.category_id}`, formData);
        alert("Cập nhật category thành công!");
      } else {
        await API.post("/category/create", formData);
        alert("Thêm category thành công!");
      }
      handleCloseModal();
      fetchCategories();
    } catch (err) {
      console.error("Lỗi thêm/cập nhật:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa category này?")) {
      try {
        await API.delete(`/category/delete/${id}`);
        alert("Xóa thành công!");
        fetchCategories();
      } catch (err) {
        console.error("Lỗi xóa:", err);
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Quản lý Category</h2>
      <Button variant="primary" onClick={() => handleShowModal()}>
        + Thêm category
      </Button>

      <table className="table table-striped mt-3">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Tên Category</th>
            <th>Chi nhánh</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((item) => (
            <tr key={item.category_id}>
              <td>{item.category_id}</td>
              <td>{item.food_type}</td>
              <td>{item.branch_id}</td>
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
                  onClick={() => handleDelete(item.category_id)}
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
            {editingItem ? "Sửa category" : "Thêm category"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-2">
              <Form.Label>Tên category</Form.Label>
              <Form.Control
                name="food_type"
                value={formData.food_type}
                onChange={handleChange}
                required
              />
            </Form.Group>

            {/* Nếu là Admin thì có thể nhập branch_id, Staff thì backend tự gán */}
            {/* <Form.Group className="mb-2">
              <Form.Label>Chi nhánh</Form.Label>
              <Form.Control
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChange}
                placeholder="Nhập branch_id (Admin mới cần)"
              />
            </Form.Group> */}

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
