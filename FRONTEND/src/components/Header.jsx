// src/components/Header.jsx
import React from "react";
import { ShoppingCart, Search, Phone } from "lucide-react";
import "../css/Header.scss";
import LogoImage from "../assets/image/pizza.png";

const Header = () => {
  return (
    <header className="header">
      <div className="header-Top">
        <div className="header-Top-Left">
          <img
            src={LogoImage}
            alt="Logo"
            className="header-logo"
          />
          <p>Pizza Restaurant</p>
        </div>
        <div className="header-Top-Middle">
          <input type="text" placeholder="Search" className="searchBar" />
          <button className="searchButton">
            <Search
              className="searchIcon"
              alt="search"
              color="black"
              size={20}
            />
          </button>
        </div>
        <div className="header-Top-Right">
          <p>Service</p>
          <ShoppingCart alt="shoppingCart" color="black" size={20} />
        </div>
      </div>
      <div className="header-Bottom">
        <div className="header-Bottom-Left">
          <ul>
            <li>About us</li>
            <li>Menu</li>
            <li>Contact</li>
          </ul>
        </div>
        <div className="header-Bottom-Right">
          <Phone
            className="PhoneIcon"
            alt="Phone"
            color="black"
            size={20}
          ></Phone>
          <p>1234567890</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
