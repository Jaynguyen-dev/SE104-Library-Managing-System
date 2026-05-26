import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getCoverSources, DEFAULT_COVER } from "../utils/coverUtils";

function CoverImage({ book }) {
  const [loaded, setLoaded] = useState(false);
  const [fallbackIdx, setFallbackIdx] = useState(0);

  const coverSources = getCoverSources(book);
  const currentSrc = coverSources[fallbackIdx];
  const isDefault = currentSrc === DEFAULT_COVER;

  const advanceFallback = useCallback(() => {
    setFallbackIdx(prev => Math.min(prev + 1, coverSources.length - 1));
  }, [coverSources.length]);

  const handleError = useCallback(() => {
    advanceFallback();
  }, [advanceFallback]);

  const handleLoad = useCallback((e) => {
    const img = e.currentTarget;
    if (img.naturalWidth <= 2 && img.naturalHeight <= 2) {
      advanceFallback();
      return;
    }
    setLoaded(true);
  }, [advanceFallback]);

  return (
    <div className="book-card-cover-wrap" style={{ position: "relative", overflow: "hidden" }}>
      {!loaded && (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, #1e1e3a 25%, #1a1a30 50%, #141428 75%)",
            backgroundSize: "200% 200%",
            animation: "skeleton-pulse 1.5s ease-in-out infinite",
          }}
        />
      )}
      <img
        src={currentSrc}
        alt={`Cover of ${book.title}`}
        className="book-card-cover"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        style={{
          width: "100%", height: "100%",
          objectFit: isDefault ? "contain" : "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.35s ease-in-out",
        }}
      />
    </div>
  );
}

export default function BookCard({ book, isStaff, onDelete, deleting, onBorrow, onReserve, userReservation }) {
  if (!book || !book.id) return null;

  const isUnavailable = book.available_quantity === 0;

  const availabilityLabel = `${book.available_quantity}/${book.total_quantity}`;
  const availabilityClass =
    book.available_quantity === 0 ? "badge-red"
    : book.available_quantity < book.total_quantity ? "badge-amber"
    : "badge-green";

  const handleCardClick = () => {
    if (isUnavailable && onReserve) {
      onReserve(book);
    } else if (!isUnavailable && onBorrow) {
      onBorrow(book);
    }
  };

  const cardContent = (
    <>
      <CoverImage book={book} />
      <div className="book-card-body">
        <div className="book-card-title" title={book.title}>
          {book.title}
        </div>
        <div className="book-card-author" title={book.author}>
          {book.author}
        </div>
        <div className="book-card-meta">
          <span className={`badge ${book.category ? "badge-blue" : "badge-gray"}`}>
            <i className="ti ti-tag" style={{ fontSize: "10px" }}></i>
            {book.category || "Uncategorized"}
          </span>
          <span className={`badge ${availabilityClass}`} title={`${book.available_quantity} of ${book.total_quantity} available`}>
            <i className={`ti ti-${book.available_quantity > 0 ? "check" : "x"}`} style={{ fontSize: "10px" }}></i>
            {availabilityLabel}
          </span>
          {isStaff && (
            <div className="book-card-actions" onClick={(e) => e.stopPropagation()}>
              <Link to={`/books/${book.id}/edit`} className="icon-btn" title="Edit" onClick={(e) => e.stopPropagation()}>
                <i className="ti ti-edit"></i>
              </Link>
              <motion.button
                className="icon-btn"
                title={deleting ? "Deleting..." : "Delete"}
                disabled={deleting}
                whileHover={deleting ? undefined : { color: "#DC2626", borderColor: "#DC2626" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!deleting) onDelete(book.id);
                }}
              >
                <i className={`ti ${deleting ? "ti-loader" : "ti-trash"}`} style={deleting ? { animation: "spin 1s linear infinite" } : undefined}></i>
              </motion.button>
            </div>
          )}
          {!isStaff && isUnavailable && !userReservation && onReserve && (
            <motion.button
              className="btn btn-sm btn-ghost"
              onClick={(e) => {
                e.stopPropagation();
                onReserve(book);
              }}
              style={{ width: "100%", marginTop: "6px", fontSize: "12px" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <i className="ti ti-clock" aria-hidden="true"></i> Reserve
            </motion.button>
          )}
          {!isStaff && isUnavailable && userReservation?.status === "waiting" && (
            <span className="badge badge-gray" style={{ width: "100%", marginTop: "6px", textAlign: "center" }}>
              <i className="ti ti-clock"></i> In Queue (#{userReservation.queue_position})
            </span>
          )}
          {!isStaff && isUnavailable && userReservation?.status === "notified" && (
            <span className="badge badge-blue" style={{ width: "100%", marginTop: "6px", textAlign: "center" }}>
              <i className="ti ti-bell"></i> Available — Visit Library
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      className="book-card"
      style={{ cursor: onBorrow || onReserve ? "pointer" : "default" }}
      whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={isStaff ? undefined : handleCardClick}
    >
      {isStaff ? (
        <Link
          to={`/books/${book.id}/edit`}
          style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}
        >
          {cardContent}
        </Link>
      ) : (
        <div style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}>
          {cardContent}
        </div>
      )}
    </motion.div>
  );
}
