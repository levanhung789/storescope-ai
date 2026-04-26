"use client";

import { useInView } from "../_hooks/useInView";

const services = [
  {
    tag: "Vision AI",
    title: "Shelf & Product Detection",
    description:
      "Identify every product on shelf with bounding-box precision. Detect out-of-stock gaps, misplaced items, and planogram violations. Differentiates your SKUs from competitor products automatically.",
    features: [
      "Brand & logo recognition",
      "Client vs. competitor classification",
      "Quantity per facing",
      "Planogram compliance check",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="m9 8 3 3 3-3" />
      </svg>
    ),
  },
  {
    tag: "SKU Classification",
    title: "Catalog Matching & Normalization",
    description:
      "Match detected products to your master catalog with confidence scoring across 50,000+ SKUs. Handle multiple brands, packaging variants, and multilingual labels across dairy, FMCG, and CPG categories.",
    features: [
      "50K+ SKU library",
      "Weighted confidence scoring",
      "OCR + vision output fusion",
      "Multi-language label support",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    tag: "Analytics",
    title: "Retail Intelligence & Alerts",
    description:
      "Transform detections into business decisions. Generate low-stock alerts, overstock warnings, competitor shelf-share signals, and store-level anomaly reports — with human-in-the-loop validation for low-confidence cases.",
    features: [
      "Low-stock & overstock alerts",
      "Competitor shelf-share analysis",
      "Human-in-the-loop review",
      "Multi-store comparison",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    tag: "Blockchain Storage",
    title: "Shelby — On-chain Asset Layer",
    description:
      "Every image and processed result is stored via Shelby on the Aptos blockchain using Move smart contracts. Immutable audit trail, verifiable via Aptos Explorer, with full provenance for compliance.",
    features: [
      "Move smart contracts on Aptos",
      "Immutable image provenance",
      "Aptos Explorer verification",
      "BlobStore transaction tracking",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <path d="M12 12v4M10 14h4" />
      </svg>
    ),
  },
  {
    tag: "Data Ingestion",
    title: "Multi-format Asset Ingestion",
    description:
      "Accept shelf photos, warehouse images, Excel spreadsheets, and Word documents through a unified upload pipeline. Shelby's storage layer handles raw and processed assets with fast retrieval for repeated analysis.",
    features: [
      "JPG, PNG, WEBP, PDF support",
      "Excel & Word document parsing",
      "Batch upload & queuing",
      "Fast retrieval for re-analysis",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    tag: "API & Integration",
    title: "REST API & Webhook Delivery",
    description:
      "Integrate StoreScope AI into your existing ERP, WMS, or BI stack via REST or GraphQL APIs. Structured JSON output ready for downstream analytics. Webhook support for real-time alert delivery.",
    features: [
      "REST & GraphQL APIs",
      "Structured JSON output",
      "Webhook real-time alerts",
      "ERP / WMS integration ready",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
];

export default function Services() {
  const { ref, inView } = useInView({ threshold: 0.06 });

  return (
    <section
      id="services"
      ref={ref as React.RefObject<HTMLElement>}
      style={{ padding: "128px 24px", background: "#111" }}
    >
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: 64,
            transition: "opacity 0.7s ease, transform 0.7s ease",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(28px)",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 16 }}>
            Services
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#f0f0f0",
                maxWidth: 480,
                margin: 0,
              }}
            >
              Everything your retail team needs.
            </h2>
            <p style={{ fontSize: 14, color: "#6b6b6b", maxWidth: 340, lineHeight: 1.7, margin: 0 }}>
              One platform covering the complete shelf intelligence workflow — from raw image upload to business action.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}
          className="services-grid"
        >
          {services.map((s, i) => (
            <div
              key={i}
              style={{
                background: "#2a2a2a",
                border: "1px solid #242424",
                padding: "32px 28px",
                transition: `border-color 0.2s, transform 0.2s, opacity 0.6s ease ${i * 80}ms, box-shadow 0.2s`,
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(24px)",
                cursor: "default",
              }}
              className="service-card"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.3)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 40px rgba(124,58,237,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#181818";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#a78bfa",
                  marginBottom: 20,
                }}
              >
                {s.icon}
              </div>

              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7c3aed", display: "block", marginBottom: 8 }}>
                {s.tag}
              </span>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0", marginBottom: 12, letterSpacing: "-0.02em" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: "#909090", lineHeight: 1.75, marginBottom: 24 }}>
                {s.description}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                {s.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#787878" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .services-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .services-grid { grid-template-columns: 1fr !important; }
          .service-card { border-radius: 12px !important; }
        }
      `}</style>
    </section>
  );
}
