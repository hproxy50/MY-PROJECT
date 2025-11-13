import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/AUTH/login";
import Register from "./pages/AUTH/register";
import BranchSelectPage from "./pages/CUSTOMER/BranchSelectPage";
import CheckoutPage from "./pages/CUSTOMER/CheckoutPage";
import MenuCRUD from "./pages/STAFF/MenuCRUD";
import Unauthorized from "./pages/OTHER/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/ADMIN/AdminDashboard";
import StaffDashboard from "./pages/STAFF/StaffDashboard";
import Menu from "./pages/CUSTOMER/Menu";
import CategoryCRUD from "./pages/STAFF/CategoryCRUD";
import Cart from "./pages/CUSTOMER/Cart";
import Checkout from "./pages/CUSTOMER/Checkout";
import History from "./pages/CUSTOMER/History";
import PaymentResult from "./pages/CUSTOMER/PaymentResult"
import Rating from "./pages/CUSTOMER/Rating";

function App() {
  return (
    <Routes>
      {/* ALL USERS */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      {/* <Route path="/checkout" element={<Checkout />} /> */}
      <Route path="/history" element={<History />} />
      <Route path="/payment-success" element={<PaymentResult />} />
      <Route path="/payment-cancel" element={<PaymentResult />} />
      {/* CUSTOMER */}
      <Route path="/branches" element={<BranchSelectPage />} />
      <Route path="/menu/:branchId/:orderId" element={<Menu />} />
      <Route path="/cart/:orderId" element={<Cart />} />
      <Route path="/checkout/:orderId" element={<Checkout />} />
      <Route path="/rating/branch/:branch_id" element={<Rating />} />

      {/* STAFF */}
      <Route
        path="/staff/menu-crud"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <MenuCRUD />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/category-crud"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <CategoryCRUD />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/*"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
