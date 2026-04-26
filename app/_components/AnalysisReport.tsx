"use client";

import { useEffect, useRef } from "react";
import { ANALYSIS_TASKS, TOTAL_ANALYSIS_PRICE, type TaskId } from "../_lib/arc";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportData {
  reportId: string;
  imageId: string;
  createdAt: string; // ISO
  walletAddress: string;
  imageName: string;
  totalPaid: number;
  proofTxHash: string;
  tasks: { id: TaskId; label: string; price: number; txHash: string; result: string }[];
  skus: {
    sku: string; product: string; brand: string; category: string;
    packSpec: string; facings: number; priceVND: number | null;
    matchedCompany: string; status: "Matched" | "Review" | "Missing";
    confidence: number;
  }[];
  shelfShare: { brand: string; pct: number }[];
  recommendations: string[];
  stockRisk: string[];
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
  report.tasks.forEach(t => rows.push([t.label, `$${t.price.toFixed(3)}`, t.txHash, t.result]));

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
                Storescope.ai · Shelf Analysis Report
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
                Save to Account
              </button>
              <button onClick={() => exportCSV(report)}
                style={{ padding: "8px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer" }}>
                Export CSV
              </button>
              <button onClick={() => exportJSON(report)}
                style={{ padding: "8px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer" }}>
                Export JSON
              </button>
              <button onClick={printReport}
                style={{ padding: "8px 14px", background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Print / PDF
              </button>
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
            {[
              { label: "Image ID",    value: report.imageId },
              { label: "Wallet",      value: `${report.walletAddress.slice(0, 8)}…${report.walletAddress.slice(-6)}` },
              { label: "Total Paid",  value: `$${report.totalPaid.toFixed(3)} USDC` },
              { label: "ARC Chain",   value: "Testnet · ID 5042002" },
            ].map(m => (
              <div key={m.label} style={{ background: "#0a0a0a", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Proof hash */}
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>Proof on ArcScan</span>
            <a href={`https://testnet.arcscan.app/tx/${report.proofTxHash}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "none" }}>
              {report.proofTxHash} ↗
            </a>
          </div>
        </div>

        {/* ── Summary stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "SKUs Detected",   value: String(report.skus.length),                                                    color: "#f0f0f0" },
            { label: "Matched",          value: String(report.skus.filter(s => s.status === "Matched").length),                color: "#4ade80" },
            { label: "Review Needed",    value: String(report.skus.filter(s => s.status === "Review").length),                 color: "#fbbf24" },
            { label: "Total Facings",    value: String(report.skus.reduce((a, s) => a + s.facings, 0)),                       color: "#a78bfa" },
            { label: "Avg Confidence",   value: Math.round(report.skus.reduce((a, s) => a + s.confidence, 0) / report.skus.length) + "%", color: "#38bdf8" },
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
            <div style={{ fontSize: 14, fontWeight: 700 }}>SKU Detection Results</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{report.skus.length} products detected · AI confidence scoring applied</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["SKU", "Product", "Brand", "Category", "Pack", "Facings", "Price (VND)", "Matched Company", "Confidence", "Status"].map(h => (
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
              <div style={{ fontSize: 14, fontWeight: 700 }}>Shelf Share Analysis</div>
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
              <div style={{ fontSize: 14, fontWeight: 700 }}>Stock Risk Alerts</div>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {report.stockRisk.length === 0 ? (
                <div style={{ fontSize: 13, color: "#4ade80" }}>No stock risks detected.</div>
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
            <div style={{ fontSize: 14, fontWeight: 700 }}>AI Recommendations</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Generated by storescope.ai Recommendation Engine</div>
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
            <div style={{ fontSize: 14, fontWeight: 700 }}>Task Payment Log</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>10 micro-transactions · All verified on ARC Testnet</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Task", "USDC Paid", "Transaction Hash", "Result"].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.tasks.map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ ...td, color: "#555", textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{t.label}</td>
                    <td style={{ ...td, fontWeight: 700, color: "#4ade80", textAlign: "center" }}>${t.price.toFixed(3)}</td>
                    <td style={{ ...td }}>
                      <a href={`https://testnet.arcscan.app/tx/${t.txHash}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", textDecoration: "none" }}>
                        {t.txHash.slice(0, 18)}…{t.txHash.slice(-6)} ↗
                      </a>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: "#888" }}>{t.result}</td>
                  </tr>
                ))}
                <tr style={{ background: "#0a0a0a" }}>
                  <td colSpan={2} style={{ ...td, fontWeight: 700, color: "#f0f0f0" }}>Total</td>
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
