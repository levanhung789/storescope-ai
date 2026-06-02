"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const ParticleSphere = dynamic(() => import("./ParticleSphere"), { ssr: false });

export default function Hero() {
  return (
    <section style={{ background: "#080808", overflow: "hidden" }}>

      {/* ── Hero split ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "80px 24px 72px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }} className="hero-grid">

        {/* Left: text */}
        <div className="animate-fade-up" style={{ opacity: 0 }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, letterSpacing: "0.04em" }}>NEW FEATURE — Now live on ARC Testnet</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", color: "#f0f0f0", marginBottom: 20, margin: "0 0 20px" }}>
            Streamline your<br />
            retail analytics,<br />
            <span style={{ color: "#a78bfa" }}>StoreScope AI</span><br />
            is the leading solution.
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.7, maxWidth: 460, marginBottom: 32, margin: "0 0 32px" }}>
            Transform shelf photos into structured retail intelligence — brand detection, SKU classification, stock alerts, and competitor analysis for FMCG teams.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
            <Link href="/dashboard/analysis"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#7c3aed", color: "#fff", borderRadius: 999, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "background 0.2s, transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              Get started →
            </Link>
            <Link href="/dashboard"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "transparent", color: "#888", border: "1px solid #2a2a2a", borderRadius: 999, fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s, border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f0f0f0"; e.currentTarget.style.borderColor = "#555"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#2a2a2a"; }}>
              View Dashboard
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex" }}>
              {["#7c3aed","#10b981","#3b82f6","#f59e0b"].map((c,i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: "2px solid #080808", marginLeft: i > 0 ? -8 : 0, flexShrink: 0 }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: "#555" }}>Trusted by <strong style={{ color: "#888" }}>500+ retailers</strong> & consumer teams</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
              <span style={{ fontSize: 12, color: "#555", marginLeft: 4 }}>4.7 of 5</span>
            </div>
          </div>
        </div>

        {/* Right: visual */}
        <div className="hero-visual animate-fade-up delay-150" style={{ opacity: 0, position: "relative" }}>
          {/* Main visual card */}
          <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 20, overflow: "hidden", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {/* Particle sphere as background visual */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.7 }}>
              <ParticleSphere />
            </div>
            {/* Overlay stats */}
            <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, zIndex: 2 }}>
              {[
                { label: "Detection Rate", value: "98%", color: "#4ade80" },
                { label: "SKUs Matched",   value: "50K+", color: "#a78bfa" },
                { label: "Faster",         value: "12×",  color: "#f59e0b" },
                { label: "AI Stages",      value: "6",    color: "#60a5fa" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badge */}
          <div style={{ position: "absolute", top: -16, right: -16, background: "#111", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, letterSpacing: "0.06em" }}>ON-CHAIN ✓</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>ARC Testnet</div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { order: -1; }
        }
      `}</style>
    </section>
  );
}
