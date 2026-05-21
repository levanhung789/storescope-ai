"use client";

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import { useState } from "react";
import { arcTestnet, ARC_USDC_DECIMALS } from "../_lib/arc";

type ModalState = "closed" | "pick" | "menu";

export default function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [modal, setModal] = useState<ModalState>("closed");

  const { data: balance } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: { enabled: isConnected },
  });

  const short = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);
  const wrongChain = isConnected && chain?.id !== arcTestnet.id;
  const formatBal = (val: bigint, digits = 2) =>
    (Number(val) / Math.pow(10, ARC_USDC_DECIMALS)).toFixed(digits);

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setModal("pick")}
          disabled={isPending}
          style={{
            background: isPending ? "#5a2aad" : "#7c3aed",
            color: "#fff", border: "none", borderRadius: 999,
            padding: "8px 18px", fontSize: 13, fontWeight: 600,
            cursor: isPending ? "wait" : "pointer",
            transition: "background 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => !isPending && (e.currentTarget.style.background = "#6d28d9")}
          onMouseLeave={e => !isPending && (e.currentTarget.style.background = "#7c3aed")}
        >
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>

        {modal === "pick" && (
          <ConnectorPickerModal
            connectors={connectors}
            isPending={isPending}
            error={connectError}
            onConnect={(c) => { connect({ connector: c, chainId: arcTestnet.id }); setModal("closed"); }}
            onClose={() => setModal("closed")}
          />
        )}
      </>
    );
  }

  // ── Wrong chain ─────────────────────────────────────────────────────────────
  if (wrongChain) {
    return (
      <button
        onClick={() => switchChain({ chainId: arcTestnet.id })}
        disabled={isSwitching}
        style={{
          background: isSwitching ? "#92400e" : "#b45309",
          color: "#fff", border: "1px solid #d97706",
          borderRadius: 999, padding: "8px 18px",
          fontSize: 13, fontWeight: 600,
          cursor: isSwitching ? "wait" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span>⚠</span>
        {isSwitching ? "Switching…" : "Switch to ARC Network"}
      </button>
    );
  }

  // ── Connected ───────────────────────────────────────────────────────────────
  const balDisplay = balance
    ? `${formatBal(balance.value)} ${balance.symbol}`
    : "…";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setModal(modal === "menu" ? "closed" : "menu")}
        style={{
          background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: 999, padding: "7px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          transition: "border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.65)"; e.currentTarget.style.background = "rgba(124,58,237,0.16)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";  e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", letterSpacing: "-0.01em" }}>
          {balDisplay}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "#555" }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {modal === "menu" && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setModal("closed")} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 1000,
            background: "#111", border: "1px solid #222", borderRadius: 14,
            minWidth: 210, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.02em" }}>
                {balDisplay}
              </div>
              <div style={{ fontSize: 11, color: "#444", marginTop: 4, fontFamily: "monospace" }}>
                {short(address!)} · ARC
              </div>
            </div>

            <div style={{ padding: "6px 0" }}>
              <a href={`https://testnet.arcscan.app/address/${address}`} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", fontSize: 13, color: "#888", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f0f0f0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#888")}>
                View on ArcScan ↗
              </a>
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", fontSize: 13, color: "#888", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f0f0f0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#888")}>
                Get testnet USDC
              </a>
            </div>

            <div style={{ borderTop: "1px solid #1a1a1a" }}>
              <button
                onClick={() => { disconnect(); setModal("closed"); }}
                style={{ display: "block", width: "100%", padding: "10px 16px", fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Connector Picker Modal ────────────────────────────────────────────────────

function ConnectorPickerModal({
  connectors, isPending, error, onConnect, onClose,
}: {
  connectors: ReturnType<typeof useConnect>["connectors"];
  isPending: boolean;
  error: Error | null;
  onConnect: (c: (typeof connectors)[number]) => void;
  onClose: () => void;
}) {
  const available = connectors.filter(c => c.id !== "injected" || typeof window !== "undefined");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, padding: 28, maxWidth: 380, width: "100%" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Connect Wallet</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555" }}>ARC Testnet · Chain ID 5042002</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {available.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>
                No wallet detected. Install{" "}
                <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>MetaMask</a>
                {" "}or another browser wallet.
              </p>
            </div>
          ) : (
            available.map(connector => (
              <button key={connector.id} onClick={() => onConnect(connector)} disabled={isPending}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#f0f0f0", fontSize: 14, fontWeight: 600, cursor: isPending ? "wait" : "pointer", transition: "border-color 0.2s, background 0.2s", textAlign: "left" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.background = "#0a0a0a"; }}>
                <span style={{ fontSize: 24 }}>
                  {connector.name.toLowerCase().includes("metamask") ? "🦊"
                   : connector.name.toLowerCase().includes("coinbase") ? "🔵" : "💼"}
                </span>
                <span>{connector.name}</span>
                {isPending && <span style={{ marginLeft: "auto", fontSize: 11, color: "#555" }}>Connecting…</span>}
              </button>
            ))
          )}
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#f87171" }}>
            {error.message.includes("rejected") || error.message.includes("denied")
              ? "Connection rejected by user." : error.message}
          </div>
        )}
      </div>
    </div>
  );
}
