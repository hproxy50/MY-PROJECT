// src/components/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Phone, Star } from "lucide-react";
import API from "../api/api";
import "../css/Header.scss";
import LogoImage from "../assets/image/pizza.png";

const Header = ({
  orderId,
  cartCount,
  allMenuItems = [],
  onSelectItem,
  branchId,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const [avgRating, setAvgRating] = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);

  //filter
  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      return;
    }

    const filtered = allMenuItems.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 6)); //6 search
  }, [query, allMenuItems]);

  //hide drop down
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (branchId) {
      const fetchAvgRating = async () => {
        try {
          const res = await API.get(`/ratings/branch/${branchId}`);
          if (res.data && res.data.summary) {
            setAvgRating(res.data.summary.avg_rating);
            setTotalRatings(res.data.summary.total);
          }
        } catch (err) {
          console.error("Failed to fetch avg rating:", err);
          setAvgRating(0);
        }
      };

      fetchAvgRating();
    }
  }, [branchId]);

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
                navigate(`/branches`);
              } else {
                navigate(-1);
              }
            }}
          />
          <p>Pizza Restaurant</p>
        </div>
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
            <Search
              className="searchIcon"
              alt="search"
              color="black"
              size={20}
            />
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
        <div className="header-Top-Right">
          <p>Cart</p>
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
            <li
              onClick={() => {
                const confirmed = window.confirm("Are you sure to log out?");
                if (confirmed) {
                  localStorage.removeItem("token");
                  navigate("/");
                }
              }}
            >
              Log out
            </li>
            <li>Menu</li>
            <li onClick={() => navigate("/history")}>Order status</li>
            <li
              className={branchId ? "clickable" : ""}
              onClick={() => {
                if (branchId) {
                  navigate(`/rating/branch/${branchId}`);
                }
              }}
              title={branchId ? `${totalRatings} Ratings` : "Ratings"}
            >
              Rating:
              {avgRating !== null ? (
                <>
                  <strong style={{ color: "#fadb14", margin: "0 4px" }}>
                    {avgRating}
                  </strong>
                  <Star size={16} fill="#fadb14" color="#fadb14" />
                </>
              ) : (
                "..."
              )}
            </li>
          </ul>
        </div>
        <div className="header-Bottom-Right">
          <Phone className="PhoneIcon" alt="Phone" color="black" size={20} />
          <p>0584299322</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
