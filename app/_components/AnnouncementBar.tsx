"use client";
import { useState } from "react";
import Link from "next/link";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{ background: "linear-gradient(90deg,#4c1d95,#7c3aed,#4c1d95)", color: "#fff", fontSize: 13, textAlign: "center", padding: "9px 48px", position: "relative", letterSpacing: "0.01em" }}>
      <span style={{ opacity: 0.85 }}>🚀 New: </span>
      <strong>ARC Testnet v0.7.1</strong> is live — StoreScope AI analyses now recorded on-chain.{" "}
      <Link href="/dashboard/analysis" style={{ color: "#c4b5fd", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
        Try it free →
      </Link>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss announcement"
        style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>
        ×
      </button>
    </div>
  );
}
