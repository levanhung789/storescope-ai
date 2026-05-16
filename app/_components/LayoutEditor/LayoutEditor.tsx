"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import FixturePanel from "./FixturePanel";
import Inspector from "./Inspector";
import MintModal from "./MintModal";
import AnnotationEditor from "./AnnotationEditor";
import { loadCircleSession, type CircleSession } from "../../_lib/circle";
const MapDrawer = dynamic(() => import("./MapDrawer"), { ssr: false });
import { FixtureInstance, CanvasConfig, LayoutDocument, FixtureTypeDef, WallLine, ToolMode } from "./types";
import type { LayoutCanvasRef } from "./LayoutCanvas3D";

const LayoutCanvas = dynamic(() => import("./LayoutCanvas3D"), { ssr: false });

const INITIAL_CANVAS: CanvasConfig = { width: 20000, height: 15000, gridStep: 100 };

const EMPTY_DOC: LayoutDocument = {
  version: "1.0.0",
  store: { storeId: "store_001", name: "New Store", formatCode: "mini_mart", unit: "mm" },
  canvas: INITIAL_CANVAS,
  fixtures: [],
  walls: [],
};

let uidCounter = Date.now();
function uid() { return `fx_${++uidCounter}`; }

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function calcArea(canvas: CanvasConfig) {
  return Math.round((canvas.width / 1000) * (canvas.height / 1000));
}

interface LayoutEditorProps { embedded?: boolean; }

export default function LayoutEditor({ embedded = false }: LayoutEditorProps) {
  const [doc, setDoc] = useState<LayoutDocument>(EMPTY_DOC);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolMode>("select");
  const [storeName, setStoreName] = useState("New Store");
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<FixtureInstance[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const canvasRef = useRef<LayoutCanvasRef>(null);
  const [showMint, setShowMint] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<FixtureInstance | null>(null);
  const [showSizeEditor, setShowSizeEditor]   = useState(false);
  const [sizeInput, setSizeInput]             = useState({ w: String(INITIAL_CANVAS.width / 1000), h: String(INITIAL_CANVAS.height / 1000) });
  const [showAddressInput, setShowAddress]    = useState(false);
  const [addressValue, setAddressValue]       = useState("");
  const [areaValue, setAreaValue]             = useState("");
  const [dimW, setDimW]                       = useState("");
  const [dimD, setDimD]                       = useState("");
  const [dimMode, setDimMode]                 = useState<"area" | "manual" | "map">("map");
  const [addressLoading, setAddressLoading]   = useState(false);
  const [addressNote, setAddressNote]         = useState("");
  const [suggestions, setSuggestions]         = useState<{ display_name: string; place_id: number; lat: string; lon: string }[]>([]);
  const [sugLoading, setSugLoading]           = useState(false);
  const [mapCoords, setMapCoords]             = useState<{ lat: number; lon: number } | null>(null);
  const [selectedCoords, setSelectedCoords]   = useState<{ lat: number; lon: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [circleSession, setCircleSession] = useState<CircleSession | null>(null);
  const [circleBalance, setCircleBalance] = useState<string>("--");

  const onAddressChange = (val: string) => {
    setAddressValue(val);
    setSelectedCoords(null); // reset khi gõ lai
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setSugLoading(true);
      try {
        const res  = await fetch(`/api/geocode?q=${encodeURIComponent(val)}&limit=6`);
        const data = await res.json() as { display_name: string; place_id: number; lat: string; lon: string }[];
        setSuggestions(data);
      } catch { /* silent */ } finally { setSugLoading(false); }
    }, 400);
  };

  const fetchBuilding = async () => {
    if (!addressValue.trim()) return;
    setAddressLoading(true);
    setAddressNote("");
    try {
      // ── Map mode: geocode → mo MapDrawer ─────────────────────────────────
      if (dimMode === "map") {
        // Neu da chon suggestion → dung coords luon
        if (selectedCoords) {
          setMapCoords(selectedCoords);
          return;
        }
        // Chua chon → geocode qua Nominatim
        setAddressNote("Finding address...");
        const res  = await fetch(`/api/geocode?q=${encodeURIComponent(addressValue)}&limit=1`);
        const data = await res.json() as { lat?: number; lon?: number; error?: string };
        if (data.lat && data.lon) {
          setMapCoords({ lat: data.lat, lon: data.lon });
        } else {
          // Fallback: mo ban do tai trung tam HCM
          setAddressNote("Address not found in map data — map opened at city center. Use search box inside map.");
          setMapCoords({ lat: 10.8231, lon: 106.6297 });
        }
        return;
      }

      // ── Manual modes ───────────────────────────────────────────────────
      let w = 0, h = 0;
      if (dimMode === "manual" && dimW && dimD) {
        w = Number(dimW); h = Number(dimD);
      } else if (dimMode === "area" && areaValue) {
        const side = Math.sqrt(Number(areaValue));
        w = Math.round(side); h = Math.round(side);
      }
      if (!w || !h || w < 3 || h < 3) { setAddressNote("Please enter valid dimensions (min 3m)"); return; }
      w = Math.max(3, Math.min(500, w));
      h = Math.max(3, Math.min(500, h));
      setDoc(d => ({ ...d, canvas: { ...d.canvas, width: w * 1000, height: h * 1000 } }));
      const name = addressValue.split(",")[0].trim();
      if (name) setStoreName(name);
      setAddressNote(`Applied: ${w}×${h}m`);
      setShowAddress(false);
    } catch { setAddressNote("Error"); }
    finally  { setAddressLoading(false); }
  };

  const applyFromMap = (width: number, depth: number, _area: number) => {
    const w = Math.max(3, Math.min(500, width));
    const h = Math.max(3, Math.min(500, depth));
    setDoc(d => ({ ...d, canvas: { ...d.canvas, width: w * 1000, height: h * 1000 } }));
    const name = addressValue.split(",")[0].trim();
    if (name) setStoreName(name);
    setMapCoords(null);
    setShowAddress(false);
    setAddressNote(`Applied: ${w}×${h}m`);
  };

  useEffect(() => {
    const cs = loadCircleSession();
    setCircleSession(cs);
    if (cs?.walletId) {
      fetch(`/api/circle/balance?walletId=${cs.walletId}&address=${cs.walletAddress}`)
        .then(r => r.json()).then(d => setCircleBalance(d.usdc ?? "--")).catch(() => {});
    }
  }, []);

  // Load draft
  useEffect(() => {
    const raw = localStorage.getItem("store_layout_draft");
    if (raw) {
      try {
        const loaded = JSON.parse(raw) as LayoutDocument;
        if (!loaded.walls) loaded.walls = [];
        setDoc(loaded);
        setStoreName(loaded.store.name);
        setHistory([loaded.fixtures]);
      } catch { /* ignore */ }
    }
  }, []);

  // Auto-save
  useEffect(() => {
    localStorage.setItem("store_layout_draft", JSON.stringify(doc));
  }, [doc]);

  const fixtures = doc.fixtures;
  const walls = doc.walls ?? [];

  const pushHistory = useCallback((fxs: FixtureInstance[]) => {
    setHistory((h) => {
      const trimmed = h.slice(0, historyIdx + 1);
      return [...trimmed, fxs].slice(-30);
    });
    setHistoryIdx((i) => Math.min(i + 1, 29));
  }, [historyIdx]);

  const setFixtures = useCallback((fxs: FixtureInstance[], addHistory = true) => {
    setDoc((d) => ({ ...d, fixtures: fxs }));
    if (addHistory) pushHistory(fxs);
  }, [pushHistory]);

  const setWalls = useCallback((ws: WallLine[]) => {
    setDoc((d) => ({ ...d, walls: ws }));
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setDoc((d) => ({ ...d, fixtures: prev }));
    setHistoryIdx((i) => i - 1);
    setSelectedId(null);
  }, [history, historyIdx]);

  const handleRedo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const next = history[historyIdx + 1];
    setDoc((d) => ({ ...d, fixtures: next }));
    setHistoryIdx((i) => i + 1);
    setSelectedId(null);
  }, [history, historyIdx]);

  const handleAddFixture = useCallback((def: FixtureTypeDef) => {
    // Stagger spawn position so new fixtures don't pile on top of each other
    const stagger = fixtures.length * 400;
    const baseX = Math.round(doc.canvas.width / 2 / 100) * 100 - def.defaultWidth / 2;
    const baseY = Math.round(doc.canvas.height / 2 / 100) * 100 - def.defaultDepth / 2;
    const spawnX = Math.min(baseX + stagger, doc.canvas.width - def.defaultWidth - 200);
    const spawnY = Math.min(baseY + (fixtures.length % 3) * 300, doc.canvas.height - def.defaultDepth - 200);
    const newFx: FixtureInstance = {
      id: uid(),
      name: def.labelVi,
      geometry: {
        x: Math.max(0, spawnX),
        y: Math.max(0, spawnY),
        width: def.defaultWidth,
        depth: def.defaultDepth,
        height: def.defaultHeight,
        rotationDeg: 0,
      },
      business: {
        fixtureType: def.id,
        temperatureZone: def.temperatureZone,
        shelfCount: def.defaultShelfCount,
        promo: false,
        categoryZone: "",
        priorityScore: 50,
        sellable: def.sellable,
      },
    };
    setFixtures([...fixtures, newFx]);
    setSelectedId(newFx.id);
    setTool("select");
  }, [doc.canvas, fixtures, setFixtures]);

  const handleMove = useCallback((id: string, x: number, y: number) => {
    const updated = fixtures.map((f) => f.id === id ? { ...f, geometry: { ...f.geometry, x, y } } : f);
    setFixtures(updated);
  }, [fixtures, setFixtures]);

  const handleUpdate = useCallback((updated: FixtureInstance) => {
    setFixtures(fixtures.map((f) => f.id === updated.id ? updated : f));
  }, [fixtures, setFixtures]);

  const handleDelete = useCallback((id: string) => {
    setFixtures(fixtures.filter((f) => f.id !== id));
    setSelectedId(null);
  }, [fixtures, setFixtures]);

  const handleDuplicate = useCallback((id: string) => {
    const src = fixtures.find((f) => f.id === id);
    if (!src) return;
    const copy: FixtureInstance = {
      ...src,
      id: uid(),
      geometry: { ...src.geometry, x: src.geometry.x + 300, y: src.geometry.y + 300 },
    };
    setFixtures([...fixtures, copy]);
    setSelectedId(copy.id);
  }, [fixtures, setFixtures]);

  const handleRotate = useCallback((id: string) => {
    setFixtures(fixtures.map((f) => f.id === id ? { ...f, geometry: { ...f.geometry, rotationDeg: (f.geometry.rotationDeg + 90) % 360 } } : f));
  }, [fixtures, setFixtures]);

  const handleRotateExact = useCallback((id: string, deg: number) => {
    setFixtures(fixtures.map((f) => f.id === id ? { ...f, geometry: { ...f.geometry, rotationDeg: deg } } : f), false);
  }, [fixtures, setFixtures]);

  const handleResize = useCallback((id: string, width: number, depth: number, x: number, y: number) => {
    setFixtures(fixtures.map((f) => f.id === id ? { ...f, geometry: { ...f.geometry, width, depth, x, y } } : f));
  }, [fixtures, setFixtures]);

  const handleAddWall = useCallback((wall: WallLine) => {
    setWalls([...walls, wall]);
  }, [walls, setWalls]);

  const handleUpdateWall = useCallback((id: string, changes: Partial<WallLine>) => {
    setWalls(walls.map((w) => w.id === id ? { ...w, ...changes } : w));
  }, [walls, setWalls]);

  const handleDeleteWall = useCallback((id: string) => {
    setWalls(walls.filter((w) => w.id !== id));
    setSelectedWallId(null);
  }, [walls, setWalls]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") {
        setSelectedId(null);
        setSelectedWallId(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) handleDelete(selectedId);
        else if (selectedWallId) handleDeleteWall(selectedWallId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (selectedId) handleDuplicate(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tool, selectedId, selectedWallId, handleDelete, handleDeleteWall, handleDuplicate, handleUndo, handleRedo]);

  const handleExport = () => downloadJSON({ ...doc, store: { ...doc.store, name: storeName } }, `layout_${storeName.replace(/\s+/g, "_")}.json`);

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const loaded = JSON.parse(ev.target?.result as string) as LayoutDocument;
          if (!loaded.walls) loaded.walls = [];
          setDoc(loaded); setStoreName(loaded.store.name); setSelectedId(null); setSelectedWallId(null);
        } catch { alert("File JSON không hợp lệ."); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    if (!confirm("Xóa toàn bộ layout?")) return;
    setFixtures([]); setWalls([]); setSelectedId(null); setSelectedWallId(null);
  };

  const selectedFixture = fixtures.find((f) => f.id === selectedId) ?? null;
  const area = calcArea(doc.canvas);
  const zoomPct = Math.round(zoom * 100);

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 11px", borderRadius: 6, border: "1px solid #d8d0c0",
    background: "#fff", color: "#2a2010", fontSize: 12, cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s", fontWeight: 500,
  };

  const toolBtnStyle = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    background: active ? "#2a2010" : "#fff",
    color: active ? "#fff" : "#2a2010",
    borderColor: active ? "#2a2010" : "#d8d0c0",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: embedded ? "100%" : "100vh", background: "#faf9f5", color: "#2a2010", fontFamily: "inherit" }}>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 48, borderBottom: "1px solid #e0dbd0", flexShrink: 0, background: "#ffffff" }}>
        {!embedded && (
          <>
            <a href="/" style={{ fontSize: 14, fontWeight: 700, color: "#2a2010", textDecoration: "none", letterSpacing: "-0.03em", marginRight: 6 }}>
              storescope<span style={{ color: "#c0a060" }}>.ai</span>
            </a>
            <div style={{ width: 1, height: 20, background: "#e0dbd0" }} />
          </>
        )}

        {/* Store name */}
        <input
          value={storeName}
          onChange={(e) => { setStoreName(e.target.value); setDoc((d) => ({ ...d, store: { ...d.store, name: e.target.value } })); }}
          style={{ background: "transparent", border: "none", outline: "none", color: "#2a2010", fontSize: 13, fontWeight: 600, width: 180 }}
          placeholder="Store name..."
        />

        <div style={{ width: 1, height: 20, background: "#e0dbd0" }} />

        {/* Address → Auto dimensions */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowAddress(v => !v)}
            style={{ ...btnBase, gap: 4, color: showAddressInput ? "#7c3aed" : undefined, borderColor: showAddressInput ? "#c8a0f8" : undefined }}
            title="Import building dimensions from address"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            From Address
          </button>
          {showAddressInput && (
            <div style={{ position: "absolute", top: 40, left: 0, zIndex: 300, background: "#fff", border: "1px solid #d8d0c0", borderRadius: 12, padding: "16px 18px", boxShadow: "0 6px 24px rgba(0,0,0,0.14)", minWidth: mapCoords ? 500 : 320 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "#2a2010" }}>
                {mapCoords ? `Drawing on map — ${addressValue.split(",")[0]}` : "Import from Address"}
              </div>

              {/* MapDrawer — shown after geocode in map mode */}
              {mapCoords ? (
                <MapDrawer
                  lat={selectedCoords?.lat}
                  lon={selectedCoords?.lon}
                  address={addressValue}
                  onApply={applyFromMap}
                  onCancel={() => setMapCoords(null)}
                />
              ) : (<>

              <label style={{ display: "block", fontSize: 11, color: "#6a5a3a", marginBottom: 5 }}>Street address</label>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <input
                  value={addressValue}
                  onChange={e => onAddressChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { setSuggestions([]); fetchBuilding(); } if (e.key === "Escape") setSuggestions([]); }}
                  onBlur={() => setTimeout(() => setSuggestions([]), 180)}
                  placeholder="e.g. 30/3 Phan Văn Trị, Bình Thạnh"
                  autoComplete="off"
                  style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", border: "1px solid #d8d0c0", borderRadius: 7, fontSize: 12, outline: "none", color: "#2a2010" }}
                />
                {sugLoading && (
                  <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: "50%", border: "2px solid #c8a050", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} />
                )}
                {suggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 400, background: "#fff", border: "1px solid #d8d0c0", borderRadius: "0 0 8px 8px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 220, overflowY: "auto" }}>
                    {suggestions.map((s, i) => (
                      <button
                        key={s.place_id}
                        onMouseDown={() => {
                          setAddressValue(s.display_name);
                          setSelectedCoords({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
                          setSuggestions([]);
                          setAddressNote("");
                        }}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "8px 12px", border: "none", cursor: "pointer", fontSize: 12,
                          background: i % 2 === 0 ? "#faf9f5" : "#fff",
                          color: "#2a2010", borderBottom: i < suggestions.length - 1 ? "1px solid #f0ebe0" : "none",
                          lineHeight: 1.5,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0e8d0")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#faf9f5" : "#fff")}
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dimension mode selector */}
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                {([["map", "Draw on Map"], ["area", "Area (m²)"], ["manual", "W×D"]] as const).map(([m, label]) => (
                  <button key={m} onClick={() => setDimMode(m)}
                    style={{ flex: 1, padding: "5px 4px", border: `1px solid ${dimMode === m ? "#7c3aed" : "#d8d0c0"}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: dimMode === m ? "#7c3aed" : "transparent", color: dimMode === m ? "#fff" : "#6a5a3a" }}>
                    {label}
                  </button>
                ))}
              </div>

              {dimMode === "map" && (
                <div style={{ fontSize: 11, color: "#6a5a3a", padding: "8px 10px", background: "#f5f0e8", borderRadius: 7, marginBottom: 10, lineHeight: 1.6 }}>
                  Click <strong>Import Dimensions</strong> to open a map at this address.
                  Then <strong>click the corners</strong> of your store to draw the polygon — area and dimensions are calculated automatically.
                </div>
              )}

              {dimMode === "area" && (
                <>
                  <label style={{ display: "block", fontSize: 11, color: "#6a5a3a", marginBottom: 5 }}>Area (m²) — will create a square layout</label>
                  <input
                    value={areaValue}
                    onChange={e => setAreaValue(e.target.value)}
                    type="number" min="9" max="50000" placeholder="e.g. 80 → 9×9m square"
                    style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", border: "1px solid #d8d0c0", borderRadius: 7, fontSize: 12, outline: "none", marginBottom: 10, color: "#2a2010" }}
                  />
                  {areaValue && Number(areaValue) > 0 && (
                    <div style={{ fontSize: 11, color: "#8a7a5a", marginBottom: 8, padding: "5px 8px", background: "#faf5e8", borderRadius: 5 }}>
                      → Canvas: {Math.round(Math.sqrt(Number(areaValue)))}×{Math.round(Math.sqrt(Number(areaValue)))}m
                    </div>
                  )}
                </>
              )}

              {dimMode === "manual" && (
                <>
                  <label style={{ display: "block", fontSize: 11, color: "#6a5a3a", marginBottom: 5 }}>Enter exact dimensions (measure on Google Maps)</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: "#8a7a5a", display: "block", marginBottom: 3 }}>Width (m)</label>
                      <input value={dimW} onChange={e => setDimW(e.target.value)} type="number" min="3" max="200" placeholder="e.g. 10"
                        style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", border: "1px solid #d8d0c0", borderRadius: 7, fontSize: 12, outline: "none", color: "#2a2010" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8, color: "#8a7a5a", fontSize: 14, fontWeight: 700 }}>×</div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: "#8a7a5a", display: "block", marginBottom: 3 }}>Depth (m)</label>
                      <input value={dimD} onChange={e => setDimD(e.target.value)} type="number" min="3" max="200" placeholder="e.g. 8"
                        style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", border: "1px solid #d8d0c0", borderRadius: 7, fontSize: 12, outline: "none", color: "#2a2010" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#8a7a5a", marginBottom: 8 }}>
                    Tip: Use Google Maps measurement tool for accuracy
                  </div>
                </>
              )}

              {addressNote && (
                <div style={{ fontSize: 11, color: addressNote.includes("not found") || addressNote.includes("error") ? "#c04020" : "#3a8a3a", marginBottom: 10, padding: "6px 10px", background: addressNote.includes("not found") || addressNote.includes("error") ? "#fff5f5" : "#f0fff4", borderRadius: 6 }}>
                  {addressNote}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={fetchBuilding}
                  disabled={!addressValue.trim() || addressLoading}
                  style={{ ...btnBase, flex: 2, justifyContent: "center", background: "#c8a050", borderColor: "#c8a050", color: "#fff", opacity: addressLoading ? 0.7 : 1 }}
                >
                  {addressLoading ? "Searching..." : "Import Dimensions"}
                </button>
                <button onClick={() => { setShowAddress(false); setAddressNote(""); }} style={{ ...btnBase, flex: 1, justifyContent: "center" }}>Cancel</button>
              </div>
              </>)}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: "#e0dbd0" }} />

        {/* Store size editor */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setSizeInput({ w: String(doc.canvas.width / 1000), h: String(doc.canvas.height / 1000) }); setShowSizeEditor((v) => !v); }}
            style={{ ...btnBase, gap: 4 }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1" width="14" height="14" rx="1.5"/><path d="M4 4h3M4 8h8M4 12h5"/></svg>
            {Math.round(doc.canvas.width/1000)}×{Math.round(doc.canvas.height/1000)} m
          </button>
          {showSizeEditor && (
            <div style={{ position: "absolute", top: 36, left: 0, zIndex: 200, background: "#fff", border: "1px solid #d8d0c0", borderRadius: 10, padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: "#2a2010" }}>Store Size</div>
              {([["Width (m)", "w"], ["Depth (m)", "h"]] as const).map(([label, key]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, color: "#6a5a3a" }}>
                  <span style={{ width: 110 }}>{label}</span>
                  <input
                    type="number" min={3} max={200} step={0.5}
                    value={sizeInput[key]}
                    onChange={(e) => setSizeInput((s) => ({ ...s, [key]: e.target.value }))}
                    style={{ width: 68, padding: "3px 6px", border: "1px solid #d8d0c0", borderRadius: 5, fontSize: 12, color: "#2a2010", outline: "none" }}
                  />
                </label>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  onClick={() => {
                    const w = Math.round(Math.max(3, Math.min(200, Number(sizeInput.w))) * 1000);
                    const h = Math.round(Math.max(3, Math.min(200, Number(sizeInput.h))) * 1000);
                    setDoc((d) => ({ ...d, canvas: { ...d.canvas, width: w, height: h } }));
                    setShowSizeEditor(false);
                  }}
                  style={{ ...btnBase, background: "#c8a050", borderColor: "#c8a050", color: "#fff", flex: 1, justifyContent: "center" }}
                >Apply</button>
                <button onClick={() => setShowSizeEditor(false)} style={{ ...btnBase, flex: 1, justifyContent: "center" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Undo/Redo */}
        {([
          ["↩ Undo", handleUndo, historyIdx <= 0],
          ["↪ Redo", handleRedo, historyIdx >= history.length - 1],
        ] as const).map(([label, fn, disabled]) => (
          <button key={label as string} onClick={fn as () => void} disabled={disabled as boolean}
            style={{ ...btnBase, opacity: (disabled as boolean) ? 0.4 : 1, cursor: (disabled as boolean) ? "not-allowed" : "pointer" }}>
            {label}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: "#e0dbd0" }} />

        <button onClick={handleImport} style={btnBase}>Import</button>
        <button onClick={handleExport} style={{ ...btnBase, background: "#c8a050", borderColor: "#c8a050", color: "#fff" }}>Export JSON</button>

        <div style={{ width: 1, height: 20, background: "#e0dbd0" }} />

        {/* Circle Wallet badge */}
        {circleSession ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 9, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Circle Wallet</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#312e81" }}>
                {circleSession.walletAddress.slice(0, 8)}…{circleSession.walletAddress.slice(-4)}
                <span style={{ marginLeft: 6, color: "#6366f1" }}>{circleBalance} USDC</span>
              </div>
            </div>
          </div>
        ) : (
          <a href="/login" style={{ ...btnBase, fontSize: 11, color: "#818cf8", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)", textDecoration: "none" }}>
            Connect Circle Wallet
          </a>
        )}

        <button
          onClick={() => setShowMint(true)}
          disabled={fixtures.length === 0}
          style={{ ...btnBase, background: fixtures.length > 0 ? "#7c3aed" : "#2a2a2a", borderColor: fixtures.length > 0 ? "#7c3aed" : "#2a2a2a", color: fixtures.length > 0 ? "#fff" : "#555" }}
          title="Mint layout on ARC Network to sell on Forum"
        >
          Mint &amp; Sell
        </button>
        <button onClick={handleClear} style={{ ...btnBase, color: "#c04020", borderColor: "#f0c0b0" }}>Clear</button>
      </div>

      {showMint && (
        <MintModal
          doc={{ ...doc, store: { ...doc.store, name: storeName } }}
          onClose={() => setShowMint(false)}
        />
      )}

      {/* ── Main ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <FixturePanel onAdd={handleAddFixture} />
        <LayoutCanvas
          ref={canvasRef}
          fixtures={fixtures}
          walls={walls}
          tool={tool}
          selectedId={selectedId}
          selectedWallId={selectedWallId}
          canvasConfig={doc.canvas}
          onSelect={(id) => {
            setSelectedId(id);
            if (id) {
              const fx = fixtures.find(f => f.id === id);
              if (fx?.business.fixtureType === "annotation") setEditingAnnotation(fx);
            }
          }}
          onSelectWall={setSelectedWallId}
          onMove={handleMove}
          onResize={handleResize}
          onRotateExact={handleRotateExact}
          onAddWall={handleAddWall}
          onUpdateWall={handleUpdateWall}
          onDeleteWall={handleDeleteWall}
          onStageClick={() => { setSelectedId(null); setSelectedWallId(null); setEditingAnnotation(null); }}
          onZoomChange={setZoom}
        />
        {editingAnnotation && (
          <AnnotationEditor
            fixture={editingAnnotation}
            onChange={(updated) => { handleUpdate(updated); setEditingAnnotation(null); }}
            onClose={() => setEditingAnnotation(null)}
          />
        )}
        <Inspector fixture={selectedFixture} onChange={handleUpdate} onDelete={handleDelete} onDuplicate={handleDuplicate} onRotate={handleRotate} />
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ height: 32, borderTop: "1px solid #e0dbd0", display: "flex", alignItems: "center", padding: "0 14px", gap: 20, flexShrink: 0, background: "#ffffff", fontSize: 11, color: "#8a7050" }}>
        <span style={{ fontWeight: 600, color: "#5a4a2a" }}>Floor 1</span>
        <span>Total area: {area} m²</span>
        <span>{fixtures.length} fixtures · {walls.length} walls</span>
        {selectedFixture && <span style={{ color: "#c8a050", fontWeight: 600 }}>{selectedFixture.name} — {selectedFixture.geometry.width}×{selectedFixture.geometry.depth}mm · {selectedFixture.geometry.rotationDeg}°</span>}
        {selectedWallId && !selectedFixture && <span style={{ color: "#c8a050", fontWeight: 600 }}>Wall selected — Del to remove</span>}

        <div style={{ flex: 1 }} />

        {/* Zoom controls */}
        <button onClick={() => canvasRef.current?.setZoom(zoom - 0.1)} style={{ ...btnBase, padding: "2px 8px", fontSize: 14 }}>−</button>
        <input type="range" min={20} max={300} value={zoomPct}
          onChange={(e) => canvasRef.current?.setZoom(Number(e.target.value) / 100)}
          style={{ width: 80, accentColor: "#c8a050" }} />
        <button onClick={() => canvasRef.current?.setZoom(zoom + 0.1)} style={{ ...btnBase, padding: "2px 8px", fontSize: 14 }}>+</button>
        <span style={{ minWidth: 38, textAlign: "right", fontWeight: 600, color: "#5a4a2a" }}>{zoomPct}%</span>
        <button onClick={() => canvasRef.current?.fitToScreen()} style={{ ...btnBase, padding: "3px 8px", fontSize: 11 }} title="Fit to screen">⛶</button>
        <span style={{ color: "#c0b090" }}>Scroll on fixture = rotate 15° · Shift = 5° · Alt = 1° · Ctrl+D duplicate · Del delete · Ctrl+Z undo</span>
      </div>


    </div>
  );
}
