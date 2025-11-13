import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import "../../css/Rating.scss";
import API from "../../api/api.js";


const ReviewCard = ({ review }) => {
  const renderStars = (starCount) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={index < starCount ? "star-filled" : "star-empty"}
      />
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-user">
          <span className="user-name">{review.customer_name}</span>
          <span className="review-date">{formatDate(review.created_at)}</span>
        </div>
        <div className="review-stars">
          {renderStars(review.rating)}
        </div>
      </div>
      <p className="review-comment">{review.comment}</p>

      <div className="review-products">
        {review.products?.map((product, index) => (
          <div className="product-item" key={index}>
            <img src={`http://localhost:3000${product.img}`} alt={product.name} />
            <span className="product-name">{product.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Rating() {
  const { branch_id } = useParams();
  const navigate = useNavigate();

  const [branchName, setBranchName] = useState("Chi nhánh");
  const [summary, setSummary] = useState({ avg_rating: 0, total: 0 });
  const [reviews, setReviews] = useState([]);

  const [sortStar, setSortStar] = useState("all");
  const [sortTime, setSortTime] = useState("NEW");


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!branch_id) {
        setError("Branch code not found.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await API.get(`/ratings/branch/${branch_id}`);
        setBranchName(response.data.branchName);
        setSummary(response.data.summary);
        setReviews(response.data.ratings);
      } catch (err) {
        console.error("Error loading review:", err);
        setError("Unable to load review. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [branch_id]);

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];
    if (sortStar !== "all") {
      result = result.filter(r => r.rating === parseInt(sortStar));
    }

    if (sortTime === "OLD") {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      // result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [reviews, sortStar, sortTime]);

  if (loading) {
    return <div className="rating-page-status">Đang tải đánh giá...</div>;
  }

  if (error) {
    return <div className="rating-page-status error">{error}</div>;
  }

  return (
    <div className="rating-page">
      <button className="rating-page-back" onClick={() => navigate(-1)}>
        &larr; Come back
      </button>
      
      <header className="rating-header">
        <div className="store-info">
          <h1>Branch Reviews</h1>
          <h2>{branchName}</h2>
        </div>
        <div className="average-rating">
          <div className="average-score">
            {summary.avg_rating || 0} <FaStar className="star-icon" />
          </div>
          <span>{summary.total || 0} Reviews</span>
        </div>
      </header>

      <main className="rating-content">
        <div className="filter-bar">
          <h3>Filter reviews</h3>
          <div className="filter-controls">
            <select name="star" value={sortStar} onChange={(e) => setSortStar(e.target.value)}>
              <option value="all">All stars</option>
              <option value="5">5 ★</option>
              <option value="4">4 ★</option>
              <option value="3">3 ★</option>
              <option value="2">2 ★</option>
              <option value="1">1 ★</option>
            </select>
            <select name="time" value={sortTime} onChange={(e) => setSortTime(e.target.value)}>
              <option value="NEW">Latest</option>
              <option value="OLD">Oldest</option>
            </select>
          </div>
        </div>
        
        <div className="review-list">
          {filteredAndSortedReviews.length > 0 ? (
            filteredAndSortedReviews.map((review) => (
              <ReviewCard key={review.rating_id} review={review} />
            ))
          ) : (
            <p className="no-reviews">There are no reviews yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}