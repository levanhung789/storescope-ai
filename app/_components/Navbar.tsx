"use client";

import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLang } from "../_lib/i18n";

export default function Navbar() {
  const { t } = useLang();
  const links = [
    { labelKey: "nav.home",    href: "/" },
    { labelKey: "services",    href: "#services",     label: t("nav.home") === "Home" ? "Services" : t("nav.home") === "首页" ? "服务" : "Dịch vụ" },
    { labelKey: "how",         href: "#how-it-works", label: t("how.title") },
    { labelKey: "nav.forum",   href: "/forum" },
    { labelKey: "nav.contact", href: "/contact" },
  ].map(l => ({ ...l, label: l.label ?? t(l.labelKey) }));

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "background 0.4s, border-color 0.4s",
        background: scrolled ? "rgba(0,0,0,0.75)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 32px",
          height: 104,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", transition: "opacity 0.2s", marginLeft: "-151px" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="StoreScope AI"
            style={{ height: 82, width: "auto", objectFit: "contain", filter: "invert(1)" }}
          />
        </a>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 36 }} className="nav-desktop">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: 17,
                fontWeight: 400,
                color: "rgba(255,255,255,0.45)",
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA + Language */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LanguageSwitcher variant="navbar" />
          <a
            href="/login"
            style={{
              fontSize: 13, fontWeight: 600, color: "#fff", background: "#7c3aed",
              padding: "9px 22px", borderRadius: 999, textDecoration: "none",
              letterSpacing: "0.01em", transition: "background 0.25s, transform 0.2s, box-shadow 0.25s", display: "inline-block",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.transform = "translateY(-1px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.35)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {t("nav.getStarted")}
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "rgba(255,255,255,0.7)",
              display: "none",
            }}
            className="nav-mobile-btn"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" /></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: "rgba(0,0,0,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px 20px" }}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{ display: "block", padding: "11px 0", fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
