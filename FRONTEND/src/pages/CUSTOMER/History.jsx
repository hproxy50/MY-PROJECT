import { useEffect, useState } from "react";
import "../../css/History.scss";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import Header from "../../components/headerStatus";

export default function History() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [showRatingModal, setshowRatingModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get("/history");
        let ordersData = res.data.orders || [];
        const updatedOrders = await Promise.all(
          ordersData.map(async (order) => {
            try {
              const check = await API.get(`/rating/check/${order.order_id}`);
              return {
                ...order,
                isRated: check.data.rated,
              };
            } catch {
              return { ...order, isRated: false };
            }
          })
        );
        setOrders(updatedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, []);

  const getRatingText = () => {
    switch (rating) {
      case 5:
        return "Excellent";
      case 4:
        return "Good";
      case 3:
        return "Average";
      case 2:
        return "Bad";
      case 1:
        return "Very Bad";
      default:
        return "Select rating";
    }
  };

  const openRatingModal = async (orderId) => {
    setCurrentOrderId(orderId);
    try {
      const res = await API.get(`/rating/check/${orderId}`);
      if (res.data.rated) {
        setRating(res.data.rating);
        setComment(res.data.comment || "");
        setIsEditing(true);
      } else {
        setRating(0);
        setComment("");
        setIsEditing(false);
      }
      setshowRatingModal(true);
    } catch (err) {
      console.error("Check rating failed:", err);
    }
  };

  const handleSubmitRating = async () => {
    if (!rating) return alert("Please select a rating from 1–5 stars");
    try {
      if (isEditing) {
        await API.put(`/rating/${currentOrderId}`, { rating, comment });
        alert("Rating updated successfully!");
      } else {
        await API.post("/rating", {
          order_id: currentOrderId,
          rating,
          comment,
        });
        alert("Rating submitted successfully!");
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === currentOrderId ? { ...o, isRated: true } : o
        )
      );
      setshowRatingModal(false);
    } catch (err) {
      console.error("Rating error:", err);
      alert(err.response?.data?.message || "Error submitting rating");
    }
  };

  const handleBuyAgain = async (orderId) => {
    try {
      const res = await API.post("/history/buy-again", { order_id: orderId });
      const draftOrderId = res.data.order_id;
      navigate(`/cart/${draftOrderId}`);
    } catch (err) {
      console.error("Buy again error:", err);
      alert(err.response?.data?.message || "Cannot add to cart");
    }
  };

  const filteredOrders = orders
    .filter((o) =>
      filterStatus === "ALL"
        ? true
        : (o.status || "").toUpperCase() === filterStatus
    )
    .filter((o) =>
      searchText.trim() === ""
        ? true
        : o.items.some((item) =>
            item.name.toLowerCase().includes(searchText.toLowerCase())
          )
    );

  return (
    <>
      <Header />
      <div className="HistoryBody">
        <div className="History-top">
          <div className="History-top-sort">
            <ul>
              <li
                onClick={() => setFilterStatus("ALL")}
                className={filterStatus === "ALL" ? "active" : ""}
              >
                <div className="History-top-sort-all">All</div>
              </li>
              <li
                onClick={() => setFilterStatus("PENDING")}
                className={filterStatus === "PENDING" ? "active" : ""}
              >
                <div className="History-top-sort-pending">Pending</div>
              </li>
              <li
                onClick={() => setFilterStatus("PREPARING")}
                className={filterStatus === "PREPARING" ? "active" : ""}
              >
                <div className="History-top-sort-preparing">Preparing</div>
              </li>
              <li
                onClick={() => setFilterStatus("DELIVERY")}
                className={filterStatus === "DELIVERY" ? "active" : ""}
              >
                <div className="History-top-sort-delivery">Delivery</div>
              </li>
              <li
                onClick={() => setFilterStatus("COMPLETED")}
                className={filterStatus === "COMPLETED" ? "active" : ""}
              >
                <div className="History-top-sort-complete">COMPLETED</div>
              </li>
              <li
                onClick={() => setFilterStatus("CANCELED")}
                className={filterStatus === "CANCELED" ? "active" : ""}
              >
                <div className="History-top-sort-cancel">CANCELED</div>
              </li>
            </ul>
          </div>
        </div>

        <div className="History-top2">
          <div className="History-top2-search">
            <input
              type="text"
              placeholder="Search by order name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="History-mid">
          {orders.length === 0 ? (
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              No order history found.
            </p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.order_id} className="History-product">
                <div className="History-product-status">
                  <p>{order.status}</p>
                  <p>{order.branch_name}</p>
                </div>

                {order.items.map((item) => (
                  <div
                    key={item.order_item_id}
                    className="History-product-productInfo"
                  >
                    <div className="History-product-productInfo-image">
                      <img
                        src={`http://localhost:3000${item.image}`}
                        alt={item.name}
                      />
                    </div>

                    <div className="History-product-productInfo-name">
                      <div className="History-product-productInfo-name-productName">
                        <p>{item.name}</p>
                      </div>
                      <div className="History-product-productInfo-name-option">
                        <p>{item.option_summary || "No option"}</p>
                      </div>
                      <div className="History-product-productInfo-name-price">
                        <div className="History-product-productInfo-name-price-left">
                          <p>x{item.quantity}</p>
                        </div>
                        <div className="History-product-productInfo-name-price-right">
                          <p>
                            {Number(item.line_total).toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="History-product-totalPrice">
                  <p>Total price</p>
                  <p>({order.items.length} products)</p>
                  <p>: {Number(order.final_price).toLocaleString("vi-VN")}đ</p>
                </div>
                <div className="History-product-button">
                  {["COMPLETED", "CANCELED"].includes(
                    order.status.toUpperCase()
                  ) && (
                    <button
                      className="History-product-button-again"
                      onClick={() => handleBuyAgain(order.order_id)}
                    >
                      Buy again!
                    </button>
                  )}
                  {order.status.toUpperCase() === "COMPLETED" && (
                    <button
                      className="History-product-button-rating"
                      onClick={() => openRatingModal(order.order_id)}
                    >
                      {order.isRated ? "Edit Rating" : "Rating product"}
                    </button>
                  )}
                  <button className="History-product-button-detail">
                    More Detail
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {showRatingModal && (
          <div className="modalRating">
            <div className="modalRating-content">
              <div className="modalRating-content-header">
                <h1 className="modalRating-content-header-title">
                  {isEditing ? "Edit your review" : "Leave a review"}
                </h1>
                <div
                  className="modalRating-content-header-close"
                  onClick={() => setshowRatingModal(false)}
                >
                  X
                </div>
              </div>

              <div className="modalRating-content-mid1">
                <div className="modalRating-content-mid1-rating">
                  <h3>{getRatingText()}</h3>
                </div>

                <div className="modalRating-content-mid1-star">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= (hover || rating) ? "star active" : "star"
                      }
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <div className="modalRating-content-mid1-comment">
                  <h3>Write your thoughts</h3>
                  <textarea
                    placeholder="Please share your opinion with us"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="modalRating-content-bottom">
                <button
                  className="modalRating-content-bottom-submit"
                  onClick={handleSubmitRating}
                >
                  {isEditing ? "Update Review" : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
