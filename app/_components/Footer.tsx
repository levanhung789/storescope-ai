"use client";

import { useInView } from "../_hooks/useInView";

const footerLinks = {
  Platform: ["Shelf Detection", "SKU Recognition", "Analytics Dashboard", "Blockchain Storage", "API Access"],
  "Use Cases": ["FMCG Brands", "Distributors", "Retail Execution", "Field Audit Teams"],
  Technology: ["Shelby on Aptos", "Move Smart Contracts", "Vision AI Pipeline", "OCR Engine"],
  Company: ["About", "Blog", "Careers", "GitHub"],
  Support: ["Documentation", "API Reference", "Status", "Contact"],
};

export default function Footer() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <footer
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        borderTop: "1px solid #2a2a2a",
        padding: "64px 24px 40px",
        transition: "opacity 0.8s ease, transform 0.8s ease",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
      }}
    >
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 56 }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                S
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#f0f0f0" }}>
                StoreScope<span style={{ color: "#7c3aed" }}> AI</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.75, maxWidth: 240, marginBottom: 20 }}>
              Retail shelf intelligence for FMCG and distribution teams. Turn shelf photos into structured, decision-ready data — secured on the Aptos blockchain via Shelby.
            </p>
            {/* Tech badge */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Next.js", "Aptos", "Move"].map((t) => (
                <span
                  key={t}
                  style={{ fontSize: 10, fontWeight: 600, color: "#666", background: "#111", border: "1px solid #1f1f1f", padding: "3px 9px", borderRadius: 999 }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#f0f0f0", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                {category}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href={link === "GitHub" ? "https://github.com/levanhung789/storescope-ai-Shelby" : "#"}
                      target={link === "GitHub" ? "_blank" : undefined}
                      rel={link === "GitHub" ? "noopener noreferrer" : undefined}
                      style={{ fontSize: 13, color: "#666", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#383838")}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop: "1px solid #222",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
            © {new Date().getFullYear()} StoreScope AI. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <a href="#" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#2a2a2a")}
            >Privacy</a>
            <a href="#" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#2a2a2a")}
            >Terms</a>
            <span style={{ fontSize: 12, color: "#222" }}>Built with Shelby on Aptos</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr 1fr !important; gap: 28px !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
