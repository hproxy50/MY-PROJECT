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
  const [allMenuItems, setAllMenuItems] = useState([]); // menu old
  const [menuItems, setMenuItems] = useState([]); // menu showing
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [showMenuInfoModal, setshowMenuInfoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    if (branchId) {
      localStorage.setItem("currentBranchId", branchId);
    }
  }, [branchId]);

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
        setAllMenuItems(menuRes.data);
        setMenuItems(menuRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMenu();
  }, [branchId, token]);

  //QUANTITY
  useEffect(() => {
    if (selectedItem) {
      let extra = 0;
      Object.values(selectedOptions).forEach((choices) => {
        choices.forEach((c) => {
          extra += Number(c.price_delta) || 0;
        });
      });

      const basePrice = Number(selectedItem.price) || 0;
      const newTotal = (basePrice + extra) * quantity;
      setTotalPrice(newTotal);
    }
  }, [quantity, selectedItem, selectedOptions]);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleOptionChange = (group, choice, checked) => {
    setSelectedOptions((prev) => {
      const updated = { ...prev };
      if (group.selection_type === "SINGLE") {
        // Chỉ chọn 1 trong nhóm
        updated[group.group_id] = [choice];
      } else {
        // Nhiều lựa chọn
        const existing = updated[group.group_id] || [];
        if (checked) {
          updated[group.group_id] = [...existing, choice];
        } else {
          updated[group.group_id] = existing.filter(
            (c) => c.choice_id !== choice.choice_id
          );
        }
      }
      return updated;
    });
  };

  const buildSelectedOptionsPayload = () => {
    // selectedOptions state: { [group_id]: [choiceObj, ...], ... }
    // Convert to array of { group_id, choice_id }
    const arr = [];
    Object.entries(selectedOptions).forEach(([groupId, choices]) => {
      (choices || []).forEach((c) => {
        if (c && c.choice_id) {
          arr.push({
            group_id: Number(groupId),
            choice_id: Number(c.choice_id),
          });
        }
      });
    });
    return arr;
  };

  const handleAddToCart = async (itemId, qty = 1) => {
    try {
      const payload = {
        order_id: orderId,
        item_id: itemId,
        quantity: Number(qty),
        selectedOptions: buildSelectedOptionsPayload(), // <-- new
      };

      await API.post("/cart/items", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartCount((prev) => prev + Number(qty));
      setshowMenuInfoModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot add to cart");
      console.error(err);
    }
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.3, // phần tử hiển thị >= 40% mới tính là "đang xem"
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
      <Header
        branchId={branchId}
        orderId={orderId}
        cartCount={cartCount}
        allMenuItems={allMenuItems}
        onSelectItem={async (itemId) => {
          try {
            const res = await API.get(`/menu/${itemId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedItem(res.data);
            setshowMenuInfoModal(true);
            setQuantity(1);
            setTotalPrice(res.data.price);
            setSelectedOptions({});
          } catch (err) {
            console.error(err);
            alert("Unable to load dish details");
          }
        }}
      />
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
                                onClick={async () => {
                                  try {
                                    const res = await API.get(
                                      `/menu/${item.item_id}`,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      }
                                    );
                                    setSelectedItem(res.data);
                                    setshowMenuInfoModal(true);
                                    setQuantity(1);
                                    setTotalPrice(res.data.price);
                                    setSelectedOptions({});
                                  } catch (err) {
                                    console.error(err);
                                    alert("Unable to load dish details");
                                  }
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
            className={`modal-info-content ${
              !selectedItem.optionGroups ||
              selectedItem.optionGroups.length === 0
                ? "no-options"
                : ""
            }`}
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
            <div
              className={`modal-info-content-body ${
                !selectedItem.optionGroups ||
                selectedItem.optionGroups.length === 0
                  ? "no-options"
                  : ""
              }`}
            >
              <div className="modal-info-content-body-left">
                <h3>{selectedItem.name}</h3>
                <p>{selectedItem.description}</p>
                {selectedItem.image ? (
                  <img
                    src={`http://localhost:3000${selectedItem.image}`}
                    alt={selectedItem.name}
                  />
                ) : (
                  <img src={product} alt="default" />
                )}
                <p className="modal-price">
                  {isNaN(totalPrice)
                    ? "0"
                    : Number(totalPrice).toLocaleString("vi-VN")}{" "}
                  đ
                </p>
                <div className="modal-info-content-body-left-quantity">
                  <button
                    onClick={handleDecrease}
                    disabled={quantity === 1}
                    className={quantity === 1 ? "btn-disabled" : ""}
                  >
                    –
                  </button>
                  <span>{quantity}</span>
                  <button onClick={handleIncrease}>+</button>
                </div>
              </div>
              {selectedItem.optionGroups?.length > 0 ? (
                <div className="modal-info-content-body-right">
                  {selectedItem.optionGroups.map((group) => (
                    <div
                      className="modal-info-content-body-right-topping"
                      key={group.group_id}
                    >
                      <div className="modal-info-content-body-right-topping-title">
                        {group.group_name}
                      </div>

                      <div className="modal-info-content-body-right-topping-choosing">
                        {group.choices.map((choice) => (
                          <div
                            key={choice.choice_id}
                            className={
                              group.selection_type === "SINGLE"
                                ? "size-option"
                                : "modal-info-content-body-right-topping-choosing-checkbox"
                            }
                          >
                            <input
                              type={
                                group.selection_type === "SINGLE"
                                  ? "radio"
                                  : "checkbox"
                              }
                              name={`group-${group.group_id}`}
                              value={choice.choice_id}
                              onChange={(e) =>
                                handleOptionChange(
                                  group,
                                  choice,
                                  e.target.checked
                                )
                              }
                            />
                            <div className="modal-info-content-body-right-topping-choosing-info">
                              <label>{choice.choice_name}</label>
                              {choice.price_delta !== 0 && (
                                <label className="checkbox-price">
                                  +
                                  {Number(choice.price_delta).toLocaleString(
                                    "vi-VN"
                                  )}
                                  đ
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="modal-info-content-body-right-buy">
                    <button
                      className="modal-info-content-body-right-buy-button"
                      onClick={() =>
                        handleAddToCart(selectedItem.item_id, quantity)
                      }
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              ) : (
                <div className="modal-info-content-body-left-buy">
                  <button
                    className="modal-info-content-body-left-buy-button"
                    onClick={() =>
                      handleAddToCart(selectedItem.item_id, quantity)
                    }
                  >
                    Add to cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
