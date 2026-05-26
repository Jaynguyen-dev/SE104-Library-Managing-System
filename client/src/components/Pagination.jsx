import { motion } from "framer-motion";

export default function Pagination({ page, pages, total, onPageChange, loading }) {
  if (pages <= 1) return null;

  return (
    <motion.div
      className="pagination-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <span className="pagination-info">
        Page {page} of {pages} ({total} total)
      </span>
      <div className="pagination-actions">
        <motion.button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="btn btn-ghost btn-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <i className="ti ti-chevron-left"></i> Previous
        </motion.button>
        <motion.button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages || loading}
          className="btn btn-ghost btn-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Next <i className="ti ti-chevron-right"></i>
        </motion.button>
      </div>
    </motion.div>
  );
}
