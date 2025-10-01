// OrdersTable.js
import React from "react";

export default function OrdersTable({ orders, selectable = false, selectedIds = new Set(), onToggleSelect, onActionClick, actionLabel }) {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            {selectable && <th style={{width: 40}}></th>}
            <th>#</th>
            <th>Mã đơn</th>
            <th>Khách</th>
            <th>Điện thoại</th>
            <th>Chi nhánh</th>
            <th>Loại</th>
            <th>Tổng</th>
            <th>Thanh toán</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => (
            <tr key={o.order_id}>
              {selectable && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(o.order_id)}
                    onChange={() => onToggleSelect(o.order_id)}
                  />
                </td>
              )}
              <td>{idx + 1}</td>
              <td>{o.order_code || `#${o.order_id}`}</td>
              <td>{o.customer_name || o.user_name || o.customer_name}</td>
              <td>{o.customer_phone || o.user_phone}</td>
              <td>{o.branch_name}</td>
              <td>{o.order_type}</td>
              <td>{Number(o.final_price || o.total_price).toLocaleString()} đ</td>
              <td>{o.payment_method}</td>
              <td><span className="badge bg-secondary">{o.status}</span></td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td>
                {onActionClick && (
                  <button className="btn btn-sm btn-primary" onClick={() => onActionClick(o.order_id)}>
                    {actionLabel}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
