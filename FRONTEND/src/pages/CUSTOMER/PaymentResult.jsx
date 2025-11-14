// src/pages/PaymentResult.js
import { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import API from "../../api/api";

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const branchId = searchParams.get("branchId");
  const orderId = searchParams.get("orderId"); // Đây là orderId CŨ (vừa thanh toán)
  const token = localStorage.getItem("token");

  const isCancel = location.pathname.includes("/payment-cancel");

  useEffect(() => {
    const handlePaymentResult = async () => {
      // Biến để lưu order_id MỚI (từ giỏ hàng mới)
      let newCartOrderId = null;

      try {
        // --- BƯỚC 1: XỬ LÝ HỦY ĐƠN HÀNG (NẾU CÓ) ---
        if (isCancel && orderId && token) {
          try {
            console.log(
              `Submitting cancellation request for order: ${orderId}`
            );
            await API.post(
              `/orders/${orderId}/cancel-by-user`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log(`Order canceled ${orderId} (client side).`);
          } catch (err) {
            console.error("Error when calling API to cancel order:", err);
          }
        }

        // --- BƯỚC 2: TẠO GIỎ HÀNG MỚI (LUÔN LUÔN CHẠY) ---
        if (branchId && token) {
          // *** THAY ĐỔI: Lấy response để có order_id mới ***
          const response = await API.post(
            "/cart",
            { branch_id: branchId },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // Giả sử API trả về { order_id: "..." }
          if (response.data && response.data.order_id) {
            newCartOrderId = response.data.order_id;
            console.log(
              `New DRAFT cart created successfully: ${newCartOrderId}`
            );
          } else {
            console.error("API /cart did not return an order_id.");
          }
        } else {
          console.warn("No branchId or token found, cannot create new cart.");
        }
      } catch (err) {
        console.error("Common errors at PaymentResult:", err);
      } finally {
        // --- BƯỚC 3: CHUYỂN HƯỚNG THEO YÊU CẦU ---
        if (branchId && newCartOrderId) {
          // Nếu có branchId VÀ đã tạo được cart mới -> Về menu
          console.log(`Redirecting to /menu/${branchId}/${newCartOrderId}`);
          navigate(`/menu/${branchId}/${newCartOrderId}`);
        } else {
          // Fallback: Nếu không thể tạo giỏ hàng mới, về trang chủ
          console.error("Failed to create new cart. Redirecting to home.");
          navigate("/");
        }
      }
    };

    handlePaymentResult();
  }, [branchId, orderId, token, isCancel, navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Processing...</h1> {/* Cập nhật nội dung cho rõ ràng hơn */}
      <p>Your payment is processing. You will be redirected shortly.</p> {" "}
    </div>
  );
}
