"use client";

import { useEffect, useRef, useState } from "react";

interface MapDrawerProps {
  lat:      number;
  lon:      number;
  address:  string;
  onApply:  (width: number, depth: number, area: number) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMap?: () => void;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry&callback=initGoogleMap`;
    script.async = true;
    window.initGoogleMap = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function MapDrawer({ lat, lon, address, onApply, onCancel }: MapDrawerProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapObjRef  = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const drawMgrRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const [area, setArea]   = useState(0);
  const [wh, setWH]       = useState({ w: 0, d: 0 });
  const [ready, setReady] = useState(false);
  const [hint, setHint]   = useState("Draw a polygon around your store");
  const [error, setError] = useState("");

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  useEffect(() => {
    if (!API_KEY) {
      setError("NEXT_PUBLIC_GOOGLE_MAPS_KEY not set in .env.local");
      return;
    }

    loadGoogleMaps(API_KEY)
      .then(() => {
        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center:    { lat, lng: lon },
          zoom:      19,
          mapTypeId: "satellite",
          tilt:      0,
          mapTypeControl:    true,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControlOptions: {
            mapTypeIds: ["satellite", "roadmap", "hybrid"],
          },
        });
        mapObjRef.current = map;

        // Center marker
        new google.maps.Marker({
          position: { lat, lng: lon },
          map,
          title:    address.split(",")[0],
          icon: {
            path:        google.maps.SymbolPath.CIRCLE,
            scale:       8,
            fillColor:   "#7c3aed",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });

        // Drawing manager
        const dm = new google.maps.drawing.DrawingManager({
          drawingMode:    google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position:    google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            fillColor:   "#7c3aed",
            fillOpacity: 0.25,
            strokeColor: "#7c3aed",
            strokeWeight: 2,
            editable:    true,
            draggable:   true,
          },
        });
        dm.setMap(map);
        drawMgrRef.current = dm;

        // When polygon is drawn
        google.maps.event.addListener(dm, "polygoncomplete", (poly: google.maps.Polygon) => {
          if (polygonRef.current) polygonRef.current.setMap(null);
          polygonRef.current = poly;
          dm.setDrawingMode(null);
          calcArea(poly);

          // Recalculate when edited
          google.maps.event.addListener(poly.getPath(), "set_at",    () => calcArea(poly));
          google.maps.event.addListener(poly.getPath(), "insert_at",  () => calcArea(poly));
          google.maps.event.addListener(poly.getPath(), "remove_at",  () => calcArea(poly));
        });

        setReady(true);
        setHint("Click the polygon tool (top center) → draw around your store → drag corners to adjust");
      })
      .catch(() => setError("Failed to load Google Maps. Check your API key."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calcArea = (poly: google.maps.Polygon) => {
    const areaSqm = google.maps.geometry.spherical.computeArea(poly.getPath());
    const bounds  = new google.maps.LatLngBounds();
    poly.getPath().forEach(pt => bounds.extend(pt));
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const w  = Math.round(google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(sw.lat(), sw.lng()),
      new google.maps.LatLng(sw.lat(), ne.lng()),
    ));
    const d  = Math.round(google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(sw.lat(), sw.lng()),
      new google.maps.LatLng(ne.lat(), sw.lng()),
    ));
    setArea(Math.round(areaSqm));
    setWH({ w: Math.max(3, w), d: Math.max(3, d) });
    setHint(`Area: ${Math.round(areaSqm).toLocaleString()} m² · ${w}×${d}m · Drag corners to refine`);
  };

  const handleReset = () => {
    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; }
    if (drawMgrRef.current) drawMgrRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    setArea(0); setWH({ w: 0, d: 0 });
    setHint("Draw a polygon around your store");
  };

  const sqrtArea = area > 0 ? Math.round(Math.sqrt(area)) : 0;

  if (error) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <p style={{ color: "#c04020", fontSize: 13, marginBottom: 12 }}>{error}</p>
        {!API_KEY && (
          <div style={{ fontSize: 12, color: "#6a5a3a", background: "#faf5e8", padding: "10px 14px", borderRadius: 8, textAlign: "left", lineHeight: 1.7 }}>
            <strong>Setup:</strong><br/>
            1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>console.cloud.google.com</a><br/>
            2. Enable <strong>Maps JavaScript API</strong> + <strong>Geometry Library</strong><br/>
            3. Add to <code>.env.local</code>:<br/>
            <code style={{ background: "#f0ebe0", padding: "2px 6px", borderRadius: 4, display: "block", marginTop: 6 }}>
              NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key_here
            </code>
          </div>
        )}
        <button onClick={onCancel} style={{ marginTop: 14, padding: "8px 20px", border: "1px solid #d8d0c0", borderRadius: 8, cursor: "pointer", background: "transparent", color: "#6a5a3a", fontSize: 12 }}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Map */}
      <div ref={mapRef} style={{ width: "100%", height: 380, borderRadius: "12px 12px 0 0", overflow: "hidden", border: "1px solid #d8d0c0" }}>
        {!ready && (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f0e8", color: "#6a5a3a", fontSize: 13 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #c8a050", borderTopColor: "transparent", margin: "0 auto 10px", animation: "spin 0.8s linear infinite" }} />
              Loading Google Maps...
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      <div style={{ padding: "8px 12px", background: "#faf5e8", border: "1px solid #d8d0c0", borderTop: "none", fontSize: 11, color: "#6a5a3a" }}>
        {hint}
      </div>

      {/* Stats */}
      {area > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", border: "1px solid #d8d0c0", borderTop: "none", background: "#fff", padding: "12px 16px", gap: 8 }}>
          {[
            { val: `${area.toLocaleString()} m²`, lbl: "Polygon Area",    color: "#7c3aed" },
            { val: `${wh.w}×${wh.d} m`,           lbl: "Width × Depth",  color: "#2a8a3a" },
            { val: `${sqrtArea}×${sqrtArea} m`,    lbl: "Square equiv",   color: "#c8a050" },
          ].map(s => (
            <div key={s.lbl} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#8a7a5a" }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button onClick={handleReset} style={{ padding: "8px 14px", border: "1px solid #d8d0c0", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "transparent", color: "#6a5a3a" }}>
          Redraw
        </button>
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
        Google Maps Satellite · Drawing tools: polygon tool (top center) · Drag corners to refine
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
