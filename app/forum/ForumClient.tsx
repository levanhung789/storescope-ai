"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import Link from "next/link";
import { RefreshCw, ExternalLink, ShoppingCart, Plus, Database, BarChart2, FileText } from "lucide-react";
import { PRICING } from "../_lib/arc";
import { loadCircleSession, type CircleSession } from "../_lib/circle";
import { loadListings, type ForumListing } from "../_lib/vault";
import type { LayoutListing } from "../api/contracts/layouts/route";

const WalletButton       = dynamic(() => import("../_components/WalletButton"),       { ssr: false });
const CircleWalletButton = dynamic(() => import("../_components/CircleWalletButton"), { ssr: false });

const MOCK_POSTS = [
  { id: "p1", author: "0x1a2b...3c4d", title: "Placing cooler near checkout — 15% impulse buy lift", body: "After 2 months of testing, moving the cooler from the back wall to within 1.5m of the checkout clearly increased add-on purchase rates...", likes: 24, replies: 8, timestamp: "2026-05-10", tags: ["cooler", "checkout", "impulse"] },
  { id: "p2", author: "0x5e6f...7a8b", title: "Double-sided gondola vs wall shelf — insights from AI data", body: "Using StoreScope AI to analyze 200 shelf images across 5 stores, double-sided gondolas placed mid-floor outperformed wall shelving by 18%...", likes: 41, replies: 15, timestamp: "2026-05-09", tags: ["shelving", "analytics", "AI"] },
];

type Tab    = "layouts" | "data" | "discussion";
type BuyStep = "confirm" | "paying" | "done" | "error";

// ── Purchase Modal ───────────────────────────────────────────────────────────
function PurchaseModal({ layout, circleSession, onClose }: {
  layout:        LayoutListing;
  circleSession: CircleSession | null;
  onClose:       () => void;
}) {
  const { address }                  = useAccount();
  const [step, setStep]              = useState<BuyStep>("confirm");
  const [error, setError]            = useState("");
  const [saleTxHash, setSaleTxHash]  = useState<string | null>(null);
  const [payTxHash, setPayTxHash]    = useState<string | null>(null);

  const activeAddress = circleSession?.walletAddress ?? address;
  const activeWalletId = circleSession?.walletId;

  const handleBuy = async () => {
    if (!activeWalletId || !activeAddress) {
      setError("Please connect Circle Wallet to purchase.");
      setStep("error");
      return;
    }
    setStep("paying");
    try {
      const res  = await fetch("/api/contracts/buy-layout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId:      activeWalletId,
          walletAddress: activeAddress,
          tokenId:       layout.tokenId,
        }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setError(`Insufficient USDC. Have ${data.balance} USDC, need ${data.required} USDC. Get testnet USDC at faucet.circle.com`);
        setStep("error");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Purchase failed");

      setSaleTxHash(data.saleTxHash ?? null);
      setPayTxHash(data.paymentTxHash ?? null);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStep("error");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, padding: 32, maxWidth: 440, width: "100%" }}
        onClick={e => e.stopPropagation()}>

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: "#4ade80" }}>✓</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#4ade80" }}>Purchase Successful!</h3>
            <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>Layout NFT transferred to your wallet on ARC Testnet.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              {payTxHash && (
                <a href={`https://testnet.arcscan.app/tx/${payTxHash}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: "#818cf8", fontFamily: "monospace", textDecoration: "none" }}>
                  Payment: {payTxHash.slice(0, 20)}...↗
                </a>
              )}
              {saleTxHash && (
                <a href={`https://testnet.arcscan.app/tx/${saleTxHash}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", textDecoration: "none" }}>
                  NFT Transfer: {saleTxHash.slice(0, 20)}...↗
                </a>
              )}
            </div>
            <button onClick={onClose} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "10px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        )}

        {step === "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12, color: "#f87171" }}>✗</div>
            <p style={{ color: "#f87171", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>{error}</p>
            <button onClick={() => setStep("confirm")} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Try again</button>
          </div>
        )}

        {step === "paying" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #7c3aed", borderTopColor: "transparent", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#e0e0e0", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Processing payment...</p>
            <p style={{ color: "#555", fontSize: 12, margin: 0 }}>Paying ${layout.price} USDC → then minting transfer on ARC</p>
          </div>
        )}

        {step === "confirm" && (
          <>
            <h3 style={{ margin: "0 0 20px", fontSize: 17 }}>Confirm Purchase</h3>
            <div style={{ background: "#0a0a0a", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>{layout.title}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#a78bfa" }}>${layout.price} USDC</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Token #{layout.tokenId} · RetailLayoutNFT</div>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 20, display: "flex", flexDirection: "column", gap: 4 }}>
              <div>Buyer:  {activeAddress ? `${activeAddress.slice(0, 12)}...` : "No wallet"}</div>
              <div>Seller: {layout.owner.slice(0, 12)}...</div>
              <div style={{ color: "#6366f1", marginTop: 4 }}>Via Circle Wallet · ARC Testnet</div>
            </div>
            {!activeWalletId && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#f87171", marginBottom: 14 }}>
                Connect Circle Wallet to purchase
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 999, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleBuy} disabled={!activeWalletId}
                style={{ flex: 2, background: activeWalletId ? "#7c3aed" : "#2a2a2a", color: activeWalletId ? "#fff" : "#555", border: "none", borderRadius: 999, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: activeWalletId ? "pointer" : "not-allowed" }}>
                Buy for ${layout.price} USDC
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

// ── Main Forum ───────────────────────────────────────────────────────────────
export default function ForumClient() {
  const { isConnected }              = useAccount();
  const [tab, setTab]                = useState<Tab>("layouts");
  const [buyingLayout, setBuying]    = useState<LayoutListing | null>(null);
  const [layouts, setLayouts]        = useState<LayoutListing[]>([]);
  const [totalMinted, setTotal]      = useState(0);
  const [loadingLayouts, setLoading] = useState(true);
  const [circleSession, setCircle]   = useState<CircleSession | null>(null);
  const [vaultListings, setVaultListings] = useState<ForumListing[]>([]);

  useEffect(() => { setCircle(loadCircleSession()); }, []);
  useEffect(() => {
    const all = loadListings().filter(l => !l.sold);
    setVaultListings(all);
  }, [tab]);

  const fetchLayouts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/contracts/layouts");
      const data = await res.json() as { layouts: LayoutListing[]; total: number };
      setLayouts(data.layouts ?? []);
      setTotal(data.total ?? 0);
    } catch { /* keep empty */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLayouts(); }, [fetchLayouts]);

  const canBuy = isConnected || !!circleSession;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1f1f1f", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <a href="/" style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", textDecoration: "none", letterSpacing: "-0.03em" }}>
            storescope<span style={{ color: "#7c3aed" }}>.ai</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CircleWalletButton onDisconnect={() => setCircle(null)} />
            <WalletButton />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "48px 24px" }}>

        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Powered by ARC Network</div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>Forum & Marketplace</h1>
          <p style={{ color: "#888", marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>
            Buy and sell store layouts minted on RetailLayoutNFT · Payments in USDC on ARC Testnet.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 32, marginBottom: 40, padding: "20px 24px", background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, flexWrap: "wrap" }}>
          {[
            { label: "Layouts on-chain", value: String(totalMinted) },
            { label: "For sale",         value: String(layouts.filter(l => l.forSale).length) },
            { label: "Mint fee",         value: `$${PRICING.layoutMint} USDC` },
            { label: "Listing fee",      value: `$${PRICING.layoutList} USDC` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
          <a href={`https://testnet.arcscan.app/address/0x18B434352c1ff1BdAde1E7871823b7bC6eed00dB`}
            target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6366f1", textDecoration: "none", alignSelf: "center" }}>
            <ExternalLink size={12} /> RetailLayoutNFT on ArcScan
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "#111", border: "1px solid #1f1f1f", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {([
            ["layouts",    "Layout Marketplace"],
            ["data",       `Data Marketplace${vaultListings.length > 0 ? ` (${vaultListings.length})` : ""}`],
            ["discussion", "Discussion"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === t ? "#7c3aed" : "transparent", color: tab === t ? "#fff" : "#888", transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>

        {/* Layouts tab */}
        {tab === "layouts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <p style={{ color: "#555", fontSize: 13, margin: 0 }}>On-chain layouts from RetailLayoutNFT · ARC Testnet</p>
                <button onClick={fetchLayouts} disabled={loadingLayouts}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#555", fontSize: 12, cursor: "pointer" }}>
                  <RefreshCw size={11} style={{ animation: loadingLayouts ? "spin 1s linear infinite" : "none" }} /> Refresh
                </button>
              </div>
              <Link href="/layout-editor" style={{ display: "flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                <Plus size={13} /> Create &amp; sell
              </Link>
            </div>

            {loadingLayouts ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#555" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #7c3aed", borderTopColor: "transparent", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
                <p style={{ margin: 0, fontSize: 13 }}>Loading layouts from ARC Testnet...</p>
              </div>
            ) : layouts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", background: "#111", borderRadius: 20, border: "1px dashed #2a2a2a" }}>
                <p style={{ color: "#555", fontSize: 14, margin: "0 0 16px" }}>No layouts minted yet.</p>
                <Link href="/layout-editor" style={{ background: "#7c3aed", color: "#fff", textDecoration: "none", padding: "10px 24px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                  Create the first layout
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
                {layouts.map(layout => (
                  <div key={layout.tokenId} style={{ background: "#111", border: `1px solid ${layout.forSale ? "rgba(124,58,237,0.2)" : "#1f1f1f"}`, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16, transition: "border-color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = layout.forSale ? "rgba(124,58,237,0.2)" : "#1f1f1f")}>

                    {/* Preview */}
                    <div style={{ height: 130, background: "#0a0a0a", borderRadius: 12, border: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>Token #{layout.tokenId}</div>
                        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{layout.title}</div>
                        {layout.forSale && (
                          <div style={{ marginTop: 6, fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(124,58,237,0.15)", color: "#a78bfa", display: "inline-block" }}>For Sale</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{layout.title}</h3>
                      {layout.metadata?.description && (
                        <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.6 }}>{layout.metadata.description}</p>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1f1f1f", paddingTop: 14 }}>
                      <div>
                        {layout.forSale ? (
                          <>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "#a78bfa" }}>${layout.price} USDC</div>
                            <div style={{ fontSize: 11, color: "#555" }}>{layout.owner.slice(0, 10)}...</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: "#555" }}>Not for sale</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <a href={layout.arcScan} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555", textDecoration: "none" }}>
                          <ExternalLink size={11} />
                        </a>
                        {layout.forSale && (
                          <button onClick={() => setBuying(layout)} disabled={!canBuy}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: canBuy ? "#7c3aed" : "#1f1f1f", color: canBuy ? "#fff" : "#555", border: "none", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: canBuy ? "pointer" : "not-allowed" }}>
                            <ShoppingCart size={12} /> Buy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data Marketplace tab */}
        {tab === "data" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <p style={{ color: "#555", fontSize: 13, margin: 0 }}>Analysis reports &amp; datasets listed by community members</p>
              <a href="/dashboard/vault" style={{ display: "flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                <Plus size={13} /> List your data
              </a>
            </div>

            {vaultListings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", background: "#111", borderRadius: 20, border: "1px dashed #2a2a2a" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                <p style={{ color: "#555", fontSize: 14, margin: "0 0 16px" }}>No data listed yet. Be the first seller!</p>
                <a href="/dashboard/vault" style={{ background: "#7c3aed", color: "#fff", textDecoration: "none", padding: "10px 24px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                  Go to My Vault →
                </a>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                {vaultListings.map(listing => (
                  <div key={listing.id} style={{ background: "#111", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Type badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{listing.itemType === "analysis" ? "📊" : listing.itemType === "layout" ? "🏪" : listing.itemType === "note" ? "📝" : "🖼️"}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(124,58,237,0.1)", color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em" }}>{listing.itemType}</span>
                    </div>

                    {/* Title & desc */}
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{listing.title}</h3>
                      {listing.description && (
                        <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.6 }}>{listing.description}</p>
                      )}
                    </div>

                    {/* Preview data */}
                    {listing.previewData && (!!listing.previewData.topBrand || !!listing.previewData.skuCount) && (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {!!listing.previewData.topBrand && (
                          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "#1a1a1a", color: "#666" }}>
                            🏆 {String(listing.previewData.topBrand)}
                          </span>
                        )}
                        {!!listing.previewData.skuCount && (
                          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "#1a1a1a", color: "#666" }}>
                            📦 {Number(listing.previewData.skuCount)} SKUs
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1f1f1f", paddingTop: 14 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>${listing.price} USDC</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                          {listing.sellerEmail ?? `${listing.sellerWallet.slice(0, 10)}...`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#444" }}>{new Date(listing.createdAt).toLocaleDateString()}</span>
                        <button
                          disabled={!canBuy}
                          style={{ display: "flex", alignItems: "center", gap: 5, background: canBuy ? "#7c3aed" : "#1f1f1f", color: canBuy ? "#fff" : "#555", border: "none", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: canBuy ? "pointer" : "not-allowed" }}>
                          <ShoppingCart size={12} /> Buy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discussion tab */}
        {tab === "discussion" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!canBuy && (
              <div style={{ padding: "16px 20px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, fontSize: 13, color: "#a78bfa" }}>
                Connect wallet to post and interact.
              </div>
            )}
            {MOCK_POSTS.map(post => (
              <div key={post.id} style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "#555" }}>{post.author} · {post.timestamp}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {post.tags.map(t => (
                      <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#1f1f1f", color: "#555" }}>{t}</span>
                    ))}
                  </div>
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>{post.title}</h3>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888", lineHeight: 1.7 }}>{post.body}</p>
                <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#555" }}>
                  <span>{post.likes} likes</span>
                  <span>{post.replies} replies</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase modal */}
      {buyingLayout && (
        <PurchaseModal
          layout={buyingLayout}
          circleSession={circleSession}
          onClose={() => setBuying(null)}
        />
      )}

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
