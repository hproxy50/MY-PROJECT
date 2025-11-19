import { useEffect, useState } from "react";
import "../../css/History.scss";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import Header from "../../components/headerStatus";

export default function History() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("IN_PROGRESS");
  const [searchText, setSearchText] = useState("");
  const [showRatingModal, setshowRatingModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const [showAllBranches, setShowAllBranches] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const currentBranchId = localStorage.getItem("currentBranchId");
        let url = "/history";
        if (!showAllBranches && currentBranchId) {
          url = `/history?branch_id=${currentBranchId}`;
        }
        const res = await API.get(url);
        let ordersData = res.data.orders || [];
        const updatedOrders = await Promise.all(
          ordersData.map(async (order) => {
            try {
              const check = await API.get(`/ratings/check/${order.order_id}`);
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
  }, [showAllBranches]);

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const openCancelModal = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

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
      const res = await API.get(`/ratings/check/${orderId}`);
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
        await API.put(`/ratings/${currentOrderId}`, { rating, comment });
        alert("Rating updated successfully!");
      } else {
        await API.post("/ratings", {
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

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await API.put(`/history/${orderToCancel}/cancel`);
      alert("Order canceled successfully!");

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderToCancel ? { ...o, status: "CANCELED" } : o
        )
      );
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setShowCancelModal(false);
      setOrderToCancel(null);
    }
  };

  // const handleBuyAgain = async (orderId) => {
  //   try {
  //     const res = await API.post("/history/buy-again", { order_id: orderId });
  //     const draftOrderId = res.data.order_id;
  //     navigate(`/cart/${draftOrderId}`);
  //   } catch (err) {
  //     console.error("Buy again error:", err);
  //     alert(err.response?.data?.message || "Cannot add to cart");
  //   }
  // };

  const handleToggleBranchView = () => {
    setShowAllBranches((prev) => !prev);
  };

  const filteredOrders = orders
    .filter((o) => {
      const status = (o.status || "").toUpperCase();
      if (filterStatus === "IN_PROGRESS") {
        return ["PENDING", "PREPARING", "DELIVERY"].includes(status);
      }
      if (filterStatus === "ALL") {
        return ["COMPLETED", "CANCELED"].includes(status);
      }
      return status === filterStatus;
    })
    .filter((o) =>
      searchText.trim() === ""
        ? true
        : o.items.some((item) =>
            item.name.toLowerCase().includes(searchText.toLowerCase())
          )
    )
    .sort((a, b) => {
      if (filterStatus === "IN_PROGRESS") {
        const orderPriority = {
          DELIVERY: 1,
          PREPARING: 2,
          PENDING: 3,
        };
        const statusA = orderPriority[(a.status || "").toUpperCase()] || 99;
        const statusB = orderPriority[(b.status || "").toUpperCase()] || 99;
        return statusA - statusB;
      }

      if (filterStatus === "ALL") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      // if (filterStatus === "CANCELED") {
      //   return new Date(b.created_at) - new Date(a.created_at);
      // }

      // if (filterStatus === "COMPLETED") {
      //   return new Date(b.created_at) - new Date(a.created_at);
      // }

      return 0;
    });

  return (
    <>
      <Header orderId={currentOrderId} branchId={selectedOrder?.branch_id} />
      <div className="HistoryBody">
        <div className="History-top">
          <div className="History-top-sort">
            <ul>
              <li
                onClick={() => setFilterStatus("IN_PROGRESS")}
                className={filterStatus === "IN_PROGRESS" ? "active" : ""}
              >
                <div className="History-top-sort-inprogress">In Progress</div>
              </li>
              <li
                onClick={() => setFilterStatus("ALL")}
                className={filterStatus === "ALL" ? "active" : ""}
              >
                <div className="History-top-sort-delivery">History</div>
              </li>
              <li
                onClick={() => setFilterStatus("COMPLETED")}
                className={filterStatus === "COMPLETED" ? "active" : ""}
              >
                <div className="History-top-sort-complete">Rating</div>
              </li>
              <li
                onClick={() => setFilterStatus("CANCELED")}
                className={filterStatus === "CANCELED" ? "active" : ""}
              >
                <div className="History-top-sort-cancel">Canceled</div>
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

        <div className="History-top3">
          <button
            onClick={handleToggleBranchView}
            className={showAllBranches ? "all-branches-active" : ""}
          >
            {showAllBranches
              ? "Showing All Branches"
              : "Take all branch orders"}
          </button>
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
                  {/* {["COMPLETED", "CANCELED"].includes(
                    order.status.toUpperCase()
                  ) && (
                    <button
                      className="History-product-button-again"
                      onClick={() => handleBuyAgain(order.order_id)}
                    >
                      Buy again!
                    </button>
                  )} */}
                  {order.status.toUpperCase() === "PENDING" && (
                    <button
                      className="History-product-button-canceled"
                      onClick={() => openCancelModal(order.order_id)}
                    >
                      Cancel order
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
                  <button
                    className="History-product-button-detail"
                    onClick={() => openDetailModal(order)}
                  >
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
        {showCancelModal && (
          <div className="modalCancel">
            {" "}
            <div className="modalCancel-content">
              <h3>Confirm Cancellation</h3>
              <p>Are you sure you want to cancel this order?</p>
              <div className="modalCancel-buttons">
                <button className="btn-confirm" onClick={handleConfirmCancel}>
                  Yes, Cancel it
                </button>
                <button
                  className="btn-closeee"
                  onClick={() => setShowCancelModal(false)}
                >
                  No, Keep it
                </button>
              </div>
            </div>
          </div>
        )}
        {showDetailModal && selectedOrder && (
          <div className="modalDetail">
            <div className="modalDetail-content">
              <div className="modalDetail-header">
                <h2>Order Details</h2>
                <button
                  className="modalDetail-close"
                  onClick={closeDetailModal}
                >
                  ✕
                </button>
              </div>

              <div className="modalDetail-body">
                <div className="modalDetail-info">
                  {/* <p>
                    <strong>Order ID:</strong> {selectedOrder.order_id}
                  </p> */}
                  <p>
                    <strong>Status:</strong> {selectedOrder.status}
                  </p>
                  <p>
                    <strong>Created at:</strong>{" "}
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Order type:</strong> {selectedOrder.order_type}
                  </p>
                  <p>
                    <strong>Payment method:</strong>{" "}
                    {selectedOrder.payment_method}
                  </p>
                  <p>
                    <strong>Customer name:</strong>{" "}
                    {selectedOrder.customer_name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedOrder.customer_phone}
                  </p>
                  {selectedOrder.order_type === "DELIVERY" && (
                    <p>
                      <strong>Address:</strong>{" "}
                      {selectedOrder.delivery_address || "N/A"}
                    </p>
                  )}
                  <p>
                    <strong>Scheduled time:</strong>{" "}
                    {new Date(selectedOrder.scheduled_time).toLocaleString()}
                  </p>
                  <p>
                    <strong>Branch:</strong> {selectedOrder.branch_name}
                  </p>
                  <p>
                    <strong>Message:</strong> {selectedOrder.message}
                  </p>
                  <hr />
                  <p>
                    <strong>Total price:</strong>{" "}
                    {Number(selectedOrder.total_price).toLocaleString("vi-VN")}đ
                  </p>
                  {selectedOrder.order_type === "DELIVERY" && (
                    <p>
                      <strong>Shipping fee:</strong> +{" "}
                      {Number(selectedOrder.shipping_fee).toLocaleString(
                        "vi-VN"
                      )}
                      đ
                    </p>
                  )}
                  <p>
                    <strong>Discount:</strong> -{" "}
                    {Number(selectedOrder.discount_amount).toLocaleString(
                      "vi-VN"
                    )}
                    đ
                  </p>
                  <p>
                    <strong>Final price:</strong>{" "}
                    {Number(selectedOrder.final_price).toLocaleString("vi-VN")}đ
                  </p>
                </div>

                <div className="modalDetail-items">
                  <h3>Ordered Items</h3>
                  {selectedOrder.items.map((item) => (
                    <div key={item.order_item_id} className="modalDetail-item">
                      <img
                        src={`http://localhost:3000${item.image}`}
                        alt={item.name}
                      />
                      <div className="modalDetail-item-info">
                        <p>
                          <strong>{item.name}</strong>
                        </p>
                        <p>{item.option_summary || "No option"}</p>
                        <p>x{item.quantity}</p>
                        <p>
                          {Number(item.line_total).toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
