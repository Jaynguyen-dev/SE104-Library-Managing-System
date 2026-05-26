import { useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../contexts/AuthContext";

gsap.registerPlugin(ScrollTrigger);

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/my-dashboard": "My Dashboard",
  "/books": "Books",
  "/books/new": "Add Book",
  "/users": "Members",
  "/users/new": "Add Member",
  "/borrows": "Borrows",
  "/borrows/new": "New Borrow",
  "/fines": "Fines",
  "/billing": "Billing & Revenue",
  "/wallet": "My Wallet",
  "/fines/my": "My Fines",
  "/profile/history": "My History",
  "/reservations": "My Reservations",
  "/logs": "System Logs",
};

const ADMIN_NAV = [
  { section: "Overview", items: [
    { icon: "ti ti-layout-dashboard", label: "Dashboard", to: "/dashboard" },
  ]},
  { section: "Catalogue", items: [
    { icon: "ti ti-books", label: "Books", to: "/books" },
    { icon: "ti ti-users", label: "Members", to: "/users" },
  ]},
  { section: "Transactions", items: [
    { icon: "ti ti-arrow-left-right", label: "Borrows", to: "/borrows" },
    { icon: "ti ti-receipt", label: "Fines", to: "/fines" },
    { icon: "ti ti-coin", label: "Billing", to: "/billing" },
  ]},
  ];

const LIBRARIAN_NAV = [
  { section: "Overview", items: [
    { icon: "ti ti-layout-dashboard", label: "Dashboard", to: "/dashboard" },
  ]},
  { section: "Catalogue", items: [
    { icon: "ti ti-books", label: "Books", to: "/books" },
  ]},
  { section: "Transactions", items: [
    { icon: "ti ti-arrow-left-right", label: "Borrows", to: "/borrows" },
    { icon: "ti ti-receipt", label: "Fines", to: "/fines" },
  ]},
  ];

const READER_NAV = [
  { section: "Overview", items: [
    { icon: "ti ti-layout-dashboard", label: "Dashboard", to: "/my-dashboard" },
  ]},
  { section: "Catalogue", items: [
    { icon: "ti ti-books", label: "Browse Books", to: "/books" },
  ]},
  { section: "Account", items: [
    { icon: "ti ti-wallet", label: "My Wallet", to: "/wallet" },
    { icon: "ti ti-history", label: "My History", to: "/profile/history" },
    { icon: "ti ti-receipt", label: "My Fines", to: "/fines/my" },
    { icon: "ti ti-clock", label: "Reservations", to: "/reservations" },
  ]},
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarClass(role) {
  if (role === "librarian") return "";
  if (role === "user") return "green";
  return "amber";
}

function NavItem({ item, isActive }) {
  const itemRef = useRef(null);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const link = el.querySelector(".nav-item");
    if (!link) return;
    const enter = () => gsap.to(link, { x: 3, color: "#fff", duration: 0.2, ease: "power1.out" });
    const leave = () => gsap.to(link, { x: 0, color: "", duration: 0.2, ease: "power1.out" });
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div ref={itemRef}>
      <Link
        to={item.to}
        className={`nav-item${isActive ? " active" : ""}`}
      >
        <i className={item.icon} aria-hidden="true"></i>
        {item.label}
      </Link>
    </div>
  );
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!sidebarRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(".nav-item", { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, delay: 0.15, ease: "power2.out" });
      gsap.to(".topbar-title", {
        opacity: 0.6, duration: 0.3,
        scrollTrigger: {
          trigger: ".content", start: "top 40px", end: "top 100px",
          scrub: 0.5, toggleActions: "play none none reverse",
        },
      });
    }, sidebarRef.current);

    const logoEls = sidebarRef.current.querySelectorAll(".sidebar-logo-icon");
    const enterFn = (e) => { const el = e.currentTarget; gsap.to(el, { rotation: 6, scale: 1.06, duration: 0.25, ease: "power1.out" }); };
    const leaveFn = (e) => { const el = e.currentTarget; gsap.to(el, { rotation: 0, scale: 1, duration: 0.25, ease: "power1.out" }); };
    logoEls.forEach((el) => {
      el.addEventListener("mouseenter", enterFn);
      el.addEventListener("mouseleave", leaveFn);
    });

    return () => {
      ctx.kill();
      logoEls.forEach((el) => {
        el.removeEventListener("mouseenter", enterFn);
        el.removeEventListener("mouseleave", leaveFn);
      });
    };
  }, []);

  const activePath = location.pathname;
  const topbarTitle = PAGE_TITLES[activePath] || "Dashboard";
  const isReader = user?.role === "user";
  const isAdmin = user?.role === "librarian";
  const navSections = isReader ? READER_NAV : isAdmin ? ADMIN_NAV : LIBRARIAN_NAV;

  return (
    <div className="shell">
      <motion.nav
        ref={sidebarRef}
        className="sidebar"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="sidebar-logo">
          <motion.div
            className="sidebar-logo-icon"
            whileHover={{ rotate: 8, scale: 1.06 }}
          >
            <img src="/logo.svg" alt="LibraryLMS" className="sidebar-logo-img" />
          </motion.div>
          <span>LibraryLMS</span>
        </div>

        {navSections.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-label">{section.section}</div>
            {section.items.map((item) => {
              const isActive = activePath === item.to || activePath.startsWith(item.to + "/");
              return <NavItem key={item.to} item={item} isActive={isActive} />;
            })}
          </div>
        ))}

        <div className="sidebar-user">
          <motion.div
            className={`avatar${user ? ` ${getAvatarClass(user.role)}` : ""}`}
            whileHover={{ scale: 1.1 }}
          >
            {user ? getInitials(user.full_name) : "?"}
          </motion.div>
          <span style={{ flex: 1, lineHeight: 1.3 }}>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500 }}>{user?.full_name || "User"}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}</div>
          </span>
          <motion.button
            onClick={handleLogout}
            className="icon-btn"
            title="Sign Out"
            style={{ border: "none", width: "28px", height: "28px", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", borderRadius: "8px" }}
            whileHover={{ color: "#fff", background: "rgba(255,255,255,0.12)" }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="ti ti-logout"></i>
          </motion.button>
        </div>
      </motion.nav>

      <div className="main">
        <div className="topbar">
          <motion.span
            className="topbar-title"
            key={topbarTitle}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {topbarTitle}
          </motion.span>
        </div>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
