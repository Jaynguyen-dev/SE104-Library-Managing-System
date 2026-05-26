import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import { getCoverSources, DEFAULT_COVER } from "../utils/coverUtils";

gsap.registerPlugin(ScrollTrigger);

const CATEGORY_COLORS = ["#1ed760", "#539df5", "#ffa42b", "#f3727f", "#a463f2", "#50e3c2", "#f7a8b8", "#4a90d9"];

/* ─── Shared Sub-Components ─── */

function RecentCover({ book }) {
  const [index, setIndex] = useState(0);
  const sources = getCoverSources(book);
  const src = sources[index];

  const handleError = useCallback(() => {
    setIndex(prev => Math.min(prev + 1, sources.length - 1));
  }, [sources.length]);

  const handleLoad = useCallback((e) => {
    const img = e.currentTarget;
    if (img.naturalWidth <= 2 && img.naturalHeight <= 2) {
      handleError();
    }
  }, [handleError]);

  return (
    <img
      src={src}
      alt=""
      className="recent-book-cover"
      style={{ objectFit: src === DEFAULT_COVER ? "contain" : "cover" }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

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



/* ─── Category Donut Chart ─── */

function CategoryDonut({ data, size = 100 }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;
  const { parts } = data.reduce((acc, d, i) => {
    const start = (acc.cumulative / total) * 100;
    const cumulative = acc.cumulative + d.count;
    const end = (cumulative / total) * 100;
    acc.parts.push(`${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} ${start}% ${end}%`);
    acc.cumulative = cumulative;
    return acc;
  }, { cumulative: 0, parts: [] });
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `conic-gradient(${parts.join(", ")})`,
      position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        position: "absolute", inset: "28%", borderRadius: "50%",
        background: "var(--sf-card)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{total}</div>
        <div style={{ fontSize: 7, color: "var(--sf-text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Books</div>
      </div>
    </div>
  );
}

/* ─── Category Bar ─── */

function CategoryBar({ category, count, percentage, color, delay }) {
  return (
    <div style={{ cursor: "default" }} title={`${category}: ${count} book${count !== 1 ? "s" : ""} (${percentage}%)`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }}></span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--sf-text)" }}>{category}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10, color: "var(--sf-text-2)", fontWeight: 600 }}>{percentage}%</span>
          <span style={{ fontSize: 9, color: "var(--sf-text-3)" }}>({count})</span>
        </div>
      </div>
      <div className="progress-bar" style={{ height: 7 }}>
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function ReaderDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const dashRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/my")
      .then(({ data }) => { setData(data.data); setLoading(false); })
      .catch(() => { toast.error("Failed to load dashboard"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!loading && data && dashRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".stat-card", { opacity: 0, y: 20, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" });
        gsap.fromTo(".dash-col", { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.5,
          scrollTrigger: { trigger: ".dash-col", start: "top 85%", toggleActions: "play none none reverse" },
        });
        gsap.fromTo(".section-header", { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, duration: 0.4,
          scrollTrigger: { trigger: ".section-header", start: "top 88%", toggleActions: "play none none reverse" },
        });
      }, dashRef.current);
      return () => ctx.kill();
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div>
        <div className="stat-grid-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="stat-card" style={{ padding: "14px 16px" }}>
              <div className="stat-label" style={{ opacity: 0.3 }}>&nbsp;</div>
              <div className="skeleton" style={{ height: 22, width: "60%", borderRadius: 4 }}>&nbsp;</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ textAlign: "center", padding: "48px 0", color: "var(--sf-text-2)" }}>Failed to load dashboard.</div>;

  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const booksThisMonth = (data.monthlyBorrows || []).find(m => m.month === currentMonthKey)?.count || 0;
  const hasActivity = data.totalBorrows > 0;
  const hasBorrowHistory = data.recentlyReturned && data.recentlyReturned.length > 0;
  const dedupedBorrows = [];
  if (data.recentlyReturned) {
    const seenBookIds = new Set();
    for (const record of data.recentlyReturned) {
      for (const item of (record.items || [])) {
        if (!seenBookIds.has(item.book.id)) {
          seenBookIds.add(item.book.id);
          dedupedBorrows.push({ ...item, borrow_date: record.borrow_date, status: record.status, recordId: record.id });
        }
      }
    }
  }
  const hasUnpaidFines = data.unpaidFines && data.unpaidFines.length > 0;

  return (
    <div ref={dashRef}>

      {/* ── Welcome Banner ── */}
      <Banner data={data} hasActivity={hasActivity} userName={user?.full_name} />

      {/* ── Stats Row ── */}
      <div className="stat-grid-5">
        <StatCard label="Active Borrows" value={data.activeBorrows} sub="Currently borrowed" delay={0} icon="ti ti-book" gradient="#FFF4E0" color="var(--sf-amber)" />
        <StatCard label="Overdue" value={data.overdueCount} sub="Overdue items" delay={0.04} icon="ti ti-alert-triangle" gradient="var(--sf-red-bg)" color="var(--sf-red)" />
        <StatCard label="Total Borrows" value={data.totalBorrows} sub="All time" delay={0.08} icon="ti ti-arrow-left-right" gradient="var(--sf-accent-light)" />
        <StatCard label="Reservations" value={data.activeReservations || 0} sub="Active holds" delay={0.12} icon="ti ti-clock" gradient="var(--sf-accent-light)" />
        <StatCard label="Fines" value={formatCurrency(data.unpaidFinesTotal)} sub={data.unpaidFinesTotal > 0 ? "Unpaid" : "Clear"} delay={0.16} icon={data.unpaidFinesTotal > 0 ? "ti ti-receipt" : "ti ti-check"} gradient={data.unpaidFinesTotal > 0 ? "var(--sf-red-bg)" : "var(--sf-green-bg)"} color={data.unpaidFinesTotal > 0 ? "var(--sf-red)" : "var(--sf-green)"} />
      </div>

      {/* ── Reading Insights ── */}
      {hasActivity && (
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <InsightCard icon="ti ti-category" label="Favorite Category" value={data.favoriteCategory || "—"} sub="Most read genre" color="var(--sf-accent)" bg="var(--sf-accent-light)" />
          </div>
          <div style={{ flex: 1 }}>
            <InsightCard icon="ti ti-calendar" label="This Month" value={booksThisMonth} sub="Books borrowed" color="var(--sf-green)" bg="var(--sf-green-bg)" />
          </div>
          <div style={{ flex: 1 }}>
            <InsightCard icon="ti ti-book-2" label="Returned" value={data.returnedCount} sub={`${data.totalBorrows} total`} color="var(--sf-accent)" bg="var(--sf-accent-light)" />
          </div>
        </div>
      )}

      {/* ── Recently Borrowed ── */}
      {hasBorrowHistory && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="section-header" style={{ marginTop: 0 }}>
            <span className="section-title">
              <i className="ti ti-book" style={{ marginRight: 6, fontSize: 14 }}></i>
              Recently Borrowed
            </span>
          </div>
          <div className="recent-carousel-wrap">
            <div className="recent-carousel">
              {dedupedBorrows.map((item, idx) => (
                <motion.div
                  key={item.book.id}
                  className="recent-book-card"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + idx * 0.04 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="recent-book-cover">
                    <RecentCover book={item.book} />
                  </div>
                  <div className="recent-book-info">
                    <div className="recent-book-title">{item.book.title}</div>
                    <div className="recent-book-author">{item.book.author || "Unknown"}</div>
                    <div className="recent-book-date">
                      <i className="ti ti-calendar-time" style={{ marginRight: 3, fontSize: 8 }}></i>
                      {formatDate(item.borrow_date)}
                      {item.status === "active" && (
                        <span className="badge badge-amber" style={{ marginLeft: 4, fontSize: 7, padding: "1px 4px" }}>Active</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Unpaid Fines ── */}
      {hasUnpaidFines && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ marginTop: 12 }}>
          <div className="section-header">
            <span className="section-title">
              <i className="ti ti-alert-triangle" style={{ color: "var(--sf-red)", marginRight: 6, fontSize: 14 }}></i>
              Unpaid Fines
            </span>
            <Link to="/fines/my" className="btn btn-ghost btn-sm">
              View All
            </Link>
          </div>
          <div className="card" style={{ padding: 0 }}>
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
                {data.unpaidFines.slice(0, 5).map((f, i) => (
                  <motion.tr key={f.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }}>
                    <td style={{ fontWeight: 500 }}>{f.borrow_record?.items?.[0]?.book?.title || f.reason || "-"}</td>
                    <td>{formatCurrency(f.amount)}</td>
                    <td style={{ color: "var(--sf-text-2)" }}>{formatDate(f.created_at)}</td>
                    <td><span className="badge badge-red"><i className="ti ti-alert-circle" style={{ fontSize: 10 }}></i> Unpaid</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Bottom Row: Reading Categories + Top 5 Categories ── */}
      {hasActivity && (
        <div className="dash-row" style={{ marginTop: 12 }}>
          <motion.div className="dash-col" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="section-header">
              <span className="section-title">
                <i className="ti ti-category" style={{ marginRight: 6, fontSize: 14 }}></i>
                Reading Categories
              </span>
            </div>
            <div className="card" style={{ padding: "12px 14px" }}>
              {data.insights && data.insights.length > 0 && (
                <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  {data.insights.slice(0, 2).map((insight, i) => (
                    <div key={i} style={{
                      padding: "6px 10px",
                      background: i === 0 ? "var(--sf-accent-light)" : "var(--sf-bg-2)",
                      borderRadius: 8, fontSize: 11,
                      color: i === 0 ? "var(--sf-accent)" : "var(--sf-text-2)",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <i className={`ti ${i === 0 ? "ti-info-circle" : "ti-trending-up"}`} style={{ fontSize: 12 }}></i>
                      {insight}
                    </div>
                  ))}
                </div>
              )}
              {(data.categoryStats || []).length > 0 ? (
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <CategoryDonut data={data.categoryStats.slice(0, 8)} />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                    {data.categoryStats.map((cat, i) => (
                      <CategoryBar
                        key={cat.category}
                        category={cat.category}
                        count={cat.count}
                        percentage={cat.percentage}
                        color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                        delay={0.45 + i * 0.04}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 16, color: "var(--sf-text-2)", fontSize: 11 }}>
                  <div style={{ marginBottom: 6 }}>No reading data yet.</div>
                  <div>Start borrowing books to see insights.</div>
                </div>
              )}
            </div>
          </motion.div>
          <motion.div className="dash-col" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <div className="section-header">
              <span className="section-title">
                <i className="ti ti-trending-up" style={{ marginRight: 6, fontSize: 14 }}></i>
                Top Categories
              </span>
            </div>
            <div className="card" style={{ padding: "12px 14px" }}>
              {(data.categoryStats || []).length > 0 ? (
                <div className="pop-cat-grid" style={{ gap: 6 }}>
                  {data.categoryStats.slice(0, 5).map((cat, i) => {
                    const palette = [
                      { bg: "rgba(30, 215, 96, 0.15)", icon: "ti ti-trending-up", color: "#1ed760", gradient: "linear-gradient(135deg, #1ed760, #1db954)" },
                      { bg: "rgba(83, 157, 245, 0.15)", icon: "ti ti-star", color: "#539df5", gradient: "linear-gradient(135deg, #539df5, #4a90d9)" },
                      { bg: "rgba(255, 164, 43, 0.15)", icon: "ti ti-book", color: "#ffa42b", gradient: "linear-gradient(135deg, #ffa42b, #f59e0b)" },
                      { bg: "rgba(243, 114, 127, 0.15)", icon: "ti ti-flame", color: "#f3727f", gradient: "linear-gradient(135deg, #f3727f, #dc2626)" },
                      { bg: "rgba(164, 99, 242, 0.15)", icon: "ti ti-books", color: "#a463f2", gradient: "linear-gradient(135deg, #a463f2, #9333ea)" },
                    ];
                    const maxCount = data.categoryStats[0]?.count || 1;
                    const pct = Math.round((cat.count / maxCount) * 100);
                    const p = palette[i % palette.length];
                    return (
                      <motion.div
                        key={cat.category}
                        className="pop-cat-card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + i * 0.06, ease: "easeOut" }}
                        whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
                        style={{ padding: "10px 12px", gap: 4 }}
                      >
                        <div className="pop-cat-icon" style={{ width: 30, height: 30, fontSize: 13, background: p.bg, color: p.color }}>
                          <i className={p.icon}></i>
                        </div>
                        <div className="pop-cat-name" style={{ fontSize: 11 }}>{cat.category}</div>
                        <div className="pop-cat-metric" style={{ fontSize: 9 }}>{cat.count} book{cat.count !== 1 ? "s" : ""}</div>
                        <div className="progress-bar" style={{ height: 3, background: "var(--sf-bg-2)", borderRadius: 3, marginTop: "auto" }}>
                          <motion.div
                            className="progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: 0.55 + i * 0.06, ease: "easeOut" }}
                            style={{ background: p.gradient, height: 3, borderRadius: 3 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 12, color: "var(--sf-text-2)", fontSize: 11 }}>
                  Borrow books to see your top categories.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!hasActivity && (
        <motion.div className="card" style={{ padding: "36px 24px", textAlign: "center" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <i className="ti ti-book" style={{ fontSize: 36, marginBottom: 10, display: "block", color: "var(--sf-accent)" }}></i>
          </motion.div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sf-text)", marginBottom: 2 }}>No activity yet</div>
          <div style={{ fontSize: 12, marginBottom: 14, color: "var(--sf-text-2)" }}>Browse the library and borrow your first book!</div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/books" className="btn btn-primary"><i className="ti ti-books"></i> Browse Books</Link>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}

/* ─── Banner ─── */

function Banner({ data, hasActivity, userName }) {
  const displayName = userName || "Reader";
  return (
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
          My Library
        </div>
        <div style={{ color: "#000", fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>
          Welcome to the library, {displayName}
        </div>
        <div style={{ color: "rgba(0,0,0,0.6)", fontSize: 13, marginTop: 2 }}>
          {hasActivity
            ? `${data.returnedCount || 0} books returned · ${data.favoriteCategory || "exploring"}`
            : "Start your reading journey today"}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <Link to="/books" className="btn" style={{ background: "rgba(0,0,0,0.15)", color: "#000", border: "none", fontSize: 12, padding: "6px 14px" }}>
          <i className="ti ti-books"></i> Browse
        </Link>
      </div>
    </motion.div>
  );
}
