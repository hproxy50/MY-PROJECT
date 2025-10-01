import { useSearchParams } from "react-router-dom";
import API from "../../api/api";
import { useEffect } from "react";

export default function PaymentCancelPage() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");

  useEffect(() => {
    if (orderId) {
      API.post(`/orders/${orderId}/cancel`)
        .then(() => console.log("Order cancelled"))
        .catch(err => console.error("Cancel API error:", err));
    }
  }, [orderId]);

  return <h2>❌ Bạn đã hủy thanh toán đơn hàng #{orderId}</h2>;
}
