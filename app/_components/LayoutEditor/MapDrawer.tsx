"use client";

import { useEffect, useRef, useState } from "react";

interface MapDrawerProps {
  lat:      number;
  lon:      number;
  address:  string;
  onApply:  (width: number, depth: number, area: number) => void;
  onCancel: () => void;
}

// ── Shoelace formula for polygon area (m²) ─────────────────────────────────
function polygonArea(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = points[i][0] * Math.PI / 180;
    const lat2 = points[j][0] * Math.PI / 180;
    const dLon  = (points[j][1] - points[i][1]) * Math.PI / 180;
    area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2);
}

// ── Bounding box → W×D (meters) ───────────────────────────────────────────
function bboxWD(points: [number, number][]): { w: number; d: number } {
  const lats = points.map(p => p[0]);
  const lons = points.map(p => p[1]);
  const R    = 6371000;
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const w = Math.abs((Math.max(...lons) - Math.min(...lons)) * Math.PI / 180 * R * Math.cos(midLat * Math.PI / 180));
  const d = Math.abs((Math.max(...lats) - Math.min(...lats)) * Math.PI / 180 * R);
  return { w: Math.round(w), d: Math.round(d) };
}

export default function MapDrawer({ lat, lon, address, onApply, onCancel }: MapDrawerProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletRef  = useRef<unknown>(null);
  const polyRef     = useRef<unknown>(null);
  const markersRef  = useRef<unknown[]>([]);
  const pointsRef   = useRef<[number, number][]>([]);

  const [points, setPoints]   = useState<[number, number][]>([]);
  const [area, setArea]       = useState(0);
  const [wh, setWH]           = useState({ w: 0, d: 0 });
  const [closed, setClosed]   = useState(false);
  const [hint, setHint]       = useState("Click on the map to mark corners of your store");

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamic import leaflet (SSR safe)
    import("leaflet").then(L => {
      if (leafletRef.current) return;

      // Fix leaflet marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([lat, lon], 18);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 21,
      }).addTo(map);

      // Center marker
      L.marker([lat, lon]).addTo(map).bindTooltip(address.split(",")[0], { permanent: false });

      leafletRef.current = map;

      // Click handler to add polygon points
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];

        // If clicking near first point → close polygon
        if (pointsRef.current.length >= 3) {
          const fp = pointsRef.current[0];
          const dist = Math.sqrt((fp[0] - newPt[0]) ** 2 + (fp[1] - newPt[1]) ** 2);
          if (dist < 0.00015) {
            closePoly(L, map);
            return;
          }
        }

        pointsRef.current = [...pointsRef.current, newPt];
        setPoints([...pointsRef.current]);

        // Add circle marker
        const m = L.circleMarker(newPt, {
          radius: 6, fillColor: "#7c3aed", color: "#fff",
          weight: 2, fillOpacity: 1,
        }).addTo(map);
        markersRef.current.push(m);

        // Update polygon preview
        if (polyRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any).removeLayer(polyRef.current);
        }
        if (pointsRef.current.length >= 2) {
          polyRef.current = L.polygon(pointsRef.current, {
            color: "#7c3aed", fillColor: "#7c3aed",
            fillOpacity: 0.15, weight: 2, dashArray: "6 4",
          }).addTo(map);
        }

        // Update area preview
        if (pointsRef.current.length >= 3) {
          const a  = polygonArea(pointsRef.current);
          const wh = bboxWD(pointsRef.current);
          setArea(Math.round(a));
          setWH({ w: Math.round(wh.w), d: Math.round(wh.d) });
          setHint(`${pointsRef.current.length} points · Area ≈ ${Math.round(a).toLocaleString()}m² · Click near first point to close`);
        } else {
          setHint(`${pointsRef.current.length} point${pointsRef.current.length > 1 ? "s" : ""} · Need at least 3 to calculate area`);
        }
      });
    });

    return () => {
      if (leafletRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (leafletRef.current as any).remove();
        leafletRef.current = null;
        polyRef.current    = null;
        markersRef.current = [];
        pointsRef.current  = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closePoly = (L: unknown, map: unknown) => {
    if (pointsRef.current.length < 3) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Lx = L as any; const mx = map as any;

    if (polyRef.current) mx.removeLayer(polyRef.current);
    polyRef.current = Lx.polygon(pointsRef.current, {
      color: "#4ade80", fillColor: "#4ade80",
      fillOpacity: 0.2, weight: 2,
    }).addTo(mx);

    const a  = polygonArea(pointsRef.current);
    const wh = bboxWD(pointsRef.current);
    setArea(Math.round(a));
    setWH({ w: Math.round(wh.w), d: Math.round(wh.d) });
    setClosed(true);
    setHint(`Polygon closed · ${pointsRef.current.length} points`);
    mx.off("click");
  };

  const handleReset = () => {
    if (!leafletRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mx = leafletRef.current as any;
    markersRef.current.forEach(m => mx.removeLayer(m));
    if (polyRef.current) mx.removeLayer(polyRef.current);
    markersRef.current = [];
    pointsRef.current  = [];
    polyRef.current    = null;
    setPoints([]);
    setArea(0);
    setWH({ w: 0, d: 0 });
    setClosed(false);
    setHint("Click on the map to mark corners of your store");

    mx.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];
      pointsRef.current = [...pointsRef.current, newPt];
      setPoints([...pointsRef.current]);
      import("leaflet").then(L => {
        const m = L.circleMarker(newPt, { radius: 6, fillColor: "#7c3aed", color: "#fff", weight: 2, fillOpacity: 1 }).addTo(mx);
        markersRef.current.push(m);
        if (pointsRef.current.length >= 2) {
          if (polyRef.current) mx.removeLayer(polyRef.current);
          polyRef.current = L.polygon(pointsRef.current, { color: "#7c3aed", fillColor: "#7c3aed", fillOpacity: 0.15, weight: 2, dashArray: "6 4" }).addTo(mx);
        }
        if (pointsRef.current.length >= 3) {
          const a = polygonArea(pointsRef.current);
          const wh = bboxWD(pointsRef.current);
          setArea(Math.round(a)); setWH({ w: Math.round(wh.w), d: Math.round(wh.d) });
        }
      });
    });
  };

  const sqrtArea = area > 0 ? Math.round(Math.sqrt(area)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Map */}
      <div ref={mapRef} style={{ width: "100%", height: 340, borderRadius: "12px 12px 0 0", overflow: "hidden", border: "1px solid #d8d0c0" }} />

      {/* Hint bar */}
      <div style={{ padding: "8px 12px", background: "#faf5e8", border: "1px solid #d8d0c0", borderTop: "none", fontSize: 11, color: "#6a5a3a" }}>
        {hint}
      </div>

      {/* Stats */}
      {area > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, border: "1px solid #d8d0c0", borderTop: "none", borderRadius: "0 0 12px 12px", background: "#fff", padding: "10px 14px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#7c3aed" }}>{area.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: "#8a7a5a" }}>Area (m²)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2a8a3a" }}>{wh.w}×{wh.d}</div>
            <div style={{ fontSize: 10, color: "#8a7a5a" }}>W×D from bbox (m)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#c8a050" }}>{sqrtArea}×{sqrtArea}</div>
            <div style={{ fontSize: 10, color: "#8a7a5a" }}>Square equiv (m)</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={handleReset} style={{ padding: "8px 14px", border: "1px solid #d8d0c0", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "transparent", color: "#6a5a3a" }}>
          Reset
        </button>
        {!closed && points.length >= 3 && (
          <button onClick={() => import("leaflet").then(L => closePoly(L, leafletRef.current))}
            style={{ flex: 1, padding: "8px 14px", border: "1px solid #d8d0c0", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#f0f8f0", color: "#2a6a2a", fontWeight: 600 }}>
            Close Polygon
          </button>
        )}
        <button onClick={onCancel} style={{ padding: "8px 14px", border: "1px solid #d8d0c0", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "transparent", color: "#6a5a3a" }}>
          Cancel
        </button>
        {area > 0 && (
          <>
            <button onClick={() => onApply(wh.w, wh.d, area)}
              style={{ flex: 1, padding: "8px 14px", border: "1px solid #7c3aed", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#7c3aed", color: "#fff", fontWeight: 600 }}>
              Use {wh.w}×{wh.d}m
            </button>
            <button onClick={() => onApply(sqrtArea, sqrtArea, area)}
              style={{ flex: 1, padding: "8px 14px", border: "1px solid #c8a050", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#c8a050", color: "#fff", fontWeight: 600 }}>
              Use {sqrtArea}×{sqrtArea}m
            </button>
          </>
        )}
      </div>

      <div style={{ fontSize: 10, color: "#aaa", marginTop: 6 }}>
        Scroll to zoom · Click to add points · Click near first point to close polygon
      </div>
    </div>
  );
}
