import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import gsap from "gsap";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import LoginLogo from "../components/LoginLogo";

/* ── Fixed particle positions ── */
const PARTICLES = [
  { left: 12, top: 18, size: 2.5, duration: 22, delay: 0 },
  { left: 75, top: 10, size: 1.5, duration: 26, delay: 3 },
  { left: 50, top: 72, size: 2, duration: 20, delay: 5 },
  { left: 22, top: 88, size: 1.5, duration: 24, delay: 2 },
  { left: 85, top: 50, size: 2, duration: 28, delay: 6 },
  { left: 38, top: 40, size: 1.5, duration: 18, delay: 4 },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const panelRef = useRef(null);
  const cameraRef = useRef(null);
  const bgRef = useRef(null);
  const quoteRef = useRef(null);

  const mouse = useRef({ x: 0.5, y: 0.5 });
  const mouseCur = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);

  const handleMouseMove = (e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouse.current.x = (e.clientX - rect.left) / rect.width;
      mouse.current.y = (e.clientY - rect.top) / rect.height;
    });
  };

  useEffect(() => {
    if (!pageRef.current) return;
    let tickerFn;
    let ambientTl;
    const qs = {};

    const ctx = gsap.context(() => {
      /* ── Entrance timeline ── */
      gsap.timeline({ defaults: { ease: "expo.out" } })
        .fromTo(panelRef.current, { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 1.2 })
        .fromTo(cameraRef.current, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.6, ease: "power3.out" }, "-=1")
        .fromTo(quoteRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.5");

      /* ── Ambient camera drift ── */
      ambientTl = gsap.timeline({ repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2 })
        .to(cameraRef.current, { scale: 1.02, x: -6, y: -4, duration: 30 })
        .to(cameraRef.current, { scale: 1.02, x: -3, y: -2, duration: 20 })
        .to(cameraRef.current, { scale: 1, x: 0, y: 0, duration: 30 });

      /* ── Light streaks ── */
      gsap.to(".hero-light-streak-1", {
        x: 180, opacity: 0.06, duration: 20, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
      gsap.to(".hero-light-streak-2", {
        x: -120, y: 60, opacity: 0.04, duration: 25, repeat: -1, yoyo: true, ease: "sine.inOut",
      });

      /* ── Particles ── */
      const particles = heroRef.current?.querySelectorAll(".hero-particle");
      if (particles) {
        particles.forEach((p, i) => {
          gsap.to(p, {
            y: gsap.utils.random(-16, 16),
            x: gsap.utils.random(-10, 10),
            opacity: gsap.utils.random(0.06, 0.18),
            duration: PARTICLES[i]?.duration || 20,
            repeat: -1, yoyo: true, ease: "sine.inOut",
            delay: PARTICLES[i]?.delay || 0,
          });
        });
      }

      /* ── Ambient glow ── */
      gsap.to(".hero-ambient-glow", {
        scale: 1.08, opacity: 0.5, duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut",
      });

      /* ── Mouse parallax on bg ── */
      if (bgRef.current) {
        qs.bgX = gsap.quickSetter(bgRef.current, "x");
        qs.bgY = gsap.quickSetter(bgRef.current, "y");
      }

      tickerFn = () => {
        mouseCur.current.x += (mouse.current.x - mouseCur.current.x) * 0.05;
        mouseCur.current.y += (mouse.current.y - mouseCur.current.y) * 0.05;

        const mx = (mouseCur.current.x - 0.5) * 2;
        const my = (mouseCur.current.y - 0.5) * 2;

        if (qs.bgX) { qs.bgX(mx * 10); qs.bgY(my * 10); }
      };
      gsap.ticker.add(tickerFn);
    }, pageRef.current);

    return () => {
      gsap.ticker.remove(tickerFn);
      if (ambientTl) ambientTl.kill();
      ctx.kill();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      const userData = data.data?.user;
      if (!userData) { setError("Invalid response from server"); setLoading(false); return; }
      login(data.data.token, userData);
      navigate(userData.role === "user" ? "/my-dashboard" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="login-page">
      {/* ─── LEFT: CINEMATIC LIBRARY SHOWCASE ─── */}
      <div ref={heroRef} className="login-hero" onMouseMove={handleMouseMove}>
        {/* Camera layer: ambient drift wrapper */}
        <div ref={cameraRef} className="hero-camera-layer">
          <div
            ref={bgRef}
            className="hero-bg"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1920&q=80)",
            }}
          />
        </div>

        {/* Cinematic overlay */}
        <div className="hero-overlay" />

        {/* Animated light streaks */}
        <div className="hero-light-streaks" aria-hidden="true">
          <div className="hero-light-streak hero-light-streak-1" />
          <div className="hero-light-streak hero-light-streak-2" />
        </div>

        {/* Ambient glow */}
        <div className="hero-ambient-glow" aria-hidden="true" />

        {/* Floating dust motes */}
        <div className="hero-particles" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="hero-particle"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
            />
          ))}
        </div>

        {/* Glass card quote */}
        <div ref={quoteRef} className="hero-quote">
          <div className="hero-quote-label">University of Information Technology</div>
          <h1 className="hero-quote-title">
            Library <span className="hero-quote-accent">Management</span>
          </h1>
          <p className="hero-quote-sub">Knowledge · Discovery · Innovation</p>
        </div>

        <div className="login-hero-footer">
          &copy; {new Date().getFullYear()} UIT
        </div>
      </div>

      {/* ─── RIGHT: LOGIN PANEL ─── */}
      <div ref={panelRef} className="login-panel-wrap">
        <div className="login-panel">
          <LoginLogo />

          <h2 className="login-panel-title">Welcome back</h2>
          <p className="login-panel-sub">Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-group">
                <i className="ti ti-mail" />
                <input
                  className="login-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-group">
                <i className="ti ti-lock" />
                <input
                  className="login-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Signing in\u2026" : "Sign in"}
            </button>
          </form>

          <p className="login-panel-footer-text">
            Don't have an account?{" "}
            <Link to="/register" className="login-panel-link">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
