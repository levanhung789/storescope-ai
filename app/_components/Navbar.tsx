"use client";

import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLang } from "../_lib/i18n";

// ── Animated nav link ─────────────────────────────────────────────────────────
function NavLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number; life: number }[]>([]);

  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setHovered(true);
    // Spawn sparkle particles from cursor position
    const rect = e.currentTarget.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const newP = Array.from({ length: 6 }, (_, i) => ({
      id:   Date.now() + i,
      x:    mx, y: my,
      vx:   (Math.random() - 0.5) * 3,
      vy:   -(Math.random() * 2 + 1),
      life: 1,
    }));
    setParticles(newP);
  };

  const handleLeave = () => {
    setHovered(false);
    setParticles([]);
  };

  return (
    <a
      href={href}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: "relative",
        fontSize: 15,
        fontWeight: hovered ? 500 : 400,
        color: hovered ? "#fff" : "rgba(255,255,255,0.45)",
        textDecoration: "none",
        letterSpacing: "0.01em",
        transition: "color 0.25s, font-weight 0.2s",
        padding: "4px 0",
        display: "inline-block",
      }}
    >
      {/* Sparkle particles */}
      {particles.map(p => (
        <span key={p.id} style={{
          position: "absolute",
          left: p.x, top: p.y,
          width: 3, height: 3,
          borderRadius: "50%",
          background: "#a78bfa",
          pointerEvents: "none",
          animation: "sparkleFloat 0.6s ease-out forwards",
          transform: `translate(${p.vx * 10}px, ${p.vy * 10}px)`,
        }} />
      ))}

      {/* Letter-by-letter highlight effect */}
      <span style={{ position: "relative", display: "inline-block" }}>
        {label.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              transition: `transform 0.2s ease ${i * 25}ms, color 0.2s ease ${i * 25}ms`,
              transform: hovered ? "translateY(-2px)" : "translateY(0)",
              color: hovered
                ? `hsl(${260 + i * 10}, 80%, ${75 + i * 2}%)`
                : "inherit",
            }}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>

      {/* Underline slide-in */}
      <span style={{
        position: "absolute",
        bottom: 0, left: 0,
        height: 1.5,
        width: hovered ? "100%" : "0%",
        background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
        backgroundSize: "200% 100%",
        borderRadius: 99,
        transition: "width 0.3s ease",
        animation: hovered ? "shimmerLine 1.5s linear infinite" : "none",
      }} />
    </a>
  );
}

export default function Navbar() {
  const { t } = useLang();
  const links = [
    { labelKey: "nav.home",    href: "/" },
    { labelKey: "services",    href: "#services",     label: t("nav.home") === "Home" ? "Services" : t("nav.home") === "首页" ? "服务" : "Dịch vụ" },
    { labelKey: "how",         href: "#how-it-works", label: t("how.title") },
    { labelKey: "nav.forum",   href: "/forum" },
    { labelKey: "nav.contact", href: "/contact" },
  ].map(l => ({ ...l, label: l.label ?? t(l.labelKey) }));

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      transition: "background 0.4s, border-color 0.4s",
      background:    scrolled ? "rgba(0,0,0,0.8)"    : "transparent",
      borderBottom:  scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
      backdropFilter:scrolled ? "blur(20px)"          : "none",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 104,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* Logo */}
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", transition: "opacity 0.2s, transform 0.2s", marginLeft: "-151px" }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1";    e.currentTarget.style.transform = "scale(1)"; }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="StoreScope AI" style={{ height: 82, width: "auto", objectFit: "contain", filter: "invert(1)" }} />
        </a>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 38 }} className="nav-desktop">
          {links.map(l => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        {/* CTA + Language */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LanguageSwitcher variant="navbar" />

          <a href="/login" style={{
            fontSize: 13, fontWeight: 600, color: "#fff",
            background: "linear-gradient(135deg,#7c3aed,#6366f1)",
            padding: "9px 22px", borderRadius: 999, textDecoration: "none",
            letterSpacing: "0.01em",
            transition: "transform 0.2s, box-shadow 0.25s, background 0.3s",
            display: "inline-block", position: "relative", overflow: "hidden",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(124,58,237,0.45)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {t("nav.getStarted")}
          </a>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.7)", display: "none" }}
            className="nav-mobile-btn" aria-label="Toggle menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: "rgba(0,0,0,0.96)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px 20px" }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ display: "block", padding: "11px 0", fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {l.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @keyframes sparkleFloat {
          0%   { opacity:1; transform:translate(0,0) scale(1); }
          100% { opacity:0; transform:translate(var(--vx,8px), -20px) scale(0); }
        }
        @keyframes shimmerLine {
          0%   { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @media (max-width: 640px) {
          .nav-desktop     { display: none !important; }
          .nav-mobile-btn  { display: block !important; }
        }
      `}</style>
    </header>
  );
}
