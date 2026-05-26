import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import toast from "react-hot-toast";
import api from "../services/api";
import { getCoverSources } from "../utils/coverUtils";

export default function BorrowModal({ book, onClose, onBorrowed }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [coverIdx, setCoverIdx] = useState(0);
  const confirmRef = useRef(null);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const coverSources = getCoverSources(book);
  const coverSrc = coverSources[coverIdx];

  const handleCoverError = () => {
    setCoverIdx(prev => Math.min(prev + 1, coverSources.length - 1));
  };

  const handleCoverLoad = (e) => {
    const img = e.currentTarget;
    if (img.naturalWidth <= 2 && img.naturalHeight <= 2) {
      handleCoverError();
    }
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();
    if (overlayRef.current && modalRef.current) {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(modalRef.current, { opacity: 0, scale: 0.92, y: 20 });
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.25 });
      gsap.to(modalRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power3.out" });
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!book) return null;

  const handleBorrow = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/borrows/self", { book_id: book.id });
      toast.success(`"${book.title}" borrowed successfully`);
      onBorrowed(book.id);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to borrow book";
      setError(msg);
      if (msg.includes("not available")) {
        onBorrowed(book.id);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Borrow book"
      >
        <motion.div
          ref={modalRef}
          className="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "420px" }}
        >
          <div className="modal-header">
            <h3>
              <i className="ti ti-arrow-right-circle" style={{ marginRight: "8px", color: "var(--sf-accent)" }}></i>
              Borrow Book
            </h3>
            <motion.button className="icon-btn" onClick={onClose} aria-label="Close" whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
              <i className="ti ti-x"></i>
            </motion.button>
          </div>
          <div className="modal-body">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{ background: "var(--sf-red-bg)", color: "var(--sf-red)", fontSize: "13px", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" }}
              >{error}</motion.div>
            )}

            <div className="borrow-modal-book">
              <motion.img
                src={coverSrc}
                alt={book.title}
                className="borrow-modal-cover"
                onError={handleCoverError}
                onLoad={handleCoverLoad}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              />
              <div className="borrow-modal-info">
                <div className="borrow-modal-title">{book.title}</div>
                <div className="borrow-modal-author">{book.author}</div>
                {book.category && (
                  <span className="badge badge-blue" style={{ alignSelf: "flex-start", marginTop: "2px" }}>{book.category}</span>
                )}
              </div>
            </div>

            <div className="borrow-modal-details">
              <div className="form-row">
                <label className="form-label">Available Copies</label>
                <div className={`borrow-modal-stat ${book.available_quantity <= 0 ? "low" : "ok"}`}>
                  {book.available_quantity} / {book.total_quantity}
                </div>
              </div>
              <div className="form-row">
                <label className="form-label">Due Date</label>
                <div className="borrow-modal-stat" style={{ fontSize: "16px" }}>
                  {dueDate.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" })}
                  <span style={{ fontSize: "12px", color: "var(--sf-text-2)", marginLeft: "8px", fontWeight: 400 }}>(30 days)</span>
                </div>
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "var(--sf-bg-2)", borderRadius: "500px", fontSize: "13px", color: "var(--sf-text-2)", marginTop: "12px" }}>
              <i className="ti ti-info-circle" style={{ marginRight: "6px" }}></i>
              By confirming, you agree to return this book by the due date. Late returns incur a fine of 2,000 VND per day.
            </div>
          </div>
          <div className="modal-footer">
            <motion.button className="btn btn-ghost" onClick={onClose} disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              Cancel
            </motion.button>
            <motion.button
              ref={confirmRef}
              className="btn btn-primary"
              onClick={handleBorrow}
              disabled={submitting || book.available_quantity <= 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {submitting ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i>
                  Processing...
                </span>
              ) : book.available_quantity <= 0 ? "Unavailable" : "Confirm Borrow"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
