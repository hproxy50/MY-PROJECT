import React, { useState, useMemo } from "react";
import { useChefOrders, approveChefOrder, cancelChefOrder } from "./useChef.js";

import "../../css/Chef.scss";

const OrderCard = ({
  order,
  onApprove,
  onCancel,
  isProcessing,
  processingType,
}) => {
  const isDelivery = order.order_type === "DELIVERY";

  const getScheduleInfo = () => {
    if (!order.scheduled_time) {
      return { text: "Urgent order", variant: "warning" };
    }
    const scheduleDate = new Date(order.scheduled_time);
    const now = new Date();
    const diffMins = (scheduleDate - now) / 60000;

    const timeStr = scheduleDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffMins < 0) {
      return { text: `Late, should been ${timeStr}`, variant: "danger" };
    }
    if (diffMins < 15) {
      return { text: `Urgent! (Take by ${timeStr})`, variant: "warning" };
    }
    return { text: `Take by ${timeStr}`, variant: "info" };
  };

  const scheduleInfo = getScheduleInfo();

  return (
    <div className={`Chef-order ${isDelivery ? "Chef-order-delivery" : ""}`}>
      <div className="Chef-order-header">
        <strong>Order #{order.order_id}</strong>
        <span
          className={`Chef-order-header-badge ${
            isDelivery ? "badge-delivery" : "badge-takeaway"
          }`}
        >
          {order.order_type || "N/A"}
        </span>
      </div>

      <div className="Chef-order-body">
        <div className="Chef-order-body-schedule">
          <div
            className={`Chef-order-body-schedule-badge badge-${scheduleInfo.variant}`}
          >
            {scheduleInfo.text}
          </div>
        </div>

        {order.message && (
          <div className="Chef-order-body-note">
            <strong>Note: </strong> {order.message}
          </div>
        )}

        <ul className="Chef-order-body-items">
          {order.items?.map((item, index) => (
            <li key={index} className="Chef-order-body-items-item">
              <div className="Chef-order-body-items-item-info">
                <span className="Chef-order-body-items-item-quantity">
                  {item.quantity}x
                </span>
                <div className="Chef-order-body-items-item-details">
                  <strong>{item.name}</strong>
                  <small>
                    {item.options
                      ? item.options
                          .map((opt) => `${opt.group}: ${opt.choice}`)
                          .join(", ")
                      : item.option_summary}
                  </small>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="Chef-order-footer">
        {" "}
        {/* <button
          className="Chef-order-footer-button button-cancel"
          onClick={() => onCancel(order.order_id)}
          disabled={isProcessing}
        >
          {" "}
          {processingType === "canceling" ? (
            <span className="Chef-order-footer-spinner"></span>
          ) : (
            "Cancel"
          )}{" "}
        </button>{" "} */}
        <button
          className="Chef-order-footer-button button-approve"
          onClick={() => onApprove(order.order_id)}
          disabled={isProcessing}
        >
          {" "}
          {processingType === "approving" ? (
            <span className="Chef-order-footer-spinner"></span>
          ) : (
            "Delivery"
          )}{" "}
        </button>{" "}
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="Chef-order Chef-order-loading">
    <div className="Chef-order-header">
      <div className="placeholder placeholder-title"></div>
    </div>
    <div className="Chef-order-body">
      <div className="placeholder placeholder-badge"></div>
      <div className="placeholder placeholder-text"></div>
      <div className="placeholder placeholder-text"></div>
    </div>
    <div className="Chef-order-footer">
      <div className="placeholder placeholder-button"></div>
    </div>
  </div>
);

function ChefOrderDisplay() {
  const { orders, isLoading, isError } = useChefOrders();
  const [processingState, setProcessingState] = useState({});
  const [sortBy, setSortBy] = useState("created_at");

  const handleCancel = async (orderId) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel Order #${orderId}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setProcessingState((prev) => ({ ...prev, [orderId]: "canceling" }));
    try {
      await cancelChefOrder(orderId);
    } catch (error) {
      alert(`error: ${error.message}`);
      setProcessingState((prev) => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  };

  const handleApprove = async (orderId) => {
    setProcessingState((prev) => ({ ...prev, [orderId]: "approving" }));
    try {
      await approveChefOrder(orderId);
    } catch (error) {
      alert(`error: ${error.message}`);
      setProcessingState((prev) => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  };

  const sortOptions = [
    { name: "Latest", value: "created_at" },
    { name: "Urgent", value: "scheduled_time" },
  ];

  const sortedOrders = useMemo(() => {
    const sorted = [...orders];
    if (sortBy === "created_at") {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "scheduled_time") {
      sorted.sort((a, b) => {
        const timeA = a.scheduled_time ? new Date(a.scheduled_time) : 0;
        const timeB = b.scheduled_time ? new Date(b.scheduled_time) : 0;
        if (timeA === 0 && timeB === 0) return 0;
        if (timeA === 0) return -1;
        if (timeB === 0) return 1;
        return timeA - timeB;
      });
    }
    return sorted;
  }, [orders, sortBy]);

  return (
    <div className="ChefBody">
      <div className="Chef-top">
        <div className="Chef-top-sort">
          <ul>
            {sortOptions.map((opt) => (
              <li
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={sortBy === opt.value ? "active" : ""}
              >
                <div>{opt.name}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isError && (
        <div className="Chef-alert Chef-alert-danger">
          Unable to load order list. Please check your connection.
        </div>
      )}
      <div className="Chef-mid">
        {isLoading && !orders.length ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <OrderCard
              key={order.order_id}
              order={order}
              onApprove={handleApprove}
              onCancel={handleCancel}
              isProcessing={!!processingState[order.order_id]}
              processingType={processingState[order.order_id] || null}
            />
          ))
        ) : (
          <div className="Chef-alert Chef-alert-success">
            <h1>No order now!</h1>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChefOrderDisplay;
