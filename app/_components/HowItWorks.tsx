"use client";

import { useInView } from "../_hooks/useInView";

const steps = [
  {
    number: "01",
    title: "Asset Ingestion",
    description:
      "Upload shelf photos, warehouse images, Excel files, or Word documents. Shelby blockchain storage handles unified retrieval of all raw and processed assets.",
    tag: "Shelby Storage",
  },
  {
    number: "02",
    title: "OCR Text Extraction",
    description:
      "OCR engine processes every image to reveal brand name candidates, size specifications, and product label text with language detection.",
    tag: "Text Pipeline",
  },
  {
    number: "03",
    title: "Vision Analysis",
    description:
      "Computer vision models identify product category, packaging type, dominant colors, and shelf placement — distinguishing client products from competitors.",
    tag: "Vision AI",
  },
  {
    number: "04",
    title: "Data Normalization",
    description:
      "OCR and vision outputs are harmonized into structured, normalized fields: brand, name, size, packaging type, and quantity per facing.",
    tag: "Normalization",
  },
  {
    number: "05",
    title: "Catalog Matching",
    description:
      "Top 3 candidate SKUs are scored against your 50,000+ product catalog using weighted confidence: brand (30%), text (30%), size (20%), category (10%), visuals (10%).",
    tag: "Catalog Match",
  },
  {
    number: "06",
    title: "Insights & Alerts",
    description:
      "High-confidence matches flow to analytics. Low-confidence results route to human-in-the-loop review. Outputs: stock alerts, overstock warnings, competitor shelf-share signals.",
    tag: "Intelligence",
  },
];

export default function HowItWorks() {
  const { ref, inView } = useInView({ threshold: 0.08 });

  return (
    <section
      id="how-it-works"
      ref={ref as React.RefObject<HTMLElement>}
      style={{ padding: "128px 24px" }}
    >
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 80,
            transition: "opacity 0.7s ease, transform 0.7s ease",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(28px)",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 16 }}>
            AI Pipeline
          </p>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#f0f0f0",
              maxWidth: 600,
              margin: "0 auto 16px",
            }}
          >
            6-stage sequential recognition flow.
          </h2>
          <p style={{ fontSize: 14, color: "#6b6b6b", maxWidth: 460, margin: "0 auto" }}>
            From raw shelf photo to structured business data — every stage engineered for accuracy and auditability.
          </p>
        </div>

        {/* Steps grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
          }}
          className="steps-grid"
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                padding: "32px",
                border: "1px solid #222",
                borderRadius: i === 0 ? "16px 0 0 0" : i === 2 ? "0 16px 0 0" : i === 3 ? "0 0 0 16px" : i === 5 ? "0 0 16px 0" : "0",
                background: "#111",
                transition: `opacity 0.6s ease ${i * 90}ms, transform 0.6s ease ${i * 90}ms`,
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(24px)",
              }}
              className="step-card"
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#7c3aed",
                    letterSpacing: "0.08em",
                    background: "rgba(124,58,237,0.1)",
                    padding: "3px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(124,58,237,0.2)",
                  }}
                >
                  {step.tag}
                </span>
                <span
                  style={{
                    fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                    fontWeight: 800,
                    color: "#2a2a2a",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  {step.number}
                </span>
              </div>

              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#f0f0f0",
                  marginBottom: 10,
                  letterSpacing: "-0.02em",
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.75, margin: 0 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Confidence scoring bar */}
        <div
          style={{
            marginTop: 48,
            padding: "32px 40px",
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: 16,
            transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 20 }}>
            Confidence scoring weights
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Brand match", pct: 30, color: "#7c3aed" },
              { label: "Text similarity", pct: 30, color: "#6d28d9" },
              { label: "Size verification", pct: 20, color: "#5b21b6" },
              { label: "Category", pct: 10, color: "#4c1d95" },
              { label: "Visual cues", pct: 10, color: "#3b0764" },
            ].map((item) => (
              <div key={item.label} style={{ flex: `${item.pct} 0 0%`, minWidth: 60 }}>
                <div
                  style={{
                    height: 4,
                    background: item.color,
                    borderRadius: 2,
                    marginBottom: 8,
                    opacity: inView ? 1 : 0,
                    width: inView ? "100%" : "0%",
                    transition: "width 1s ease 0.6s, opacity 0.3s ease 0.6s",
                  }}
                />
                <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 13, color: "#888", fontWeight: 700, margin: "2px 0 0" }}>{item.pct}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .step-card { border-radius: 0 !important; }
        }
        @media (max-width: 560px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
