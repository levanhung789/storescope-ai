"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01", title: "Asset Ingestion",
    description: "Upload shelf photos, warehouse images, Excel or Word files. Blockchain storage handles unified retrieval of all raw and processed assets.",
    tag: "Shelby Storage", icon: "📥",
    color: "#7c3aed",
  },
  {
    number: "02", title: "OCR Text Extraction",
    description: "OCR engine processes every image to reveal brand name candidates, size specifications, and product label text with language detection.",
    tag: "Text Pipeline", icon: "🔍",
    color: "#8b5cf6",
  },
  {
    number: "03", title: "Vision Analysis",
    description: "Computer vision models identify product category, packaging type, dominant colors, and shelf placement — distinguishing client products from competitors.",
    tag: "Vision AI", icon: "👁️",
    color: "#a78bfa",
  },
  {
    number: "04", title: "Data Normalization",
    description: "OCR and vision outputs are harmonized into structured, normalized fields: brand, name, size, packaging type, and quantity per facing.",
    tag: "Normalization", icon: "⚙️",
    color: "#7c3aed",
  },
  {
    number: "05", title: "Catalog Matching",
    description: "Top 3 candidate SKUs are scored against your 50,000+ product catalog using weighted confidence: brand (30%), text (30%), size (20%), category (10%), visuals (10%).",
    tag: "Catalog Match", icon: "🎯",
    color: "#6d28d9",
  },
  {
    number: "06", title: "Insights & Alerts",
    description: "High-confidence matches flow to analytics. Low-confidence results route to human review. Outputs: stock alerts, overstock warnings, competitor shelf-share signals.",
    tag: "Intelligence", icon: "💡",
    color: "#5b21b6",
  },
];

const confidenceWeights = [
  { label: "Brand match",     pct: 30, color: "#7c3aed" },
  { label: "Text similarity", pct: 30, color: "#8b5cf6" },
  { label: "Size verify",     pct: 20, color: "#a78bfa" },
  { label: "Category",        pct: 10, color: "#c4b5fd" },
  { label: "Visual cues",     pct: 10, color: "#ddd6fe" },
];

// ── Bidirectional scroll reveal (animates on scroll down AND up) ────────────
function useReveal(delay = 0, direction: "up" | "left" | "right" = "up") {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      setVis(e.isIntersecting); // toggles on both enter AND leave
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const dx = direction === "left" ? "-32px" : direction === "right" ? "32px" : "0";
  const dy = direction === "up" ? "32px" : "0";
  return {
    ref,
    style: {
      opacity: vis ? 1 : 0,
      transform: vis ? "translate(0,0)" : `translate(${dx},${dy})`,
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    },
  };
}

// ── Animated number counter — resets when scrolling back up ─────────────────
function CountUp({ to, suffix = "", delay = 0 }: { to: number; suffix?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!inView) { setVal(0); return; } // reset when leaving viewport
    const timer = setTimeout(() => {
      let frame = 0; const total = 60;
      const tick = () => {
        frame++;
        setVal(Math.round(to * Math.pow(frame / total, 2)));
        if (frame < total) requestAnimationFrame(tick);
        else setVal(to);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [inView, to, delay]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Animated connector dots ─────────────────────────────────────────────────
function FlowDots({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "0 8px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 4, height: 4, borderRadius: "50%", background: color,
          animation: `flowDot 1.4s ease-in-out ${i * 0.22}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function HowItWorks() {
  const headerTag    = useReveal(0);
  const headerTitle  = useReveal(120);
  const headerSub    = useReveal(240);
  const confidenceEl = useReveal(100);
  const [confVis, setConfVis] = useState(false);
  const confRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = confRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      setConfVis(e.isIntersecting); // bidirectional
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" style={{ padding: "120px 24px", overflow: "hidden" }}>
      <style>{`
        @keyframes flowDot {
          0%,100%{opacity:.2;transform:scale(1)}
          50%{opacity:1;transform:scale(1.4)}
        }
        @keyframes pulseRing {
          0%{box-shadow:0 0 0 0 rgba(124,58,237,0.4)}
          70%{box-shadow:0 0 0 12px rgba(124,58,237,0)}
          100%{box-shadow:0 0 0 0 rgba(124,58,237,0)}
        }
        @keyframes gradientShift {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes scanLine {
          0%{transform:translateX(-100%)}
          100%{transform:translateX(400%)}
        }
        .step-card-hiw {
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
        }
        .step-card-hiw:hover {
          border-color: rgba(124,58,237,0.4) !important;
          box-shadow: 0 0 32px rgba(124,58,237,0.12);
          transform: translateY(-4px);
        }
        .step-card-hiw:hover .step-number-hiw {
          color: rgba(124,58,237,0.6) !important;
        }
        @media (max-width: 860px) {
          .steps-grid-hiw { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 560px) {
          .steps-grid-hiw { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>

          {/* Tag */}
          <div ref={headerTag.ref} style={{ ...headerTag.style, marginBottom: 20 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#7c3aed",
              background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
              padding: "5px 16px", borderRadius: 999,
            }}>
              AI Pipeline
            </span>
          </div>

          {/* Headline — gradient animated */}
          <div ref={headerTitle.ref} style={headerTitle.style}>
            <h2 style={{
              fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)",
              fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08,
              margin: "0 auto 18px", maxWidth: 640,
              background: "linear-gradient(135deg, #f0f0f0 0%, #a78bfa 50%, #f0f0f0 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "gradientShift 4s ease infinite",
            }}>
              6-stage sequential<br/>recognition flow.
            </h2>
          </div>

          {/* Sub */}
          <div ref={headerSub.ref} style={headerSub.style}>
            <p style={{ fontSize: 15, color: "#666", maxWidth: 480, margin: "0 auto 36px" }}>
              From raw shelf photo to structured business data — every stage engineered for accuracy and auditability.
            </p>
            {/* Flow indicators */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap", rowGap: 8 }}>
              {["📥 Ingest", "🔍 OCR", "👁️ Vision", "⚙️ Normalize", "🎯 Match", "💡 Insights"].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <span style={{
                    fontSize: 11, color: i === 5 ? "#a78bfa" : "#555",
                    padding: "3px 10px", borderRadius: 999,
                    background: i === 5 ? "rgba(124,58,237,0.15)" : "transparent",
                    border: i === 5 ? "1px solid rgba(124,58,237,0.3)" : "none",
                    fontWeight: i === 5 ? 700 : 400,
                    whiteSpace: "nowrap",
                  }}>{s}</span>
                  {i < 5 && <FlowDots color={i === 4 ? "#7c3aed" : "#2a2a2a"} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Steps grid ─────────────────────────────────────────────── */}
        <div
          className="steps-grid-hiw"
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}
        >
          {steps.map((step, i) => {
            const dir = i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "up";
            const { ref: sRef, style: sStyle } = useReveal(i * 70, dir); // eslint-disable-line react-hooks/rules-of-hooks
            return (
              <div
                key={i}
                ref={sRef}
                style={sStyle}
              >
                <div
                  className="step-card-hiw"
                  style={{
                    padding: "28px 28px 32px",
                    border: "1px solid #1e1e1e",
                    borderRadius: 16,
                    background: "#0d0d0d",
                    position: "relative",
                    overflow: "hidden",
                    height: "100%",
                  }}
                >
                  {/* Scan line effect */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "100%",
                    background: `linear-gradient(90deg, transparent 0%, ${step.color}08 50%, transparent 100%)`,
                    animation: "scanLine 3.5s ease-in-out infinite",
                    animationDelay: `${i * 0.5}s`,
                    pointerEvents: "none",
                  }} />

                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                    {/* Tag */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                      textTransform: "uppercase", color: step.color,
                      background: `${step.color}12`,
                      border: `1px solid ${step.color}30`,
                      padding: "3px 10px", borderRadius: 999,
                    }}>
                      {step.tag}
                    </span>
                    {/* Number */}
                    <span
                      className="step-number-hiw"
                      style={{
                        fontSize: "clamp(2rem,3vw,2.8rem)", fontWeight: 900,
                        color: "#1e1e1e", letterSpacing: "-0.05em", lineHeight: 1,
                        transition: "color 0.3s",
                      }}
                    >
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                    background: `${step.color}15`, border: `1px solid ${step.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                    animation: "pulseRing 3s ease infinite",
                    animationDelay: `${i * 0.4}s`,
                  }}>
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 16, fontWeight: 700, color: "#f0f0f0",
                    letterSpacing: "-0.025em", lineHeight: 1.3, marginBottom: 10,
                  }}>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p style={{ fontSize: 13, color: "#777", lineHeight: 1.8, margin: 0 }}>
                    {step.description}
                  </p>

                  {/* Bottom accent bar */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                    opacity: 0.6,
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <div ref={confidenceEl.ref} style={{
          ...confidenceEl.style,
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          gap: 16, marginTop: 20,
        }}>
          {[
            { label: "Accuracy rate", value: 94, suffix: "%" },
            { label: "SKUs in catalog", value: 50, suffix: "K+" },
            { label: "Processing time", value: 2, suffix: "s" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "24px 28px", background: "#0d0d0d",
              border: "1px solid #1e1e1e", borderRadius: 16,
              textAlign: "center",
            }}>
              <div style={{
                fontSize: "clamp(2.2rem,4vw,3rem)", fontWeight: 900,
                letterSpacing: "-0.04em",
                background: "linear-gradient(135deg,#f0f0f0,#a78bfa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                <CountUp to={s.value} suffix={s.suffix} delay={i * 200} />
              </div>
              <p style={{ fontSize: 12, color: "#555", margin: "6px 0 0", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Confidence scoring ──────────────────────────────────────── */}
        <div
          ref={confRef}
          style={{
            marginTop: 20, padding: "32px 40px",
            background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16,
            opacity: confVis ? 1 : 0,
            transform: confVis ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", margin: "0 0 4px" }}>
                Confidence scoring weights
              </p>
              <p style={{ fontSize: 12, color: "#444", margin: 0 }}>
                Weighted multi-signal matching algorithm
              </p>
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "#a78bfa",
              background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
              padding: "6px 14px", borderRadius: 8,
            }}>
              ≥ 85% threshold
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", height: 8, marginBottom: 20 }}>
            {confidenceWeights.map((w, i) => (
              <div key={i} style={{
                flex: w.pct,
                background: w.color,
                width: confVis ? `${w.pct}%` : "0%",
                transition: `width 1.2s ease ${i * 150}ms`,
                position: "relative",
              }} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {confidenceWeights.map((w, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px", background: "#111",
                border: "1px solid #1e1e1e", borderRadius: 10,
                opacity: confVis ? 1 : 0,
                transform: confVis ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 0.5s ease ${i * 100 + 400}ms, transform 0.5s ease ${i * 100 + 400}ms`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: w.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#888" }}>{w.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: w.color }}>{w.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
