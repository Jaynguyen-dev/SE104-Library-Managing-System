import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatDate } from "../utils/format";
import Pagination from "../components/Pagination";

function statusBadge(status, isOverdue) {
  const effective = status === "active" && isOverdue ? "overdue" : status;
  const cls = effective === "overdue" ? "badge-red" : effective === "active" ? "badge-amber" : effective === "return_pending" ? "badge-blue" : "badge-green";
  const label = effective === "return_pending" ? "Pending Return" : effective.charAt(0).toUpperCase() + effective.slice(1);
  const icon = effective === "overdue" ? "ti ti-alert-triangle" : effective === "active" ? "ti ti-book" : effective === "return_pending" ? "ti ti-clock" : "ti ti-check";
  return <span className={`badge ${cls}`}><i className={icon} style={{ fontSize: "10px" }}></i>{label}</span>;
}

function ConfirmModal({ onClose, onConfirm, message, warning, loading }) {
  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="confirm-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="confirm-modal-header">
            <h3>Confirm Return</h3>
            <motion.button className="icon-btn" onClick={onClose} whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
              <i className="ti ti-x"></i>
            </motion.button>
          </div>
          <div className="confirm-modal-body">
            <p>{message || "Are you sure you want to confirm this return?"}</p>
            {warning && <p style={{ fontSize: "13px", color: "var(--sf-red)", fontWeight: 500 }}>{warning}</p>}
            <p style={{ fontSize: "13px", color: "var(--sf-text-2)" }}>
              The book will be marked as returned and the inventory will be updated.
            </p>
          </div>
          <div className="confirm-modal-footer">
            <motion.button className="btn btn-ghost" onClick={onClose} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>Cancel</motion.button>
            <motion.button className="btn btn-primary" onClick={onConfirm} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {loading ? <i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i> : "Confirm"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function BorrowListPage() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmingReturn, setConfirmingReturn] = useState(false);

  useEffect(() => {
    api.get("/api/borrows", { params: { page: 1, limit: 20 } })
      .then(({ data }) => {
        setBorrows(data.data?.borrows || []);
        setPagination(data.data?.pagination || { total: 0, pages: 0 });
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load borrows"))
      .finally(() => setLoading(false));
  }, []);

  const fetchData = (s, p) => {
    setLoading(true);
    const params = { page: p || 1, limit: 20 };
    if (s) params.status = s;
    api.get("/api/borrows", { params })
      .then(({ data }) => {
        setBorrows(data.data?.borrows || []);
        setPagination(data.data?.pagination || { total: 0, pages: 0 });
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load borrows"))
      .finally(() => setLoading(false));
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    setPage(1);
    fetchData(s, 1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchData(statusFilter, p);
  };

  const doConfirmReturn = async () => {
    const id = confirmingId;
    if (!id) return;
    setConfirmingReturn(true);
    try {
      const { data } = await api.patch(`/api/borrows/${id}/confirm-return`);
      if (data.success) {
        toast.success("Return confirmed");
        fetchData(statusFilter, page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm return");
    } finally {
      setConfirmingId(null);
      setConfirmingReturn(false);
    }
  };

  const confirmingBorrow = borrows.find((b) => b.id === confirmingId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="section-title">Borrow Records</span>
          <div className="tab-bar">
            {["", "active", "return_pending", "returned", "overdue"].map((s) => (
              <button
                key={s}
                className={`tab${statusFilter === s ? " active" : ""}`}
                onClick={() => handleStatusFilter(s)}
                disabled={loading}
              >{s === "return_pending" ? "Pending" : s || "All"}</button>
            ))}
          </div>
        </div>
        <Link to="/borrows/new" className="btn btn-primary">
          <i className="ti ti-plus" aria-hidden="true"></i> New Borrow
        </Link>
      </div>

      {loading ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <div className="skeleton" style={{ height: 20, width: "40%", margin: "0 auto 8px" }}></div>
        </div>
      ) : borrows.length === 0 ? (
        <motion.div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--sf-text-2)" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <i className="ti ti-arrow-left-right" style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}></i>
          <div>No borrow records found.</div>
        </motion.div>
      ) : (
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Books</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {borrows.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.user?.full_name}</td>
                  <td>
                    {b.items?.[0]?.book?.title || "-"}
                    {b.items?.length > 1 && <span style={{ color: "var(--sf-text-2)" }}> +{b.items.length - 1} more</span>}
                  </td>
                  <td style={{ color: "var(--sf-text-2)" }}>{formatDate(b.borrow_date)}</td>
                  <td style={{ color: "var(--sf-text-2)" }}>{formatDate(b.due_date)}</td>
                  <td>{statusBadge(b.status, b.is_overdue)}</td>
                  <td>
                    {b.status === "return_pending" ? (
                      <motion.button className="btn btn-primary btn-sm" onClick={() => handleConfirmReturn(b.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        Confirm Return
                      </motion.button>
                    ) : b.status === "active" ? (
                      <Link to={`/borrows/${b.id}/return`} className="btn btn-ghost btn-sm">Return</Link>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--sf-text-2)" }}>Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <Pagination page={pagination.page || page} pages={pagination.pages} total={pagination.total} onPageChange={handlePageChange} loading={loading} />

      {confirmingId && (
        <ConfirmModal
          onClose={() => {
            if (!confirmingReturn) setConfirmingId(null);
          }}
          onConfirm={doConfirmReturn}
          loading={confirmingReturn}
          warning={confirmingBorrow?.is_overdue ? "This borrow is overdue — a fine will be applied." : undefined}
        />
      )}
    </motion.div>
  );

  function handleConfirmReturn(id) {
    setConfirmingId(id);
  }
}
