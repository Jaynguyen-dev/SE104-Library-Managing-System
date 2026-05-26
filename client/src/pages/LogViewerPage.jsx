import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

const LEVEL_CONFIG = {
  success: { icon: "\u2713", className: "log-line-success", label: "Success" },
  error: { icon: "\u2717", className: "log-line-error", label: "Error" },
  warn: { icon: "\u26A0", className: "log-line-warn", label: "Warning" },
  info: { icon: "\u2139", className: "log-line-info", label: "Info" },
  debug: { icon: "\u25CF", className: "log-line-debug", label: "Debug" },
};

function statusToLevel(status) {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "debug";
  return "info";
}

function formatTime(dateStr) {
  if (!dateStr) return "--:--:--";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDuration(start, end) {
  if (!start || !end) return "";
  const ms = new Date(end) - new Date(start);
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function truncate(str, max = 120) {
  if (!str || str.length <= max) return str || "";
  return str.slice(0, max) + "...";
}

function LogEntry({ entry, compact }) {
  const [expanded, setExpanded] = useState(false);
  const level = statusToLevel(entry.status);
  const cfg = LEVEL_CONFIG[level];
  const hasDetail = entry.error_msg || (entry.books_found != null && entry.books_found >= 0) || entry.isbn;

  const message = entry.status === "success"
    ? `${entry.source || entry.job_type} — ${entry.books_found} book${entry.books_found !== 1 ? "s" : ""} found, ${entry.books_updated} updated`
    : entry.status === "failed"
      ? `${entry.source || entry.job_type} — ${entry.error_msg || "Unknown error"}`
      : entry.status === "running"
        ? `${entry.source || entry.job_type} — Processing${entry.isbn ? ` ISBN ${entry.isbn}` : ""}`
        : `${entry.source || entry.job_type}${entry.isbn ? ` — Queued for ISBN ${entry.isbn}` : ""}`;

  return (
    <motion.div
      className={`log-line ${cfg.className}${expanded ? " log-line-expanded" : ""}${compact ? " log-line-compact" : ""}`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      layout
    >
      <div className="log-line-main" onClick={() => hasDetail && setExpanded(!expanded)} role={hasDetail ? "button" : undefined} tabIndex={hasDetail ? 0 : undefined} onKeyDown={(e) => { if (hasDetail && e.key === "Enter") setExpanded(!expanded); }}>
        <span className="log-time">{formatTime(entry.started_at)}</span>
        <span className="log-level-icon">{cfg.icon}</span>
        <span className={`log-badge log-badge-${level}`}>{level}</span>
        <span className="log-job">{entry.job_type}</span>
        <span className="log-msg">{compact ? truncate(message) : message}</span>
        {!compact && entry.finished_at && <span className="log-duration">{formatDuration(entry.started_at, entry.finished_at)}</span>}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="log-detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {entry.error_msg && <div className="log-detail-row"><span className="log-detail-label">Error</span><span className="log-detail-val">{entry.error_msg}</span></div>}
            {entry.isbn && <div className="log-detail-row"><span className="log-detail-label">ISBN</span><span className="log-detail-val">{entry.isbn}</span></div>}
            {entry.books_found != null && entry.books_found >= 0 && <div className="log-detail-row"><span className="log-detail-label">Found</span><span className="log-detail-val">{entry.books_found} books</span></div>}
            {entry.books_updated != null && entry.books_updated >= 0 && <div className="log-detail-row"><span className="log-detail-label">Updated</span><span className="log-detail-val">{entry.books_updated} books</span></div>}
            {entry.source && <div className="log-detail-row"><span className="log-detail-label">Source</span><span className="log-detail-val">{entry.source}</span></div>}
            {entry.finished_at && <div className="log-detail-row"><span className="log-detail-label">Finished</span><span className="log-detail-val">{new Date(entry.finished_at).toLocaleString()}</span></div>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LogCountBar({ total, filtered, liveSince, onClear }) {
  return (
    <div className="log-footer">
      <span className="log-footer-left">
        <span className="log-footer-count">{filtered} <span className="log-footer-label">entries</span></span>
        {filtered !== total && <span className="log-footer-muted">({total} total)</span>}
      </span>
      <span className="log-footer-center">
        {liveSince && <span className="log-footer-live">{"\u25CF"} Live</span>}
      </span>
      <span className="log-footer-right">
        {onClear && (
          <button className="log-footer-btn" onClick={onClear} title="Clear logs">
            <i className="ti ti-trash" />
          </button>
        )}
      </span>
    </div>
  );
}

const LEVELS = ["all", "success", "error", "warn", "info", "debug"];
const LEVEL_LABELS = { all: "All", success: "Success", error: "Error", warn: "Warn", info: "Info", debug: "Debug" };
const LEVEL_ICONS = { all: "\u2699", success: "\u2713", error: "\u2717", warn: "\u26A0", info: "\u2139", debug: "\u25CF" };

export default function LogViewerPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [compact, setCompact] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [live, setLive] = useState(true);
  const listRef = useRef(null);
  const prevLengthRef = useRef(0);

  const loadLogs = useRef(async () => {
    try {
      const { data } = await api.get("/api/crawl/logs");
      const entries = data.data?.logs || data.data || data || [];
      setLogs(Array.isArray(entries) ? entries : []);
    } catch {
      // silent — server may not have crawl endpoint
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    loadLogs.current();
  }, []);

  useEffect(() => {
    if (!live) return;
    const interval = setInterval(() => loadLogs.current(), 5000);
    return () => clearInterval(interval);
  }, [live]);

  useEffect(() => {
    if (autoScroll && listRef.current && logs.length > prevLengthRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevLengthRef.current = logs.length;
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter((entry) => {
      if (levelFilter !== "all") {
        const level = statusToLevel(entry.status);
        if (level !== levelFilter) return false;
      }
      if (q) {
        const haystack = `${entry.job_type} ${entry.isbn || ""} ${entry.source || ""} ${entry.error_msg || ""} ${entry.status}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, levelFilter, search]);

  const handleClear = () => {
    setLogs([]);
  };

  const handleCopy = () => {
    const text = filteredLogs.map((e) =>
      `[${formatTime(e.started_at)}] [${e.status.toUpperCase()}] ${e.job_type} — ${e.error_msg || `${e.books_found || 0} books`}`
    ).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const activeLevelCounts = useMemo(() => {
    const counts = {};
    logs.forEach((e) => {
      const l = statusToLevel(e.status);
      counts[l] = (counts[l] || 0) + 1;
    });
    return counts;
  }, [logs]);

  return (
    <div className="log-viewer">
      <div className="log-toolbar">
        <div className="log-toolbar-row">
          <div className="log-search-wrap">
            <i className="ti ti-search" />
            <input
              className="log-search-input"
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="log-search-clear" onClick={() => setSearch("")}>
                <i className="ti ti-x" />
              </button>
            )}
          </div>

          <div className="log-level-filters">
            {LEVELS.map((l) => (
              <button
                key={l}
                className={`log-level-btn${levelFilter === l ? " active" : ""}`}
                onClick={() => setLevelFilter(l)}
              >
                <span className={`log-level-dot log-dot-${l === "all" ? "info" : l}`}>{LEVEL_ICONS[l]}</span>
                {LEVEL_LABELS[l]}
                {activeLevelCounts[l] > 0 && <span className="log-level-count">{activeLevelCounts[l]}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="log-toolbar-row log-toolbar-actions">
          <label className="log-toggle">
            <input type="checkbox" checked={autoScroll} onChange={() => setAutoScroll(!autoScroll)} />
            <span className="log-toggle-track"><span className="log-toggle-thumb" /></span>
            Auto-scroll
          </label>
          <label className="log-toggle">
            <input type="checkbox" checked={compact} onChange={() => setCompact(!compact)} />
            <span className="log-toggle-track"><span className="log-toggle-thumb" /></span>
            Compact
          </label>
          <label className="log-toggle">
            <input type="checkbox" checked={live} onChange={() => setLive(!live)} />
            <span className="log-toggle-track"><span className="log-toggle-thumb" /></span>
            Live
          </label>
          <div className="log-toolbar-spacer" />
          <button className="log-toolbar-btn" onClick={handleCopy} title="Copy visible logs">
            <i className="ti ti-clipboard" /> Copy
          </button>
          <button className="log-toolbar-btn" onClick={handleClear} title="Clear all logs">
            <i className="ti ti-trash" /> Clear
          </button>
        </div>
      </div>

      <div className="log-list" ref={listRef}>
        {loading ? (
          <div className="log-empty">
            <div className="log-empty-icon"><i className="ti ti-loader" /></div>
            <div className="log-empty-text">Loading logs...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="log-empty">
            <div className="log-empty-icon"><i className="ti ti-terminal-2" /></div>
            <div className="log-empty-text">
              {logs.length === 0 ? "No logs yet. Crawl jobs will appear here." : "No logs match your filter."}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredLogs.map((entry) => (
              <LogEntry key={entry.id} entry={entry} compact={compact} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <LogCountBar
        total={logs.length}
        filtered={filteredLogs.length}
        liveSince={live ? "now" : null}
        onClear={handleClear}
      />
    </div>
  );
}
