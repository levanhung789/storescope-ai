"use client";

import { useInView } from "../_hooks/useInView";

export default function CtaBanner() {
  const { ref, inView } = useInView({ threshold: 0.2 });

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{ padding: "0 24px 128px" }}
    >
      <div
        style={{
          maxWidth: 1152,
          margin: "0 auto",
          background: "linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(79,70,229,0.06) 100%)",
          border: "1px solid rgba(124,58,237,0.22)",
          borderRadius: 24,
          padding: "clamp(48px, 8vw, 96px) clamp(24px, 6vw, 80px)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          transition: "opacity 0.8s ease, transform 0.8s ease",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
        }}
      >
        {/* Glow blob */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a78bfa", marginBottom: 20 }}>
          Get started today
        </p>

        <h2
          style={{
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#f0f0f0",
            maxWidth: 580,
            margin: "0 auto 20px",
          }}
        >
          Ready to transform shelf photos into retail intelligence?
        </h2>

        <p style={{ fontSize: 15, color: "#6b6b6b", lineHeight: 1.75, maxWidth: 440, margin: "0 auto 40px" }}>
          Join FMCG brands and distribution teams already using StoreScope AI — powered by Shelby on Aptos blockchain for verifiable, tamper-proof shelf data.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="#pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              padding: "14px 28px",
              borderRadius: 999,
              textDecoration: "none",
              transition: "background 0.25s, transform 0.2s, box-shadow 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#6d28d9";
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(124,58,237,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#7c3aed";
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Start free — no credit card
          </a>
          <a
            href="mailto:hello@storescope.ai"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              color: "#a0a0a0",
              fontWeight: 500,
              fontSize: 14,
              padding: "14px 24px",
              borderRadius: 999,
              border: "1px solid #2a2a2a",
              textDecoration: "none",
              transition: "border-color 0.25s, color 0.25s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
              e.currentTarget.style.color = "#f0f0f0";
              e.currentTarget.style.transform = "translateY(-1px) scale(1.01)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2a2a";
              e.currentTarget.style.color = "#a0a0a0";
              e.currentTarget.style.transform = "translateY(0) scale(1)";
            }}
          >
            Talk to sales
          </a>
        </div>
      </div>
    </section>
  );
}
