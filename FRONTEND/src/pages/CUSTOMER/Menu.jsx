import { useEffect, useState } from "react";
import API from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/Menu.scss";
import Header from "../../components/Header";
import product from "../../assets/image/product.jpg";

export default function Menu() {
  const { branchId, orderId } = useParams();
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [allMenuItems, setAllMenuItems] = useState([]); // menu gốc
  const [menuItems, setMenuItems] = useState([]); // menu đang hiển thị
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [showMenuInfoModal, setshowMenuInfoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  //GET CATEGORY
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const catRes = await API.get(`/category?branch_id=${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategory();
  }, [branchId, token]);

  //GET MENU
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuRes = await API.get(`/menu?branch_id=${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllMenuItems(menuRes.data); // lưu bản gốc
        setMenuItems(menuRes.data); // mặc định hiển thị tất cả
      } catch (err) {
        console.error(err);
      }
    };
    fetchMenu();
  }, [branchId, token]);

  const handleAddToCart = async (itemId) => {
    try {
      await API.post(
        "/cart/items",
        { order_id: orderId, item_id: itemId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCartCount((prev) => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot add to cart");
      console.error(err);
    }
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.5, // phần tử hiển thị >= 40% mới tính là "đang xem"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          setActiveCategory(id);
        }
      });
    }, observerOptions);

    categories.forEach((cat) => {
      const section = document.getElementById(cat.food_type);
      if (section) {
        observer.observe(section);
      }
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [categories]);

  return (
    <>
      <Header orderId={orderId} cartCount={cartCount} />
      <div className="body">
        <div className="body-product">
          <div className="sidebar-left">
            <h1>CATEGORY</h1>
            <div className="category">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                All Product
              </a>
              {categories.map((cat) => (
                <a
                  key={cat.category_id}
                  href={`#${cat.food_type}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(cat.food_type);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={activeCategory === cat.food_type ? "active" : ""}
                >
                  {cat.food_type}
                </a>
              ))}
            </div>
          </div>

          <div className="menu">
            <h1>MENU</h1>
            <div className="menu-group">
              {categories.map((cat) => {
                const itemsByCategory = menuItems.filter(
                  (item) => item.food_type === cat.food_type
                );
                return (
                  <div
                    key={cat.category_id}
                    className="menu-category"
                    id={cat.food_type}
                  >
                    <h2 className="category-title">{cat.food_type}</h2>
                    <div className="menu-product">
                      {itemsByCategory.length > 0 ? (
                        itemsByCategory.map((item) => (
                          <div key={item.item_id} className="product">
                            {item.image ? (
                              <img
                                src={`http://localhost:3000${item.image}`}
                                alt={item.name}
                              />
                            ) : (
                              "NO IMAGE"
                            )}
                            <p>{item.food_type}</p>
                            <h3 className="product-name">{item.name}</h3>
                            <h4 className="product-price">
                              {Number(item.price).toLocaleString("vi-VN")} đ
                            </h4>
                            <div className="product-button">
                              <button
                                className="product-order"
                                // onClick={() => handleAddToCart(item.item_id)}
                                onClick={() => {
                                  setSelectedItem(item),
                                    setshowMenuInfoModal(true);
                                }}
                              >
                                Order now
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>NOTHING</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* {showMenuInfoModal && selectedItem && (
        <div
          className="modal-info"
          onClick={() => setshowMenuInfoModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span
              className="modal-close"
              onClick={() => setshowMenuInfoModal(false)}
            >
              &times;
            </span>
            <div className="modal-body">
              <h2>{selectedItem.name}</h2>
              {selectedItem.image ? (
                <img
                  src={`http://localhost:3000${selectedItem.image}`}
                  alt={selectedItem.name}
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <p>No image</p>
              )}
              <p>Type: {selectedItem.food_type}</p>
              <p>
                Price: {Number(selectedItem.price).toLocaleString("vi-VN")} đ
              </p>
              <button
                onClick={() => {
                  handleAddToCart(selectedItem.item_id);
                  setshowMenuInfoModal(false);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )} */}
      {showMenuInfoModal && selectedItem && (
        <div className="modal-info" onClick={() => setshowMenuInfoModal(false)}>
          <div
            className="modal-info-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-info-content-header">
              <div className="modal-title">
                <p>Select product</p>
              </div>
              <div
                className="modal-btnClose"
                onClick={() => setshowMenuInfoModal(false)}
              >
                X
              </div>
            </div>
            <div className="modal-info-content-body">
              <div className="modal-info-content-body-left">
                <h3>#Product name (L)</h3>
                <p>Product Description</p>
                <img src={product} alt="product-image" />
                <p className="modal-price">Price: 240.000 d</p>
                <div className="modal-info-content-body-left-quantity">
                  <button
                    className="modal-info-content-body-left-quantity-button"
                    // onClick={() =>
                    //   handleUpdateQty(item.order_item_id, item.quantity - 1)
                    // }
                  >
                    −
                  </button>
                  <span className="modal-info-content-body-left-quantity-number">
                    1{/* {item.quantity} */}
                  </span>
                  <button
                    className="modal-info-content-body-left-quantity-btn"
                    // onClick={() =>
                    //   handleUpdateQty(item.order_item_id, item.quantity + 1)
                    // }
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="modal-info-content-body-right">
                <div className="modal-info-content-body-right-topping">
                  <div className="modal-info-content-body-right-topping-title">
                    Chọn kích thước
                  </div>
                  <div className="modal-info-content-body-right-topping-notification">
                    ( Thường R: 6 miếng 22cm | Lớn L: 8 miếng 30cm )
                  </div>
                  <div className="modal-info-content-body-right-topping-choosing">
                    <div className="size-option">
                      <input
                        type="radio"
                        id="size-m"
                        name="pizza-size"
                        value="R"
                      />
                      <div className="modal-info-content-body-right-topping-choosing-info">
                        <label>R</label>
                        <label>240.000d</label>
                      </div>
                    </div>
                    <div className="size-option">
                      <input
                        type="radio"
                        id="size-l"
                        name="pizza-size"
                        value="L"
                      />
                      <div className="modal-info-content-body-right-topping-choosing-info">
                        <label>L</label>
                        <label>300.000d</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-info-content-body-right-topping">
                  <div className="modal-info-content-body-right-topping-title">
                    Chọn đế
                  </div>
                  <div className="modal-info-content-body-right-topping-notification">
                    {/* ( Thường R: 6 miếng 22cm | Lớn L: 8 miếng 30cm ) */}
                  </div>
                  <div className="modal-info-content-body-right-topping-choosing">
                    <div className="size-option">
                      <input
                        type="radio"
                        id="size-m"
                        name="pizza-size"
                        value="R"
                      />
                      <div className="modal-info-content-body-right-topping-choosing-info">
                        <label>Mỏng</label>
                        {/* <label>240.000d</label> */}
                      </div>
                    </div>
                    <div className="size-option">
                      <input
                        type="radio"
                        id="size-l"
                        name="pizza-size"
                        value="L"
                      />
                      <div className="modal-info-content-body-right-topping-choosing-info">
                        <label>Dày</label>
                        {/* <label>300.000d</label> */}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-info-content-body-right-topping">
                  <div className="modal-info-content-body-right-topping-title">
                    Thêm
                  </div>
                  <div className="modal-info-content-body-right-topping-notification">
                  </div>
                  <div className="modal-info-content-body-right-topping-choosing">
                    <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                    <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                    <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                    <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                    <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                    <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                    <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                    <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                     <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                     <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                     <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                     <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                     <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                     <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                     <div className="modal-info-content-body-right-topping-choosing-checkbox">
                      <input type="checkbox" name="topping" value="phomat" />
                      <div className="modal-info-content-body-right-topping-choosing-checkbox-checkboxinfo">
                        <label>Cheese</label>
                        <label className="checkbox-price">30.000d</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-info-content-body-right-buy">
                  <button className="modal-info-content-body-right-buy-button">
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
