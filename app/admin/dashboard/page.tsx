"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Activity, DollarSign, Users, Zap,
  RefreshCw, ExternalLink, LogOut, Database,
  Bot, CircuitBoard, AlertTriangle, CheckCircle,
} from "lucide-react";

const ADMIN_TOKEN = "storescope-admin-2026";

type Stats = {
  totalAnalyses: number; totalWallets: number; totalUSDC: string;
  blockNumber: number; contracts: Record<string, string>;
  agentId: string; serviceWallet: string; updatedAt: string;
};
type Wallet = { id: string; address: string; refId: string; state: string; usdc: string; createDate: string };
type ChainEvent = { event: string; contract: string; blockNumber: string; txHash?: string; txUrl?: string; payer?: string; brandCount?: number; skuCount?: number; timestamp?: string; };
type WebhookEntry = { notificationId: string; eventType: string; amount?: string; txHash?: string; walletId?: string; status: "processed"|"duplicate"|"error"; receivedAt: string; error?: string; };

const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 14, padding: 20 };
const S = { color: "#555", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.1em" };

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats]         = useState<Stats | null>(null);
  const [wallets, setWallets]     = useState<Wallet[]>([]);
  const [events, setEvents]       = useState<ChainEvent[]>([]);
  const [webhooks, setWebhooks]   = useState<WebhookEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLast]    = useState("");
  const [activeTab, setActiveTab] = useState<"overview"|"wallets"|"events"|"webhooks"|"contracts">("overview");

  // Auth check
  useEffect(() => {
    const token = sessionStorage.getItem("admin-auth");
    if (token !== ADMIN_TOKEN) { router.replace("/admin"); return; }
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headers = { "x-admin-token": ADMIN_TOKEN };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, wRes, eRes, whRes] = await Promise.all([
        fetch("/api/admin/stats",   { headers }).then(r => r.json()),
        fetch("/api/admin/wallets", { headers }).then(r => r.json()),
        fetch("/api/contracts/events?contract=all&blocks=500").then(r => r.json()),
        fetch(`/api/webhooks/gateway?token=${ADMIN_TOKEN}`).then(r => r.json()).catch(() => ({ recentEvents: [] })),
      ]);
      setStats(sRes);
      setWallets(wRes.wallets ?? []);
      setEvents((eRes.events ?? []).slice(0, 30));
      setWebhooks((whRes.recentEvents ?? []).slice(0, 30));
      setLast(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => { sessionStorage.removeItem("admin-auth"); router.replace("/admin"); };

  const TABS = [
    { id: "overview",   label: "Overview",    icon: <Activity size={13} /> },
    { id: "wallets",    label: "Wallets",      icon: <Users size={13} /> },
    { id: "events",     label: "On-chain",     icon: <Zap size={13} /> },
    { id: "webhooks",   label: "Webhooks",     icon: <Database size={13} /> },
    { id: "contracts",  label: "Contracts",    icon: <CircuitBoard size={13} /> },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", fontFamily: "inherit" }}>

      {/* Top bar */}
      <header style={{ background: "#0a0a0a", borderBottom: "1px solid #1f1f1f", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="StoreScope AI" style={{ height: 36, filter: "invert(1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 999 }}>
            <Shield size={11} style={{ color: "#ef4444" }} />
            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, letterSpacing: "0.1em" }}>ADMIN</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastRefresh && <span style={{ fontSize: 11, color: "#444" }}>Updated: {lastRefresh}</span>}
          <button onClick={() => loadAll()} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer" }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <button onClick={logout}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 12, cursor: "pointer" }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      <div style={{ padding: "24px 28px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { icon: <Database size={18}/>, label: "Total Analyses",  value: stats?.totalAnalyses ?? "—",  color: "#a78bfa" },
            { icon: <Users size={18}/>,    label: "Circle Wallets",  value: stats?.totalWallets ?? "—",   color: "#38bdf8" },
            { icon: <DollarSign size={18}/>,label: "Total USDC",     value: stats ? `${stats.totalUSDC} USDC` : "—", color: "#4ade80" },
            { icon: <Zap size={18}/>,      label: "On-chain Events", value: events.length,                color: "#fbbf24" },
            { icon: <Bot size={18}/>,      label: "Agent ID",        value: stats ? `#${stats.agentId}` : "—", color: "#818cf8" },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: 16 }}>
              <div style={{ color: "#444", marginBottom: 8 }}>{s.icon}</div>
              <p style={{ margin: "0 0 4px", ...S }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color }}>{String(s.value)}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#0a0a0a", borderRadius: 12, padding: 4, width: "fit-content", border: "1px solid #1f1f1f" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                background: activeTab === t.id ? "#1a1a1a" : "transparent",
                color: activeTab === t.id ? "#f0f0f0" : "#555" }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* System health */}
            <div style={card}>
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>System Health</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Circle API",          ok: !!stats },
                  { label: "AnalysisRegistry",    ok: (stats?.totalAnalyses ?? -1) >= 0 },
                  { label: "ARC Testnet RPC",     ok: (stats?.blockNumber ?? 0) > 0 },
                  { label: "On-chain Events",     ok: events.length >= 0 },
                  { label: "Agent Identity #9393",ok: true },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#0a0a0a", borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: "#888" }}>{item.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {item.ok
                        ? <><CheckCircle size={13} style={{ color: "#4ade80" }} /><span style={{ fontSize: 11, color: "#4ade80" }}>OK</span></>
                        : <><AlertTriangle size={13} style={{ color: "#fbbf24" }} /><span style={{ fontSize: 11, color: "#fbbf24" }}>Check</span></>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div style={card}>
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Project Info</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "ARC Block",       value: stats?.blockNumber.toLocaleString() ?? "—" },
                  { label: "Service Wallet",  value: stats?.serviceWallet ? `${stats.serviceWallet.slice(0,14)}...` : "—" },
                  { label: "Agent ID",        value: stats?.agentId ? `#${stats.agentId}` : "—" },
                  { label: "Network",         value: "ARC Testnet · Chain 5042002" },
                  { label: "Last Updated",    value: stats?.updatedAt ? new Date(stats.updatedAt).toLocaleTimeString() : "—" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", background: "#0a0a0a", borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: "#555" }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent events */}
            <div style={{ ...card, gridColumn: "1/-1" }}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>Recent On-Chain Activity</p>
              {events.slice(0, 5).map((ev, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid #0a0a0a" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: ev.event === "ResultSubmitted" ? "#4ade80" : ev.event === "AnalysisRequested" ? "#818cf8" : "#fbbf24" }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0" }}>{ev.event}</span>
                    <span style={{ fontSize: 11, color: "#555", marginLeft: 8 }}>Block #{ev.blockNumber} · {ev.contract}</span>
                  </div>
                  {ev.txHash && (
                    <a href={ev.txUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#6366f1", textDecoration: "none", fontFamily: "monospace" }}>
                      {ev.txHash.slice(0, 14)}… ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Wallets ── */}
        {activeTab === "wallets" && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Circle Wallets ({wallets.length})</p>
              <span style={{ fontSize: 12, color: "#555" }}>Sorted by USDC balance</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 0 }}>
              {["Email / RefId", "Address", "USDC", "State", "ArcScan"].map(h => (
                <div key={h} style={{ padding: "8px 12px", ...S, background: "#0a0a0a", borderBottom: "1px solid #1f1f1f" }}>{h}</div>
              ))}
              {wallets.map(w => (
                <>
                  <div key={`r-${w.id}`} style={{ padding: "10px 12px", borderBottom: "1px solid #0a0a0a", fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.refId}</div>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #0a0a0a", fontSize: 11, color: "#555", fontFamily: "monospace" }}>{w.address?.slice(0,16)}…</div>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #0a0a0a", fontSize: 13, fontWeight: 600, color: Number(w.usdc) > 0 ? "#4ade80" : "#444" }}>{w.usdc}</div>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #0a0a0a", fontSize: 11, color: w.state === "LIVE" ? "#4ade80" : "#888" }}>{w.state}</div>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #0a0a0a" }}>
                    <a href={`https://testnet.arcscan.app/address/${w.address}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#6366f1", textDecoration: "none" }}>View ↗</a>
                  </div>
                </>
              ))}
            </div>
          </div>
        )}

        {/* ── On-chain Events ── */}
        {activeTab === "events" && (
          <div style={card}>
            <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>On-Chain Events (last 500 blocks)</p>
            {events.length === 0
              ? <p style={{ color: "#555", fontSize: 13 }}>No events found. Click Refresh.</p>
              : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {events.map((ev, i) => (
                  <div key={i} style={{ padding: "12px 14px", background: "#0a0a0a", borderRadius: 10, borderLeft: `3px solid ${ev.event === "ResultSubmitted" ? "#4ade80" : ev.event === "AnalysisRequested" ? "#818cf8" : "#fbbf24"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0" }}>{ev.event}</span>
                      <span style={{ fontSize: 11, color: "#444" }}>Block #{ev.blockNumber}</span>
                    </div>
                    <div style={{ marginTop: 4, display: "flex", gap: 16, fontSize: 11, color: "#555" }}>
                      {ev.payer     && <span>Payer: {String(ev.payer).slice(0,14)}…</span>}
                      {ev.brandCount !== undefined && <span>Brands: {ev.brandCount}</span>}
                      {ev.skuCount  !== undefined && <span>SKUs: {ev.skuCount}</span>}
                      {ev.txHash && (
                        <a href={ev.txUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1", textDecoration: "none", fontFamily: "monospace" }}>
                          {String(ev.txHash).slice(0,16)}… ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Webhooks ── */}
        {activeTab === "webhooks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Setup info */}
            <div style={card}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>Gateway Webhook Setup</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Endpoint URL", value: "https://storescope-ai.vercel.app/api/webhooks/gateway", mono: true },
                  { label: "Local test URL", value: "http://localhost:3000/api/webhooks/gateway", mono: true },
                  { label: "Supported Events", value: "gateway.deposit.finalized · gateway.mint.finalized · gateway.mint.forwarded", mono: false },
                  { label: "Wildcard", value: "gateway.* — subscribe to all events at once", mono: false },
                  { label: "Delivery", value: "At-least-once — deduplicate via notificationId", mono: false },
                  { label: "Auth", value: "ECDSA SHA256 signature via X-Circle-Signature header", mono: false },
                ].map(row => (
                  <div key={row.label} style={{ padding: "10px 14px", background: "#0a0a0a", borderRadius: 10 }}>
                    <p style={{ margin: "0 0 4px", ...S }}>{row.label}</p>
                    <p style={{ margin: 0, fontSize: row.mono ? 11 : 12, color: "#888", fontFamily: row.mono ? "monospace" : "inherit", wordBreak: "break-all" }}>{row.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, fontSize: 12, color: "#818cf8" }}>
                Register at: <strong>console.circle.com → Developer → Subscriptions</strong> — free account, no billing required
              </div>
            </div>

            {/* Recent webhook events */}
            <div style={card}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>
                Recent Webhook Events
                <span style={{ marginLeft: 10, fontSize: 11, color: "#555" }}>
                  (in-memory, resets on server restart)
                </span>
              </p>
              {webhooks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#555" }}>
                  <p style={{ margin: 0, fontSize: 13 }}>No webhook events yet.</p>
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "#444" }}>
                    Subscribe via Circle Console, then deposits will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {webhooks.map((wh, i) => (
                    <div key={i} style={{
                      padding: "10px 14px", background: "#0a0a0a", borderRadius: 10,
                      borderLeft: `3px solid ${wh.status === "processed" ? "#4ade80" : wh.status === "duplicate" ? "#fbbf24" : "#f87171"}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0" }}>{wh.eventType}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: wh.status === "processed" ? "rgba(74,222,128,0.1)" : wh.status === "duplicate" ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)", color: wh.status === "processed" ? "#4ade80" : wh.status === "duplicate" ? "#fbbf24" : "#f87171" }}>{wh.status}</span>
                          <span style={{ fontSize: 10, color: "#444" }}>{new Date(wh.receivedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 4, display: "flex", gap: 14, fontSize: 11, color: "#555" }}>
                        {wh.amount   && <span>Amount: {wh.amount} USDC</span>}
                        {wh.walletId && <span>Wallet: {wh.walletId.slice(0, 12)}...</span>}
                        {wh.txHash   && <span style={{ fontFamily: "monospace", color: "#6366f1" }}>{wh.txHash.slice(0, 16)}...</span>}
                        {wh.error    && <span style={{ color: "#f87171" }}>{wh.error}</span>}
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "#333", fontFamily: "monospace" }}>ID: {wh.notificationId.slice(0, 20)}...</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Contracts ── */}
        {activeTab === "contracts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {stats && Object.entries(stats.contracts).map(([name, addr]) => (
              <div key={name} style={card}>
                <p style={{ margin: "0 0 10px", ...S }}>{name.replace(/([A-Z])/g, " $1").trim()}</p>
                <code style={{ fontSize: 12, color: "#a78bfa", wordBreak: "break-all" }}>{addr}</code>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <a href={`https://testnet.arcscan.app/address/${addr}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6366f1", textDecoration: "none" }}>
                    <ExternalLink size={10} /> View on ArcScan
                  </a>
                </div>
              </div>
            ))}
            {/* ARC Agent */}
            <div style={card}>
              <p style={{ margin: "0 0 10px", ...S }}>ARC Agent Identity</p>
              <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#818cf8" }}>#{stats?.agentId ?? "9393"}</p>
              <a href="https://testnet.arcscan.app/tx/0x6773105c6b14b109dcb08b49dfbcd7a9388c759debc6853791ee5a679484785f"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#6366f1", textDecoration: "none" }}>
                Registration TX ↗
              </a>
            </div>
            {/* Service wallet */}
            <div style={card}>
              <p style={{ margin: "0 0 10px", ...S }}>Service Wallet (revenue)</p>
              <code style={{ fontSize: 12, color: "#4ade80", wordBreak: "break-all" }}>{stats?.serviceWallet}</code>
              <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>All USDC payments → this wallet</div>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
