"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

interface Detection { brand: string; company: string; product: string; sector: string; confidence: number; price_vnd: number | null; }
interface AnalysisResult { id: string; imageHash: string; detections: Detection[]; shelfShare: { brand: string; pct: number }[]; imageQuality: { score: number; issues: string[] }; recommendations: string[]; stockRisks: string[]; rawSummary: string; model: string; createdAt: number; }
interface Stats { totalAnalyses: number; avgFeedbackScore: number; trainingExamples: number; topBrands: { brand: string; count: number }[]; modelStatus: string; recentAnalyses: { id: string; createdAt: number; score?: number; summary: string; brands: number; quality: number }[]; exampleSummary: { id: string; quality: string; brands: number; score?: number; addedAt: number }[]; }

const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: "20px 24px" };
const tag = (color: string): React.CSSProperties => ({ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `${color}18`, border: `1px solid ${color}40`, color });

export default function VisionAgentPage() {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl]   = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult]       = useState<AnalysisResult | null>(null);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(false);
  const [feedback, setFeedback]   = useState<number>(0);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [saveEx, setSaveEx]       = useState(false);
  const [tab, setTab]             = useState<"analyze"|"training"|"stats">("analyze");

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/vision-agent/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null); setFeedback(0); setFeedbackNote(""); setFeedbackSent(false);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("saveExample", String(saveEx));
      const res = await fetch("/api/vision-agent/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (data.result) { setResult(data.result); loadStats(); }
      else alert("Error: " + (data.error ?? "Unknown"));
    } finally { setLoading(false); }
  };

  const handleFeedback = async () => {
    if (!result || !feedback) return;
    await fetch("/api/vision-agent/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
          <a href="/"><img src="/logo.png" alt="StoreScope AI" style={{ height: 73, width: "auto", filter: "invert(1)" }} /></a>
        </div>
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Dashboard",     href: "/dashboard" },
            { label: "AI Analysis",   href: "/dashboard/analysis" },
            { label: "Vision Agent",  href: "/dashboard/vision-agent", active: true },
            { label: "AI Agent",      href: "/dashboard/agent" },
            { label: "Store Layout",  href: "/layout-editor" },
            { label: "Forum",         href: "/forum" },
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
          <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>GPT-4o Vision · Few-Shot Learning · Self-Improving</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Vision AI Agent</h2>
          {stats && <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>{stats.modelStatus}</div>}
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1f1f1f", padding: "0 28px" }}>
          {(["analyze","training","stats"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: "transparent", color: tab === t ? "#a78bfa" : "#555", borderBottom: tab === t ? "2px solid #7c3aed" : "2px solid transparent", textTransform: "capitalize" }}>
              {t === "analyze" ? "Analyze Image" : t === "training" ? `Training (${stats?.trainingExamples ?? 0})` : "Statistics"}
            </button>
          ))}
        </div>

        <div style={{ padding: 28 }}>

          {/* ── Analyze Tab ── */}
          {tab === "analyze" && (
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>

              {/* Left */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Upload */}
                <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: "2px dashed #2a2a2a", borderRadius: 16, cursor: "pointer", overflow: "hidden", background: "#0a0a0a", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {imageUrl
                    ? <img src={imageUrl} alt="shelf" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                    : <div style={{ textAlign: "center", padding: 32 }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                        <div style={{ fontSize: 13, color: "#666" }}>Drop shelf image here</div>
                        <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>JPG · PNG · WEBP</div>
                      </div>
                  }
                  <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: "none" }} />
                </div>

                {/* Options */}
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#888", padding: "10px 14px", background: "#0a0a0a", borderRadius: 10, border: "1px solid #1f1f1f" }}>
                  <input type="checkbox" checked={saveEx} onChange={e => setSaveEx(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  Save as training example
                </label>

                <button onClick={handleAnalyze} disabled={!imageFile || loading}
                  style={{ background: !imageFile || loading ? "#1a1a1a" : "#7c3aed", color: !imageFile || loading ? "#555" : "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 13, fontWeight: 600, cursor: imageFile && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading ? <>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #a78bfa", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                    GPT-4o Analyzing...
                  </> : "Analyze with Vision Agent"}
                </button>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

                {/* Feedback */}
                {result && !feedbackSent && (
                  <div style={{ ...card, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "#a78bfa" }}>Rate this analysis</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setFeedback(s)}
                          style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${feedback >= s ? "#7c3aed" : "#2a2a2a"}`, background: feedback >= s ? "rgba(124,58,237,0.15)" : "transparent", cursor: "pointer", fontSize: 16, color: feedback >= s ? "#a78bfa" : "#555" }}>
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} placeholder="Notes (optional)..." style={{ width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 10px", color: "#f0f0f0", fontSize: 12, resize: "none", boxSizing: "border-box" }} rows={2} />
                    <button onClick={handleFeedback} disabled={!feedback} style={{ width: "100%", marginTop: 8, background: feedback ? "#7c3aed" : "#1a1a1a", color: feedback ? "#fff" : "#555", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 600, cursor: feedback ? "pointer" : "not-allowed" }}>
                      Submit Feedback {feedback >= 4 ? "& Save as Example" : ""}
                    </button>
                  </div>
                )}
                {feedbackSent && (
                  <div style={{ padding: "12px 16px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, fontSize: 12, color: "#4ade80" }}>
                    ✓ Feedback saved — agent will learn from this analysis
                  </div>
                )}
              </div>

              {/* Right — Results */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {!result && !loading && (
                  <div style={{ ...card, textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
                    <div style={{ color: "#555", fontSize: 14 }}>Upload a shelf image to begin AI analysis</div>
                    <div style={{ color: "#333", fontSize: 12, marginTop: 8 }}>Agent uses GPT-4o + {stats?.trainingExamples ?? 0} training examples</div>
                  </div>
                )}
                {loading && (
                  <div style={{ ...card, textAlign: "center", padding: 48 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #7c3aed", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                    <div style={{ color: "#a78bfa", fontSize: 14, fontWeight: 600 }}>GPT-4o Vision analyzing...</div>
                    <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>Detecting brands, prices, shelf share</div>
                  </div>
                )}
                {result && (
                  <>
                    {/* Summary */}
                    <div style={card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa" }}>Analysis Complete</div>
                        <div style={{ ...tag("#4ade80"), fontSize: 11 }}>Quality: {result.imageQuality.score}/100</div>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{result.rawSummary}</p>
                      <div style={{ marginTop: 8, fontSize: 11, color: "#555" }}>Model: {result.model} · ID: {result.id}</div>
                    </div>

                    {/* Detections */}
                    {result.detections.length > 0 && (
                      <div style={card}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#a78bfa" }}>Products Detected ({result.detections.length})</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {result.detections.map((d, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#0a0a0a", borderRadius: 10 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.confidence >= 80 ? "#4ade80" : "#fbbf24", flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{d.brand}</div>
                                <div style={{ fontSize: 11, color: "#555" }}>{d.product} · {d.company}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>{d.confidence}%</div>
                                {d.price_vnd && <div style={{ fontSize: 11, color: "#fbbf24" }}>{d.price_vnd.toLocaleString()}đ</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shelf Share */}
                    {result.shelfShare.length > 0 && (
                      <div style={card}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#a78bfa" }}>Shelf Share</div>
                        {result.shelfShare.map(s => (
                          <div key={s.brand} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                              <span style={{ color: "#e0e0e0" }}>{s.brand}</span>
                              <span style={{ color: "#a78bfa", fontWeight: 700 }}>{s.pct}%</span>
                            </div>
                            <div style={{ height: 6, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${s.pct}%`, background: "#7c3aed", borderRadius: 99 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations + Risks */}
                    {(result.recommendations.length > 0 || result.stockRisks.length > 0) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {result.recommendations.length > 0 && (
                          <div style={card}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#a78bfa" }}>Recommendations</div>
                            {result.recommendations.map((r, i) => (
                              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>
                                <span style={{ color: "#7c3aed", flexShrink: 0 }}>→</span>{r}
                              </div>
                            ))}
                          </div>
                        )}
                        {result.stockRisks.length > 0 && (
                          <div style={card}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#fbbf24" }}>Stock Risks</div>
                            {result.stockRisks.map((r, i) => (
                              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>
                                <span style={{ color: "#fbbf24", flexShrink: 0 }}>⚠</span>{r}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Training Tab ── */}
          {tab === "training" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ ...card, background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>How the agent learns</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7 }}>
                  1. Analyze images and rate them (4-5 stars) → auto-saved as training examples<br/>
                  2. Each new analysis uses the best examples as few-shot context for GPT-4o<br/>
                  3. More high-quality examples = more accurate detections<br/>
                  4. Agent improves continuously without retraining any model
                </div>
              </div>

              {stats?.exampleSummary.length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
                  <div style={{ color: "#555", fontSize: 14 }}>No training examples yet</div>
                  <div style={{ color: "#333", fontSize: 12, marginTop: 6 }}>Analyze images and rate them 4-5 stars to build the training set</div>
                </div>
              )}

              {stats?.exampleSummary.map(ex => (
                <div key={ex.id} style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ ...tag(ex.quality === "excellent" ? "#fbbf24" : "#4ade80") }}>{ex.quality}</span>
                      {ex.score && <span style={{ fontSize: 12, color: "#a78bfa" }}>{"★".repeat(ex.score)}{"☆".repeat(5 - ex.score)}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#ccc" }}>{ex.brands} brands detected</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Added: {new Date(ex.addedAt).toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleDeleteExample(ex.id)} style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* ── Stats Tab ── */}
          {tab === "stats" && stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {[
                  { label: "Total Analyses",     value: stats.totalAnalyses },
                  { label: "Training Examples",  value: stats.trainingExamples },
                  { label: "Avg Feedback Score", value: stats.avgFeedbackScore ? `${stats.avgFeedbackScore}/5` : "—" },
                  { label: "Top Brand",          value: stats.topBrands[0]?.brand ?? "—" },
                ].map(k => (
                  <div key={k.label} style={{ ...card, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#a78bfa", marginBottom: 4 }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Top brands */}
              {stats.topBrands.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#a78bfa" }}>Most Detected Brands</div>
                  {stats.topBrands.map(b => (
                    <div key={b.brand} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 120, fontSize: 13, color: "#e0e0e0" }}>{b.brand}</div>
                      <div style={{ flex: 1, height: 6, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(b.count / stats.topBrands[0].count) * 100}%`, background: "#7c3aed", borderRadius: 99 }} />
                      </div>
                      <div style={{ width: 30, fontSize: 12, color: "#555", textAlign: "right" }}>{b.count}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent analyses */}
              {stats.recentAnalyses.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#a78bfa" }}>Recent Analyses</div>
                  {stats.recentAnalyses.map(a => (
                    <div key={a.id} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: "1px solid #111" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{a.id} · {a.brands} brands · Quality {a.quality}/100</div>
                        <div style={{ fontSize: 12, color: "#ccc" }}>{a.summary}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "#555", flexShrink: 0 }}>
                        {a.score ? `${"★".repeat(a.score)}` : "unrated"}<br/>
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
