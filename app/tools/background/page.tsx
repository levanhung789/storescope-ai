"use client";

import { useState } from "react";
import Link from "next/link";

const STYLES = [
  { key: "abstract",  label: "Abstract",   emoji: "🌊" },
  { key: "gradient",  label: "Gradient",   emoji: "🌈" },
  { key: "geometric", label: "Geometric",  emoji: "⬡" },
  { key: "dark",      label: "Dark",       emoji: "🌑" },
  { key: "tech",      label: "Tech / AI",  emoji: "💡" },
  { key: "fmcg",      label: "Retail",     emoji: "🏪" },
  { key: "minimal",   label: "Minimal",    emoji: "□" },
  { key: "neon",      label: "Neon Glow",  emoji: "⚡" },
];

const SIZES = [
  { key: "wide",   label: "16:9 (Hero/Banner)", hint: "1792×1024" },
  { key: "square", label: "1:1 (Profile/Card)", hint: "1024×1024" },
];

const PRESETS = [
  "Dark purple space with glowing particles and data streams",
  "Abstract FMCG retail shelf with blurred colorful products",
  "Deep ocean gradient with subtle geometric grid overlay",
  "Futuristic city skyline at night with neon purple accents",
  "Clean white marble with subtle gold veining texture",
  "Dark tech circuit board with violet glow highlights",
  "Soft gradient from deep navy to violet, misty atmosphere",
  "Abstract blockchain nodes and connections on dark background",
];

export default function BackgroundGeneratorPage() {
  const [prompt,   setPrompt]   = useState("");
  const [style,    setStyle]    = useState("dark");
  const [size,     setSize]     = useState("wide");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<{ url: string; revised?: string } | null>(null);
  const [error,    setError]    = useState("");
  const [history,  setHistory]  = useState<string[]>([]);
  const [copied,   setCopied]   = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/generate-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult({ url: data.url, revised: data.revisedPrompt });
      setHistory(prev => [data.url, ...prev.slice(0, 7)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!result?.url) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    if (!result?.url) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `storescope-bg-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const applyToBanner = () => {
    if (!result?.url) return;
    localStorage.setItem("storescope_hero_bg", result.url);
    alert("✅ Banner background updated! Reload the homepage to see changes.");
  };

  const card: React.CSSProperties = {
    background: "#111",
    border: "1px solid #1f1f1f",
    borderRadius: 16,
    padding: "20px 24px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", fontFamily: "inherit" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid #1f1f1f", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", textDecoration: "none", letterSpacing: "-0.03em" }}>
            storescope<span style={{ color: "#a78bfa" }}>.ai</span>
          </Link>
          <span style={{ color: "#2a2a2a" }}>›</span>
          <span style={{ fontSize: 13, color: "#555" }}>Background Generator</span>
        </div>
        <Link href="/dashboard" style={{ fontSize: 13, color: "#555", textDecoration: "none" }}>← Dashboard</Link>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "flex-start" }}>

        {/* ── LEFT: Form ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Title */}
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>AI Background Generator</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#555" }}>Tạo hình nền đẹp cho website bằng DALL-E 3</p>
          </div>

          {/* Prompt */}
          <div style={card}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Mô tả hình nền
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              placeholder="Ví dụ: Dark purple space with glowing particles and data streams, professional website background..."
              style={{ width: "100%", padding: "10px 12px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
              onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
            {/* Presets */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>Gợi ý nhanh:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {PRESETS.slice(0, 4).map(p => (
                  <button key={p} onClick={() => setPrompt(p)}
                    style={{ textAlign: "left", padding: "6px 10px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 7, color: "#555", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.borderColor = "#2a2a2a"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1a1a1a"; }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Style */}
          <div style={card}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Phong cách
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {STYLES.map(s => (
                <button key={s.key} onClick={() => setStyle(s.key)}
                  style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${style === s.key ? "#7c3aed" : "#2a2a2a"}`, background: style === s.key ? "rgba(124,58,237,0.12)" : "#0a0a0a", color: style === s.key ? "#a78bfa" : "#555", fontSize: 12, fontWeight: style === s.key ? 600 : 400, cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", gap: 6, alignItems: "center", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 14 }}>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div style={card}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Kích thước
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SIZES.map(s => (
                <button key={s.key} onClick={() => setSize(s.key)}
                  style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${size === s.key ? "#7c3aed" : "#2a2a2a"}`, background: size === s.key ? "rgba(124,58,237,0.12)" : "#0a0a0a", color: size === s.key ? "#a78bfa" : "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s" }}>
                  <span style={{ fontWeight: size === s.key ? 600 : 400 }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>{s.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            style={{ padding: "14px 0", background: loading ? "#4a2888" : "#7c3aed", border: "none", color: "#fff", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#6d28d9"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#7c3aed"; }}>
            {loading ? (
              <>
                <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Đang tạo hình...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Tạo hình nền
              </>
            )}
          </button>

          {error && (
            <div style={{ padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#f87171" }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ── RIGHT: Preview + History ────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Preview area */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>Preview</span>
              {result && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={copyUrl}
                    style={{ padding: "6px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: copied ? "#4ade80" : "#888", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {copied ? "✓ Copied!" : "Copy URL"}
                  </button>
                  <button onClick={download}
                    style={{ padding: "6px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    Download
                  </button>
                  <button onClick={applyToBanner}
                    style={{ padding: "6px 14px", background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    Apply to Banner
                  </button>
                </div>
              )}
            </div>

            {/* Image preview */}
            <div style={{ aspectRatio: size === "wide" ? "16/9" : "1/1", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, border: "3px solid #1f1f1f", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <p style={{ color: "#555", fontSize: 13, margin: 0 }}>DALL-E 3 đang vẽ hình...</p>
                </div>
              )}
              {!loading && !result && (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>🎨</div>
                  <p style={{ color: "#333", fontSize: 14, margin: 0 }}>Nhập mô tả và nhấn "Tạo hình nền"</p>
                </div>
              )}
              {!loading && result && (
                <img src={result.url} alt="Generated background" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
            </div>

            {/* Revised prompt */}
            {result?.revised && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid #1a1a1a" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#444", lineHeight: 1.5 }}>
                  <strong style={{ color: "#555" }}>Prompt đã dùng: </strong>{result.revised}
                </p>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Lịch sử ({history.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {history.map((url, i) => (
                  <div key={i} onClick={() => setResult({ url })}
                    style={{ aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", cursor: "pointer", border: result?.url === url ? "2px solid #7c3aed" : "2px solid transparent", transition: "border-color 0.15s" }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage guide */}
          <div style={{ ...card, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", marginBottom: 10 }}>💡 Hướng dẫn sử dụng</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#666", lineHeight: 1.8 }}>
              <li>Nhập mô tả hình nền bạn muốn (tiếng Việt hoặc tiếng Anh)</li>
              <li>Chọn phong cách và kích thước phù hợp</li>
              <li>Nhấn "Tạo hình nền" — DALL-E 3 sẽ tạo trong ~15 giây</li>
              <li>Nhấn <strong style={{ color: "#a78bfa" }}>Apply to Banner</strong> để áp dụng vào website</li>
              <li>Hoặc nhấn <strong style={{ color: "#a78bfa" }}>Download</strong> để tải về</li>
            </ol>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .bg-gen-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
