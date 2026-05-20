"use client";

import { useState, useRef, useEffect } from "react";
import { useInView } from "../_hooks/useInView";

// Per-element scroll animation hook
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  }};
}

const cases = [
  {
    industry:    "FMCG Brands",
    headline:    "Know your shelf before your competitor does.",
    description: "Monitor product placement, facings count, and share of shelf across hundreds of stores — updated after every field visit without manual counting.",
    metrics:     ["Real-time shelf-share tracking", "Competitor product detection", "Planogram compliance"],
    color:       "#7c3aed",
    image:       "/shelf-hero.png",
  },
  {
    industry:    "Distributors",
    headline:    "Audit 10x faster. No clipboard required.",
    description: "Replace manual shelf audits with AI-powered photo analysis. Field reps snap a photo; StoreScope delivers structured stock data within seconds.",
    metrics:     ["12x faster than manual audit", "Automated low-stock alerts", "Excel/Word report export"],
    color:       "#0ea5e9",
    image:       "/distributors-hero.png",
  },
  {
    industry:    "Retail Execution Teams",
    headline:    "Close the gap between field and HQ.",
    description: "Connect field photos directly to your dashboard. Multi-store comparison, anomaly detection, and forecasting built for national retail chains.",
    metrics:     ["Multi-store comparison", "Anomaly & gap detection", "API-ready for ERP / WMS"],
    color:       "#10b981",
    image:       "/retail-teams-hero.png",
  },
];

function AnimatedTextBlock({ c, order, baseDelay }: {
  c: typeof cases[0]; order: number; baseDelay: number;
}) {
  const tag      = useScrollReveal(baseDelay);
  const line     = useScrollReveal(baseDelay + 80);
  const headline = useScrollReveal(baseDelay + 150);
  const desc     = useScrollReveal(baseDelay + 240);
  const m1       = useScrollReveal(baseDelay + 320);
  const m2       = useScrollReveal(baseDelay + 400);
  const m3       = useScrollReveal(baseDelay + 480);
  const metaRefs = [m1, m2, m3];

  return (
    <div style={{
      order,
      padding: "52px 48px",
      display: "flex", flexDirection: "column", justifyContent: "center",
    }}>
      {/* Tag */}
      <div ref={tag.ref} style={{ ...tag.style, marginBottom: 20 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
          textTransform: "uppercase", color: c.color,
          background: `${c.color}15`, border: `1px solid ${c.color}30`,
          padding: "4px 12px", borderRadius: 999,
        }}>
          {c.industry}
        </span>
      </div>

      {/* Accent line */}
      <div ref={line.ref} style={{
        ...line.style,
        width: 40, height: 3, borderRadius: 99,
        background: `linear-gradient(90deg, ${c.color}, transparent)`,
        marginBottom: 22,
        transformOrigin: "left",
      }} />

      {/* Headline */}
      <div ref={headline.ref} style={headline.style}>
        <h3 style={{
          fontSize: "clamp(1.25rem, 2vw, 1.65rem)",
          fontWeight: 700, color: "#f0f0f0",
          letterSpacing: "-0.03em", lineHeight: 1.25,
          marginBottom: 16,
        }}>
          {c.headline}
        </h3>
      </div>

      {/* Description */}
      <div ref={desc.ref} style={{ ...desc.style, marginBottom: 32 }}>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.85, margin: 0 }}>
          {c.description}
        </p>
      </div>

      {/* Metrics — staggered */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {c.metrics.map((m, idx) => {
          const { ref: mRef, style: mStyle } = metaRefs[idx] ?? metaRefs[0];
          return (
            <li key={m} ref={mRef} style={{
              ...mStyle,
              display: "flex", alignItems: "center", gap: 12,
              fontSize: 13, color: "#ccc",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: `${c.color}18`, border: `1px solid ${c.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.3s",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.5">
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              {m}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function UseCases() {
  const { ref, inView } = useInView({ threshold: 0.08 });
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <section id="use-cases" ref={ref as React.RefObject<HTMLElement>} style={{ padding: "112px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          textAlign: "center", marginBottom: 64,
          transition: "opacity 0.7s ease, transform 0.7s ease",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(28px)",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 14 }}>
            Use Cases
          </p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#f0f0f0", maxWidth: 540, margin: "0 auto 14px" }}>
            Built for the whole FMCG chain.
          </h2>
          <p style={{ fontSize: 15, color: "#6b6b6b", maxWidth: 440, margin: "0 auto" }}>
            From brand manager to field rep — every stakeholder gets the data they need to act.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {cases.map((c, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: i % 2 === 0 ? "1fr 1fr" : "1fr 1fr",
                background: "#0d0d0d",
                border: "1px solid #1e1e1e",
                borderRadius: 20,
                overflow: "hidden",
                transition: `opacity 0.65s ease ${i * 100}ms, transform 0.65s ease ${i * 100}ms`,
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(32px)",
              }}
              className="usecase-card"
            >
              {/* Image side */}
              <div
                style={{
                  order: i % 2 === 0 ? 0 : 1,
                  position: "relative",
                  minHeight: 320,
                  overflow: "hidden",
                  cursor: "zoom-in",
                  borderRight: i % 2 === 0 ? "1px solid #1e1e1e" : "none",
                  borderLeft: i % 2 !== 0 ? "1px solid #1e1e1e" : "none",
                }}
                onClick={() => setLightbox(c.image)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.headline}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: "center top",
                    display: "block", position: "absolute", inset: 0,
                    transition: "transform 0.5s ease",
                  }}
                  className="usecase-img"
                />
                {/* Overlay gradient bottom */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "35%",
                  background: "linear-gradient(to top, rgba(13,13,13,0.7), transparent)",
                  pointerEvents: "none",
                }} />
                {/* Zoom hint */}
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
                  borderRadius: 8, padding: "5px 10px",
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 11, color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    <path d="M11 8v6M8 11h6"/>
                  </svg>
                  Zoom
                </div>
                {/* Industry badge */}
                <div style={{
                  position: "absolute", bottom: 16, left: 16,
                  background: `${c.color}cc`, backdropFilter: "blur(8px)",
                  borderRadius: 8, padding: "5px 12px",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  {c.industry}
                </div>
              </div>

              {/* Text side — animated */}
              <AnimatedTextBlock c={c} order={i % 2 === 0 ? 1 : 0} baseDelay={i * 80} />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "zoom-out",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Zoom"
            style={{
              maxWidth: "92vw", maxHeight: "88vh",
              objectFit: "contain", borderRadius: 16,
              boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
              animation: "zoomIn 0.25s ease",
            }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed", top: 24, right: 24,
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", cursor: "pointer", fontSize: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes zoomIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        .usecase-img { transition: transform 0.5s ease; }
        .usecase-card:hover .usecase-img { transform: scale(1.04); }
        @media (max-width: 768px) {
          .usecase-card { grid-template-columns: 1fr !important; }
          .usecase-card > div { order: unset !important; border-right: none !important; border-left: none !important; }
          .usecase-card > div:first-child { min-height: 240px !important; border-bottom: 1px solid #1e1e1e; }
        }
      `}</style>
    </section>
  );
}
