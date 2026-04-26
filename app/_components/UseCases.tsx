"use client";

import { useInView } from "../_hooks/useInView";

const cases = [
  {
    industry: "FMCG Brands",
    headline: "Know your shelf before your competitor does.",
    description:
      "Monitor product placement, facings count, and share of shelf across hundreds of stores — updated after every field visit without manual counting.",
    metrics: ["Real-time shelf-share tracking", "Competitor product detection", "Planogram compliance"],
    color: "#7c3aed",
  },
  {
    industry: "Distributors",
    headline: "Audit 10x faster. No clipboard required.",
    description:
      "Replace manual shelf audits with AI-powered photo analysis. Field reps snap a photo; StoreScope delivers structured stock data within seconds.",
    metrics: ["12x faster than manual audit", "Automated low-stock alerts", "Excel/Word report export"],
    color: "#6d28d9",
  },
  {
    industry: "Retail Execution Teams",
    headline: "Close the gap between field and HQ.",
    description:
      "Connect field photos directly to your dashboard. Multi-store comparison, anomaly detection, and forecasting built for national retail chains and distributors.",
    metrics: ["Multi-store comparison", "Anomaly & gap detection", "API-ready for ERP / WMS"],
    color: "#5b21b6",
  },
];

export default function UseCases() {
  const { ref, inView } = useInView({ threshold: 0.08 });

  return (
    <section
      id="use-cases"
      ref={ref as React.RefObject<HTMLElement>}
      style={{ padding: "128px 24px" }}
    >
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 72,
            transition: "opacity 0.7s ease, transform 0.7s ease",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(28px)",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 16 }}>
            Use Cases
          </p>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#f0f0f0",
              maxWidth: 560,
              margin: "0 auto 16px",
            }}
          >
            Built for the whole FMCG chain.
          </h2>
          <p style={{ fontSize: 14, color: "#6b6b6b", maxWidth: 420, margin: "0 auto" }}>
            From brand manager to field rep — every stakeholder gets the data they need to act.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {cases.map((c, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: i % 2 === 0 ? "1fr 1.6fr" : "1.6fr 1fr",
                background: "#111",
                border: "1px solid #242424",
                borderRadius: 16,
                overflow: "hidden",
                transition: `opacity 0.7s ease ${i * 120}ms, transform 0.7s ease ${i * 120}ms`,
                opacity: inView ? 1 : 0,
                transform: inView ? "translateX(0)" : `translateX(${i % 2 === 0 ? "-24px" : "24px"})`,
              }}
              className="usecase-card"
            >
              {/* Color block */}
              <div
                style={{
                  order: i % 2 === 0 ? 0 : 1,
                  background: `linear-gradient(135deg, ${c.color}22, ${c.color}08)`,
                  borderRight: i % 2 === 0 ? "1px solid #242424" : "none",
                  borderLeft: i % 2 !== 0 ? "1px solid #242424" : "none",
                  padding: "48px 40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: c.color,
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    {c.industry}
                  </span>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `${c.color}20`,
                      border: `1px solid ${c.color}40`,
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="1.8">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Text block */}
              <div
                style={{
                  order: i % 2 === 0 ? 1 : 0,
                  padding: "48px 40px",
                }}
              >
                <h3
                  style={{
                    fontSize: "clamp(1.2rem, 2vw, 1.6rem)",
                    fontWeight: 700,
                    color: "#f0f0f0",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.2,
                    marginBottom: 16,
                  }}
                >
                  {c.headline}
                </h3>
                <p style={{ fontSize: 14, color: "#909090", lineHeight: 1.75, marginBottom: 28 }}>
                  {c.description}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {c.metrics.map((m) => (
                    <li key={m} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#888" }}>
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: c.color,
                          flexShrink: 0,
                        }}
                      />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .usecase-card {
            grid-template-columns: 1fr !important;
          }
          .usecase-card > div:first-child,
          .usecase-card > div:last-child {
            order: unset !important;
            border-right: none !important;
            border-left: none !important;
            border-bottom: 1px solid #242424;
          }
        }
      `}</style>
    </section>
  );
}
