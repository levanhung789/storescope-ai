"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import dynamic from "next/dynamic";
import { loadReports, deleteReport, exportCSV, exportJSON, printReport, type ReportData } from "../../_components/AnalysisReport";

const AnalysisReport = dynamic(() => import("../../_components/AnalysisReport"), { ssr: false });
const WalletButton   = dynamic(() => import("../../_components/WalletButton"),    { ssr: false });

export default function ReportsPage() {
  const { address, isConnected } = useAccount();
  const [reports, setReports]   = useState<ReportData[]>([]);
  const [selected, setSelected] = useState<ReportData | null>(null);

  useEffect(() => {
    if (address) setReports(loadReports(address));
  }, [address]);

  const handleDelete = (id: string) => {
    if (!address) return;
    deleteReport(address, id);
    setReports(prev => prev.filter(r => r.reportId !== id));
    if (selected?.reportId === id) setSelected(null);
  };

  const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 14 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#080808", color: "#f0f0f0", fontFamily: "inherit" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: "#0a0a0a", borderRight: "1px solid #1f1f1f", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid #1f1f1f" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.04em" }}>storescope</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", letterSpacing: "-0.04em" }}>.ai</span>
          </a>
        </div>
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Dashboard",   href: "/dashboard",          active: false },
            { label: "AI Analysis", href: "/dashboard/analysis", active: false },
            { label: "My Reports",  href: "/dashboard/reports",  active: true  },
            { label: "Store Layout",href: "/layout-editor",      active: false },
            { label: "Forum",       href: "/forum",              active: false },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: "block", padding: "9px 12px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: item.active ? 600 : 400, background: item.active ? "rgba(124,58,237,0.12)" : "transparent", color: item.active ? "#a78bfa" : "#666", border: item.active ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent" }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "12px 10px", borderTop: "1px solid #1f1f1f" }}>
          <Link href="/" style={{ display: "block", padding: "8px 12px", fontSize: 12, color: "#555", textDecoration: "none" }}>Log out</Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid #1f1f1f", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3 }}>Personal Account</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>My Reports</h2>
          </div>
          <WalletButton />
        </header>

        <div style={{ padding: 24, display: "flex", gap: 20, minHeight: 0 }}>

          {/* Left: report list */}
          <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

            {!isConnected ? (
              <div style={{ ...card, padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>Connect wallet to view your reports.</div>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ ...card, padding: 32, textAlign: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>No reports saved yet.</div>
                <Link href="/dashboard/analysis" style={{ fontSize: 13, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>
                  Run an analysis →
                </Link>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {reports.length} report{reports.length !== 1 ? "s" : ""} · Wallet {address?.slice(0, 8)}…
                </div>
                {reports.map(r => (
                  <div key={r.reportId}
                    onClick={() => setSelected(r)}
                    style={{
                      ...card, padding: "14px 16px", cursor: "pointer",
                      borderColor: selected?.reportId === r.reportId ? "rgba(124,58,237,0.4)" : "#1f1f1f",
                      background: selected?.reportId === r.reportId ? "rgba(124,58,237,0.06)" : "#111",
                      transition: "all 0.15s",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>{r.reportId}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{r.imageName}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>${r.totalPaid.toFixed(3)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <span style={{ fontSize: 10, color: "#888", background: "#1a1a1a", padding: "2px 8px", borderRadius: 999 }}>
                        {r.skus.length} SKUs
                      </span>
                      <span style={{ fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.08)", padding: "2px 8px", borderRadius: 999 }}>
                        {r.skus.filter(s => s.status === "Matched").length} Matched
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="no-print" style={{ display: "flex", gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => exportCSV(r)}
                        style={{ flex: 1, fontSize: 10, padding: "5px 0", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#888", cursor: "pointer" }}>
                        CSV
                      </button>
                      <button onClick={() => exportJSON(r)}
                        style={{ flex: 1, fontSize: 10, padding: "5px 0", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#888", cursor: "pointer" }}>
                        JSON
                      </button>
                      <button onClick={() => handleDelete(r.reportId)}
                        style={{ flex: 1, fontSize: 10, padding: "5px 0", background: "#0a0a0a", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#ef4444", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Right: report detail */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selected ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }} className="no-print">
                  <div style={{ fontSize: 13, color: "#555" }}>
                    Viewing: <strong style={{ color: "#f0f0f0" }}>{selected.reportId}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => exportCSV(selected)}
                      style={{ padding: "7px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer" }}>
                      Export CSV
                    </button>
                    <button onClick={() => exportJSON(selected)}
                      style={{ padding: "7px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer" }}>
                      Export JSON
                    </button>
                    <button onClick={printReport}
                      style={{ padding: "7px 14px", background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Print / PDF
                    </button>
                  </div>
                </div>
                <AnalysisReport report={selected} />
              </div>
            ) : (
              <div style={{ ...card, padding: 64, textAlign: "center", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <div style={{ fontSize: 14, color: "#555" }}>Select a report to view details</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
