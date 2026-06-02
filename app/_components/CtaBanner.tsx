"use client";

import { useState } from "react";
import Link from "next/link";
import { useInView } from "../_hooks/useInView";

export default function CtaBanner() {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) { setSent(true); setEmail(""); }
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{ padding: "96px 24px", background: "#080808", transition: "opacity 0.8s", opacity: inView ? 1 : 0 }}>

      <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="cta-grid">

        {/* Left: CTA text */}
        <div>
          <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>GET STARTED</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 16px" }}>
            So, are you interested?
          </h2>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 28 }}>
            Enter your email or connect your wallet to access StoreScope AI and start analyzing retail shelves in minutes.
          </p>

          {/* Email form */}
          {!sent ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, maxWidth: 420 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{ flex: 1, padding: "11px 16px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 14, outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
                onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
              />
              <button type="submit"
                style={{ padding: "11px 20px", background: "#7c3aed", border: "none", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#6d28d9")}
                onMouseLeave={e => (e.currentTarget.style.background = "#7c3aed")}>
                Contact Us
              </button>
            </form>
          ) : (
            <div style={{ padding: "12px 20px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 10, fontSize: 14, color: "#4ade80" }}>
              ✅ Thanks! We'll be in touch shortly.
            </div>
          )}

          <p style={{ fontSize: 12, color: "#3a3a3a", marginTop: 14 }}>
            Or{" "}
            <Link href="/dashboard" style={{ color: "#7c3aed", textDecoration: "none" }}>connect your wallet →</Link>
            {" "}to start immediately.
          </p>
        </div>

        {/* Right: visual with glow */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Glow orb */}
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)", filter: "blur(40px)" }} />
          {/* Brand mark */}
          <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
            <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.05em", color: "#f0f0f0", lineHeight: 1 }}>
              store<span style={{ color: "#7c3aed" }}>scope</span>
            </div>
            <div style={{ fontSize: 18, color: "#555", letterSpacing: "0.04em", marginTop: 8 }}>.ai</div>
            {/* Stats */}
            <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 32 }}>
              {[
                { v: "500+", l: "Retailers" },
                { v: "50K", l: "SKUs" },
                { v: "98%", l: "Accuracy" },
              ].map(s => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.02em" }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .cta-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) { .cta-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
      `}</style>
    </section>
  );
}
