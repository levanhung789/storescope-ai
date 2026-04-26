"use client";

import { useInView } from "../_hooks/useInView";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For small field teams beginning their shelf intelligence journey.",
    features: [
      "100 image analyses / month",
      "3 store locations",
      "Basic SKU recognition (5K SKUs)",
      "Low-stock alert emails",
      "CSV export",
      "Community support",
    ],
    cta: "Get started free",
    ctaHref: "#",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$299",
    period: "/ month",
    description: "For growing FMCG brands and distributors that need full shelf intelligence.",
    features: [
      "Unlimited image analyses",
      "Unlimited store locations",
      "Full SKU catalog (50K+)",
      "6-stage AI pipeline",
      "Competitor shelf-share analysis",
      "Human-in-the-loop review",
      "REST & GraphQL API access",
      "Shelby blockchain storage",
      "Priority support",
    ],
    cta: "Start 14-day free trial",
    ctaHref: "#",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For national chains, large distributors, and multi-country FMCG operations.",
    features: [
      "Everything in Pro",
      "Custom AI model training",
      "On-premise deployment option",
      "Advanced anomaly detection",
      "Multi-store forecasting",
      "SLA 99.9% uptime",
      "Dedicated account manager",
      "Custom ERP / WMS integration",
    ],
    cta: "Contact sales",
    ctaHref: "mailto:hello@storescope.ai",
    highlight: false,
  },
];

const roadmap = [
  { phase: "Phase 1", label: "Now", title: "Ingestion & Detection", desc: "File upload, Shelby storage, basic product detection", done: true },
  { phase: "Phase 2", label: "Q3 2025", title: "Normalization & Review", desc: "SKU normalization, client/competitor classification, review interface", done: true },
  { phase: "Phase 3", label: "Q4 2025", title: "Analytics & Alerts", desc: "Dashboards, stock alerts, recommendation engine, API", done: false },
  { phase: "Phase 4", label: "2026", title: "Advanced Intelligence", desc: "Multi-store comparison, forecasting, advanced anomaly detection", done: false },
];

export default function Pricing() {
  const { ref, inView } = useInView({ threshold: 0.06 });
  const { ref: refRoadmap, inView: inViewRoadmap } = useInView({ threshold: 0.1 });

  return (
    <>
      {/* Roadmap */}
      <section
        id="roadmap"
        ref={refRoadmap as React.RefObject<HTMLElement>}
        style={{ padding: "80px 24px 0", background: "#111" }}
      >
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 48,
              transition: "opacity 0.7s ease, transform 0.7s ease",
              opacity: inViewRoadmap ? 1 : 0,
              transform: inViewRoadmap ? "translateY(0)" : "translateY(24px)",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 12 }}>
              Roadmap
            </p>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.03em", margin: 0 }}>
              Where we are. Where we&apos;re going.
            </h2>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}
            className="roadmap-grid"
          >
            {roadmap.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: "28px 24px",
                  background: r.done ? "rgba(124,58,237,0.06)" : "#111",
                  border: `1px solid ${r.done ? "rgba(124,58,237,0.2)" : "#262626"}`,
                  borderRadius: 12,
                  transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms`,
                  opacity: inViewRoadmap ? 1 : 0,
                  transform: inViewRoadmap ? "translateY(0)" : "translateY(20px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.done ? "#7c3aed" : "#333", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {r.phase}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: r.done ? "#7c3aed" : "#444",
                      background: r.done ? "rgba(124,58,237,0.1)" : "#111",
                      border: `1px solid ${r.done ? "rgba(124,58,237,0.2)" : "#222"}`,
                      padding: "2px 7px",
                      borderRadius: 999,
                    }}
                  >
                    {r.label}
                  </span>
                  {r.done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" style={{ marginLeft: "auto" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: r.done ? "#f0f0f0" : "#555", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  {r.title}
                </h4>
                <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: 0 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .roadmap-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 480px) {
            .roadmap-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        ref={ref as React.RefObject<HTMLElement>}
        style={{ padding: "80px 24px 128px", background: "#111" }}
      >
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 56,
              transition: "opacity 0.7s ease, transform 0.7s ease",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(28px)",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 16 }}>
              Pricing
            </p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#f0f0f0", maxWidth: 480, margin: "0 auto 16px" }}>
              Simple, transparent pricing.
            </h2>
            <p style={{ fontSize: 14, color: "#6b6b6b", maxWidth: 360, margin: "0 auto" }}>
              Start free. Scale as your team grows. No hidden fees, cancel anytime.
            </p>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "start" }}
            className="pricing-grid"
          >
            {plans.map((plan, i) => (
              <div
                key={i}
                style={{
                  background: plan.highlight ? "linear-gradient(180deg, rgba(124,58,237,0.1) 0%, rgba(124,58,237,0.03) 100%)" : "#2a2a2a",
                  border: plan.highlight ? "1px solid rgba(124,58,237,0.35)" : "1px solid #2a2a2a",
                  borderRadius: 20,
                  padding: "36px 30px",
                  position: "relative",
                  boxShadow: plan.highlight ? "0 0 48px rgba(124,58,237,0.1)" : "none",
                  transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms`,
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(24px)",
                }}
              >
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#7c3aed", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    Most popular
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                    {plan.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f0f0f0" }}>
                      {plan.price}
                    </span>
                    {plan.period && <span style={{ fontSize: 13, color: "#6b6b6b" }}>{plan.period}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: "#888", lineHeight: 1.65 }}>{plan.description}</p>
                </div>

                <a
                  href={plan.ctaHref}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "11px 24px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    marginBottom: 24,
                    background: plan.highlight ? "#7c3aed" : "transparent",
                    color: plan.highlight ? "#fff" : "#a0a0a0",
                    border: plan.highlight ? "none" : "1px solid #2a2a2a",
                    transition: "background 0.2s, color 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (plan.highlight) e.currentTarget.style.background = "#6d28d9";
                    else { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#f0f0f0"; }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.highlight) e.currentTarget.style.background = "#7c3aed";
                    else { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#a0a0a0"; }
                  }}
                >
                  {plan.cta}
                </a>

                <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: 20 }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12.5, color: "#888", lineHeight: 1.5 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .pricing-grid { grid-template-columns: 1fr !important; max-width: 460px; margin-left: auto; margin-right: auto; }
          }
        `}</style>
      </section>
    </>
  );
}
