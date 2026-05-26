import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import toast from "react-hot-toast";
import api from "../services/api";
import { focusInput, iconFeedback } from "../utils/gsapAnimations";

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const inputRefs = useRef([]);
  const iconRef = useRef(null);

  useEffect(() => {
    if (pageRef.current) {
      gsap.set(pageRef.current, { opacity: 0 });
      gsap.to(pageRef.current, { opacity: 1, duration: 0.4 });
    }
  }, []);

  useEffect(() => {
    inputRefs.current.forEach((el) => { if (el) focusInput(el); });
    if (iconRef.current) iconFeedback(iconRef.current);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/register", form);
      toast.success("Registration successful! Please sign in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="login-wrap" style={{ position: "relative", overflow: "hidden" }}>
      {/* Parallax background layers (pointer-events: none so they don't block form interaction) */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none",
        background: "radial-gradient(circle at 80% 30%, var(--sf-purple) 0%, transparent 50%), radial-gradient(circle at 20% 70%, var(--sf-accent) 0%, transparent 50%)",
        willChange: "transform",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(circle at 30% 0%, rgba(83,157,245,0.06) 0%, transparent 60%)",
        willChange: "transform",
      }} />
      <div style={{
        position: "absolute", right: "12%", top: "20%", width: 4, height: 4, borderRadius: "50%",
        background: "var(--sf-purple)", opacity: 0.1, pointerEvents: "none",
        boxShadow: "0 0 20px var(--sf-purple)",
      }} />
      <div style={{
        position: "absolute", left: "18%", bottom: "25%", width: 3, height: 3, borderRadius: "50%",
        background: "var(--sf-accent)", opacity: 0.12, pointerEvents: "none",
      }} />

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "power2.out", delay: 0.1 }}
      >
        <motion.div
          ref={iconRef}
          className="login-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          style={{ cursor: "default" }}
        >
          <i className="ti ti-user-plus" aria-hidden="true"></i>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="login-title">Create Account</div>
          <div className="login-sub">Create a new account</div>
        </motion.div>
        <form onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{
                background: "var(--sf-red-bg)", color: "var(--sf-red)", fontSize: "13px",
                padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", textAlign: "left",
              }}
            >{error}</motion.div>
          )}
          <div className="form-row" style={{ textAlign: "left" }}>
            <label className="form-label">Full Name</label>
            <input ref={(el) => { if (el) inputRefs.current[0] = el; }} className="form-input" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Nguyen Van A" required />
          </div>
          <div className="form-row" style={{ textAlign: "left" }}>
            <label className="form-label">Email address</label>
            <input ref={(el) => { if (el) inputRefs.current[1] = el; }} className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="form-row" style={{ textAlign: "left" }}>
            <label className="form-label">Password</label>
            <input ref={(el) => { if (el) inputRefs.current[2] = el; }} className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "14px", borderRadius: "10px", marginTop: "4px" }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? "Registering…" : "Register"}
          </motion.button>
        </form>
        <p style={{ fontSize: "12px", color: "var(--sf-text-2)", marginTop: "16px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--sf-accent)", textDecoration: "none", fontWeight: 500 }}>Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
