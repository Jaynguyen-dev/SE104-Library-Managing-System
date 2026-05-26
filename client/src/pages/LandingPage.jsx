import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../contexts/AuthContext";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { icon: "ti ti-books", title: "Catalog Management", desc: "Manage your entire book collection with ease — add, edit, search, and track inventory in real time." },
  { icon: "ti ti-arrow-left-right", title: "Borrow & Return", desc: "Streamlined checkout and return workflows with automatic due-date tracking and overdue alerts." },
  { icon: "ti ti-clock", title: "Reservations", desc: "Readers can reserve unavailable books and get notified when copies become available." },
  { icon: "ti ti-receipt", title: "Fine Management", desc: "Automated fine calculation for overdue items with integrated wallet payments." },
  { icon: "ti ti-report-analytics", title: "Analytics & Reports", desc: "Comprehensive dashboards with circulation stats, category insights, and revenue tracking." },
  { icon: "ti ti-wallet", title: "Digital Wallet", desc: "Built-in credit system for fines and donations — no cash handling needed." },
];

const STATS = [
  { value: "10K+", label: "Books Managed" },
  { value: "500+", label: "Active Members" },
  { value: "99.9%", label: "Uptime" },
  { value: "5K+", label: "Borrows Tracked" },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (user) {
      navigate(user.role === "user" ? "/my-dashboard" : "/dashboard", { replace: true });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const triggers = [];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".landing-hero .reveal-up", { opacity: 0, y: 40, duration: 0.8, stagger: 0.12 });
      tl.from(".landing-nav", { opacity: 0, y: -16, duration: 0.5 }, 0);

      gsap.to(".landing-hero-bg", {
        y: 30, scale: 1.04, duration: 0.5,
        scrollTrigger: { trigger: ".landing-hero", start: "top top", end: "bottom top", scrub: 1, toggleActions: "play none none reverse" },
      });
    }, heroRef.current);

    triggers.push(ScrollTrigger.create({
      trigger: featuresRef.current,
      start: "top 82%",
      onEnter: () => {
        gsap.from(featuresRef.current.querySelectorAll(".feature-card"), {
          opacity: 0,
          y: 30,
          duration: 0.5,
          stagger: 0.07,
          ease: "power2.out",
        });
      },
      once: true,
    }));

    triggers.push(ScrollTrigger.create({
      trigger: statsRef.current,
      start: "top 85%",
      onEnter: () => {
        gsap.from(statsRef.current.querySelectorAll(".stat-number"), {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        });
      },
      once: true,
    }));

    triggers.push(ScrollTrigger.create({
      trigger: ctaRef.current,
      start: "top 85%",
      onEnter: () => {
        gsap.from(ctaRef.current.querySelector(".cta-content"), {
          opacity: 0,
          y: 30,
          scale: 0.97,
          duration: 0.6,
          ease: "power3.out",
        });
      },
      once: true,
    }));

    gsap.to(".landing-stats-bg", {
      scale: 1.05, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: ".landing-stats", start: "top 50%", scrub: 1 },
    });

    return () => {
      ctx.kill();
      triggers.forEach((st) => st.kill());
    };
  }, []);

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <img src="/logo.svg" alt="LibraryLMS" className="landing-logo-img" />
          </div>
          <span>LibraryLMS</span>
        </div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <section ref={heroRef} className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-glow" />

        <div className="landing-hero-content">
          <span className="landing-badge reveal-up">
            <i className="ti ti-sparkles" /> Modern Library Management
          </span>
          <h1 className="hero-title reveal-up">
            The Intelligent<br />
            <span className="hero-highlight">Library Platform</span>
          </h1>
          <p className="hero-sub reveal-up">
            A modern, open-source library management system built for schools, universities, and community libraries.
            Streamline cataloging, borrowing, returns, and fines — all in one place.
          </p>
          <div className="hero-cta reveal-up">
            <Link to="/register" className="btn btn-primary" style={{ fontSize: 15, padding: "12px 28px" }}>
              <i className="ti ti-rocket" /> Get Started Free
            </Link>
            <Link to="/login" className="btn btn-ghost" style={{ fontSize: 15, padding: "12px 28px" }}>
              <i className="ti ti-user" /> Sign In
            </Link>
          </div>
        </div>

        <div className="landing-scroll-indicator">
          <i className="ti ti-chevron-down" />
        </div>
      </section>

      <section ref={featuresRef} className="landing-section">
        <div className="landing-section-label">Features</div>
        <h2 className="landing-section-title">Everything you need to run a library</h2>
        <p className="landing-section-desc">
          From catalog management to analytics — LibraryLMS provides a complete toolkit
          for librarians and readers alike.
        </p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">
                <i className={f.icon} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={statsRef} className="landing-section landing-stats">
        <div className="landing-stats-bg" />
        <div className="landing-section-label" style={{ color: "rgba(255,255,255,0.5)" }}>Trusted by</div>
        <h2 className="landing-section-title" style={{ color: "#fff" }}>
          Powering libraries everywhere
        </h2>
        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat-number">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section ref={ctaRef} className="landing-section cta-section">
        <div className="cta-content">
          <div className="landing-section-label" style={{ color: "rgba(0,0,0,0.5)" }}>Get Started</div>
          <h2 className="landing-section-title" style={{ color: "#000" }}>
            Ready to modernize your library?
          </h2>
          <p className="landing-section-desc" style={{ color: "rgba(0,0,0,0.6)" }}>
            Join thousands of institutions using LibraryLMS. Free to start, open-source forever.
          </p>
          <Link to="/register" className="btn" style={{
            background: "#000", color: "#fff", fontSize: 15, padding: "14px 32px",
            borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <i className="ti ti-rocket" /> Create Free Account
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo" style={{ opacity: 0.5 }}>
            <div className="landing-logo-icon" style={{ width: 24, height: 24, fontSize: 12 }}>
              <img src="/logo.svg" alt="LibraryLMS" className="landing-logo-img" style={{ width: 16, height: 16 }} />
            </div>
            <span style={{ fontSize: 13 }}>LibraryLMS</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--sf-text-3)", margin: 0 }}>
            Open-source library management system. Built with React, Node.js, and PostgreSQL.
          </p>
          <p style={{ fontSize: 11, color: "var(--sf-text-3)", margin: "4px 0 0" }}>
            &copy; {new Date().getFullYear()} LibraryLMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
