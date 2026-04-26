"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { X, Download, Sparkles } from "lucide-react";
import { LayoutDocument } from "./types";

interface Props { doc: LayoutDocument; onClose: () => void; }

const OUTPUT_W = 2400;
const TITLE_H  = 72;
const LEGEND_H = 52;

// ─── Low-level helpers ────────────────────────────────────────────────────────

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r as number);
}

/** Radial gradient for spherical produce */
function sphereGrad(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  hi: string, mid: string, dark: string,
) {
  const g = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.35, r * 0.06, cx, cy, r);
  g.addColorStop(0, hi); g.addColorStop(0.55, mid); g.addColorStop(1, dark);
  return g;
}

/** Linear gradient shorthand */
function linGrad(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  stops: [number, string][],
) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

/** Draw fixture drop-shadow before body */
function dropShadow(ctx: CanvasRenderingContext2D, fn: () => void) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.26)";
  ctx.shadowBlur   = 12;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 6;
  fn();
  ctx.restore();
}

// ─── Produce item renderers ───────────────────────────────────────────────────

function tomato(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = sphereGrad(ctx, cx, cy, r, "#ff8a8a", "#ef4444", "#991b1b");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.beginPath(); ctx.arc(cx - r * 0.28, cy - r * 0.3, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#16a34a"; ctx.lineWidth = Math.max(1, r * 0.22); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy - r - r * 0.6); ctx.stroke();
  ctx.fillStyle = "#22c55e";
  ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r - r * 0.3, r * 0.38, r * 0.16, -0.5, 0, Math.PI * 2); ctx.fill();
}

function carrot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const g = linGrad(ctx, cx, cy - r * 0.85, cx, cy + r * 0.85, [[0,"#fdba74"],[0.5,"#f97316"],[1,"#c2410c"]]);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.1, r * 0.3, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#15803d"; ctx.lineWidth = Math.max(1.2, r * 0.28); ctx.lineCap = "round";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * r * 0.28, cy - r * 0.6);
    ctx.quadraticCurveTo(cx + i * r * 0.7, cy - r * 0.9, cx + i * r * 0.9, cy - r * 1.15);
    ctx.stroke();
  }
}

function springOnion(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.strokeStyle = "#15803d"; ctx.lineWidth = Math.max(1.5, r * 0.3); ctx.lineCap = "round";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * r * 0.32, cy + r * 0.15);
    ctx.quadraticCurveTo(cx + i * r * 0.45, cy - r * 0.5, cx + i * r * 0.5, cy - r);
    ctx.stroke();
  }
  ctx.fillStyle = sphereGrad(ctx, cx, cy + r * 0.45, r * 0.48, "#f0fdf4", "#bbf7d0", "#86efac");
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.45, r * 0.48, 0, Math.PI * 2); ctx.fill();
}

function cabbage(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = sphereGrad(ctx, cx, cy, r, "#bbf7d0", "#4ade80", "#15803d");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(21,128,61,0.5)"; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath(); ctx.arc(cx - r * 0.22, cy - r * 0.28, r * 0.26, 0, Math.PI * 2); ctx.fill();
}

function onion(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = sphereGrad(ctx, cx, cy, r, "#fef9c3", "#fde68a", "#d97706");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(180,83,9,0.35)"; ctx.lineWidth = 0.7;
  for (let s = 0.45; s <= 0.85; s += 0.2) {
    ctx.beginPath(); ctx.arc(cx, cy, r * s, 0.2, Math.PI * 0.78); ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath(); ctx.arc(cx - r * 0.25, cy - r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
}

function potato(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = sphereGrad(ctx, cx, cy, r, "#e8c89a", "#d4a574", "#92683a");
  ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.82, r * 0.96, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(100,60,20,0.5)";
  ctx.beginPath(); ctx.arc(cx + r * 0.15, cy - r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - r * 0.25, cy + r * 0.3, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
}

type ProduceKind = "tomato"|"carrot"|"spring_onion"|"cabbage"|"onion"|"potato";
const PRODUCE_DRAW: Record<ProduceKind, (c: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void> = {
  tomato: tomato, carrot: carrot, spring_onion: springOnion,
  cabbage: cabbage, onion: onion, potato: potato,
};
const KINDS: ProduceKind[] = ["tomato","carrot","onion","spring_onion","cabbage","potato"];

// ─── Product box (for shelves) ────────────────────────────────────────────────

function productBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  // Main face
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
  // Top lighter edge
  const topG = linGrad(ctx, x, y, x, y + h * 0.28, [[0,"rgba(255,255,255,0.35)"],[1,"rgba(255,255,255,0)"]]);
  ctx.fillStyle = topG; ctx.fillRect(x, y, w, h * 0.28);
  // Right darker edge
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(x + w - 2, y, 2, h);
}

// ─── Fixture draw functions ───────────────────────────────────────────────────

function drawCheckoutFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => {
    ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#2a2a2a"],[1,"#111"]]);
    rr(ctx, 0, 0, w, d, 5); ctx.fill();
  });
  // Silver top rail
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d * 0.13, [[0,"#bbbbbb"],[1,"#888"]]);
  ctx.fillRect(0, 0, w, d * 0.13);
  // Red stripe
  ctx.fillStyle = linGrad(ctx, 0, d*0.36, 0, d*0.62, [[0,"#f87171"],[0.5,"#dc2626"],[1,"#b91c1c"]]);
  ctx.fillRect(0, d * 0.36, w, d * 0.26);
  // Silver bottom
  ctx.fillStyle = "#666"; ctx.fillRect(0, d * 0.86, w, d * 0.14);
  // Conveyor belt
  ctx.fillStyle = linGrad(ctx, 4, d*0.14, 4+w*0.6, d*0.14, [[0,"#3a3a3a"],[1,"#222"]]);
  ctx.fillRect(4, d * 0.14, w * 0.6, d * 0.21);
  ctx.strokeStyle = "#555"; ctx.lineWidth = 0.8;
  for (let bx = 10; bx < w * 0.57; bx += Math.max(9, w * 0.065)) {
    ctx.beginPath(); ctx.moveTo(bx, d * 0.14); ctx.lineTo(bx, d * 0.35); ctx.stroke();
  }
  // POS screen
  const posW = Math.min(w * 0.2, 22);
  ctx.fillStyle = "#0a0a0a"; ctx.fillRect(w - posW - 4, 3, posW, d * 0.32);
  ctx.fillStyle = linGrad(ctx, w-posW-3, 4, w-3, 4+d*0.21, [[0,"#1e6fb5"],[1,"#0d4a8a"]]);
  ctx.fillRect(w - posW - 3, 4, posW - 2, d * 0.21);
  ctx.fillStyle = "rgba(90,180,240,0.45)"; ctx.fillRect(w - posW - 2, 5, posW - 4, d * 0.07);
  // Border
  ctx.strokeStyle = "#555"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 5); ctx.stroke();
}

function lemon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = sphereGrad(ctx, cx, cy, r, "#fef08a", "#facc15", "#a16207");
  ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.15, r * 0.88, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.beginPath(); ctx.ellipse(cx - r * 0.28, cy - r * 0.28, r * 0.28, r * 0.2, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#854d0e"; ctx.lineWidth = Math.max(0.8, r * 0.14);
  ctx.beginPath(); ctx.moveTo(cx + r * 1.1, cy); ctx.lineTo(cx + r * 1.35, cy - r * 0.18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - r * 1.1, cy); ctx.lineTo(cx - r * 1.35, cy + r * 0.18); ctx.stroke();
}

function apple(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = sphereGrad(ctx, cx, cy, r, "#86efac", "#22c55e", "#14532d");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath(); ctx.arc(cx - r * 0.26, cy - r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#15803d"; ctx.lineWidth = Math.max(1, r * 0.18); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx + r * 0.08, cy - r * 0.92);
  ctx.quadraticCurveTo(cx + r * 0.35, cy - r * 1.35, cx + r * 0.55, cy - r * 1.15); ctx.stroke();
}

function drawProduceFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  // Dark thick wood frame — matches reference image
  dropShadow(ctx, () => {
    ctx.fillStyle = "#1c0a00"; rr(ctx, 0, 0, w, d, 8); ctx.fill();
  });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#4a2208"],[0.45,"#2d1205"],[1,"#1a0902"]]);
  rr(ctx, 0, 0, w, d, 8); ctx.fill();
  // Wood grain lines
  ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 1.2;
  for (let i = 1; i < 5; i++) {
    const gx = w * i / 5;
    ctx.beginPath(); ctx.moveTo(gx + 2, 0); ctx.lineTo(gx - 2, d); ctx.stroke();
  }

  const FRAME = Math.max(5, Math.round(w * 0.04));
  const DIVW  = Math.max(3, Math.round(w * 0.025));
  const COLS = 3, ROWS = 2;
  const cellW = (w - FRAME * 2 - DIVW * (COLS - 1)) / COLS;
  const cellH = (d - FRAME * 2 - DIVW * (ROWS - 1)) / ROWS;

  // 6 cells: top row = tomato / apple / lemon, bottom row = spring_onion / carrot / onion
  // matches reference: red / green / yellow-green top; green leafy / orange / yellow bottom
  const CELL_KINDS: Array<"tomato"|"apple"|"lemon"|"spring_onion"|"carrot"|"onion"> = [
    "tomato", "apple", "lemon",
    "spring_onion", "carrot", "onion",
  ];
  const CELL_DRAW: Record<string, (c: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void> = {
    tomato, apple, lemon, spring_onion: springOnion, carrot, onion,
  };
  const CELL_BG: Record<string, string> = {
    tomato: "#1a0500", apple: "#0a1500", lemon: "#1a1200",
    spring_onion: "#0a1500", carrot: "#1a0800", onion: "#16100a",
  };

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const idx  = row * COLS + col;
      const kind = CELL_KINDS[idx];
      const cx   = FRAME + col * (cellW + DIVW);
      const cy   = FRAME + row * (cellH + DIVW);

      // Cell dark background (wooden crate interior)
      ctx.fillStyle = linGrad(ctx, cx, cy, cx, cy + cellH,
        [[0, CELL_BG[kind]], [1, "#080300"]]);
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 4); ctx.fill();
      // Inner top shadow
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(cx, cy, cellW, Math.min(8, cellH * 0.16));
      // Inner bottom highlight (rim light)
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(cx, cy + cellH - 3, cellW, 3);
      // Cell border
      ctx.strokeStyle = "#0a0400"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 4); ctx.stroke();

      // Pack items in hex-offset rows
      const margin = Math.max(2, cellW * 0.04);
      const availW = cellW - margin * 2;
      const availH = cellH - margin * 2;
      const itemR  = Math.min(availW, availH) * 0.25;
      const iCols  = Math.max(1, Math.floor(availW / (itemR * 1.72)));
      const iRows  = Math.max(1, Math.floor(availH / (itemR * 1.72)));
      const spX    = availW / iCols;
      const spY    = availH / iRows;

      for (let ir = 0; ir < iRows; ir++) {
        const stagger = (ir % 2 === 1) ? spX * 0.44 : 0;
        for (let ic = 0; ic < iCols; ic++) {
          const px = cx + margin + (ic + 0.5) * spX + stagger;
          const py = cy + margin + (ir + 0.5) * spY;
          if (px < cx + cellW - margin * 0.5)
            CELL_DRAW[kind](ctx, px, py, itemR);
        }
      }
    }
  }

  // Outer frame border
  ctx.strokeStyle = "#0f0500"; ctx.lineWidth = 3; rr(ctx, 0, 0, w, d, 8); ctx.stroke();
  // Subtle inner highlight on frame top edge
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(FRAME, 2, w - FRAME * 2, 2);
}

function drawFreshCounterFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => {
    ctx.fillStyle = "#b8c4cc"; rr(ctx, 0, 0, w, d, 5); ctx.fill();
  });
  // Stainless base
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#d0dae0"],[1,"#a8b8c0"]]);
  rr(ctx, 0, 0, w, d, 5); ctx.fill();
  // Glass top case
  const gd = d * 0.48;
  ctx.fillStyle = linGrad(ctx, 2, 2, 2, gd, [[0,"#e8f4fc"],[0.3,"#d0eaf8"],[1,"#b8d8f0"]]);
  rr(ctx, 2, 4, w - 4, gd, 3); ctx.fill();
  // Glass shine reflection
  ctx.fillStyle = "rgba(255,255,255,0.52)";
  ctx.fillRect(3, 5, w - 6, gd * 0.28);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(3, 5 + gd * 0.3, w - 6, gd * 0.1);
  // Food items
  const ic = Math.max(2, Math.floor(w / 44));
  const iw = (w - 10) / ic;
  const foodColors = [
    ["#fca5a5","#ef4444"],["#fdba74","#f97316"],["#bfdbfe","#3b82f6"],
    ["#fde68a","#d97706"],["#d9f99d","#65a30d"],["#e9d5ff","#9333ea"],
  ];
  for (let i = 0; i < ic; i++) {
    const [light, dark] = foodColors[i % foodColors.length];
    ctx.fillStyle = linGrad(ctx, 5+i*iw, gd*0.38, 5+i*iw, gd*0.88, [[0,light],[1,dark]]);
    ctx.beginPath(); ctx.roundRect(5 + i * iw, gd * 0.38, iw - 2, gd * 0.5, 3); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.roundRect(5 + i * iw, gd * 0.38, iw - 2, gd * 0.5, 3); ctx.stroke();
  }
  // Curved front glass
  ctx.fillStyle = linGrad(ctx, 2, gd+4, 2, d*0.6, [[0,"#c8dce8"],[1,"#9ab4c4"]]);
  ctx.fillRect(2, gd + 4, w - 4, d * 0.1);
  // Lower stainless
  ctx.fillStyle = linGrad(ctx, 2, d*0.6, 2, d, [[0,"#b0bec5"],[1,"#8fa0a8"]]);
  rr(ctx, 2, d * 0.6, w - 4, d * 0.38, [0, 0, 4, 4]); ctx.fill();
  // Vent slots
  for (let i = 0; i < Math.floor((w - 12) / 14); i++) {
    ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.fillRect(6 + i * 14, d - 6, 9, 3);
  }
  ctx.strokeStyle = "#8a9299"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 5); ctx.stroke();
}

function drawCoolerFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => {
    ctx.fillStyle = "#0a1520"; rr(ctx, 0, 0, w, d, 4); ctx.fill();
  });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#1a2a3a"],[1,"#0a1218"]]);
  rr(ctx, 0, 0, w, d, 4); ctx.fill();
  // Top bar
  ctx.fillStyle = linGrad(ctx, 0, 0, w, 0, [[0,"#243040"],[1,"#182430"]]);
  ctx.fillRect(0, 0, w, Math.max(d * 0.1, 6));

  const doors = Math.max(1, Math.round(w / 70));
  const dw = (w - 4) / doors;
  const dp = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316","#06b6d4"];
  const dd = ["#dbeafe","#fef9ee","#dcfce7","#f5f3ff","#fff7ed"];

  for (let door = 0; door < doors; door++) {
    const dx = 2 + door * dw;
    const pal = door === doors - 1 ? dd : dp;
    const rows = Math.max(3, Math.floor(d * 0.75 / 7));
    const cols = Math.max(2, Math.floor((dw - 6) / 6));
    // Door panel
    ctx.fillStyle = linGrad(ctx, dx, d*0.1, dx, d*0.94, [[0,"#0d1e2e"],[1,"#06101a"]]);
    ctx.beginPath(); ctx.roundRect(dx, d*0.11, dw-2, d*0.83, 2); ctx.fill();
    // Glass tint
    ctx.fillStyle = "rgba(130,200,240,0.06)";
    ctx.fillRect(dx+1, d*0.12, dw-4, d*0.82);
    // Glass shine strip
    ctx.fillStyle = linGrad(ctx, dx+1, d*0.12, dx+1+dw*0.25, d*0.12, [[0,"rgba(200,235,255,0.12)"],[1,"rgba(200,235,255,0)"]]);
    ctx.fillRect(dx+1, d*0.12, dw*0.25, d*0.82);
    // Drink columns
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const color = pal[(door * 3 + col + row) % pal.length];
        productBox(ctx, dx + 3 + col * 6, d*0.13 + row*(d*0.79/rows), 4, d*0.79/rows - 2, color);
      }
    }
    // Handle
    ctx.fillStyle = linGrad(ctx, 0, 0, 4, 0, [[0,"#888"],[1,"#444"]]);
    const hx = door < doors - 1 ? dx+dw-5 : dx;
    ctx.beginPath(); ctx.roundRect(hx, d*0.4, 3, d*0.18, 1.5); ctx.fill();
    if (door > 0) { ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(dx, d*0.11); ctx.lineTo(dx, d*0.94); ctx.stroke(); }
  }
  // Footer
  ctx.fillStyle = "#0a1520"; ctx.fillRect(0, d*0.95, w, d*0.05);
  ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 4); ctx.stroke();
}

function drawFoodCoolerFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => {
    ctx.fillStyle = "#0d2418"; rr(ctx, 0, 0, w, d, 4); ctx.fill();
  });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#1a3a24"],[1,"#0a1a10"]]);
  rr(ctx, 0, 0, w, d, 4); ctx.fill();
  const hh = Math.max(d*0.12, 6);
  ctx.fillStyle = linGrad(ctx, 0, 0, w, 0, [[0,"#166534"],[1,"#14532d"]]);
  ctx.beginPath(); ctx.roundRect(0, 0, w, hh, [4,4,0,0]); ctx.fill();
  ctx.fillStyle = "#0d2418"; ctx.fillRect(2, hh+1, w-4, d-hh-3);
  ctx.fillStyle = "rgba(60,200,100,0.06)"; ctx.fillRect(2, hh+1, w-4, d-hh-3);
  // Glass shine
  ctx.fillStyle = linGrad(ctx, 2, hh, 2+(w*0.2), hh, [[0,"rgba(255,255,255,0.07)"],[1,"rgba(255,255,255,0)"]]);
  ctx.fillRect(2, hh+1, w*0.2, d-hh-3);
  const rows = 4, rh = (d-hh-8)/rows;
  const cols = Math.max(3, Math.floor(w/6)), cw = (w-6)/cols;
  const pals = [
    ["#fef9ee","#fef3c7","#f0fdf4","#fff","#fef9ee","#f0fdf4"],
    ["#4ade80","#22c55e","#86efac","#4ade80","#dcfce7","#22c55e"],
    ["#fca5a5","#fcd34d","#86efac","#93c5fd","#fca5a5","#fcd34d"],
    ["#f0fdf4","#fef9ee","#fff","#fef3c7","#f0fdf4","#fef9ee"],
  ];
  for (let row = 0; row < rows; row++) for (let col = 0; col < Math.min(cols, 6); col++) {
    ctx.fillStyle = pals[row][col%6]; ctx.globalAlpha = 0.92;
    ctx.fillRect(3+col*cw, hh+4+row*rh, cw-1, rh-2); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = linGrad(ctx, w/2-3, d*0.42, w/2+3, d*0.42, [[0,"#888"],[1,"#444"]]);
  ctx.beginPath(); ctx.roundRect(w/2-3, d*0.42, 6, d*0.14, 3); ctx.fill();
  ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 4); ctx.stroke();
}

function drawPepsiCoolerFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => { ctx.fillStyle = "#003087"; rr(ctx, 0, 0, w, d, 4); ctx.fill(); });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#004aad"],[0.6,"#003087"],[1,"#001f5c"]]);
  rr(ctx, 0, 0, w, d, 4); ctx.fill();
  const hh = Math.max(d*0.1,5), bh = Math.max(d*0.14,7), dh = d-hh-bh-6;
  ctx.fillStyle = "#001f5c"; ctx.beginPath(); ctx.roundRect(0,0,w,hh,[4,4,0,0]); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.88;
  ctx.beginPath(); ctx.arc(w/2, hh/2, Math.min(hh*0.38,5), 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = linGrad(ctx, 2, hh+1, 2, hh+dh, [[0,"#002a80"],[1,"#001a50"]]);
  ctx.fillRect(2, hh+1, w-4, dh);
  ctx.fillStyle = "rgba(100,150,255,0.06)"; ctx.fillRect(2, hh+1, w-4, dh);
  ctx.fillStyle = linGrad(ctx, 2, hh, 2+w*0.22, hh, [[0,"rgba(200,220,255,0.1)"],[1,"rgba(200,220,255,0)"]]);
  ctx.fillRect(2, hh+1, w*0.22, dh);
  const cols = Math.max(2, Math.floor(w/8)), cw = (w-4)/cols;
  const br = Math.max(2, Math.floor(dh/10)), rbh = dh/br-1;
  for (let col=0; col<cols; col++) for (let row=0; row<br; row++) {
    ctx.fillStyle = linGrad(ctx, 2+col*cw, 0, 2+col*cw+cw, 0, [[0,"#2d88d4"],[1,"#1d6fb5"]]);
    ctx.globalAlpha = 0.92;
    ctx.fillRect(2+col*cw, hh+2+row*(rbh+1), cw-1, rbh);
    ctx.fillStyle = "#EE2737";
    ctx.fillRect(2+col*cw, hh+2+row*(rbh+1), cw-1, Math.max(2,rbh*0.22));
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#fff"; ctx.fillRect(0, d-bh-4, w, bh);
  ctx.fillStyle = "#003087"; ctx.font = `bold ${Math.max(7,bh*0.52)}px Arial,sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("PEPSI", w/2, d-bh/2-4);
  ctx.fillStyle = linGrad(ctx, 0, d-5, 0, d, [[0,"#ff3344"],[1,"#cc1122"]]);
  ctx.beginPath(); ctx.roundRect(0, d-5, w, 5, [0,0,4,4]); ctx.fill();
  ctx.strokeStyle = "#0060cc"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 4); ctx.stroke();
}

function drawWallShelfFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => { ctx.fillStyle = "#111"; rr(ctx, 0, 0, w, d, 4); ctx.fill(); });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#1e1e1e"],[1,"#0d0d0d"]]);
  rr(ctx, 0, 0, w, d, 4); ctx.fill();
  const hh = Math.max(d*0.15, 6);
  ctx.fillStyle = linGrad(ctx, 0, 0, w, 0, [[0,"#2a2a2a"],[1,"#222"]]);
  ctx.fillRect(0, 0, w, hh);
  const tabs = Math.min(5, Math.floor(w/26));
  for (let i = 0; i < tabs; i++) {
    ctx.fillStyle = "#333"; ctx.fillRect(3+i*(w-6)/tabs, 2, (w-6)/tabs-2, hh-5);
    ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(3+i*(w-6)/tabs, 2, (w-6)/tabs-2, (hh-5)*0.4);
  }
  const shelves = Math.max(2, Math.floor(d/28));
  const cols    = Math.max(4, Math.floor(w/9));
  const cw = (w-4)/cols, ch = (d-hh)/shelves;
  const pal = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316","#06b6d4","#eab308","#ec4899","#84cc16","#fbbf24","#14b8a6"];
  for (let row = 0; row < shelves; row++) {
    ctx.fillStyle = "#252525"; ctx.fillRect(0, hh+row*ch, w, 2);
    for (let col = 0; col < cols; col++) {
      productBox(ctx, 2+col*cw, hh+row*ch+2, cw-1.5, ch-4, pal[(row*cols+col)%pal.length]);
    }
  }
  ctx.strokeStyle = "#2a2a2a"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 4); ctx.stroke();
}

function drawGondolaFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => {
    ctx.fillStyle = "#14532d"; rr(ctx, 0, 0, w, d, 7); ctx.fill();
  });
  // Green rounded frame
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#1a6b38"],[0.5,"#14532d"],[1,"#0f3d20"]]);
  rr(ctx, 0, 0, w, d, 7); ctx.fill();
  // Frame gloss
  ctx.fillStyle = linGrad(ctx, 0, 0, w*0.5, 0, [[0,"rgba(255,255,255,0.12)"],[1,"rgba(255,255,255,0)"]]);
  rr(ctx, 0, 0, w, d, 7); ctx.fill();
  const hh = Math.max(d*0.16, 6), fh = Math.max(d*0.16, 6), mid = d-hh-fh;
  // Dark inner body
  ctx.fillStyle = linGrad(ctx, 5, hh, 5, d-fh, [[0,"#1a1a1a"],[1,"#111"]]);
  rr(ctx, 5, hh, w-10, mid, 2); ctx.fill();
  const cols = Math.max(3, Math.floor(w/12)), cw = (w-10)/cols;
  for (let c = 0; c < cols; c++) {
    productBox(ctx, 5+c*cw+1, hh+3, cw-3, mid*0.43, ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316","#06b6d4","#eab308"][c%8]);
  }
  // Center divider
  ctx.fillStyle = "#0a2a12"; ctx.fillRect(0, hh+mid*0.48, w, 5);
  for (let c = 0; c < cols; c++) {
    productBox(ctx, 5+c*cw+1, hh+mid*0.54, cw-3, mid*0.42, ["#3b82f6","#a855f7","#ef4444","#f59e0b","#22c55e","#f97316","#06b6d4","#ec4899"][c%8]);
  }
  ctx.strokeStyle = "#22a350"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 7); ctx.stroke();
}

function drawEndcapFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => { ctx.fillStyle = "#14532d"; rr(ctx, 0, 0, w, d, 5); ctx.fill(); });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#1a6b38"],[1,"#0f3d20"]]);
  rr(ctx, 0, 0, w, d, 5); ctx.fill();
  const hh = Math.max(d*0.2, 5);
  ctx.fillStyle = "#111"; rr(ctx, 4, hh, w-8, d-hh-4, 2); ctx.fill();
  const cols = Math.max(2, Math.floor(w/13)), cw = (w-8)/cols, rh = (d-hh-8)/3;
  const pal  = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316"];
  for (let row = 0; row < 3; row++) {
    ctx.fillStyle = "#222"; ctx.fillRect(4, hh+row*rh, w-8, 1.5);
    for (let c = 0; c < cols; c++) {
      productBox(ctx, 4+c*cw+1, hh+row*rh+2, cw-3, rh-4, pal[(row*cols+c)%pal.length]);
    }
  }
  ctx.strokeStyle = "#22a350"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 5); ctx.stroke();
}

function drawBakeryFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => { ctx.fillStyle = "#78350f"; rr(ctx, 0, 0, w, d, 6); ctx.fill(); });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#92400e"],[0.5,"#78350f"],[1,"#451a03"]]);
  rr(ctx, 0, 0, w, d, 6); ctx.fill();
  const hh = Math.max(d*0.18, 7), sr = 3, rh = (d-hh-4)/sr;
  const items = Math.max(2, Math.floor(w/20)), iw = (w-6)/items;
  const pb = ["#fcd34d","#d97706","#fbbf24","#f59e0b","#fcd34d","#b45309"];
  for (let row = 0; row < sr; row++) {
    ctx.fillStyle = linGrad(ctx, 0, hh+row*rh, 0, hh+(row+1)*rh, [[0,row%2===0?"#a16207":"#92400e"],[1,row%2===0?"#7a4a05":"#6b3205"]]);
    ctx.fillRect(0, hh+row*rh, w, rh);
    ctx.fillStyle = "#2a0e00"; ctx.fillRect(0, hh+row*rh, w, 2);
    for (let i = 0; i < items; i++) {
      const bx = 3+i*iw+iw/2, by = hh+row*rh+rh*0.52;
      const color = pb[i%pb.length];
      const grad = ctx.createRadialGradient(bx-iw*0.14, by-rh*0.18, 1, bx, by, iw*0.42);
      grad.addColorStop(0, "#fff8dc"); grad.addColorStop(0.4, color); grad.addColorStop(1, "#78350f");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(bx, by, iw*0.42, rh*0.42, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath(); ctx.ellipse(bx-iw*0.14, by-rh*0.18, iw*0.14, rh*0.12, 0, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.strokeStyle = "#2a0e00"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 6); ctx.stroke();
}

function drawPromoFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => { ctx.fillStyle = "#991b1b"; rr(ctx, 0, 0, w, d, 6); ctx.fill(); });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#dc2626"],[1,"#7f1d1d"]]);
  rr(ctx, 0, 0, w, d, 6); ctx.fill();
  ctx.fillStyle = linGrad(ctx, 5, 5, 5, d-5, [[0,"#ef4444"],[1,"#b91c1c"]]);
  rr(ctx, 5, 5, w-10, d-10, 3); ctx.fill();
  const pal  = ["#fbbf24","#ef4444","#f97316","#22c55e","#3b82f6","#a855f7","#06b6d4","#eab308"];
  const cols = Math.max(2, Math.floor(w/28)), rows = Math.max(2, Math.floor(d/28));
  const cw   = (w-12)/cols, ch = (d-12)/rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    productBox(ctx, 6+c*cw+1, 6+r*ch+1, cw-2, ch-2, pal[(r*cols+c)%pal.length]);
  }
  ctx.strokeStyle = "#ff6666"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 6); ctx.stroke();
}

function drawImpulseFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => { ctx.fillStyle = "#111"; rr(ctx, 0, 0, w, d, 5); ctx.fill(); });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#1a1a1a"],[1,"#0a0a0a"]]);
  rr(ctx, 0, 0, w, d, 5); ctx.fill();
  const hh = Math.max(d*0.22, 6);
  ctx.fillStyle = linGrad(ctx, 0, 0, w, 0, [[0,"#166534"],[1,"#14532d"]]);
  ctx.beginPath(); ctx.roundRect(0, 0, w, hh, [5,5,0,0]); ctx.fill();
  const cols = Math.max(1, Math.floor(w/11)), cw = (w-4)/cols, sr = 3, rh = (d-hh-4)/sr;
  const pal  = ["#fbbf24","#ef4444","#22c55e","#3b82f6","#f97316","#a855f7"];
  for (let row = 0; row < sr; row++) {
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, hh+row*rh, w, 2);
    for (let c = 0; c < cols; c++) {
      productBox(ctx, 2+c*cw, hh+row*rh+2, cw-2, rh-4, pal[(row*cols+c)%pal.length]);
    }
  }
  ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 1.5; rr(ctx, 0, 0, w, d, 5); ctx.stroke();
}

function drawBush(ctx: CanvasRenderingContext2D, bx: number, by: number, r: number) {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath(); ctx.ellipse(bx + 2, by + r * 0.65, r * 0.75, r * 0.22, 0, 0, Math.PI*2); ctx.fill();
  // Dark base layer
  ctx.fillStyle = "#14532d";
  ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI*2); ctx.fill();
  // Mid layer clusters
  const clusters = [[-0.3,-0.1,0.72],[ 0.28, 0.12,0.62],[-0.05,-0.28,0.58],[0.1,0.25,0.55]];
  clusters.forEach(([ox,oy,sr2]) => {
    ctx.fillStyle = "#16a34a";
    ctx.beginPath(); ctx.arc(bx+ox*r, by+oy*r, sr2*r, 0, Math.PI*2); ctx.fill();
  });
  // Light top clusters
  ctx.fillStyle = "#4ade80";
  ctx.beginPath(); ctx.arc(bx-0.12*r, by-0.3*r, 0.48*r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#86efac";
  ctx.beginPath(); ctx.arc(bx-0.18*r, by-0.42*r, 0.26*r, 0, Math.PI*2); ctx.fill();
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath(); ctx.arc(bx-0.22*r, by-0.44*r, 0.2*r, 0, Math.PI*2); ctx.fill();
}

function drawEntryFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => { ctx.fillStyle = "#f0fdf4"; rr(ctx, 0, 0, w, d, 5); ctx.fill(); });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#f8fff8"],[1,"#e8f5ea"]]);
  rr(ctx, 0, 0, w, d, 5); ctx.fill();
  // Door panels
  const pw = w * 0.38;
  ctx.fillStyle = linGrad(ctx, 2, 2, pw+2, 2, [[0,"#fff"],[1,"#e8f5e9"]]);
  ctx.strokeStyle = "#86efac"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(2, 2, pw, d-4, [4,0,0,4]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = linGrad(ctx, w-pw-2, 2, w-2, 2, [[0,"#e8f5e9"],[1,"#fff"]]);
  ctx.beginPath(); ctx.roundRect(w-pw-2, 2, pw, d-4, [0,4,4,0]); ctx.fill(); ctx.stroke();
  // Glass shine on panels
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(4, 3, pw*0.28, d-6);
  ctx.fillRect(w-pw, 3, pw*0.28, d-6);
  // Center sign
  const sh = Math.min(d*0.48, 30), sw = Math.min(w*0.28, 80);
  ctx.fillStyle = linGrad(ctx, (w-sw)/2, (d-sh)/2, (w+sw)/2, (d+sh)/2, [[0,"#16a34a"],[1,"#14532d"]]);
  ctx.beginPath(); ctx.roundRect((w-sw)/2, (d-sh)/2, sw, sh, 5); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect((w-sw)/2+2, (d-sh)/2+2, sw-4, sh*0.35);
  ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.max(7,sh*0.36)}px Arial,sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("Cửa vào / Ra", w/2, d/2);
  // Pole base
  ctx.fillStyle = "#555"; ctx.beginPath(); ctx.arc(w/2, d-4, 3, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 5); ctx.stroke();
  // PLANTS outside fixture bounds
  const pr = Math.min(d*0.52, w*0.1, 20);
  drawBush(ctx, -pr*0.4, d/2, pr);
  drawBush(ctx, w+pr*0.4, d/2, pr);
}

function drawObstacleFx(ctx: CanvasRenderingContext2D, w: number, d: number) {
  dropShadow(ctx, () => { ctx.fillStyle = "#fef2f2"; rr(ctx, 0, 0, w, d, 5); ctx.fill(); });
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, d, [[0,"#fff5f5"],[1,"#fee2e2"]]);
  rr(ctx, 0, 0, w, d, 5); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(0, 0, w, d, 5); ctx.clip();
  ctx.strokeStyle = "#ef4444"; ctx.globalAlpha = 0.14;
  const ss = Math.min(w, d) * 0.4;
  for (let off = -d*1.5; off < d*2; off += ss) {
    ctx.lineWidth = ss*0.5; ctx.beginPath(); ctx.moveTo(off, 0); ctx.lineTo(off+d*1.5, d); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
  const lw = Math.max(3, Math.min(w,d)*0.09);
  ctx.strokeStyle = "#ef4444"; ctx.lineWidth = lw; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(w-6, d-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w-6, 6); ctx.lineTo(6, d-6); ctx.stroke();
  ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 5); ctx.stroke();
}

function drawFixtureFx(
  ctx: CanvasRenderingContext2D,
  type: string,
  w: number,
  d: number,
  imgs?: Map<string, HTMLImageElement>,
) {
  // Helper: draw a loaded image clipped to rounded rect, fall back to procedural
  function drawImgOrFallback(key: string, fallback: () => void) {
    const img = imgs?.get(key);
    if (img) {
      dropShadow(ctx, () => {
        ctx.fillStyle = "#000"; rr(ctx, 0, 0, w, d, 6); ctx.fill();
      });
      ctx.save();
      ctx.beginPath(); ctx.roundRect(0, 0, w, d, 6); ctx.clip();
      ctx.drawImage(img, 0, 0, w, d);
      ctx.restore();
      ctx.strokeStyle = "#2a0e00"; ctx.lineWidth = 2; rr(ctx, 0, 0, w, d, 6); ctx.stroke();
    } else {
      fallback();
    }
  }

  switch (type) {
    case "checkout":          drawCheckoutFx(ctx, w, d);      break;
    case "produce_shelf":     drawImgOrFallback("produce_shelf", () => drawProduceFx(ctx, w, d)); break;
    case "fresh_counter":
    case "freezer_island":    drawFreshCounterFx(ctx, w, d);  break;
    case "food_cooler":       drawFoodCoolerFx(ctx, w, d);    break;
    case "pepsi_cooler":      drawPepsiCoolerFx(ctx, w, d);   break;
    case "cooler_upright":    drawCoolerFx(ctx, w, d);        break;
    case "wall_shelf":        drawWallShelfFx(ctx, w, d);     break;
    case "gondola_double":    drawGondolaFx(ctx, w, d);       break;
    case "endcap":            drawEndcapFx(ctx, w, d);        break;
    case "bakery_shelf":      drawBakeryFx(ctx, w, d);        break;
    case "promo_island":      drawPromoFx(ctx, w, d);         break;
    case "checkout_impulse":
    case "queue_rail":        drawImpulseFx(ctx, w, d);       break;
    case "entry_exit":        drawEntryFx(ctx, w, d);         break;
    case "obstacle":          drawObstacleFx(ctx, w, d);      break;
    default:                  drawGondolaFx(ctx, w, d);
  }
}

// ─── Label ────────────────────────────────────────────────────────────────────

function drawLabel(ctx: CanvasRenderingContext2D, label: string, w: number, d: number) {
  const fs = Math.max(10, Math.min(16, w * 0.09, d * 0.22));
  ctx.save();
  ctx.font = `bold ${fs}px Arial, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const maxW = w - 10;
  const tw   = Math.min(ctx.measureText(label).width, maxW);
  const bw = tw + 16, bh = fs + 10;
  const bx = (w - bw) / 2, by = (d - bh) / 2;
  // Shadow under label
  ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.fillStyle = "rgba(0,0,0,0.84)";
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, w/2, d/2, maxW - 4);
  ctx.restore();
}

// ─── Legend bar ───────────────────────────────────────────────────────────────

function drawLegendItem(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, border: string, label: string) {
  ctx.fillStyle = color; ctx.strokeStyle = border; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(x, y-7, 20, 13, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#4a4040"; ctx.font = "12px Arial,sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(label, x+26, y);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LayoutExporter({ doc, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgs] = useState(() => new Map<string, HTMLImageElement>());
  const [imgReady, setImgReady] = useState(false);

  // Preload fixture images from public/fixtures/
  useEffect(() => {
    const FIXTURE_IMAGES: [string, string][] = [
      ["produce_shelf", "/fixtures/produce_shelf.png"],
    ];
    let loaded = 0;
    FIXTURE_IMAGES.forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => { imgs.set(key, img); loaded++; if (loaded === FIXTURE_IMAGES.length) setImgReady(true); };
      img.onerror = () => { loaded++; if (loaded === FIXTURE_IMAGES.length) setImgReady(true); };
      img.src = src;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const render = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const cW = doc.canvas.width, cH = doc.canvas.height;
    const scale   = OUTPUT_W / cW;
    const layoutH = Math.round(cH * scale);
    el.width = OUTPUT_W; el.height = TITLE_H + layoutH + LEGEND_H;

    // ── Title ──
    const tg = ctx.createLinearGradient(0, 0, OUTPUT_W, 0);
    tg.addColorStop(0, "#0a0a0a"); tg.addColorStop(1, "#160e22");
    ctx.fillStyle = tg; ctx.fillRect(0, 0, OUTPUT_W, TITLE_H);
    ctx.fillStyle = "#7c3aed"; ctx.fillRect(0, TITLE_H-3, OUTPUT_W, 3);
    ctx.fillStyle = "#f0f0f0"; ctx.font = "bold 30px Arial,sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(doc.store.name, 32, TITLE_H/2-8);
    const area = Math.round((cW/1000)*(cH/1000));
    ctx.fillStyle = "#888"; ctx.font = "13px Arial,sans-serif";
    ctx.fillText(`${doc.fixtures.length} khu vực · ${doc.walls.length} tường · ${Math.round(cW/1000)}×${Math.round(cH/1000)}m · ${area}m²`, 32, TITLE_H/2+14);
    ctx.textAlign = "right";
    ctx.fillStyle = "#555"; ctx.font = "12px Arial,sans-serif";
    ctx.fillText(new Date().toLocaleDateString("vi-VN"), OUTPUT_W-32, TITLE_H/2-9);
    ctx.fillStyle = "#7c3aed"; ctx.font = "bold 14px Arial,sans-serif";
    ctx.fillText("storescope.ai", OUTPUT_W-32, TITLE_H/2+11);

    // ── Floor ──
    const oy = TITLE_H;
    const floorG = ctx.createLinearGradient(0, oy, 0, oy+layoutH);
    floorG.addColorStop(0, "#f7f4ed"); floorG.addColorStop(1, "#ece9e0");
    ctx.fillStyle = floorG; ctx.fillRect(0, oy, OUTPUT_W, layoutH);

    // Grid
    const gridPx = doc.canvas.gridStep * scale;
    ctx.strokeStyle = "#dedad2"; ctx.lineWidth = 0.6;
    for (let x = 0; x <= OUTPUT_W; x += gridPx) { ctx.beginPath(); ctx.moveTo(x,oy); ctx.lineTo(x,oy+layoutH); ctx.stroke(); }
    for (let y = 0; y <= layoutH; y += gridPx) { ctx.beginPath(); ctx.moveTo(0,oy+y); ctx.lineTo(OUTPUT_W,oy+y); ctx.stroke(); }

    // Store wall border (thick filled rectangles)
    const wallPx = Math.max(8, Math.min(28, layoutH * 0.02));
    ctx.fillStyle = linGrad(ctx, 0, oy, 0, oy+wallPx*2, [[0,"#3a3a3a"],[1,"#1a1a1a"]]);
    ctx.fillRect(0, oy, OUTPUT_W, wallPx);                           // top
    ctx.fillStyle = linGrad(ctx, 0, oy+layoutH-wallPx*2, 0, oy+layoutH, [[0,"#1a1a1a"],[1,"#3a3a3a"]]);
    ctx.fillRect(0, oy+layoutH-wallPx, OUTPUT_W, wallPx);            // bottom
    ctx.fillStyle = linGrad(ctx, 0, oy, wallPx*2, oy, [[0,"#3a3a3a"],[1,"#1a1a1a"]]);
    ctx.fillRect(0, oy, wallPx, layoutH);                            // left
    ctx.fillStyle = linGrad(ctx, OUTPUT_W-wallPx*2, oy, OUTPUT_W, oy, [[0,"#1a1a1a"],[1,"#3a3a3a"]]);
    ctx.fillRect(OUTPUT_W-wallPx, oy, wallPx, layoutH);              // right

    // User-drawn walls
    ctx.lineCap = "square";
    doc.walls.forEach(wall => {
      ctx.strokeStyle = linGrad(ctx, wall.x1*scale, 0, wall.x2*scale, 0, [[0,"#2a2a2a"],[1,"#1a1a1a"]]);
      ctx.lineWidth = Math.max(4, wall.thickness*scale);
      ctx.beginPath(); ctx.moveTo(wall.x1*scale, oy+wall.y1*scale); ctx.lineTo(wall.x2*scale, oy+wall.y2*scale); ctx.stroke();
    });

    // Fixtures
    doc.fixtures.forEach(fx => {
      const px = fx.geometry.x*scale, py = fx.geometry.y*scale;
      const pw = fx.geometry.width*scale, pd = fx.geometry.depth*scale;
      ctx.save();
      ctx.translate(px+pw/2, oy+py+pd/2);
      ctx.rotate((fx.geometry.rotationDeg*Math.PI)/180);
      ctx.translate(-pw/2, -pd/2);
      drawFixtureFx(ctx, fx.business.fixtureType, pw, pd, imgs);
      drawLabel(ctx, fx.name, pw, pd);
      ctx.restore();
    });

    // ── Legend ──
    const ly = TITLE_H + layoutH;
    ctx.fillStyle = linGrad(ctx, 0, ly, 0, ly+LEGEND_H, [[0,"#f0ede6"],[1,"#e8e4dc"]]);
    ctx.fillRect(0, ly, OUTPUT_W, LEGEND_H);
    ctx.strokeStyle = "#d0ccc4"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(OUTPUT_W,ly); ctx.stroke();
    ctx.fillStyle = "#666"; ctx.font = "bold 11px Arial,sans-serif"; ctx.textAlign = "left";
    ctx.fillText("CHÚ GIẢI:", 24, ly+LEGEND_H/2);
    [
      ["#8B5E3C","#5c3d1a","Kệ rau củ"],["#c0c8d0","#8a9299","SP tươi"],["#0a1520","#22d3ee","Tủ mát"],
      ["#14532d","#22a350","Kệ 2 mặt"],["#991b1b","#ff6666","Khuyến mãi"],["#f0fdf4","#4ade80","Cửa vào"],
      ["#fee2e2","#ef4444","Cột"],
    ].forEach(([c, b, l], i) => drawLegendItem(ctx, 108+i*167, ly+LEGEND_H/2, c, b, l));

  }, [doc, imgs]);

  useEffect(() => { render(); }, [render, imgReady]);

  const download = () => {
    const el = canvasRef.current; if (!el) return;
    const a = document.createElement("a");
    a.download = `layout_${doc.store.name.replace(/\s+/g,"_")}.png`;
    a.href = el.toDataURL("image/png"); a.click();
  };

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24 }}
      onClick={(e) => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:"#111", borderRadius:14, border:"1px solid #2a2a2a", maxWidth:"96vw", maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 32px 100px rgba(0,0,0,0.9)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #1f1f1f", flexShrink:0, background:"#0d0d0d" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Sparkles size={17} color="#7c3aed"/>
            <span style={{ color:"#f0f0f0", fontSize:14, fontWeight:700 }}>Layout chuyên nghiệp</span>
            <span style={{ color:"#444", fontSize:11 }}>— floor-plan infographic</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={download} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:7, background:"#7c3aed", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}
              onMouseEnter={(e)=>{e.currentTarget.style.background="#6d28d9";}} onMouseLeave={(e)=>{e.currentTarget.style.background="#7c3aed";}}>
              <Download size={14}/> Tải PNG
            </button>
            <button onClick={onClose} style={{ display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:7, background:"#1a1a1a", border:"1px solid #2a2a2a", color:"#666", cursor:"pointer" }}>
              <X size={16}/>
            </button>
          </div>
        </div>
        <div style={{ overflow:"auto", padding:20, flex:1 }}>
          <canvas ref={canvasRef} style={{ display:"block", maxWidth:"100%", borderRadius:6, border:"1px solid #2a2a2a" }}/>
        </div>
      </div>
    </div>
  );
}
