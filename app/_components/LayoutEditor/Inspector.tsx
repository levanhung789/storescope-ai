"use client";

import { FixtureInstance, TemperatureZone } from "./types";
import { FIXTURE_TYPES } from "./fixtureLibrary";

interface Props {
  fixture: FixtureInstance | null;
  onChange: (updated: FixtureInstance) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#ffffff",
  border: "1px solid #d8d0c0",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 12,
  color: "#2a2010",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 9.5,
  color: "#8a7050",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 3,
  display: "block",
  fontWeight: 600,
};

export default function Inspector({ fixture, onChange, onDelete, onDuplicate, onRotate }: Props) {
  if (!fixture) {
    return (
      <div style={{ width: 200, borderLeft: "1px solid #e0dbd0", background: "#faf9f5", padding: "20px 14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: "#b0a080", textAlign: "center", lineHeight: 1.6 }}>
          Select a fixture to edit properties
        </p>
      </div>
    );
  }

  const update = (p: Partial<FixtureInstance>) => onChange({ ...fixture, ...p });
  const updateGeo = (p: Partial<FixtureInstance["geometry"]>) => update({ geometry: { ...fixture.geometry, ...p } });
  const updateBiz = (p: Partial<FixtureInstance["business"]>) => update({ business: { ...fixture.business, ...p } });

  return (
    <div style={{ width: 200, borderLeft: "1px solid #e0dbd0", background: "#faf9f5", padding: "14px 12px", overflowY: "auto", flexShrink: 0, fontSize: 12 }}>
      <p style={{ fontSize: 10, color: "#c8a050", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>
        Properties
      </p>

      {/* Name */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={fixture.name} onChange={(e) => update({ name: e.target.value })} />
      </div>

      {/* Type */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Fixture Type</label>
        <select style={{ ...inputStyle, cursor: "pointer" }} value={fixture.business.fixtureType}
          onChange={(e) => updateBiz({ fixtureType: e.target.value as FixtureInstance["business"]["fixtureType"] })}>
          {FIXTURE_TYPES.map((ft) => <option key={ft.id} value={ft.id}>{ft.labelVi}</option>)}
        </select>
      </div>

      {/* Dimensions */}
      <p style={{ ...labelStyle, marginBottom: 6 }}>Dimensions (mm)</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        {([["Width", "width"], ["Depth", "depth"], ["Height", "height"], ["Shelves", "shelfCount"]] as const).map(([lbl, key]) => (
          <div key={key}>
            <label style={labelStyle}>{lbl}</label>
            <input type="number" style={inputStyle} value={key === "shelfCount" ? fixture.business.shelfCount : fixture.geometry[key as "width" | "depth" | "height"]}
              onChange={(e) => { const v = Number(e.target.value); key === "shelfCount" ? updateBiz({ shelfCount: v }) : updateGeo({ [key]: v }); }} />
          </div>
        ))}
      </div>

      {/* Rotate */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Rotation — {fixture.geometry.rotationDeg}°</label>
        <button onClick={() => onRotate(fixture.id)} style={{ width: "100%", padding: "6px", borderRadius: 6, border: "1px solid #d8d0c0", background: "#fff", color: "#2a2010", fontSize: 12, cursor: "pointer", transition: "border-color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#c8a050")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d8d0c0")}>
          Rotate 90°
        </button>
      </div>

      {/* Category */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Category</label>
        <input style={inputStyle} value={fixture.business.categoryZone} onChange={(e) => updateBiz({ categoryZone: e.target.value })} placeholder="snack, beverage..." />
      </div>

      {/* Temperature */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Temperature Zone</label>
        <select style={{ ...inputStyle, cursor: "pointer" }} value={fixture.business.temperatureZone} onChange={(e) => updateBiz({ temperatureZone: e.target.value as TemperatureZone })}>
          <option value="ambient">Ambient</option>
          <option value="chilled">Chilled</option>
          <option value="frozen">Frozen</option>
        </select>
      </div>

      {/* Priority */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Priority — {fixture.business.priorityScore}</label>
        <input type="range" min={0} max={100} value={fixture.business.priorityScore} onChange={(e) => updateBiz({ priorityScore: Number(e.target.value) })} style={{ width: "100%", accentColor: "#c8a050" }} />
      </div>

      {/* Toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {([["Promo", "promo"], ["Sellable", "sellable"]] as const).map(([lbl, key]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={fixture.business[key]} onChange={(e) => updateBiz({ [key]: e.target.checked })} style={{ accentColor: "#c8a050" }} />
            <span style={{ fontSize: 12, color: "#5a4a2a" }}>{lbl}</span>
          </label>
        ))}
      </div>

      {/* Duplicate */}
      <button onClick={() => onDuplicate(fixture.id)}
        style={{ width: "100%", padding: "7px", borderRadius: 6, border: "1px solid #c8d8f0", background: "#f0f5fe", color: "#1d4ed8", fontSize: 12, cursor: "pointer", marginBottom: 6, transition: "border-color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1d4ed8")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#c8d8f0")}>
        Duplicate  (Ctrl+D)
      </button>

      {/* Delete */}
      <button onClick={() => onDelete(fixture.id)} style={{ width: "100%", padding: "7px", borderRadius: 6, border: "1px solid #f0c0b0", background: "#fef5f0", color: "#c04020", fontSize: 12, cursor: "pointer", transition: "border-color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#c04020")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f0c0b0")}>
        Delete fixture
      </button>
    </div>
  );
}
