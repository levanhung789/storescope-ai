"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { PRICING } from "../../_lib/arc";
import { loadCircleSession, type CircleSession } from "../../_lib/circle";
import { LayoutDocument } from "./types";
import { ExternalLink } from "lucide-react";

interface Props {
  doc: LayoutDocument;
  onClose: () => void;
}

type Step = "form" | "paying" | "minting" | "done" | "error";
type PayMethod = "circle" | "metamask";

export default function MintModal({ doc, onClose }: Props) {
  const { address, isConnected } = useAccount();
  const [circleSession, setCircleSession] = useState<CircleSession | null>(null);
  const [circleBalance, setCircleBalance] = useState<string | null>(null);

  const [title, setTitle]         = useState(doc.store.name || "");
  const [description, setDesc]    = useState("");
  const [price, setPrice]         = useState("5.00");
  const [payMethod, setPayMethod] = useState<PayMethod>("circle");
  const [step, setStep]           = useState<Step>("form");
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [payTxHash, setPayTxHash]   = useState<string | null>(null);
  const [error, setError]           = useState("");

  const mintFee  = PRICING.layoutMint;
  const listFee  = PRICING.layoutList;
  const totalFee = mintFee + listFee;
  const fixtureCount = doc.fixtures.length;

  useEffect(() => {
    const cs = loadCircleSession();
    setCircleSession(cs);
    if (cs?.walletId) {
      fetch(`/api/circle/balance?walletId=${cs.walletId}&address=${cs.walletAddress}`)
        .then(r => r.json())
        .then(d => setCircleBalance(d.usdc ?? null))
        .catch(() => {});
    }
  }, []);

  const handleMint = async () => {
    if (!title.trim()) return;
    setError("");

    // ── Circle Wallet mint ─────────────────────────────────────────────────
    if (payMethod === "circle") {
      if (!circleSession) {
        setError("No Circle Wallet connected. Please login with Circle Wallet first.");
        return;
      }
      setStep("paying");
      try {
        const res  = await fetch("/api/contracts/mint-layout", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            walletId:      circleSession.walletId,
            walletAddress: circleSession.walletAddress,
            title:         title.trim(),
            description:   description.trim(),
            salePrice:     price,
          }),
        });
        const data = await res.json();

        if (res.status === 402) {
          setError(`Insufficient USDC. You have ${data.balance} USDC, need ${data.required} USDC. Get testnet USDC at faucet.circle.com`);
          setStep("error");
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "Mint failed");

        setMintTxHash(data.mintTxHash);
        setPayTxHash(data.paymentTxHash ?? null);
        setStep("done");

      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setStep("error");
      }
      return;
    }

    // ── MetaMask mint (mock — future integration) ──────────────────────────
    if (!isConnected) {
      setError("Please connect MetaMask first.");
      return;
    }
    setStep("paying");
    await new Promise(r => setTimeout(r, 1500));
    setStep("minting");
    await new Promise(r => setTimeout(r, 2000));
    setMintTxHash("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));
    setStep("done");
  };

  const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0a0a0a", border: "1px solid #2a2a2a",
    borderRadius: 8, padding: "10px 12px",
    color: "#f0f0f0", fontSize: 13, outline: "none",
  };
  const lbl: React.CSSProperties = {
    fontSize: 11, color: "#555", textTransform: "uppercase",
    letterSpacing: "0.12em", marginBottom: 6, display: "block",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        {/* ── Done ── */}
        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 26, color: "#4ade80" }}>✓</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#4ade80" }}>Layout Minted!</h3>
            <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
              Recorded on <strong style={{ color: "#a78bfa" }}>ARC Testnet</strong> via RetailLayoutNFT.
            </p>
            {mintTxHash && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                {payTxHash && (
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#555" }}>Payment TX</p>
                    <a href={`https://testnet.arcscan.app/tx/${payTxHash}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: "#818cf8", fontFamily: "monospace", textDecoration: "none" }}>
                      {payTxHash.slice(0, 20)}...{payTxHash.slice(-6)} ↗
                    </a>
                  </div>
                )}
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#4ade80" }}>Mint TX (NFT on-chain)</p>
                  <a href={`https://testnet.arcscan.app/tx/${mintTxHash}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", textDecoration: "none" }}>
                    {mintTxHash.slice(0, 20)}...{mintTxHash.slice(-6)} ↗
                  </a>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 999, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>Close</button>
              <a href="/forum" style={{ flex: 2, background: "#7c3aed", color: "#fff", textDecoration: "none", borderRadius: 999, padding: "10px 0", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <ExternalLink size={13} /> View on Forum
              </a>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12, color: "#f87171" }}>✗</div>
            <p style={{ color: "#f87171", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>{error}</p>
            <button onClick={() => setStep("form")} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Try again</button>
          </div>
        )}

        {/* ── Processing ── */}
        {(step === "paying" || step === "minting") && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #7c3aed", borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#e0e0e0", fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>
              {step === "paying" ? "Processing USDC payment..." : "Minting NFT on-chain..."}
            </p>
            <p style={{ color: "#555", fontSize: 12, margin: 0 }}>
              {step === "paying" ? `Paying $${totalFee.toFixed(2)} USDC via Circle Wallet` : "Calling RetailLayoutNFT.mint() on ARC Testnet"}
            </p>
          </div>
        )}

        {/* ── Form ── */}
        {step === "form" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>ARC Network · USDC Payment</div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Mint Layout On-chain</h3>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#555" }}>
                {fixtureCount} fixtures · {Math.round(doc.canvas.width / 1000)}×{Math.round(doc.canvas.height / 1000)}m
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Payment method */}
              <div>
                <label style={lbl}>Payment Method</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { id: "circle", label: "Circle Wallet", sub: circleBalance ? `${circleBalance} USDC` : "No wallet", color: "#6366f1" },
                    { id: "metamask", label: "MetaMask", sub: isConnected ? `${address?.slice(0,8)}...` : "Not connected", color: "#f59e0b" },
                  ].map(m => (
                    <button key={m.id} onClick={() => setPayMethod(m.id as PayMethod)}
                      style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left", border: `1px solid ${payMethod === m.id ? m.color : "#2a2a2a"}`, background: payMethod === m.id ? `${m.color}15` : "transparent" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: payMethod === m.id ? m.color : "#888" }}>{m.label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#555" }}>{m.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* No Circle wallet warning */}
              {payMethod === "circle" && !circleSession && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#f87171" }}>
                  No Circle Wallet connected. Please login via the Circle Wallet tab.
                </div>
              )}

              <div>
                <label style={lbl}>Listing Title *</label>
                <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mini mart 80m² — optimized traffic flow" />
              </div>

              <div>
                <label style={lbl}>Description</label>
                <textarea style={{ ...inp, height: 72, resize: "vertical" }} value={description} onChange={e => setDesc(e.target.value)} placeholder="Describe your layout, insights, real-world results..." />
              </div>

              <div>
                <label style={lbl}>Sale Price (USDC)</label>
                <input style={inp} type="number" min="0.50" step="0.50" value={price} onChange={e => setPrice(e.target.value)} />
              </div>

              {/* Fee breakdown */}
              <div style={{ background: "#0a0a0a", borderRadius: 12, padding: 16, fontSize: 13 }}>
                {[["Mint fee", mintFee], ["Listing fee", listFee]].map(([label, val]) => (
                  <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", color: "#888", marginBottom: 8 }}>
                    <span>{label}</span><span>${Number(val).toFixed(2)} USDC</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#f0f0f0", borderTop: "1px solid #1f1f1f", paddingTop: 12 }}>
                  <span>Total</span>
                  <span style={{ color: "#a78bfa" }}>${totalFee.toFixed(2)} USDC</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 999, padding: "11px 0", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleMint} disabled={!title.trim() || (payMethod === "circle" && !circleSession)}
                  style={{ flex: 2, background: title.trim() ? "#7c3aed" : "#2a2a2a", color: title.trim() ? "#fff" : "#555", border: "none", borderRadius: 999, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: title.trim() ? "pointer" : "not-allowed" }}>
                  Approve & Mint ${totalFee.toFixed(2)} USDC
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
