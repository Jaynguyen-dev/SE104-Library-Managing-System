import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "power2.out", duration: 0.5 });

// ─── Parallax ──────────────────────────────────────────────

export function createParallax(container, layers, config = {}) {
  const { smoothness = 0.5 } = config;
  layers.forEach(({ el, speed }) => {
    gsap.to(el, {
      y: () => (speed - 1) * 100 + "%",
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: smoothness,
      },
    });
  });
}

export function parallaxLayer(el, speed = 0.5, smoothness = 0.5) {
  return gsap.to(el, {
    y: () => (1 - speed) * window.innerHeight * -1,
    ease: "none",
    scrollTrigger: {
      trigger: el.parentElement,
      start: "top bottom",
      end: "bottom top",
      scrub: smoothness,
    },
  });
}

// ─── ScrollTrigger Section Reveals ────────────────────────

export function revealSection(selector, config = {}) {
  const { y = 40, delay = 0, duration = 0.6, start = "top 85%", toggleActions = "play none none reverse" } = config;
  return gsap.fromTo(
    selector,
    { opacity: 0, y },
    { opacity: 1, y: 0, duration, delay, scrollTrigger: { trigger: selector, start, toggleActions } }
  );
}

export function revealStagger(selector, config = {}) {
  const { y = 30, staggerEach = 0.06, duration = 0.45, start = "top 85%", delay = 0 } = config;
  return gsap.fromTo(
    selector,
    { opacity: 0, y },
    {
      opacity: 1, y: 0, duration,
      stagger: { each: staggerEach, from: "start" },
      delay,
      scrollTrigger: { trigger: selector, start, toggleActions: "play none none reverse" },
    }
  );
}

export function revealTimeline(steps) {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: steps[0]?.trigger || "body", start: "top 80%", toggleActions: "play none none reverse" },
  });
  steps.forEach(({ target, vars, position }) => {
    tl.fromTo(target, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ...vars }, position);
  });
  return tl;
}

// ─── Microinteractions ─────────────────────────────────────

export function hoverBtn(el) {
  const enter = () => gsap.to(el, { scale: 1.04, y: -2, duration: 0.2, ease: "power1.out" });
  const leave = () => gsap.to(el, { scale: 1, y: 0, duration: 0.2, ease: "power1.out" });
  el.addEventListener("mouseenter", enter);
  el.addEventListener("mouseleave", leave);
  return () => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); };
}

export function hoverCard(el, liftY = -6) {
  const enter = () => gsap.to(el, { y: liftY, boxShadow: "0 12px 40px rgba(0,0,0,0.35)", duration: 0.3, ease: "power2.out" });
  const leave = () => gsap.to(el, { y: 0, boxShadow: "none", duration: 0.3, ease: "power2.out" });
  el.addEventListener("mouseenter", enter);
  el.addEventListener("mouseleave", leave);
  return () => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); };
}

export function focusInput(el) {
  const focus = () => gsap.to(el, { boxShadow: "0 0 0 2px var(--sf-accent), 0 0 16px rgba(30, 215, 96, 0.2)", duration: 0.25, ease: "power1.out" });
  const blur = () => gsap.to(el, { boxShadow: "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset", duration: 0.25, ease: "power1.out" });
  el.addEventListener("focus", focus);
  el.addEventListener("blur", blur);
  return () => { el.removeEventListener("focus", focus); el.removeEventListener("blur", blur); };
}

export function iconFeedback(el) {
  const enter = () => gsap.to(el, { rotation: 8, scale: 1.15, duration: 0.2, ease: "power1.out" });
  const leave = () => gsap.to(el, { rotation: 0, scale: 1, duration: 0.2, ease: "power1.out" });
  el.addEventListener("mouseenter", enter);
  el.addEventListener("mouseleave", leave);
  return () => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); };
}

// ─── Legacy helpers (preserved) ────────────────────────────

export function fadeIn(el, delay = 0, duration = 0.4) {
  return gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration, delay });
}

export function fadeInUp(el, delay = 0, duration = 0.5) {
  return gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration, delay });
}

export function fadeInScale(el, delay = 0, duration = 0.4) {
  return gsap.fromTo(el, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration, delay });
}

export function slideInLeft(el, delay = 0, duration = 0.4) {
  return gsap.fromTo(el, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration, delay });
}

export function staggerFadeIn(elements, staggerEach = 0.06, fromDelay = 0) {
  return gsap.fromTo(elements, { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.45, stagger: { each: staggerEach, from: "start" }, delay: fromDelay });
}

export function staggerCards(elements, staggerEach = 0.05, fromDelay = 0) {
  return gsap.fromTo(elements, { opacity: 0, y: 20, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: { each: staggerEach, from: "start" }, delay: fromDelay });
}

export function staggerTableRows(elements, staggerEach = 0.04, fromDelay = 0) {
  return gsap.fromTo(elements, { opacity: 0, x: -8 },
    { opacity: 1, x: 0, duration: 0.35, stagger: { each: staggerEach, from: "start" }, delay: fromDelay });
}

export function modalOpen(el, duration = 0.3) {
  return gsap.fromTo(el, { opacity: 0, scale: 0.92, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration, ease: "power3.out" });
}

export function modalClose(el, duration = 0.2) {
  return gsap.to(el, { opacity: 0, scale: 0.95, y: 10, duration, ease: "power2.in" });
}

export function staggerNavItems(elements, staggerEach = 0.04, fromDelay = 0.1) {
  return gsap.fromTo(elements, { opacity: 0, x: -12 },
    { opacity: 1, x: 0, duration: 0.3, stagger: { each: staggerEach, from: "start" }, delay: fromDelay });
}

export function entranceTimeline(steps, onComplete) {
  const tl = gsap.timeline({ onComplete, defaults: { duration: 0.4, ease: "power2.out" } });
  steps.forEach((step) => {
    if (Array.isArray(step)) tl.add(step[0], step[1]);
    else tl.add(step, "+=0");
  });
  return tl;
}

export function animateProgressBar(el, widthPct, duration = 0.6, delay = 0) {
  return gsap.fromTo(el, { width: "0%" }, { width: `${widthPct}%`, duration, delay, ease: "power3.out" });
}
