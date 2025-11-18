import { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import "../../css/Branch.scss";
import logo from "../../assets/image/logo.png";
import image from "../../assets/image/branch.jpg";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Hàm lấy danh sách chi nhánh (Tương đương useEffect của trang cũ)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await API.get("/branch", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBranches();
  }, [token]);

  // Hàm xử lý chọn chi nhánh (Tương đương handleSelectBranch của trang cũ)
  const handleSelectBranch = async (branchId) => {
    try {
      // Gọi API để tạo order (giỏ hàng) với chi nhánh đã chọn
      const orderRes = await API.post(
        "/cart",
        { branch_id: branchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderId = orderRes.data.order_id;

      // Chuyển hướng đến trang Menu
      navigate(`/menu/${branchId}/${orderId}`);
    } catch (err) {
      console.error(err);
      alert("Không thể chọn chi nhánh. Vui lòng thử lại.");
    }
  };

  return (
    <div className="branch">
      <div className="branch-body">
        <div className="branch-body-header">
          <div className="branch-body-header-left">
            <img src={logo} alt="LOGO" />
          </div>
          <div className="branch-body-header-mid">
            <p className="branch-body-header-mid-title">Hung Snack Conner</p>
          </div>
          <div className="branch-body-header-right">
            <p className="branch-body-header-right-hotline">
              Hotline: 0584299322
            </p>
          </div>
        </div>
        <div className="branch-body-mid">
          <div className="branch-body-mid-left">
            <img src={image} alt="image" />
          </div>
          <div className="branch-body-mid-right">
            <h1>Full range of today's most popular snacks</h1>
            <p>
              Hung Snack Conner is a chain of snack stores with a youthful and
              modern style, where you can easily find familiar dishes but with
              more attractive variations every day. We offer a variety of snacks,
              from fried foods, cakes, milk tea to popular street snacks. With a
              friendly, clean space and quick service, Hung Snack Conner hopes to
              become an ideal stop for everyone - from students to office
              workers. We are committed to the quality of ingredients, delicious
              flavors and reasonable prices, so that every visit is a fun and
              complete experience.
            </p>
            {/* Vị trí chứa các nút button chọn chi nhánh */}
            <div className="branch-body-mid-right-right2">
              {branches.length > 0 ? (
                // Map qua danh sách chi nhánh và tạo button cho mỗi chi nhánh
                branches.map((b) => (
                  <button
                    key={b.branch_id}
                    onClick={() => handleSelectBranch(b.branch_id)}
                  >
                    {b.name}
                  </button>
                ))
              ) : (
                <p>Đang tải chi nhánh...</p>
              )}
            </div>
          </div>
        </div>
        <div className="branch-body-bottom">.</div>
      </div>
    </div>
  );
}