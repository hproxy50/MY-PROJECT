import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import API from "../../api/api";
import Header from "../../components/Header";
import "../../css/cart.scss";
import Empty from "../../assets/image/empty.jpg"

export default function Cart() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  //const totalQuantity = order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const fetchCart = async () => {
    try {
      const res = await API.get(`/cart/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [orderId]);

  const handleUpdateQty = async (orderItemId, qty) => {
    if (qty < 1) {
      const item = order.items.find((i) => i.order_item_id === orderItemId);
      setDeleteTarget(item);
      setShowDeleteModal(true);
      return;
    }
    try {
      await API.put(
        `/cart/items/${orderItemId}`,
        { quantity: qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (orderItemId) => {
    try {
      await API.delete(`/cart/items/${orderItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot change quantity");
      console.error(err);
    }
  };

  return (
    <>
      <Header orderId={orderId} />
      <div className="cart-page">
        <div className="body">
          <div className="body-top">
            <h1>CART</h1>
          </div>
          {order ? (
            order.items.length === 0 ? (
              <div className="body-empty">
                <div className="body-empty-cart">
                  <img src={Empty} alt="Empty" />
                  <h3>Your cart is empty, please order.</h3>
                  <button
                    className="body-empty-comeback"
                    onClick={() =>
                      navigate(`/menu/${order.branch_id}/${orderId}`)
                    }
                  >
                    Order now!
                  </button>
                </div>
              </div>
            ) : (
              <div className="body-cart">
                <div className="body-left">
                  <div className="cart-top">
                    <p>Product</p>
                    <p>Price</p>
                    <p>Quantity</p>
                    <p>Total</p>
                  </div>
                  {order.items.map((item) => (
                    <div key={item.order_item_id} className="cart-bottom">
                      <div className="product-detail">
                        {item.image ? (
                          <img
                            src={`http://localhost:3000${item.image}`}
                            alt={item.name}
                          />
                        ) : (
                          "NO IMAGE"
                        )}
                        <div className="product-detail-namedesc">
                          <h5>{item.name}</h5>
                          <p>{item.description}</p>
                        </div>
                      </div>
                      <p>{Number(item.unit_price).toLocaleString("vi-VN")} đ</p>
                      <div className="product-quantity">
                        <button
                          className="product-quantity-btn"
                          onClick={() =>
                            handleUpdateQty(
                              item.order_item_id,
                              item.quantity - 1
                            )
                          }
                        >
                          −
                        </button>
                        <span className="product-quantity-number">
                          {item.quantity}
                        </span>
                        <button
                          className="product-quantity-btn"
                          onClick={() =>
                            handleUpdateQty(
                              item.order_item_id,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                      <p>{Number(item.line_total).toLocaleString("vi-VN")} đ</p>
                    </div>
                  ))}
                </div>

                <div className="body-right">
                  <div className="cart-detail">
                    <div className="cart-detail-top">
                      <h4>Cart({order.items.length} product)</h4>
                      {/* <h4>Cart ({totalQuantity} product)</h4> */}
                    </div>
                    <div className="cart-detail-middle">
                      <p>Total amount:</p>
                      <p>
                        {Number(order.total_price).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="cart-detail-bottom">
                      <h5>Total: </h5>
                      <h5>
                        {Number(order.total_price).toLocaleString("vi-VN")} đ
                      </h5>
                    </div>
                    <div className="cart-detail-button">
                      <button
                        className="cart-detail-button-continue"
                        onClick={() =>
                          navigate(`/menu/${order.branch_id}/${orderId}`)
                        }
                      >
                        Continue ordering
                      </button>
                      <button
                        className="cart-detail-button-payment"
                        onClick={() => navigate(`/checkout/${orderId}`)}
                      >
                        Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <p>Loading cart...</p>
          )}
        </div>
      </div>

      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm delete product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteTarget ? (
            <>
              <p>
                Are you confirm to delete this product{" "}
                <strong>{deleteTarget.name}</strong> of the cart?
              </p>
            </>
          ) : (
            <p>Are you confirm to delete this product?</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeleteItem(deleteTarget.order_item_id)}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}


