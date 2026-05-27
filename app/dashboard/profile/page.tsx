"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Pencil, MoreHorizontal, Camera,
  Search, Grid3x3, List, Star, Tag, Trash2,
  ShoppingBag, RefreshCw, Plus,
  ChevronDown, ChevronUp, Filter, X, Check,
} from "lucide-react";
import {
  loadItems, loadFolders,
  deleteItem, updateItem,
  importAnalysisReports, createListing, removeListing, loadListings,
  type VaultItem, type VaultFolder, type ForumListing,
} from "../../_lib/vault";
import { loadCircleSession } from "../../_lib/circle";

const WalletButton       = dynamic(() => import("../../_components/WalletButton"),       { ssr: false });
const CircleWalletButton = dynamic(() => import("../../_components/CircleWalletButton"), { ssr: false });

// ── Canvas bg-removal image ────────────────────────────────────────────────
function NoBgImage({ src, size, threshold = 236 }: { src: string; size: number; threshold?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height); const px = d.data;
      const edge = threshold - 22;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        if (r > threshold && g > threshold && b > threshold) { px[i + 3] = 0; }
        else if (r > edge && g > edge && b > edge) {
          const br = (r + g + b) / 3;
          px[i + 3] = Math.round(255 * (1 - (br - edge) / (threshold - edge)));
        }
      }
      ctx.putImageData(d, 0, 0);
    };
    img.src = src;
  }, [src, threshold]);
  return <canvas ref={ref} style={{ width: size, height: size, display: "inline-block", objectFit: "contain", verticalAlign: "middle" }} />;
}

// ── Profile data ──────────────────────────────────────────────────────────
type ProfileData = { name: string; bio: string; bannerImage?: string; avatarImage?: string; };

function loadProfileData(walletId: string): ProfileData {
  try { return { name: "", bio: "", ...JSON.parse(localStorage.getItem(`profile_data_${walletId}`) ?? "{}") }; }
  catch { return { name: "", bio: "" }; }
}
function saveProfileData(walletId: string, data: ProfileData) {
  if (!walletId) return;
  localStorage.setItem(`profile_data_${walletId}`, JSON.stringify(data));
}

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000)     return "just now";
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function shortAddr(a: string) { return a.slice(0, 6) + "..." + a.slice(-4); }

type ProfileTab   = "items" | "analysis" | "layouts" | "listings" | "favorites" | "activity";
type StatusFilter = "all" | "listed" | "not-listed" | "starred";

// ── List for Sale Modal ────────────────────────────────────────────────────
function SaleModal({ item, walletId, listings, onSave, onRemove, onClose }: {
  item: VaultItem; walletId: string; listings: ForumListing[];
  onSave: (title: string, desc: string, price: number) => void;
  onRemove: () => void; onClose: () => void;
}) {
  const existing = listings.find(l => l.itemId === item.id && !l.sold);
  const [title, setTitle] = useState(existing?.title ?? item.name);
  const [desc,  setDesc]  = useState(existing?.description ?? (item.summary ?? ""));
  const [price, setPrice] = useState(existing?.price ?? 0.5);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, padding: 32, width: "100%", maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>{existing ? "Update Listing" : "List for Sale"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
            style={{ padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 14, outline: "none" }} />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Description..."
            style={{ padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))}
              style={{ flex: 1, padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#a78bfa", fontSize: 18, fontWeight: 700, outline: "none" }} />
            <span style={{ color: "#555" }}>USDC</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[0.1, 0.5, 1, 2, 5].map(p => (
              <button key={p} onClick={() => setPrice(p)}
                style={{ padding: "4px 10px", fontSize: 11, borderRadius: 999, border: `1px solid ${price === p ? "#7c3aed" : "#2a2a2a"}`, background: price === p ? "rgba(124,58,237,0.15)" : "#0a0a0a", color: price === p ? "#a78bfa" : "#555", cursor: "pointer" }}>
                ${p}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {existing
            ? <button onClick={onRemove} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 12, cursor: "pointer", fontSize: 13 }}>Remove</button>
            : <button onClick={onClose}  style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid #2a2a2a", color: "#666", borderRadius: 12, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          }
          <button onClick={() => title.trim() && price > 0 && onSave(title.trim(), desc.trim(), price)}
            style={{ flex: 2, padding: "10px 0", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {existing ? "Update →" : "List on Marketplace →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Item Card ──────────────────────────────────────────────────────────────
function ItemCard({ item, listing, selected, onSelect, onClick }: {
  item: VaultItem; listing?: ForumListing;
  selected: boolean; onSelect: () => void; onClick: () => void;
}) {
  return (
    <div onClick={onClick}
      style={{ background: "#111", border: `1.5px solid ${selected ? "#7c3aed" : "#1f1f1f"}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.15s", position: "relative" }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{ position: "absolute", top: 8, left: 8, zIndex: 2, width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? "#7c3aed" : "rgba(255,255,255,0.2)"}`, background: selected ? "#7c3aed" : "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {selected && <Check size={11} color="#fff" />}
      </div>
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4, zIndex: 2 }}>
        {item.starred && <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}><Star size={10} color="#fbbf24" fill="#fbbf24" /></div>}
        {listing && <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(124,58,237,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}><Tag size={10} color="#fff" /></div>}
      </div>
      <div style={{ height: 140, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #1a1a1a" }}>
        {item.type === "layout"
          ? <NoBgImage src="/store-layout-icon.png" size={80} />
          : <span style={{ fontSize: 52 }}>{item.type === "analysis" ? "📊" : item.type === "note" ? "📝" : "🖼️"}</span>}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
        <div style={{ fontSize: 11, color: "#444" }}>{timeAgo(item.updatedAt)}</div>
        {item.type === "analysis" && item.topBrand && (
          <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>{item.topBrand}</span>
            {item.skuCount !== undefined && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#1a1a1a", color: "#555" }}>{item.skuCount} SKUs</span>}
          </div>
        )}
        {listing && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>${listing.price} USDC</div>}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [circleSession, setCircle] = useState<{ walletId: string; walletAddress: string; userId?: string } | null>(null);
  const walletId  = circleSession?.walletAddress ?? address ?? "";
  const connected = isConnected || !!circleSession;

  const [items,    setItems]    = useState<VaultItem[]>([]);
  const [folders,  setFolders]  = useState<VaultFolder[]>([]);
  const [listings, setListings] = useState<ForumListing[]>([]);

  const [tab,          setTab]          = useState<ProfileTab>("items");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter,   setTypeFilter]   = useState<string>("all");
  const [search,       setSearch]       = useState("");
  const [viewMode,     setViewMode]     = useState<"grid" | "list">("grid");
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [saleItem,     setSaleItem]     = useState<VaultItem | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [statusOpen,   setStatusOpen]   = useState(true);
  const [typeOpen,     setTypeOpen]     = useState(true);

  // ── Profile edit states ──────────────────────────────────────────────────
  const [profileData, setProfileData] = useState<ProfileData>({ name: "", bio: "" });
  const [editingName, setEditingName] = useState(false);
  const [editingBio,  setEditingBio]  = useState(false);
  const [nameInput,   setNameInput]   = useState("");
  const [bioInput,    setBioInput]    = useState("");
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const reload = useCallback(() => {
    if (!walletId) return;
    setItems(loadItems(walletId));
    setFolders(loadFolders(walletId));
    setListings(loadListings());
  }, [walletId]);

  useEffect(() => { setCircle(loadCircleSession()); }, []);
  useEffect(() => { reload(); }, [reload]);

  // Load profile data when wallet changes
  useEffect(() => {
    if (!walletId) return;
    const pd = loadProfileData(walletId);
    setProfileData(pd);
    setNameInput(pd.name ?? "");
    setBioInput(pd.bio ?? "");
  }, [walletId]);

  // ── Profile update helper ────────────────────────────────────────────────
  const updateProfile = (updates: Partial<ProfileData>) => {
    setProfileData(prev => {
      const nd = { ...prev, ...updates };
      saveProfileData(walletId, nd);
      return nd;
    });
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateProfile({ bannerImage: ev.target?.result as string });
    reader.readAsDataURL(file);
    showToast("✅ Banner updated");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateProfile({ avatarImage: ev.target?.result as string });
    reader.readAsDataURL(file);
    showToast("✅ Avatar updated");
  };

  const saveName = () => {
    updateProfile({ name: nameInput.trim() });
    setEditingName(false);
    showToast("✅ Name saved");
  };

  const saveBio = () => {
    updateProfile({ bio: bioInput.trim() });
    setEditingBio(false);
    showToast("✅ Bio saved");
  };

  const handleImport = () => {
    if (!walletId) return;
    const n = importAnalysisReports(walletId);
    reload();
    showToast(n > 0 ? `✅ Imported ${n} report${n > 1 ? "s" : ""}` : "No new reports");
  };

  // ── Filtered items ───────────────────────────────────────────────────────
  const filtered = items.filter(i => {
    if (tab === "analysis"  && i.type !== "analysis") return false;
    if (tab === "layouts"   && i.type !== "layout")   return false;
    if (tab === "listings"  && !i.forSale)            return false;
    if (tab === "favorites" && !i.starred)            return false;
    if (statusFilter === "listed"     && !i.forSale)  return false;
    if (statusFilter === "not-listed" &&  i.forSale)  return false;
    if (statusFilter === "starred"    && !i.starred)  return false;
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  // ── Stats ────────────────────────────────────────────────────────────────
  const analyses  = items.filter(i => i.type === "analysis");
  const layouts   = items.filter(i => i.type === "layout");
  const forSaleN  = items.filter(i => i.forSale).length;
  const usdcSpent = analyses.reduce((s, i) => s + (i.totalPaid ?? 0), 0);
  const joinDate  = items.length > 0
    ? new Date(Math.min(...items.map(i => i.createdAt))).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
    : "—";

  const displayName = profileData.name ||
    (circleSession?.userId ? circleSession.userId.split("@")[0] : address ? shortAddr(address) : "Anonymous");

  const avatarChar = circleSession?.userId
    ? circleSession.userId[0].toUpperCase()
    : address ? address[2].toUpperCase() : "?";

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleListForSale = (title: string, desc: string, price: number) => {
    if (!saleItem) return;
    if (saleItem.listingId) removeListing(saleItem.listingId);
    const lst = createListing(walletId, saleItem, title, desc, price, circleSession?.userId);
    updateItem(walletId, saleItem.id, { forSale: true, price, listingId: lst.id, folderId: "f-forsale" });
    setSaleItem(null); reload(); showToast("🏷️ Listed!");
  };

  const handleRemoveListing = () => {
    if (!saleItem?.listingId) return;
    removeListing(saleItem.listingId);
    updateItem(walletId, saleItem.id, { forSale: false, price: undefined, listingId: undefined });
    setSaleItem(null); reload(); showToast("Listing removed");
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => deleteItem(walletId, id));
    setSelectedIds(new Set());
    reload(); showToast(`Deleted ${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""}`);
  };

  const handleStarSelected = () => {
    selectedIds.forEach(id => {
      const it = items.find(i => i.id === id);
      if (it) updateItem(walletId, id, { starred: !it.starred });
    });
    setSelectedIds(new Set()); reload();
  };

  const TABS: { key: ProfileTab; label: string; count?: number }[] = [
    { key: "items",     label: "Items",     count: items.length },
    { key: "analysis",  label: "Analysis",  count: analyses.length },
    { key: "layouts",   label: "Layouts",   count: layouts.length },
    { key: "listings",  label: "Listings",  count: forSaleN },
    { key: "favorites", label: "Favorites", count: items.filter(i => i.starred).length },
    { key: "activity",  label: "Activity" },
  ];

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🔐</div>
        <h2 style={{ margin: 0, fontSize: 22, color: "#f0f0f0", fontWeight: 700 }}>Connect your wallet</h2>
        <p style={{ margin: 0, color: "#555", fontSize: 14 }}>Your profile is linked to your wallet.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <CircleWalletButton onDisconnect={() => setCircle(null)} />
          <WalletButton />
        </div>
        <Link href="/dashboard" style={{ color: "#7c3aed", fontSize: 13, textDecoration: "none" }}>← Dashboard</Link>
      </div>
    );
  }

  const bannerBg = profileData.bannerImage
    ? `url(${profileData.bannerImage}) center/cover no-repeat`
    : "linear-gradient(135deg,#0f0520 0%,#2d1b69 30%,#4c1d95 55%,#6d28d9 75%,#1a0533 100%)";

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", fontFamily: "inherit" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 20px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 13, color: "#f0f0f0", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div style={{ height: 240, background: bannerBg, position: "relative", overflow: "hidden" }}>
        {/* Glow orbs (only on gradient banner) */}
        {!profileData.bannerImage && <>
          <div style={{ position: "absolute", top: "-30%", left: "20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.25) 0%,transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", top: "10%", right: "15%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,72,153,0.2) 0%,transparent 70%)", filter: "blur(30px)" }} />
        </>}

        {/* Top nav */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", textDecoration: "none", letterSpacing: "-0.03em" }}>
            storescope<span style={{ color: "#a78bfa" }}>.ai</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CircleWalletButton onDisconnect={() => setCircle(null)} />
            <WalletButton />
          </div>
        </div>

        {/* Edit cover button — bottom right */}
        <label style={{ position: "absolute", bottom: 12, right: 16, display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, color: "#f0f0f0", fontSize: 12, cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.75)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.55)")}>
          <Camera size={12} /> Edit cover
          <input ref={bannerFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBannerUpload} />
        </label>
      </div>

      {/* ── 3-column layout ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* ── Left aside: profile nav + app shortcuts ───────────────────── */}
        <aside style={{ width: 196, flexShrink: 0, padding: "20px 14px 40px 18px", position: "sticky", top: 0, maxHeight: "100vh", overflowY: "auto", borderRight: "1px solid #111" }}>
          <div style={{ fontSize: 10, color: "#333", letterSpacing: "0.12em", marginBottom: 8, fontWeight: 600 }}>PROFILE</div>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedIds(new Set()); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 10px", borderRadius: 8, background: tab === t.key ? "rgba(124,58,237,0.1)" : "transparent", border: tab === t.key ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent", color: tab === t.key ? "#a78bfa" : "#555", fontSize: 12, cursor: "pointer", textAlign: "left", marginBottom: 2, fontWeight: tab === t.key ? 600 : 400, fontFamily: "inherit" }}>
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && <span style={{ fontSize: 10, color: tab === t.key ? "#7c3aed" : "#2a2a2a" }}>{t.count}</span>}
            </button>
          ))}
          <div style={{ height: 1, background: "#1a1a1a", margin: "14px 0" }} />
          <div style={{ fontSize: 10, color: "#333", letterSpacing: "0.12em", marginBottom: 8, fontWeight: 600 }}>TOOLS</div>
          {[
            { label: "Dashboard",    href: "/dashboard",              icon: "🏠" },
            { label: "AI Analysis",  href: "/dashboard/analysis",     icon: "📊" },
            { label: "Vision Agent", href: "/dashboard/vision-agent", icon: "👁️" },
            { label: "AI Agent",     href: "/dashboard/agent",        icon: "🤖" },
            { label: "My Reports",   href: "/dashboard/reports",      icon: "📋" },
            { label: "Store Layout", href: "/layout-editor",          icon: "🏪" },
            { label: "Forum",        href: "/forum",                  icon: "💬" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 8, color: "#555", fontSize: 12, textDecoration: "none", marginBottom: 2, transition: "color 0.12s" }}>
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </aside>

        {/* ── Center content (original, unchanged) ─────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, padding: "0 20px" }}>

        {/* ── Header row: [Avatar] [Name+Bio] [Buttons] ─────────────────── */}
        {/* Avatar uses marginTop:-65 to pull up 65px into the banner */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>

          {/* ── Avatar (left column) ────────────────────────────────────── */}
          <div style={{ position: "relative", flexShrink: 0, marginTop: -78, zIndex: 10 }}>
            <div style={{ width: 156, height: 156, borderRadius: "50%", border: "5px solid #080808", background: profileData.avatarImage ? "transparent" : "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 62, fontWeight: 700, color: "#fff", overflow: "hidden", boxShadow: "0 10px 40px rgba(124,58,237,0.5)" }}>
              {profileData.avatarImage
                ? <img src={profileData.avatarImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
                : avatarChar}
            </div>
            {/* Camera button */}
            <label style={{ position: "absolute", bottom: 6, right: 6, width: 34, height: 34, borderRadius: "50%", background: "#7c3aed", border: "3px solid #080808", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 11, transition: "transform 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.12)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
              <Camera size={13} color="#fff" />
              <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* ── Name + Bio + Badges (center column) ─────────────────────── */}
          {/* paddingTop: 16 = small gap from banner bottom */}
          <div style={{ flex: 1, paddingTop: 16 }}>

            {/* Name row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {editingName ? (
                <>
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                    autoFocus
                    placeholder="Enter display name..."
                    style={{ fontSize: 24, fontWeight: 800, background: "transparent", border: "none", borderBottom: "2px solid #7c3aed", color: "#f0f0f0", outline: "none", letterSpacing: "-0.03em", padding: "2px 4px", minWidth: 220 }}
                  />
                  <button onClick={saveName} style={{ padding: "5px 12px", background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                  <button onClick={() => setEditingName(false)} style={{ padding: "5px 10px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: "#555", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f0f0" }}>{displayName}</h1>
                  <button onClick={() => { setNameInput(profileData.name ?? ""); setEditingName(true); }}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 3, borderRadius: 6, transition: "color 0.1s" }}
                    title="Edit name"
                    onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
                    <Pencil size={14} />
                  </button>
                  <button style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 3 }}>
                    <MoreHorizontal size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Bio row */}
            <div style={{ marginBottom: 12 }}>
              {editingBio ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <textarea
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Escape") setEditingBio(false); }}
                    autoFocus
                    rows={2}
                    placeholder="Write a short bio about yourself..."
                    style={{ minWidth: 340, maxWidth: 520, padding: "8px 12px", background: "#0f0f0f", border: "1px solid rgba(124,58,237,0.35)", borderRadius: 10, color: "#e0e0e0", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                  />
                  <button onClick={saveBio} style={{ padding: "8px 14px", background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Save bio</button>
                  <button onClick={() => setEditingBio(false)} style={{ padding: "8px 10px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: "#555", fontSize: 12, cursor: "pointer" }}>✕</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, color: profileData.bio ? "#999" : "#333", fontStyle: profileData.bio ? "normal" : "italic", lineHeight: 1.6, maxWidth: 520 }}>
                    {profileData.bio || "Add a bio to tell people more about yourself..."}
                  </p>
                  <button onClick={() => { setBioInput(profileData.bio ?? ""); setEditingBio(true); }}
                    style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: 3, borderRadius: 6, flexShrink: 0, transition: "color 0.1s" }}
                    title="Edit bio"
                    onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#444")}>
                    <Pencil size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Meta badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {items.length > 0 && (
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#666", letterSpacing: "0.05em" }}>
                  JOINED {joinDate}
                </span>
              )}
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}>
                {isConnected && address ? "METAMASK" : circleSession ? "CIRCLE WALLET" : "WALLET"}
              </span>
              {walletId && (
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#555", fontFamily: "monospace" }}>
                  {shortAddr(walletId)}
                </span>
              )}
            </div>
          </div>{/* end center column */}

          {/* ── Action buttons (right column) ────────────────────────────── */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexShrink: 0, paddingTop: 16 }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 10, fontSize: 12, textDecoration: "none" }}>
              ← Dashboard
            </Link>
            <button onClick={handleImport} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "#111", border: "1px solid #2a2a2a", color: "#888", borderRadius: 10, fontSize: 12, cursor: "pointer" }}>
              <RefreshCw size={11} /> Sync
            </button>
            <Link href="/dashboard/analysis" style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "#7c3aed", border: "none", color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              <Plus size={11} /> New Analysis
            </Link>
          </div>

        </div>{/* end header row */}

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 14, overflow: "hidden" }}>
          {[
            { label: "USDC SPENT", value: `$${usdcSpent.toFixed(2)}`, color: "#4ade80" },
            { label: "ANALYSES",   value: String(analyses.length),    color: "#a78bfa" },
            { label: "LAYOUTS",    value: String(layouts.length),     color: "#6ee7b7" },
            { label: "FOR SALE",   value: String(forSaleN),           color: "#f59e0b" },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ flex: 1, padding: "16px 20px", borderRight: i < arr.length - 1 ? "1px solid #1f1f1f" : "none", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#444", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div style={{ borderBottom: "1px solid #1f1f1f", marginBottom: 0, display: "flex", gap: 0, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedIds(new Set()); }}
              style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.key ? "#7c3aed" : "transparent"}`, color: tab === t.key ? "#f0f0f0" : "#555", fontSize: 14, fontWeight: tab === t.key ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: tab === t.key ? "rgba(124,58,237,0.2)" : "#1a1a1a", color: tab === t.key ? "#a78bfa" : "#444" }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content area ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 0, minHeight: 600 }}>

          {/* Sidebar */}
          {sidebarOpen && tab !== "activity" && (
            <aside style={{ width: 240, flexShrink: 0, borderRight: "1px solid #1f1f1f", paddingTop: 20, paddingRight: 20 }}>
              {/* Status filter */}
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => setStatusOpen(v => !v)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", color: "#f0f0f0", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "0 0 10px" }}>
                  Status {statusOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {statusOpen && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(["all", "listed", "not-listed", "starred"] as StatusFilter[]).map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${statusFilter === s ? "#7c3aed" : "#2a2a2a"}`, background: statusFilter === s ? "rgba(124,58,237,0.12)" : "transparent", color: statusFilter === s ? "#a78bfa" : "#666", fontSize: 12, cursor: "pointer", fontWeight: statusFilter === s ? 600 : 400 }}>
                        {s === "all" ? "All" : s === "listed" ? "Listed" : s === "not-listed" ? "Not Listed" : "⭐ Starred"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Type filter */}
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => setTypeOpen(v => !v)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", color: "#f0f0f0", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "0 0 10px" }}>
                  Type {typeOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {typeOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      { key: "all",      label: "All Types",    icon: "✦" },
                      { key: "analysis", label: "Analysis",     icon: "📊" },
                      { key: "layout",   label: "Store Layout", icon: "🏪" },
                      { key: "note",     label: "Notes",        icon: "📝" },
                    ].map(t => (
                      <button key={t.key} onClick={() => setTypeFilter(t.key)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: `1px solid ${typeFilter === t.key ? "rgba(124,58,237,0.3)" : "transparent"}`, background: typeFilter === t.key ? "rgba(124,58,237,0.08)" : "transparent", color: typeFilter === t.key ? "#a78bfa" : "#666", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontSize: 14 }}>
                          {t.key === "layout" ? <NoBgImage src="/store-layout-icon.png" size={16} /> : t.icon}
                        </span>
                        <span style={{ flex: 1 }}>{t.label}</span>
                        <span style={{ fontSize: 11, color: "#444" }}>
                          {t.key === "all" ? items.length : items.filter(i => i.type === t.key).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Wallets */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", marginBottom: 10 }}>Wallets</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", color: "#a78bfa", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {walletId ? shortAddr(walletId) : "—"}
                    </span>
                    <span style={{ fontSize: 10, background: "rgba(124,58,237,0.2)", padding: "1px 5px", borderRadius: 999, color: "#a78bfa" }}>Active</span>
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 20, paddingLeft: sidebarOpen && tab !== "activity" ? 20 : 0 }}>

            {/* Toolbar */}
            {tab !== "activity" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <button onClick={() => setSidebarOpen(v => !v)}
                  style={{ padding: "8px 10px", background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <Filter size={12} /> {sidebarOpen ? "Hide" : "Filter"}
                </button>
                <div style={{ flex: 1, maxWidth: 360, position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#444" }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
                    style={{ width: "100%", padding: "8px 12px 8px 30px", background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#f0f0f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0 }}><X size={12} /></button>}
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#444" }}>{filtered.length} items</span>
                  <button onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
                    style={{ padding: "7px 10px", background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, color: viewMode === "grid" ? "#a78bfa" : "#555", cursor: "pointer" }}>
                    {viewMode === "grid" ? <Grid3x3 size={14} /> : <List size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Activity tab */}
            {tab === "activity" && (
              <div style={{ padding: "20px 0" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "#f0f0f0" }}>Recent Activity</h3>
                {items.slice(0, 10).map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #1a1a1a" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#111", border: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {item.type === "layout" ? <NoBgImage src="/store-layout-icon.png" size={22} /> : <span style={{ fontSize: 18 }}>{item.type === "analysis" ? "📊" : item.type === "note" ? "📝" : "🖼️"}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "#444" }}>{item.forSale ? "Listed for $" + item.price + " USDC" : item.starred ? "Starred" : item.type + " added"}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#444", whiteSpace: "nowrap" }}>{timeAgo(item.updatedAt)}</div>
                  </div>
                ))}
                {items.length === 0 && <p style={{ color: "#444", fontSize: 13 }}>No activity yet. Sync your analysis reports to get started.</p>}
              </div>
            )}

            {/* Items grid / list */}
            {tab !== "activity" && (
              filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", borderTop: "1px solid #1f1f1f" }}>
                  <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>
                    {tab === "analysis" ? "📊" : tab === "layouts" ? "🏪" : tab === "listings" ? "🏷️" : tab === "favorites" ? "⭐" : "📦"}
                  </div>
                  <p style={{ color: "#333", fontSize: 15, margin: "0 0 20px", fontWeight: 600 }}>No items found</p>
                  {tab === "items" && (
                    <button onClick={handleImport} style={{ padding: "10px 24px", background: "#7c3aed", border: "none", borderRadius: 999, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Import Analysis History
                    </button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14 }}>
                  {filtered.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      listing={listings.find(l => l.itemId === item.id && !l.sold)}
                      selected={selectedIds.has(item.id)}
                      onSelect={() => toggleSelect(item.id)}
                      onClick={() => setSaleItem(item)}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 100px 80px 80px 100px", gap: 12, padding: "8px 14px", fontSize: 11, color: "#333", textTransform: "uppercase", letterSpacing: "0.06em", borderTop: "1px solid #1f1f1f", borderBottom: "1px solid #1f1f1f" }}>
                    <div /><div>Name</div><div>Type</div><div>Status</div><div style={{ textAlign: "right" }}>Price</div><div style={{ textAlign: "right" }}>Updated</div>
                  </div>
                  {filtered.map(item => {
                    const lst = listings.find(l => l.itemId === item.id && !l.sold);
                    return (
                      <div key={item.id} onClick={() => setSaleItem(item)}
                        style={{ display: "grid", gridTemplateColumns: "24px 1fr 100px 80px 80px 100px", gap: 12, padding: "12px 14px", borderBottom: "1px solid #0f0f0f", cursor: "pointer", alignItems: "center", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}>
                        <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} onClick={e => e.stopPropagation()} style={{ cursor: "pointer" }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                          {item.topBrand && <div style={{ fontSize: 11, color: "#555" }}>{item.topBrand}</div>}
                        </div>
                        <div><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "#1a1a1a", color: "#666" }}>{item.type}</span></div>
                        <div style={{ fontSize: 11, color: lst ? "#a78bfa" : item.starred ? "#fbbf24" : "#333" }}>{lst ? "For Sale" : item.starred ? "Starred" : "—"}</div>
                        <div style={{ textAlign: "right", fontSize: 12, color: lst ? "#a78bfa" : "#333", fontWeight: lst ? 700 : 400 }}>{lst ? `$${item.price}` : "-"}</div>
                        <div style={{ textAlign: "right", fontSize: 11, color: "#444" }}>{timeAgo(item.updatedAt)}</div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
        </div>{/* end center content */}

        {/* ── Right aside: Twitter/X-style sticky cards ────────────────── */}
        <aside style={{ width: 290, flexShrink: 0, padding: "16px 16px 40px 12px", position: "sticky", top: 0, alignSelf: "flex-start", maxHeight: "100vh", overflowY: "auto" }}>

          {/* ── Card 1: Upgrade to Pro ──────────────────────────────────── */}
          <div style={{ background: "#111", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "16px 16px 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f0f0", marginBottom: 6, letterSpacing: "-0.02em" }}>Upgrade to StoreScope Pro</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.55, marginBottom: 14 }}>
                Phân tích không giới hạn, AI ưu tiên cao và dữ liệu thị trường nâng cao.
              </div>
              <button style={{ width: "100%", padding: "10px 0", background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", borderRadius: 999, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 14, letterSpacing: "-0.01em" }}>
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* ── Card 2: Đang hoạt động (Live) ──────────────────────────── */}
          <div style={{ background: "#111", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "14px 16px 6px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", marginBottom: 12, letterSpacing: "-0.02em" }}>Đang hoạt động</div>
            </div>
            {[
              { icon: "📊", sector: "FMCG", label: "Phân tích vừa hoàn thành", colors: ["#7c3aed","#ec4899","#06b6d4"], count: "+207" },
              { icon: "📊", sector: "Điện tử", label: "Báo cáo thị trường mới", colors: ["#10b981","#f59e0b","#8b5cf6"], count: "+88" },
              { icon: "🏪", sector: "Bán lẻ", label: "Layout đang được xem", colors: ["#f43f5e","#a78bfa","#34d399"], count: "+50" },
            ].map((row, i) => (
              <div key={i} style={{ padding: "10px 16px", borderTop: i > 0 ? "1px solid #1a1a1a" : "none", cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#161616")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{row.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{row.sector}</div>
                      <div style={{ fontSize: 12, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</div>
                    </div>
                  </div>
                  {/* Avatar cluster + count */}
                  <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex" }}>
                      {row.colors.map((c, ci) => (
                        <div key={ci} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "2px solid #111", marginLeft: ci > 0 ? -7 : 0, position: "relative", zIndex: 3 - ci }} />
                      ))}
                    </div>
                    <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700, color: "#888", background: "#1a1a1a", padding: "2px 7px", borderRadius: 999 }}>{row.count}</span>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding: "10px 16px 14px" }}>
              <Link href="/dashboard/analysis" style={{ fontSize: 13, color: "#7c3aed", textDecoration: "none", fontWeight: 500 }}>Xem tất cả →</Link>
            </div>
          </div>

          {/* ── Card 3: Tin tức & Insights (dismissable) ───────────────── */}
          <div style={{ background: "#111", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.02em" }}>Tin tức hôm nay</div>
              <button style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
            {[
              { avatarColor: "#7c3aed", avatarColor2: "#ec4899", title: "Arc Welcomes Goldsky with Builders Fund Backing for Blockchain Data Tools", time: "10 giờ trước", cat: "Tin tức", count: "199 bài" },
              { avatarColor: "#06b6d4", avatarColor2: "#10b981", title: "Arc Blockchain Community Hits 1,900 Architects Ahead of Office Hours", time: "22 giờ trước", cat: "Khác", count: "594 bài" },
              { avatarColor: "#f59e0b", avatarColor2: "#f43f5e", title: "Tokenized Real-World Assets Hit $34 Billion Milestone", time: "5 giờ trước", cat: "Tin tức", count: "282 bài" },
            ].map((n, i) => (
              <div key={i} style={{ padding: "12px 16px", borderTop: "1px solid #1a1a1a", cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#161616")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.45, marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{n.time} · {n.cat} · {n.count}</div>
                  </div>
                  {/* Double avatar */}
                  <div style={{ position: "relative", flexShrink: 0, width: 40, height: 40 }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: 28, height: 28, borderRadius: "50%", background: n.avatarColor, border: "2px solid #111" }} />
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: n.avatarColor2, border: "2px solid #111" }} />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding: "10px 16px 14px" }}>
              <Link href="/forum" style={{ fontSize: 13, color: "#7c3aed", textDecoration: "none", fontWeight: 500 }}>Xem thêm →</Link>
            </div>
          </div>

          {/* ── Card 4: Wallet / Quick actions ─────────────────────────── */}
          <div style={{ background: "#111", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 4px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", marginBottom: 12, letterSpacing: "-0.02em" }}>Ví của tôi</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>{walletId ? shortAddr(walletId) : "—"}</span>
                <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 800, color: "#4ade80", letterSpacing: "-0.02em" }}>${usdcSpent.toFixed(2)}</span>
              </div>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                {[
                  { label: "Phân tích", value: analyses.length,  color: "#a78bfa" },
                  { label: "Layout",    value: layouts.length,   color: "#6ee7b7" },
                  { label: "Đang bán",  value: forSaleN,          color: "#f59e0b" },
                  { label: "Yêu thích", value: items.filter(i => i.starred).length, color: "#fbbf24" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#0a0a0a", borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#444", marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <Link href="/dashboard/analysis" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", borderRadius: 999, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  <Plus size={13} /> Phân tích mới
                </Link>
                <button onClick={handleImport} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "transparent", border: "1px solid #2a2a2a", color: "#666", borderRadius: 999, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  <RefreshCw size={12} /> Đồng bộ
                </button>
              </div>
            </div>
          </div>

        </aside>

      </div>{/* end 3-col layout */}

      {/* ── Bottom action bar ───────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #1f1f1f", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#888" }}>{selectedIds.size} selected</span>
          <button onClick={() => { const item = items.find(i => selectedIds.has(i.id)); if (item) setSaleItem(item); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#7c3aed", border: "none", color: "#fff", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <ShoppingBag size={13} /> List items
          </button>
          <button onClick={handleStarSelected}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 999, fontSize: 13, cursor: "pointer" }}>
            <Star size={13} /> Star
          </button>
          <button onClick={handleDeleteSelected}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "transparent", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", borderRadius: 999, fontSize: 13, cursor: "pointer" }}>
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sale modal */}
      {saleItem && (
        <SaleModal
          item={saleItem} walletId={walletId} listings={listings}
          onSave={handleListForSale} onRemove={handleRemoveListing}
          onClose={() => setSaleItem(null)}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>
    </div>
  );
}
