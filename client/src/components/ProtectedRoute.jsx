import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

function LoadingSkeleton() {
  return (
    <div className="shell">
          <div className="sidebar" style={{ background: "var(--sf-sidebar)" }}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><img src="/logo.svg" alt="LibraryLMS" className="sidebar-logo-img" /></div>
          <span>LibraryLMS</span>
        </div>
        <div className="nav-section">
          {[1, 2, 3].map((i) => (
            <div key={i} className="nav-item" style={{ opacity: 0.2 }}>&nbsp;</div>
          ))}
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <span className="topbar-title" style={{ opacity: 0.3 }}>Loading...</span>
        </div>
        <div className="content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "3px solid #2a2a2a",
                borderTopColor: "#1ed760",
                margin: "0 auto 16px",
              }}
            />
            <div style={{ fontSize: "13px", color: "var(--sf-text-2)" }}>Loading your session...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSkeleton />;
  if (!user || (roles && !roles.includes(user.role))) return <Navigate to="/login" replace />;

  return children;
}
