"use client";

import { useState } from "react";

const FAQS = [
  { q: "What range of FMCG products can StoreScope AI detect?", a: "StoreScope AI supports 50,000+ SKUs across beverages, snacks, dairy, noodles, personal care, and household products. The system handles multi-brand, multi-language labels and updates continuously via our FMCG catalog." },
  { q: "How do I get started with shelf analysis?", a: "Connect your MetaMask or Circle wallet, navigate to the AI Analysis dashboard, upload a shelf photo, and StoreScope will detect products, match SKUs, and generate a structured report — typically in under 30 seconds." },
  { q: "How does the on-chain recording work?", a: "Every completed analysis is hashed and recorded on the ARC Testnet via our AnalysisRegistry smart contract. This creates an immutable proof of data integrity that can be verified publicly on ArcScan." },
  { q: "Is my shelf data secure?", a: "Yes. Analysis images are processed server-side and only result hashes are stored on-chain — not the raw images. Your wallet controls access to your analysis history and reports." },
  { q: "Do I need technical skills to use this platform?", a: "No. The platform is designed for retail managers, FMCG brand teams, and field auditors — not engineers. The only requirement is a web3 wallet (MetaMask or Circle) to verify your identity and pay for analyses with USDC." },
  { q: "Can I sell my analysis data on the marketplace?", a: "Yes. From your Profile page, you can list any analysis report or store layout as a data product on the Forum & Marketplace. Buyers pay with Circle USDC and you receive instant settlement." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section style={{ padding: "96px 24px", background: "#080808" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 80, alignItems: "flex-start" }} className="faq-grid">

        {/* Left: title */}
        <div style={{ position: "sticky", top: 96 }}>
          <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 20px" }}>
            Frequently Asked<br /><span style={{ color: "#555" }}>Questions.</span>
          </h2>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, maxWidth: 280 }}>
            Find answers to common questions about StoreScope AI. Get details on setup, features, and pricing for retail teams.
          </p>
        </div>

        {/* Right: accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "22px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3a3a3a", minWidth: 24, paddingTop: 3, fontFamily: "monospace" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: open === i ? "#f0f0f0" : "#aaa", lineHeight: 1.5, transition: "color 0.2s" }}>
                    {faq.q}
                  </span>
                </span>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", color: open === i ? "#f0f0f0" : "#555", transition: "all 0.2s", marginTop: 2, transform: open === i ? "rotate(45deg)" : "rotate(0)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </span>
              </button>
              {open === i && (
                <div style={{ paddingBottom: 22, paddingLeft: 38 }}>
                  <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      <style>{`
        .faq-grid { grid-template-columns: 1fr 1.6fr; }
        @media (max-width: 768px) {
          .faq-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
