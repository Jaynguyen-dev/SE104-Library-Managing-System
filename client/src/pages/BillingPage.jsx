import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import Pagination from "../components/Pagination";

function PayModal({ fine, onClose, onPaid }) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/api/fines/${fine.id}/pay`);
      toast.success("Payment recorded");
      onPaid();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const bookTitle = fine.borrow_record?.items?.[0]?.book?.title || fine.reason || "-";
  const daysOverdue = fine.borrow_record?.due_date
    ? Math.ceil((new Date(fine.created_at || new Date()) - new Date(fine.borrow_record.due_date)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div
          className="modal" onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="modal-header">
            <h3>
              <i className="ti ti-credit-card" style={{ marginRight: "8px", color: "var(--sf-green)" }}></i>
              Confirm Payment
            </h3>
            <motion.button className="icon-btn" onClick={onClose} whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}><i className="ti ti-x"></i></motion.button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <label className="form-label">Member</label>
              <div style={{ fontWeight: 500 }}>{fine.user?.full_name}</div>
            </div>
            <div className="form-row">
              <label className="form-label">Book</label>
              <div>{bookTitle}</div>
            </div>
            {daysOverdue && (
              <div className="form-row">
                <label className="form-label">Overdue</label>
                <div>{daysOverdue} days</div>
              </div>
            )}
            <div className="form-row">
              <label className="form-label">Fine Amount</label>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--sf-red)" }}>{formatCurrency(fine.amount)}</div>
            </div>
            <div style={{ marginTop: "12px", padding: "10px 14px", background: "var(--sf-bg-2)", borderRadius: "8px", fontSize: "13px", color: "var(--sf-text-2)" }}>
              <i className="ti ti-info-circle" style={{ marginRight: "6px" }}></i>
              This will record the payment with a timestamp and mark the fine as paid.
            </div>
          </div>
          <div className="modal-footer">
            <motion.button className="btn btn-ghost" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>Cancel</motion.button>
            <motion.button className="btn btn-primary" onClick={handleConfirm} disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {submitting ? "Processing…" : `Pay ${formatCurrency(fine.amount)}`}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCard({ label, value, sub, delay = 0, color }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
    >
      <div className="stat-label">{label}</div>
      <div className="stat-val" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </motion.div>
  );
}

export default function BillingPage() {
  const [fines, setFines] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paidFilter, setPaidFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [payingFine, setPayingFine] = useState(null);

  const fetchData = (p, filter) => {
    setLoading(true);
    const params = { page: p || 1, limit: 20 };
    if (filter !== "") params.is_paid = filter;
    api.get("/api/fines", { params })
      .then(({ data }) => {
        setFines(data.data?.fines || []);
        setPagination(data.data?.pagination || { total: 0, pages: 0 });
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load fines"))
      .finally(() => setLoading(false));

    api.get("/api/fines/revenue")
      .then(({ data }) => setRevenue(data.data))
      .catch(() => {});
  };

  useEffect(() => {
    api.get("/api/fines", { params: { page: 1, limit: 20 } })
      .then(({ data }) => {
        setFines(data.data?.fines || []);
        setPagination(data.data?.pagination || { total: 0, pages: 0 });
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load fines"))
      .finally(() => setLoading(false));
    api.get("/api/fines/revenue")
      .then(({ data }) => setRevenue(data.data))
      .catch(() => {});
  }, []);

  const handleFilter = (filter) => {
    setPaidFilter(filter);
    setPage(1);
    fetchData(1, filter);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchData(p, paidFilter);
  };

  const handlePaid = () => fetchData(page, paidFilter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="section-header">
        <span className="section-title">Billing & Revenue</span>
      </div>

      {revenue && (
        <div className="stat-grid" style={{ marginBottom: "16px" }}>
          <StatCard label="Total Revenue" value={formatCurrency(revenue.totalRevenue)} delay={0} />
          <StatCard label="Collected" value={formatCurrency(revenue.paidRevenue)} sub={`${revenue.paidCount} paid fines`} delay={0.05} color="var(--sf-green)" />
          <StatCard label="Outstanding" value={formatCurrency(revenue.unpaidRevenue)} sub={`${revenue.unpaidCount} unpaid fines`} delay={0.1} color="var(--sf-red)" />
          <StatCard label="Collection Rate" value={revenue.totalRevenue > 0 ? `${Math.round((revenue.paidRevenue / revenue.totalRevenue) * 100)}%` : "—"} delay={0.15} />
        </div>
      )}

      <div className="tab-bar" style={{ marginBottom: "14px" }}>
        {["", "false", "true"].map((v) => (
          <button
            key={v}
            className={`tab${paidFilter === v ? " active" : ""}`}
            onClick={() => handleFilter(v)} disabled={loading}
          >{v === "" ? "All" : v === "false" ? "Unpaid" : "Paid"}</button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <div className="skeleton" style={{ height: 20, width: "30%", margin: "0 auto" }}></div>
        </div>
      ) : fines.length === 0 ? (
        <motion.div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--sf-text-2)" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <i className="ti ti-coin" style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}></i>
          No fines found.
        </motion.div>
      ) : (
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Book</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fines.map((f) => {
                const bookTitle = f.borrow_record?.items?.[0]?.book?.title || f.reason || "-";
                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 500 }}>{f.user?.full_name}</td>
                    <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bookTitle}</td>
                    <td>{formatCurrency(f.amount)}</td>
                    <td>
                      <span className={`badge ${f.is_paid ? "badge-green" : "badge-red"}`}>
                        <i className={`ti ti-${f.is_paid ? "check-circle" : "alert-circle"}`} style={{ fontSize: "10px" }}></i>
                        {f.is_paid ? "PAID" : "UNPAID"}
                      </span>
                    </td>
                    <td style={{ color: "var(--sf-text-2)", fontSize: "13px" }}>
                      {f.paid_at ? formatDate(f.paid_at) : "—"}
                    </td>
                    <td>
                      {!f.is_paid ? (
                        <motion.button className="btn btn-ghost btn-sm" onClick={() => setPayingFine(f)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                          <i className="ti ti-credit-card" style={{ marginRight: "4px" }}></i>Collect
                        </motion.button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--sf-text-2)" }}>
                          <i className="ti ti-check" style={{ marginRight: "2px" }}></i>Paid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      <Pagination page={pagination.page || page} pages={pagination.pages} total={pagination.total} onPageChange={handlePageChange} loading={loading} />

      {payingFine && (
        <PayModal fine={payingFine} onClose={() => setPayingFine(null)} onPaid={handlePaid} />
      )}
    </motion.div>
  );
}
