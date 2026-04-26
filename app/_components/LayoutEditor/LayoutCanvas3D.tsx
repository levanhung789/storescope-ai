"use client";

import {
  useRef, useState, useEffect, useMemo, useCallback,
  forwardRef, useImperativeHandle, Suspense,
} from "react";
import { Canvas, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import { Selection, Select } from "@react-three/postprocessing";
import * as THREE from "three";
import { FixtureInstance, CanvasConfig, WallLine, ToolMode } from "./types";
import { FIXTURE_MAP } from "./fixtureLibrary";

// 3-step toon gradient map (shared singleton)
let _toonGrad: THREE.DataTexture | null = null;
function toonGrad(): THREE.DataTexture {
  if (!_toonGrad) {
    const d = new Uint8Array([90, 220]); // 2-step sharp toon: shadow vs highlight
    _toonGrad = new THREE.DataTexture(d, 2, 1, THREE.RedFormat);
    _toonGrad.minFilter = THREE.NearestFilter;
    _toonGrad.magFilter = THREE.NearestFilter;
    _toonGrad.needsUpdate = true;
  }
  return _toonGrad;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LayoutCanvasRef {
  setZoom: (z: number) => void;
  fitToScreen: () => void;
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
  onResize: (id: string, w: number, d: number, x: number, y: number) => void;
  onRotateExact: (id: string, deg: number) => void;
  onAddWall: (wall: WallLine) => void;
  onUpdateWall: (id: string, changes: Partial<WallLine>) => void;
  onDeleteWall: (id: string) => void;
  onStageClick: () => void;
  onZoomChange: (z: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MM = 1 / 1000;
function mm(v: number) { return v * MM; }
function snapMM(world: number, stepMm: number) {
  return Math.round((world / MM) / stepMm) * stepMm;
}

const COLORS = [
  "#ef4444","#f97316","#fbbf24","#22c55e","#3b82f6",
  "#a855f7","#06b6d4","#eab308","#ec4899","#84cc16","#f43f5e","#14b8a6",
];

// ─── Toon material helper (drops roughness/metalness/transmission for toon) ────

interface TProps {
  color?: string | number;
  emissive?: string | number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  roughness?: number; metalness?: number; transmission?: number;
  ior?: number; thickness?: number;
}
function T({ color, emissive, emissiveIntensity, transparent, opacity, side }: TProps) {
  return (
    <meshToonMaterial
      color={color as THREE.ColorRepresentation}
      emissive={emissive as THREE.ColorRepresentation | undefined}
      emissiveIntensity={emissiveIntensity}
      transparent={transparent}
      opacity={opacity}
      side={side}
      gradientMap={toonGrad()}
    />
  );
}

// ─── Shared shelf products ─────────────────────────────────────────────────────

function ShelfProducts({ shelfW, shelfD, y, seed }: {
  shelfW: number; shelfD: number; y: number; seed: number;
}) {
  const n = Math.max(3, Math.floor(shelfW / 0.12));
  const pw = (shelfW * 0.9) / n;
  const ph = Math.min(pw * 1.5, shelfD * 0.9, 0.22);
  const pd = shelfD * 0.75;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[(i - (n-1)/2) * pw, y + ph/2, 0]} castShadow>
          <boxGeometry args={[pw*0.84, ph, pd]}/>
          <meshToonMaterial color={COLORS[(seed + i) % COLORS.length]} gradientMap={toonGrad()}/>
        </mesh>
      ))}
    </>
  );
}

// ─── Fixture models ───────────────────────────────────────────────────────────

function CheckoutModel({ w, h, d }: { w:number; h:number; d:number }) {
  const beltW = w * 0.62;
  const beltX = -w * 0.16;
  const posW  = Math.min(w * 0.16, 0.18);
  return (
    <group>
      {/* Main body — dark anthracite */}
      <mesh position={[0, h/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]}/>
        <T color="#232323" roughness={0.75} metalness={0.15}/>
      </mesh>
      {/* Red brand stripe */}
      <mesh position={[0, h*0.54, 0]}>
        <boxGeometry args={[w+0.005, h*0.2, d+0.005]}/>
        <T color="#cc2020" roughness={0.65} emissive="#400000" emissiveIntensity={0.2}/>
      </mesh>
      {/* Chrome top rail */}
      <mesh position={[0, h*0.96, 0]}>
        <boxGeometry args={[w+0.008, h*0.075, d*0.14]}/>
        <T color="#c8c8c8" roughness={0.12} metalness={0.88}/>
      </mesh>
      {/* Conveyor belt */}
      <mesh position={[beltX, h*0.87, 0]} castShadow>
        <boxGeometry args={[beltW, 0.028, d*0.58]}/>
        <T color="#1a1a1a" roughness={0.95}/>
      </mesh>
      {/* Belt lines */}
      {Array.from({ length: Math.floor(beltW / 0.065) }).map((_, i) => (
        <mesh key={i} position={[beltX - beltW/2 + 0.032 + i*0.065, h*0.885, 0]}>
          <boxGeometry args={[0.01, 0.005, d*0.56]}/>
          <meshBasicMaterial color="#333"/>
        </mesh>
      ))}
      {/* Plexiglass sneeze guard */}
      <mesh position={[w*0.18, h*0.95, 0]}>
        <boxGeometry args={[0.008, h*0.35, d*0.72]}/>
        <T color="#aaddff" transparent opacity={0.18} roughness={0} transmission={0.8}/>
      </mesh>
      {/* POS terminal base */}
      <mesh position={[w*0.36, h*0.89, -d*0.08]}>
        <boxGeometry args={[0.055, 0.14, 0.04]}/>
        <T color="#111" roughness={0.7}/>
      </mesh>
      {/* POS screen */}
      <mesh position={[w*0.36, h*0.93, -d*0.055]}>
        <boxGeometry args={[0.052, 0.1, 0.008]}/>
        <T color="#1254a0" emissive="#1660cc" emissiveIntensity={0.7} roughness={0.1}/>
      </mesh>
    </group>
  );
}

function ProduceShelfModel({ w, h, d }: { w:number; h:number; d:number }) {
  const COLS=3, ROWS=2;
  const ft = Math.max(0.032, w*0.038);
  const dv = Math.max(0.022, w*0.022);
  const cW = (w - ft*2 - dv*(COLS-1)) / COLS;
  const cD = (d - ft*2 - dv*(ROWS-1)) / ROWS;
  const pal = ["#ef4444","#f97316","#22c55e","#facc15","#fb923c","#86efac"];
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]}/>
        <T color="#6b4423" roughness={0.92} metalness={0.02}/>
      </mesh>
      <mesh position={[0, h/2+0.006, 0]}>
        <boxGeometry args={[w-ft*2, 0.012, d-ft*2]}/>
        <T color="#8a6035" roughness={1}/>
      </mesh>
      {Array.from({ length: COLS-1 }).map((_, i) => (
        <mesh key={`v${i}`} position={[-w/2+ft+(i+1)*(cW+dv)-dv/2, h/2+0.045, 0]}>
          <boxGeometry args={[dv, 0.12, d-ft*2]}/>
          <T color="#4a2e0e" roughness={1}/>
        </mesh>
      ))}
      {Array.from({ length: ROWS-1 }).map((_, i) => (
        <mesh key={`h${i}`} position={[0, h/2+0.045, -d/2+ft+(i+1)*(cD+dv)-dv/2]}>
          <boxGeometry args={[w-ft*2, 0.12, dv]}/>
          <T color="#4a2e0e" roughness={1}/>
        </mesh>
      ))}
      {Array.from({ length: ROWS }).flatMap((_, row) =>
        Array.from({ length: COLS }).flatMap((_, col) => {
          const cx = -w/2+ft+col*(cW+dv)+cW/2;
          const cz = -d/2+ft+row*(cD+dv)+cD/2;
          const r  = Math.min(cW, cD)*0.27;
          const base = pal[(row*COLS+col) % pal.length];
          return Array.from({ length: 5 }).map((_, k) => {
            const a = (k/5)*Math.PI*2 + row*0.4 + col*1.1;
            const sp = k===4 ? 0 : r*0.52;
            return (
              <mesh key={`s${row}${col}${k}`}
                position={[cx+Math.cos(a)*sp, h/2+0.012+r*0.82, cz+Math.sin(a)*sp]}
                castShadow>
                <sphereGeometry args={[r*0.78, 12, 9]}/>
                <T color={base} roughness={0.5} metalness={0.03}/>
              </mesh>
            );
          });
        })
      )}
    </group>
  );
}

function CoolerModel({ w, h, d, brand }: { w:number; h:number; d:number; brand:string }) {
  const isPepsi = brand === "pepsi";
  const bodyColor  = isPepsi ? "#0d2a8a" : "#1a3f6a";
  const frameColor = "#dce8f0";
  const glowColor  = isPepsi ? "#60a0f8" : "#28d8ff";
  const prods = isPepsi
    ? ["#1d4ed8","#2563eb","#93c5fd","#1e40af","#60a5fa","#3b82f6"]
    : ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316","#06b6d4","#84cc16"];

  const doors    = Math.max(1, Math.round(w / 0.72));
  const dw       = w / doors;
  const shelves  = 5;
  const shelfGap = (h * 0.80) / shelves;

  return (
    <group>
      {/* Outer shell — back + sides + top + bottom */}
      <mesh castShadow receiveShadow position={[0, 0, -d/2+0.03]}>
        <boxGeometry args={[w, h, 0.06]}/>
        <T color="#0c1e34" roughness={0.9}/>
      </mesh>
      {[-1,1].map(s => (
        <mesh key={s} castShadow receiveShadow position={[s*(w/2-0.03), 0, 0]}>
          <boxGeometry args={[0.06, h+0.1, d]}/>
          <T color={bodyColor} roughness={0.35} metalness={0.5}/>
        </mesh>
      ))}
      <mesh castShadow receiveShadow position={[0, h/2-0.03, 0]}>
        <boxGeometry args={[w, 0.06, d]}/>
        <T color={bodyColor} roughness={0.35} metalness={0.5}/>
      </mesh>
      <mesh receiveShadow position={[0, -h/2+0.03, 0]}>
        <boxGeometry args={[w, 0.06, d]}/>
        <T color={bodyColor} roughness={0.35} metalness={0.5}/>
      </mesh>

      {/* Interior back wall (light) */}
      <mesh position={[0, 0, -d/2+0.08]}>
        <boxGeometry args={[w-0.07, h-0.07, 0.01]}/>
        <T color="#ffffff" roughness={0.95}/>
      </mesh>

      {/* Shelves + LED strips + products */}
      {Array.from({ length: shelves }).map((_, si) => {
        const sy = -h/2 + 0.12 + si * shelfGap;
        const cansPerRow = Math.max(2, Math.floor((w - 0.12) / 0.075));
        return (
          <group key={si}>
            {/* Shelf wire grid (simplified as thin box) */}
            <mesh position={[0, sy, -d*0.08]}>
              <boxGeometry args={[w - 0.09, 0.018, d * 0.72]}/>
              <T color="#9aacb8" roughness={0.4} metalness={0.7}/>
            </mesh>
            {/* LED strip under shelf front */}
            <mesh position={[0, sy + 0.022, d*0.28]}>
              <boxGeometry args={[w - 0.12, 0.01, 0.025]}/>
              <T color={glowColor} emissive={glowColor} emissiveIntensity={0.6}/>
            </mesh>
            {/* Products — cylinders (cans/bottles) */}
            {Array.from({ length: cansPerRow }).map((_, ci) => {
              const px = -(w-0.12)/2 + 0.037 + ci*0.075;
              const col = prods[(si * 9 + ci) % prods.length];
              const isTall = (si + ci) % 3 === 0;
              return (
                <mesh key={ci} position={[px, sy + (isTall ? 0.075 : 0.055), -d*0.09]}>
                  <cylinderGeometry args={[0.03, 0.03, isTall ? 0.15 : 0.1, 10]}/>
                  <T color={col} roughness={0.55} metalness={0.25}/>
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* Glass doors + chrome frames */}
      {Array.from({ length: doors }).map((_, di) => {
        const dx = -w/2 + dw/2 + di * dw;
        return (
          <group key={di} position={[dx, 0, 0]}>
            {/* Glass panel */}
            <mesh position={[0, 0, d/2 + 0.012]}>
              <planeGeometry args={[dw - 0.065, h * 0.875]}/>
              <T color={isPepsi ? "#4478e0" : "#22b8f0"} transparent opacity={0.75}
                side={THREE.DoubleSide}/>
            </mesh>
            {/* Frame — top/bottom/left/right bars */}
            {[
              { p:[0,  h*0.445, d/2], a:[dw, 0.045, 0.04] },
              { p:[0, -h*0.445, d/2], a:[dw, 0.045, 0.04] },
              { p:[-dw/2+0.02, 0, d/2], a:[0.04, h*0.9, 0.04] },
              { p:[dw/2-0.02,  0, d/2], a:[0.04, h*0.9, 0.04] },
            ].map(({p,a}, fi) => (
              <mesh key={fi} position={p as [number,number,number]}>
                <boxGeometry args={a as [number,number,number]}/>
                <T color={frameColor} metalness={0.88} roughness={0.07}/>
              </mesh>
            ))}
            {/* Door handle */}
            <mesh position={[dw*0.32, 0, d/2 + 0.048]}>
              <cylinderGeometry args={[0.014, 0.014, h*0.24, 8]}/>
              <T color={frameColor} metalness={0.95} roughness={0.04}/>
            </mesh>
          </group>
        );
      })}

      {/* Branding header topper — dark box wrapping the top */}
      <mesh position={[0, h/2 + 0.05, 0]} castShadow>
        <boxGeometry args={[w + 0.01, 0.10, d + 0.01]}/>
        <T color={isPepsi ? "#000a40" : "#0c1c30"} roughness={0.8}/>
      </mesh>
      {/* Brand stripe on FRONT face of header (not on top) */}
      <mesh position={[0, h/2 + 0.05, d/2 + 0.006]}>
        <planeGeometry args={[w * 0.82, 0.07]}/>
        <T color={glowColor} emissive={glowColor} emissiveIntensity={0.5}/>
      </mesh>

      {/* Base plinth */}
      <mesh receiveShadow position={[0, -h/2 - 0.055, 0]}>
        <boxGeometry args={[w + 0.02, 0.09, d + 0.02]}/>
        <T color="#0d1a28" roughness={0.6} metalness={0.35}/>
      </mesh>
      {/* Leveling feet */}
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sz],fi) => (
        <mesh key={fi} position={[sx*(w/2-0.08), -h/2-0.108, sz*(d/2-0.06)]}>
          <cylinderGeometry args={[0.028, 0.035, 0.03, 8]}/>
          <T color="#555" metalness={0.6} roughness={0.3}/>
        </mesh>
      ))}

      {/* Interior lights */}
      <pointLight position={[0,  h*0.1,  -d*0.15]} intensity={2.2} color="#d8eeff" distance={h*3.5}/>
      <pointLight position={[0, -h*0.28, -d*0.15]} intensity={1.4} color="#c0e8ff" distance={h*2.5}/>
    </group>
  );
}

function FreshCounterModel({ w, h, d }: { w:number; h:number; d:number }) {
  const n = Math.max(3, Math.floor(w/0.3));
  const iw = (w*0.88)/n;
  const gH = h*0.54;
  const foodColors = ["#fca5a5","#fdba74","#bfdbfe","#fde68a","#d9f99d","#e9d5ff","#fecdd3","#cffafe"];
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]}/>
        <T color="#b8c4cc" roughness={0.18} metalness={0.6}/>
      </mesh>
      {/* Glass case */}
      <mesh position={[0, h/2+gH/2+0.005, 0]}>
        <boxGeometry args={[w*0.95, gH, d*0.9]}/>
        <T color="#cce8f8" transparent opacity={0.28}
          roughness={0.02} transmission={0.6} ior={1.4}/>
      </mesh>
      {/* Food items */}
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[(i-(n-1)/2)*iw, h/2+gH*0.3, 0]} castShadow>
          <boxGeometry args={[iw*0.84, gH*0.6, d*0.68]}/>
          <T color={foodColors[i%foodColors.length]} roughness={0.8}/>
        </mesh>
      ))}
      {/* Chrome edge */}
      <mesh position={[0, h/2-0.012, 0]}>
        <boxGeometry args={[w+0.004, 0.024, d+0.004]}/>
        <T color="#ccc" metalness={0.82} roughness={0.12}/>
      </mesh>
    </group>
  );
}

function GondolaModel({ w, h, d }: { w:number; h:number; d:number }) {
  const n = Math.max(3, Math.floor(h/0.34));
  const spineD = Math.min(d, 0.07);
  const sideD = (d-spineD)/2;
  const postW = 0.045;
  return (
    <group>
      {/* Center spine */}
      <mesh position={[0, h/2, 0]} castShadow>
        <boxGeometry args={[w, h, spineD]}/>
        <T color="#252535" roughness={0.88}/>
      </mesh>
      {/* End uprights */}
      {[-w/2+postW/2, w/2-postW/2].map((px, i) => (
        <mesh key={i} position={[px, h/2, 0]} castShadow>
          <boxGeometry args={[postW, h+0.04, d+0.03]}/>
          <T color="#0a2a12" roughness={0.85}/>
        </mesh>
      ))}
      {/* Top cap */}
      <mesh position={[0, h+0.025, 0]}>
        <boxGeometry args={[w+0.04, 0.04, d+0.04]}/>
        <T color="#14532d" emissive="#14532d" emissiveIntensity={0.28}/>
      </mesh>
      {/* Shelves on both sides */}
      {Array.from({ length: n }).map((_, i) => {
        const sy = (i+1)*(h/(n+1));
        return (
          <group key={i} position={[0, sy, 0]}>
            {[1, -1].map((side) => (
              <group key={side} position={[0, 0, side*(sideD/2+spineD/2)]}>
                <mesh>
                  <boxGeometry args={[w-postW*2, 0.022, sideD]}/>
                  <T color="#1e1e1e" roughness={0.9}/>
                </mesh>
                {/* Price rail */}
                <mesh position={[0, -0.018, side*sideD/2]}>
                  <boxGeometry args={[w-postW*2, 0.015, 0.012]}/>
                  <T color="#ffdd44" emissive="#886600" emissiveIntensity={0.2}/>
                </mesh>
                <ShelfProducts shelfW={w-postW*2-0.04} shelfD={sideD*0.82} y={0.011} seed={i*4+side}/>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function WallShelfModel({ w, h, d }: { w:number; h:number; d:number }) {
  const n = Math.max(2, Math.floor(h/0.36));
  return (
    <group>
      {/* Back panel */}
      <mesh position={[0, h/2, -d/2+0.024]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.048]}/>
        <T color="#1e1e2a" roughness={0.88}/>
      </mesh>
      {/* Side brackets */}
      {[-w/2+0.022, w/2-0.022].map((px, i) => (
        <mesh key={i} position={[px, h/2, 0]}>
          <boxGeometry args={[0.044, h, d]}/>
          <T color="#161622" roughness={0.9}/>
        </mesh>
      ))}
      {Array.from({ length: n }).map((_, i) => {
        const sy = (i+1)*(h/(n+1));
        return (
          <group key={i} position={[0, sy, 0]}>
            <mesh>
              <boxGeometry args={[w, 0.022, d*0.88]}/>
              <T color="#1a1a1a" roughness={0.92}/>
            </mesh>
            <ShelfProducts shelfW={w-0.06} shelfD={d*0.8} y={0.011} seed={i*7}/>
          </group>
        );
      })}
    </group>
  );
}

function EndcapModel({ w, h, d }: { w:number; h:number; d:number }) {
  const n = Math.max(3, Math.floor(h/0.34));
  return (
    <group>
      <mesh position={[0, h/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]}/>
        <T color="#111" roughness={0.9}/>
      </mesh>
      <mesh position={[0, h+0.024, 0]}>
        <boxGeometry args={[w+0.04, 0.04, d+0.04]}/>
        <T color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4}/>
      </mesh>
      {Array.from({ length: n }).map((_, i) => {
        const sy = (i+1)*(h/(n+1));
        return (
          <group key={i} position={[0, sy, 0]}>
            <mesh>
              <boxGeometry args={[w-0.04, 0.022, d-0.04]}/>
              <T color="#14532d" roughness={0.88}/>
            </mesh>
            <ShelfProducts shelfW={w-0.06} shelfD={d-0.06} y={0.011} seed={i*5}/>
          </group>
        );
      })}
    </group>
  );
}

function BakeryShelfModel({ w, h, d }: { w:number; h:number; d:number }) {
  const sr = 3;
  const bc = ["#fcd34d","#d97706","#fbbf24","#f59e0b","#92400e","#a16207"];
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]}/>
        <T color="#3d2010" roughness={0.95}/>
      </mesh>
      {Array.from({ length: sr }).map((_, i) => {
        const sy = (i+1)*(h/(sr+1));
        const cnt = Math.max(2, Math.floor(w/0.18));
        const bw = (w*0.9)/cnt;
        return (
          <group key={i} position={[0, sy, 0]}>
            <mesh>
              <boxGeometry args={[w, 0.025, d*0.9]}/>
              <T color="#78350f" roughness={1}/>
            </mesh>
            {Array.from({ length: cnt }).map((_, j) => {
              const r = Math.min(bw*0.44, d*0.26);
              return (
                <mesh key={j} position={[(j-(cnt-1)/2)*bw, r*0.8, 0]} castShadow>
                  <sphereGeometry args={[r, 14, 10]}/>
                  <T color={bc[(i*cnt+j)%bc.length]} roughness={0.86}/>
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function PromoIslandModel({ w, h, d }: { w:number; h:number; d:number }) {
  const cols = Math.max(2, Math.floor(w/0.26));
  const rows = Math.max(2, Math.floor(d/0.26));
  const pw = (w*0.88)/cols, pd = (d*0.88)/rows;
  const ph = Math.min(pw, pd)*1.25;
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]}/>
        <T color="#7f1d1d" roughness={0.88}/>
      </mesh>
      <mesh position={[0, h/2+0.015, 0]}>
        <boxGeometry args={[w+0.02, 0.03, d+0.02]}/>
        <T color="#ef4444" roughness={0.8}/>
      </mesh>
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <mesh key={`${r}${c}`}
            position={[-w*0.44+pw/2+c*pw, h/2+ph/2, -d*0.44+pd/2+r*pd]} castShadow>
            <boxGeometry args={[pw*0.86, ph, pd*0.86]}/>
            <T color={COLORS[(r*cols+c)%COLORS.length]} roughness={0.7}/>
          </mesh>
        ))
      )}
    </group>
  );
}

function CheckoutImpulseModel({ w, h, d }: { w:number; h:number; d:number }) {
  const sr = 4;
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]}/>
        <T color="#111" roughness={0.9}/>
      </mesh>
      <mesh position={[0, h/2+0.02, 0]}>
        <boxGeometry args={[w+0.02, 0.03, d+0.02]}/>
        <T color="#166534" emissive="#166534" emissiveIntensity={0.35}/>
      </mesh>
      {Array.from({ length: sr }).map((_, i) => {
        const sy = (i+1)*(h/(sr+1));
        return (
          <group key={i} position={[0, sy, 0]}>
            <mesh>
              <boxGeometry args={[w, 0.02, d*0.85]}/>
              <T color="#222" roughness={1}/>
            </mesh>
            <ShelfProducts shelfW={w*0.88} shelfD={d*0.72} y={0.01} seed={i*3}/>
          </group>
        );
      })}
    </group>
  );
}

function EntryExitModel({ w, d }: { w:number; d:number }) {
  const fH=2.5, ft=0.075;
  return (
    <group>
      {[-w/2+ft/2, w/2-ft/2].map((px, i) => (
        <mesh key={i} position={[px, fH/2, 0]} castShadow>
          <boxGeometry args={[ft, fH, d]}/>
          <T color="#777" metalness={0.75} roughness={0.25}/>
        </mesh>
      ))}
      <mesh position={[0, fH, 0]}>
        <boxGeometry args={[w, ft, d]}/>
        <T color="#777" metalness={0.75} roughness={0.25}/>
      </mesh>
      {[-w*0.22, w*0.22].map((px, i) => (
        <mesh key={i} position={[px, fH*0.5, d/2+0.01]}>
          <planeGeometry args={[w*0.4, fH*0.9]}/>
          <T color="#88ddff" transparent opacity={0.2}
            roughness={0} transmission={0.75} ior={1.45}/>
        </mesh>
      ))}
      <mesh position={[0, fH*0.7, d/2+0.022]}>
        <boxGeometry args={[w*0.5, 0.12, 0.02]}/>
        <T color="#16a34a" emissive="#16a34a" emissiveIntensity={0.6}/>
      </mesh>
      {[-w/2-0.2, w/2+0.2].map((px, i) => (
        <group key={i} position={[px, 0, 0]}>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.17, 0.28, 10]}/>
            <T color="#8B5E3C" roughness={1}/>
          </mesh>
          <mesh position={[0, 0.45, 0]} castShadow>
            <sphereGeometry args={[0.25, 12, 9]}/>
            <T color="#166534" roughness={1}/>
          </mesh>
          <mesh position={[-0.1, 0.58, 0.06]} castShadow>
            <sphereGeometry args={[0.16, 10, 8]}/>
            <T color="#22c55e" roughness={1}/>
          </mesh>
          <mesh position={[0.1, 0.55, -0.05]} castShadow>
            <sphereGeometry args={[0.14, 10, 8]}/>
            <T color="#4ade80" roughness={1}/>
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ObstacleModel({ w, h, d }: { w:number; h:number; d:number }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]}/>
        <T color="#9ca3af" roughness={0.4} metalness={0.4}/>
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[w/2+0.003, -h/2+(i+0.5)*(h/4), 0]}>
          <planeGeometry args={[0.001, h/4*0.82]}/>
          <meshBasicMaterial color={i%2===0?"#ef4444":"#fbbf24"} side={THREE.DoubleSide}/>
        </mesh>
      ))}
    </group>
  );
}

function AnnotationModel({ note, name }: { note?: string; name: string }) {
  return (
    <group>
      {/* Pin needle */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.018, 0.006, 0.36, 8]}/>
        <T color="#d97706" roughness={0.5}/>
      </mesh>
      {/* Pin head — sphere */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.18, 16, 12]}/>
        <T color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4}/>
      </mesh>
      {/* Note card floating above */}
      <mesh position={[0.28, 0.62, 0]}>
        <boxGeometry args={[0.55, 0.32, 0.02]}/>
        <T color="#fef3c7" roughness={0.9}/>
      </mesh>
      {/* Note lines */}
      {[0.05, 0, -0.05].map((dy, i) => (
        <mesh key={i} position={[0.28, 0.62 + dy, 0.012]}>
          <boxGeometry args={[0.38 - i * 0.06, 0.018, 0.001]}/>
          <T color="#92400e" roughness={1}/>
        </mesh>
      ))}
      {/* Connector line from pin to card */}
      <mesh position={[0.14, 0.56, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.004, 0.14, 0.004]}/>
        <T color="#d97706" roughness={0.8}/>
      </mesh>
      {/* Floating label with note preview */}
      <Text position={[0, 0.85, 0]} fontSize={0.13} color="#92400e"
        anchorX="center" anchorY="middle" maxWidth={1.2}>
        {name}
      </Text>
      {note && (
        <Text position={[0, 0.70, 0]} fontSize={0.09} color="#b45309"
          anchorX="center" anchorY="middle" maxWidth={1.4}>
          {note.slice(0, 60)}{note.length > 60 ? "…" : ""}
        </Text>
      )}
    </group>
  );
}

function FixtureModel({ type, w, h, d, note, name }: { type:string; w:number; h:number; d:number; note?:string; name?:string }) {
  switch (type) {
    case "checkout":          return <CheckoutModel w={w} h={h} d={d}/>;
    case "produce_shelf":     return <ProduceShelfModel w={w} h={h} d={d}/>;
    case "food_cooler":
    case "cooler_upright":    return <CoolerModel w={w} h={h} d={d} brand="food"/>;
    case "pepsi_cooler":      return <CoolerModel w={w} h={h} d={d} brand="pepsi"/>;
    case "fresh_counter":     return <FreshCounterModel w={w} h={h} d={d}/>;
    case "wall_shelf":        return <WallShelfModel w={w} h={h} d={d}/>;
    case "gondola_double":    return <GondolaModel w={w} h={h} d={d}/>;
    case "endcap":            return <EndcapModel w={w} h={h} d={d}/>;
    case "bakery_shelf":      return <BakeryShelfModel w={w} h={h} d={d}/>;
    case "promo_island":      return <PromoIslandModel w={w} h={h} d={d}/>;
    case "checkout_impulse":  return <CheckoutImpulseModel w={w} h={h} d={d}/>;
    case "entry_exit":        return <EntryExitModel w={w} d={d}/>;
    case "obstacle":          return <ObstacleModel w={w} h={h} d={d}/>;
    case "annotation":        return <AnnotationModel note={note} name={name ?? "Note"}/>;
    default:                  return <GondolaModel w={w} h={h} d={d}/>;
  }
}

// ─── Fixture node ─────────────────────────────────────────────────────────────

interface FixtureNodeProps {
  fx: FixtureInstance;
  selected: boolean;
  tool: ToolMode;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: ThreeEvent<PointerEvent>) => void;
  onHover: (id: string | null) => void;
  orbitRef: React.RefObject<unknown>;
}

function FixtureNode({ fx, selected, tool, onSelect, onDragStart, onHover, orbitRef }: FixtureNodeProps) {
  const [hovered, setHovered] = useState(false);
  const def = FIXTURE_MAP.get(fx.business.fixtureType as never);

  const w  = mm(fx.geometry.width);
  const h  = Math.max(0.05, mm(fx.geometry.height || (def?.defaultHeight ?? 1500)));
  const d  = mm(fx.geometry.depth);
  const cx = mm(fx.geometry.x) + w/2;
  const cz = mm(fx.geometry.y) + d/2;
  const rotY = -(fx.geometry.rotationDeg * Math.PI) / 180;
  const ringR = Math.max(w, d) * 0.54;

  return (
    <group
      position={[cx, 0, cz]}
      rotation={[0, rotY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "grab";
        onHover(fx.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (orbitRef.current) (orbitRef.current as any).enableZoom = false;
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
        onHover(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (orbitRef.current) (orbitRef.current as any).enableZoom = true;
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(fx.id);
        if (tool === "select") onDragStart(fx.id, e);
      }}
    >
      {/* Glow ring on floor */}
      {(hovered || selected) && (
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[ringR, ringR+0.065, 48]}/>
          <meshBasicMaterial
            color={selected ? "#7c3aed" : "#ffffff"}
            transparent opacity={selected ? 0.8 : 0.3}/>
        </mesh>
      )}

      {/* Model from bottom-left-front corner */}
      <group position={[-w/2, 0, -d/2]}>
        <FixtureModel type={fx.business.fixtureType} w={w} h={h} d={d} note={fx.note} name={fx.name}/>
      </group>

      {/* Floating label — larger, English */}
      {fx.business.fixtureType !== "annotation" && (
        <>
          <mesh position={[0, h + 0.18, 0]}>
            <boxGeometry args={[Math.min(w * 0.92, 1.4), 0.16, 0.018]}/>
            <meshBasicMaterial color="#0a0a14" transparent opacity={0.85}/>
          </mesh>
          <Text
            position={[0, h + 0.18, 0.014]}
            fontSize={Math.min(0.11, w * 0.13)}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={Math.min(w * 0.88, 1.35)}
            font={undefined}
          >
            {fx.name}
          </Text>
        </>
      )}

      {/* Selected outline */}
      {selected && (
        <lineSegments position={[0, h/2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(w+0.028, h+0.028, d+0.028)]}/>
          <lineBasicMaterial color="#7c3aed"/>
        </lineSegments>
      )}
    </group>
  );
}

// ─── Wall ─────────────────────────────────────────────────────────────────────

function Wall3D({ wall, selected, onSelect }: {
  wall: WallLine; selected: boolean; onSelect: (id: string) => void;
}) {
  const x1=mm(wall.x1), z1=mm(wall.y1), x2=mm(wall.x2), z2=mm(wall.y2);
  const len = Math.sqrt((x2-x1)**2+(z2-z1)**2);
  const cx=(x1+x2)/2, cz=(z1+z2)/2;
  const angle = -Math.atan2(z2-z1, x2-x1);
  const wH=2.8, thick=Math.max(mm(wall.thickness), 0.06);
  return (
    <mesh position={[cx, wH/2, cz]} rotation={[0, angle, 0]} castShadow receiveShadow
      onClick={(e) => { e.stopPropagation(); onSelect(wall.id); }}>
      <boxGeometry args={[len, wH, thick]}/>
      <T color={selected?"#7c3aed":"#d0cbc2"} roughness={0.92}/>
    </mesh>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

interface SceneProps extends Props {
  orbitRef: React.RefObject<unknown>;
}

function Scene(props: SceneProps) {
  const {
    fixtures, walls, tool, selectedId, selectedWallId, canvasConfig,
    onSelect, onSelectWall, onMove, onRotateExact, onStageClick, orbitRef,
  } = props;

  const { gl, camera, raycaster } = useThree();
  const fW = mm(canvasConfig.width);
  const fD = mm(canvasConfig.height);
  const gridStep = canvasConfig.gridStep;

  // Drag state
  const [dragging, setDragging] = useState<{id:string; offX:number; offZ:number}|null>(null);
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0,1,0), 0), []);

  // Refs for wheel rotate (avoid stale closures)
  const hoveredIdRef  = useRef<string|null>(null);
  const fixturesRef   = useRef(fixtures);
  const rotateRef     = useRef(onRotateExact);
  fixturesRef.current = fixtures;
  rotateRef.current   = onRotateExact;

  const getFloorHit = useCallback((clientX:number, clientY:number) => {
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX-rect.left)/rect.width)*2-1,
      -((clientY-rect.top)/rect.height)*2+1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, hit);
    return hit;
  }, [gl, camera, raycaster, floorPlane]);

  // Global pointer move/up for drag
  useEffect(() => {
    const canvas = gl.domElement;
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const pos = getFloorHit(e.clientX, e.clientY);
      onMove(dragging.id, Math.max(0, snapMM(pos.x-dragging.offX, gridStep)), Math.max(0, snapMM(pos.z-dragging.offZ, gridStep)));
    };
    const onPointerUp = () => setDragging(null);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    return () => { canvas.removeEventListener("pointermove", onPointerMove); canvas.removeEventListener("pointerup", onPointerUp); };
  }, [dragging, getFloorHit, onMove, gridStep, gl]);

  // Wheel = rotate hovered fixture
  useEffect(() => {
    const canvas = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (!hoveredIdRef.current) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const id = hoveredIdRef.current;
      const fx = fixturesRef.current.find(f => f.id === id);
      if (!fx) return;
      const step = e.shiftKey ? 5 : e.altKey ? 1 : 15;
      const delta = e.deltaY > 0 ? step : -step;
      rotateRef.current(id, ((fx.geometry.rotationDeg + delta) % 360 + 360) % 360);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [gl]);

  const handleDragStart = useCallback((id: string, e: ThreeEvent<PointerEvent>) => {
    const fx = fixtures.find(f => f.id === id);
    if (!fx) return;
    const pos = getFloorHit(e.nativeEvent.clientX, e.nativeEvent.clientY);
    setDragging({ id, offX: pos.x-mm(fx.geometry.x), offZ: pos.z-mm(fx.geometry.y) });
  }, [fixtures, getFloorHit]);

  // Floor grid lines — extracted as proper hook (useMemo must not be called inside JSX)
  const floorGrid = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: "#3a4150", transparent: true, opacity: 0.8 });
    const step = Math.max(mm(gridStep * 10), 1);
    const els: React.ReactElement[] = [];
    for (let x = 0; x <= fW + 0.01; x += step) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.001, 0), new THREE.Vector3(x, 0.001, fD),
      ]);
      els.push(<primitive key={`v${x.toFixed(3)}`} object={new THREE.Line(geo, mat)}/>);
    }
    for (let z = 0; z <= fD + 0.01; z += step) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.001, z), new THREE.Vector3(fW, 0.001, z),
      ]);
      els.push(<primitive key={`h${z.toFixed(3)}`} object={new THREE.Line(geo, mat)}/>);
    }
    return els;
  }, [fW, fD, gridStep]);

  return (
    <>
      {/* Toon background */}
      <color attach="background" args={["#1a1e24"]}/>

      {/* Flat stylized lighting for toon look */}
      <ambientLight intensity={2.8} color="#ccd8f0"/>
      <directionalLight position={[fW*0.6, 14, -fD*0.3]} intensity={1.2} color="#ffffff"
        castShadow shadow-mapSize={[2048,2048]}
        shadow-camera-left={-60} shadow-camera-right={60}
        shadow-camera-top={60} shadow-camera-bottom={-60}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-fW*0.4, 8, fD*0.6]} intensity={0.4} color="#e8f4ff"/>

      {/* Effect composer with outline — wraps all fixture selects */}
      <Selection>
        <EffectComposer autoClear={false}>
          <Outline
            blur={false}
            edgeStrength={14}
            visibleEdgeColor={0x111111}
            hiddenEdgeColor={0x333333}
            xRay={false}
          />
        </EffectComposer>

        <Select enabled>
          {fixtures.map(fx => (
            <FixtureNode key={fx.id} fx={fx}
              selected={fx.id===selectedId}
              tool={tool}
              onSelect={onSelect}
              onDragStart={handleDragStart}
              onHover={(id) => { hoveredIdRef.current = id; }}
              orbitRef={orbitRef}
            />
          ))}
        </Select>
      </Selection>

      {/* Floor — clean white tile for toon style */}
      <mesh position={[fW/2, 0, fD/2]} rotation={[-Math.PI/2, 0, 0]} receiveShadow
        onClick={(e) => { e.stopPropagation(); onStageClick(); onSelect(null); }}>
        <planeGeometry args={[fW, fD]}/>
        <meshLambertMaterial color="#252a32"/>
      </mesh>

      {/* Floor tile grid lines */}
      {floorGrid}

      {/* Perimeter walls */}
      {([
        { p:[fW/2,1.5,-0.14] as [number,number,number], a:[fW+0.28,3,0.28] as [number,number,number] },
        { p:[fW/2,1.5,fD+0.14] as [number,number,number], a:[fW+0.28,3,0.28] as [number,number,number] },
        { p:[-0.14,1.5,fD/2] as [number,number,number], a:[0.28,3,fD] as [number,number,number] },
        { p:[fW+0.14,1.5,fD/2] as [number,number,number], a:[0.28,3,fD] as [number,number,number] },
      ]).map(({p, a}, i) => (
        <mesh key={i} position={p} castShadow receiveShadow>
          <boxGeometry args={a}/>
          <meshLambertMaterial color="#2e333d"/>
        </mesh>
      ))}

      {/* User-drawn walls */}
      {walls.map(w => (
        <Wall3D key={w.id} wall={w} selected={w.id===selectedWallId} onSelect={onSelectWall}/>
      ))}

      {/* Camera controls */}
      <OrbitControls
        ref={orbitRef as React.RefObject<never>}
        target={[fW/2, 0, fD/2]}
        enabled={!dragging}
        maxPolarAngle={Math.PI/2-0.02}
        minDistance={1.5}
        maxDistance={120}
        enableDamping
        dampingFactor={0.07}
        zoomSpeed={0.85}
        rotateSpeed={0.65}
        panSpeed={0.8}
      />
    </>
  );
}

// ─── Camera init ──────────────────────────────────────────────────────────────

function CameraInit({ fW, fD }: { fW:number; fD:number }) {
  const { camera } = useThree();
  const done = useRef(false);
  if (!done.current) {
    done.current = true;
    camera.position.set(fW/2, fD*0.55, fD*1.15);
    (camera as THREE.PerspectiveCamera).fov = 48;
    camera.updateProjectionMatrix();
    camera.lookAt(fW/2, 0, fD/2);
  }
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

const LayoutCanvas3D = forwardRef<LayoutCanvasRef, Props>(function LayoutCanvas3D(props, ref) {
  const orbitRef = useRef<unknown>(null);
  const fW = mm(props.canvasConfig.width);
  const fD = mm(props.canvasConfig.height);

  useImperativeHandle(ref, () => ({
    setZoom(z: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = orbitRef.current as any;
      if (!c) return;
      const cam = c.object as THREE.PerspectiveCamera;
      const dir = cam.position.clone().sub(c.target).normalize();
      const dist = cam.position.distanceTo(c.target);
      cam.position.copy(c.target).addScaledVector(dir, dist*(1/z));
      c.update();
    },
    fitToScreen() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = orbitRef.current as any;
      if (!c) return;
      c.object.position.set(fW/2, fD*0.55, fD*1.15);
      c.target.set(fW/2, 0, fD/2);
      c.update();
    },
  }));

  return (
    <div style={{ flex:1, background:"#1a1e24", position:"relative", minWidth:0 }}>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ fov:45, near:0.1, far:600 }}
        style={{ width:"100%", height:"100%" }}
        gl={{ antialias:true, toneMapping:THREE.NoToneMapping, toneMappingExposure:1.0 }}
      >
        <Suspense fallback={null}>
          <CameraInit fW={fW} fD={fD}/>
          <Scene {...props} orbitRef={orbitRef}/>
        </Suspense>
      </Canvas>
      <div style={{ position:"absolute", bottom:12, right:14, fontSize:11,
        color:"rgba(255,255,255,0.32)", pointerEvents:"none", userSelect:"none",
        lineHeight:1.8 }}>
        <div>🖱 Drag fixture to move</div>
        <div>🖱 Scroll over fixture to rotate 15° · Shift = 5° · Alt = 1°</div>
        <div>🖱 Right/middle: orbit camera · Scroll outside: zoom</div>
      </div>
    </div>
  );
});

export default LayoutCanvas3D;
