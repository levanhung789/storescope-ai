"use client";

import { useEffect, useRef } from "react";

interface Particle {
  theta: number;
  phi: number;
  r: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
}

export default function ParticleSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    const PARTICLE_COUNT = 520;
    const particles: Particle[] = [];
    let rotY = 0;

    // Gold dominant (85%), white (8%), purple (7%) — matches reference
    const COLORS = [
      "#f59e0b", "#f59e0b", "#f59e0b", "#f59e0b", "#f59e0b",
      "#fbbf24", "#fbbf24", "#fbbf24", "#fbbf24",
      "#d97706", "#d97706",
      "#ffffff",
      "#a78bfa", "#7c3aed",
    ];

    function resize() {
      const parent = canvas!.parentElement!;
      W = canvas!.width = parent.offsetWidth || 600;
      H = canvas!.height = parent.offsetHeight || 600;
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        // Bias particles toward surface (denser shell, like reference)
        const rBias = Math.pow(Math.random(), 0.4);
        particles.push({
          theta,
          phi,
          r: 0.72 + rBias * 0.28,
          speed: 0.0002 + Math.random() * 0.00035,
          size: 0.9 + Math.random() * 2.0,
          opacity: 0.5 + Math.random() * 0.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      rotY += 0.0022;

      const cx = W / 2;
      const cy = H / 2;
      const radius = Math.min(W, H) * 0.42;

      // Subtle center glow
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.9);
      grad.addColorStop(0, "rgba(245,158,11,0.04)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx!.fill();

      // Project & sort by z
      const projected = particles.map((p) => {
        const r = radius * p.r;
        const sinPhi = Math.sin(p.phi);
        const cosPhi = Math.cos(p.phi);
        const x3d = r * sinPhi * Math.cos(p.theta + rotY);
        const y3d = r * cosPhi;
        const z3d = r * sinPhi * Math.sin(p.theta + rotY);
        const perspective = 900 / (900 + z3d);
        return {
          x: cx + x3d * perspective,
          y: cy + y3d * perspective,
          z: z3d,
          size: p.size * perspective,
          opacity: p.opacity * (0.3 + 0.7 * perspective),
          color: p.color,
        };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(p.size, 0.3), 0, Math.PI * 2);
        ctx!.globalAlpha = Math.min(p.opacity, 1);
        ctx!.fillStyle = p.color;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      for (const p of particles) p.theta += p.speed;

      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
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
