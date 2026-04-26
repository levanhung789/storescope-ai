"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { PRICING, toUSDCUnits, ARC_CONTRACTS } from "../../_lib/arc";
import { LayoutDocument } from "./types";

interface Props {
  doc: LayoutDocument;
  onClose: () => void;
}

type Step = "form" | "connecting" | "approving" | "minting" | "done" | "error";

export default function MintModal({ doc, onClose }: Props) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const [title, setTitle]       = useState(doc.store.name || "");
  const [description, setDesc]  = useState("");
  const [price, setPrice]       = useState("5.00");
  const [step, setStep]         = useState<Step>("form");
  const [txHash, setTxHash]     = useState<string | null>(null);
  const [error, setError]       = useState("");

  const mintFee   = PRICING.layoutMint;
  const listFee   = PRICING.layoutList;
  const totalFee  = mintFee + listFee;
  const fixtureCount = doc.fixtures.length;

  const handleMint = async () => {
    if (!isConnected) {
      setStep("connecting");
      connect({ connector: connectors[0] });
      return;
    }

    try {
      setStep("approving");
      // Approve USDC spend (mock — sẽ thay bằng writeContract thật)
      await new Promise(r => setTimeout(r, 1800));

      setStep("minting");
      // Call LayoutRegistry.mint() — mock
      await new Promise(r => setTimeout(r, 2000));

      // Mock tx hash
      const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxHash(hash);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStep("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0a0a0a", border: "1px solid #2a2a2a",
    borderRadius: 8, padding: "10px 12px",
    color: "#f0f0f0", fontSize: 13, outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: "#555", textTransform: "uppercase",
    letterSpacing: "0.12em", marginBottom: 6, display: "block",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "#111", border: "1px solid #2a2a2a", borderRadius: 20,
        padding: 32, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>

        {step === "done" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Layout minted!</h3>
            <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>
              Your layout has been recorded on <strong style={{ color: "#a78bfa" }}>ARC Testnet</strong> and listed on the Forum.
            </p>
            {txHash && (
              <a
                href={`https://testnet.arcscan.app/tx/${txHash}`}
                target="_blank" rel="noreferrer"
                style={{ display: "inline-block", marginTop: 12, color: "#7c3aed", fontSize: 12, fontFamily: "monospace" }}
              >
                {txHash.slice(0, 20)}...{txHash.slice(-8)} →
              </a>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 999, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>
                Close
              </button>
              <a href="/forum" style={{
                flex: 2, background: "#7c3aed", color: "#fff", textDecoration: "none",
                borderRadius: 999, padding: "10px 0", fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                View on Forum
              </a>
            </div>
          </div>
        ) : step === "error" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>
            <button onClick={() => setStep("form")} style={{ marginTop: 16, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
                ARC Network · USDC Payment
              </div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Mint Layout On-chain</h3>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#555" }}>
                {fixtureCount} fixtures · {Math.round(doc.canvas.width / 1000)}×{Math.round(doc.canvas.height / 1000)}m
              </p>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Listing Title</label>
                <input
                  style={inputStyle}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Mini mart 80m² — optimized traffic flow"
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, height: 80, resize: "vertical" }}
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Describe your layout, insights, real-world results..."
                />
              </div>

              <div>
                <label style={labelStyle}>Sale Price (USDC)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0.50"
                  step="0.50"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
              </div>

              {/* Fee breakdown */}
              <div style={{ background: "#0a0a0a", borderRadius: 12, padding: 16, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#888", marginBottom: 8 }}>
                  <span>On-chain mint fee</span>
                  <span>${mintFee.toFixed(2)} USDC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#888", marginBottom: 12 }}>
                  <span>Forum listing fee</span>
                  <span>${listFee.toFixed(2)} USDC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#f0f0f0", borderTop: "1px solid #1f1f1f", paddingTop: 12 }}>
                  <span>Total fee</span>
                  <span style={{ color: "#a78bfa" }}>${totalFee.toFixed(2)} USDC</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "#555" }}>
                  ≈ {toUSDCUnits(totalFee).toString()} (6 decimals) · Contract: {ARC_CONTRACTS.USDC.slice(0, 10)}...
                </div>
              </div>

              {/* Wallet info */}
              {isConnected ? (
                <div style={{ fontSize: 12, color: "#555", padding: "10px 12px", background: "rgba(124,58,237,0.08)", borderRadius: 8 }}>
                  Wallet: {address?.slice(0, 8)}...{address?.slice(-6)} · ARC Testnet
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#f59e0b", padding: "10px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 8 }}>
                  No wallet connected — clicking Mint will prompt connection
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={onClose} style={{
                  flex: 1, background: "transparent", border: "1px solid #2a2a2a",
                  color: "#888", borderRadius: 999, padding: "11px 0", fontSize: 13, cursor: "pointer",
                }}>
                  Cancel
                </button>
                <button
                  onClick={handleMint}
                  disabled={!title || step !== "form"}
                  style={{
                    flex: 2, background: title ? "#7c3aed" : "#2a2a2a",
                    color: title ? "#fff" : "#555", border: "none",
                    borderRadius: 999, padding: "11px 0", fontSize: 13, fontWeight: 600,
                    cursor: title && step === "form" ? "pointer" : "not-allowed",
                    transition: "background 0.2s",
                  }}
                >
                  {step === "form"       && "Approve & Mint"}
                  {step === "connecting" && "Connecting wallet..."}
                  {step === "approving"  && "Approving USDC..."}
                  {step === "minting"    && "Minting on-chain..."}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
