import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/AUTH/login";
import Register from "./pages/AUTH/register";
import MenuPage from "./pages/CUSTOMER/MenuPage";
import BranchSelectPage from "./pages/CUSTOMER/BranchSelectPage";
import CheckoutPage from "./pages/CUSTOMER/CheckoutPage";
import MenuCRUD from "./pages/STAFF/MenuCRUD";
import Unauthorized from "./pages/OTHER/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/ADMIN/AdminDashboard";
import StaffIncomingOrders from "./pages/STAFF/StaffIncomingOrders";
import StaffPreparingOrders from "./pages/STAFF/StaffPreparingOrders";
import CartPage from "./pages/CUSTOMER/CartPage";

function App() {
  return (
    <Routes>
      {/* ALL USERS */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* CUSTOMER */}
      <Route path="/branches" element={<BranchSelectPage />} />
      <Route path="/menu/:branchId/:orderId" element={<MenuPage />} />
      <Route path="/cart/:orderId" element={<CartPage />}  />
      <Route path="/checkout/:orderId" element={<CheckoutPage />} />

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
        path="/staff/orders/incoming"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <StaffIncomingOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/orders/preparing"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <StaffPreparingOrders />
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
