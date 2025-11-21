import { Routes, Route, Navigate } from "react-router-dom";
//import Login from "./pages/AUTH/login";
//import Register from "./pages/AUTH/register";
import BranchSelectPage from "./pages/CUSTOMER/BranchSelectPage";
import Unauthorized from "./pages/OTHER/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/ADMIN/AdminDashboard";
import StaffDashboard from "./pages/STAFF/StaffDashboard";
import Menu from "./pages/CUSTOMER/Menu";
import Cart from "./pages/CUSTOMER/Cart";
import Checkout from "./pages/CUSTOMER/Checkout";
import History from "./pages/CUSTOMER/History";
import PaymentResult from "./pages/CUSTOMER/PaymentResult";
import Rating from "./pages/CUSTOMER/Rating";
import Chef from "./pages/CHEF/ChefPage.jsx";
import Receptionist from "./pages/Receptionist/receptionist.jsx"
import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import LoginTest from "./pages/AUTH/loginAuth.jsx"
import Branch from "./pages/CUSTOMER/Branch.jsx";
import Register from "./pages/AUTH/registerAuth.jsx";

function App() {
  return (
    <Routes>
      {/* ALL USERS */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginTest />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/branch-test" element={<Branch />} />

      {/* CUSTOMER */}
      <Route path="/branches" element={<BranchSelectPage />} />
      <Route path="/menu/:branchId/:orderId" element={<Menu />} />
      <Route path="/cart/:orderId" element={<Cart />} />
      <Route path="/checkout/:orderId" element={<Checkout />} />
      <Route path="/rating/branch/:branch_id" element={<Rating />} />
      <Route path="/history" element={<History />} />
      <Route path="/payment-success" element={<PaymentResult />} />
      <Route path="/payment-cancel" element={<PaymentResult />} />



      <Route
        path="/staff/*"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chef"
        element={
          <ProtectedRoute allowedRoles={["CHEF"]}>
            <Chef />
          </ProtectedRoute>
        }
      />

      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
            <Receptionist />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
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
