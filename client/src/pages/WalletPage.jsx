import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import AddCreditsModal from "../components/AddCreditsModal";

function typeBadge(type) {
  const map = {
    topup: { cls: "badge-green", label: "Top-up" },
    deduction: { cls: "badge-red", label: "Payment" },
    refund: { cls: "badge-amber", label: "Refund" },
  };
  const m = map[type] || { cls: "badge-gray", label: type };
  return <span className={`badge ${m.cls}`}><i className={`ti ti-${type === "topup" ? "arrow-up" : type === "deduction" ? "arrow-down" : "refresh"}`} style={{ fontSize: "10px" }}></i>{m.label}</span>;
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

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [fines, setFines] = useState([]);

  const fetchWallet = useCallback(() => {
    api.get("/api/wallet")
      .then(({ data }) => setWallet(data.data.wallet))
      .catch(() => toast.error("Failed to load wallet"))
      .finally(() => setLoading(false));
  }, []);

  const fetchFines = useCallback(() => {
    api.get("/api/fines/my", { params: { page: 1, limit: 100 } })
      .then(({ data }) => setFines(data.data.fines || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchFines();
  }, [fetchWallet, fetchFines]);

  const handleCreditsAdded = () => {
    fetchWallet();
  };

  const totalUnpaidFines = fines.filter((f) => !f.is_paid).reduce((s, f) => s + f.amount, 0);

  const handlePayFine = async (fineId) => {
    setPayingId(fineId);
    try {
      await api.patch(`/api/fines/${fineId}/self-pay`);
      toast.success("Fine paid from wallet");
      fetchWallet();
      fetchFines();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="stat-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card" style={{ padding: "20px 22px" }}>
              <div className="stat-label" style={{ opacity: 0.3 }}>&nbsp;</div>
              <div className="skeleton" style={{ height: 28, width: "60%", borderRadius: 4 }}>&nbsp;</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="section-header">
        <span className="section-title">My Wallet</span>
        <motion.button className="btn btn-primary" onClick={() => setShowAddCredits(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <i className="ti ti-plus" style={{ marginRight: "4px" }}></i>Add Credits
        </motion.button>
      </div>

      <div className="stat-grid" style={{ marginBottom: "16px" }}>
        <StatCard label="Current Balance" value={formatCurrency(wallet?.balance || 0)} sub="Available to use" delay={0} color="var(--sf-accent)" />
        <StatCard label="Unpaid Fines" value={totalUnpaidFines > 0 ? formatCurrency(totalUnpaidFines) : "0 ₫"} sub={`${fines.filter((f) => !f.is_paid).length} outstanding`} delay={0.05} color={totalUnpaidFines > 0 ? "var(--sf-red)" : "var(--sf-green)"} />
        <StatCard label="Transactions" value={wallet?.transactions?.length || 0} sub="Total transactions" delay={0.1} />
      </div>

      {totalUnpaidFines > 0 && (
        <motion.div className="card" style={{ marginBottom: "16px", padding: "16px 20px" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: "4px" }}>Unpaid Fines</div>
              <div style={{ fontSize: "13px", color: "var(--sf-text-2)" }}>
                {totalUnpaidFines > (wallet?.balance || 0)
                  ? "Insufficient balance to pay all fines"
                  : "Sufficient balance to pay all fines"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--sf-red)" }}>{formatCurrency(totalUnpaidFines)}</div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="section-header" style={{ marginTop: "6px" }}>
        <span className="section-title">Unpaid Fines</span>
      </div>

      {fines.filter((f) => !f.is_paid).length === 0 ? (
        <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--sf-text-2)", fontSize: "13px" }}>
          <i className="ti ti-check-circle" style={{ fontSize: "24px", display: "block", marginBottom: "8px", color: "var(--sf-green)" }}></i>
          No unpaid fines. All clear!
        </div>
      ) : (
        <motion.div className="card" style={{ marginBottom: "16px" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Amount</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fines.filter((f) => !f.is_paid).map((f) => {
                const bookTitle = f.borrow_record?.items?.[0]?.book?.title || f.reason || "-";
                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 500 }}>{bookTitle}</td>
                    <td>{formatCurrency(f.amount)}</td>
                    <td style={{ color: "var(--sf-text-2)" }}>{formatDate(f.created_at)}</td>
                    <td>
                      <motion.button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handlePayFine(f.id)}
                        disabled={(wallet?.balance || 0) < f.amount || payingId === f.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {payingId === f.id ? (
                          <i className="ti ti-loader" style={{ animation: "spin 1s linear infinite" }}></i>
                        ) : (wallet?.balance || 0) >= f.amount ? "Pay from Wallet" : "Insufficient"}
                      </motion.button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      <div className="section-header">
        <span className="section-title">Transaction History</span>
      </div>

      {(!wallet?.transactions || wallet.transactions.length === 0) ? (
        <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--sf-text-2)", fontSize: "13px" }}>
          <i className="ti ti-receipt" style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}></i>
          No transactions yet.
        </div>
      ) : (
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {wallet.transactions.map((t) => (
                <tr key={t.id}>
                  <td>{typeBadge(t.type)}</td>
                  <td style={{ fontWeight: 500, color: t.amount > 0 ? "var(--sf-green)" : "var(--sf-red)" }}>
                    {t.amount > 0 ? "+" : ""}{formatCurrency(t.amount)}
                  </td>
                  <td style={{ fontSize: "13px", color: "var(--sf-text-2)" }}>
                    {t.payment_method ? t.payment_method.charAt(0).toUpperCase() + t.payment_method.slice(1) : "—"}
                  </td>
                  <td style={{ fontSize: "13px", color: "var(--sf-text-2)" }}>{t.description || "—"}</td>
                  <td style={{ fontSize: "13px", color: "var(--sf-text-2)" }}>{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {showAddCredits && (
        <AddCreditsModal
          onClose={() => setShowAddCredits(false)}
          onSuccess={handleCreditsAdded}
        />
      )}
    </motion.div>
  );
}
