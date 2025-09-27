import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/checkout/:orderId" element={<CheckoutPage />} />
    </Routes>
  );
}

export default App;
