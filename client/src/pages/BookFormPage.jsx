import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";

export default function BookFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", category: "", total_quantity: 1 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/api/books/${id}`).then(({ data }) => {
        const b = data.data?.book || {};
        setForm({ title: b.title || "", author: b.author || "", isbn: b.isbn || "", category: b.category || "", total_quantity: b.total_quantity || 1 });
      }).catch(() => {
        toast.error("Failed to load book");
        navigate("/books");
      });
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isEdit && form.isbn && !/^(?:\d{10}|\d{13}|\d{3}-\d{1,5}-\d{1,7}-\d{1,7}-[\dX])$/.test(form.isbn.trim())) {
      setError("Invalid ISBN format (must be 10 or 13 digits)");
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/books/${id}`, form);
      } else {
        await api.post("/api/books", form);
        api.post(`/api/crawl/isbn/${form.isbn}`).catch(() => {});
      }
      toast.success(isEdit ? "Book updated" : "Book created");
      navigate("/books");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div style={{ display: "flex", justifyContent: "center" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="form-card">
        <h1 style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.5px", marginBottom: "20px" }}>
          {isEdit ? "Edit Book" : "Add Book"}
        </h1>
        <form onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{ background: "var(--sf-red-bg)", color: "var(--sf-red)", fontSize: "13px", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" }}
            >{error}</motion.div>
          )}
          {["title", "author", "isbn", "category"].map((field) => (
            <div className="form-row" key={field}>
              <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}</label>
              <input
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          ))}
          <div className="form-row">
            <label className="form-label">Total Quantity</label>
            <input
              type="number"
              name="total_quantity"
              value={form.total_quantity}
              onChange={handleChange}
              min="1"
              className="form-input"
              required
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "14px", borderRadius: "10px", marginTop: "4px" }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? "Saving…" : isEdit ? "Update Book" : "Add Book"}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
