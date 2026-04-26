"use client";

import { useRef, useCallback, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Stage, Layer, Rect, Line, Group, Text, Circle, Arc, Transformer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { FixtureInstance, CanvasConfig, WallLine, ToolMode } from "./types";

const PX_PER_MM = 0.10;
export function mmToPx(mm: number) { return mm * PX_PER_MM; }
export function pxToMm(px: number) { return px / PX_PER_MM; }
function snap(val: number, step: number) { return Math.round(val / step) * step; }

// ─── Fixture Shape Renderers (top-down floor plan view) ─────────────────────

// Quầy thu ngân — đen + sọc đỏ + belt + POS
function CheckoutShape({ w, d }: { w: number; d: number }) {
  const beltW = w * 0.65;
  const posW  = Math.min(w * 0.22, 18);
  return (
    <Group>
      <Rect width={w} height={d} fill="#1c1c1c" stroke="#444" strokeWidth={1.5} cornerRadius={2}/>
      {/* Silver top rail */}
      <Rect width={w} height={Math.max(d * 0.12, 4)} fill="#888" cornerRadius={[2,2,0,0]}/>
      {/* Red stripe */}
      <Rect y={d * 0.38} width={w} height={Math.max(d * 0.24, 5)} fill="#dc2626"/>
      {/* Silver bottom rail */}
      <Rect y={d * 0.85} width={w} height={d * 0.15} fill="#555" cornerRadius={[0,0,2,2]}/>
      {/* Conveyor belt */}
      <Rect x={4} y={d * 0.14} width={beltW - 4} height={d * 0.22} fill="#2a2a2a" stroke="#555" strokeWidth={0.5} cornerRadius={1}/>
      {Array.from({ length: Math.floor((beltW - 8) / 8) }).map((_, i) => (
        <Line key={i} points={[8 + i * 8, d*0.14, 8 + i * 8, d*0.36]} stroke="#444" strokeWidth={0.6}/>
      ))}
      {/* POS terminal */}
      <Rect x={w - posW - 4} y={3} width={posW} height={d * 0.35} fill="#111" stroke="#555" strokeWidth={0.8} cornerRadius={1}/>
      <Rect x={w - posW - 3} y={4} width={posW - 2} height={d * 0.22} fill="#1d6fb5" cornerRadius={1}/>
    </Group>
  );
}

// ─── Kệ rau củ quả — vẽ Canvas 2D khớp hình mẫu, không cần file ──────────────

function buildProduceCanvas(pxW: number, pxH: number): HTMLCanvasElement {
  const S = 4; // render 4× để sắc nét khi Konva scale xuống
  const W = Math.ceil(pxW * S), H = Math.ceil(pxH * S);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;

  const lg = (x0:number,y0:number,x1:number,y1:number,stops:[number,string][]) => {
    const g = c.createLinearGradient(x0,y0,x1,y1);
    stops.forEach(([t,s]) => g.addColorStop(t,s)); return g;
  };
  const rg = (cx:number,cy:number,r:number,hi:string,mid:string,dk:string) => {
    const g = c.createRadialGradient(cx-r*.3,cy-r*.35,r*.05,cx,cy,r);
    g.addColorStop(0,hi); g.addColorStop(.55,mid); g.addColorStop(1,dk); return g;
  };

  // ── Khung gỗ ngoài ──
  const FRAME = Math.max(7, W * 0.042);
  const DIV   = Math.max(5, W * 0.024);
  c.fillStyle = lg(0,0,0,H,[[0,"#4a2208"],[.45,"#2d1205"],[1,"#1a0902"]]);
  c.beginPath(); c.roundRect(0,0,W,H,10); c.fill();
  // Vân gỗ
  c.strokeStyle = "rgba(0,0,0,0.22)"; c.lineWidth = 1.8;
  for (let i=1;i<5;i++) {
    c.beginPath(); c.moveTo(W*i/5+3,0); c.lineTo(W*i/5-3,H); c.stroke();
  }
  // Highlight mép trên khung
  c.fillStyle = "rgba(255,255,255,0.06)";
  c.fillRect(FRAME, 3, W-FRAME*2, 3);

  const COLS=3, ROWS=2;
  const cW = (W - FRAME*2 - DIV*(COLS-1)) / COLS;
  const cH = (H - FRAME*2 - DIV*(ROWS-1)) / ROWS;

  // ── Hàm vẽ từng loại rau củ ──
  const tomato = (px:number,py:number,r:number) => {
    c.fillStyle = rg(px,py,r,"#ff8080","#ef4444","#991b1b");
    c.beginPath(); c.arc(px,py,r,0,Math.PI*2); c.fill();
    c.fillStyle = "rgba(255,255,255,0.38)";
    c.beginPath(); c.arc(px-r*.28,py-r*.3,r*.3,0,Math.PI*2); c.fill();
    c.strokeStyle="#16a34a"; c.lineWidth=Math.max(1.2,r*.22); c.lineCap="round";
    c.beginPath(); c.moveTo(px,py-r); c.lineTo(px,py-r*1.6); c.stroke();
    c.fillStyle="#22c55e";
    c.beginPath(); c.ellipse(px-r*.3,py-r*1.28,r*.38,r*.15,-0.5,0,Math.PI*2); c.fill();
  };
  const orange = (px:number,py:number,r:number) => {
    c.fillStyle = rg(px,py,r,"#fed7aa","#f97316","#c2410c");
    c.beginPath(); c.arc(px,py,r,0,Math.PI*2); c.fill();
    c.fillStyle = "rgba(255,255,255,0.3)";
    c.beginPath(); c.arc(px-r*.26,py-r*.3,r*.26,0,Math.PI*2); c.fill();
    c.strokeStyle="rgba(194,65,12,0.45)"; c.lineWidth=0.9;
    c.beginPath(); c.arc(px,py,r*.13,0,Math.PI*2); c.stroke();
  };
  const lime = (px:number,py:number,r:number) => {
    c.fillStyle = rg(px,py,r,"#86efac","#22c55e","#14532d");
    c.beginPath(); c.arc(px,py,r,0,Math.PI*2); c.fill();
    c.fillStyle = "rgba(255,255,255,0.28)";
    c.beginPath(); c.arc(px-r*.26,py-r*.3,r*.26,0,Math.PI*2); c.fill();
    c.fillStyle="#15803d";
    c.beginPath(); c.arc(px+r*.72,py,r*.12,0,Math.PI*2); c.fill();
  };
  const springOnion = (px:number,py:number,r:number) => {
    c.strokeStyle="#15803d"; c.lineWidth=Math.max(1.5,r*.3); c.lineCap="round";
    for (let i=-1;i<=1;i++) {
      c.beginPath(); c.moveTo(px+i*r*.32,py+r*.15);
      c.quadraticCurveTo(px+i*r*.45,py-r*.5,px+i*r*.5,py-r); c.stroke();
    }
    c.fillStyle = rg(px,py+r*.45,r*.48,"#f0fdf4","#bbf7d0","#86efac");
    c.beginPath(); c.arc(px,py+r*.45,r*.48,0,Math.PI*2); c.fill();
  };
  const lemon = (px:number,py:number,r:number) => {
    c.fillStyle = rg(px,py,r,"#fef08a","#facc15","#a16207");
    c.beginPath(); c.ellipse(px,py,r*1.18,r*.88,0.15,0,Math.PI*2); c.fill();
    c.fillStyle = "rgba(255,255,255,0.32)";
    c.beginPath(); c.ellipse(px-r*.28,py-r*.28,r*.28,r*.18,-0.3,0,Math.PI*2); c.fill();
    c.strokeStyle="#854d0e"; c.lineWidth=Math.max(1,r*.18); c.lineCap="round";
    c.beginPath(); c.moveTo(px+r*1.1,py); c.lineTo(px+r*1.38,py-r*.22); c.stroke();
    c.beginPath(); c.moveTo(px-r*1.1,py); c.lineTo(px-r*1.38,py+r*.22); c.stroke();
  };
  const onion = (px:number,py:number,r:number) => {
    c.fillStyle = rg(px,py,r,"#fef9c3","#fde68a","#d97706");
    c.beginPath(); c.arc(px,py,r,0,Math.PI*2); c.fill();
    c.strokeStyle="rgba(180,83,9,0.35)"; c.lineWidth=0.8;
    for (let s=0.45;s<=0.85;s+=0.2) {
      c.beginPath(); c.arc(px,py,r*s,0.2,Math.PI*.78); c.stroke();
    }
    c.fillStyle="rgba(255,255,255,0.28)";
    c.beginPath(); c.arc(px-r*.25,py-r*.3,r*.26,0,Math.PI*2); c.fill();
  };

  type Kind = "tomato"|"orange"|"lime"|"spring_onion"|"lemon"|"onion";
  const DRAW: Record<Kind,(px:number,py:number,r:number)=>void> = {
    tomato, orange, lime, spring_onion: springOnion, lemon, onion,
  };
  // 3×2: hàng trên = tomato/orange/lime, hàng dưới = spring_onion/lemon/onion
  const CELLS: [Kind, string][] = [
    ["tomato","#1a0500"], ["orange","#1a0900"], ["lime","#0a1500"],
    ["spring_onion","#0a1500"], ["lemon","#161100"], ["onion","#161000"],
  ];

  CELLS.forEach(([kind, bg], idx) => {
    const col = idx % COLS, row = Math.floor(idx/COLS);
    const ox = FRAME + col*(cW+DIV), oy = FRAME + row*(cH+DIV);

    // Nền ngăn
    c.fillStyle = lg(ox,oy,ox,oy+cH,[[0,bg],[1,"#060200"]]);
    c.beginPath(); c.roundRect(ox,oy,cW,cH,6); c.fill();
    // Bóng tối mép trên
    c.fillStyle = "rgba(0,0,0,0.42)";
    c.fillRect(ox,oy,cW,Math.min(14,cH*.2));
    // Highlight mép dưới
    c.fillStyle = "rgba(255,255,255,0.04)";
    c.fillRect(ox,oy+cH-4,cW,4);

    // Xếp sản phẩm theo hex-offset
    const mg = Math.max(4,cW*.06);
    const aW = cW-mg*2, aH = cH-mg*2;
    const iR = Math.min(aW,aH)*.24;
    const iC2 = Math.max(1, Math.floor(aW/(iR*1.75)));
    const iR2 = Math.max(1, Math.floor(aH/(iR*1.75)));
    const spX = aW/iC2, spY = aH/iR2;
    for (let ir=0;ir<iR2;ir++) {
      const stag = (ir%2===1) ? spX*.44 : 0;
      for (let ic=0;ic<iC2;ic++) {
        const px2 = ox+mg+(ic+.5)*spX+stag;
        const py2 = oy+mg+(ir+.5)*spY;
        if (px2 < ox+cW-mg*.5) DRAW[kind](px2,py2,iR);
      }
    }
    // Viền ngăn
    c.strokeStyle="#080200"; c.lineWidth=1.8;
    c.beginPath(); c.roundRect(ox,oy,cW,cH,6); c.stroke();
  });

  // Viền khung ngoài
  c.strokeStyle="#0f0400"; c.lineWidth=5;
  c.beginPath(); c.roundRect(0,0,W,H,10); c.stroke();

  return cv;
}

const produceCanvasCache = new Map<string, HTMLCanvasElement>();

function ProduceShelfShape({ w, d }: { w: number; d: number }) {
  const [cv, setCv] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const key = `${Math.round(w)}_${Math.round(d)}`;
    if (produceCanvasCache.has(key)) { setCv(produceCanvasCache.get(key)!); return; }
    const canvas = buildProduceCanvas(w, d);
    produceCanvasCache.set(key, canvas);
    setCv(canvas);
  }, [w, d]);

  if (!cv) {
    return <Rect width={w} height={d} fill="#5c3d1a" stroke="#3d2810" strokeWidth={1.5} cornerRadius={2}/>;
  }
  return <KonvaImage image={cv as unknown as HTMLImageElement} width={w} height={d} cornerRadius={2}/>;
}

// Quầy sản phẩm tươi — inox bạc, kính trước, sản phẩm hồng/trắng
function FreshCounterShape({ w, d }: { w: number; d: number }) {
  const glassD = d * 0.45;
  const itemCount = Math.max(2, Math.floor(w / mmToPx(450)));
  const itemW = (w - 8) / itemCount;
  const meatColors = ["#f4a0a0","#f8c0a0","#c0d8f0","#f0d0a0","#e8b0b0","#d0e8f4"];
  return (
    <Group>
      {/* Base stainless */}
      <Rect width={w} height={d} fill="#c0c8d0" stroke="#8a9299" strokeWidth={1.5} cornerRadius={2}/>
      {/* Glass display top */}
      <Rect x={2} y={2} width={w-4} height={glassD} fill="#daeaf4" stroke="#9ab8cc" strokeWidth={0.8} cornerRadius={2}/>
      {/* Glass shine */}
      <Rect x={3} y={3} width={w-6} height={glassD * 0.35} fill="rgba(255,255,255,0.5)" cornerRadius={1}/>
      {/* Products inside glass */}
      {Array.from({ length: itemCount }).map((_, i) => (
        <Rect key={i} x={4 + i * itemW} y={glassD * 0.35} width={itemW - 2} height={glassD * 0.55}
          fill={meatColors[i % meatColors.length]} cornerRadius={1}/>
      ))}
      {/* Front silver panel */}
      <Rect x={2} y={glassD + 2} width={w - 4} height={d - glassD - 4} fill="#aab4bc" stroke="#8a9299" strokeWidth={0.5} cornerRadius={1}/>
      {/* Vent slots */}
      {Array.from({ length: Math.floor((w - 8) / 10) }).map((_, i) => (
        <Rect key={i} x={4 + i * 10} y={d - 5} width={6} height={2} fill="#8a9299" opacity={0.5} cornerRadius={0.5}/>
      ))}
    </Group>
  );
}

// Tủ mát đồ uống — đen, 2 cửa kính, chai màu sắc
function CoolerShape({ w, d }: { w: number; d: number }) {
  const doorCount = Math.max(1, Math.round(w / mmToPx(700)));
  const doorW = (w - 4) / doorCount;
  const drinkPal = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316","#06b6d4"];
  const dairyPal = ["#f0f9ff","#fef9ee","#f0fdf4","#fdf4ff","#fff7ed"];
  return (
    <Group>
      <Rect width={w} height={d} fill="#111" stroke="#333" strokeWidth={1.5} cornerRadius={2}/>
      {/* Header bar */}
      <Rect width={w} height={Math.max(d*0.1, 5)} fill="#1e1e1e" cornerRadius={[2,2,0,0]}/>
      {Array.from({ length: doorCount }).map((_, door) => {
        const dx = 2 + door * doorW;
        const isRight = door === doorCount - 1;
        const pal = isRight ? dairyPal : drinkPal;
        const rows = Math.max(2, Math.floor((d * 0.8) / 8));
        return (
          <Group key={door}>
            {/* Door panel */}
            <Rect x={dx} y={d*0.12} width={doorW - 2} height={d*0.82} fill="#0a1828" stroke="#1a3a50" strokeWidth={0.8} cornerRadius={1}/>
            <Rect x={dx+1} y={d*0.13} width={doorW - 4} height={d*0.80} fill="rgba(160,210,240,0.1)" cornerRadius={1}/>
            {/* Drink columns */}
            {Array.from({ length: Math.floor((doorW-6)/6) }).map((_, col) =>
              Array.from({ length: rows }).map((_, row) => (
                <Rect key={`${col}-${row}`}
                  x={dx + 3 + col * 6} y={d*0.14 + row * (d*0.78/rows)}
                  width={4} height={d*0.78/rows - 1} cornerRadius={0.5}
                  fill={pal[(door * 3 + col + row) % pal.length]} opacity={0.85}/>
              ))
            )}
            {/* Handle */}
            <Rect x={door < doorCount-1 ? dx+doorW-4 : dx} y={d*0.42} width={2} height={d*0.16} fill="#555" cornerRadius={1}/>
          </Group>
        );
      })}
    </Group>
  );
}

// Kệ sát tường — đen, hàng sản phẩm nhiều màu, label category
function WallShelfShape({ w, d }: { w: number; d: number }) {
  const shelfCount = Math.max(2, Math.floor(d / mmToPx(350)));
  const colCount   = Math.max(3, Math.floor(w / mmToPx(120)));
  const cellW = (w - 4) / colCount;
  const cellH = (d - Math.max(d*0.2, 6)) / shelfCount;
  const headerH = Math.max(d * 0.18, 5);
  const pal = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316","#06b6d4","#eab308","#ec4899","#84cc16"];
  return (
    <Group>
      <Rect width={w} height={d} fill="#111" stroke="#222" strokeWidth={1.5} cornerRadius={2}/>
      {/* Category header */}
      <Rect width={w} height={headerH} fill="#1a1a1a" cornerRadius={[2,2,0,0]}/>
      {Array.from({ length: Math.min(4, colCount) }).map((_, i) => (
        <Rect key={i} x={3 + i * (w-6)/4} y={2} width={(w-6)/4 - 2} height={headerH - 4} fill="#2a2a2a" cornerRadius={0.5}/>
      ))}
      {/* Shelf dividers + products */}
      {Array.from({ length: shelfCount }).map((_, row) => (
        <Group key={row}>
          <Rect y={headerH + row * cellH} width={w} height={1.5} fill="#2a2a2a"/>
          {Array.from({ length: colCount }).map((_, col) => (
            <Rect key={col}
              x={2 + col * cellW} y={headerH + row * cellH + 2}
              width={cellW - 2} height={cellH - 4}
              fill={pal[(row * colCount + col) % pal.length]} cornerRadius={0.5}/>
          ))}
        </Group>
      ))}
    </Group>
  );
}

// Kệ 2 mặt — đen, header xanh KHUYẾN MÃI, sản phẩm 2 phía
function GondolaShape({ w, d }: { w: number; d: number }) {
  const headerH = Math.max(d * 0.18, 5);
  const footerH = Math.max(d * 0.18, 5);
  const midH    = d - headerH - footerH;
  const colCount = Math.max(3, Math.floor(w / mmToPx(150)));
  const cellW = (w - 4) / colCount;
  const pal = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316","#06b6d4","#eab308"];
  return (
    <Group>
      <Rect width={w} height={d} fill="#111" stroke="#2a2a2a" strokeWidth={1.5} cornerRadius={2}/>
      {/* Green header */}
      <Rect width={w} height={headerH} fill="#14532d" cornerRadius={[2,2,0,0]}/>
      {/* Top product row */}
      {Array.from({ length: colCount }).map((_, c) => (
        <Rect key={`t${c}`} x={2 + c*cellW} y={headerH + 2} width={cellW-2} height={midH*0.42}
          fill={pal[c % pal.length]} cornerRadius={0.5}/>
      ))}
      {/* Center divider */}
      <Rect y={headerH + midH*0.48} width={w} height={3} fill="#222"/>
      {/* Bottom product row */}
      {Array.from({ length: colCount }).map((_, c) => (
        <Rect key={`b${c}`} x={2 + c*cellW} y={headerH + midH*0.53} width={cellW-2} height={midH*0.42}
          fill={pal[(c+3) % pal.length]} cornerRadius={0.5}/>
      ))}
      {/* Green footer */}
      <Rect y={d - footerH} width={w} height={footerH} fill="#14532d" cornerRadius={[0,0,2,2]}/>
    </Group>
  );
}

// Đầu kệ — giống gondola nhưng hẹp hơn, header xanh
function EndcapShape({ w, d }: { w: number; d: number }) {
  const headerH = Math.max(d * 0.2, 5);
  const colCount = Math.max(2, Math.floor(w / mmToPx(150)));
  const cellW = (w - 4) / colCount;
  const pal = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316"];
  const rowH = (d - headerH - 4) / 3;
  return (
    <Group>
      <Rect width={w} height={d} fill="#111" stroke="#2a2a2a" strokeWidth={1.5} cornerRadius={2}/>
      <Rect width={w} height={headerH} fill="#14532d" cornerRadius={[2,2,0,0]}/>
      {[0,1,2].map((row) => (
        <Group key={row}>
          <Rect y={headerH + row * rowH} width={w} height={1.5} fill="#222"/>
          {Array.from({ length: colCount }).map((_, c) => (
            <Rect key={c} x={2+c*cellW} y={headerH + row*rowH + 2} width={cellW-2} height={rowH-4}
              fill={pal[(row*colCount+c) % pal.length]} cornerRadius={0.5}/>
          ))}
        </Group>
      ))}
    </Group>
  );
}

// Ụ khuyến mãi — đỏ, sản phẩm trên mặt, biển hiệu
function PromoShape({ w, d }: { w: number; d: number }) {
  const pal = ["#fbbf24","#ef4444","#f97316","#22c55e","#3b82f6","#a855f7"];
  const cols = Math.max(2, Math.floor(w / mmToPx(300)));
  const rows = Math.max(2, Math.floor(d / mmToPx(300)));
  const cw = (w - 8) / cols;
  const ch = (d - 8) / rows;
  return (
    <Group>
      {/* Red island body */}
      <Rect width={w} height={d} fill="#b91c1c" stroke="#991b1b" strokeWidth={1.5} cornerRadius={3}/>
      {/* Inner product surface */}
      <Rect x={4} y={4} width={w-8} height={d-8} fill="#dc2626" cornerRadius={2}/>
      {/* Products */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <Rect key={`${r}-${c}`} x={4+c*cw} y={4+r*ch} width={cw-2} height={ch-2}
            fill={pal[(r*cols+c) % pal.length]} cornerRadius={1} opacity={0.9}/>
        ))
      )}
      {/* Sign pole dot */}
      <Circle x={w/2} y={d/2} radius={Math.min(w,d)*0.08} fill="#7f1d1d"/>
    </Group>
  );
}

// Ụ SP thu ngân — đen, header xanh, cột sản phẩm
function CheckoutImpulseShape({ w, d }: { w: number; d: number }) {
  const headerH = Math.max(d * 0.22, 6);
  const colCount = Math.max(1, Math.floor(w / mmToPx(120)));
  const cellW = (w - 4) / colCount;
  const shelfRows = 3;
  const rowH = (d - headerH - 4) / shelfRows;
  const pal = ["#fbbf24","#ef4444","#22c55e","#3b82f6","#f97316","#a855f7"];
  return (
    <Group>
      <Rect width={w} height={d} fill="#111" stroke="#2a2a2a" strokeWidth={1.5} cornerRadius={2}/>
      <Rect width={w} height={headerH} fill="#166534" cornerRadius={[2,2,0,0]}/>
      {Array.from({ length: shelfRows }).map((_, row) => (
        <Group key={row}>
          <Rect y={headerH + row*rowH} width={w} height={1.5} fill="#222"/>
          {Array.from({ length: colCount }).map((_, c) => (
            <Rect key={c} x={2+c*cellW} y={headerH+row*rowH+2} width={cellW-2} height={rowH-4}
              fill={pal[(row*colCount+c) % pal.length]} cornerRadius={0.5}/>
          ))}
        </Group>
      ))}
    </Group>
  );
}

// Cửa vào / Ra — xanh lá, 2 cánh cửa, mũi tên
function EntryShape({ w, d }: { w: number; d: number }) {
  const h = Math.max(d, 12);
  const panelW = w * 0.42;
  return (
    <Group>
      <Rect width={w} height={h} fill="#f0fdf4" stroke="#4ade80" strokeWidth={1.5} cornerRadius={2}/>
      {/* Left door */}
      <Rect x={1} y={1} width={panelW} height={h-2} fill="#bbf7d0" stroke="#4ade80" strokeWidth={1} cornerRadius={[2,0,0,2]}/>
      {/* Right door */}
      <Rect x={w-panelW-1} y={1} width={panelW} height={h-2} fill="#bbf7d0" stroke="#4ade80" strokeWidth={1} cornerRadius={[0,2,2,0]}/>
      {/* Arrow */}
      <Line points={[w*0.25, h/2, w*0.75, h/2]} stroke="#16a34a" strokeWidth={2} lineCap="round"/>
      <Line points={[w*0.6, h/2-3, w*0.75, h/2, w*0.6, h/2+3]} stroke="#16a34a" strokeWidth={2} lineCap="round" lineJoin="round"/>
    </Group>
  );
}

// Cột / Vùng cấm — đỏ, sọc chéo, X
function ObstacleShape({ w, d }: { w: number; d: number }) {
  return (
    <Group>
      <Rect width={w} height={d} fill="#fef2f2" stroke="#ef4444" strokeWidth={1.5} cornerRadius={2}/>
      {/* Diagonal stripes */}
      {[-d, 0, d, d*2].map((offset, i) => (
        <Line key={i} points={[offset, 0, offset+d, d]} stroke="#ef4444" strokeWidth={Math.min(w,d)*0.18} opacity={0.2} lineCap="butt"/>
      ))}
      {/* X */}
      <Line points={[4, 4, w-4, d-4]} stroke="#ef4444" strokeWidth={Math.max(2, Math.min(w,d)*0.07)} lineCap="round"/>
      <Line points={[w-4, 4, 4, d-4]} stroke="#ef4444" strokeWidth={Math.max(2, Math.min(w,d)*0.07)} lineCap="round"/>
    </Group>
  );
}

// Tủ mát thực phẩm — dark cabinet, green accent, food/dairy rows
function FoodCoolerShape({ w, d }: { w: number; d: number }) {
  const headerH = Math.max(d * 0.12, 5);
  const rows = 4;
  const rowH = (d - headerH - 6) / rows;
  const colCount = Math.max(3, Math.floor(w / 6));
  const cellW = (w - 4) / colCount;
  const palettes = [
    ["#fef9ee","#fef3c7","#f0fdf4","#fff","#fef9ee","#f0fdf4","#fef3c7","#fff"],
    ["#4ade80","#22c55e","#86efac","#4ade80","#dcfce7","#22c55e","#86efac","#4ade80"],
    ["#fca5a5","#fcd34d","#86efac","#93c5fd","#fca5a5","#fcd34d","#86efac","#93c5fd"],
    ["#f0fdf4","#fef9ee","#fff","#fef3c7","#f0fdf4","#fef9ee","#fff","#fef3c7"],
  ];
  return (
    <Group>
      <Rect width={w} height={d} fill="#111" stroke="#1a3a22" strokeWidth={1.5} cornerRadius={2}/>
      {/* Green header */}
      <Rect width={w} height={headerH} fill="#14532d" cornerRadius={[2,2,0,0]}/>
      {/* Glass door */}
      <Rect x={2} y={headerH + 1} width={w-4} height={d - headerH - 3} fill="#0d2418" stroke="#166534" strokeWidth={0.8} cornerRadius={1}/>
      <Rect x={3} y={headerH + 2} width={(w-6)*0.2} height={d - headerH - 5} fill="rgba(255,255,255,0.05)" cornerRadius={1}/>
      {/* Product rows */}
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: Math.min(colCount, 8) }).map((_, col) => (
          <Rect key={`${row}-${col}`}
            x={2 + col * cellW} y={headerH + 3 + row * rowH}
            width={cellW - 1} height={rowH - 2}
            fill={palettes[row][col % 8]} opacity={0.9} cornerRadius={0.5}/>
        ))
      )}
      {/* Handle */}
      <Rect x={w/2 - 2} y={d * 0.45} width={4} height={d * 0.1} fill="#555" cornerRadius={2}/>
      {/* Footer */}
      <Rect y={d - 4} width={w} height={4} fill="#1a1a1a" cornerRadius={[0,0,2,2]}/>
    </Group>
  );
}

// Tủ nước Pepsi — navy blue body, red/white Pepsi branding, bottle columns
function PepsiCoolerShape({ w, d }: { w: number; d: number }) {
  const headerH = Math.max(d * 0.1, 5);
  const brandH = Math.max(d * 0.12, 6);
  const doorH = d - headerH - brandH - 6;
  const colCount = Math.max(2, Math.floor(w / 8));
  const cellW = (w - 4) / colCount;
  const bottleRows = Math.max(2, Math.floor(doorH / 10));
  const bottleH = doorH / bottleRows - 1;
  return (
    <Group>
      {/* Navy body */}
      <Rect width={w} height={d} fill="#003087" stroke="#0050b3" strokeWidth={1.5} cornerRadius={2}/>
      {/* Dark header */}
      <Rect width={w} height={headerH} fill="#001f5c" cornerRadius={[2,2,0,0]}/>
      {/* Pepsi circle logo in header */}
      <Circle x={w/2} y={headerH/2} radius={Math.min(headerH*0.4, 4)} fill="#fff" opacity={0.9}/>
      {/* Glass door */}
      <Rect x={2} y={headerH + 1} width={w-4} height={doorH} fill="#002070" stroke="#0050b3" strokeWidth={0.8} cornerRadius={1}/>
      <Rect x={3} y={headerH + 2} width={(w-6)*0.18} height={doorH-2} fill="rgba(255,255,255,0.05)" cornerRadius={1}/>
      {/* Bottle columns */}
      {Array.from({ length: colCount }).map((_, col) =>
        Array.from({ length: bottleRows }).map((_, row) => (
          <Group key={`${col}-${row}`}>
            <Rect x={2 + col * cellW} y={headerH + 2 + row * (bottleH + 1)}
              width={cellW - 1} height={bottleH} fill="#1d6fb5" cornerRadius={0.5} opacity={0.9}/>
            <Rect x={2 + col * cellW} y={headerH + 2 + row * (bottleH + 1)}
              width={cellW - 1} height={Math.max(2, bottleH * 0.2)} fill="#EE2737" cornerRadius={[0.5,0.5,0,0]} opacity={0.9}/>
          </Group>
        ))
      )}
      {/* Handle */}
      <Rect x={w/2 - 2} y={headerH + doorH * 0.4} width={4} height={doorH * 0.2} fill="rgba(255,255,255,0.3)" cornerRadius={2}/>
      {/* White band */}
      <Rect y={d - brandH - 4} width={w} height={brandH} fill="#fff"/>
      {/* Red bottom */}
      <Rect y={d - 4} width={w} height={4} fill="#EE2737" cornerRadius={[0,0,2,2]}/>
    </Group>
  );
}

// Kệ Bánh Slay — warm brown frame, bread/pastry items on 3 shelves
function BakeryShelfShape({ w, d }: { w: number; d: number }) {
  const headerH = Math.max(d * 0.18, 6);
  const shelfRows = 3;
  const rowH = (d - headerH - 4) / shelfRows;
  const itemsPerRow = Math.max(2, Math.floor(w / mmToPx(200)));
  const itemW = (w - 6) / itemsPerRow;
  const palBread = ["#fcd34d","#d97706","#fbbf24","#f59e0b","#fcd34d","#b45309"];
  const palPastry = ["#b45309","#d97706","#fbbf24","#b45309","#d97706","#fbbf24"];
  return (
    <Group>
      <Rect width={w} height={d} fill="#78350f" stroke="#451a03" strokeWidth={1.5} cornerRadius={2}/>
      {/* Warm header */}
      <Rect width={w} height={headerH} fill="#92400e" cornerRadius={[2,2,0,0]}/>
      {/* Shelf rows */}
      {Array.from({ length: shelfRows }).map((_, row) => (
        <Group key={row}>
          {/* Shelf surface */}
          <Rect y={headerH + row * rowH} width={w} height={rowH} fill={row % 2 === 0 ? "#a16207" : "#92400e"}/>
          {/* Shelf divider */}
          <Rect y={headerH + row * rowH} width={w} height={2} fill="#451a03"/>
          {/* Bread/pastry items */}
          {Array.from({ length: itemsPerRow }).map((_, i) => {
            const cx = 3 + i * itemW + itemW / 2;
            const cy = headerH + row * rowH + rowH * 0.55;
            const rx = itemW * 0.38;
            const ry = rowH * 0.28;
            const pal = row === 1 ? palPastry : palBread;
            return (
              <Group key={i}>
                <Arc key={`arc${i}`} x={cx} y={cy} innerRadius={0} outerRadius={rx}
                  angle={180} rotation={180} fill={pal[i % pal.length]}/>
                <Rect x={cx - rx} y={cy} width={rx * 2} height={ry}
                  fill={pal[i % pal.length]} cornerRadius={[0,0,2,2]}/>
              </Group>
            );
          })}
        </Group>
      ))}
    </Group>
  );
}

// FreezerShape kept for backward compat with old JSON data
function FreezerShape({ w, d }: { w: number; d: number }) {
  return <FreshCounterShape w={w} d={d}/>;
}

// QueueRailShape kept for backward compat
function QueueRailShape({ w, d }: { w: number; d: number }) {
  return <CheckoutImpulseShape w={w} d={d}/>;
}

function FixtureKonvaShape({ type, w, d }: { type: string; w: number; d: number }) {
  switch (type) {
    case "checkout":          return <CheckoutShape w={w} d={d}/>;
    case "produce_shelf":     return <ProduceShelfShape w={w} d={d}/>;
    case "fresh_counter":     return <FreshCounterShape w={w} d={d}/>;
    case "freezer_island":    return <FreshCounterShape w={w} d={d}/>;
    case "food_cooler":        return <FoodCoolerShape w={w} d={d}/>;
    case "pepsi_cooler":       return <PepsiCoolerShape w={w} d={d}/>;
    case "cooler_upright":    return <CoolerShape w={w} d={d}/>;
    case "wall_shelf":        return <WallShelfShape w={w} d={d}/>;
    case "gondola_double":    return <GondolaShape w={w} d={d}/>;
    case "endcap":            return <EndcapShape w={w} d={d}/>;
    case "bakery_shelf":       return <BakeryShelfShape w={w} d={d}/>;
    case "promo_island":      return <PromoShape w={w} d={d}/>;
    case "checkout_impulse":  return <CheckoutImpulseShape w={w} d={d}/>;
    case "queue_rail":        return <QueueRailShape w={w} d={d}/>;
    case "entry_exit":        return <EntryShape w={w} d={d}/>;
    case "obstacle":          return <ObstacleShape w={w} d={d}/>;
    default:                  return <GondolaShape w={w} d={d}/>;
  }
}

// ─── Grid ────────────────────────────────────────────────────────────────────

function GridLines({ canvas }: { canvas: CanvasConfig }) {
  const lines: React.ReactElement[] = [];
  const step = mmToPx(canvas.gridStep);
  const w = mmToPx(canvas.width);
  const h = mmToPx(canvas.height);
  for (let x = step; x < w; x += step)
    lines.push(<Line key={`v${x}`} points={[x, 0, x, h]} stroke="#e8e4dc" strokeWidth={0.8} listening={false} />);
  for (let y = step; y < h; y += step)
    lines.push(<Line key={`h${y}`} points={[0, y, w, y]} stroke="#e8e4dc" strokeWidth={0.8} listening={false} />);
  return <>{lines}</>;
}

// ─── Canvas component ────────────────────────────────────────────────────────

export interface LayoutCanvasRef {
  getZoom: () => number;
  setZoom: (z: number) => void;
  fitToScreen: () => void;
  cancelDrawing: () => void;
}

interface Props {
  fixtures: FixtureInstance[];
  walls: WallLine[];
  tool: ToolMode;
  selectedId: string | null;
  selectedWallId: string | null;
  canvasConfig: CanvasConfig;
  onSelect: (id: string | null) => void;
  onSelectWall: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, depth: number, x: number, y: number) => void;
  onRotateExact: (id: string, deg: number) => void;
  onAddWall: (wall: WallLine) => void;
  onUpdateWall: (wall: WallLine) => void;
  onDeleteWall: (id: string) => void;
  onStageClick: () => void;
  onZoomChange?: (zoom: number) => void;
}

const LayoutCanvas = forwardRef<LayoutCanvasRef, Props>(function LayoutCanvas(
  {
    fixtures, walls, tool,
    selectedId, selectedWallId,
    canvasConfig,
    onSelect, onSelectWall,
    onMove, onResize, onRotateExact,
    onAddWall, onUpdateWall, onDeleteWall,
    onStageClick, onZoomChange,
  },
  ref
) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());
  const [stageSize, setStageSize] = useState({ w: 1000, h: 700 });
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null);

  // Reset wall drawing state when tool changes
  useEffect(() => {
    setWallStart(null);
    setPreviewPos(null);
  }, [tool]);

  // Responsive canvas size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setStageSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setStageSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Attach Transformer to selected fixture node
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const node = selectedId ? nodeRefs.current.get(selectedId) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, fixtures]);

  useImperativeHandle(ref, () => ({
    cancelDrawing: () => { setWallStart(null); setPreviewPos(null); },
    getZoom: () => stageRef.current?.scaleX() ?? 1,
    setZoom: (z: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const clamped = Math.max(0.2, Math.min(z, 4));
      const cx = stageSize.w / 2;
      const cy = stageSize.h / 2;
      const old = stage.scaleX();
      stage.scale({ x: clamped, y: clamped });
      stage.position({ x: cx - (cx - stage.x()) * (clamped / old), y: cy - (cy - stage.y()) * (clamped / old) });
      onZoomChange?.(clamped);
    },
    fitToScreen: () => {
      const stage = stageRef.current;
      if (!stage) return;
      const cw = mmToPx(canvasConfig.width);
      const ch = mmToPx(canvasConfig.height);
      const scale = Math.min((stageSize.w - 80) / cw, (stageSize.h - 80) / ch, 1);
      stage.scale({ x: scale, y: scale });
      stage.position({ x: 40, y: 40 });
      onZoomChange?.(scale);
    },
  }));

  // Get snapped mm coordinates from pointer event
  const getSnappedMm = useCallback((stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const scale = stage.scaleX();
    const sp = stage.position();
    return {
      x: snap(pxToMm((pos.x - sp.x) / scale), canvasConfig.gridStep),
      y: snap(pxToMm((pos.y - sp.y) / scale), canvasConfig.gridStep),
    };
  }, [canvasConfig.gridStep]);

  // Mouse move — update wall preview, apply Ctrl constraint
  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool !== "draw-wall" || !wallStart) return;
    const stage = stageRef.current;
    if (!stage) return;
    let mm = getSnappedMm(stage);
    if (!mm) return;
    // Ctrl/Meta = constrain to horizontal or vertical
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const dx = Math.abs(mm.x - wallStart.x);
      const dy = Math.abs(mm.y - wallStart.y);
      mm = dx >= dy ? { x: mm.x, y: wallStart.y } : { x: wallStart.x, y: mm.y };
    }
    setPreviewPos(mm);
  }, [tool, wallStart, getSnappedMm]);

  // Stage click — deselect in select mode, or handle wall drawing
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === "select") {
      if (e.target === e.target.getStage()) {
        onStageClick();
        onSelectWall(null);
      }
      return;
    }
    // draw-wall mode: only act on canvas background clicks
    if (e.target !== e.target.getStage()) return;
    const stage = stageRef.current;
    if (!stage) return;
    let mm = getSnappedMm(stage);
    if (!mm) return;

    // Apply Ctrl constraint
    if ((e.evt.ctrlKey || e.evt.metaKey) && wallStart) {
      const dx = Math.abs(mm.x - wallStart.x);
      const dy = Math.abs(mm.y - wallStart.y);
      mm = dx >= dy ? { x: mm.x, y: wallStart.y } : { x: wallStart.x, y: mm.y };
    }

    if (!wallStart) {
      // Click 1: đặt điểm bắt đầu
      setWallStart(mm);
      setPreviewPos(mm);
    } else {
      // Click 2: hoàn thành đoạn, dừng lại
      onAddWall({
        id: `wall_${Date.now()}`,
        x1: wallStart.x, y1: wallStart.y,
        x2: mm.x,        y2: mm.y,
        thickness: 200,
      });
      setWallStart(null);
      setPreviewPos(null);
    }
  }, [tool, wallStart, getSnappedMm, onStageClick, onSelectWall, onAddWall]);

  const cw = mmToPx(canvasConfig.width);
  const ch = mmToPx(canvasConfig.height);

  const wallThicknessPx = mmToPx(200);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        background: "#f0ede6",
        overflow: "hidden",
        position: "relative",
        cursor: tool === "draw-wall" ? "crosshair" : "default",
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.w}
        height={stageSize.h}
        draggable={tool === "select"}
        onMouseMove={handleStageMouseMove}
        onClick={handleStageClick}
      >
        {/* Background + grid — no boundary walls */}
        <Layer listening={false}>
          <Rect x={-4000} y={-4000} width={stageSize.w * 8} height={stageSize.h * 8} fill="#f0ede6" />
          <Rect x={0} y={0} width={cw} height={ch} fill="#faf9f5" />
          <GridLines canvas={canvasConfig} />
        </Layer>

        {/* User-drawn walls */}
        <Layer>
          {walls.map((wall) => {
            const x1 = mmToPx(wall.x1), y1 = mmToPx(wall.y1);
            const x2 = mmToPx(wall.x2), y2 = mmToPx(wall.y2);
            const isSelected = wall.id === selectedWallId;

            return (
              <Group
                key={wall.id}
                draggable={tool === "select"}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (tool === "select") onSelectWall(isSelected ? null : wall.id);
                }}
                onDragEnd={(e) => {
                  const g = e.target as Konva.Group;
                  const dx = pxToMm(g.x());
                  const dy = pxToMm(g.y());
                  g.position({ x: 0, y: 0 });
                  onUpdateWall({
                    ...wall,
                    x1: snap(wall.x1 + dx, canvasConfig.gridStep),
                    y1: snap(wall.y1 + dy, canvasConfig.gridStep),
                    x2: snap(wall.x2 + dx, canvasConfig.gridStep),
                    y2: snap(wall.y2 + dy, canvasConfig.gridStep),
                  });
                }}
              >
                {/* Wall body */}
                <Line
                  points={[x1, y1, x2, y2]}
                  stroke={isSelected ? "#2563eb" : "#1a1510"}
                  strokeWidth={wallThicknessPx}
                  lineCap="square"
                  hitStrokeWidth={Math.max(wallThicknessPx + 10, 24)}
                />

                {/* Endpoint handles — only when selected */}
                {isSelected && (
                  <>
                    {/* Start endpoint */}
                    <Circle
                      x={x1} y={y1}
                      radius={9}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      draggable
                      onClick={(e) => e.cancelBubble = true}
                      onDragEnd={(e) => {
                        e.cancelBubble = true;
                        const c = e.target as Konva.Circle;
                        const nx = snap(pxToMm(c.x()), canvasConfig.gridStep);
                        const ny = snap(pxToMm(c.y()), canvasConfig.gridStep);
                        c.position({ x: mmToPx(nx), y: mmToPx(ny) });
                        onUpdateWall({ ...wall, x1: nx, y1: ny });
                      }}
                    />
                    {/* End endpoint */}
                    <Circle
                      x={x2} y={y2}
                      radius={9}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      draggable
                      onClick={(e) => e.cancelBubble = true}
                      onDragEnd={(e) => {
                        e.cancelBubble = true;
                        const c = e.target as Konva.Circle;
                        const nx = snap(pxToMm(c.x()), canvasConfig.gridStep);
                        const ny = snap(pxToMm(c.y()), canvasConfig.gridStep);
                        c.position({ x: mmToPx(nx), y: mmToPx(ny) });
                        onUpdateWall({ ...wall, x2: nx, y2: ny });
                      }}
                    />
                  </>
                )}
              </Group>
            );
          })}

          {/* Preview line while drawing */}
          {tool === "draw-wall" && wallStart && previewPos && (
            <Line
              points={[mmToPx(wallStart.x), mmToPx(wallStart.y), mmToPx(previewPos.x), mmToPx(previewPos.y)]}
              stroke="#1a1510"
              strokeWidth={wallThicknessPx}
              lineCap="square"
              opacity={0.4}
              listening={false}
            />
          )}

          {/* Start point indicator */}
          {tool === "draw-wall" && wallStart && (
            <Circle
              x={mmToPx(wallStart.x)}
              y={mmToPx(wallStart.y)}
              radius={7}
              fill="#2563eb"
              opacity={0.85}
              listening={false}
            />
          )}
        </Layer>

        {/* Fixtures + Transformer */}
        <Layer>
          {fixtures.map((fx) => {
            const px = mmToPx(fx.geometry.x);
            const py = mmToPx(fx.geometry.y);
            const pw = mmToPx(fx.geometry.width);
            const pd = mmToPx(fx.geometry.depth);
            const fontSize = Math.max(8, Math.min(11, pw / 9));
            // Label background: black rect centered in fixture
            const lblH = fontSize + 8;
            const lblW = Math.min(pw - 6, pw * 0.85);
            const lblX = (pw - lblW) / 2;
            const lblY = (pd - lblH) / 2;

            return (
              <Group
                key={fx.id}
                ref={(node) => {
                  if (node) nodeRefs.current.set(fx.id, node);
                  else nodeRefs.current.delete(fx.id);
                }}
                x={px}
                y={py}
                width={pw}
                height={pd}
                rotation={fx.geometry.rotationDeg}
                draggable={tool === "select"}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (tool === "select") { onSelect(fx.id); onSelectWall(null); }
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  if (tool === "select") { onSelect(fx.id); onSelectWall(null); }
                }}

                // Scroll on fixture = rotate
                onWheel={(e) => {
                  e.cancelBubble = true;
                  e.evt.preventDefault();
                  const step = e.evt.shiftKey ? 1 : 5;
                  const delta = e.evt.deltaY > 0 ? step : -step;
                  const newDeg = ((fx.geometry.rotationDeg + delta) % 360 + 360) % 360;
                  onRotateExact(fx.id, newDeg);
                }}

                onDragEnd={(e) => {
                  const node = e.target;
                  const sx = snap(pxToMm(node.x()), canvasConfig.gridStep);
                  const sy = snap(pxToMm(node.y()), canvasConfig.gridStep);
                  node.x(mmToPx(sx));
                  node.y(mmToPx(sy));
                  onMove(fx.id, sx, sy);
                }}

                onTransformEnd={(e) => {
                  const node = e.target as Konva.Group;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  const newW = Math.max(100, snap(pxToMm(pw * scaleX), canvasConfig.gridStep));
                  const newD = Math.max(100, snap(pxToMm(pd * scaleY), canvasConfig.gridStep));
                  const newX = snap(pxToMm(node.x()), canvasConfig.gridStep);
                  const newY = snap(pxToMm(node.y()), canvasConfig.gridStep);
                  const newRot = ((node.rotation() % 360) + 360) % 360;
                  onRotateExact(fx.id, newRot);
                  onResize(fx.id, newW, newD, newX, newY);
                }}
              >
                <FixtureKonvaShape type={fx.business.fixtureType} w={pw} d={pd} />
                {/* Black label background */}
                <Rect
                  x={lblX} y={lblY}
                  width={lblW} height={lblH}
                  fill="#000000"
                  cornerRadius={3}
                  listening={false}
                />
                {/* White label text */}
                <Text
                  text={fx.name}
                  x={lblX} y={lblY}
                  width={lblW} height={lblH}
                  align="center"
                  verticalAlign="middle"
                  fontSize={fontSize}
                  fill="#ffffff"
                  listening={false}
                  fontStyle="bold"
                  padding={2}
                />
                {fx.business.promo && (
                  <Rect x={pw - 8} y={0} width={8} height={8} fill="#d4900a" cornerRadius={[0, 2, 0, 0]} />
                )}
              </Group>
            );
          })}

          <Transformer
            ref={transformerRef}
            keepRatio={false}
            rotateEnabled={false}
            borderStroke="#2563eb"
            borderStrokeWidth={1.5}
            borderDash={[4, 3]}
            anchorSize={9}
            anchorStroke="#2563eb"
            anchorFill="#ffffff"
            anchorCornerRadius={2}
            anchorStrokeWidth={1.5}
            enabledAnchors={["top-left","top-center","top-right","middle-left","middle-right","bottom-left","bottom-center","bottom-right"]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 50 || newBox.height < 50) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>

      {/* Contextual hint */}
      <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: "#a09070", pointerEvents: "none" }}>
        {tool === "draw-wall"
          ? "Click 1: bắt đầu · Click 2: cắt xong đoạn · Giữ Ctrl: thẳng hàng ngang/dọc · ESC thoát"
          : "Scroll trên fixture = xoay · Shift+Scroll = 1° · Kéo handle = resize · Click tường để chọn · Del để xóa"}
      </div>
    </div>
  );
});

export default LayoutCanvas;
