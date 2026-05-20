"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Perspective { shootingAngle: number; vanishingPoint: string; perspectiveType: string; nearSide: string; nearFarRatio: number; depthVisible: boolean; depthVisibleNote: string; correctionFactor: number; correctionNote: string; shelfLinesConverge: boolean; estimatedDistance: string; }
interface StepQuality { score: number; angle: string; lighting: string; blur: string; issues: string[]; usable: boolean; perspective: Perspective; }
interface StepCount { totalUnits: number; visibleUnits: number; estimatedDepth: number; shelfRows: number; note: string; }
interface SKUItem { brand: string; company: string; sku: string; sector: string; confidence: number; price_vnd: number | null; }
interface FacingItem { brand: string; sku: string; facing: number; facingAdjusted: number; depth: number; isDepthVisible: boolean; perspectiveNote: string; }
interface PositionItem { brand: string; sku: string; tier: string; tierNote: string; }
interface ShelfShareItem { brand: string; facings: number; shareOfShelf: number; blockLength: string; }
interface OsaItem { brand: string; sku: string; status: string; facingsRemaining: number; riskLevel: string; action: string; }
interface RecommendItem { priority: string; action: string; reason: string; category: string; }
interface PipelineResult {
  id: string; model: string; createdAt: number;
  step1_quality: StepQuality;
  step2_count: StepCount;
  step3_skus: SKUItem[];
  step4_facings: FacingItem[];
  step5_positions: PositionItem[];
  step6_shelfShare: ShelfShareItem[];
  step7_osa: OsaItem[];
  step8_recommendations: RecommendItem[];
  totalFacings: number; topBrand: string; summary: string;
}
interface Stats { totalAnalyses: number; avgFeedbackScore: number; trainingExamples: number; topBrands: { brand: string; count: number }[]; modelStatus: string; recentAnalyses: { id: string; createdAt: number; score?: number; summary: string; brands: number; quality: number }[]; exampleSummary: { id: string; quality: string; brands: number; score?: number; addedAt: number }[]; }
interface BrandSKU { id: string; sku: string; variant: string; format: string; sizeML: number; color: string; label: string; distinguisher?: string; priceVND?: {min:number;max:number}; priceEUR?: {min:number;max:number}; }
interface BrandFormationData { brandId: string; brandName: string; company: string; active: boolean; skuCount: number; }
interface BrandsData { brands: BrandFormationData[]; skus: { pepsi: BrandSKU[] }; }

// ── Styles ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: "20px 24px" };
const chip = (color: string): React.CSSProperties => ({ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `${color}18`, border: `1px solid ${color}40`, color, display: "inline-block" });
const riskColor = (r: string) => r === "high" ? "#ef4444" : r === "medium" ? "#f97316" : r === "low" ? "#fbbf24" : "#4ade80";

const STEP_LABELS = [
  { n: 1, label: "Chất lượng ảnh",      icon: "🔍" },
  { n: 2, label: "Đếm sản phẩm",         icon: "📦" },
  { n: 3, label: "Nhận diện Brand/SKU",  icon: "🏷️" },
  { n: 4, label: "Đếm Facing",           icon: "📐" },
  { n: 5, label: "Vị trí kệ",            icon: "📍" },
  { n: 6, label: "Share of Shelf",       icon: "📊" },
  { n: 7, label: "On-Shelf Availability",icon: "⚠️" },
  { n: 8, label: "Gợi ý & Báo cáo",     icon: "💡" },
];

export default function VisionAgentPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl,  setImageUrl]  = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result,    setResult]    = useState<PipelineResult | null>(null);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [feedback,  setFeedback]  = useState(0);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [saveEx,    setSaveEx]    = useState(false);
  const [tab,       setTab]       = useState<"analyze"|"training"|"stats"|"formation">("analyze");
  const [brandsData, setBrandsData] = useState<BrandsData | null>(null);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/vision-agent/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (tab === "formation" && !brandsData) {
      fetch("/api/vision-agent/brands").then(r => r.json()).then(setBrandsData);
    }
  }, [tab, brandsData]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null); setFeedback(0); setFeedbackNote(""); setFeedbackSent(false); setActiveStep(0);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setLoading(true); setResult(null); setActiveStep(0);
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("saveExample", String(saveEx));
      const res  = await fetch("/api/vision-agent/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (data.result) { setResult(data.result); setActiveStep(1); loadStats(); }
      else alert("Error: " + (data.error ?? "Unknown"));
    } finally { setLoading(false); }
  };

  const handleFeedback = async () => {
    if (!result || !feedback) return;
    await fetch("/api/vision-agent/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId: result.id, score: feedback, notes: feedbackNote, saveAsExample: feedback >= 4 }),
    });
    setFeedbackSent(true); loadStats();
  };

  const handleDeleteExample = async (id: string) => {
    await fetch("/api/vision-agent/examples", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadStats();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", fontFamily: "inherit", display: "flex" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: "#0a0a0a", borderRight: "1px solid #1f1f1f", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 14px", borderBottom: "1px solid #1f1f1f" }}>
          <a href="/"><img src="/logo.png" alt="StoreScope" style={{ height: 73, width: "auto", filter: "invert(1)" }} /></a>
        </div>
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Dashboard",    href: "/dashboard" },
            { label: "AI Analysis",  href: "/dashboard/analysis" },
            { label: "Vision Agent", href: "/dashboard/vision-agent", active: true },
            { label: "AI Agent",     href: "/dashboard/agent" },
            { label: "Store Layout", href: "/layout-editor" },
            { label: "Forum",        href: "/forum" },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: "block", padding: "9px 12px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: (item as {active?:boolean}).active ? 600 : 400, background: (item as {active?:boolean}).active ? "rgba(124,58,237,0.12)" : "transparent", color: (item as {active?:boolean}).active ? "#a78bfa" : "#666", border: (item as {active?:boolean}).active ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent" }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <header style={{ borderBottom: "1px solid #1f1f1f", padding: "16px 28px" }}>
          <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>GPT-4o Vision · 8-Step FMCG Pipeline · Self-Learning</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Vision AI Agent</h2>
          {stats && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{stats.modelStatus}</div>}
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1f1f1f", padding: "0 28px" }}>
          {(["analyze","formation","training","stats"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: "transparent", color: tab === t ? "#a78bfa" : "#555", borderBottom: tab === t ? "2px solid #7c3aed" : "2px solid transparent" }}>
              {t === "analyze" ? "Analyze"
               : t === "formation" ? "🏷️ Formation"
               : t === "training" ? `Training (${stats?.trainingExamples ?? 0})`
               : "Stats"}
            </button>
          ))}
        </div>

        <div style={{ padding: 28 }}>

          {/* ── ANALYZE TAB ── */}
          {tab === "analyze" && (
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

              {/* Left panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Upload */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: "2px dashed #2a2a2a", borderRadius: 16, cursor: "pointer", overflow: "hidden", background: "#0a0a0a", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {imageUrl
                    ? <img src={imageUrl} alt="shelf" style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
                    : <div style={{ textAlign: "center", padding: 28 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                        <div style={{ fontSize: 13, color: "#666" }}>Drop shelf image here</div>
                        <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>JPG · PNG · WEBP</div>
                      </div>
                  }
                  <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: "none" }} />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#888", padding: "10px 14px", background: "#0a0a0a", borderRadius: 10, border: "1px solid #1f1f1f" }}>
                  <input type="checkbox" checked={saveEx} onChange={e => setSaveEx(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  Save as training example
                </label>

                <button onClick={handleAnalyze} disabled={!imageFile || loading}
                  style={{ background: !imageFile || loading ? "#1a1a1a" : "#7c3aed", color: !imageFile || loading ? "#555" : "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 13, fontWeight: 600, cursor: imageFile && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading
                    ? <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #a78bfa", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />Analyzing 8 steps...</>
                    : "Run 8-Step Analysis"}
                </button>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

                {/* 8-step navigator */}
                {result && (
                  <div style={{ ...card, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", marginBottom: 12 }}>8 Analysis Steps</div>
                    {STEP_LABELS.map(s => (
                      <button key={s.n} onClick={() => setActiveStep(s.n)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4, borderRadius: 8, border: `1px solid ${activeStep === s.n ? "rgba(124,58,237,0.4)" : "transparent"}`, background: activeStep === s.n ? "rgba(124,58,237,0.1)" : "transparent", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontSize: 14 }}>{s.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: activeStep === s.n ? "#a78bfa" : "#888" }}>Step {s.n}</div>
                          <div style={{ fontSize: 11, color: activeStep === s.n ? "#ccc" : "#555" }}>{s.label}</div>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "#4ade80" }}>✓</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Feedback */}
                {result && !feedbackSent && (
                  <div style={{ ...card, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "#a78bfa" }}>Rate this analysis</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setFeedback(s)}
                          style={{ flex: 1, height: 32, borderRadius: 6, border: `1px solid ${feedback >= s ? "#7c3aed" : "#2a2a2a"}`, background: feedback >= s ? "rgba(124,58,237,0.15)" : "transparent", cursor: "pointer", fontSize: 14, color: feedback >= s ? "#a78bfa" : "#555" }}>★</button>
                      ))}
                    </div>
                    <textarea value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} placeholder="Notes..." style={{ width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px", color: "#f0f0f0", fontSize: 12, resize: "none", boxSizing: "border-box" }} rows={2} />
                    <button onClick={handleFeedback} disabled={!feedback}
                      style={{ width: "100%", marginTop: 8, background: feedback ? "#7c3aed" : "#1a1a1a", color: feedback ? "#fff" : "#555", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 600, cursor: feedback ? "pointer" : "not-allowed" }}>
                      Submit {feedback >= 4 ? "& Save as Example" : "Feedback"}
                    </button>
                  </div>
                )}
                {feedbackSent && (
                  <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, fontSize: 12, color: "#4ade80" }}>
                    ✓ Saved — agent learns from this
                  </div>
                )}
              </div>

              {/* Right: step results */}
              <div>
                {!result && !loading && (
                  <div style={{ ...card, textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                    <div style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>Upload a shelf image to begin</div>
                    <div style={{ fontSize: 12, color: "#333" }}>{stats?.trainingExamples ?? 0} training examples · GPT-4o Vision</div>
                    <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
                      {STEP_LABELS.map(s => (
                        <div key={s.n} style={{ textAlign: "center", opacity: 0.4 }}>
                          <div style={{ fontSize: 20 }}>{s.icon}</div>
                          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Step {s.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loading && (
                  <div style={{ ...card, textAlign: "center", padding: 60 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #7c3aed", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
                    <div style={{ color: "#a78bfa", fontSize: 15, fontWeight: 600 }}>Running 8-step analysis...</div>
                    <div style={{ color: "#555", fontSize: 12, marginTop: 6 }}>GPT-4o Vision is analyzing your shelf image</div>
                  </div>
                )}

                {result && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Summary bar */}
                    <div style={{ ...card, background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", flex: 1 }}>{result.summary}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={chip("#4ade80")}>Quality {result.step1_quality.score}/100</span>
                          <span style={chip("#a78bfa")}>{result.totalFacings} facings</span>
                          <span style={chip("#818cf8")}>Top: {result.topBrand}</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1 */}
                    {(activeStep === 0 || activeStep === 1) && (
                      <StepCard n={1} icon="🔍" label="Chất lượng ảnh">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                          {[
                            { label: "Score",    value: `${result.step1_quality.score}/100` },
                            { label: "Angle",    value: result.step1_quality.angle },
                            { label: "Lighting", value: result.step1_quality.lighting },
                            { label: "Blur",     value: result.step1_quality.blur },
                          ].map(k => (
                            <div key={k.label} style={{ background: "#0a0a0a", borderRadius: 10, padding: "10px 14px" }}>
                              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", marginBottom: 4 }}>{k.label}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{k.value}</div>
                            </div>
                          ))}
                        </div>
                        {result.step1_quality.issues.length > 0 && (
                          <div style={{ marginTop: 10, fontSize: 12, color: "#fbbf24" }}>Issues: {result.step1_quality.issues.join(", ")}</div>
                        )}

                        {/* Perspective Analysis */}
                        {result.step1_quality.perspective && (
                          <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 12 }}>
                            <div style={{ fontSize: 11, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
                              Phân tích phối cảnh (Perspective)
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
                              {[
                                { label: "Góc chụp",       value: `~${result.step1_quality.perspective.shootingAngle}°`, color: result.step1_quality.perspective.shootingAngle > 30 ? "#fbbf24" : "#4ade80" },
                                { label: "Loại phối cảnh", value: result.step1_quality.perspective.perspectiveType, color: "#818cf8" },
                                { label: "Điểm tụ",        value: result.step1_quality.perspective.vanishingPoint, color: "#818cf8" },
                                { label: "Phía gần",       value: result.step1_quality.perspective.nearSide, color: "#f0f0f0" },
                                { label: "Tỉ lệ gần/xa",   value: `${result.step1_quality.perspective.nearFarRatio}×`, color: result.step1_quality.perspective.nearFarRatio > 1.5 ? "#fbbf24" : "#4ade80" },
                                { label: "Hệ số hiệu chỉnh", value: result.step1_quality.perspective.correctionFactor.toFixed(2), color: "#a78bfa" },
                              ].map(k => (
                                <div key={k.label} style={{ background: "#0a0a0a", borderRadius: 8, padding: "8px 12px" }}>
                                  <div style={{ fontSize: 10, color: "#555", marginBottom: 3 }}>{k.label}</div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: k.color }}>{k.value}</div>
                                </div>
                              ))}
                            </div>

                            {result.step1_quality.perspective.depthVisible && (
                              <div style={{ padding: "8px 12px", background: "rgba(251,191,36,0.08)", borderRadius: 8, marginBottom: 8 }}>
                                <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600, marginBottom: 3 }}>⚠ Depth visible — cần phân biệt với Facing</div>
                                <div style={{ fontSize: 11, color: "#888" }}>{result.step1_quality.perspective.depthVisibleNote}</div>
                              </div>
                            )}

                            <div style={{ padding: "8px 12px", background: "#0a0a0a", borderRadius: 8 }}>
                              <div style={{ fontSize: 11, color: "#818cf8", marginBottom: 2, fontWeight: 600 }}>Công thức hiệu chỉnh</div>
                              <div style={{ fontSize: 11, color: "#888" }}>{result.step1_quality.perspective.correctionNote}</div>
                              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Khoảng cách ước tính: {result.step1_quality.perspective.estimatedDistance}</div>
                            </div>
                          </div>
                        )}
                      </StepCard>
                    )}

                    {/* Step 2 */}
                    {(activeStep === 0 || activeStep === 2) && (
                      <StepCard n={2} icon="📦" label="Đếm sản phẩm">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                          {[
                            { label: "Tổng units",    value: result.step2_count.totalUnits },
                            { label: "Nhìn thấy rõ",  value: result.step2_count.visibleUnits },
                            { label: "Độ sâu kệ",     value: `~${result.step2_count.estimatedDepth} sản phẩm` },
                            { label: "Số tầng kệ",    value: result.step2_count.shelfRows },
                          ].map(k => (
                            <div key={k.label} style={{ background: "#0a0a0a", borderRadius: 10, padding: "10px 14px" }}>
                              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", marginBottom: 4 }}>{k.label}</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa" }}>{k.value}</div>
                            </div>
                          ))}
                        </div>
                        {result.step2_count.note && <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>{result.step2_count.note}</div>}
                      </StepCard>
                    )}

                    {/* Step 3 */}
                    {(activeStep === 0 || activeStep === 3) && result.step3_skus.length > 0 && (
                      <StepCard n={3} icon="🏷️" label={`Nhận diện Brand/SKU — ${result.step3_skus.length} SKUs`}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {result.step3_skus.map((s, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0a0a0a", borderRadius: 10 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.confidence >= 85 ? "#4ade80" : "#fbbf24", flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{s.brand}</div>
                                <div style={{ fontSize: 11, color: "#555" }}>{s.sku} · {s.company}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 12, color: "#a78bfa" }}>{s.confidence}%</div>
                                {s.price_vnd && <div style={{ fontSize: 11, color: "#fbbf24" }}>{s.price_vnd.toLocaleString()}đ</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </StepCard>
                    )}

                    {/* Step 4 */}
                    {(activeStep === 0 || activeStep === 4) && result.step4_facings.length > 0 && (
                      <StepCard n={4} icon="📐" label="Đếm Facing (có hiệu chỉnh phối cảnh)">
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                              {["Brand / SKU","Facing (raw)","Facing (adjusted)","Depth","Ghi chú"].map(h => (
                                <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, color: "#555", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.step4_facings.map((f, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #111" }}>
                                <td style={{ padding: "10px 12px" }}>
                                  <div style={{ fontWeight: 600, color: "#f0f0f0" }}>{f.brand}</div>
                                  <div style={{ fontSize: 11, color: "#555" }}>{f.sku}</div>
                                  {f.isDepthVisible && <span style={{ ...chip("#fbbf24"), fontSize: 9, marginTop: 4 }}>depth visible</span>}
                                </td>
                                <td style={{ padding: "10px 12px", color: "#555", textAlign: "center", textDecoration: f.facingAdjusted !== f.facing ? "line-through" : "none" }}>{f.facing}</td>
                                <td style={{ padding: "10px 12px", color: "#a78bfa", fontWeight: 800, fontSize: 16, textAlign: "center" }}>{f.facingAdjusted}</td>
                                <td style={{ padding: "10px 12px", color: "#555", textAlign: "center" }}>{f.depth}</td>
                                <td style={{ padding: "10px 12px", fontSize: 11, color: "#666", maxWidth: 180 }}>{f.perspectiveNote}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ marginTop: 10, fontSize: 11, color: "#818cf8", padding: "8px 12px", background: "rgba(129,140,248,0.06)", borderRadius: 8 }}>
                          ℹ️ Facing (adjusted) = giá trị dùng để tính Share of Shelf — đã hiệu chỉnh theo góc chụp và loại trừ depth
                        </div>
                      </StepCard>
                    )}

                    {/* Step 5 */}
                    {(activeStep === 0 || activeStep === 5) && result.step5_positions.length > 0 && (
                      <StepCard n={5} icon="📍" label="Vị trí kệ">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {result.step5_positions.map((p, i) => (
                            <div key={i} style={{ padding: "10px 14px", background: "#0a0a0a", borderRadius: 10, minWidth: 160 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f0", marginBottom: 4 }}>{p.brand}</div>
                              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{p.sku}</div>
                              <span style={chip(p.tier === "eye-level" ? "#4ade80" : p.tier === "end-cap" ? "#fbbf24" : "#818cf8")}>{p.tier}</span>
                              {p.tierNote && <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{p.tierNote}</div>}
                            </div>
                          ))}
                        </div>
                      </StepCard>
                    )}

                    {/* Step 6 */}
                    {(activeStep === 0 || activeStep === 6) && result.step6_shelfShare.length > 0 && (
                      <StepCard n={6} icon="📊" label={`Share of Shelf — tổng ${result.totalFacings} facings`}>
                        {result.step6_shelfShare.map(s => (
                          <div key={s.brand} style={{ marginBottom: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{s.brand}</span>
                                <span style={{ fontSize: 11, color: "#555", marginLeft: 8 }}>{s.facings} facings · {s.blockLength}</span>
                              </div>
                              <span style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa" }}>{s.shareOfShelf}%</span>
                            </div>
                            <div style={{ height: 10, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${s.shareOfShelf}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 99 }} />
                            </div>
                          </div>
                        ))}
                      </StepCard>
                    )}

                    {/* Step 7 */}
                    {(activeStep === 0 || activeStep === 7) && (
                      <StepCard n={7} icon="⚠️" label="On-Shelf Availability (OSA)">
                        {result.step7_osa.filter(o => o.riskLevel !== "none").length === 0
                          ? <div style={{ fontSize: 13, color: "#4ade80" }}>✓ Tất cả sản phẩm đủ hàng — không có rủi ro OSA</div>
                          : result.step7_osa.filter(o => o.riskLevel !== "none").map((o, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#0a0a0a", borderRadius: 10, marginBottom: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: riskColor(o.riskLevel), flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{o.sku}</div>
                                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{o.action}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span style={chip(riskColor(o.riskLevel))}>{o.riskLevel.toUpperCase()}</span>
                                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{o.facingsRemaining} facing còn lại</div>
                              </div>
                            </div>
                          ))
                        }
                      </StepCard>
                    )}

                    {/* Step 8 */}
                    {(activeStep === 0 || activeStep === 8) && result.step8_recommendations.length > 0 && (
                      <StepCard n={8} icon="💡" label="Gợi ý & Báo cáo">
                        {result.step8_recommendations.map((r, i) => (
                          <div key={i} style={{ display: "flex", gap: 14, padding: "12px 14px", background: "#0a0a0a", borderRadius: 10, marginBottom: 8 }}>
                            <span style={chip(r.priority === "high" ? "#ef4444" : r.priority === "medium" ? "#fbbf24" : "#4ade80")}>{r.priority}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{r.action}</div>
                              <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{r.reason}</div>
                            </div>
                            <span style={chip("#818cf8")}>{r.category}</span>
                          </div>
                        ))}
                      </StepCard>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FORMATION TAB ── */}
          {tab === "formation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Header */}
              <div style={{ ...card, background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.2)", padding: "20px 24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Formation à la reconnaissance des produits</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7 }}>
                  Entraînez l&apos;agent à reconnaître les produits de chaque marque avec précision.<br/>
                  Les catalogues de marques enrichissent le prompt GPT-4o avec les visuels et caractéristiques spécifiques.
                </div>
              </div>

              {/* Active brands */}
              {brandsData?.brands.map(b => (
                <div key={b.brandId} style={{ ...card, padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: b.brandId === "pepsi" ? "#003087" : "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {b.brandId === "pepsi" ? "🔵" : "🏷️"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{b.brandName}</div>
                      <div style={{ fontSize: 12, color: "#555" }}>{b.company} · {b.skuCount} SKUs dans la base</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}>
                      ✓ Actif
                    </span>
                  </div>

                  {/* SKU table for Pepsi */}
                  {b.brandId === "pepsi" && brandsData.skus.pepsi && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", marginBottom: 10 }}>
                        Catalogue SKU Pepsi ({brandsData.skus.pepsi.length} produits)
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                              {["SKU","Variant","Format","Taille","Couleur","Identificateur visuel","Prix VND","Prix EUR"].map(h => (
                                <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", background: "#0a0a0a" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {brandsData.skus.pepsi.map((s) => (
                              <tr key={s.id} style={{ borderBottom: "1px solid #111" }}>
                                <td style={{ padding: "10px", color: "#f0f0f0", fontWeight: 600 }}>{s.sku}</td>
                                <td style={{ padding: "10px", color: "#a78bfa" }}>{s.variant}</td>
                                <td style={{ padding: "10px", color: "#818cf8" }}>{s.format}</td>
                                <td style={{ padding: "10px", color: "#555" }}>{s.sizeML}ml</td>
                                <td style={{ padding: "10px" }}>
                                  <div style={{ width: 20, height: 20, borderRadius: 4, background: s.color, border: "1px solid #2a2a2a", display: "inline-block" }} />
                                </td>
                                <td style={{ padding: "10px", fontSize: 11, color: "#888", maxWidth: 200 }}>
                                  {s.distinguisher ?? s.label}
                                </td>
                                <td style={{ padding: "10px", color: "#fbbf24", fontSize: 11 }}>
                                  {s.priceVND ? `${s.priceVND.min.toLocaleString()}–${s.priceVND.max.toLocaleString()}đ` : "—"}
                                </td>
                                <td style={{ padding: "10px", color: "#fbbf24", fontSize: 11 }}>
                                  {s.priceEUR ? `${s.priceEUR.min}–${s.priceEUR.max}€` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Visual identification guide */}
                      <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(0,48,135,0.1)", border: "1px solid rgba(0,48,135,0.3)", borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 8 }}>Guide de différenciation visuelle</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                          {[
                            { color: "#003087", label: "Pepsi Regular", note: "Bleu profond + globe rouge" },
                            { color: "#000000", label: "Pepsi Max/Zero", note: "NOIR — distinction critique!" },
                            { color: "#00A550", label: "7Up", note: "Vert vif + logo rouge" },
                            { color: "#FF6600", label: "Mirinda", note: "Orange vif" },
                            { color: "#CC0000", label: "Sting Red", note: "Rouge foncé + éclair or" },
                            { color: "#FFD700", label: "Sting Gold", note: "Or/jaune" },
                          ].map(c => (
                            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#0a0a0a", borderRadius: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: c.color, border: "1px solid #2a2a2a", flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f0" }}>{c.label}</div>
                                <div style={{ fontSize: 10, color: "#555" }}>{c.note}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Coming soon */}
              <div style={{ ...card, padding: "20px 24px", opacity: 0.5 }}>
                <div style={{ fontSize: 13, color: "#555", textAlign: "center" }}>
                  + Ajouter une autre marque (Coca-Cola, Heineken, Vinamilk...) — à venir
                </div>
              </div>
            </div>
          )}

          {/* ── TRAINING TAB ── */}
          {tab === "training" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ ...card, background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.2)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Cách agent học hỏi</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.8 }}>
                  1. Phân tích ảnh → Rate 4-5 ★ → Tự lưu làm training example<br/>
                  2. Lần phân tích sau: agent đọc examples tốt nhất → đưa vào context GPT-4o<br/>
                  3. Càng nhiều examples chất lượng cao → 8 bước càng chính xác<br/>
                  4. Không cần fine-tune model — few-shot learning tự động
                </div>
              </div>
              {stats?.exampleSummary.length === 0
                ? <div style={{ ...card, textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
                    <div style={{ color: "#555" }}>Chưa có training examples. Rate ảnh 4-5 ★ để tạo.</div>
                  </div>
                : stats?.exampleSummary.map(ex => (
                  <div key={ex.id} style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                        <span style={chip(ex.quality === "excellent" ? "#fbbf24" : "#4ade80")}>{ex.quality}</span>
                        {ex.score && <span style={{ fontSize: 12, color: "#a78bfa" }}>{"★".repeat(ex.score)}{"☆".repeat(5-ex.score)}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "#ccc" }}>{ex.brands} SKUs detected</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{new Date(ex.addedAt).toLocaleString()}</div>
                    </div>
                    <button onClick={() => handleDeleteExample(ex.id)} style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Remove</button>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── STATS TAB ── */}
          {tab === "stats" && stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {[
                  { label: "Total Analyses",    value: stats.totalAnalyses },
                  { label: "Training Examples", value: stats.trainingExamples },
                  { label: "Avg Score",         value: stats.avgFeedbackScore ? `${stats.avgFeedbackScore}/5` : "—" },
                  { label: "Top Brand",         value: stats.topBrands[0]?.brand ?? "—" },
                ].map(k => (
                  <div key={k.label} style={{ ...card, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#a78bfa", marginBottom: 4 }}>{k.value}</div>
                    <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</div>
                  </div>
                ))}
              </div>
              {stats.topBrands.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#a78bfa" }}>Most Detected Brands</div>
                  {stats.topBrands.map(b => (
                    <div key={b.brand} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 110, fontSize: 13, color: "#e0e0e0" }}>{b.brand}</div>
                      <div style={{ flex: 1, height: 6, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(b.count / stats.topBrands[0].count) * 100}%`, background: "#7c3aed", borderRadius: 99 }} />
                      </div>
                      <div style={{ width: 24, fontSize: 12, color: "#555", textAlign: "right" }}>{b.count}</div>
                    </div>
                  ))}
                </div>
              )}
              {stats.recentAnalyses.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#a78bfa" }}>Recent Analyses</div>
                  {stats.recentAnalyses.map(a => (
                    <div key={a.id} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: "1px solid #111" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: "#555" }}>{a.id} · {a.brands} SKUs · Quality {a.quality}/100</div>
                        <div style={{ fontSize: 12, color: "#ccc", marginTop: 2 }}>{a.summary}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "#555", flexShrink: 0, textAlign: "right" }}>
                        {a.score ? "★".repeat(a.score) : "unrated"}<br/>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Step Card component ───────────────────────────────────────────────────────
function StepCard({ n, icon, label, children }: { n: number; icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 10, background: "rgba(124,58,237,0.04)" }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div>
          <span style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.1em" }}>Step {n}</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>{label}</div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 8px", borderRadius: 999 }}>✓ Done</span>
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}
