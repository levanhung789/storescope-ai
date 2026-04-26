"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "../_hooks/useInView";

const stats = [
  { value: 98, suffix: "%", label: "Detection accuracy", sub: "Across brand & SKU recognition" },
  { value: 6, suffix: " stages", label: "AI pipeline depth", sub: "OCR → Vision → Normalize → Match" },
  { value: 50, suffix: "K+", label: "SKUs in catalog", sub: "FMCG, dairy, CPG categories" },
  { value: 12, suffix: "x", label: "Faster than manual", sub: "vs. traditional shelf audit" },
];

function Counter({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const duration = 1600;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setCount(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [active, target]);

  return <>{count}{suffix}</>;
}

export default function Stats() {
  const { ref, inView } = useInView({ threshold: 0.3 });

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        padding: "80px 24px",
        borderTop: "1px solid #2a2a2a",
        borderBottom: "1px solid #2a2a2a",
        transition: "opacity 0.7s ease, transform 0.7s ease",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
      }}
    >
      <div
        style={{
          maxWidth: 1152,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
        className="stats-grid"
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              padding: "32px 24px",
              borderRight: i < stats.length - 1 ? "1px solid #2a2a2a" : "none",
              transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(20px)",
            }}
            className="stat-item"
          >
            <div
              style={{
                fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#f0f0f0",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              <Counter target={s.value} suffix={s.suffix} active={inView} />
            </div>
            <p style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 600, margin: "0 0 4px" }}>
              {s.label}
            </p>
            <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stat-item { border-right: none !important; border-bottom: 1px solid #2a2a2a; }
          .stat-item:nth-child(odd) { border-right: 1px solid #2a2a2a !important; }
        }
      `}</style>
    </section>
  );
}
