"use client";

import { useEffect, useRef } from "react";

// ── Retail data labels floating around the sphere ─────────────────────────
const DATA_LABELS = [
  { text: "SoS 42.6%",    color: "#a78bfa" },
  { text: "OSA ✓",        color: "#4ade80" },
  { text: "SKU Match 94%",color: "#7c3aed" },
  { text: "Facing: 12",   color: "#fbbf24" },
  { text: "⚠ Low Stock",  color: "#f87171" },
  { text: "Planogram ✓",  color: "#34d399" },
  { text: "AI Detection", color: "#818cf8" },
  { text: "2.1s / scan",  color: "#c4b5fd" },
];

// ── Brand color clusters ───────────────────────────────────────────────────
const BRAND_COLORS = [
  "#003087", // Pepsi blue
  "#EE1020", // Coca-Cola red
  "#00A550", // 7Up green
  "#FF6600", // Mirinda orange
  "#003087", "#003087",
  "#EE1020", "#EE1020",
  "#7c3aed", "#7c3aed", "#7c3aed",
  "#a78bfa", "#a78bfa",
  "#ffffff",
  "#c4b5fd",
  "#fbbf24",
];

interface Particle {
  theta: number; phi: number; r: number;
  speed: number; size: number; opacity: number; color: string;
}
interface FloatLabel {
  theta: number; phi: number; speed: number;
  label: typeof DATA_LABELS[0]; pulse: number;
}
interface Ring {
  tiltX: number; tiltZ: number; speed: number;
  color: string; lineWidth: number; opacity: number;
  dashOffset: number;
}

export default function ParticleSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    const particles:   Particle[]   = [];
    const labels:      FloatLabel[] = [];
    const rings:       Ring[]       = [];
    let rotY       = 0;
    let scanAngle  = 0;
    let pulseR     = 0;
    let pulseAlpha = 0;

    function resize() {
      const p = canvas!.parentElement!;
      W = canvas!.width  = p.offsetWidth  || 600;
      H = canvas!.height = p.offsetHeight || 600;
    }

    function init() {
      // ── Particles ─────────────────────────────────────────────────────
      particles.length = 0;
      for (let i = 0; i < 480; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const rBias = Math.pow(Math.random(), 0.35);
        particles.push({
          theta, phi,
          r:       0.74 + rBias * 0.26,
          speed:   0.00015 + Math.random() * 0.0003,
          size:    0.8 + Math.random() * 2.2,
          opacity: 0.45 + Math.random() * 0.55,
          color:   BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        });
      }

      // ── Floating data labels ──────────────────────────────────────────
      labels.length = 0;
      DATA_LABELS.forEach((lbl, i) => {
        labels.push({
          theta: (i / DATA_LABELS.length) * Math.PI * 2,
          phi:   0.4 + Math.random() * 2.4,
          speed: 0.0006 + Math.random() * 0.0004,
          label: lbl,
          pulse: Math.random() * Math.PI * 2,
        });
      });

      // ── Orbiting rings ────────────────────────────────────────────────
      rings.length = 0;
      rings.push(
        { tiltX: 0.35,  tiltZ: 0.1,  speed: 0.008,  color: "#7c3aed", lineWidth: 1.2, opacity: 0.35, dashOffset: 0 },
        { tiltX: -0.5,  tiltZ: 0.3,  speed: -0.005, color: "#818cf8", lineWidth: 0.8, opacity: 0.2,  dashOffset: 0 },
        { tiltX: 0.15,  tiltZ: -0.4, speed: 0.011,  color: "#4ade80", lineWidth: 0.6, opacity: 0.18, dashOffset: 0 },
      );
    }

    function drawRing(ring: Ring, cx: number, cy: number, radius: number, rot: number) {
      const rx = radius * 1.18;
      const ry = radius * 0.22;
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(rot + ring.tiltZ);
      ctx!.scale(1, Math.cos(ring.tiltX));
      ctx!.beginPath();
      ctx!.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx!.strokeStyle = ring.color;
      ctx!.lineWidth   = ring.lineWidth;
      ctx!.globalAlpha = ring.opacity;
      ctx!.setLineDash([8, 14]);
      ctx!.lineDashOffset = ring.dashOffset;
      ctx!.stroke();
      ctx!.setLineDash([]);
      ctx!.restore();
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      const cx     = W / 2;
      const cy     = H / 2;
      const radius = Math.min(W, H) * 0.40;

      rotY      += 0.0018;
      scanAngle += 0.012;
      pulseR    += 3;
      pulseAlpha = Math.max(0, 0.35 - pulseR / (radius * 1.4));
      if (pulseR > radius * 1.4) { pulseR = 0; pulseAlpha = 0.35; }

      // ── Outer glow ────────────────────────────────────────────────────
      const outerGlow = ctx!.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.5);
      outerGlow.addColorStop(0,   "rgba(124,58,237,0.08)");
      outerGlow.addColorStop(0.6, "rgba(124,58,237,0.03)");
      outerGlow.addColorStop(1,   "rgba(0,0,0,0)");
      ctx!.fillStyle   = outerGlow;
      ctx!.globalAlpha = 1;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
      ctx!.fill();

      // ── Core glow ─────────────────────────────────────────────────────
      const coreGlow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.6);
      coreGlow.addColorStop(0,   "rgba(167,139,250,0.18)");
      coreGlow.addColorStop(0.5, "rgba(124,58,237,0.06)");
      coreGlow.addColorStop(1,   "rgba(0,0,0,0)");
      ctx!.fillStyle = coreGlow;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx!.fill();

      // ── Pulse ring ────────────────────────────────────────────────────
      ctx!.beginPath();
      ctx!.arc(cx, cy, pulseR + radius * 0.1, 0, Math.PI * 2);
      ctx!.strokeStyle = "#7c3aed";
      ctx!.lineWidth   = 1.5;
      ctx!.globalAlpha = pulseAlpha;
      ctx!.stroke();
      ctx!.globalAlpha = 1;

      // ── Orbit rings ───────────────────────────────────────────────────
      rings.forEach(ring => {
        ring.dashOffset -= ring.speed * 2;
        drawRing(ring, cx, cy, radius, rotY * 0.6);
      });

      // ── Scanning beam ─────────────────────────────────────────────────
      const scanX = cx + Math.cos(scanAngle) * radius * 1.05;
      const scanY = cy + Math.sin(scanAngle) * radius * 0.4;
      const beam  = ctx!.createLinearGradient(cx, cy, scanX, scanY);
      beam.addColorStop(0,   "rgba(167,139,250,0)");
      beam.addColorStop(0.7, "rgba(124,58,237,0.12)");
      beam.addColorStop(1,   "rgba(167,139,250,0.3)");
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(scanX, scanY);
      ctx!.strokeStyle = beam;
      ctx!.lineWidth   = 2;
      ctx!.globalAlpha = 0.6;
      ctx!.stroke();
      ctx!.globalAlpha = 1;

      // ── Project & sort particles ──────────────────────────────────────
      const projected = particles.map(p => {
        const r      = radius * p.r;
        const sinPhi = Math.sin(p.phi);
        const cosPhi = Math.cos(p.phi);
        const x3d    = r * sinPhi * Math.cos(p.theta + rotY);
        const y3d    = r * cosPhi;
        const z3d    = r * sinPhi * Math.sin(p.theta + rotY);
        const persp  = 900 / (900 + z3d);
        return {
          x: cx + x3d * persp,
          y: cy + y3d * persp,
          z: z3d,
          size:    p.size * persp,
          opacity: p.opacity * (0.25 + 0.75 * persp),
          color:   p.color,
        };
      });
      projected.sort((a, b) => a.z - b.z);

      // Draw connection lines (nearby particles)
      ctx!.lineWidth = 0.4;
      for (let i = 0; i < projected.length; i += 6) {
        for (let j = i + 1; j < Math.min(i + 12, projected.length); j++) {
          const dx   = projected[i].x - projected[j].x;
          const dy   = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 28 && projected[i].z > 0 && projected[j].z > 0) {
            ctx!.beginPath();
            ctx!.moveTo(projected[i].x, projected[i].y);
            ctx!.lineTo(projected[j].x, projected[j].y);
            ctx!.strokeStyle = `rgba(167,139,250,${0.12 * (1 - dist / 28)})`;
            ctx!.globalAlpha = 0.5;
            ctx!.stroke();
          }
        }
      }
      ctx!.globalAlpha = 1;

      // Draw particles
      for (const p of projected) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(p.size, 0.3), 0, Math.PI * 2);
        ctx!.globalAlpha = Math.min(p.opacity, 1);
        ctx!.fillStyle   = p.color;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      // ── Floating data labels ──────────────────────────────────────────
      ctx!.font = "bold 9.5px 'Geist Sans', system-ui, sans-serif";
      for (const fl of labels) {
        fl.theta += fl.speed;
        fl.pulse += 0.025;

        const r      = radius * 1.08;
        const sinPhi = Math.sin(fl.phi);
        const cosPhi = Math.cos(fl.phi);
        const x3d    = r * sinPhi * Math.cos(fl.theta + rotY);
        const y3d    = r * cosPhi;
        const z3d    = r * sinPhi * Math.sin(fl.theta + rotY);

        if (z3d < -20) continue; // hide behind sphere

        const persp   = 900 / (900 + z3d);
        const lx      = cx + x3d * persp;
        const ly      = cy + y3d * persp;
        const pAlpha  = (0.3 + 0.7 * persp) * (0.7 + 0.3 * Math.sin(fl.pulse));

        const tw    = ctx!.measureText(fl.label.text).width;
        const pad   = 5;
        const bx    = lx - tw / 2 - pad;
        const by    = ly - 8;
        const bw    = tw + pad * 2;
        const bh    = 16;

        // Pill background
        ctx!.globalAlpha = pAlpha * 0.7;
        ctx!.fillStyle   = "rgba(8,8,8,0.85)";
        ctx!.beginPath();
        ctx!.roundRect(bx, by, bw, bh, 4);
        ctx!.fill();

        // Border
        ctx!.globalAlpha = pAlpha * 0.5;
        ctx!.strokeStyle = fl.label.color;
        ctx!.lineWidth   = 0.7;
        ctx!.stroke();

        // Text
        ctx!.globalAlpha  = pAlpha;
        ctx!.fillStyle    = fl.label.color;
        ctx!.textAlign    = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText(fl.label.text, lx, ly);
      }

      ctx!.globalAlpha  = 1;
      ctx!.textAlign    = "left";
      ctx!.textBaseline = "alphabetic";

      for (const p of particles) p.theta += p.speed;

      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
