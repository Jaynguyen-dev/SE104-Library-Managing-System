import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatDate } from "../utils/format";

const STATUS_STYLES = {
  waiting: "badge-gray",
  notified: "badge-blue",
  expired: "badge-red",
  completed: "badge-green",
  cancelled: "badge-gray",
};

const STATUS_LABELS = {
  waiting: "Waiting",
  notified: "Available",
  expired: "Expired",
  completed: "Completed",
  cancelled: "Cancelled",
};

function ExpirationCountdown({ expiresAt }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) return setDisplay("Expired");
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDisplay(`${hours}h ${minutes}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!display) return null;
  return <span style={{ fontSize: "12px", color: "var(--sf-red)", fontWeight: 600 }}>{display} left</span>;
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    api.get("/api/reservations/my").then(({ data }) => {
      setReservations(data.data?.reservations || []);
      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load reservations");
      setLoading(false);
    });
  }, []);

  const fetchReservations = () => {
    api.get("/api/reservations/my").then(({ data }) => {
      setReservations(data.data?.reservations || []);
    }).catch(() => {
      toast.error("Failed to load reservations");
    });
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this reservation?")) return;
    setCancellingId(id);
    try {
      await api.delete(`/api/reservations/${id}`);
      toast.success("Reservation cancelled");
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  };

  const activeReservations = reservations.filter((r) => ["waiting", "notified"].includes(r.status));
  const pastReservations = reservations.filter((r) => ["expired", "completed", "cancelled"].includes(r.status));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="section-header">
        <span className="section-title">My Reservations</span>
      </div>

      {loading ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <div className="skeleton" style={{ height: 20, width: "30%", margin: "0 auto" }}></div>
        </div>
      ) : reservations.length === 0 ? (
        <motion.div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--sf-text-2)" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <i className="ti ti-clock" style={{ fontSize: "40px", display: "block", marginBottom: "12px", color: "var(--sf-text-2)" }}></i>
          <div style={{ marginBottom: "12px" }}>No reservations yet.</div>
          <Link to="/books" className="btn btn-primary">
            <i className="ti ti-books"></i> Browse Books
          </Link>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {activeReservations.length > 0 && (
            <motion.div style={{ marginBottom: "24px" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "var(--sf-text-2)" }}>
                Active Reservations ({activeReservations.length})
              </h3>
              <div className="card">
                <table>
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Reserved</th>
                      <th>Queue</th>
                      <th>Status</th>
                      <th>Expires</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReservations.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>
                          <Link to={`/books`} style={{ color: "inherit", textDecoration: "none" }}>
                            {r.book?.title || "-"}
                          </Link>
                        </td>
                        <td style={{ color: "var(--sf-text-2)" }}>{formatDate(r.reserved_at)}</td>
                        <td>
                          {r.status === "waiting" ? (
                            <span className="badge badge-gray">#{r.queue_position || "?"}</span>
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--sf-text-2)" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_STYLES[r.status] || "badge-gray"}`}>
                            {STATUS_LABELS[r.status] || r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === "notified" ? (
                            <ExpirationCountdown expiresAt={r.expires_at} />
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--sf-text-2)" }}>—</span>
                          )}
                        </td>
                        <td>
                          {["waiting", "notified"].includes(r.status) && (
                            <motion.button className="btn btn-ghost btn-sm" onClick={() => handleCancel(r.id)} disabled={cancellingId === r.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                              {cancellingId === r.id ? (
                                <i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i>
                              ) : (
                                <i className="ti ti-x" style={{ marginRight: "2px" }}></i>
                              )}{cancellingId === r.id ? "" : "Cancel"}
                            </motion.button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {pastReservations.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "var(--sf-text-2)" }}>
                History ({pastReservations.length})
              </h3>
              <div className="card">
                <table>
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Reserved</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastReservations.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{r.book?.title || "-"}</td>
                        <td style={{ color: "var(--sf-text-2)" }}>{formatDate(r.reserved_at)}</td>
                        <td>
                          <span className={`badge ${STATUS_STYLES[r.status] || "badge-gray"}`}>
                            {STATUS_LABELS[r.status] || r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
