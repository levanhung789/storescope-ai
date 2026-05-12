"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot, Shield, Zap, Play, Pause, Activity,
  DollarSign, Clock, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Settings, ExternalLink, Loader2,
} from "lucide-react";
import {
  loadAgentPolicy, saveAgentPolicy, loadAgentLog, appendAgentLog,
  spentToday, withinPolicy,
  type AgentPolicy, type AgentTx,
} from "../../_lib/agent";
import { loadCircleSession } from "../../_lib/circle";

const ANALYSIS_PRICE = 0.025;
const card: React.CSSProperties = {
  background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 24,
};
const S = { color: "#555", fontSize: 12 } as const;

export default function AgentPage() {
  const [policy, setPolicy]     = useState<AgentPolicy | null>(null);
  const [logs, setLogs]         = useState<AgentTx[]>([]);
  const [balance, setBalance]   = useState<string>("--");
  const [running, setRunning]       = useState(false);
  const [status, setStatus]         = useState("");
  const [statusType, setStatusType] = useState<"idle"|"ok"|"err">("idle");
  const [editOpen, setEditOpen]     = useState(false);
  const [imageB64, setImageB64]     = useState<string | null>(null);
  const [imagePreview, setPreview]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [fMaxPerTx, setFMaxPerTx]   = useState("0.025");
  const [fMaxPerDay, setFMaxPerDay] = useState("1.00");
  const [fAutoRun, setFAutoRun]     = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const [fetchingHash, setFetchingHash] = useState<string | null>(null);

  const fetchTxHash = async (circleTxId: string, logId: string) => {
    setFetchingHash(logId);
    try {
      const res  = await fetch(`/api/circle/transfer?txId=${circleTxId}`);
      const data = await res.json() as { txHash?: string | null };
      if (data.txHash) {
        const updated = loadAgentLog().map(t =>
          t.id === logId ? { ...t, txHash: data.txHash! } : t
        );
        localStorage.setItem("storescope-agent-log", JSON.stringify(updated));
        setLogs(updated);
      }
    } finally {
      setFetchingHash(null);
    }
  };

  useEffect(() => {
    const logs  = loadAgentLog();
    const p     = loadAgentPolicy();
    const cs    = loadCircleSession();
    setLogs(logs);
    setPolicy(p);
    if (p) { setFMaxPerTx(String(p.maxPerTx)); setFMaxPerDay(String(p.maxPerDay)); setFAutoRun(p.autoRun); }

    if (cs?.walletId) {
      fetch(`/api/circle/balance?walletId=${cs.walletId}&address=${cs.walletAddress}`)
        .then(r => r.json())
        .then(d => setBalance(d.usdc ?? "--"))
        .catch(() => setBalance("--"));
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const reader = new FileReader();
    reader.onload = ev => setImageB64((ev.target?.result as string)?.split(",")[1] ?? null);
    reader.readAsDataURL(file);
  };

  const savePolicy = () => {
    const cs = loadCircleSession();
    if (!cs) { alert("Please connect Circle Wallet first."); return; }
    const now = new Date().toISOString();
    const p: AgentPolicy = {
      enabled:       true,
      walletId:      cs.walletId,
      walletAddress: cs.walletAddress,
      maxPerTx:      Number(fMaxPerTx),
      maxPerDay:     Number(fMaxPerDay),
      autoRun:       fAutoRun,
      allowlist:     ["0x1234567890123456789012345678901234567890"],
      createdAt:     policy?.createdAt ?? now,
      updatedAt:     now,
    };
    saveAgentPolicy(p);
    setPolicy(p);
    setEditOpen(false);
  };

  const toggleAgent = () => {
    if (!policy) { setEditOpen(true); return; }
    const p = { ...policy, enabled: !policy.enabled, updatedAt: new Date().toISOString() };
    saveAgentPolicy(p);
    setPolicy(p);
  };

  const runAgent = async () => {
    if (!policy || running) return;
    const check = withinPolicy(policy, ANALYSIS_PRICE, logs);
    if (!check.allowed) { setStatus(`Policy blocked: ${check.reason}`); return; }

    setRunning(true);
    setStatusType("idle");
    setStatus("Agent: verifying policy...");

    const txId = `agent-${Date.now()}`;
    try {
      setStatus("Agent: sending x402 payment request...");
      const res = await fetch("/api/agent/run", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId:    policy.walletId,
          imageBase64: imageB64 ?? undefined,
          policy: {
            maxPerTx:   policy.maxPerTx,
            maxPerDay:  policy.maxPerDay,
            spentToday: spentToday(logs),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Agent run failed");
      }

      const tx: AgentTx = {
        id:        txId,
        timestamp: new Date().toISOString(),
        type:      "analysis",
        amount:    ANALYSIS_PRICE,
        txId:      data.payment?.txId ?? null,
        txHash:    data.payment?.txHash ?? null,
        status:    "success",
        note:      `Shelf analysis · $${ANALYSIS_PRICE} USDC`,
      };
      appendAgentLog(tx);
      setLogs(loadAgentLog());
      setStatusType("ok");
      setStatus(`Payment confirmed — $${ANALYSIS_PRICE} USDC · txId: ${data.payment?.txId?.slice(0,12)}...`);

      fetch(`/api/circle/balance?walletId=${policy.walletId}&address=${policy.walletAddress}`)
        .then(r => r.json()).then(d => setBalance(d.usdc ?? "--"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const tx: AgentTx = {
        id: txId, timestamp: new Date().toISOString(),
        type: "analysis", amount: 0,
        txId: null, txHash: null,
        status: "failed", note: msg,
      };
      appendAgentLog(tx);
      setLogs(loadAgentLog());
      setStatusType("err");
      setStatus(msg);
    } finally {
      setRunning(false);
    }
  };

  const todaySpent = spentToday(logs);
  const isActive   = policy?.enabled ?? false;

  const AGENT_COLOR = "#6366f1";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#080808", color: "#f0f0f0" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: "#0a0a0a", borderRight: "1px solid #1f1f1f", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 14px", borderBottom: "1px solid #1f1f1f" }}>
          <a href="/" style={{ textDecoration: "none", display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="StoreScope AI" style={{ height: 56, width: "auto", objectFit: "contain", filter: "invert(1)" }} />
          </a>
        </div>
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Dashboard",   href: "/dashboard" },
            { label: "AI Analysis", href: "/dashboard/analysis" },
            { label: "AI Agent",    href: "/dashboard/agent", active: true },
            { label: "Store Layout",href: "/layout-editor" },
            { label: "Forum",       href: "/forum" },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{
              display: "block", padding: "9px 12px", borderRadius: 10,
              textDecoration: "none", fontSize: 13,
              fontWeight: item.active ? 600 : 400,
              background: item.active ? "rgba(99,102,241,0.12)" : "transparent",
              color: item.active ? "#818cf8" : "#666",
              border: item.active ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
            }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid #1f1f1f" }}>
          <Link href="/" style={{ display: "block", padding: "8px 12px", fontSize: 12, color: "#555", textDecoration: "none" }}>Log out</Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={22} style={{ color: AGENT_COLOR }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em" }}>Circle AI Agent</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#555" }}>Powered by Circle Agent Stack · ARC Testnet</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#888", fontSize: 13, cursor: "pointer" }}>
              <Settings size={14} /> Policy
            </button>
            <button onClick={toggleAgent} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 20px", border: "none", borderRadius: 10,
              background: isActive ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
              color: isActive ? "#f87171" : "#818cf8",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              {isActive ? <><Pause size={14} /> Pause Agent</> : <><Play size={14} /> Activate Agent</>}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { icon: <Activity size={18} />, label: "Status", value: isActive ? "Active" : "Paused", color: isActive ? "#4ade80" : "#888" },
            { icon: <DollarSign size={18} />, label: "Spent Today", value: `$${todaySpent.toFixed(3)} USDC`, color: "#a78bfa" },
            { icon: <Shield size={18} />, label: "Daily Limit", value: `$${policy?.maxPerDay ?? "--"} USDC`, color: "#6366f1" },
            { icon: <Zap size={18} />, label: "Wallet Balance", value: `${balance} USDC`, color: "#fbbf24" },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: 18 }}>
              <div style={{ color: "#555", marginBottom: 10 }}>{s.icon}</div>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* x402 Endpoint info + Run button */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* x402 endpoint */}
          <div style={card}>
            <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>x402 Payment Endpoint</p>
            <div style={{ background: "#0a0a0a", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 11, color: "#555", marginBottom: 4 }}>POST</p>
              <code style={{ fontSize: 12, color: "#818cf8" }}>/api/agent/analyze</code>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["Scheme", "circle-arc"],
                ["Price", "$0.025 USDC"],
                ["Network", "ARC Testnet"],
                ["Header", "X-Agent-Wallet-Id"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#555" }}>{k}</span>
                  <span style={{ color: "#888", fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Run agent */}
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>Run Agent Manually</p>

            {/* Image upload */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageSelect} />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "1px dashed #2a2a2a", borderRadius: 10, cursor: "pointer",
                overflow: "hidden", minHeight: 90,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#0a0a0a", transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = AGENT_COLOR)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="shelf" style={{ width: "100%", maxHeight: 140, objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#555" }}>Click to upload shelf image</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#444" }}>Optional — agent runs without image too</p>
                </div>
              )}
            </div>

            {/* Status */}
            {status && (
              <div style={{
                padding: "10px 12px", borderRadius: 8, fontSize: 12,
                background: statusType === "ok" ? "rgba(34,197,94,0.08)" : statusType === "err" ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.08)",
                border: `1px solid ${statusType === "ok" ? "rgba(34,197,94,0.2)" : statusType === "err" ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)"}`,
                color: statusType === "ok" ? "#4ade80" : statusType === "err" ? "#f87171" : "#818cf8",
                lineHeight: 1.5,
              }}>
                {status}
              </div>
            )}

            <button
              onClick={runAgent}
              disabled={running || !isActive}
              style={{
                width: "100%", padding: "13px 0",
                background: running ? "rgba(99,102,241,0.3)" : isActive ? AGENT_COLOR : "#2a2a2a",
                color: isActive ? "#fff" : "#555",
                border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: running || !isActive ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {running ? (
                <>
                  <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
                  Agent running...
                </>
              ) : !isActive ? (
                "Activate agent first"
              ) : (
                <><Bot size={15} /> Run Analysis ($0.025 USDC)</>
              )}
            </button>
          </div>
        </div>

        {/* Policy summary */}
        {policy && (
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>Spending Policy</p>
              <span style={{ fontSize: 11, color: AGENT_COLOR, background: "rgba(99,102,241,0.1)", padding: "3px 10px", borderRadius: 999 }}>Circle Agent Stack</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {[
                { label: "Max per transaction", value: `$${policy.maxPerTx} USDC` },
                { label: "Max per day", value: `$${policy.maxPerDay} USDC` },
                { label: "Auto-run on upload", value: policy.autoRun ? "Enabled" : "Disabled" },
              ].map(p => (
                <div key={p.label} style={{ background: "#0a0a0a", borderRadius: 10, padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 4px", ...S }}>{p.label}</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e0e0e0" }}>{p.value}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "#0a0a0a" }}>
              <p style={{ margin: "0 0 4px", ...S }}>Agent Wallet</p>
              <code style={{ fontSize: 12, color: "#818cf8" }}>
                {policy.walletAddress.slice(0, 18)}...{policy.walletAddress.slice(-8)}
              </code>
            </div>
          </div>
        )}

        {/* Transaction log */}
        <div style={card}>
          <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>Agent Transaction Log</p>
          {logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#555" }}>
              <Clock size={28} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No transactions yet. Run the agent to start.</p>
            </div>
          ) : (
            <div ref={logRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map(tx => (
                <div key={tx.id} style={{ padding: "12px 14px", background: "#0a0a0a", borderRadius: 10 }}>
                  {/* Row 1: status + note + amount */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {tx.status === "success"
                      ? <CheckCircle size={15} style={{ color: "#4ade80", flexShrink: 0 }} />
                      : tx.status === "failed"
                      ? <XCircle size={15} style={{ color: "#f87171", flexShrink: 0 }} />
                      : <AlertTriangle size={15} style={{ color: "#fbbf24", flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#e0e0e0" }}>{tx.note}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>
                        {new Date(tx.timestamp).toLocaleString()} · {tx.type}
                      </p>
                    </div>
                    {tx.amount > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", flexShrink: 0 }}>
                        -${tx.amount.toFixed(3)} USDC
                      </span>
                    )}
                  </div>

                  {/* Row 2: TX link */}
                  {tx.status === "success" && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                      {tx.txHash ? (
                        <a
                          href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6366f1", textDecoration: "none", fontFamily: "monospace" }}
                        >
                          <ExternalLink size={11} />
                          {tx.txHash.slice(0, 20)}...{tx.txHash.slice(-6)}
                          <span style={{ color: "#555", fontFamily: "sans-serif" }}>↗ ArcScan</span>
                        </a>
                      ) : tx.txId ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>
                            Circle ID: {tx.txId.slice(0, 16)}...
                          </span>
                          <button
                            onClick={() => fetchTxHash(tx.txId!, tx.id)}
                            disabled={fetchingHash === tx.id}
                            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            {fetchingHash === tx.id
                              ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                              : <RefreshCw size={11} />
                            }
                            {fetchingHash === tx.id ? "Fetching hash..." : "Get TX hash"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Policy editor modal */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setEditOpen(false)}>
          <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, width: 440, padding: 28 }}
            onClick={e => e.stopPropagation()}>
            <p style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>Configure Agent Policy</p>

            {[
              { label: "Max per transaction (USDC)", value: fMaxPerTx, set: setFMaxPerTx, hint: "Max $0.025 per analysis" },
              { label: "Max per day (USDC)", value: fMaxPerDay, set: setFMaxPerDay, hint: "Daily spending cap" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6 }}>{f.label}</label>
                <input
                  type="number" step="0.001" min="0" value={f.value}
                  onChange={e => f.set(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "11px 14px", color: "#f0f0f0", fontSize: 14, outline: "none" }}
                />
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>{f.hint}</p>
              </div>
            ))}

            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, cursor: "pointer" }}>
              <input type="checkbox" checked={fAutoRun} onChange={e => setFAutoRun(e.target.checked)} style={{ accentColor: AGENT_COLOR, width: 16, height: 16 }} />
              <span style={{ fontSize: 13, color: "#888" }}>Auto-run analysis on image upload</span>
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditOpen(false)} style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 12, color: "#888", fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={savePolicy} style={{ flex: 2, padding: "12px 0", background: AGENT_COLOR, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Save Policy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
