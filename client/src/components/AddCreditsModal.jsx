import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatCurrency } from "../utils/format";

const PAYMENT_METHODS = [
  { id: "visa", label: "Visa", icon: "ti ti-credit-card" },
  { id: "mastercard", label: "Mastercard", icon: "ti ti-credit-card" },
  { id: "momo", label: "MoMo", icon: "ti ti-device-mobile" },
  { id: "banking", label: "Online Banking", icon: "ti ti-building-bank" },
];

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

export default function AddCreditsModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [method, setMethod] = useState("momo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
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

  const finalAmount = useCustom ? (parseInt(customAmount, 10) || 0) : amount;

  const handleSubmit = async () => {
    if (finalAmount < 10000) {
      setError("Minimum amount is 10,000 VND");
      return;
    }
    if (finalAmount > 100000000) {
      setError("Maximum amount is 100,000,000 VND");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/wallet/add", {
        amount: finalAmount,
        payment_method: method,
      });
      toast.success(`Added ${formatCurrency(finalAmount)} to your wallet`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add credits");
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
        aria-label="Add credits"
      >
        <motion.div
          ref={modalRef}
          className="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "480px" }}
        >
          <div className="modal-header">
            <h3>
              <i className="ti ti-wallet" style={{ marginRight: "8px", color: "var(--sf-green)" }}></i>
              Add Credits
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

            <div className="form-row">
              <label className="form-label">Select Amount</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {PRESET_AMOUNTS.map((a) => (
                  <motion.button
                    key={a}
                    type="button"
                    className={`btn ${!useCustom && amount === a ? "btn-primary" : "btn-ghost"}`}
                    style={{ fontSize: "13px", padding: "6px 14px" }}
                    onClick={() => { setAmount(a); setUseCustom(false); }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {formatCurrency(a)}
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  className={`btn ${useCustom ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "13px", padding: "6px 14px" }}
                  onClick={() => setUseCustom(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Custom
                </motion.button>
              </div>
              {useCustom && (
                <motion.input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount (VND)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="10000"
                  style={{ marginTop: "4px" }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                />
              )}
            </div>

            <div className="form-row">
              <label className="form-label">Payment Method</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {PAYMENT_METHODS.map((pm) => (
                  <motion.button
                    key={pm.id}
                    type="button"
                    className={`btn ${method === pm.id ? "btn-primary" : "btn-ghost"}`}
                    style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", padding: "10px", fontSize: "13px" }}
                    onClick={() => setMethod(pm.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <i className={pm.icon}></i>
                    {pm.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div
              style={{ marginTop: "16px", padding: "12px 16px", background: "var(--sf-bg-2)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              key={finalAmount}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Total</span>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--sf-accent)" }}>
                {formatCurrency(finalAmount)}
              </span>
            </motion.div>

            <div style={{ marginTop: "12px", padding: "10px 14px", background: "var(--sf-amber-bg)", borderRadius: "500px", fontSize: "12px", color: "var(--sf-amber)" }}>
              <i className="ti ti-info-circle" style={{ marginRight: "6px" }}></i>
              Demo mode: Payment is simulated. No real transaction will be processed.
            </div>
          </div>
          <div className="modal-footer">
            <motion.button className="btn btn-ghost" onClick={onClose} disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              Cancel
            </motion.button>
            <motion.button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || finalAmount < 10000} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {submitting ? "Processing..." : `Add ${formatCurrency(finalAmount)}`}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
