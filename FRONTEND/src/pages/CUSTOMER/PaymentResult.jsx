import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../api/api";
import { TextAlignCenter } from "lucide-react";

export default function PaymentResult() {
  const navigate = useNavigate();
  const location = useLocation();

// payment-success page
useEffect(() => {
  // chỉ show loading hoặc redirect sang history
  navigate("/history");
}, []);


  return <p style={TextAlignCenter}>Processing payment result...</p>;
}
