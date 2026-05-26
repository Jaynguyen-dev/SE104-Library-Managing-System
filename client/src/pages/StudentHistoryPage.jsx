import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatDate, formatCurrency } from "../utils/format";

function statusBadge(status, isOverdue, dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const effective = status === "active" && now > due ? "overdue" : status;
  const cls = effective === "overdue" ? "badge-red" : effective === "active" ? "badge-amber" : effective === "return_pending" ? "badge-blue" : "badge-green";
  const label = effective === "return_pending" ? "Pending Return" : effective.charAt(0).toUpperCase() + effective.slice(1);
  const icon = effective === "overdue" ? "ti ti-alert-triangle" : effective === "active" ? "ti ti-book" : effective === "return_pending" ? "ti ti-clock" : "ti ti-check";
  return <span className={`badge ${cls}`}><i className={icon} style={{ fontSize: "10px" }}></i>{label}</span>;
}

function ReturnModal({ onClose, onConfirm, loading }) {
  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div
          className="confirm-modal" onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="confirm-modal-header">
            <h3>Return Book</h3>
            <motion.button className="icon-btn" onClick={onClose} whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
              <i className="ti ti-x"></i>
            </motion.button>
          </div>
          <div className="confirm-modal-body">
            <p>Are you sure you want to request a return for this book?</p>
            <p style={{ fontSize: "13px", color: "var(--sf-text-2)" }}>
              Once submitted, please bring the book to the librarian to complete the return process.
            </p>
          </div>
          <div className="confirm-modal-footer">
            <motion.button className="btn btn-ghost" onClick={onClose} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>Cancel</motion.button>
            <motion.button className="btn btn-primary" onClick={onConfirm} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {loading ? <i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> : "Request Return"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function StudentHistoryPage() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [returningId, setReturningId] = useState(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    const params = {};
    if (tab === "active") params.status = "active";
    if (tab === "returned") params.status = "returned";

    api.get("/api/borrows/my", { params }).then(({ data }) => {
      setBorrows(data.data?.borrows || []);
      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load history");
      setLoading(false);
    });
  }, [tab]);

  const canReturn = (b) => b.status === "active";

  const doReturn = async () => {
    const id = returningId;
    if (!id) return;
    setSubmittingReturn(true);
    try {
      const { data } = await api.post(`/api/borrows/${id}/request-return`);
      if (data.success) {
        toast.success("Return requested. Please bring the book to the librarian.");
        setBorrows((prev) => prev.map((b) => b.id === id ? { ...b, ...data.data.borrow, status: "return_pending" } : b));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request return");
    } finally {
      setReturningId(null);
      setSubmittingReturn(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="section-header">
        <span className="section-title">My Borrows</span>
      </div>

      <div className="tab-bar" style={{ marginBottom: "14px" }}>
        {["active", "returned"].map((t) => (
          <button
            key={t}
            className={`tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
            disabled={loading}
          >{t === "active" ? "Active" : "History"}</button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <div className="skeleton" style={{ height: 20, width: "30%", margin: "0 auto" }}></div>
        </div>
      ) : borrows.length === 0 ? (
        <motion.div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--sf-text-2)" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <i className="ti ti-history" style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}></i>
          {tab === "active" ? "You have no active borrows." : "No history yet."}
        </motion.div>
      ) : (
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Fine</th>
                <th>Status</th>
                {tab === "active" && <th></th>}
              </tr>
            </thead>
            <tbody>
              {borrows.map((b) => {
                const totalFine = b.fines?.reduce((s, f) => s + f.amount, 0) || 0;
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.items?.map((i) => i.book?.title).join(", ")}</td>
                    <td style={{ color: "var(--sf-text-2)" }}>{formatDate(b.borrow_date)}</td>
                    <td style={{ color: "var(--sf-text-2)" }}>{formatDate(b.due_date)}</td>
                    <td style={{ color: "var(--sf-text-2)" }}>{b.return_date ? formatDate(b.return_date) : "—"}</td>
                    <td>{totalFine > 0 ? formatCurrency(totalFine) : "0 ₫"}</td>
                    <td>{statusBadge(b.status, b.is_overdue, b.due_date)}</td>
                    {tab === "active" && (
                      <td>
                        {canReturn(b) ? (
                          <motion.button className="btn btn-primary btn-sm" onClick={() => setReturningId(b.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            Return
                          </motion.button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--sf-text-2)" }}>
                            {b.status === "return_pending" ? "Awaiting confirmation" : ""}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {returningId && (
        <ReturnModal onClose={() => { if (!submittingReturn) setReturningId(null); }} onConfirm={doReturn} loading={submittingReturn} />
      )}
    </motion.div>
  );
}
