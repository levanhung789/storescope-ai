"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Wallet, Copy, ExternalLink, LogOut, RefreshCw, Loader2 } from "lucide-react";
import {
  loadCircleSession,
  clearCircleSession,
  type CircleSession,
} from "../_lib/circle";

const isDemo = (s: CircleSession | null) => s?.walletId?.startsWith("demo-") ?? false;

interface Props {
  onDisconnect?: () => void;
}

export default function CircleWalletButton({ onDisconnect }: Props) {
  const [session, setSession] = useState<CircleSession | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setSession(loadCircleSession()); }, []);

  const fetchBalance = useCallback(async (walletId: string, address?: string) => {
    setLoadingBalance(true);
    try {
      const params = new URLSearchParams({ walletId });
      if (address) params.set("address", address);
      const res  = await fetch(`/api/circle/balance?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBalance(data.usdc);
    } catch {
      setBalance("--");
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  useEffect(() => {
    if (!session?.walletId) return;
    fetchBalance(session.walletId, session.walletAddress);
    // Poll moi 10s khi balance = 0 — dung ref de tranh balance lam dependency
    const interval = setInterval(() => {
      if (balanceRef.current === "0.00" || balanceRef.current === null) {
        fetchBalance(session.walletId, session.walletAddress);
      }
    }, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, fetchBalance]); // bo `balance` khoi dependency array

  const copyAddress = () => {
    if (!session?.walletAddress) return;
    navigator.clipboard.writeText(session.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const disconnect = () => {
    clearCircleSession();
    setSession(null);
    setBalance(null);
    setOpen(false);
    onDisconnect?.();
  };

  if (!session) return null;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border font-medium transition-all"
        style={{
          fontSize: 18,
          borderColor: "rgba(99,102,241,0.4)",
          background: "rgba(99,102,241,0.08)",
          color: "#e0e0e0",
        }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#6366f1" }} />
        <Wallet size={17} className="opacity-70" />
        <span style={{ color: "#a5b4fc" }}>
          {balance !== null ? `${balance} USDC` : "Circle"}
        </span>
        <span style={{ opacity: 0.5, fontSize: 16 }}>
          {shortAddress(session.walletAddress)}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-12 z-50 rounded-2xl border p-5 shadow-2xl"
            style={{ background: "#111", borderColor: "#2a2a2a", width: 320 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.15)" }}
              >
                <Wallet size={20} style={{ color: "#6366f1" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#f0f0f0" }}>
                  Circle Wallet
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#555" }}>
                  ARC Testnet
                </p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <span
                  className="px-2 py-0.5 rounded-full font-medium"
                  style={{ fontSize: 14, background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                >
                  Circle
                </span>
                {isDemo(session) && (
                  <span
                    className="px-2 py-0.5 rounded-full font-medium"
                    style={{ fontSize: 12, background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}
                  >
                    Demo
                  </span>
                )}
              </div>
            </div>

            {/* Address */}
            <div
              className="rounded-xl flex items-center justify-between mb-3"
              style={{ background: "#1a1a1a", padding: "12px 14px" }}
            >
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 14, color: "#555" }}>Wallet Address</p>
                <span style={{ fontSize: 16, fontFamily: "monospace", color: "#888" }}>
                  {shortAddress(session.walletAddress)}
                </span>
              </div>
              <button onClick={copyAddress} className="transition-opacity hover:opacity-70 ml-3">
                <Copy size={16} style={{ color: copied ? "#6366f1" : "#555" }} />
              </button>
            </div>

            {/* Balance */}
            <div
              className="rounded-xl flex items-center justify-between mb-3"
              style={{ background: "#1a1a1a", padding: "12px 14px" }}
            >
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 14, color: "#555" }}>USDC Balance</p>
                <p style={{ margin: 0, fontSize: 21, fontWeight: 700, color: "#f0f0f0" }}>
                  {loadingBalance ? (
                    <Loader2 size={18} className="animate-spin inline" />
                  ) : (
                    `${balance ?? "--"} USDC`
                  )}
                </p>
              </div>
              <button
                onClick={() => fetchBalance(session.walletId, session.walletAddress)}
                className="transition-opacity hover:opacity-70 ml-3"
              >
                <RefreshCw size={17} style={{ color: "#555" }} />
              </button>
            </div>

            {/* Links */}
            <div className="space-y-1 mb-3">
              <a
                href={`https://testnet.arcscan.app/address/${session.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full rounded-xl transition-colors hover:bg-white/5"
                style={{ color: "#888", fontSize: 16, padding: "10px 12px" }}
              >
                <ExternalLink size={16} />
                View on ArcScan
              </a>
              {balance === "0.00" || balance === null ? (
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", marginBottom: 4 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>Wallet needs USDC to run analysis</p>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
                    1. Copy address above<br/>
                    2. Go to faucet → select <strong>ARC Testnet</strong><br/>
                    3. Paste address → Request USDC
                  </p>
                  <a
                    href="https://faucet.circle.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#f59e0b", textDecoration: "none" }}
                  >
                    <ExternalLink size={13} />
                    Open Circle Faucet
                  </a>
                </div>
              ) : (
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full rounded-xl transition-colors hover:bg-white/5"
                  style={{ color: "#888", fontSize: 16, padding: "10px 12px" }}
                >
                  <ExternalLink size={16} />
                  Get Testnet USDC (Faucet)
                </a>
              )}
            </div>

            {isDemo(session) && (
              <div style={{
                margin: "0 0 10px", padding: "10px 12px", borderRadius: 10, fontSize: 14,
                background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)",
                color: "#92400e", lineHeight: 1.5,
              }}>
                <span style={{ color: "#fbbf24", fontWeight: 600 }}>Demo mode</span> — Add{" "}
                <code style={{ fontSize: 13 }}>CIRCLE_API_KEY</code> to .env.local for a live wallet.
              </div>
            )}

            <button
              onClick={disconnect}
              className="flex items-center gap-2 w-full rounded-xl transition-colors hover:bg-white/5"
              style={{ color: "#ef4444", fontSize: 16, padding: "10px 12px" }}
            >
              <LogOut size={16} />
              Disconnect Circle Wallet
            </button>
          </div>
        </>
      )}
    </div>
  );
}
