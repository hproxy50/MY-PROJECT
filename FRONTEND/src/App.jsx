import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/AUTH/login";
import Register from "./pages/AUTH/register";
import MenuPage from "./pages/CUSTOMER/MenuPage";
import CheckoutPage from "./pages/CUSTOMER/CheckoutPage";
import OrderQRPage from "./pages/CUSTOMER/OrderQRPage";
import MenuCRUD from "./pages/STAFF/MenuCRUD";
import Unauthorized from "./pages/OTHER/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/ADMIN/AdminDashboard";
import StaffIncomingOrders from "./pages/STAFF/StaffIncomingOrders";
import StaffPreparingOrders from "./pages/STAFF/StaffPreparingOrders";

function App() {
  return (
    <Routes>
      {/* ALL USERS */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* CUSTOMER */}
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/checkout/:orderId" element={<CheckoutPage />} />
      <Route path="/orders/:id/qr" element={<OrderQRPage />} />

      <Route path="/staff/orders/incoming" element={<StaffIncomingOrders />} />
      <Route path="/staff/orders/preparing" element={<StaffPreparingOrders />} />

      {/* STAFF */}
      <Route
        path="/staff/menu-crud"
        element={
          <ProtectedRoute allowedRoles={["STAFF"]}>
            <MenuCRUD />
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
