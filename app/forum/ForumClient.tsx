"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import { PRICING } from "../_lib/arc";

const WalletButton = dynamic(() => import("../_components/WalletButton"), { ssr: false });

const MOCK_LAYOUTS = [
  {
    id: "1",
    title: "80m² Mini Mart — Optimized customer flow",
    author: "0x1a2b...3c4d",
    price: 5.00,
    description: "Layout tested across 3 stores, achieving a 23% revenue lift in the chilled section. Includes checkout positioning, double-sided gondolas and promotional end caps.",
    tags: ["mini-mart", "cooler", "checkout"],
    txHash: "0xabc...def",
    timestamp: "2026-04-20",
    size: "20×15m",
    fixtures: 12,
  },
  {
    id: "2",
    title: "40m² Convenience Store — F&B Focus",
    author: "0x5e6f...7a8b",
    price: 3.50,
    description: "Designed around chilled beverages and fresh food. Ideal for narrow floor plans with wide aisle circulation.",
    tags: ["convenience", "F&B", "beverage"],
    txHash: "0x123...456",
    timestamp: "2026-04-22",
    size: "8×5m",
    fixtures: 7,
  },
  {
    id: "3",
    title: "Drugstore Layout — Pharma + FMCG",
    author: "0x9c0d...1e2f",
    price: 8.00,
    description: "Combines a pharmacy counter with FMCG shelving. Optimized for compliance zones and product visibility.",
    tags: ["drugstore", "pharma", "FMCG"],
    txHash: "0x789...abc",
    timestamp: "2026-04-23",
    size: "15×10m",
    fixtures: 18,
  },
];

const MOCK_POSTS = [
  {
    id: "p1",
    author: "0x1a2b...3c4d",
    title: "Placing Pepsi cooler near checkout — 15% impulse buy lift",
    body: "After 2 months of testing, moving the Pepsi cooler from the back wall to within 1.5m of the checkout clearly increased add-on purchase rates...",
    likes: 24,
    replies: 8,
    timestamp: "2026-04-24",
    tags: ["cooler", "checkout", "impulse"],
  },
  {
    id: "p2",
    author: "0x5e6f...7a8b",
    title: "Double-sided gondola vs wall shelf — insights from AI data",
    body: "Using StoreScope AI to analyze 200 shelf images across 5 stores, double-sided gondolas placed mid-floor outperformed wall shelving by 18%...",
    likes: 41,
    replies: 15,
    timestamp: "2026-04-23",
    tags: ["shelving", "analytics", "AI"],
  },
];

type Tab = "layouts" | "discussion";

export default function ForumClient() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("layouts");
  const [buying, setBuying] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1f1f1f", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <a href="/" style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", textDecoration: "none", letterSpacing: "-0.03em" }}>
            storescope<span style={{ color: "#7c3aed" }}>.ai</span>
          </a>
          <WalletButton />
        </div>
      </div>

      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "48px 24px" }}>
        {/* Page title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
            Powered by ARC Network
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
            Forum & Marketplace
          </h1>
          <p style={{ color: "#888", marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>
            Share retail expertise, exchange ideas, and buy or sell store layouts. Payments in USDC on ARC Testnet.
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 32, marginBottom: 40, padding: "20px 24px", background: "#111", border: "1px solid #1f1f1f", borderRadius: 16 }}>
          {[
            { label: "Layouts on-chain", value: "3" },
            { label: "USDC transactions", value: "12" },
            { label: "Members", value: "47" },
            { label: "Listing fee", value: `$${PRICING.layoutList} USDC` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "#111", border: "1px solid #1f1f1f", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {([["layouts", "Layout Marketplace"], ["discussion", "Discussion"]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === t ? "#7c3aed" : "transparent",
              color: tab === t ? "#fff" : "#888",
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* Layout Marketplace */}
        {tab === "layouts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <p style={{ color: "#555", fontSize: 13, margin: 0 }}>
                Each layout is minted on-chain on ARC. Buying = direct USDC transfer to the seller&apos;s wallet.
              </p>
              {isConnected && (
                <a href="/layout-editor" style={{
                  background: "#7c3aed", color: "#fff", textDecoration: "none",
                  padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                }}>
                  + Create &amp; sell a layout
                </a>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {MOCK_LAYOUTS.map(layout => (
                <div key={layout.id} style={{
                  background: "#111", border: "1px solid #1f1f1f", borderRadius: 20,
                  padding: 24, display: "flex", flexDirection: "column", gap: 16,
                  transition: "border-color 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1f1f1f")}
                >
                  {/* Preview placeholder */}
                  <div style={{
                    height: 140, background: "#0a0a0a", borderRadius: 12,
                    border: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>🏪</div>
                      <div style={{ fontSize: 12, color: "#555" }}>{layout.size} · {layout.fixtures} fixtures</div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{layout.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#888", lineHeight: 1.6 }}>{layout.description}</p>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {layout.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 999,
                        background: "rgba(124,58,237,0.12)", color: "#a78bfa",
                        border: "1px solid rgba(124,58,237,0.2)",
                      }}>{tag}</span>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1f1f1f", paddingTop: 16 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#a78bfa" }}>${layout.price.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>USDC · {layout.author}</div>
                    </div>
                    <button
                      onClick={() => setBuying(layout.id)}
                      disabled={!isConnected}
                      style={{
                        background: isConnected ? "#7c3aed" : "#1f1f1f",
                        color: isConnected ? "#fff" : "#555",
                        border: "none", borderRadius: 999, padding: "8px 18px",
                        fontSize: 13, fontWeight: 600, cursor: isConnected ? "pointer" : "not-allowed",
                      }}
                    >
                      {isConnected ? "Buy layout" : "Connect Wallet"}
                    </button>
                  </div>

                  {buying === layout.id && (
                    <PurchaseModal layout={layout} onClose={() => setBuying(null)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discussion tab */}
        {tab === "discussion" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!isConnected && (
              <div style={{ padding: "16px 20px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, fontSize: 13, color: "#a78bfa" }}>
                Connect your wallet to post and interact.
              </div>
            )}
            {MOCK_POSTS.map(post => (
              <div key={post.id} style={{
                background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 24,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "#555" }}>{post.author} · {post.timestamp}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {post.tags.map(t => (
                      <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#1f1f1f", color: "#555" }}>{t}</span>
                    ))}
                  </div>
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>{post.title}</h3>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888", lineHeight: 1.7 }}>{post.body}</p>
                <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#555" }}>
                  <span>♥ {post.likes} likes</span>
                  <span>💬 {post.replies} replies</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PurchaseModal({ layout, onClose }: {
  layout: typeof MOCK_LAYOUTS[0];
  onClose: () => void;
}) {
  const { address } = useAccount();
  const [step, setStep] = useState<"confirm" | "approving" | "buying" | "done">("confirm");

  const handleBuy = async () => {
    setStep("approving");
    await new Promise(r => setTimeout(r, 1500));
    setStep("buying");
    await new Promise(r => setTimeout(r, 1500));
    setStep("done");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "#111", border: "1px solid #2a2a2a", borderRadius: 20,
        padding: 32, maxWidth: 420, width: "100%",
      }} onClick={e => e.stopPropagation()}>
        {step === "done" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ margin: "0 0 8px" }}>Purchase successful!</h3>
            <p style={{ color: "#888", fontSize: 13 }}>The layout has been transferred to your wallet. Check it on ArcScan.</p>
            <button onClick={onClose} style={{ marginTop: 20, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ margin: "0 0 20px", fontSize: 17 }}>Confirm purchase</h3>
            <div style={{ background: "#0a0a0a", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>{layout.title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#a78bfa" }}>${layout.price.toFixed(2)} USDC</div>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>
              <div>From: {address?.slice(0, 10)}...</div>
              <div>To: {layout.author}</div>
              <div style={{ marginTop: 8, color: "#7c3aed" }}>Network: ARC Testnet (Chain ID 5042002)</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 999, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleBuy} disabled={step !== "confirm"} style={{
                flex: 2, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999,
                padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: step === "confirm" ? "pointer" : "wait",
              }}>
                {step === "confirm"  && "Confirm & Buy"}
                {step === "approving" && "Approving USDC..."}
                {step === "buying"   && "Processing..."}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
