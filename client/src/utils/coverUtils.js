export const DEFAULT_COVER = "/default-cover.svg";
const OL = "https://covers.openlibrary.org/b";
const GB = "https://books.google.com/books/content";

export function getCoverSources(book) {
  const sources = [];

  if (book.metadata?.cover_image_url) {
    sources.push(book.metadata.cover_image_url);
  }

  if (book.isbn) {
    sources.push(`${OL}/isbn/${book.isbn}-L.jpg`);
    sources.push(`${OL}/isbn/${book.isbn}-M.jpg`);
    sources.push(`${GB}?vid=ISBN:${book.isbn}&printsec=frontcover&img=1&zoom=1`);
  }

  sources.push(DEFAULT_COVER);

  return sources;
}

const CATEGORY_COLORS = {
  "Fiction": ["#6366f1", "#4f46e5"],
  "Literature": ["#8b5cf6", "#7c3aed"],
  "Fantasy": ["#f59e0b", "#d97706"],
  "Romance": ["#ec4899", "#db2777"],
  "Mystery / Thriller": ["#6b7280", "#4b5563"],
  "Science": ["#06b6d4", "#0891b2"],
  "Technology": ["#3b82f6", "#2563eb"],
  "Computer Science": ["#10b981", "#059669"],
  "Engineering": ["#f97316", "#ea580c"],
  "Education": ["#a855f7", "#9333ea"],
  "History": ["#d97706", "#b45309"],
  "Self-development": ["#14b8a6", "#0d9488"],
  "AI / ML": ["#8b5cf6", "#6d28d9"],
  "Networking": ["#06b6d4", "#0891b2"],
  "Databases": ["#0ea5e9", "#0284c7"],
  "Software Engineering": ["#2563eb", "#1d4ed8"],
  "Mathematics": ["#ef4444", "#dc2626"],
  "English": ["#84cc16", "#65a30d"],
  "UI / UX": ["#f43f5e", "#e11d48"],
  "Cybersecurity": ["#059669", "#047857"],
  "Data Science": ["#0891b2", "#0e7490"],
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || ["#4b5563", "#374151"];
}
