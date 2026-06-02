"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = ["ALL", "AI Analysis", "Vision Agent", "AI Agent", "Layout Editor", "Marketplace", "On-Chain"];

const FEATURES = [
  {
    cat: "AI Analysis",
    tag: "Vision AI",
    title: "Shelf & SKU Detection",
    desc: "Detect every product on shelf with bounding-box precision. Brand recognition, out-of-stock alerts, and planogram compliance.",
    href: "/dashboard/analysis",
    badge: "Most Popular",
    badgeColor: "#7c3aed",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m9 8 3 3 3-3"/>
      </svg>
    ),
  },
  {
    cat: "Vision Agent",
    tag: "8-Step Pipeline",
    title: "Vision Agent",
    desc: "End-to-end FMCG analysis pipeline: upload → detect → classify → normalize → match → score → report → store on-chain.",
    href: "/dashboard/vision-agent",
    badge: "New",
    badgeColor: "#10b981",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/><path d="M20.188 10.934c.388.472.612.977.612 1.491 0 .514-.224 1.019-.612 1.491m-16.376 0C3.424 13.444 3.2 12.939 3.2 12.425c0-.514.224-1.019.612-1.491"/><path d="M17.657 7.757a10 10 0 0 0-11.314 0"/>
      </svg>
    ),
  },
  {
    cat: "AI Agent",
    tag: "Autonomous",
    title: "AI Agent",
    desc: "Autonomous retail analytics agent powered by Circle USDC micro-payments. Set policy, run analyses, collect on-chain proofs.",
    href: "/dashboard/agent",
    badge: null,
    badgeColor: "#3b82f6",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    cat: "Layout Editor",
    tag: "3D Planning",
    title: "Store Layout Editor",
    desc: "3D store layout planning with satellite map import, fixture placement, and zone optimization. Export to NFT on ARC.",
    href: "/layout-editor",
    badge: null,
    badgeColor: "#f59e0b",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    cat: "Marketplace",
    tag: "Data Trading",
    title: "Forum & Marketplace",
    desc: "Buy and sell FMCG analysis data with Circle USDC. Verified datasets from real shelf audits, backed by on-chain proofs.",
    href: "/forum",
    badge: "Live",
    badgeColor: "#4ade80",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    cat: "On-Chain",
    tag: "Blockchain",
    title: "On-Chain Recording",
    desc: "Every analysis result is hashed and recorded on ARC Testnet via AnalysisRegistry smart contract. Immutable proof of data integrity.",
    href: "/dashboard",
    badge: null,
    badgeColor: "#8b5cf6",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="12" x2="12" y2="12"/>
      </svg>
    ),
  },
];

export default function FeaturesGrid() {
  const [active, setActive] = useState("ALL");

  const filtered = active === "ALL" ? FEATURES : FEATURES.filter(f => f.cat === active);

  return (
    <section style={{ padding: "96px 24px", background: "#080808" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>PLATFORM</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.025em", margin: "0 0 12px" }}>Our Tools &amp; Features</h2>
          <p style={{ fontSize: 15, color: "#555", maxWidth: 520 }}>Because we offer capabilities not available elsewhere in FMCG retail intelligence.</p>
        </div>

        {/* Category filter tabs — MHM style */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 36 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActive(cat)}
              style={{ padding: "7px 18px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${active === cat ? "#7c3aed" : "#2a2a2a"}`, background: active === cat ? "#7c3aed" : "transparent", color: active === cat ? "#fff" : "#666", transition: "all 0.15s", fontFamily: "inherit", letterSpacing: "0.02em" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Feature cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="features-grid">
          {filtered.map((f, i) => (
            <Link key={i} href={f.href} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s, transform 0.2s", cursor: "pointer", height: "100%" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#3a3a3a"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.transform = "translateY(0)"; }}>

                {/* Card visual area */}
                <div style={{ height: 160, background: "linear-gradient(135deg,#0f0f0f,#151515)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderBottom: "1px solid #1a1a1a" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: `${f.badgeColor}18`, border: `1px solid ${f.badgeColor}30`, display: "flex", alignItems: "center", justifyContent: "center", color: f.badgeColor }}>
                    {f.icon}
                  </div>
                  {f.badge && (
                    <div style={{ position: "absolute", top: 12, right: 12, padding: "3px 10px", borderRadius: 999, background: `${f.badgeColor}20`, border: `1px solid ${f.badgeColor}40`, fontSize: 10, fontWeight: 700, color: f.badgeColor, letterSpacing: "0.06em" }}>
                      {f.badge}
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 12, left: 12, fontSize: 10, color: "#3a3a3a", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{f.tag}</div>
                </div>

                {/* Card content */}
                <div style={{ padding: "16px 18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", margin: 0, letterSpacing: "-0.01em" }}>{f.title}</h3>
                  </div>
                  <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, margin: "0 0 14px" }}>{f.desc}</p>
                  <span style={{ fontSize: 12, fontWeight: 600, color: f.badgeColor, display: "flex", alignItems: "center", gap: 4 }}>
                    See More
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* See More button */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 28px", border: "1px solid #2a2a2a", borderRadius: 999, color: "#888", fontSize: 14, textDecoration: "none", transition: "color 0.2s, border-color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f0f0f0"; e.currentTarget.style.borderColor = "#555"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#2a2a2a"; }}>
            See More Tools
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
