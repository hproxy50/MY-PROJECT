import ProductImage from "../../assets/image/product.jpg";
import "../../css/History.scss";

export default function History() {
  return (
    <div className="HistoryBody">
      <div className="History-top">
        {/* <h1>Purchased orders</h1> */}
        <div className="History-top-sort">
          <ul>
          <li>
            <div className="History-top-sort-all">
            All
            </div>
          </li>
          <li>
            <div className="History-top-sort-pending">
            Pending
            </div>
          </li>
          <li>
            <div className="History-top-sort-preparing">
            Preparing
            </div>
          </li>
          <li>
            <div className="History-top-sort-delivery">
            Delivery
            </div>
          </li>
          <li>
            <div className="History-top-sort-complete">
            Complete
            </div>
          </li>
          <li>
            <div  className="History-top-sort-cancel">
            Cancel
            </div>
          </li>
          </ul>
        </div>
      </div>
      <div className="History-top2">
        <div className="History-top2-search"> 
          <input type="text" placeholder="Search by order name"/>
        </div>
      </div>
      <div className="History-mid">
        <div className="History-product">
          <div className="History-product-status">
            <p>DELIVERY</p>
          </div>
          <div className="History-product-productInfo">
            <div className="History-product-productInfo-image">
              <img src={ProductImage} alt="ProductImage" />
            </div>
            <div className="History-product-productInfo-name">
              <div className="History-product-productInfo-name-productName">
                <p>Product Name</p>
              </div>
              <div className="History-product-productInfo-name-option">
                <p>Product option</p>
              </div>
              <div className="History-product-productInfo-name-price">
                <div className="History-product-productInfo-name-price-left">
                    <p>x1</p>
                </div>
                <div className="History-product-productInfo-name-price-right">
                    <p>240.000</p>
                </div>
              </div>
            </div>
          </div>
          <div className="History-product-productInfo">
            <div className="History-product-productInfo-image">
              <img src={ProductImage} alt="ProductImage" />
            </div>
            <div className="History-product-productInfo-name">
              <div className="History-product-productInfo-name-productName">
                <p>Product Name</p>
              </div>
              <div className="History-product-productInfo-name-option">
                <p>Product option</p>
              </div>
              <div className="History-product-productInfo-name-price">
                <div className="History-product-productInfo-name-price-left">
                    <p>x1</p>
                </div>
                <div className="History-product-productInfo-name-price-right">
                    <p>240.000</p>
                </div>
              </div>
            </div>
          </div>
          <div className="History-product-totalPrice">
            <p>Total price </p>
            <p>(2 products)</p>
            <p>: 580.000 d</p>
          </div>
          <div className="History-product-button">
            <button className="History-product-button-again" >Buy again</button>
            <button className="History-product-button-rating">Rating product</button>
          </div>
        </div>
        <div className="History-product">
          <div className="History-product-status">
            <p>DELIVERY</p>
          </div>
          <div className="History-product-productInfo">
            <div className="History-product-productInfo-image">
              <img src={ProductImage} alt="ProductImage" />
            </div>
            <div className="History-product-productInfo-name">
              <div className="History-product-productInfo-name-productName">
                <p>Product Name</p>
              </div>
              <div className="History-product-productInfo-name-option">
                <p>Product option</p>
              </div>
              <div className="History-product-productInfo-name-price">
                <div className="History-product-productInfo-name-price-left">
                    <p>x1</p>
                </div>
                <div className="History-product-productInfo-name-price-right">
                    <p>240.000</p>
                </div>
              </div>
            </div>
          </div>
          <div className="History-product-productInfo">
            <div className="History-product-productInfo-image">
              <img src={ProductImage} alt="ProductImage" />
            </div>
            <div className="History-product-productInfo-name">
              <div className="History-product-productInfo-name-productName">
                <p>Product Name</p>
              </div>
              <div className="History-product-productInfo-name-option">
                <p>Product option</p>
              </div>
              <div className="History-product-productInfo-name-price">
                <div className="History-product-productInfo-name-price-left">
                    <p>x1</p>
                </div>
                <div className="History-product-productInfo-name-price-right">
                    <p>240.000</p>
                </div>
              </div>
            </div>
          </div>
          <div className="History-product-totalPrice">
            <p>Total price </p>
            <p>(2 products)</p>
            <p>: 580.000 d</p>
          </div>
          <div className="History-product-button">
            <button className="History-product-button-again" >Buy again</button>
            <button className="History-product-button-rating">Rating product</button>
          </div>
        </div>
        <div className="History-product">
          <div className="History-product-status">
            <p>DELIVERY</p>
          </div>
          <div className="History-product-productInfo">
            <div className="History-product-productInfo-image">
              <img src={ProductImage} alt="ProductImage" />
            </div>
            <div className="History-product-productInfo-name">
              <div className="History-product-productInfo-name-productName">
                <p>Product Name</p>
              </div>
              <div className="History-product-productInfo-name-option">
                <p>Product option</p>
              </div>
              <div className="History-product-productInfo-name-price">
                <div className="History-product-productInfo-name-price-left">
                    <p>x1</p>
                </div>
                <div className="History-product-productInfo-name-price-right">
                    <p>240.000</p>
                </div>
              </div>
            </div>
          </div>
          <div className="History-product-productInfo">
            <div className="History-product-productInfo-image">
              <img src={ProductImage} alt="ProductImage" />
            </div>
            <div className="History-product-productInfo-name">
              <div className="History-product-productInfo-name-productName">
                <p>Product Name</p>
              </div>
              <div className="History-product-productInfo-name-option">
                <p>Product option</p>
              </div>
              <div className="History-product-productInfo-name-price">
                <div className="History-product-productInfo-name-price-left">
                    <p>x1</p>
                </div>
                <div className="History-product-productInfo-name-price-right">
                    <p>240.000</p>
                </div>
              </div>
            </div>
          </div>
          <div className="History-product-totalPrice">
            <p>Total price </p>
            <p>(2 products)</p>
            <p>: 580.000 d</p>
          </div>
          <div className="History-product-button">
            <button className="History-product-button-again" >Buy again</button>
            <button className="History-product-button-rating">Rating product</button>
          </div>
        </div>
      </div>
    </div>
  );
}
