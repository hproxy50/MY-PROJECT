import "../../css/Checkout.scss";
import delivery from "../../assets/image/deliveryIcon.png";
import pickup from "../../assets/image/pizzaStoreIcon.png";
import { useEffect, useState } from "react";
import { SquarePen } from "lucide-react";
import { useParams } from "react-router-dom";
import API from "../../api/api";
import product from "../../assets/image/product.jpg";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const { orderId } = useParams();
  const [promos, setPromos] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);

  const [checkoutData, setCheckoutData] = useState(null);
  const [CustomerName, setCustomerName] = useState("");
  const [CustomerPhone, setCustomerPhone] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    order_type: "DINE_IN",
    scheduled_time: "",
    delivery_address: "",
    payment_method: "CASH",
    message: "",
    district: "",
    ward: "",
    street: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get(`/orders/${orderId}/checkout`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCheckoutData(res.data);
        setForm((f) => ({
          ...f,
          customer_name: res.data.user.name,
          customer_phone: res.data.user.phone,
          district: res.data.branch.address,
        }));
        setCustomerName(res.data.user.name);
        setCustomerPhone(res.data.user.phone);
      } catch (err) {
        console.error("/checkout:", err);
        if (err.response) {
          console.error("err:", err.message);
        }
      }
    };

    if (orderId) fetchData();
  }, [orderId, token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleConfirm = async () => {
    if (
      deliveryMethod === "delivery" &&
      (!form.ward.trim() || !form.street.trim())
    ) {
      alert("Please fill in full ward/commune information and house number/street name.");
      return;
    }
    try {
      const delivery_address =
        `${form.street}, ${form.ward}, ${form.district}`.trim();
        const payload = {
      ...form,
      delivery_address, // <- THÊM VÀO
    };
      await API.post(`/orders/${orderId}/confirm`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = "/"; // hoặc chuyển sang trang "đơn hàng của tôi"
    } catch (err) {
      alert(err.response?.data?.message || "err order");
    }
  };

  const handleConfirmQR = async () => {
    if (
      deliveryMethod === "delivery" &&
      (!form.ward.trim() || !form.street.trim())
    ) {
      alert("Please fill in full ward/commune information and house number/street name.");
      return;
    }
    try {
      const delivery_address =
        `${form.street}, ${form.ward}, ${form.district}`.trim();
        const payload = {
      ...form,
      delivery_address, // <- THÊM VÀO
    };
      await API.post(`/orders/${orderId}/confirmQR`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert(err.response?.data?.message || "err order qr");
    }
  };

  // 1. Hàm lấy thời gian hiện tại (định dạng cho datetime-local)
  function getCurrentDateTimeLocal() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Local time
    return now.toISOString().slice(0, 16);
  }

  // 2. State cho minDateTime
  const [minDateTime] = useState(getCurrentDateTimeLocal());

  // // 3. Hàm xử lý khi người dùng chọn thời gian
  // function handleTimeChange(e) {
  //   const selectedDate = new Date(e.target.value);
  //   const hour = selectedDate.getHours();

  //   if (hour < 8 || hour >= 22) {
  //     alert("Vui lòng chọn giờ giao hàng từ 08:00 đến 22:00.");
  //     e.target.value = "";
  //   }
  // }

  // Lấy danh sách promo khi load trang checkout
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await API.get(`/promotion`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Lọc theo branch + thời gian hiệu lực
        const available = res.data.filter(
          (p) =>
            p.branch_id === checkoutData.branch.id &&
            new Date(p.start_date) <= new Date() &&
            new Date(p.end_date) >= new Date()
        );
        setPromos(available);
      } catch (err) {
        console.error("Lỗi khi load promotions:", err);
      }
    };
    if (checkoutData) fetchPromos();
  }, [checkoutData]);

  if (!checkoutData) return <p>Đang tải...</p>;

  return (
    <>
      <Header />
      <div className="checkout-page">
        <div className="checkout-page-card">
          <div className="checkout-page-card-top">
            <div className="checkout-page-card-top-1"></div>
            <div className="checkout-page-card-top-2">Payment information</div>
            <div className="checkout-page-card-top-3"></div>
          </div>
          <div className="checkout-page-card-bottom">
            <div className="checkout-page-card-bottom-left">
              <div className="checkout-page-card-bottom-left-up">
                <div className="delivery-choosing-title">
                  <p>Please select a delivery method</p>
                </div>
                <div className="delivery-choosing-method">
                  <button
                    className={`delivery-choosing-method-pickup ${
                      deliveryMethod === "pickup" ? "active" : ""
                    }`}
                    onClick={() => {
                      setDeliveryMethod("pickup");
                      setForm((prev) => ({ ...prev, order_type: "TAKEAWAY" }));
                    }}
                  >
                    <img src={pickup} alt="" />
                    Pick up at store
                  </button>
                  <button
                    className={`delivery-choosing-method-delivery ${
                      deliveryMethod === "delivery" ? "active" : ""
                    }`}
                    onClick={() => {
                      setDeliveryMethod("delivery");
                      setForm((prev) => ({ ...prev, order_type: "DELIVERY" }));
                    }}
                  >
                    <img src={delivery} alt="" />
                    Home delivery
                  </button>
                </div>
              </div>
              <div className="checkout-page-card-bottom-left-down">
                {deliveryMethod === "pickup" ? (
                  <div className="checkout-page-card-bottom-left-down-info">
                    <div className="checkout-page-card-bottom-left-down-info-name">
                      Order placed by{" "}
                      {/* <p name="customer_name">{form.customer_name}</p>- */}
                      <p name="customer_name">{CustomerName}</p>-
                      {/* <p name="customer_phone">{form.customer_phone}</p> */}
                      <p name="customer_phone">{CustomerPhone}</p>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-address">
                      At <p>{checkoutData.branch.name}</p>-
                      <p>{checkoutData.branch.address}</p>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-remind">
                      <p>
                        Please re-enter the recipient information if there is
                        any change.
                      </p>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-input1">
                      <div className="input-group">
                        <label>Recipient's phone number</label>
                        <input
                          type="text"
                          className="checkout-page-card-bottom-left-down-info-input1-phone"
                          name="customer_phone"
                          value={form.customer_phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="input-group">
                        <label>Recipient name</label>
                        <input
                          type="text"
                          className="checkout-page-card-bottom-left-down-info-input1-name"
                          name="customer_name"
                          value={form.customer_name}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-input2">
                      <div className="input-group">
                        <label>Message for the store</label>
                        <input
                          type="text"
                          className="checkout-page-card-bottom-left-down-info-input2-message"
                          name="customer_message"
                          value={form.message}
                        />
                      </div>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-input3">
                      <div className="Select-time">
                        <label>Select time you will came</label>
                        <input
                          type="datetime-local"
                          name="scheduled_time"
                          className="form-control"
                          min={minDateTime}
                          value={form.scheduled_time}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="checkout-page-card-bottom-left-down-info">
                    <div className="checkout-page-card-bottom-left-down-info-name">
                      Order placed by
                      <p name="customer_name">{CustomerName}</p>-
                      <p name="customer_phone">{CustomerPhone}</p>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-address">
                      At
                      <p>{checkoutData.branch.name}</p>-
                      <p>{checkoutData.branch.address}</p>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-remind">
                      <p>
                        Please re-enter the recipient information if there is
                        any change.
                      </p>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-input1">
                      <div className="input-group">
                        <label>Recipient's phone number</label>
                        <input
                          type="text"
                          className="checkout-page-card-bottom-left-down-info-input1-phone"
                          name="customer_phone"
                          value={form.customer_phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="input-group">
                        <label>Recipient name</label>
                        <input
                          type="text"
                          className="checkout-page-card-bottom-left-down-info-input1-name"
                          name="customer_name"
                          value={form.customer_name}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-delivery">
                      <div className="input-group">
                        <label>District</label>
                        <input
                          type="text"
                          className="checkout-page-card-bottom-left-down-info-delivery-district"
                          name="customer_district"
                          value={form.district}
                          // onChange={handleChange}
                          readOnly
                        />
                        {/* input[readOnly] {
                        background-color: #f5f5f5;
                        color: #555;
                        cursor: not-allowed;
                        } */}
                      </div>
                      <div className="input-group">
                        <label>Ward/commune</label>
                        <input
                          type="text"
                          className="checkout-page-card-bottom-left-down-info-delivery-Ward"
                          name="ward"
                          value={form.ward}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-userAddress">
                      <div className="input-group">
                        <label>House number/street name</label>
                        <input
                          type="text"
                          className="checkout-page-card-bottom-left-down-info-userAddress-input"
                          name="street"
                          value={form.street}
                          onChange={handleChange}
                        />
                      </div>
                      {/* <button className="button-confirm" onClick={() => setShowMap(true)}>
                      Confirm
                    </button> */}
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-messageDelivery">
                      <div className="input-group">
                        <label>Message for the delivery</label>
                        <input
                          type="text"
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          className="checkout-page-card-bottom-left-down-info-messageDelivery-input"
                        />
                      </div>
                    </div>
                    <div className="checkout-page-card-bottom-left-down-info-timeDelivery">
                      <label>Please select the desired time to receive</label>
                      <p>
                        Today, "
                        {new Date().toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                        })}
                        ", at
                      </p>
                      <div className="input-group">
                        <input
                          type="time"
                          name="scheduled_time"
                          className="form-control"
                          min="08:00"
                          max="22:00"
                          value={
                            form.scheduled_time
                              ? new Date(
                                  form.scheduled_time
                                ).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""
                          }
                          onChange={(e) => {
                            const selectedTime = e.target.value; // "HH:mm"
                            const now = new Date();
                            const [hour, minute] = selectedTime
                              .split(":")
                              .map(Number);
                            const selectedDate = new Date(); // hôm nay
                            selectedDate.setHours(hour, minute, 0, 0);

                            // if (selectedDate < now) {
                            //   alert("Please select a time in the future");
                            //   return;
                            // }

                            // format về "YYYY-MM-DD HH:mm:00"
                            const year = selectedDate.getFullYear();
                            const month = String(
                              selectedDate.getMonth() + 1
                            ).padStart(2, "0");
                            const day = String(selectedDate.getDate()).padStart(
                              2,
                              "0"
                            );
                            const h = String(hour).padStart(2, "0");
                            const m = String(minute).padStart(2, "0");
                            const formatted = `${year}-${month}-${day} ${h}:${m}:00`;

                            handleChange({
                              target: {
                                name: "scheduled_time",
                                value: formatted,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="checkout-page-card-bottom-right">
              <div className="checkout-page-card-bottom-right-top">
                {/* <h4>Cart({order.items.length} product)</h4> */}
                <h4>Cart 3 product</h4>
                <button onClick={() => navigate(`/cart/${orderId}`)}>
                  Change cart <SquarePen />
                </button>
              </div>
              <div className="checkout-page-card-bottom-right-middle1">
                {checkoutData.items.map((i) => (
                  <div className="product" key={i.order_item_id}>
                    <img src={product} alt="product" />
                    <div className="product-info">
                      <p className="product-info-name">{i.name}</p>
                      <p className="product-info-quantity">
                        Quantity: {i.quantity}
                      </p>
                    </div>
                    <p className="product-price">
                      {Number(i.line_total).toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                ))}
              </div>
              <div className="checkout-page-card-bottom-right-middle2">
                <div className="checkout-page-card-bottom-right-middle2-total">
                  <p>Total amount</p>
                  <p>
                    {Number(checkoutData.total_price).toLocaleString("vi-VN")} đ
                  </p>
                </div>
                <div className="checkout-page-card-bottom-right-middle2-promotion">
                  <div className="select">
                    <select
                      className="select-voucher"
                      value={selectedPromo || ""}
                      onChange={(e) => setSelectedPromo(e.target.value)}
                    >
                      <option value="" disabled selected>
                        Choosing promotion
                      </option>
                      {promos.map((p) => (
                        <option key={p.promo_id} value={p.promo_id}>
                          {p.title} (
                          {p.discount_type === "PERCENT"
                            ? `${p.discount_value}%`
                            : `${p.discount_value} đ`}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="apply-button"
                    onClick={async () => {
                      try {
                        const res = await API.post(
                          `/orders/${orderId}/apply-promo`,
                          { promo_id: selectedPromo },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        alert(res.data.message);
                        // reload checkout info để hiển thị final_price
                        window.location.reload();
                      } catch (err) {
                        alert(err.response?.data?.message || "ERR");
                      }
                    }}
                    disabled={!selectedPromo}
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className="checkout-page-card-bottom-right-bottom">
                <div className="checkout-page-card-bottom-right-bottom-final">
                  <p className="total-price-title">Total price</p>
                  <p className="total-price-number">
                    {Number(checkoutData.total_price).toLocaleString("vi-VN")} đ
                  </p>
                </div>
                <div className="checkout-page-card-bottom-right-bottom-discount">
                  <p>Discount: </p>
                  {checkoutData.discount_amount > 0 && (
                    <p className="total-price-discount">
                      {Number(checkoutData.discount_amount).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      đ
                    </p>
                  )}
                </div>
                <div className="checkout-page-card-bottom-right-bottom-payment">
                  <p>Payment:</p>
                  {checkoutData.final_price > 0 && (
                    <p className="total-price-payment">
                      {Number(checkoutData.final_price).toLocaleString("vi-VN")}{" "}
                      đ
                    </p>
                  )}
                </div>
                <div className="checkout-page-card-bottom-right-bottom-select">
                  <select
                    className="select-payment"
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                  >
                    <option value="" disabled selected>
                      Payment method
                    </option>
                    <option value="CASH">Pay with Cash</option>
                    <option value="QR">Pay with QR Code (PayOS)</option>
                  </select>
                </div>
                <div className="checkout-page-card-bottom-right-bottom-button">
                  <button
                    className="checkout-page-card-bottom-right-bottom-button-payment"
                    onClick={async () => {
                      if (form.payment_method === "CASH") {
                        await handleConfirm();
                      } else if (form.payment_method === "QR") {
                        try {
                          const res = await API.post(
                            `/orders/${orderId}/payment-payos`,
                            {},
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          await handleConfirmQR();
                          //PayOS
                          window.location.href = res.data.paymentUrl;
                        } catch (err) {
                          alert("Không tạo được link PayOS");
                        }
                      }
                    }}
                  >
                    Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
