"use client";

import { useEffect, useRef } from "react";
import { ANALYSIS_TASKS, TOTAL_ANALYSIS_PRICE, type TaskId } from "../_lib/arc";
import { useLang } from "../_lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportData {
  reportId: string;
  imageId: string;
  createdAt: string; // ISO
  walletAddress: string;
  imageName: string;
  totalPaid: number;
  proofTxHash: string;
  tasks: { id: TaskId; label: string; price: number; txHash?: string; result: string }[];
  skus: {
    sku: string; product: string; brand: string; category: string;
    packSpec: string; facings: number; priceVND: number | null;
    matchedCompany: string; status: "Matched" | "Review" | "Missing";
    confidence: number;
  }[];
  shelfShare: { brand: string; pct: number }[];
  recommendations: string[];
  stockRisk: string[];
  // Vision Agent 8-step pipeline result (optional — present when using Vision Agent)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visionPipeline?: Record<string, any>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function vnd(n: number) { return n.toLocaleString("vi-VN") + " đ"; }
function scoreColor(n: number) { return n >= 85 ? "#4ade80" : n >= 70 ? "#fbbf24" : "#f87171"; }
function statusBg(s: string) {
  if (s === "Matched") return { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" };
  if (s === "Review")  return { background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" };
  return { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" };
}

// ── Export helpers ─────────────────────────────────────────────────────────────

export function exportCSV(report: ReportData) {
  const rows: string[][] = [];
  rows.push(["STORESCOPE.AI — SHELF ANALYSIS REPORT"]);
  rows.push(["Report ID", report.reportId]);
  rows.push(["Image ID", report.imageId]);
  rows.push(["Date", new Date(report.createdAt).toLocaleString()]);
  rows.push(["Wallet", report.walletAddress]);
  rows.push(["Total Paid", `$${report.totalPaid.toFixed(3)} USDC`]);
  rows.push(["Proof Tx", report.proofTxHash]);
  rows.push([]);
  rows.push(["--- SKU DETECTION ---"]);
  rows.push(["SKU", "Product", "Brand", "Category", "Pack Spec", "Facings", "Price (VND)", "Matched Company", "Status", "Confidence"]);
  report.skus.forEach(s => rows.push([
    s.sku, s.product, s.brand, s.category, s.packSpec,
    String(s.facings), s.priceVND ? vnd(s.priceVND) : "—", s.matchedCompany, s.status, `${s.confidence}%`,
  ]));
  rows.push([]);
  rows.push(["--- SHELF SHARE ---"]);
  rows.push(["Brand/Company", "Share (%)"]);
  report.shelfShare.forEach(s => rows.push([s.brand, `${s.pct}%`]));
  rows.push([]);
  rows.push(["--- RECOMMENDATIONS ---"]);
  report.recommendations.forEach((r, i) => rows.push([`${i + 1}`, r]));
  rows.push([]);
  rows.push(["--- STOCK RISK ---"]);
  report.stockRisk.forEach((r, i) => rows.push([`${i + 1}`, r]));
  rows.push([]);
  rows.push(["--- TASK LOG ---"]);
  rows.push(["Task", "Price (USDC)", "Tx Hash", "Result"]);
  report.tasks.forEach(t => rows.push([t.label, `$${t.price.toFixed(3)}`, t.txHash ?? "", t.result]));

  const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `storescope-report-${report.reportId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJSON(report: ReportData) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `storescope-report-${report.reportId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printReport() {
  window.print();
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = (wallet: string) => `storescope-reports-${wallet.toLowerCase()}`;

export function saveReport(report: ReportData) {
  try {
    const key = STORAGE_KEY(report.walletAddress);
    const existing: ReportData[] = JSON.parse(localStorage.getItem(key) || "[]");
    const updated = [report, ...existing.filter(r => r.reportId !== report.reportId)].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch { return false; }
}

export function loadReports(walletAddress: string): ReportData[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(walletAddress)) || "[]");
  } catch { return []; }
}

export function deleteReport(walletAddress: string, reportId: string) {
  try {
    const key = STORAGE_KEY(walletAddress);
    const existing: ReportData[] = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(existing.filter(r => r.reportId !== reportId)));
  } catch { /* ignore */ }
}

// ── Report View Component ─────────────────────────────────────────────────────

interface Props {
  report: ReportData;
  onSaved?: () => void;
}

export default function AnalysisReport({ report, onSaved }: Props) {
  const { t } = useLang();
  const printRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    saveReport(report);
    onSaved?.();
  };

  const th: React.CSSProperties = {
    padding: "10px 14px", fontSize: 11, color: "#555",
    textTransform: "uppercase", letterSpacing: "0.1em",
    fontWeight: 600, textAlign: "left", borderBottom: "1px solid #1f1f1f",
    background: "#0a0a0a",
  };
  const td: React.CSSProperties = {
    padding: "11px 14px", fontSize: 13, color: "#e0e0e0",
    borderBottom: "1px solid #111", verticalAlign: "middle",
  };
  const card: React.CSSProperties = {
    background: "#111", border: "1px solid #1f1f1f", borderRadius: 14, overflow: "hidden",
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #storescope-report, #storescope-report * { visibility: visible !important; }
          #storescope-report { position: absolute; inset: 0; background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd !important; color: #000 !important; }
          th { background: #f5f5f5 !important; }
        }
      `}</style>

      <div id="storescope-report" ref={printRef} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Header ── */}
        <div style={{ ...card, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>
                {t("report.subtitle")}
              </div>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Report #{report.reportId}
              </h2>
              <div style={{ fontSize: 12, color: "#555" }}>
                {new Date(report.createdAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
              </div>
            </div>
            {/* Export buttons */}
            <div className="no-print" style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSave}
                style={{ padding: "8px 14px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {t("report.save")}
              </button>
              <button onClick={() => exportCSV(report)}
                style={{ padding: "8px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer" }}>
                {t("report.csv")}
              </button>
              <button onClick={() => exportJSON(report)}
                style={{ padding: "8px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer" }}>
                {t("report.json")}
              </button>
              <button onClick={printReport}
                style={{ padding: "8px 14px", background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {t("report.print")}
              </button>
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
            {[
              { label: t("report.imageId"),   value: report.imageId },
              { label: t("report.wallet"),     value: report.walletAddress.startsWith("0x") && report.walletAddress.length === 42
                  ? `${report.walletAddress.slice(0, 8)}…${report.walletAddress.slice(-6)}`
                  : (report.walletAddress || t("report.notConnected")) },
              { label: t("report.totalPaid"), value: `$${report.totalPaid.toFixed(3)} USDC` },
              { label: t("report.arcChain"),  value: "Testnet · ID 5042002" },
            ].map(m => (
              <div key={m.label} style={{ background: "#0a0a0a", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Proof hash */}
          {report.proofTxHash && report.proofTxHash.startsWith("0x") && report.proofTxHash.length === 66 ? (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, flexShrink: 0 }}>{t("report.proof")}</span>
              <a href={`https://testnet.arcscan.app/tx/${report.proofTxHash}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {report.proofTxHash.slice(0, 22)}…{report.proofTxHash.slice(-8)} ↗
              </a>
            </div>
          ) : (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid #1f1f1f", borderRadius: 10 }}>
              <span style={{ fontSize: 11, color: "#555" }}>{t("report.proofPending")}</span>
            </div>
          )}
        </div>

        {/* ── Vision Agent 8-step Report (shown when Vision Agent was used) ── */}
        {report.visionPipeline && <VisionPipelineReport p={report.visionPipeline} t={t} />}

        {/* ── Summary stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: t("report.skusDetected"), value: String(report.skus.length),                                                    color: "#f0f0f0" },
            { label: t("report.matched"),      value: String(report.skus.filter(s => s.status === "Matched").length),                color: "#4ade80" },
            { label: t("report.reviewNeeded"), value: String(report.skus.filter(s => s.status === "Review").length),                 color: "#fbbf24" },
            { label: t("report.totalFacings"), value: String(report.skus.reduce((a, s) => a + s.facings, 0)),                       color: "#a78bfa" },
            { label: t("report.avgConf"),      value: Math.round(report.skus.reduce((a, s) => a + s.confidence, 0) / report.skus.length) + "%", color: "#38bdf8" },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── SKU Detection Table ── */}
        <div style={card}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1f1f1f" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t("report.skuTitle")}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{report.skus.length} {t("report.skuSub")}</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[t("report.colSku"),t("report.colProduct"),t("report.colBrand"),t("report.colCategory"),t("report.colPack"),t("report.colFacings"),t("report.colPrice"),t("report.colCompany"),t("report.colConf"),t("report.colStatus")].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.skus.map(s => (
                  <tr key={s.sku}>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "#888" }}>{s.sku}</td>
                    <td style={{ ...td, maxWidth: 200 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{s.product}</div>
                    </td>
                    <td style={td}>{s.brand}</td>
                    <td style={{ ...td, color: "#888" }}>{s.category}</td>
                    <td style={{ ...td, color: "#888" }}>{s.packSpec}</td>
                    <td style={{ ...td, fontWeight: 700, color: "#a78bfa", textAlign: "center" }}>{s.facings}</td>
                    <td style={{ ...td, color: "#888" }}>{s.priceVND ? vnd(s.priceVND) : "—"}</td>
                    <td style={{ ...td, fontSize: 12, color: "#888" }}>{s.matchedCompany}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(s.confidence) }}>{s.confidence}%</span>
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <span style={{ ...statusBg(s.status), fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Shelf Share + Recommendations ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Shelf share */}
          <div style={card}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1f1f1f" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t("report.shelfShare")}</div>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {report.shelfShare.map(s => (
                <div key={s.brand}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                    <span style={{ color: "#e0e0e0" }}>{s.brand}</span>
                    <span style={{ fontWeight: 700, color: "#a78bfa" }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 8, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${s.pct}%`, background: s.pct >= 40 ? "#7c3aed" : s.pct >= 20 ? "#f59e0b" : "#555", borderRadius: 99, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock risk */}
          <div style={card}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1f1f1f" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t("report.stockRisk")}</div>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {report.stockRisk.length === 0 ? (
                <div style={{ fontSize: 13, color: "#4ade80" }}>{t("report.noRisk")}</div>
              ) : report.stockRisk.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10 }}>
                  <span style={{ color: "#f87171", fontSize: 14, flexShrink: 0 }}>▲</span>
                  <span style={{ fontSize: 13, color: "#e0e0e0" }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div style={card}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1f1f1f" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t("report.aiRec")}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{t("report.aiRecSub")}</div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {report.recommendations.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 16px", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#a78bfa", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Task log ── */}
        <div style={card}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1f1f1f" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t("report.taskLog")}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{t("report.taskLogSub")}</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", t("report.colTask"), t("report.colPaid"), t("report.colTxHash"), t("report.colResult")].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.tasks.map((task, i) => (
                  <tr key={task.id}>
                    <td style={{ ...td, color: "#555", textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{task.label}</td>
                    <td style={{ ...td, fontWeight: 700, color: "#4ade80", textAlign: "center" }}>${task.price.toFixed(3)}</td>
                    <td style={{ ...td }}>
                      {task.txHash
                        ? <a href={`https://testnet.arcscan.app/tx/${task.txHash}`} target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", textDecoration: "none" }}>
                            {task.txHash.slice(0, 18)}…{task.txHash.slice(-6)} ↗
                          </a>
                        : <span style={{ fontSize: 11, color: "#444" }}>{t("report.recording")}</span>
                      }
                    </td>
                    <td style={{ ...td, fontSize: 12, color: "#888" }}>{task.result}</td>
                  </tr>
                ))}
                <tr style={{ background: "#0a0a0a" }}>
                  <td colSpan={2} style={{ ...td, fontWeight: 700, color: "#f0f0f0" }}>{t("report.total")}</td>
                  <td style={{ ...td, fontWeight: 800, color: "#4ade80", fontSize: 15 }}>${report.totalPaid.toFixed(3)}</td>
                  <td colSpan={2} style={td} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Vision Agent 8-Step Pipeline Report ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VisionPipelineReport({ p, t }: { p: Record<string, any>; t: (k: string) => string }) {
  const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 14, overflow: "hidden", marginBottom: 0 };
  const stepHeader = (icon: string, n: number, label: string, sub?: string): React.CSSProperties => ({ all: "unset" as "unset" });
  void stepHeader;

  const riskColor = (r: string) => r === "high" ? "#ef4444" : r === "medium" ? "#f97316" : r === "low" ? "#fbbf24" : "#4ade80";
  const chip = (color: string, text: string) => (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `${color}18`, border: `1px solid ${color}40`, color, display: "inline-block" }}>{text}</span>
  );

  const th2: React.CSSProperties = { padding: "8px 12px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, textAlign: "left", background: "#0a0a0a", borderBottom: "1px solid #1f1f1f" };
  const td2: React.CSSProperties = { padding: "10px 12px", fontSize: 12, color: "#e0e0e0", borderBottom: "1px solid #111", verticalAlign: "middle" };

  function StepBox({ n, icon, title, children }: { n: number; icon: string; title: string; children: React.ReactNode }) {
    return (
      <div style={card}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 10, background: "rgba(124,58,237,0.04)" }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("report.step")} {n}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{title}</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 8px", borderRadius: 999 }}>{t("report.done")}</span>
        </div>
        <div style={{ padding: "16px 18px" }}>{children}</div>
      </div>
    );
  }

  const q     = p.step1_quality ?? {};
  const persp = q.perspective ?? {};
  const cnt   = p.step2_count ?? {};
  const skus  = p.step3_skus ?? [];
  const facs  = p.step4_facings ?? [];
  const pos   = p.step5_positions ?? [];
  const sos   = p.step6_shelfShare ?? [];
  const osa   = p.step7_osa ?? [];
  const recs  = p.step8_recommendations ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "#1f1f1f" }} />
        <div style={{ fontSize: 11, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>{t("report.visionAgent")}</div>
        <div style={{ flex: 1, height: 1, background: "#1f1f1f" }} />
      </div>

      {/* Step 1 */}
      <StepBox n={1} icon="🔍" title={`${t("task.quality.label")} & ${t("report.perspective")}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[
                { k: t("report.score"),    v: `${q.score ?? "—"}/100` },
                { k: t("report.angle"),    v: q.angle ?? "—" },
                { k: t("report.lighting"), v: q.lighting ?? "—" },
                { k: t("report.blur"),     v: q.blur ?? "—" },
              ].map(r => (
                <tr key={r.k}>
                  <td style={{ ...td2, color: "#555", width: 140 }}>{r.k}</td>
                  <td style={{ ...td2, fontWeight: 600, color: "#f0f0f0" }}>{r.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {persp.shootingAngle !== undefined && (
            <div style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, marginBottom: 8 }}>{t("report.perspective")}</div>
              {[
                { k: t("report.angle"),      v: `~${persp.shootingAngle}°` },
                { k: t("report.corrFactor"), v: persp.correctionFactor ?? 1 },
                { k: t("report.nearFar"),    v: `${persp.nearFarRatio ?? 1}×` },
              ].map(r => (
                <div key={r.k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#555" }}>{r.k}</span>
                  <span style={{ color: "#818cf8", fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
              {persp.depthVisible && <div style={{ marginTop: 8, fontSize: 11, color: "#fbbf24" }}>⚠ {persp.depthVisibleNote}</div>}
            </div>
          )}
        </div>
        {q.issues?.length > 0 && <div style={{ marginTop: 10, fontSize: 12, color: "#fbbf24" }}>{q.issues.join(", ")}</div>}
      </StepBox>

      {/* Step 2 */}
      <StepBox n={2} icon="📦" title={t("task.shelf_detect.desc")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
          {[
            { label: t("report.totalUnits"),  value: cnt.totalUnits ?? "—" },
            { label: t("report.visibleUnits"),value: cnt.visibleUnits ?? "—" },
            { label: t("report.shelfDepth"),  value: `~${cnt.estimatedDepth ?? 1}` },
            { label: t("report.shelfRows"),   value: cnt.shelfRows ?? "—" },
          ].map(k => (
            <div key={k.label} style={{ background: "#0a0a0a", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#a78bfa" }}>{k.value}</div>
            </div>
          ))}
        </div>
        {cnt.note && <div style={{ fontSize: 12, color: "#666" }}>{cnt.note}</div>}
      </StepBox>

      {/* Step 3 */}
      {skus.length > 0 && (
        <StepBox n={3} icon="🏷️" title={`${t("task.sku_detect.label")} — ${skus.length} SKUs`}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{[t("report.colBrand"),t("report.sku"),t("report.colCategory"),t("report.colConf"),t("report.colPrice")].map(h => <th key={h} style={th2}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {skus.map((s: {brand:string;sku:string;sector:string;confidence:number;price_vnd:number|null}, i: number) => (
                  <tr key={i}>
                    <td style={{ ...td2, fontWeight: 700 }}>{s.brand}</td>
                    <td style={td2}>{s.sku}</td>
                    <td style={{ ...td2, color: "#818cf8" }}>{s.sector}</td>
                    <td style={{ ...td2, textAlign: "center" }}>
                      <span style={{ color: s.confidence >= 85 ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>{s.confidence}%</span>
                    </td>
                    <td style={{ ...td2, color: "#fbbf24" }}>{s.price_vnd ? `${Number(s.price_vnd).toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StepBox>
      )}

      {/* Step 4 */}
      {facs.length > 0 && (
        <StepBox n={4} icon="📐" title="Facing Count (có hiệu chỉnh phối cảnh)">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{[t("report.colBrand"),t("report.sku"),t("report.facingRaw"),t("report.facingAdj"),t("report.depth"),t("report.note")].map(h => <th key={h} style={th2}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {facs.map((f: {brand:string;sku:string;facing:number;facingAdjusted:number;depth:number;isDepthVisible:boolean;perspectiveNote:string}, i: number) => (
                  <tr key={i}>
                    <td style={{ ...td2, fontWeight: 700 }}>{f.brand}</td>
                    <td style={td2}>{f.sku}</td>
                    <td style={{ ...td2, textAlign: "center", color: f.facingAdjusted !== f.facing ? "#555" : "#a78bfa", textDecoration: f.facingAdjusted !== f.facing ? "line-through" : "none" }}>{f.facing}</td>
                    <td style={{ ...td2, textAlign: "center", fontWeight: 800, color: "#a78bfa", fontSize: 15 }}>{f.facingAdjusted}</td>
                    <td style={{ ...td2, textAlign: "center", color: "#555" }}>{f.depth}</td>
                    <td style={{ ...td2, fontSize: 11, color: "#666" }}>
                      {f.isDepthVisible && <span style={{ color: "#fbbf24", marginRight: 4 }}>depth visible</span>}
                      {f.perspectiveNote}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: "#0a0a0a" }}>
                  <td colSpan={3} style={{ ...td2, fontWeight: 700, color: "#f0f0f0" }}>{t("report.total")}</td>
                  <td style={{ ...td2, fontWeight: 800, color: "#a78bfa", fontSize: 15, textAlign: "center" }}>{p.totalFacings ?? facs.reduce((s: number, f: {facingAdjusted:number}) => s + (f.facingAdjusted ?? 0), 0)}</td>
                  <td colSpan={2} style={td2} />
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#818cf8", padding: "8px 12px", background: "rgba(129,140,248,0.06)", borderRadius: 8 }}>
            ℹ️ Facing (adj) = sau hiệu chỉnh góc chụp + loại trừ depth — dùng để tính Share of Shelf
          </div>
        </StepBox>
      )}

      {/* Step 5 */}
      {pos.length > 0 && (
        <StepBox n={5} icon="📍" title={t("task.layout_sim.label")}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{[t("report.colBrand"),t("report.sku"),t("report.tier"),t("report.note")].map(h => <th key={h} style={th2}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {pos.map((p2: {brand:string;sku:string;tier:string;tierNote:string}, i: number) => (
                  <tr key={i}>
                    <td style={{ ...td2, fontWeight: 700 }}>{p2.brand}</td>
                    <td style={td2}>{p2.sku}</td>
                    <td style={td2}>{chip(p2.tier === "eye-level" ? "#4ade80" : p2.tier === "end-cap" ? "#fbbf24" : "#818cf8", p2.tier + (p2.tier === "eye-level" ? " ⭐" : ""))}</td>
                    <td style={{ ...td2, color: "#666" }}>{p2.tierNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StepBox>
      )}

      {/* Step 6 */}
      {sos.length > 0 && (
        <StepBox n={6} icon="📊" title={`${t("report.shelfShare")} — ${p.totalFacings ?? "?"} ${t("report.facings")}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sos.map((s: {brand:string;facings:number;shareOfShelf:number;blockLength:string}) => (
              <div key={s.brand}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{s.brand}</span>
                    <span style={{ fontSize: 11, color: "#555", marginLeft: 10 }}>{s.facings} {t("report.facings")} · {s.blockLength}</span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>{s.shareOfShelf}%</span>
                </div>
                <div style={{ height: 10, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.shareOfShelf}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
          {sos.length === 2 && Math.abs(sos[0].shareOfShelf - sos[1].shareOfShelf) < 5 && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#fbbf24", padding: "8px 12px", background: "rgba(251,191,36,0.06)", borderRadius: 8 }}>
              ⚡ Kệ cạnh tranh trực tiếp — SoS chênh lệch &lt;5% — cần monitor thường xuyên
            </div>
          )}
        </StepBox>
      )}

      {/* Step 7 */}
      <StepBox n={7} icon="⚠️" title={`${t("task.stock_risk.label")} — OSA`}>
        {osa.filter((o: {riskLevel:string}) => o.riskLevel !== "none").length === 0
          ? <div style={{ fontSize: 13, color: "#4ade80" }}>✓ {t("report.noRisk")}</div>
          : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{[t("report.colBrand"),t("report.sku"),t("report.status"),t("report.riskLevel"),t("report.remaining"),t("report.action")].map(h => <th key={h} style={th2}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {osa.filter((o: {riskLevel:string}) => o.riskLevel !== "none").map((o: {brand:string;sku:string;status:string;riskLevel:string;facingsRemaining:number;action:string}, i: number) => (
                  <tr key={i}>
                    <td style={{ ...td2, fontWeight: 700 }}>{o.brand}</td>
                    <td style={td2}>{o.sku}</td>
                    <td style={td2}>{chip(o.status === "out-of-stock" ? "#ef4444" : o.status === "low-stock" ? "#fbbf24" : "#4ade80", o.status)}</td>
                    <td style={td2}>{chip(riskColor(o.riskLevel), o.riskLevel.toUpperCase())}</td>
                    <td style={{ ...td2, textAlign: "center", fontWeight: 700, color: riskColor(o.riskLevel) }}>{o.facingsRemaining}</td>
                    <td style={{ ...td2, color: "#888" }}>{o.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </StepBox>

      {/* Step 8 */}
      {recs.length > 0 && (
        <StepBox n={8} icon="💡" title={t("task.recommend.label")}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{[t("report.priority"),t("report.action"),t("report.reason"),t("report.category")].map(h => <th key={h} style={th2}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {recs.map((r: {priority:string;action:string;reason:string;category:string}, i: number) => (
                <tr key={i}>
                  <td style={td2}>{chip(r.priority === "high" ? "#ef4444" : r.priority === "medium" ? "#fbbf24" : "#4ade80", r.priority === "high" ? "🔴 HIGH" : r.priority === "medium" ? "🟡 MED" : "🟢 LOW")}</td>
                  <td style={{ ...td2, fontWeight: 600, color: "#f0f0f0" }}>{r.action}</td>
                  <td style={{ ...td2, color: "#888" }}>{r.reason}</td>
                  <td style={td2}>{chip("#818cf8", r.category)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </StepBox>
      )}
    </div>
  );
}
