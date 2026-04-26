"use client";

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain, useSignMessage } from "wagmi";
import { useState, useEffect } from "react";
import { arcTestnet, ARC_USDC_DECIMALS } from "../_lib/arc";

type ModalState = "closed" | "pick" | "verify" | "menu";

// Build the sign-in message — includes nonce so each session is unique
function buildSignMessage(address: string, nonce: string) {
  return [
    "storescope.ai — Sign In With Wallet",
    "",
    "By signing this message, you confirm ownership of this wallet.",
    "This does not initiate a blockchain transaction or cost any fees.",
    "",
    `Wallet: ${address}`,
    `Network: ARC Testnet (Chain ID 5042002)`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
}

function randomNonce() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export default function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { signMessage, isPending: isSigning, error: signError, reset: resetSign } = useSignMessage();

  const [modal,     setModal]     = useState<ModalState>("closed");
  const [verified,  setVerified]  = useState(false);
  const [nonce,     setNonce]     = useState(() => randomNonce());
  const [signMsg,   setSignMsg]   = useState("");
  const [signErrMsg, setSignErrMsg] = useState("");

  const { data: balance } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: { enabled: isConnected && verified },
  });

  const short = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);
  const wrongChain = isConnected && chain?.id !== arcTestnet.id;
  const formatBal = (val: bigint, digits = 2) =>
    (Number(val) / Math.pow(10, ARC_USDC_DECIMALS)).toFixed(digits);

  // When wallet connects → immediately show verify modal
  useEffect(() => {
    if (isConnected && !verified && address) {
      const n = randomNonce();
      setNonce(n);
      setSignMsg(buildSignMessage(address, n));
      setSignErrMsg("");
      resetSign();
      setModal("verify");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  // When user disconnects → reset verified state
  useEffect(() => {
    if (!isConnected) {
      setVerified(false);
      setModal("closed");
      setSignErrMsg("");
    }
  }, [isConnected]);

  const handleSign = () => {
    setSignErrMsg("");
    signMessage(
      { message: signMsg },
      {
        onSuccess: () => {
          setVerified(true);
          setModal("closed");
        },
        onError: (err) => {
          const msg = err.message || "";
          setSignErrMsg(
            msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")
              ? "Signature rejected. You must sign to use storescope.ai."
              : "Signing failed. Please try again."
          );
        },
      }
    );
  };

  const handleCancelVerify = () => {
    disconnect();
    setModal("closed");
    setVerified(false);
  };

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

  // ── Connected but not yet verified → show verify modal ────────────────────
  if (isConnected && !verified) {
    return (
      <VerifyModal
        address={address!}
        message={signMsg}
        isSigning={isSigning}
        error={signErrMsg}
        onSign={handleSign}
        onCancel={handleCancelVerify}
      />
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

  // ── Connected + Verified ────────────────────────────────────────────────────
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
        {/* Verified badge */}
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#4ade80", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "1px 8px", borderRadius: 999 }}>
                  ✓ Verified
                </span>
              </div>
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

// ── Verify Ownership Modal ────────────────────────────────────────────────────

function VerifyModal({
  address, message, isSigning, error, onSign, onCancel,
}: {
  address: string; message: string; isSigning: boolean;
  error: string; onSign: () => void; onCancel: () => void;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 3000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#111", border: "1px solid #2a2a2a", borderRadius: 20,
        padding: 32, maxWidth: 440, width: "100%",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(124,58,237,0.12)", border: "2px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Verify Wallet Ownership</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#888", lineHeight: 1.6 }}>
            Sign a message to confirm you own this wallet.<br/>
            <strong style={{ color: "#f0f0f0" }}>No transaction. No gas fee.</strong>
          </p>
        </div>

        {/* Address */}
        <div style={{ padding: "10px 14px", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, marginBottom: 16, fontFamily: "monospace", fontSize: 12, color: "#888", wordBreak: "break-all" }}>
          {address}
        </div>

        {/* Message preview */}
        <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Message to sign</div>
          <pre style={{ margin: 0, fontSize: 11, color: "#666", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {message}
          </pre>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 12, color: "#f87171" }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 12, padding: "11px 0", fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={onSign}
            disabled={isSigning}
            style={{
              flex: 2, background: isSigning ? "#5a2aad" : "#7c3aed",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "11px 0", fontSize: 13, fontWeight: 600,
              cursor: isSigning ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {isSigning ? (
              <>
                <Spinner /> Waiting for signature…
              </>
            ) : (
              "Sign to Verify"
            )}
          </button>
        </div>

        <p style={{ margin: "14px 0 0", fontSize: 11, color: "#444", textAlign: "center", lineHeight: 1.5 }}>
          This is required every session. Your signature verifies ownership without storing any private data.
        </p>
      </div>
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

        <p style={{ marginTop: 16, fontSize: 11, color: "#444", textAlign: "center", lineHeight: 1.6 }}>
          After connecting, you&apos;ll be asked to sign a message to verify ownership.
        </p>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}
