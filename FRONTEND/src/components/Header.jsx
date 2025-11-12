// src/components/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Phone } from "lucide-react";
import "../css/Header.scss";
import LogoImage from "../assets/image/pizza.png";

const Header = ({ orderId, cartCount, allMenuItems = [], onSelectItem }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Lọc danh sách món ăn
  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      return;
    }

    const filtered = allMenuItems.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 6)); // chỉ hiển thị tối đa 6 kết quả
  }, [query, allMenuItems]);

  // Ẩn dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header-Top">
        <div className="header-Top-Left">
          <img
            src={LogoImage}
            alt="Logo"
            className="header-logo"
            onClick={() => navigate("/")}
          />
          <p>Pizza Restaurant</p>
        </div>

        {/* Search box */}
        <div className="header-Top-Middle" ref={searchRef}>
          <input
            type="text"
            placeholder="Search dishes..."
            className="searchBar"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
          />
          <button className="searchButton">
            <Search className="searchIcon" alt="search" color="black" size={20} />
          </button>
          {showDropdown && suggestions.length > 0 && (
            <ul className="search-dropdown">
              {suggestions.map((item) => (
                <li
                  key={item.item_id}
                  onClick={() => {
                    setQuery("");
                    setShowDropdown(false);
                    onSelectItem(item.item_id);
                  }}
                >
                  <img
                    src={`http://localhost:3000${item.image}`}
                    alt={item.name}
                    className="search-dropdown-img"
                  />
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cart */}
        <div className="header-Top-Right">
          <p>Service</p>
          <button
            className="btn btn-outline-primary position-relative"
            onClick={() => navigate(`/cart/${orderId}`)}
            disabled={!orderId}
          >
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
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
            <li>About us</li>
            <li>Menu</li>
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
