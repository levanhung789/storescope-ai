"use client";

import { useState, useRef } from "react";
import { FixtureInstance } from "./types";

interface Props {
  fixture: FixtureInstance;
  onChange: (updated: FixtureInstance) => void;
  onClose: () => void;
}

export default function AnnotationEditor({ fixture, onChange, onClose }: Props) {
  const [name, setName]   = useState(fixture.name);
  const [note, setNote]   = useState(fixture.note ?? "");
  const [imgUrl, setImgUrl] = useState(fixture.noteImageUrl ?? "");
  const [imgPreview, setImgPreview] = useState(fixture.noteImageUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      setImgUrl(url);
      setImgPreview(url);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onChange({ ...fixture, name, note, noteImageUrl: imgUrl });
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10,
    padding: "10px 12px", color: "#f0f0f0", fontSize: 13, outline: "none",
    transition: "border-color 0.2s",
  };

  const label: React.CSSProperties = {
    fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em",
    marginBottom: 6, display: "block",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 3000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "#111", border: "1px solid #2a2a2a", borderRadius: 20,
        padding: 28, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 10, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 5 }}>
              Annotation
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Edit Note</h3>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Title */}
          <div>
            <label style={label}>Title</label>
            <input
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Note title..."
              onFocus={e => (e.currentTarget.style.borderColor = "#f59e0b")}
              onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
          </div>

          {/* Note text */}
          <div>
            <label style={label}>Note / Description</label>
            <textarea
              style={{ ...inputStyle, height: 120, resize: "vertical" }}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Write your observations, instructions, or details about this area of the store..."
              onFocus={e => (e.currentTarget.style.borderColor = "#f59e0b")}
              onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
          </div>

          {/* Image */}
          <div>
            <label style={label}>Reference Image (optional)</label>
            {imgPreview ? (
              <div style={{ position: "relative", marginBottom: 8 }}>
                <img src={imgPreview} alt="Reference" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 10, border: "1px solid #2a2a2a", background: "#050505" }} />
                <button
                  onClick={() => { setImgUrl(""); setImgPreview(""); }}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#f87171", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
                style={{
                  border: "2px dashed #2a2a2a", borderRadius: 10, padding: "24px 0",
                  cursor: "pointer", textAlign: "center", background: "#0a0a0a",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#f59e0b")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#2a2a2a")}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" style={{ margin: "0 auto 8px", display: "block" }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
                </svg>
                <div style={{ fontSize: 13, color: "#555" }}>Drop image here or click to browse</div>
                <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>JPG · PNG · WEBP</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
          </div>

          {/* Location info */}
          <div style={{ padding: "10px 14px", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, fontSize: 12, color: "#555" }}>
            Position: {Math.round(fixture.geometry.x / 1000 * 10) / 10}m × {Math.round(fixture.geometry.y / 1000 * 10) / 10}m from origin
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 12, padding: "11px 0", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{ flex: 2, background: "#f59e0b", border: "none", color: "#1a0a00", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#d97706")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f59e0b")}>
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
