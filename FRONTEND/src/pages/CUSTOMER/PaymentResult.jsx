// pages/PaymentResult.jsx
export default function PaymentResult({ status }) {
  return (
    <div className="container mt-5 text-center">
      {status === "success" ? (
        <h2 className="text-success">🎉 Thanh toán thành công!</h2>
      ) : (
        <h2 className="text-danger">❌ Thanh toán thất bại hoặc đã hủy!</h2>
      )}
      <a href="/menu" className="btn btn-primary mt-3">Quay lại Menu</a>
    </div>
  );
}
