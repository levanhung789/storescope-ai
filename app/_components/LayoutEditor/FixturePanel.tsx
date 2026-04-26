"use client";

import { FIXTURE_TYPES } from "./fixtureLibrary";
import { FixtureTypeDef } from "./types";

interface Props {
  onAdd: (def: FixtureTypeDef) => void;
}

const icons: Record<string, React.ReactNode> = {

  // ── 1. Quầy thu ngân ─────────────────────────────────────────────────────
  // Black counter, silver trim, bright red stripe, POS screen, conveyor belt, rope barriers
  checkout: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Stanchion left */}
      <circle cx="5" cy="52" r="3" fill="#999"/>
      <rect x="4" y="32" width="2" height="20" fill="#bbb"/>
      <circle cx="5" cy="32" r="2" fill="#bbb"/>
      {/* Stanchion right */}
      <circle cx="51" cy="52" r="3" fill="#999"/>
      <rect x="50" y="32" width="2" height="20" fill="#bbb"/>
      <circle cx="51" cy="32" r="2" fill="#bbb"/>
      {/* Rope */}
      <path d="M7 34 Q28 30 50 34" stroke="#bbb" strokeWidth="1.2" fill="none" strokeDasharray="3 2"/>
      {/* Main counter body */}
      <rect x="6" y="22" width="44" height="24" rx="2" fill="#1a1a1a" stroke="#444" strokeWidth="1"/>
      {/* Silver top rail */}
      <rect x="6" y="20" width="44" height="5" rx="1" fill="#999" stroke="#ccc" strokeWidth="0.5"/>
      {/* RED stripe — key identifier */}
      <rect x="6" y="31" width="44" height="7" fill="#dc2626"/>
      {/* Silver bottom rail */}
      <rect x="6" y="42" width="44" height="4" rx="1" fill="#666"/>
      {/* Conveyor belt */}
      <rect x="8" y="15" width="28" height="6" rx="1" fill="#2a2a2a" stroke="#555" strokeWidth="0.8"/>
      {[12,17,22,27,32].map(x => (
        <line key={x} x1={x} y1="15" x2={x} y2="21" stroke="#555" strokeWidth="0.7"/>
      ))}
      {/* POS terminal screen */}
      <rect x="38" y="5" width="12" height="14" rx="1.5" fill="#111" stroke="#555" strokeWidth="0.8"/>
      <rect x="39" y="6" width="10" height="9" rx="1" fill="#1d6fb5"/>
      <rect x="40" y="7" width="8" height="2" fill="#5aadee" opacity="0.7"/>
      <rect x="40" y="11" width="5" height="1.5" fill="#5aadee" opacity="0.4"/>
      {/* POS stand */}
      <rect x="42" y="19" width="5" height="2" fill="#333"/>
    </svg>
  ),

  // ── 2. Kệ rau củ quả ─────────────────────────────────────────────────────
  // Wooden tiered stand, 3 levels of produce bins, colorful fruits
  produce_shelf: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Frame legs */}
      <rect x="4"  y="46" width="5" height="10" rx="1" fill="#3d2810"/>
      <rect x="47" y="46" width="5" height="10" rx="1" fill="#3d2810"/>
      {/* Tier 3 — bottom, widest */}
      <rect x="2"  y="38" width="52" height="12" rx="2" fill="#8B5E3C" stroke="#5c3d1a" strokeWidth="1.2"/>
      <rect x="4"  y="39" width="48" height="9"  rx="1" fill="#a0703a"/>
      {/* Tier 2 — middle */}
      <rect x="5"  y="24" width="46" height="14" rx="2" fill="#7a4f28" stroke="#5c3d1a" strokeWidth="1.2"/>
      <rect x="7"  y="25" width="42" height="11" rx="1" fill="#8B5E3C"/>
      {/* Tier 1 — top, narrowest */}
      <rect x="10" y="10" width="36" height="14" rx="2" fill="#6b3f1a" stroke="#5c3d1a" strokeWidth="1.2"/>
      <rect x="12" y="11" width="32" height="11" rx="1" fill="#7a4f28"/>
      {/* Produce top tier */}
      <circle cx="18" cy="16" r="4" fill="#2d9a1a"/>
      <circle cx="28" cy="15" r="5" fill="#4caf28"/>
      <circle cx="38" cy="16" r="4" fill="#84cc16"/>
      {/* Produce middle tier */}
      <circle cx="13" cy="30" r="4"   fill="#ef4444"/>
      <circle cx="22" cy="29" r="4.5" fill="#f97316"/>
      <circle cx="31" cy="30" r="4"   fill="#fbbf24"/>
      <circle cx="40" cy="29" r="4.5" fill="#ef4444"/>
      <circle cx="48" cy="30" r="3.5" fill="#e05c28"/>
      {/* Produce bottom tier */}
      <circle cx="10" cy="43" r="4"   fill="#84cc16"/>
      <circle cx="19" cy="44" r="4.5" fill="#fbbf24"/>
      <circle cx="28" cy="43" r="5"   fill="#ef4444"/>
      <circle cx="37" cy="44" r="4.5" fill="#f97316"/>
      <circle cx="46" cy="43" r="4"   fill="#2d9a1a"/>
    </svg>
  ),

  // ── 3. Quầy sản phẩm tươi ────────────────────────────────────────────────
  // Glass deli/fresh counter — curved glass top, stainless base, meat/fish inside
  fresh_counter: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Base cabinet */}
      <rect x="2" y="34" width="52" height="18" rx="2" fill="#c0c8d0" stroke="#8a9299" strokeWidth="1"/>
      <rect x="4" y="36" width="48" height="3" fill="#d8e0e8"/>
      {/* Bottom vent grille */}
      {[6,12,18,24,30,36,42,48].map(x => (
        <rect key={x} x={x} y="48" width="4" height="2" rx="0.5" fill="#8a9299" opacity="0.5"/>
      ))}
      {/* Glass case body */}
      <rect x="2" y="12" width="52" height="24" rx="2" fill="#daeaf4" stroke="#8a9299" strokeWidth="1"/>
      {/* Curved glass top face */}
      <ellipse cx="28" cy="12" rx="26" ry="5" fill="#c8dff0" stroke="#9ab8cc" strokeWidth="0.8"/>
      {/* Glass reflection */}
      <rect x="5" y="13" width="46" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
      {/* Products inside — raw meat pink */}
      <rect x="5"  y="19" width="10" height="8" rx="1" fill="#f4a0a0"/>
      <rect x="17" y="19" width="10" height="8" rx="1" fill="#f8c0a0"/>
      <rect x="29" y="19" width="10" height="8" rx="1" fill="#c0d8f0"/>
      <rect x="41" y="19" width="10" height="8" rx="1" fill="#f0d0a0"/>
      {/* Price tags */}
      <rect x="7"  y="27" width="6"  height="2" rx="0.5" fill="#fff" opacity="0.8"/>
      <rect x="19" y="27" width="6"  height="2" rx="0.5" fill="#fff" opacity="0.8"/>
      <rect x="31" y="27" width="6"  height="2" rx="0.5" fill="#fff" opacity="0.8"/>
      <rect x="43" y="27" width="6"  height="2" rx="0.5" fill="#fff" opacity="0.8"/>
      {/* Front glass panel */}
      <rect x="2" y="32" width="52" height="4" rx="1" fill="#b0c8dc" stroke="#8a9299" strokeWidth="0.5"/>
    </svg>
  ),

  // ── 4. Tủ mát đồ uống & sữa chua ────────────────────────────────────────
  // Tall 2-door glass fridge, dark frame, colorful drinks visible
  cooler_upright: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Cabinet outer */}
      <rect x="2" y="2" width="52" height="52" rx="2" fill="#111" stroke="#333" strokeWidth="1"/>
      {/* Top header bar */}
      <rect x="2" y="2" width="52" height="7" rx="2" fill="#1e1e1e"/>
      <rect x="4" y="3.5" width="48" height="3" rx="1" fill="#2a2a2a"/>
      {/* LEFT door */}
      <rect x="4"  y="11" width="22" height="37" rx="1" fill="#0a1828" stroke="#1a3a50" strokeWidth="0.8"/>
      <rect x="5"  y="12" width="20" height="35" rx="1" fill="rgba(160,210,240,0.12)"/>
      {/* RIGHT door */}
      <rect x="30" y="11" width="22" height="37" rx="1" fill="#0a1828" stroke="#1a3a50" strokeWidth="0.8"/>
      <rect x="31" y="12" width="20" height="35" rx="1" fill="rgba(160,210,240,0.12)"/>
      {/* Door handles */}
      <rect x="24" y="26" width="3" height="10" rx="1.5" fill="#555"/>
      <rect x="29" y="26" width="3" height="10" rx="1.5" fill="#555"/>
      {/* Center divider */}
      <line x1="28" y1="11" x2="28" y2="48" stroke="#000" strokeWidth="2"/>
      {/* LEFT door products — rows of bottles */}
      {[14,20,26,32,38].map((y, row) => {
        const cols = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#ec4899"];
        return [6,10,14,18,22].map((x, col) => (
          <rect key={`L${row}${col}`} x={x} y={y} width="3" height="5" rx="0.5"
            fill={cols[(row + col) % cols.length]} opacity="0.85"/>
        ));
      })}
      {/* RIGHT door products — dairy/white tones */}
      {[14,20,26,32,38].map((y, row) => {
        const cols = ["#f0f9ff","#fef9ee","#f0fdf4","#fdf4ff","#fff7ed"];
        return [32,36,40,44,48].map((x, col) => (
          <rect key={`R${row}${col}`} x={x} y={y} width="3" height="5" rx="0.5"
            fill={cols[(row + col) % cols.length]} opacity="0.9"/>
        ));
      })}
      {/* Bottom footer */}
      <rect x="2" y="50" width="52" height="4" rx="1" fill="#1a1a1a"/>
    </svg>
  ),

  // ── 5. Kệ sát tường ──────────────────────────────────────────────────────
  // Wide dark wall unit, category labels, 4 product rows
  wall_shelf: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Wall backing */}
      <rect x="1" y="1" width="54" height="54" rx="1" fill="#111" stroke="#222" strokeWidth="1"/>
      {/* Category header strip */}
      <rect x="1" y="1" width="54" height="9" rx="1" fill="#1a1a1a"/>
      <rect x="3"  y="2.5" width="12" height="5" rx="0.5" fill="#333"/>
      <rect x="17" y="2.5" width="10" height="5" rx="0.5" fill="#333"/>
      <rect x="29" y="2.5" width="12" height="5" rx="0.5" fill="#333"/>
      <rect x="43" y="2.5" width="10" height="5" rx="0.5" fill="#333"/>
      {/* Shelf boards */}
      {[10, 22, 34, 46].map(y => (
        <rect key={y} x="1" y={y} width="54" height="3" fill="#2a2a2a"/>
      ))}
      {/* Product rows */}
      {[13, 25, 37, 49].map((y, row) => {
        const pal = [
          ["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#f97316","#06b6d4","#eab308","#ec4899","#84cc16"],
          ["#3b82f6","#22c55e","#ef4444","#f97316","#a855f7","#06b6d4","#eab308","#ec4899","#84cc16","#f59e0b"],
          ["#f59e0b","#a855f7","#3b82f6","#22c55e","#ec4899","#ef4444","#84cc16","#f97316","#06b6d4","#eab308"],
          ["#22c55e","#ef4444","#f97316","#a855f7","#3b82f6","#eab308","#ec4899","#f59e0b","#84cc16","#06b6d4"],
        ];
        return [3,8,13,18,23,28,33,38,43,48].map((x, col) => (
          <rect key={`${row}${col}`} x={x} y={y} width="4" height={row === 3 ? 5 : 10} rx="0.5"
            fill={pal[row][col]}/>
        ));
      })}
    </svg>
  ),

  // ── 6. Kệ 2 mặt + đầu kệ ────────────────────────────────────────────────
  // Dark gondola, green promo header, shelves with products
  gondola_double: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Body */}
      <rect x="2" y="4" width="52" height="48" rx="2" fill="#111" stroke="#2a2a2a" strokeWidth="1"/>
      {/* Green promo header */}
      <rect x="2" y="4" width="52" height="9" rx="2" fill="#14532d"/>
      <rect x="4" y="5.5" width="48" height="5.5" rx="1" fill="#166534"/>
      <text x="28" y="11" textAnchor="middle" fontSize="5.5" fill="#fff" fontWeight="bold" fontFamily="sans-serif">KHUYẾN MÃI</text>
      {/* Shelf 1 */}
      <rect x="4" y="14" width="48" height="10" rx="1" fill="#1a1a1a"/>
      {[5,11,17,23,29,35,41,47].map((x,i) => (
        <rect key={`s1${i}`} x={x} y="15" width="5" height="8" rx="0.5"
          fill={["#ef4444","#f59e0b","#22c55e","#3b82f6","#f97316","#a855f7","#06b6d4","#eab308"][i]}/>
      ))}
      {/* Divider */}
      <rect x="2" y="24" width="52" height="3" fill="#222"/>
      {/* Shelf 2 */}
      <rect x="4" y="28" width="48" height="10" rx="1" fill="#1a1a1a"/>
      {[5,11,17,23,29,35,41,47].map((x,i) => (
        <rect key={`s2${i}`} x={x} y="29" width="5" height="8" rx="0.5"
          fill={["#3b82f6","#22c55e","#ef4444","#f97316","#a855f7","#f59e0b","#eab308","#06b6d4"][i]}/>
      ))}
      {/* Divider */}
      <rect x="2" y="38" width="52" height="3" fill="#222"/>
      {/* Shelf 3 */}
      <rect x="4" y="42" width="48" height="8" rx="1" fill="#1a1a1a"/>
      {[5,11,17,23,29,35,41,47].map((x,i) => (
        <rect key={`s3${i}`} x={x} y="43" width="5" height="6" rx="0.5"
          fill={["#a855f7","#ef4444","#f59e0b","#22c55e","#06b6d4","#3b82f6","#f97316","#eab308"][i]}/>
      ))}
    </svg>
  ),

  // ── 7. Đầu kệ (endcap) ───────────────────────────────────────────────────
  endcap: (
    <svg viewBox="0 0 56 56" fill="none">
      <rect x="8" y="4" width="40" height="48" rx="2" fill="#111" stroke="#2a2a2a" strokeWidth="1"/>
      {/* Green header */}
      <rect x="8" y="4" width="40" height="9" rx="2" fill="#14532d"/>
      <text x="28" y="11" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold" fontFamily="sans-serif">PROMO</text>
      {/* Shelf 1 */}
      <rect x="10" y="14" width="36" height="10" rx="1" fill="#1a1a1a"/>
      {[11,19,27,35,41].map((x,i) => (
        <rect key={`e1${i}`} x={x} y="15" width="6" height="8" rx="0.5"
          fill={["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7"][i]}/>
      ))}
      <rect x="8" y="24" width="40" height="2.5" fill="#222"/>
      {/* Shelf 2 */}
      <rect x="10" y="27" width="36" height="10" rx="1" fill="#1a1a1a"/>
      {[11,19,27,35,41].map((x,i) => (
        <rect key={`e2${i}`} x={x} y="28" width="6" height="8" rx="0.5"
          fill={["#3b82f6","#ef4444","#f97316","#a855f7","#22c55e"][i]}/>
      ))}
      <rect x="8" y="37" width="40" height="2.5" fill="#222"/>
      {/* Shelf 3 */}
      <rect x="10" y="40" width="36" height="10" rx="1" fill="#1a1a1a"/>
      {[11,19,27,35,41].map((x,i) => (
        <rect key={`e3${i}`} x={x} y="41" width="6" height="8" rx="0.5"
          fill={["#f59e0b","#22c55e","#3b82f6","#ef4444","#f97316"][i]}/>
      ))}
      <rect x="8" y="50" width="40" height="2" rx="1" fill="#1a1a1a"/>
    </svg>
  ),

  // ── 8. Ụ khuyến mãi ──────────────────────────────────────────────────────
  // Red island display, products piled on top, "KHUYẾN MÃI" sign on pole
  promo_island: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Sign board */}
      <rect x="10" y="2" width="36" height="10" rx="2" fill="#dc2626"/>
      <rect x="11" y="3" width="34" height="8" rx="1" fill="#ef4444"/>
      <text x="28" y="9.5" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold" fontFamily="sans-serif">KHUYẾN MÃI</text>
      {/* Pole */}
      <rect x="26" y="12" width="4" height="6" fill="#666"/>
      {/* Products on top */}
      <rect x="4" y="18" width="48" height="16" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="0.8"/>
      {[6,13,20,27,34,41,48].map((x,i) => (
        <rect key={`pt${i}`} x={x} y="19" width="5" height="14" rx="1"
          fill={["#fbbf24","#ef4444","#f97316","#22c55e","#fbbf24","#ef4444","#3b82f6"][i]}/>
      ))}
      {/* Island body — red panels */}
      <rect x="4" y="34" width="48" height="18" rx="2" fill="#b91c1c" stroke="#991b1b" strokeWidth="1"/>
      <rect x="6" y="36" width="44" height="14" rx="1" fill="#dc2626"/>
      {/* Panel lines */}
      <line x1="18" y1="34" x2="18" y2="52" stroke="#991b1b" strokeWidth="0.8"/>
      <line x1="38" y1="34" x2="38" y2="52" stroke="#991b1b" strokeWidth="0.8"/>
      {/* Feet */}
      <rect x="6"  y="50" width="6" height="4" rx="1" fill="#7f1d1d"/>
      <rect x="44" y="50" width="6" height="4" rx="1" fill="#7f1d1d"/>
    </svg>
  ),

  // ── 9. Ụ SP phát sinh tại thu ngân ───────────────────────────────────────
  // Narrow display stand, "TIỆN LỢI MUA NGAY" sign on top, product shelves
  checkout_impulse: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Sign at top */}
      <rect x="6" y="2" width="44" height="11" rx="2" fill="#166534"/>
      <rect x="7" y="3" width="42" height="9" rx="1" fill="#16a34a"/>
      <text x="28" y="8"  textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold" fontFamily="sans-serif">TIỆN LỢI</text>
      <text x="28" y="13" textAnchor="middle" fontSize="3.5" fill="#dcfce7" fontFamily="sans-serif">MUA NGAY</text>
      {/* Stand frame */}
      <rect x="6" y="13" width="44" height="40" rx="2" fill="#111" stroke="#2a2a2a" strokeWidth="1"/>
      {/* Shelf 1 */}
      <rect x="8"  y="15" width="40" height="9" rx="1" fill="#1a1a1a"/>
      {[9,15,21,27,33,39,45].map((x,i) => (
        <rect key={`i1${i}`} x={x} y="16" width="5" height="7" rx="0.5"
          fill={["#fbbf24","#ef4444","#22c55e","#3b82f6","#f97316","#a855f7","#fbbf24"][i]}/>
      ))}
      <rect x="6" y="24" width="44" height="2" fill="#222"/>
      {/* Shelf 2 */}
      <rect x="8"  y="27" width="40" height="9" rx="1" fill="#1a1a1a"/>
      {[9,15,21,27,33,39,45].map((x,i) => (
        <rect key={`i2${i}`} x={x} y="28" width="5" height="7" rx="0.5"
          fill={["#ef4444","#22c55e","#3b82f6","#fbbf24","#a855f7","#f97316","#ef4444"][i]}/>
      ))}
      <rect x="6" y="36" width="44" height="2" fill="#222"/>
      {/* Shelf 3 */}
      <rect x="8"  y="39" width="40" height="9" rx="1" fill="#1a1a1a"/>
      {[9,15,21,27,33,39,45].map((x,i) => (
        <rect key={`i3${i}`} x={x} y="40" width="5" height="7" rx="0.5"
          fill={["#22c55e","#3b82f6","#fbbf24","#ef4444","#f97316","#22c55e","#a855f7"][i]}/>
      ))}
      {/* Base */}
      <rect x="6"  y="49" width="44" height="4" rx="1" fill="#1a1a1a" stroke="#333" strokeWidth="0.5"/>
    </svg>
  ),

  // ── Tủ mát thực phẩm ─────────────────────────────────────────────────────
  // Green-accented upright cooler for food/dairy/ready meals
  food_cooler: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Cabinet */}
      <rect x="2" y="2" width="52" height="52" rx="2" fill="#111" stroke="#1a3a22" strokeWidth="1.2"/>
      {/* Green header */}
      <rect x="2" y="2" width="52" height="7" rx="2" fill="#14532d"/>
      <text x="28" y="7.5" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold" fontFamily="sans-serif">THỰC PHẨM</text>
      {/* Single wide glass door */}
      <rect x="4" y="11" width="48" height="37" rx="1" fill="#0d2418" stroke="#166534" strokeWidth="0.8"/>
      <rect x="5" y="12" width="46" height="35" rx="1" fill="rgba(100,200,120,0.1)"/>
      {/* Glass shine */}
      <rect x="5" y="12" width="10" height="35" rx="1" fill="rgba(255,255,255,0.06)"/>
      {/* Food items by category — row 1: dairy (white/yellow) */}
      {[6,12,18,24,30,36,42,48].map((x,i) => (
        <rect key={`r1${i}`} x={x} y="14" width="4" height="6" rx="0.5"
          fill={["#fef9ee","#fef3c7","#f0fdf4","#fff","#fef9ee","#f0fdf4","#fef3c7","#fff"][i]} opacity="0.9"/>
      ))}
      {/* Row 2: green veg */}
      {[6,12,18,24,30,36,42,48].map((x,i) => (
        <rect key={`r2${i}`} x={x} y="22" width="4" height="6" rx="0.5"
          fill={["#4ade80","#22c55e","#86efac","#4ade80","#dcfce7","#22c55e","#86efac","#4ade80"][i]} opacity="0.9"/>
      ))}
      {/* Row 3: mixed ready meals */}
      {[6,12,18,24,30,36,42,48].map((x,i) => (
        <rect key={`r3${i}`} x={x} y="30" width="4" height="6" rx="0.5"
          fill={["#fca5a5","#fcd34d","#86efac","#93c5fd","#fca5a5","#fcd34d","#86efac","#93c5fd"][i]} opacity="0.9"/>
      ))}
      {/* Row 4: bottom */}
      {[6,12,18,24,30,36,42,48].map((x,i) => (
        <rect key={`r4${i}`} x={x} y="38" width="4" height="6" rx="0.5"
          fill={["#f0fdf4","#fef9ee","#fff","#fef3c7","#f0fdf4","#fef9ee","#fff","#fef3c7"][i]} opacity="0.9"/>
      ))}
      {/* Handle */}
      <rect x="26" y="28" width="4" height="10" rx="2" fill="#555"/>
      {/* Footer */}
      <rect x="2" y="50" width="52" height="4" rx="1" fill="#1a1a1a"/>
    </svg>
  ),

  // ── Tủ nước Pepsi ─────────────────────────────────────────────────────────
  // Pepsi-branded blue cooler with red accent, Pepsi logo style
  pepsi_cooler: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Cabinet body — Pepsi navy blue */}
      <rect x="2" y="2" width="52" height="52" rx="2" fill="#003087" stroke="#0050b3" strokeWidth="1.2"/>
      {/* Pepsi red swoosh at bottom */}
      <rect x="2" y="42" width="52" height="12" rx="2" fill="#EE2737"/>
      <rect x="2" y="42" width="52" height="5" fill="#CC1020"/>
      {/* White middle band */}
      <rect x="2" y="36" width="52" height="7" fill="#fff"/>
      {/* PEPSI text on white band */}
      <text x="28" y="42" textAnchor="middle" fontSize="7" fill="#003087" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">PEPSI</text>
      {/* Glass door area */}
      <rect x="4" y="9" width="48" height="26" rx="1" fill="#002070" stroke="#0050b3" strokeWidth="0.8"/>
      <rect x="5" y="10" width="46" height="24" rx="1" fill="rgba(0,80,180,0.15)"/>
      {/* Pepsi bottle columns */}
      {[6,11,16,21,26,31,36,41,46].map((x, i) => (
        <g key={i}>
          {/* Bottle body — blue */}
          <rect x={x} y="12" width="4" height="10" rx="1" fill="#1d6fb5"/>
          {/* Pepsi cap — red */}
          <rect x={x} y="11" width="4" height="2" rx="0.5" fill="#EE2737"/>
          {/* Bottle 2 */}
          <rect x={x} y="25" width="4" height="6" rx="1" fill="#1d6fb5"/>
          <rect x={x} y="24" width="4" height="2" rx="0.5" fill="#EE2737"/>
        </g>
      ))}
      {/* Handle */}
      <rect x="25" y="20" width="6" height="8" rx="3" fill="rgba(255,255,255,0.3)" stroke="#fff" strokeWidth="0.5"/>
      {/* Header */}
      <rect x="2" y="2" width="52" height="8" rx="2" fill="#001f5c"/>
      <circle cx="28" cy="6" r="3" fill="#fff" opacity="0.9"/>
      <circle cx="28" cy="6" r="2" fill="#003087"/>
      <circle cx="28" cy="6" r="1" fill="#EE2737"/>
    </svg>
  ),

  // ── Kệ Bánh Slay ─────────────────────────────────────────────────────────
  // Warm wooden bakery display shelf, tiered, pastry/bread items
  bakery_shelf: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Frame */}
      <rect x="2" y="4" width="52" height="48" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.2"/>
      {/* Warm header */}
      <rect x="2" y="4" width="52" height="8" rx="2" fill="#92400e"/>
      <text x="28" y="10" textAnchor="middle" fontSize="4.5" fill="#fef3c7" fontWeight="bold" fontFamily="sans-serif">BÁNH SLAY</text>
      {/* Shelf 1 */}
      <rect x="4" y="13" width="48" height="12" rx="1" fill="#a16207"/>
      {/* Bread/pastry items row 1 */}
      {[5,13,21,29,37,45].map((x,i) => (
        <g key={i}>
          <ellipse cx={x+4} cy="19" rx="4" ry="3" fill={["#fcd34d","#d97706","#fbbf24","#f59e0b","#fcd34d","#d97706"][i]}/>
          <ellipse cx={x+4} cy="18" rx="3" ry="1.5" fill={["#fef3c7","#fde68a","#fef3c7","#fde68a","#fef3c7","#fde68a"][i]} opacity="0.5"/>
        </g>
      ))}
      {/* Divider */}
      <rect x="2" y="25" width="52" height="3" fill="#451a03"/>
      {/* Shelf 2 */}
      <rect x="4" y="29" width="48" height="12" rx="1" fill="#92400e"/>
      {/* Pastry items row 2 */}
      {[5,14,23,32,41].map((x,i) => (
        <g key={i}>
          <rect x={x} y="31" width="7" height="8" rx="2" fill={["#b45309","#d97706","#fbbf24","#b45309","#d97706"][i]}/>
          <rect x={x+1} y="32" width="5" height="3" rx="1" fill={["#fde68a","#fef3c7","#fef3c7","#fde68a","#fef3c7"][i]} opacity="0.6"/>
        </g>
      ))}
      {/* Divider */}
      <rect x="2" y="41" width="52" height="3" fill="#451a03"/>
      {/* Shelf 3 bottom */}
      <rect x="4" y="45" width="48" height="6" rx="1" fill="#a16207"/>
      {[6,14,22,30,38,46].map((x,i) => (
        <ellipse key={i} cx={x+2} cy="48" rx="3.5" ry="2.5"
          fill={["#fcd34d","#fbbf24","#d97706","#f59e0b","#fcd34d","#fbbf24"][i]}/>
      ))}
      {/* Glass front panel */}
      <rect x="2" y="13" width="4" height="36" fill="rgba(255,255,255,0.08)"/>
    </svg>
  ),

  // ── 10. Cửa vào / Ra ─────────────────────────────────────────────────────
  entry_exit: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Frame */}
      <rect x="2" y="2" width="52" height="52" rx="3" fill="#f0fdf4" stroke="#4ade80" strokeWidth="2"/>
      {/* Left door panel */}
      <rect x="5" y="5" width="20" height="46" rx="2" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.2"/>
      {/* Right door panel */}
      <rect x="31" y="5" width="20" height="46" rx="2" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.2"/>
      {/* Door handles */}
      <rect x="23" y="22" width="4" height="12" rx="2" fill="#16a34a"/>
      <rect x="29" y="22" width="4" height="12" rx="2" fill="#16a34a"/>
      {/* Center gap */}
      <line x1="27.5" y1="5" x2="27.5" y2="51" stroke="#4ade80" strokeWidth="1"/>
      {/* Arrow */}
      <path d="M16 28 L40 28" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
      <path d="M34 22 L40 28 L34 34" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Glass shine */}
      <rect x="7" y="7" width="5" height="20" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="33" y="7" width="5" height="20" rx="1" fill="rgba(255,255,255,0.4)"/>
    </svg>
  ),

  // ── Note / Annotation ────────────────────────────────────────────────────
  annotation: (
    <svg viewBox="0 0 56 56" fill="none">
      {/* Pin body */}
      <circle cx="28" cy="20" r="14" fill="#f59e0b" stroke="#d97706" strokeWidth="2"/>
      {/* Pin inner circle */}
      <circle cx="28" cy="20" r="8" fill="#fef3c7"/>
      {/* Pin needle */}
      <path d="M28 34 L28 54" stroke="#d97706" strokeWidth="3" strokeLinecap="round"/>
      {/* Note lines inside */}
      <line x1="22" y1="16" x2="34" y2="16" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="20" x2="34" y2="20" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="24" x2="30" y2="24" stroke="#92400e" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // ── 11. Vùng cấm / Cột ───────────────────────────────────────────────────
  obstacle: (
    <svg viewBox="0 0 56 56" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="4" fill="#fef2f2" stroke="#ef4444" strokeWidth="2"/>
      {/* Warning stripes */}
      <clipPath id="clip-obs">
        <rect x="3" y="3" width="50" height="50" rx="4"/>
      </clipPath>
      <g clipPath="url(#clip-obs)">
        {[0,10,20,30,40,50].map((offset) => (
          <rect key={offset} x={offset-15} y="-5" width="10" height="80"
            transform="rotate(-40 28 28)" fill="#ef4444" opacity="0.18"/>
        ))}
      </g>
      {/* Bold X */}
      <line x1="13" y1="13" x2="43" y2="43" stroke="#ef4444" strokeWidth="5" strokeLinecap="round"/>
      <line x1="43" y1="13" x2="13" y2="43" stroke="#ef4444" strokeWidth="5" strokeLinecap="round"/>
      {/* Border re-draw on top */}
      <rect x="3" y="3" width="50" height="50" rx="4" fill="none" stroke="#ef4444" strokeWidth="2"/>
    </svg>
  ),
};

const shortLabel: Record<string, string> = {
  checkout:         "Checkout",
  produce_shelf:    "Produce",
  fresh_counter:    "Fresh Counter",
  food_cooler:      "Food Cooler",
  pepsi_cooler:     "Pepsi Cooler",
  cooler_upright:   "Beverage Cooler",
  wall_shelf:       "Wall Shelf",
  gondola_double:   "Gondola",
  endcap:           "End Cap",
  bakery_shelf:     "Bakery",
  promo_island:     "Promo Island",
  checkout_impulse: "Checkout Impulse",
  entry_exit:       "Entry / Exit",
  obstacle:         "Column / Obstacle",
  annotation:       "Note",
};

export default function FixturePanel({ onAdd }: Props) {
  return (
    <div style={{
      width: 130,
      borderRight: "1px solid #e0dbd0",
      background: "#faf9f5",
      overflowY: "auto",
      flexShrink: 0,
      padding: "8px 6px",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}>
      {/* Section: Fixtures */}
      <div style={{ fontSize: 9, color: "#b0a080", textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 6px 2px", fontWeight: 700 }}>
        Fixtures
      </div>

      {FIXTURE_TYPES.filter(d => d.id !== "annotation").map((def) => (
        <button
          key={def.id}
          onClick={() => onAdd(def)}
          title={`${def.labelVi} — ${def.defaultWidth}×${def.defaultDepth}mm`}
          style={{
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: 8,
            padding: "6px 6px 5px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            transition: "background 0.15s, border-color 0.15s",
            textAlign: "left",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f0e8d8";
            e.currentTarget.style.borderColor = "#c8a050";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <div style={{ width: 38, height: 38, flexShrink: 0 }}>{icons[def.id]}</div>
          <span style={{ fontSize: 11, color: "#2a1a08", fontWeight: 600, lineHeight: 1.3 }}>
            {shortLabel[def.id] ?? def.labelVi}
          </span>
        </button>
      ))}

      {/* Section: Annotation */}
      <div style={{ fontSize: 9, color: "#b0a080", textTransform: "uppercase", letterSpacing: "0.12em", padding: "8px 6px 2px", fontWeight: 700, borderTop: "1px solid #e0dbd0", marginTop: 4 }}>
        Annotation
      </div>

      {FIXTURE_TYPES.filter(d => d.id === "annotation").map((def) => (
        <button
          key={def.id}
          onClick={() => onAdd(def)}
          title="Add a note or annotation with text and image"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 8,
            padding: "7px 8px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            transition: "background 0.15s, border-color 0.15s",
            textAlign: "left",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(245,158,11,0.16)";
            e.currentTarget.style.borderColor = "#d97706";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(245,158,11,0.08)";
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)";
          }}
        >
          <div style={{ width: 38, height: 38, flexShrink: 0 }}>{icons[def.id]}</div>
          <div>
            <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, lineHeight: 1.3 }}>Note</div>
            <div style={{ fontSize: 9, color: "#b45309", lineHeight: 1.3 }}>Text + Image</div>
          </div>
        </button>
      ))}

      <p style={{ fontSize: 9, color: "#b0a080", marginTop: 8, textAlign: "center", lineHeight: 1.5, padding: "0 4px" }}>
        Click to add
      </p>
    </div>
  );
}
