import React, { useState, useMemo } from "react";
import {
  useShipperOrders,
  completeShipperOrder,
  cancelShipperOrder,
} from "./useShipper.js";

import "../../css/Shipper.scss";
const ShipperOrderCard = ({
  order,
  onComplete,
  isProcessing,
  onCancel,
  processingType,
}) => {
  const isDelivery = order.order_type === "DELIVERY";

  // const minutesAgo = Math.round(
  //   (new Date() - new Date(order.created_at)) / 60000
  // );

  const getScheduleInfo = () => {
    if (!order.scheduled_time) {
      return { text: "Deliver/Pickup Now", variant: "warning" };
    }
    const scheduleDate = new Date(order.scheduled_time);
    const now = new Date();
    const diffMins = (scheduleDate - now) / 60000;

    const timeStr = scheduleDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffMins < 0) {
      return { text: `Late! (Was at ${timeStr})`, variant: "danger" };
    }
    if (diffMins < 15) {
      return { text: `Urgent! (At ${timeStr})`, variant: "warning" };
    }
    return { text: `Scheduled for ${timeStr}`, variant: "info" };
  };

  const scheduleInfo = getScheduleInfo();

  const formattedPrice =
    new Intl.NumberFormat("vi-VN").format(order.final_price) + "đ";

  return (
    <div
      className={`Shipper-order ${
        isDelivery ? "Shipper-order-delivery" : "Shipper-order-takeaway"
      }`}
    >
      <div className="Shipper-order-header">
        <strong>Order #{order.order_id}</strong>
        <span
          className={`Shipper-order-header-badge ${
            isDelivery ? "badge-delivery" : "badge-takeaway"
          }`}
        >
          {isDelivery ? "Delivery" : "Take away"}
        </span>
      </div>

      <div className="Shipper-order-body">
        <div className="Shipper-order-body-schedule">
          <div
            className={`Shipper-order-body-schedule-badge badge-${scheduleInfo.variant}`}
          >
            {scheduleInfo.text}
          </div>
          {/* <div className="Shipper-order-body-schedule-time">
            (Received {minutesAgo} minutes ago)
          </div> */}
        </div>

        <ul className="Shipper-order-body-customer">
          <li>
            <strong>Customer:</strong>
            <span>{order.customer_name}</span>
          </li>
          <li>
            <strong>Phone:</strong>
            <span>{order.customer_phone}</span>
          </li>
          {isDelivery && order.delivery_address && (
            <li>
              <strong>Address:</strong>
              <span>{order.delivery_address}</span>
            </li>
          )}
          <li>
            <strong>Total:</strong>
            <strong>{formattedPrice}</strong>
          </li>
        </ul>

        {order.message && (
          <div className="Shipper-order-body-note">
            <strong>Note: </strong> {order.message}
          </div>
        )}

        <ul className="Shipper-order-body-items">
          <li
            className="Shipper-order-body-items-item"
            style={{ borderTop: "none", paddingTop: 0 }}
          >
            <strong>Order Details:</strong>
          </li>
          {order.items?.map((item) => (
            <li
              key={item.order_item_id}
              className="Shipper-order-body-items-item"
            >
              <div className="Shipper-order-body-items-item-info">
                <span className="Shipper-order-body-items-item-quantity">
                  {item.quantity}x
                </span>
                <div className="Shipper-order-body-items-item-details">
                  <strong>{item.name}</strong>
                  <small>
                    {item.options
                      ? item.options
                          .map((opt) => `${opt.group}: ${opt.choice}`)
                          .join(", ")
                      : item.option_summary || "No options"}
                  </small>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="Shipper-order-footer">
        {/* <button
          className="Shipper-order-footer-button button-cancel"
          onClick={() => onCancel(order.order_id)}
          disabled={isProcessing}
        >
          {" "}
          {processingType === "canceling" ? (
            <span className="Shipper-order-footer-spinner"></span>
          ) : (
            "Cancel"
          )}{" "}
        </button>{" "} */}
        <button
          className="Shipper-order-footer-button button-complete"
          onClick={() => onComplete(order.order_id)}
          disabled={isProcessing}
        >
          {" "}
          {processingType === "completing" ? (
            <span className="Shipper-order-footer-spinner"></span>
          ) : isDelivery ? (
            "Delivery"
          ) : (
            "Picked Up"
          )}{" "}
        </button>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="Shipper-order Shipper-order-loading">
    <div className="Shipper-order-header">
      <div className="placeholder placeholder-title"></div>
    </div>
    <div className="Shipper-order-body">
      <div className="placeholder placeholder-badge"></div>
      <div className="placeholder placeholder-text"></div>
      <div className="placeholder placeholder-text"></div>
    </div>
    <div className="Shipper-order-footer">
      <div className="placeholder placeholder-button"></div>
    </div>
  </div>
);

function ShipperDisplay() {
  const { orders, isLoading, isError } = useShipperOrders();
  const [processingState, setProcessingState] = useState({});
  const [currentTab, setCurrentTab] = useState("all");

  const handleComplete = async (orderId) => {
    setProcessingState((prev) => ({ ...prev, [orderId]: "completing" }));
    try {
      await completeShipperOrder(orderId);
    } catch (error) {
      alert(`Error: ${error.message}`);
      setProcessingState((prev) => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) {
      return;
    }
    setProcessingState((prev) => ({ ...prev, [orderId]: "canceling" }));
    try {
      await cancelShipperOrder(orderId);
    } catch (error) {
      alert(`Error: ${error.message}`);
      setProcessingState((prev) => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  };
//Remove 
  const tabOptions = [
    { name: "All", value: "all" },
    { name: "Delivery", value: "delivery" },
    { name: "Takeaway", value: "takeaway" },
  ];

  const filteredOrders = useMemo(() => {
    if (currentTab === "all") {
      return orders;
    }
    if (currentTab === "delivery") {
      return orders.filter((o) => o.order_type === "DELIVERY");
    }
    if (currentTab === "takeaway") {
      return orders.filter((o) => o.order_type === "TAKEAWAY");
    }
    return [];
  }, [orders, currentTab]);

  return (
    <div className="ShipperBody">
      <div className="Shipper-top">
        <div className="Shipper-top-sort">
          <ul>
            {tabOptions.map((tab) => (
              <li
                key={tab.value}
                onClick={() => setCurrentTab(tab.value)}
                className={currentTab === tab.value ? "active" : ""}
              >
                <div>{tab.name}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {isError && (
        <div className="Shipper-alert Shipper-alert-danger">
          Unable to load orders. Please check your connection.
        </div>
      )}
      <div className="Shipper-mid">
        {isLoading && !orders.length ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <ShipperOrderCard
              key={order.order_id}
              order={order}
              onComplete={handleComplete}
              onCancel={handleCancel}
              isProcessing={!!processingState[order.order_id]}
              processingType={processingState[order.order_id] || null}
            />
          ))
        ) : (
          <div className="Shipper-alert Shipper-alert-success">
            <h1>No Orders!</h1>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShipperDisplay;
