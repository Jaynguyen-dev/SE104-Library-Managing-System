import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import toast from "react-hot-toast";
import api from "../services/api";
import { getCoverSources } from "../utils/coverUtils";

export default function ReserveModal({ book, onClose, onReserved }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [coverIdx, setCoverIdx] = useState(0);
  const cancelRef = useRef(null);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

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
    cancelRef.current?.focus();
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

  const handleReserve = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/api/reservations", { book_id: book.id });
      if (data.success) {
        toast.success(`"${book.title}" reserved successfully`);
        onReserved(book.id, data.data.reservation);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reserve book";
      setError(msg);
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
        aria-label="Reserve book"
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
              <i className="ti ti-clock" style={{ marginRight: "8px", color: "var(--sf-amber)" }}></i>
              Reserve Book
            </h3>
            <motion.button className="icon-btn" onClick={onClose} aria-label="Close" whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
              <i className="ti ti-x"></i>
            </motion.button>
          </div>
          <div className="modal-body">
            <p style={{ margin: "0 0 16px", fontSize: "14px", color: "var(--sf-text-2)" }}>
              This book is currently unavailable. Do you want to reserve it? You will be notified when it becomes available again.
            </p>

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
                <label className="form-label">Availability</label>
                <div className="borrow-modal-stat" style={{ color: "var(--sf-red)" }}>
                  {book.available_quantity} / {book.total_quantity} — Unavailable
                </div>
              </div>
            </div>

            <div style={{ padding: "10px 14px", background: "var(--sf-bg-2)", borderRadius: "8px", fontSize: "13px", color: "var(--sf-text-2)", marginTop: "8px" }}>
              <i className="ti ti-info-circle" style={{ marginRight: "6px" }}></i>
              Once a copy becomes available, you will receive a notification. You will have 48 hours to borrow it before the reservation expires.
            </div>
          </div>
          <div className="modal-footer">
            <motion.button ref={cancelRef} className="btn btn-ghost" onClick={onClose} disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              Cancel
            </motion.button>
            <motion.button
              className="btn btn-primary"
              onClick={handleReserve}
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {submitting ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i>
                  Reserving...
                </span>
              ) : "Confirm Reservation"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
