"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  { key: "ALL",           icon: "✦" },
  { key: "AI Analysis",   icon: null },
  { key: "Vision Agent",  icon: null },
  { key: "AI Agent",      icon: null },
  { key: "Layout Editor", icon: null },
  { key: "Marketplace",   icon: null },
  { key: "On-Chain",      icon: null },
];

// Unique SVG particle/wave backgrounds per card
const BG_PATTERNS: Record<string, React.ReactNode> = {
  "AI Analysis": (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.18 }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:40}).map((_,i) => <circle key={i} cx={Math.sin(i*0.7)*180+200} cy={Math.cos(i*0.5)*100+150} r={2+Math.sin(i)*2} fill="#7c3aed"/>)}
      {Array.from({length:15}).map((_,i) => <circle key={i+40} cx={i*28} cy={280-Math.sin(i*0.4)*60} r={1.5} fill="#a78bfa"/>)}
    </svg>
  ),
  "Vision Agent": (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.15 }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:30}).map((_,i) => <circle key={i} cx={50+i*12} cy={260-Math.abs(Math.sin(i*0.3))*180} r={2} fill="#10b981"/>)}
      <path d="M0 200 Q100 100 200 180 Q300 260 400 140" stroke="#10b981" strokeWidth="1" fill="none" opacity="0.4"/>
      <path d="M0 250 Q120 150 240 220 Q320 270 400 200" stroke="#34d399" strokeWidth="0.8" fill="none" opacity="0.3"/>
    </svg>
  ),
  "AI Agent": (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.15 }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:20}).map((_,i) => <><circle key={`a${i}`} cx={200+Math.cos(i*0.63)*160} cy={150+Math.sin(i*0.63)*100} r={1.5} fill="#3b82f6"/><line key={`b${i}`} x1={200} y1={150} x2={200+Math.cos(i*0.63)*160} y2={150+Math.sin(i*0.63)*100} stroke="#3b82f6" strokeWidth="0.4" opacity="0.5"/></>)}
    </svg>
  ),
  "Layout Editor": (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.15 }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:8}).map((_,i) => Array.from({length:8}).map((_,j) => <rect key={`${i}${j}`} x={50+i*42} y={50+j*30} width={38} height={26} fill="none" stroke="#f59e0b" strokeWidth="0.5" rx="2"/>))}
    </svg>
  ),
  "Marketplace": (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.15 }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:16}).map((_,i) => <rect key={i} x={10+i*25} y={300-(40+Math.abs(Math.sin(i*0.7))*200)} width={16} height={40+Math.abs(Math.sin(i*0.7))*200} fill="#10b981" rx="2"/>)}
    </svg>
  ),
  "On-Chain": (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.18 }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <path d="M-50 200 C50 100 150 250 250 150 S400 50 500 120" stroke="#8b5cf6" strokeWidth="1.5" fill="none"/>
      <path d="M-50 250 C100 150 200 280 300 200 S420 100 550 160" stroke="#a78bfa" strokeWidth="1" fill="none"/>
      <path d="M-50 150 C80 80 180 220 280 120 S420 30 520 90" stroke="#7c3aed" strokeWidth="0.8" fill="none"/>
    </svg>
  ),
};

const FEATURES = [
  {
    cat: "AI Analysis",
    tag: "VISION AI",
    title: "Shelf & SKU Detection",
    desc: "Detect every product on shelf with bounding-box precision. Brand recognition, out-of-stock alerts, and planogram compliance.",
    href: "/dashboard/analysis",
    badge: "Most Popular",
    badgeColor: "#7c3aed",
    color: "#7c3aed",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m9 8 3 3 3-3"/>
      </svg>
    ),
  },
  {
    cat: "Vision Agent",
    tag: "8-STEP PIPELINE",
    title: "Vision Agent",
    desc: "End-to-end FMCG analysis pipeline: upload → detect → classify → normalize → match → score → report → store on-chain.",
    href: "/dashboard/vision-agent",
    badge: "New",
    badgeColor: "#10b981",
    color: "#10b981",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8-11 8-11-8"/><circle cx="12" cy="12" r="6" strokeDasharray="2 3"/>
      </svg>
    ),
  },
  {
    cat: "AI Agent",
    tag: "AUTONOMOUS",
    title: "AI Agent",
    desc: "Autonomous retail analytics agent powered by Circle USDC micro-payments. Set policy, run analyses, collect on-chain proofs.",
    href: "/dashboard/agent",
    badge: null,
    badgeColor: "#3b82f6",
    color: "#3b82f6",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="8" width="18" height="12" rx="3"/><path d="M7 8V6a5 5 0 0 1 10 0v2"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    cat: "Layout Editor",
    tag: "3D PLANNING",
    title: "Store Layout Editor",
    desc: "3D store layout planning with satellite map import, fixture placement, and zone optimization. Export to NFT on ARC.",
    href: "/layout-editor",
    badge: null,
    badgeColor: "#f59e0b",
    color: "#f59e0b",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
  {
    cat: "Marketplace",
    tag: "DATA TRADING",
    title: "Forum & Marketplace",
    desc: "Buy and sell FMCG analysis data with Circle USDC. Verified datasets from real shelf audits, backed by on-chain proofs.",
    href: "/forum",
    badge: "Live",
    badgeColor: "#10b981",
    color: "#10b981",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    cat: "On-Chain",
    tag: "BLOCKCHAIN",
    title: "On-Chain Recording",
    desc: "Every analysis result is hashed and recorded on ARC Testnet via AnalysisRegistry smart contract. Immutable proof of data integrity.",
    href: "/dashboard",
    badge: null,
    badgeColor: "#8b5cf6",
    color: "#8b5cf6",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10M12 3v8M3.2 9.4l16.6-1.8"/>
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

        {/* ── Filter tabs — reference style ─────────────────────────── */}
        <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "4px", marginBottom: 40, flexWrap: "wrap", gap: 0 }}>
          {CATEGORIES.map((cat, i) => {
            const isActive = active === cat.key;
            return (
              <div key={cat.key} style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => setActive(cat.key)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 999, fontSize: 13, fontWeight: isActive ? 700 : 400, cursor: "pointer", fontFamily: "inherit", border: "none", transition: "all 0.2s",
                    background: isActive ? "linear-gradient(135deg,#5b21b6,#7c3aed)" : "transparent",
                    color: isActive ? "#fff" : "#555",
                    boxShadow: isActive ? "0 2px 12px rgba(124,58,237,0.4)" : "none",
                  }}>
                  {cat.icon && <span style={{ fontSize: 11 }}>{cat.icon}</span>}
                  {cat.key}
                </button>
                {i < CATEGORIES.length - 1 && !isActive && active !== CATEGORIES[i+1]?.key && (
                  <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Feature cards — reference layout ──────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="features-grid">
          {filtered.map((f, i) => (
            <Link key={i} href={f.href} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ position: "relative", background: "linear-gradient(145deg,#0d111a,#0a0d14)", border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 20, overflow: "hidden", padding: "28px 24px 24px", minHeight: 280, display: "flex", flexDirection: "column", transition: "transform 0.25s, border-color 0.25s, box-shadow 0.25s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.borderColor = `${f.color}40`; e.currentTarget.style.boxShadow = `0 12px 40px ${f.color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}>

                {/* Unique particle/wave background */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {BG_PATTERNS[f.cat]}
                </div>

                {/* Top row: icon + badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative", zIndex: 1 }}>
                  {/* Icon box */}
                  <div style={{ width: 68, height: 68, borderRadius: 16, background: `linear-gradient(135deg, ${f.color}30, ${f.color}18)`, border: `1px solid ${f.color}35`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, boxShadow: `0 4px 16px ${f.color}20` }}>
                    {f.icon}
                  </div>

                  {/* Badge */}
                  {f.badge && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, background: `${f.badgeColor}18`, border: `1px solid ${f.badgeColor}35`, fontSize: 11, fontWeight: 700, color: f.badgeColor }}>
                      {f.badge === "Live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: f.badgeColor, animation: "livePulse 1.5s infinite" }} />}
                      {f.badge !== "Live" && <span style={{ fontSize: 9 }}>✦</span>}
                      {f.badge}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: f.color, marginBottom: 8, textTransform: "uppercase" }}>
                    {f.tag}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 10px" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, margin: "0 0 20px" }}>
                    {f.desc}
                  </p>
                </div>

                {/* See More */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: f.color, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    See More
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* See More */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 32px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, color: "#888", fontSize: 14, textDecoration: "none", background: "rgba(255,255,255,0.03)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f0f0f0"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
            See All Tools
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
