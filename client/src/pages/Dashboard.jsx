import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatDate, formatCurrency } from "../utils/format";

gsap.registerPlugin(ScrollTrigger);

function StatCard({ label, value, sub, delay = 0, icon, gradient, color }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      whileHover={{ y: -3, boxShadow: "0 8px 25px rgba(0,0,0,0.08)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="stat-label">{label}</div>
          <div className="stat-val" style={color ? { color } : undefined}>{value}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        {icon && (
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: gradient || "var(--sf-accent-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: color || "var(--sf-accent)",
          }}>
            <i className={icon}></i>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InsightCard({ icon, label, value, sub, color, bg }) {
  return (
    <div className="insight-card" style={{ padding: "11px 13px" }}>
      <div className="insight-row">
        <div className="insight-icon" style={{ background: bg || "var(--sf-accent-light)", color: color || "var(--sf-accent)" }}>
          <i className={icon}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="insight-label">{label}</div>
          <div className="insight-val" style={color ? { color } : undefined}>{value}</div>
          {sub && <div style={{ fontSize: 10, color: "var(--sf-text-3)", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const dashRef = useRef(null);

  useEffect(() => {
    api.get("/api/dashboard/summary")
      .then(({ data }) => { setSummary(data.data); setLoading(false); })
      .catch(() => { toast.error("Failed to load dashboard"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!loading && summary && dashRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".stat-card", { opacity: 0, y: 20, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" });
        gsap.fromTo(".insight-card", { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, delay: 0.2, ease: "power2.out" });
        gsap.fromTo(".pop-cat-card", { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, delay: 0.3, ease: "power2.out" });

        gsap.fromTo(".dash-col", { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.5, ease: "power2.out",
          scrollTrigger: { trigger: ".dash-col", start: "top 85%", toggleActions: "play none none reverse" },
        });

        gsap.fromTo(".section-header", { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, duration: 0.4,
          scrollTrigger: { trigger: ".section-header", start: "top 88%", toggleActions: "play none none reverse" },
        });
      }, dashRef.current);
      return () => ctx.kill();
    }
  }, [loading, summary]);

  const displayName = user?.role === "librarian" ? "Librarian" : user?.full_name || "Admin";

  if (loading) {
    return (
      <div>
        <div className="stat-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="stat-card" style={{ padding: "14px 16px" }}>
              <div className="stat-label" style={{ opacity: 0.3 }}>&nbsp;</div>
              <div className="skeleton" style={{ height: 22, width: "60%", borderRadius: 4 }}>&nbsp;</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return <div style={{ textAlign: "center", padding: "48px 0", color: "var(--sf-text-2)" }}>Failed to load dashboard.</div>;

  const totalBooks = summary.totalBooks || 0;
  const totalUsers = summary.totalUsers || 0;
  const activeBorrows = summary.activeBorrows || 0;
  const overdueCount = summary.overdueCount || 0;
  const pendingReturnsCount = summary.pendingReturnsCount || 0;
  const waitingReservations = summary.waitingReservations || 0;
  const notifiedReservations = summary.notifiedReservations || 0;
  const totalReservations = waitingReservations + notifiedReservations;
  const fallbackCategories = [
    { category: "Education", borrowCount: 0 },
    { category: "Literature", borrowCount: 0 },
    { category: "Romance", borrowCount: 0 },
    { category: "Science", borrowCount: 0 },
    { category: "Technology", borrowCount: 0 },
  ];

  return (
    <div ref={dashRef}>

      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: "linear-gradient(135deg, #1ed760 0%, #1db954 100%)",
          borderRadius: 12, padding: "20px 24px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(30, 215, 96, 0.15)",
          position: "relative", overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: "radial-gradient(circle at 20% 50%, #fff 0%, transparent 70%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ color: "rgba(0,0,0,0.6)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
            Library Overview
          </div>
          <div style={{ color: "#000", fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px" }}>
            Welcome to the library, {displayName}
          </div>
          <div style={{ color: "rgba(0,0,0,0.6)", fontSize: 13, marginTop: 2 }}>
            {totalBooks} books · {totalUsers} members · {activeBorrows} active borrows
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 8 }}>
          <Link to="/books" className="btn" style={{ background: "rgba(0,0,0,0.15)", color: "#000", border: "none", fontSize: 12, padding: "6px 14px" }}>
            <i className="ti ti-books"></i> Books
          </Link>
          <Link to="/borrows" className="btn" style={{ background: "rgba(0,0,0,0.15)", color: "#000", border: "none", fontSize: 12, padding: "6px 14px" }}>
            <i className="ti ti-arrow-left-right"></i> Borrows
          </Link>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="stat-grid">
        <StatCard label="Total Books" value={totalBooks.toLocaleString()} sub="In catalogue" delay={0} icon="ti ti-books" gradient="var(--sf-accent-light)" />
        <StatCard label="Members" value={totalUsers.toLocaleString()} sub="Registered users" delay={0.04} icon="ti ti-users" gradient="var(--sf-purple-bg)" color="var(--sf-purple)" />
        <StatCard label="Active Borrows" value={activeBorrows} sub="Currently borrowed" delay={0.08} icon="ti ti-arrow-left-right" gradient="#FFF4E0" color="var(--sf-amber)" />
        <StatCard label="Overdue" value={overdueCount} sub={summary.unpaidFinesTotal > 0 ? `${formatCurrency(summary.unpaidFinesTotal)} fines` : "No fines"} delay={0.12} icon="ti ti-alert-triangle" gradient="var(--sf-red-bg)" color="var(--sf-red)" />
        <StatCard label="Pending Returns" value={pendingReturnsCount} sub="Awaiting confirmation" delay={0.16} icon="ti ti-arrow-back-up" gradient="#FFF4E0" color="var(--sf-amber)" />
        <StatCard label="Reservations" value={totalReservations} sub={notifiedReservations > 0 ? `${notifiedReservations} ready` : `${waitingReservations} waiting`} delay={0.2} icon="ti ti-clock" gradient="var(--sf-accent-light)" />
      </div>

      {/* ── Two-column: Overdue Records + Reservations ── */}
      <div className="dash-row">
        {summary.overdueList?.length > 0 && (
          <motion.div className="dash-col" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="section-header">
              <span className="section-title">
                <i className="ti ti-alert-triangle" style={{ color: "var(--sf-red)", marginRight: 6, fontSize: 14 }}></i>
                Overdue Records
              </span>
              <Link to="/borrows" className="btn btn-ghost btn-sm"><i className="ti ti-eye"></i> View</Link>
            </div>
            <div className="card" style={{ padding: 0, marginBottom: 0 }}>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Book</th>
                      <th>Due</th>
                      <th>Overdue</th>
                      <th>Fine</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.overdueList.slice(0, 8).map((row, i) => {
                      const days = Math.ceil((new Date() - new Date(row.due_date)) / (1000 * 60 * 60 * 24));
                      return (
                        <motion.tr key={row.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.03 }}>
                          <td style={{ fontWeight: 500 }}>{row.user?.full_name || "—"}</td>
                          <td style={{ fontSize: 12 }}>{row.items?.map(i => i.book?.title).join(", ") || "-"}</td>
                          <td style={{ color: "var(--sf-text-2)", whiteSpace: "nowrap" }}>{formatDate(row.due_date)}</td>
                          <td><span className="badge badge-red">{days}d</span></td>
                          <td style={{ whiteSpace: "nowrap" }}>{formatCurrency(days * 2000)}</td>
                          <td>
                            <Link to={`/borrows/${row.id}/return`} className="icon-btn" title="Return"><i className="ti ti-arrow-back-up"></i></Link>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div className="dash-col" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="section-header">
            <span className="section-title">
              <i className="ti ti-clock" style={{ color: "var(--sf-accent)", marginRight: 6, fontSize: 14 }}></i>
              Reservations
            </span>
            <Link to="/borrows" className="btn btn-ghost btn-sm"><i className="ti ti-eye"></i> View</Link>
          </div>
          <div className="card" style={{ padding: "14px 16px", marginBottom: 0 }}>
            <div className="dash-row" style={{ gap: 12, marginBottom: 0 }}>
              <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "var(--sf-bg-2)", borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--sf-text)" }}>{waitingReservations}</div>
                <div style={{ fontSize: 10, color: "var(--sf-text-2)", marginTop: 2 }}><i className="ti ti-hourglass" style={{ marginRight: 4 }}></i>Waiting</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: notifiedReservations > 0 ? "var(--sf-accent-light)" : "var(--sf-bg-2)", borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: notifiedReservations > 0 ? "var(--sf-accent)" : "var(--sf-text)" }}>{notifiedReservations}</div>
                <div style={{ fontSize: 10, color: "var(--sf-text-2)", marginTop: 2 }}><i className="ti ti-bell" style={{ marginRight: 4 }}></i>Ready</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="section-header">
              <span className="section-title">
                <i className="ti ti-summary" style={{ marginRight: 6, fontSize: 14 }}></i>
                Library Insights
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InsightCard icon="ti ti-books" label="Total Books" value={totalBooks.toLocaleString()} sub="In collection" color="var(--sf-accent)" bg="var(--sf-accent-light)" />
              <InsightCard icon="ti ti-users" label="Members" value={totalUsers.toLocaleString()} sub="Registered" color="var(--sf-purple)" bg="#EDE9FE" />
              <InsightCard icon="ti ti-arrow-left-right" label="Active Borrows" value={activeBorrows} sub="Now out" color="var(--sf-amber)" bg="#FFF4E0" />
              <InsightCard icon="ti ti-alert-triangle" label="Overdue Rate" value={activeBorrows > 0 ? `${Math.round((overdueCount / (activeBorrows + overdueCount)) * 100)}%` : "0%"} sub="Of active" color="var(--sf-red)" bg="var(--sf-red-bg)" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Category Distribution ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="section-header" style={{ marginTop: summary.overdueList?.length > 0 || totalReservations > 0 ? 12 : 0 }}>
          <span className="section-title">
            <i className="ti ti-category" style={{ marginRight: 6, fontSize: 14 }}></i>
            Collection by Category
          </span>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          {summary.categoryDistribution?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {summary.categoryDistribution.map((cat, i) => {
                const colors = ["#1ed760", "#539df5", "#ffa42b", "#f3727f", "#a463f2", "#50e3c2", "#f7a8b8", "#4a90d9"];
                const maxCount = Math.max(...summary.categoryDistribution.map(c => c.count));
                const pct = maxCount > 0 ? Math.round((cat.count / maxCount) * 100) : 0;
                return (
                  <div key={cat.category || i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 12 }}>{cat.category}</span>
                      <span style={{ fontSize: 11, color: "var(--sf-text-2)" }}>{cat.count}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + i * 0.05, ease: "easeOut" }}
                        style={{ background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 12, color: "var(--sf-text-2)", fontSize: 12 }}>
              No categories data available.
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Circulation Reports ── */}
      {summary.circulationReports && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: 12 }}>
          <div className="section-header">
            <span className="section-title">
              <i className="ti ti-report-analytics" style={{ marginRight: 6, fontSize: 14 }}></i>
              Circulation Reports
            </span>
          </div>
          <div className="card" style={{ padding: "14px 16px" }}>
            <div className="dash-row" style={{ marginBottom: 0 }}>
              <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "var(--sf-red-bg)", borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--sf-red)" }}>{summary.circulationReports.totalOverdue}</div>
                <div style={{ fontSize: 10, color: "var(--sf-text-2)", marginTop: 2 }}><i className="ti ti-alert-triangle" style={{ marginRight: 4 }}></i>Overdue</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "var(--sf-green-bg)", borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--sf-green)" }}>{formatCurrency(summary.circulationReports.totalFinesCollected)}</div>
                <div style={{ fontSize: 10, color: "var(--sf-text-2)", marginTop: 2 }}><i className="ti ti-receipt" style={{ marginRight: 4 }}></i>Fines Collected</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: "var(--sf-accent-light)", borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--sf-accent)" }}>{summary.circulationReports.totalFinesUnpaid ? formatCurrency(summary.circulationReports.totalFinesUnpaid) : "0"}</div>
                <div style={{ fontSize: 10, color: "var(--sf-text-2)", marginTop: 2 }}><i className="ti ti-alert-circle" style={{ marginRight: 4 }}></i>Unpaid Fines</div>
              </div>
            </div>

            {summary.circulationReports.mostBorrowed?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--sf-text)" }}>
                  <i className="ti ti-trending-up" style={{ marginRight: 4, fontSize: 12 }}></i>Most Borrowed Books
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {summary.circulationReports.mostBorrowed.slice(0, 5).map((book, i) => (
                    <div key={book.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: "var(--sf-bg-2)", borderRadius: 6 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--sf-accent-light)", color: "var(--sf-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
                        <div style={{ fontSize: 9, color: "var(--sf-text-2)" }}>{book.author} · {book.category}</div>
                      </div>
                      <span className="badge badge-primary" style={{ flexShrink: 0, fontSize: 9 }}>{book.borrowCount}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Top 5 Popular Categories ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ marginTop: 12 }}>
        <div className="section-header">
          <span className="section-title">
            <i className="ti ti-trending-up" style={{ marginRight: 6, fontSize: 14 }}></i>
            Most Borrowed Categories
          </span>
        </div>
        <div className="pop-cat-grid">
          {(summary.popularCategories?.length > 0 ? summary.popularCategories : fallbackCategories).map((cat, i) => {
            const maxCount = summary.popularCategories?.length > 0 ? summary.popularCategories[0]?.borrowCount : 1;
            const pct = Math.round((cat.borrowCount / maxCount) * 100);
            const palette = [
              { bg: "rgba(30, 215, 96, 0.15)", icon: "ti ti-trending-up", color: "#1ed760", gradient: "linear-gradient(135deg, #1ed760, #1db954)" },
              { bg: "rgba(83, 157, 245, 0.15)", icon: "ti ti-star", color: "#539df5", gradient: "linear-gradient(135deg, #539df5, #4a90d9)" },
              { bg: "rgba(255, 164, 43, 0.15)", icon: "ti ti-book", color: "#ffa42b", gradient: "linear-gradient(135deg, #ffa42b, #f59e0b)" },
              { bg: "rgba(243, 114, 127, 0.15)", icon: "ti ti-flame", color: "#f3727f", gradient: "linear-gradient(135deg, #f3727f, #dc2626)" },
              { bg: "rgba(164, 99, 242, 0.15)", icon: "ti ti-books", color: "#a463f2", gradient: "linear-gradient(135deg, #a463f2, #9333ea)" },
            ];
            const p = palette[i % palette.length];
            return (
              <motion.div
                key={cat.category}
                className="pop-cat-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.5 + i * 0.07, ease: "easeOut" }}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
              >
                <div className="pop-cat-icon" style={{ background: p.bg, color: p.color }}>
                  <i className={p.icon}></i>
                </div>
                <div className="pop-cat-name">{cat.category}</div>
                <div className="pop-cat-metric">{cat.borrowCount} book{cat.borrowCount !== 1 ? "s" : ""} borrowed</div>
                <div className="progress-bar" style={{ height: 4, background: "var(--sf-bg-2)", borderRadius: 4, marginTop: "auto" }}>
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.6 + i * 0.07, ease: "easeOut" }}
                    style={{ background: p.gradient, height: 4, borderRadius: 4 }}
                  />
                </div>
              </motion.div>
            );
          })}
          </div>
        </motion.div>

    </div>
  );
}
