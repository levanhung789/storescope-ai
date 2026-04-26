"use client";

import dynamic from "next/dynamic";

const ParticleSphere = dynamic(() => import("./ParticleSphere"), { ssr: false });

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* Sphere — absolute, top-right, large */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "-4vw",
          transform: "translateY(-52%)",
          width: "clamp(420px, 56vw, 860px)",
          height: "clamp(420px, 56vw, 860px)",
          pointerEvents: "none",
        }}
        className="sphere-container"
      >
        <ParticleSphere />
      </div>

      {/* Text — bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(48px, 8vh, 96px)",
          left: "clamp(24px, 5vw, 80px)",
          maxWidth: "clamp(320px, 42vw, 600px)",
          zIndex: 2,
        }}
        className="hero-text"
      >
        <h1
          className="animate-fade-up"
          style={{
            fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)",
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: "#fff",
            marginBottom: "clamp(16px, 2.5vh, 28px)",
            opacity: 0,
          }}
        >
          Turn shelf photos<br />
          into retail<br />
          intelligence.
        </h1>

        <p
          className="animate-fade-up delay-100"
          style={{
            fontSize: "clamp(0.82rem, 1.1vw, 0.96rem)",
            color: "rgba(255,255,255,0.35)",
            lineHeight: 1.7,
            maxWidth: 400,
            marginBottom: "clamp(20px, 3vh, 36px)",
            opacity: 0,
          }}
        >
          StoreScope AI transforms shelf imagery into structured business data —
          brand detection, SKU classification, stock alerts, and competitor analysis
          for FMCG teams.
        </p>

        <div
          className="animate-fade-up delay-200"
          style={{ opacity: 0 }}
        >
          <a
            href="#pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.85rem",
              padding: "11px 22px",
              borderRadius: 999,
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "background 0.25s, transform 0.2s, box-shadow 0.25s",
              boxShadow: "0 0 0 0 rgba(124,58,237,0)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#6d28d9";
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#7c3aed";
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 0 0 0 rgba(124,58,237,0)";
            }}
          >
            Request access
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sphere-container {
            top: 10px !important;
            right: -10vw !important;
            transform: none !important;
            width: 85vw !important;
            height: 85vw !important;
            opacity: 0.7;
          }
          .hero-text {
            bottom: clamp(36px, 6vh, 64px) !important;
            left: 20px !important;
            right: 20px !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
}
