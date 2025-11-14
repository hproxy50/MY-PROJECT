// src/components/Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Phone } from "lucide-react";
import "../css/Header.scss";
import LogoImage from "../assets/image/pizza.png";

const Header = ({ orderId, cartCount, branchId }) => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-Top">
        <div className="header-Top-Left">
          <img
            src={LogoImage}
            alt="Logo"
            className="header-logo"
            onClick={() => {
              if (branchId && orderId) {
                navigate(`/menu/${branchId}/${orderId}`);
              } else {
                navigate("/branches");
              }
            }}
          />
          <p>Pizza Restaurant</p>
        </div>

        <div className="header-Top-Right">
          <p>Cart</p>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`/cart/${orderId}`)}
            disabled={!orderId}
          >
            {cartCount > 0 && (
              <span className="position-absolute top-50 start-90 translate-middle badge rounded-pill bg-danger">
                {cartCount}
              </span>
            )}
            <ShoppingCart alt="shoppingCart" color="white" size={20} />
          </button>
        </div>
      </div>

      <div className="header-Bottom">
        <div className="header-Bottom-Left">
          <ul>
            <li onClick={() => navigate("/")}>Log out</li>
            <li
              onClick={() => {
                if (branchId && orderId) {
                  navigate(`/menu/${branchId}/${orderId}`);
                } else {
                  navigate(-1)
                }
              }}
            >
              Menu
            </li>
            <li onClick={() => navigate("/history")}>Order status</li>
          </ul>
        </div>
        <div className="header-Bottom-Right">
          <Phone className="PhoneIcon" alt="Phone" color="black" size={20} />
          <p>1234567890</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
