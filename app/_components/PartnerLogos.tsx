"use client";

const partners = [
  { name: "ARC Network",  abbr: "ARC" },
  { name: "Circle",       abbr: "Circle" },
  { name: "OpenAI",       abbr: "OpenAI" },
  { name: "Roboflow",     abbr: "Roboflow" },
  { name: "wagmi",        abbr: "wagmi" },
  { name: "MetaMask",     abbr: "MetaMask" },
];

export default function PartnerLogos() {
  return (
    <div style={{ borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "20px 24px", background: "#080808" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 12, whiteSpace: "nowrap" }}>
          Trusted by teams using
        </span>
        {partners.map(p => (
          <div key={p.name} style={{ padding: "6px 18px", border: "1px solid #1f1f1f", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#3a3a3a", letterSpacing: "-0.01em", transition: "color 0.2s, border-color 0.2s", cursor: "default" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2a2a2a"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#3a3a3a"; e.currentTarget.style.borderColor = "#1f1f1f"; }}>
            {p.abbr}
          </div>
        ))}
      </div>
    </div>
  );
}
