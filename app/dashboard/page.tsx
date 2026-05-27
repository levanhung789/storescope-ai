"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { loadAnonUser, type AnonUser } from "../_lib/anonymousAuth";
import LanguageSwitcher from "../_components/LanguageSwitcher";
import { useLang } from "../_lib/i18n";
import { loadListings, type ForumListing } from "../_lib/vault";

const AnonBadge = dynamic(() => import("../_components/AnonBadge"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product  { productName: string; productFolder: string; images: string[]; }
interface Company  { companyKey: string; companyName: string; companyFolder: string; products: Product[]; }
interface Sector   { sectorKey: string; sectorLabel: string; sectorFolder: string; companies: Company[]; }

// ── App launcher data ─────────────────────────────────────────────────────────

const APPS = [
  { icon: "📊", label: "AI Analysis",   desc: "Shelf & SKU detection",    href: "/dashboard/analysis",     color: "#7c3aed" },
  { icon: "👁️", label: "Vision Agent",  desc: "8-step FMCG pipeline",     href: "/dashboard/vision-agent", color: "#3b82f6" },
  { icon: "🤖", label: "AI Agent",      desc: "Autonomous analysis",       href: "/dashboard/agent",        color: "#10b981" },
  { icon: "📋", label: "My Reports",    desc: "Analysis history",          href: "/dashboard/reports",      color: "#f59e0b" },
  { icon: "👤", label: "My Profile",    desc: "Data vault & listings",     href: "/dashboard/profile",      color: "#ec4899" },
  { icon: "🏪", label: "Layout Editor", desc: "3D store planning",         href: "/layout-editor",          color: "#8b5cf6" },
  { icon: "💬", label: "Forum",         desc: "Community marketplace",     href: "/forum",                  color: "#06b6d4" },
  { icon: "🗂️", label: "Catalog",       desc: "FMCG product database",     href: "/dashboard",              color: "#a78bfa" },
];

// ── Mock Promotion data (by sector keyword) ───────────────────────────────────

interface PromoItem {
  id: string; brand: string; title: string;
  discount: string; desc: string;
  start: string; end: string; color: string;
}

const PROMO_MAP: { keywords: string[]; items: PromoItem[] }[] = [
  {
    keywords: ["beverage","drink","nước","pepsi","coca","sting","aquafina"],
    items: [
      { id:"b1", brand:"Pepsi",    title:"Summer Refresh",    discount:"25% OFF", desc:"Mua 2 tặng 1 — tất cả chai 500ml", start:"01/06/2026", end:"30/06/2026", color:"#3b82f6" },
      { id:"b2", brand:"Sting",    title:"Energy Weekend",    discount:"15% OFF", desc:"Khuyến mãi cuối tuần đồ uống năng lượng", start:"24/05/2026", end:"26/05/2026", color:"#ef4444" },
      { id:"b3", brand:"Aquafina", title:"Hydration Month",   discount:"10% OFF", desc:"Giảm giá nước suối toàn hệ thống", start:"01/06/2026", end:"30/06/2026", color:"#06b6d4" },
    ],
  },
  {
    keywords: ["snack","chip","lay","cheeto","bánh","cracker"],
    items: [
      { id:"s1", brand:"Lay's",   title:"Snack Festival",  discount:"20% OFF", desc:"Giảm 20% tất cả hương vị Lay's", start:"15/05/2026", end:"15/06/2026", color:"#f59e0b" },
      { id:"s2", brand:"Cheetos", title:"Fiesta Sale",     discount:"18% OFF", desc:"Combo pack tiết kiệm cho gia đình", start:"20/05/2026", end:"10/06/2026", color:"#f97316" },
      { id:"s3", brand:"Oreo",    title:"Cookie Month",    discount:"12% OFF", desc:"Mua 3 hộp tặng 1 hộp Oreo", start:"01/06/2026", end:"30/06/2026", color:"#a78bfa" },
    ],
  },
  {
    keywords: ["dairy","milk","sữa","vinamilk","th true","yogurt"],
    items: [
      { id:"d1", brand:"Vinamilk",    title:"Milk Month",       discount:"12% OFF", desc:"Ưu đãi sữa tươi toàn quốc tháng 6", start:"01/06/2026", end:"30/06/2026", color:"#10b981" },
      { id:"d2", brand:"TH True Milk",title:"Fresh Farm Deal",  discount:"8% OFF",  desc:"Sữa hữu cơ giảm giá đặc biệt", start:"10/06/2026", end:"20/06/2026", color:"#34d399" },
    ],
  },
  {
    keywords: ["instant","mì","noodle","maggi","hảo hảo"],
    items: [
      { id:"i1", brand:"Hảo Hảo", title:"Bữa Ngon Tiết Kiệm", discount:"22% OFF", desc:"Thùng 30 gói giảm giá đặc biệt", start:"01/06/2026", end:"30/06/2026", color:"#ef4444" },
      { id:"i2", brand:"Maggi",   title:"Spice Season",        discount:"16% OFF", desc:"Combo gia vị nấu ăn cho bếp gia đình", start:"20/05/2026", end:"20/06/2026", color:"#f59e0b" },
    ],
  },
];

const DEFAULT_PROMOS: PromoItem[] = [
  { id:"x1", brand:"StoreScope", title:"Platform Launch",  discount:"30% OFF", desc:"Giảm phí phân tích dữ liệu tháng đầu", start:"01/06/2026", end:"30/06/2026", color:"#7c3aed" },
  { id:"x2", brand:"All Brands", title:"Summer Mega Sale", discount:"UP TO 50%", desc:"Đại tiệc khuyến mãi hè toàn bộ ngành hàng", start:"01/06/2026", end:"31/07/2026", color:"#a78bfa" },
];

function getPromos(sectorLabel: string): PromoItem[] {
  const kw = sectorLabel.toLowerCase();
  const match = PROMO_MAP.find(g => g.keywords.some(k => kw.includes(k)));
  return match ? match.items : DEFAULT_PROMOS;
}

// ── Mock Promo Products ───────────────────────────────────────────────────────

interface PromoProduct {
  id: string; name: string; origPrice: number; salePrice: number;
  discount: number; seller: string; location: string;
  sector: string; start: string; end: string; createdAt: number;
}

const PROMO_PRODUCTS: PromoProduct[] = [
  { id:"pp1", name:"Pepsi Original 1.5L",      origPrice:25000, salePrice:18000, discount:28, seller:"BigC",       location:"Hà Nội",         sector:"beverage", start:"20/05", end:"05/06", createdAt:Date.now()-1800000 },
  { id:"pp2", name:"Lay's Classic 120g",        origPrice:18000, salePrice:14000, discount:22, seller:"Winmart",    location:"TP. Hồ Chí Minh",sector:"snack",    start:"22/05", end:"10/06", createdAt:Date.now()-3600000 },
  { id:"pp3", name:"Sting Dâu 330ml × 6",      origPrice:72000, salePrice:55000, discount:24, seller:"Co.opmart",  location:"Đà Nẵng",        sector:"beverage", start:"25/05", end:"15/06", createdAt:Date.now()-7200000 },
  { id:"pp4", name:"Vinamilk Sữa Tươi 1L",     origPrice:32000, salePrice:27000, discount:16, seller:"Lotte Mart", location:"Hà Nội",         sector:"dairy",    start:"01/06", end:"30/06", createdAt:Date.now()-14400000 },
  { id:"pp5", name:"Cheetos Flamin Hot 85g",   origPrice:22000, salePrice:16000, discount:27, seller:"Circle K",   location:"TP. Hồ Chí Minh",sector:"snack",    start:"18/05", end:"01/06", createdAt:Date.now()-28800000 },
  { id:"pp6", name:"Aquafina 500ml × 24",      origPrice:168000,salePrice:138000,discount:18, seller:"MM Mega",    location:"Hải Phòng",      sector:"beverage", start:"27/05", end:"10/06", createdAt:Date.now()-43200000 },
  { id:"pp7", name:"Oreo Sandwich 432g",        origPrice:45000, salePrice:36000, discount:20, seller:"GS25",       location:"TP. Hồ Chí Minh",sector:"snack",    start:"01/06", end:"15/06", createdAt:Date.now()-86400000 },
  { id:"pp8", name:"Hảo Hảo Tôm Chua Cay ×30", origPrice:95000, salePrice:74000, discount:22, seller:"Aeon",       location:"Hà Nội",         sector:"instant",  start:"01/06", end:"30/06", createdAt:Date.now()-172800000 },
];

function timeAgo(ms: number) {
  const d = Date.now() - ms;
  if (d < 3_600_000) return `${Math.floor(d/60000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d/3_600_000)}h ago`;
  return `${Math.floor(d/86_400_000)}d ago`;
}

function fmtVND(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: "nav.dashboard",  href: "/dashboard",              active: true  },
  { key: "nav.analysis",   href: "/dashboard/analysis",     active: false },
  { key: "nav.visionAgent",href: "/dashboard/vision-agent", active: false },
  { key: "nav.agent",      href: "/dashboard/agent",        active: false },
  { key: "nav.reports",    href: "/dashboard/reports",      active: false },
  { key: "nav.vault",      href: "/dashboard/profile",      active: false },
  { key: "nav.layout",     href: "/layout-editor",          active: false },
  { key: "nav.forum",      href: "/forum",                  active: false },
];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useLang();
  const NAV = NAV_ITEMS.map(n => ({ ...n, label: t(n.key) }));

  const [sectors,  setSectors]  = useState<Sector[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [anonUser, setAnonUser] = useState<AnonUser | null>(null);
  const [selectedSectorKey, setSelectedSectorKey] = useState("");
  const [search,   setSearch]   = useState("");
  const [searchResults, setSearchResults] = useState<PromoProduct[]>([]);
  const [vaultListings, setVaultListings]  = useState<ForumListing[]>([]);

  useEffect(() => { setAnonUser(loadAnonUser()); }, []);
  useEffect(() => { setVaultListings(loadListings()); }, []);

  useEffect(() => {
    fetch("/api/companies")
      .then(r => r.json())
      .then((data: Sector[]) => {
        setSectors(data);
        if (data.length > 0) setSelectedSectorKey(data[0].sectorKey);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentSector = useMemo(
    () => sectors.find(s => s.sectorKey === selectedSectorKey) ?? sectors[0],
    [sectors, selectedSectorKey]
  );

  // Stats
  const totalProducts  = useMemo(() => sectors.reduce((a, s) => a + s.companies.reduce((b, c) => b + c.products.length, 0), 0), [sectors]);
  const totalCompanies = useMemo(() => sectors.reduce((a, s) => a + s.companies.length, 0), [sectors]);
  const totalImages    = useMemo(() => sectors.reduce((a, s) => a + s.companies.reduce((b, c) => b + c.products.reduce((d, p) => d + p.images.length, 0), 0), 0), [sectors]);

  // Panel data derived from sector
  const promos         = useMemo(() => getPromos(currentSector?.sectorLabel ?? ""), [currentSector]);
  const promoProducts  = useMemo(() => {
    const kw = (currentSector?.sectorLabel ?? "").toLowerCase();
    const match = PROMO_PRODUCTS.filter(p =>
      kw.includes(p.sector) || p.sector.includes(kw.split(" ")[0] ?? "")
    );
    return (match.length ? match : PROMO_PRODUCTS).sort((a, b) => b.createdAt - a.createdAt);
  }, [currentSector]);

  const marketListings = useMemo(() => {
    const kw = (currentSector?.sectorLabel ?? "").toLowerCase();
    return vaultListings.filter(l => !l.sold && (
      !kw || (l.title+l.description).toLowerCase().includes(kw.split(" ")[0] ?? "")
    )).slice(0, 6);
  }, [vaultListings, currentSector]);

  // Search handler
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    setSearchResults(PROMO_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.seller.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    ));
  }, [search]);

  const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 16 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#080808", color: "#f0f0f0", fontFamily: "inherit" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{ width: 220, flexShrink: 0, background: "#0a0a0a", borderRight: "1px solid #1f1f1f", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid #1f1f1f" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.04em" }}>storescope</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", letterSpacing: "-0.04em" }}>.ai</span>
          </a>
          <div style={{ fontSize: 10, color: "#444", marginTop: 3, letterSpacing: "0.08em" }}>Retail Intelligence</div>
        </div>

        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          <LanguageSwitcher variant="sidebar" />
          {NAV.map(item => (
            <Link key={item.label} href={item.href} style={{
              display: "block", padding: "9px 12px", borderRadius: 10, textDecoration: "none",
              fontSize: 13, fontWeight: item.active ? 600 : 400,
              background: item.active ? "rgba(124,58,237,0.12)" : "transparent",
              color: item.active ? "#a78bfa" : "#666",
              border: item.active ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent",
            }}>{item.label}</Link>
          ))}
        </nav>

        {/* Sector selector */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid #1f1f1f" }}>
          <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, padding: "0 4px" }}>Sectors</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {sectors.map(s => (
              <button key={s.sectorKey} onClick={() => setSelectedSectorKey(s.sectorKey)}
                style={{ textAlign: "left", padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, background: selectedSectorKey === s.sectorKey ? "rgba(124,58,237,0.1)" : "transparent", color: selectedSectorKey === s.sectorKey ? "#a78bfa" : "#555", transition: "all 0.15s" }}>
                {s.sectorLabel}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 10px", borderTop: "1px solid #1f1f1f" }}>
          <Link href="/" style={{ display: "block", padding: "8px 12px", fontSize: 12, color: "#555", textDecoration: "none" }}>Log out</Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid #1f1f1f", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3 }}>Admin Dashboard</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {currentSector?.sectorLabel ?? "Overview"}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/dashboard/analysis" style={{ background: "#7c3aed", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
              AI Analysis
            </Link>
            {anonUser && <AnonBadge user={anonUser} onSignOut={() => setAnonUser(null)} />}
          </div>
        </header>

        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Stats row */}
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "Sectors",   value: sectors.length },
                { label: "Companies", value: totalCompanies },
                { label: "Products",  value: totalProducts },
                { label: "Images",    value: totalImages },
              ].map(s => (
                <div key={s.label} style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── 2-column: App Launcher | 4 Panels ─────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>

            {/* ── Left: App Launcher ──────────────────────────────────── */}
            <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", letterSpacing: "-0.01em" }}>Tools & Apps</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {APPS.map(app => (
                  <Link key={app.label} href={app.href}
                    style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 12px", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 12, textDecoration: "none", transition: "all 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = app.color; e.currentTarget.style.background = `${app.color}12`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.background = "#0a0a0a"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <span style={{ fontSize: 22 }}>{app.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0" }}>{app.label}</span>
                    <span style={{ fontSize: 10, color: "#555", lineHeight: 1.4 }}>{app.desc}</span>
                  </Link>
                ))}
              </div>

              {/* Quick sector stats */}
              {currentSector && (
                <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 8 }}>{currentSector.sectorLabel}</div>
                  {[
                    { label: "Companies", val: currentSector.companies.length },
                    { label: "Products",  val: currentSector.companies.reduce((a, c) => a + c.products.length, 0) },
                    { label: "Images",    val: currentSector.companies.reduce((a, c) => a + c.products.reduce((d, p) => d + p.images.length, 0), 0) },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: "#555" }}>{r.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa" }}>{r.val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: 4 Panels ─────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              {/* Panel 1 — Search ────────────────────────────────────── */}
              <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>🔍 Tìm kiếm</div>
                <div style={{ position: "relative" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm sản phẩm, nhà bán, địa điểm..."
                    style={{ width: "100%", padding: "9px 12px 9px 30px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
                  />
                  {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, fontSize: 16 }}>×</button>}
                </div>

                {/* Results */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                  {search && searchResults.length === 0 && (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "#444", fontSize: 12 }}>Không tìm thấy kết quả</div>
                  )}
                  {(search ? searchResults : PROMO_PRODUCTS.slice(0, 4)).map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#0a0a0a", borderRadius: 8, border: "1px solid #1a1a1a" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{p.seller} · {p.location}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{fmtVND(p.salePrice)}</div>
                        <div style={{ fontSize: 10, color: "#555", textDecoration: "line-through" }}>{fmtVND(p.origPrice)}</div>
                      </div>
                    </div>
                  ))}
                  {!search && (
                    <div style={{ fontSize: 10, color: "#444", textAlign: "center", paddingTop: 4 }}>Đang hiển thị sản phẩm khuyến mãi mới nhất</div>
                  )}
                </div>
              </div>

              {/* Panel 2 — Promotions by Sector ─────────────────────── */}
              <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>🎁 Chương trình KM</div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>
                    {currentSector?.sectorLabel ?? "All"}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                  {promos.map(p => (
                    <div key={p.id} style={{ padding: "10px 12px", background: "#0a0a0a", borderRadius: 10, border: `1px solid ${p.color}22` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.brand}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#4ade80" }}>{p.discount}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0", marginBottom: 3 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>{p.desc}</div>
                      <div style={{ fontSize: 10, color: "#444" }}>📅 {p.start} → {p.end}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 3 — Promo Products ────────────────────────────── */}
              <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>🏷️ Sản phẩm khuyến mãi</div>
                  <span style={{ fontSize: 10, color: "#555" }}>Mới nhất ↓</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 300, overflowY: "auto" }}>
                  {promoProducts.map(p => (
                    <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "9px 10px", background: "#0a0a0a", borderRadius: 9, border: "1px solid #1a1a1a" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{p.name}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, color: "#555" }}>🏪 {p.seller}</span>
                          <span style={{ fontSize: 10, color: "#555" }}>📍 {p.location}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>📅 {p.start} → {p.end} · {timeAgo(p.createdAt)}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{fmtVND(p.salePrice)}</div>
                        <div style={{ fontSize: 10, color: "#555", textDecoration: "line-through" }}>{fmtVND(p.origPrice)}</div>
                        <div style={{ marginTop: 3, fontSize: 10, padding: "1px 5px", borderRadius: 999, background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", display: "inline-block" }}>-{p.discount}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 4 — Data Marketplace ──────────────────────────── */}
              <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>📊 Chợ dữ liệu</div>
                  <Link href="/forum" style={{ fontSize: 11, color: "#7c3aed", textDecoration: "none" }}>Xem tất cả →</Link>
                </div>

                {marketListings.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 0", gap: 10 }}>
                    <div style={{ fontSize: 36, opacity: 0.3 }}>📊</div>
                    <div style={{ fontSize: 12, color: "#444", textAlign: "center" }}>
                      Chưa có dữ liệu <strong style={{ color: "#666" }}>{currentSector?.sectorLabel}</strong> nào được đăng bán
                    </div>
                    <Link href="/dashboard/profile"
                      style={{ fontSize: 11, padding: "6px 14px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 999, color: "#a78bfa", textDecoration: "none" }}>
                      + Đăng bán data của bạn
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 300, overflowY: "auto" }}>
                    {marketListings.map(l => (
                      <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "#0a0a0a", borderRadius: 9, border: "1px solid #1a1a1a" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                          {l.itemType === "analysis" ? "📊" : l.itemType === "layout" ? "🏪" : "📝"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{l.sellerEmail?.split("@")[0] ?? l.sellerWallet.slice(0, 8) + "…"}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>${l.price}</div>
                          <div style={{ fontSize: 10, color: "#555" }}>USDC</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>{/* end 4-panel grid */}
          </div>{/* end 2-column */}
        </div>
      </main>
    </div>
  );
}
