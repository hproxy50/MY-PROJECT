
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";
import BranchSelect from "./pages/branchSelect.jsx";
import Menu from "./pages/menu.jsx";
import Cart from "./pages/cart.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/branches" element={<BranchSelect />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
