"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot, Shield, Zap, Play, Pause, Activity,
  DollarSign, Clock, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Settings, ExternalLink, Loader2, Radio,
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
  const [fetchingHash, setFetchingHash]   = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<"log" | "events">("log");
  type ChainEvent = { event: string; contract: string; blockNumber: string; txHash?: string; txUrl?: string; analysisId?: string; payer?: string; brandCount?: number; skuCount?: number; layoutName?: string; tokenId?: string; timestamp?: string; };
  const [onChainEvents, setOnChainEvents] = useState<ChainEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchOnChainEvents = async () => {
    setLoadingEvents(true);
    try {
      const res  = await fetch("/api/contracts/events?contract=all&blocks=1000");
      const data = await res.json() as { events?: ChainEvent[] };
      setOnChainEvents(data.events ?? []);
    } catch {
      setOnChainEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

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

  // Current Circle session — luon dung vi nay de thanh toan, khong phu thuoc vao policy
  const [currentSession, setCurrentSession] = useState<import("../../_lib/circle").CircleSession | null>(null);

  useEffect(() => {
    const logs  = loadAgentLog();
    const p     = loadAgentPolicy();
    const cs    = loadCircleSession();
    setLogs(logs);
    setPolicy(p);
    setCurrentSession(cs);
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
      allowlist:     ["0x68e51fb0A433caBe0d4f17AEe537676d925Cb35c"],
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
      // Uu tien current session wallet, khong dung policy.walletId cu
      const activeWalletId = currentSession?.walletId ?? policy.walletId;
      if (!activeWalletId) throw new Error("No Circle Wallet found. Please login with Circle Wallet first.");

      const res = await fetch("/api/agent/run", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId:    activeWalletId,
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

      const refreshWalletId = currentSession?.walletId ?? policy.walletId;
      const refreshAddress  = currentSession?.walletAddress ?? policy.walletAddress;
      fetch(`/api/circle/balance?walletId=${refreshWalletId}&address=${refreshAddress}`)
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

          {/* ARC Agent Identity */}
          <div style={{ ...card, gridColumn: "1 / -1", marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={18} style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>ARC Agent Identity</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#555" }}>Registered on IdentityRegistry · ERC-8004 · ARC Testnet</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Agent ID", value: "#9393" },
                  { label: "Token", value: "0x24b1" },
                  { label: "Registry", value: "0x8004A818..." },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ margin: 0, fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#a78bfa", fontFamily: "monospace" }}>{item.value}</p>
                  </div>
                ))}
                <a href="https://testnet.arcscan.app/tx/0x6773105c6b14b109dcb08b49dfbcd7a9388c759debc6853791ee5a679484785f"
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#7c3aed", textDecoration: "none", alignSelf: "center" }}>
                  <ExternalLink size={12} /> View on ArcScan
                </a>
              </div>
            </div>
          </div>

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

            {/* Warning: wallet mismatch */}
            {currentSession && policy && currentSession.walletId !== policy.walletId && (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", fontSize: 12, color: "#fbbf24" }}>
                <strong>Wallet switched</strong> — Agent will use your current wallet:
                <br /><code style={{ fontSize: 11 }}>{currentSession.walletAddress.slice(0, 16)}...{currentSession.walletAddress.slice(-6)}</code>
                <br /><span style={{ color: "#92400e", fontSize: 11 }}>Previous policy wallet: {policy.walletAddress.slice(0, 14)}...</span>
              </div>
            )}

            {!currentSession && (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#f87171" }}>
                No Circle Wallet connected. Please login with Circle Wallet to run agent.
              </div>
            )}

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

        {/* ── Multi-Channel Integration ── */}
        <ChannelsPanel session={currentSession} />

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {([
            { id: "log",    label: "Activity Log",       icon: <Clock size={13} /> },
            { id: "events", label: "On-Chain Events",    icon: <Radio size={13} /> },
          ] as { id: "log" | "events"; label: string; icon: React.ReactNode }[]).map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); if (t.id === "events") fetchOnChainEvents(); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${activeTab === t.id ? "rgba(99,102,241,0.4)" : "#2a2a2a"}`,
                background: activeTab === t.id ? "rgba(99,102,241,0.1)" : "transparent",
                color: activeTab === t.id ? "#818cf8" : "#555",
              }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Transaction log */}
        {activeTab === "log" && <div style={card}>
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
        </div>}

        {/* On-Chain Events panel */}
        {activeTab === "events" && (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>On-Chain Events</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>
                  AnalysisRegistry · PaymentVerifier · RetailLayoutNFT — ARC Testnet
                </p>
              </div>
              <button onClick={fetchOnChainEvents} disabled={loadingEvents}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #2a2a2a", background: "transparent", color: "#6366f1" }}>
                {loadingEvents
                  ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  : <RefreshCw size={13} />}
                {loadingEvents ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loadingEvents && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#555" }}>
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontSize: 13 }}>Querying ARC Testnet...</p>
              </div>
            )}

            {!loadingEvents && onChainEvents.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#555" }}>
                <Radio size={28} style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13 }}>No events found in last 1000 blocks.</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>Click Refresh to query ARC Testnet.</p>
              </div>
            )}

            {!loadingEvents && onChainEvents.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {onChainEvents.map((ev, i) => {
                  const isResult    = ev.event === "ResultSubmitted";
                  const isRequested = ev.event === "AnalysisRequested";
                  const isNFT       = ev.event === "LayoutMinted";
                  const color       = isResult ? "#4ade80" : isRequested ? "#818cf8" : isNFT ? "#fbbf24" : "#888";

                  return (
                    <div key={i} style={{ padding: "12px 14px", background: "#0a0a0a", borderRadius: 10, borderLeft: `3px solid ${color}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color }}>{String(ev.event)}</span>
                        <span style={{ fontSize: 11, color: "#555" }}>
                          Block #{String(ev.blockNumber)} · {String(ev.contract)}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {ev.analysisId && (
                          <p style={{ margin: 0, fontSize: 11, color: "#888", fontFamily: "monospace" }}>
                            ID: {String(ev.analysisId)}
                          </p>
                        )}
                        {ev.payer && (
                          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
                            Payer: {String(ev.payer).slice(0, 16)}...
                          </p>
                        )}
                        {ev.brandCount !== undefined && (
                          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
                            Brands: {String(ev.brandCount)} · SKUs: {String(ev.skuCount)}
                          </p>
                        )}
                        {ev.layoutName && (
                          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
                            Layout: {String(ev.layoutName)}
                          </p>
                        )}
                      </div>
                      {ev.txHash && (
                        <a href={String(ev.txUrl)} target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 10, color: "#6366f1", textDecoration: "none", fontFamily: "monospace" }}>
                          <ExternalLink size={10} />
                          {String(ev.txHash).slice(0, 22)}... ↗ ArcScan
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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

// ── Channels Panel ─────────────────────────────────────────────────────────────
type ChannelUser = {
  channel: "telegram" | "zalo" | "webchat";
  userId: string;
  username?: string;
  circleWalletId: string;
  walletAddress: string;
  linkedAt: number;
  totalAnalyses: number;
  totalSpentUSDC: number;
};

function ChannelsPanel({ session }: { session: import("../../_lib/circle").CircleSession | null }) {
  const [stats, setStats]   = useState<{telegram:{users:number;analyses:number};zalo:{users:number;analyses:number};webchat:{users:number;analyses:number};totalRevenue:number} | null>(null);
  const [cfg, setCfg]       = useState<{telegram:boolean;zalo:boolean} | null>(null);
  const [users, setUsers]   = useState<ChannelUser[]>([]);
  const [tgInput, setTgInput]     = useState("");
  const [zaloInput, setZaloInput] = useState("");
  const [linking, setLinking]     = useState<"telegram" | "zalo" | null>(null);
  const [linkMsg, setLinkMsg]     = useState<{ channel: "telegram" | "zalo"; text: string; ok: boolean } | null>(null);

  const [myBot, setMyBot]               = useState<{ connected: boolean; botUsername?: string } | null>(null);
  const [botTokenInput, setBotTokenInput] = useState("");
  const [botBusy, setBotBusy]           = useState(false);
  const [botMsg, setBotMsg]             = useState<{ text: string; ok: boolean } | null>(null);

  const refreshUsers = () => fetch("/api/agent/channels?type=users").then(r => r.json()).then(d => setUsers(d.users ?? []));

  const refreshMyBot = () => {
    if (!session) { setMyBot(null); return; }
    fetch(`/api/agent/telegram-bots?walletId=${session.walletId}`).then(r => r.json()).then(d => setMyBot(d));
  };

  useEffect(() => {
    fetch("/api/agent/channels").then(r => r.json()).then(d => {
      setStats(d.stats);
      setCfg(d.configured);
    });
    refreshUsers();
  }, []);

  useEffect(() => {
    refreshMyBot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.walletId]);

  const connectBot = async () => {
    if (!session) { setBotMsg({ text: "Kết nối Circle Wallet trước.", ok: false }); return; }
    const token = botTokenInput.trim();
    if (!token) return;
    setBotBusy(true);
    setBotMsg(null);
    try {
      const res = await fetch("/api/agent/telegram-bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId: session.walletId, walletAddress: session.walletAddress, token }),
      });
      const data = await res.json();
      if (res.ok) {
        setBotTokenInput("");
        setBotMsg({ text: `✓ Đã kết nối @${data.botUsername}!`, ok: true });
        refreshMyBot();
        refreshUsers();
      } else {
        setBotMsg({ text: data.error ?? "Kết nối thất bại.", ok: false });
      }
    } catch {
      setBotMsg({ text: "Lỗi kết nối.", ok: false });
    } finally {
      setBotBusy(false);
    }
  };

  const disconnectBot = async () => {
    if (!session) return;
    setBotBusy(true);
    try {
      await fetch("/api/agent/telegram-bots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId: session.walletId }),
      });
      setMyBot({ connected: false });
      setBotMsg(null);
    } finally {
      setBotBusy(false);
    }
  };

  const myTelegram = session ? users.find(u => u.channel === "telegram" && u.circleWalletId === session.walletId) : undefined;
  const myZalo     = session ? users.find(u => u.channel === "zalo" && u.circleWalletId === session.walletId) : undefined;

  const linkChannel = async (channel: "telegram" | "zalo") => {
    if (!session) { setLinkMsg({ channel, text: "Kết nối Circle Wallet trước khi liên kết.", ok: false }); return; }
    const userId = (channel === "telegram" ? tgInput : zaloInput).trim();
    if (!userId) return;
    setLinking(channel);
    setLinkMsg(null);
    try {
      const res = await fetch("/api/agent/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link", channel, userId, walletId: session.walletId, walletAddress: session.walletAddress }),
      });
      if (res.ok) {
        await refreshUsers();
        if (channel === "telegram") setTgInput(""); else setZaloInput("");
        setLinkMsg({ channel, text: "✓ Liên kết thành công!", ok: true });
      } else {
        setLinkMsg({ channel, text: "Liên kết thất bại, thử lại.", ok: false });
      }
    } catch {
      setLinkMsg({ channel, text: "Lỗi kết nối.", ok: false });
    } finally {
      setLinking(null);
    }
  };

  const cardS: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 20, marginBottom: 16 };
  const linkInputS: React.CSSProperties = { flex: 1, background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "6px 10px", color: "#f0f0f0", fontSize: 11, outline: "none", minWidth: 0 };
  const linkBtnS: React.CSSProperties = { padding: "6px 12px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 700 }}>
        Multi-Channel Integration
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Telegram */}
        <div style={{ ...cardS, marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/telegram-logo.svg" alt="Telegram" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>Telegram Bot</div>
              <div style={{ fontSize: 11, color: cfg?.telegram ? "#4ade80" : "#f87171" }}>
                {cfg?.telegram ? "✓ Connected" : "⚠ Token missing"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "#555" }}>Users linked</span>
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>{stats?.telegram.users ?? 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 14 }}>
            <span style={{ color: "#555" }}>Analyses done</span>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>{stats?.telegram.analyses ?? 0}</span>
          </div>
          {!cfg?.telegram
            ? <div style={{ padding: "8px 12px", background: "#0a0a0a", borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: "#fbbf24", marginBottom: 4 }}>Setup required:</div>
                <div style={{ color: "#555" }}>1. Tạo bot tại @BotFather</div>
                <div style={{ color: "#555" }}>2. Set TELEGRAM_BOT_TOKEN</div>
                <div style={{ color: "#555", marginTop: 4 }}>3. Webhook URL:</div>
                <code style={{ fontSize: 10, color: "#818cf8", wordBreak: "break-all" }}>
                  https://storescope-ai.vercel.app/api/agent/telegram
                </code>
              </div>
            : <div style={{ padding: "8px 12px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 11, color: "#4ade80" }}>
                Bot active — users can send images to analyze
              </div>
          }

          {/* Per-account link row */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1a1a" }}>
            {myTelegram ? (
              <div style={{ fontSize: 11, color: "#4ade80" }}>
                ✓ Đã liên kết — ID: <code style={{ color: "#a78bfa" }}>{myTelegram.userId}</code>
                {myTelegram.username ? ` (@${myTelegram.username})` : ""}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>
                  Nhắn <code style={{ color: "#818cf8" }}>/start</code> cho bot để lấy User ID, dán vào đây để liên kết ví:
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={tgInput} onChange={e => setTgInput(e.target.value)} placeholder="Telegram User ID" style={linkInputS} />
                  <button onClick={() => linkChannel("telegram")} disabled={linking === "telegram" || !tgInput.trim()} style={linkBtnS}>
                    {linking === "telegram" ? "..." : "Link"}
                  </button>
                </div>
              </>
            )}
            {linkMsg?.channel === "telegram" && (
              <div style={{ fontSize: 10, marginTop: 4, color: linkMsg.ok ? "#4ade80" : "#f87171" }}>{linkMsg.text}</div>
            )}
          </div>

          {/* Connect your own bot (per-account bot token) */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1a1a" }}>
            {myBot?.connected ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <div style={{ fontSize: 11, color: "#4ade80" }}>
                  ✓ Bot riêng: <code style={{ color: "#a78bfa" }}>@{myBot.botUsername}</code>
                </div>
                <button onClick={disconnectBot} disabled={botBusy} style={{ ...linkBtnS, background: "#2a2a2a" }}>
                  {botBusy ? "..." : "Ngắt"}
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>
                  Hoặc dùng bot riêng của bạn — tạo qua <code style={{ color: "#818cf8" }}>@BotFather</code>, dán token vào đây:
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={botTokenInput}
                    onChange={e => setBotTokenInput(e.target.value)}
                    placeholder="123456789:AAH..."
                    style={linkInputS}
                  />
                  <button onClick={connectBot} disabled={botBusy || !botTokenInput.trim()} style={linkBtnS}>
                    {botBusy ? "..." : "Connect"}
                  </button>
                </div>
              </>
            )}
            {botMsg && (
              <div style={{ fontSize: 10, marginTop: 4, color: botMsg.ok ? "#4ade80" : "#f87171" }}>{botMsg.text}</div>
            )}
          </div>
        </div>

        {/* Zalo */}
        <div style={{ ...cardS, marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/zalo-logo.svg" alt="Zalo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>Zalo OA</div>
              <div style={{ fontSize: 11, color: cfg?.zalo ? "#4ade80" : "#f87171" }}>
                {cfg?.zalo ? "✓ Connected" : "⚠ Token missing"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "#555" }}>Users linked</span>
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>{stats?.zalo.users ?? 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 14 }}>
            <span style={{ color: "#555" }}>Analyses done</span>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>{stats?.zalo.analyses ?? 0}</span>
          </div>
          {!cfg?.zalo
            ? <div style={{ padding: "8px 12px", background: "#0a0a0a", borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: "#fbbf24", marginBottom: 4 }}>Setup required:</div>
                <div style={{ color: "#555" }}>1. Tạo OA tại oa.zalo.me</div>
                <div style={{ color: "#555" }}>2. Set ZALO_OA_TOKEN</div>
                <div style={{ color: "#555", marginTop: 4 }}>3. Webhook URL:</div>
                <code style={{ fontSize: 10, color: "#818cf8", wordBreak: "break-all" }}>
                  https://storescope-ai.vercel.app/api/agent/zalo
                </code>
              </div>
            : <div style={{ padding: "8px 12px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 11, color: "#4ade80" }}>
                OA active — users can send images to analyze
              </div>
          }

          {/* Per-account link row */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1a1a" }}>
            {myZalo ? (
              <div style={{ fontSize: 11, color: "#4ade80" }}>
                ✓ Đã liên kết — ID: <code style={{ color: "#a78bfa" }}>{myZalo.userId}</code>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>
                  Theo dõi OA để bot gửi User ID, dán vào đây để liên kết ví:
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={zaloInput} onChange={e => setZaloInput(e.target.value)} placeholder="Zalo User ID" style={linkInputS} />
                  <button onClick={() => linkChannel("zalo")} disabled={linking === "zalo" || !zaloInput.trim()} style={linkBtnS}>
                    {linking === "zalo" ? "..." : "Link"}
                  </button>
                </div>
              </>
            )}
            {linkMsg?.channel === "zalo" && (
              <div style={{ fontSize: 10, marginTop: 4, color: linkMsg.ok ? "#4ade80" : "#f87171" }}>{linkMsg.text}</div>
            )}
          </div>
        </div>

        {/* Web Chat */}
        <div style={{ ...cardS, marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌐</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>Web Chat</div>
              <div style={{ fontSize: 11, color: "#4ade80" }}>✓ Always active</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "#555" }}>Sessions</span>
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>{stats?.webchat.users ?? 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 14 }}>
            <span style={{ color: "#555" }}>Analyses done</span>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>{stats?.webchat.analyses ?? 0}</span>
          </div>
          <div style={{ padding: "8px 12px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, fontSize: 11, color: "#a78bfa", textAlign: "center" }}>
            Chat widget · góc dưới bên phải ↘
          </div>
        </div>
      </div>

      {/* Revenue */}
      {stats && stats.totalRevenue > 0 && (
        <div style={{ ...cardS, marginBottom: 0, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#555" }}>Total revenue from all channels</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>${stats.totalRevenue.toFixed(3)} USDC</span>
        </div>
      )}

    </div>
  );
}

// ── Web Chat Guide Widget — StoreScope AI assistant, only on /dashboard/agent ─
function WebChatWidget() {
  const [open,    setOpen]    = useState(false);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [input,   setInput]   = useState("");
  const [messages, setMessages] = useState<{role:"user"|"agent";content:string;timestamp:number}[]>([
    { role: "agent", content: "👋 Xin chào! Tôi là **StoreScope AI Assistant**.\n\nTôi có thể giúp bạn:\n• Hướng dẫn sử dụng tính năng\n• Giải thích cách phân tích kệ hàng\n• Hỗ trợ kết nối Telegram/Zalo\n• Giải đáp về thanh toán USDC\n\nBạn cần hỗ trợ gì?", timestamp: Date.now() },
  ]);
  const endRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { role: "user" as const, content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Only send last 10 messages for context
      const history = [...messages, userMsg].slice(-10).map(m => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.content,
      }));

      const res  = await fetch("/api/agent/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json() as { reply?: string };
      const reply = data.reply ?? "Xin lỗi, tôi không thể trả lời lúc này.";

      setMessages(prev => [...prev, { role: "agent", content: reply, timestamp: Date.now() }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "❌ Lỗi kết nối. Thử lại nhé.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatPop {
          from { opacity:0; transform: scale(0.85) translateY(20px); }
          to   { opacity:1; transform: scale(1)    translateY(0); }
        }
        @keyframes badgePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
      `}</style>

      {/* ── Floating bubble (minimized) ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 28, right: 28, zIndex: 6000,
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#6366f1)",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, transition: "transform 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          🤖
          {unread > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4,
              background: "#ef4444", color: "#fff",
              width: 20, height: 20, borderRadius: "50%",
              fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "badgePulse 1s infinite",
            }}>{unread}</span>
          )}
        </button>
      )}

      {/* ── Chat window (expanded) ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 6000,
          width: 370, height: 560,
          display: "flex", flexDirection: "column",
          background: "#111", border: "1px solid #2a2a2a",
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
          animation: "chatPop 0.2s ease-out",
        }}>

          {/* Header */}
          <div style={{ padding: "13px 16px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 10, background: "#0a0a0a", flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🤖</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Hướng dẫn sử dụng</div>
              <div style={{ fontSize: 10, color: "#4ade80" }}>● StoreScope AI Assistant</div>
            </div>
            {/* Minimize button */}
            <button
              onClick={() => setOpen(false)}
              title="Thu nhỏ"
              style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6, color: "#888", cursor: "pointer", fontSize: 14, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.color = "#f0f0f0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888"; }}
            >
              ─
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
                {m.role === "agent" && (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginBottom: 2 }}>🤖</div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "10px 13px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "#1a1a1a",
                  border: m.role === "agent" ? "1px solid #2a2a2a" : "none",
                  fontSize: 12, color: "#f0f0f0", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {m.content.startsWith("data:image")
                    ? <img src={m.content} alt="shelf" style={{ maxWidth: "100%", borderRadius: 8, display: "block" }} />
                    : m.content
                  }
                  <div style={{ fontSize: 9, color: m.role === "user" ? "rgba(255,255,255,0.5)" : "#444", marginTop: 4, textAlign: "right" }}>
                    {new Date(m.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🤖</div>
                <div style={{ padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px 16px 16px 4px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0,1,2].map(d => (
                      <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", animation: `badgePulse 1.2s ${d * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick questions */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid #1f1f1f", background: "#0a0a0a", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Cách phân tích ảnh?", "Kết nối Telegram?", "Nạp USDC?"].map(q => (
              <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa", cursor: "pointer" }}>
                {q}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #111", background: "#0a0a0a", flexShrink: 0, display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Hỏi về cách sử dụng StoreScope AI..."
              disabled={loading}
              style={{
                flex: 1, background: "#111", border: "1px solid #2a2a2a", borderRadius: 10,
                padding: "9px 12px", color: "#f0f0f0", fontSize: 12, outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !loading ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "#1a1a1a",
                color: input.trim() && !loading ? "#fff" : "#555",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}
            >
              {loading ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #555", borderTopColor: "#a78bfa", animation: "badgePulse 0.6s linear infinite" }} /> : "↑"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
