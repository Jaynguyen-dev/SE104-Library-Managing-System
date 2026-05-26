import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import BookCard from "../components/BookCard";
import BorrowModal from "../components/BorrowModal";
import ReserveModal from "../components/ReserveModal";
import Pagination from "../components/Pagination";

gsap.registerPlugin(ScrollTrigger);

function SkeletonGrid() {
  return (
    <div className="book-grid-skeleton">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="book-skeleton-card">
          <div className="book-skeleton-img"></div>
          <div className="book-skeleton-line"></div>
          <div className="book-skeleton-line short"></div>
          <div style={{ height: "8px" }}></div>
        </div>
      ))}
    </div>
  );
}

const CATEGORIES = [
  "All", "Fiction", "Literature", "Fantasy", "Romance",
  "Mystery / Thriller", "Science", "Technology", "Computer Science", "Engineering",
  "Education", "History", "Self-development", "AI / ML", "Networking",
  "Databases", "Software Engineering", "Mathematics", "English",
  "UI / UX", "Cybersecurity", "Data Science",
];

export default function BookListPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("All");
  const [deletingId, setDeletingId] = useState(null);
  const [borrowingBook, setBorrowingBook] = useState(null);
  const [reservingBook, setReservingBook] = useState(null);
  const [userReservations, setUserReservations] = useState({});
  const { user } = useAuth();
  const isStaff = user?.role === "librarian";
  const bookGridRef = useRef(null);

  const fetchBooks = (queryTab, queryPage, querySearch, queryCategory) => {
    const params = { page: queryPage || 1, limit: 20 };
    const effectiveTab = queryTab || tab;
    if (effectiveTab === "available") params.available = "true";
    if (effectiveTab === "borrowed") params.available = "false";
    if (querySearch) params.search = querySearch;
    const effectiveCategory = queryCategory || category;
    if (effectiveCategory && effectiveCategory !== "All") params.category = effectiveCategory;
    api.get("/api/books", { params })
      .then(({ data }) => {
        setBooks(data.data.books);
        setPagination(data.data.pagination || { total: 0, pages: 0 });
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load books"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBooks(tab, 1, search, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, category]);

  useEffect(() => {
    if (!loading && books.length > 0 && bookGridRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".book-card", { opacity: 0, y: 24, scale: 0.97 }, {
          opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.04, ease: "power3.out",
          scrollTrigger: { trigger: ".book-grid", start: "top 88%", toggleActions: "play none none reverse" },
        });

        gsap.fromTo(".section-header", { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, duration: 0.4,
          scrollTrigger: { trigger: ".section-header", start: "top 88%", toggleActions: "play none none reverse" },
        });
      }, bookGridRef.current);
      return () => ctx.kill();
    }
  }, [loading, books]);

  useEffect(() => {
    if (user?.role === "user") {
      api.get("/api/reservations/my")
        .then(({ data }) => {
          const map = {};
          (data.data.reservations || []).forEach((r) => {
            map[r.book_id] = { status: r.status, queue_position: r.queue_position, id: r.id };
          });
          setUserReservations(map);
        })
        .catch(() => {});
    }
  }, [user?.role]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setCategory("All");
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (tab === "available") params.available = "true";
    if (tab === "borrowed") params.available = "false";
    if (search) params.search = search;
    if (category && category !== "All") params.category = category;
    api.get("/api/books", { params })
      .then(({ data }) => {
        setBooks(data.data.books);
        setPagination(data.data.pagination || { total: 0, pages: 0 });
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load books"))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this book?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/books/${id}`);
      toast.success("Book deleted");
      handlePageChange(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete book");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBorrow = useCallback((book) => {
    setBorrowingBook(book);
  }, []);

  const handleBorrowed = useCallback((bookId) => {
    setBooks((prev) => prev.map((b) =>
      b.id === bookId
        ? { ...b, available_quantity: Math.max(0, b.available_quantity - 1) }
        : b
    ));
  }, []);

  const handleReserve = useCallback((book) => {
    setReservingBook(book);
  }, []);

  const handleReserved = useCallback((bookId, reservation) => {
    setUserReservations((prev) => ({
      ...prev,
      [bookId]: { status: "waiting", queue_position: reservation?.queue_position, id: reservation?.id },
    }));
  }, []);

  return (
    <div>
      <div className="section-header">
        <div className="tab-bar">
          <button className={`tab${tab === "all" ? " active" : ""}`} onClick={() => handleTabChange("all")} disabled={loading}>All Books</button>
          <button className={`tab${tab === "available" ? " active" : ""}`} onClick={() => handleTabChange("available")} disabled={loading}>Available</button>
          <button className={`tab${tab === "borrowed" ? " active" : ""}`} onClick={() => handleTabChange("borrowed")} disabled={loading}>Borrowed</button>
        </div>
        {isStaff && (
          <Link to="/books/new" className="btn btn-primary">
            <i className="ti ti-plus" aria-hidden="true"></i> Add Book
          </Link>
        )}
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: "12px" }}>
        <div className="search-wrap" style={{ maxWidth: "420px" }}>
          <i className="ti ti-search" aria-hidden="true"></i>
          <input
            type="text"
            placeholder="Search by title, author, or ISBN…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </form>

      {/* ── Category Chips ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: category === cat ? 700 : 500,
              borderRadius: 20,
              border: category === cat ? "1.5px solid var(--sf-accent)" : "1px solid var(--sf-border)",
              background: category === cat ? "var(--sf-accent-light)" : "transparent",
              color: category === cat ? "var(--sf-accent)" : "var(--sf-text-2)",
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              letterSpacing: "0.01em",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Result Count ── */}
      {!loading && books.length > 0 && pagination.pages > 1 && (
        <div style={{ fontSize: 11, color: "var(--sf-text-2)", marginBottom: 8 }}>
          Page {pagination.page || page} of {pagination.pages}
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : books.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--sf-text-2)" }}>
          {search ? "No books match your search." : "No books found."}
        </div>
      ) : (
        <>
          <div className="book-grid" ref={bookGridRef}>
            {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isStaff={isStaff}
                  onDelete={handleDelete}
                  deleting={deletingId === book.id}
                  onBorrow={isStaff ? undefined : handleBorrow}
                  onReserve={isStaff ? undefined : handleReserve}
                  userReservation={userReservations[book.id] || null}
                />
            ))}
          </div>
          <Pagination page={pagination.page || page} pages={pagination.pages} total={pagination.total} onPageChange={handlePageChange} loading={loading} />

          {borrowingBook && (
            <BorrowModal
              book={borrowingBook}
              onClose={() => setBorrowingBook(null)}
              onBorrowed={handleBorrowed}
            />
          )}
          {reservingBook && (
            <ReserveModal
              book={reservingBook}
              onClose={() => setReservingBook(null)}
              onReserved={handleReserved}
            />
          )}
        </>
      )}
    </div>
  );
}
