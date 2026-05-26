import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function LoginLogo() {
  const containerRef = useRef(null);
  const glowRingRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ ease: "power3.out" });

      tl.fromTo(el, { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, duration: 0.7 });

      const leftPage = el.querySelector(".logo-page-l");
      const rightPage = el.querySelector(".logo-page-r");
      if (leftPage) gsap.set(leftPage, { transformOrigin: "right center", scaleX: 0 });
      if (rightPage) gsap.set(rightPage, { transformOrigin: "left center", scaleX: 0 });

      tl.to([leftPage, rightPage], { scaleX: 1, duration: 0.55, ease: "back.out(1.7)" }, "-=0.35");

      const spine = el.querySelector(".logo-spine");
      if (spine) {
        const len = spine.getTotalLength();
        gsap.set(spine, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(spine, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, "-=0.15");
      }
    }, el);

    const ambient = gsap.timeline({ repeat: -1, yoyo: true, ease: "sine.inOut" });
    ambient.to(el, { y: -2, duration: 5 }).to(el, { y: 0, duration: 5 });

    return () => { ctx.kill(); ambient.kill(); };
  }, []);

  const handleMouseEnter = () => {
    const el = containerRef.current;
    if (!el) return;
    gsap.to(el, { scale: 1.03, duration: 0.35, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    const el = containerRef.current;
    if (!el) return;
    gsap.to(el, { scale: 1, rotateX: 0, rotateY: 0, duration: 0.45, ease: "power2.out" });
    if (glowRingRef.current) gsap.to(glowRingRef.current, { opacity: 0, duration: 0.3 });
  };

  const handleMouseMove = (e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, { rotateX: -y * 4, rotateY: x * 4, duration: 0.5, ease: "power2.out" });
    if (glowRingRef.current) {
      gsap.to(glowRingRef.current, {
        x: x * 1.5, y: y * 1.5, opacity: 0.12, duration: 0.5, ease: "power2.out",
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        width: 64, height: 64, margin: "0 auto 22px",
        cursor: "pointer", perspective: "500px",
      }}
    >
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
        <defs>
          <radialGradient id="bg" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#1ed760"/>
            <stop offset="60%" stopColor="#0b3a25"/>
            <stop offset="100%" stopColor="#06130d"/>
          </radialGradient>
          <linearGradient id="page" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eafff2"/>
            <stop offset="100%" stopColor="#c8f7dc"/>
          </linearGradient>
        </defs>

        <circle cx="32" cy="32" r="30" fill="url(#bg)"/>
        <circle cx="32" cy="32" r="26" fill="none" stroke="#1ed760" strokeOpacity="0.25" strokeWidth="0.75"/>

        <path d="M 21 22.5 C 25 20, 29.5 20.5, 32 23 C 34.5 20.5, 39 20, 43 22.5 L 43 43 C 39 41, 34.5 41, 32 43 C 29.5 41, 25 41, 21 43 Z" fill="#0b1a12"/>

        <path className="logo-page-l" d="M 32 23 C 29.5 21, 25.5 22, 23 24.5 L 23 42 C 25.5 40, 29.5 39.5, 32 41 Z" fill="url(#page)"/>
        <path className="logo-page-r" d="M 32 23 C 34.5 21, 38.5 22, 41 24.5 L 41 42 C 38.5 40, 34.5 39.5, 32 41 Z" fill="#dffbea"/>

        <line className="logo-spine" x1="32" y1="23.5" x2="32" y2="41" stroke="#0b1a12" strokeWidth="0.4" opacity="0.4"/>

        <circle ref={glowRingRef} cx="32" cy="32" r="29" fill="none" stroke="rgba(30,215,96,0.15)" strokeWidth="0.5" opacity="0"/>
      </svg>
    </div>
  );
}
