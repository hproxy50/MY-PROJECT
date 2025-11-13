import { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import API from "../../api/api"; // Đảm bảo đường dẫn API là chính xác

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation(); // Giúp chúng ta biết đang ở path nào // Lấy các tham số từ URL

  const branchId = searchParams.get("branchId");
  const orderId = searchParams.get("orderId"); // Quan trọng: Lấy orderId
  const token = localStorage.getItem("token"); // Kiểm tra xem đây có phải là trang "hủy" không

  const isCancel = location.pathname.includes("/payment-cancel");

  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        // --- BƯỚC 1: XỬ LÝ HỦY ĐƠN HÀNG (NẾU CÓ) ---
        if (isCancel && orderId && token) {
          try {
            console.log(`Submitting cancellation request for order: ${orderId}`); // Gọi API mới chúng ta vừa tạo ở backend
            await API.post(
              `/orders/${orderId}/cancel-by-user`,
              {}, // Không cần body
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log(`Order canceled ${orderId} (client side).`);
          } catch (err) {
            // Bỏ qua lỗi ở đây để user vẫn được tạo giỏ hàng mới
            console.error("Error when calling API to cancel order:", err);
          }
        } // --- BƯỚC 2: TẠO GIỎ HÀNG MỚI (LUÔN LUÔN CHẠY) ---

        if (branchId && token) {
          await API.post(
            "/cart", // Gọi hàm createOrder
            { branch_id: branchId },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("New DRAFT cart created successfully.");
        } else {
          console.warn(
            "No branchId or token found, cannot create new cart."
          );
        }
      } catch (err) {
        console.error("Common errors at PaymentResult:", err);
      } finally {
        navigate("/history");
      }
    };

    handlePaymentResult();
  }, [branchId, orderId, token, isCancel, navigate]); // Thêm các dependencies mới // Hiển thị thông báo loading trong khi chờ xử lý

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
            <h1>Processing...</h1>     {" "}
      <p>You will be redirected to the history page momentarily.</p>   {" "}
    </div>
  );
}
