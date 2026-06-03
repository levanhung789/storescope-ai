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

  // ── ui-ux-pro-max §6: glassmorphism token — contrast ≥4.5:1 on bg image ──
  const card: React.CSSProperties = {
    background: "rgba(13,13,13,0.85)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
  };

  // ── Scan Trend — period tabs + hover tooltip ──────────────────────────────
  const [chartPeriod, setChartPeriod] = useState<"day"|"week"|"month">("month");
  const [hoveredPoint, setHoveredPoint] = useState<{ i: number; v: number; x: number; y: number; label: string } | null>(null);

  const CHART_PERIODS = {
    day: {
      label: "Ngày", subLabel: "7 ngày gần nhất",
      labels:   ["T2",  "T3",  "T4",  "T5",  "T6",  "T7",  "CN"],
      current:  [3,     7,     5,     12,    9,     4,     8],
      previous: [2,     5,     4,     8,     6,     3,     5],
    },
    week: {
      label: "Tuần", subLabel: "8 tuần gần nhất",
      labels:   ["T1","T2","T3","T4","T5","T6","T7","T8"],
      current:  [18,  25,  22,  35,  28,  42,  38,  45],
      previous: [12,  18,  16,  25,  20,  30,  27,  35],
    },
    month: {
      label: "Tháng", subLabel: "12 tháng gần nhất",
      labels:   ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      current:  [12,  18,  15,  25,  32,  28,  42,  38,  50,  46,  58,  65],
      previous: [8,   12,  10,  18,  22,  20,  30,  27,  35,  32,  40,  45],
    },
  };

  const displayName = anonUser?.displayName ?? "User";

  return (
    <div style={{ minHeight: "100vh", display: "flex", color: "#f0f0f0", fontFamily: "inherit", position: "relative" }}>

      {/* z:0 bg image */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "url(/dashboard-bg.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15, pointerEvents: "none" }} />
      {/* z:1 dark overlay — text contrast ≥4.5:1 (§6) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(6,4,12,0.93)", pointerEvents: "none" }} />

      {/* ── SIDEBAR — Paytop/Finance deep-blue style (z:2) ───────────────── */}
      <aside style={{
        width: 228, flexShrink: 0, zIndex: 2, position: "relative",
        background: "linear-gradient(160deg, #0d0221 0%, #1a0840 40%, #120630 70%, #0a0118 100%)",
        borderRight: "1px solid rgba(124,58,237,0.15)",
        display: "flex", flexDirection: "column",
      }}>

        {/* Logo */}
        <div style={{ padding: "22px 20px 20px" }}>
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>storescope<span style={{ color: "#a78bfa" }}>.ai</span></div>
              <div style={{ fontSize: 9, color: "rgba(167,139,250,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>Retail Intelligence</div>
            </div>
          </a>
        </div>

        {/* User info block — Finance sidebar style */}
        <div style={{ margin: "0 12px 16px", padding: "12px 14px", background: "rgba(124,58,237,0.12)", borderRadius: 12, border: "1px solid rgba(124,58,237,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {displayName[0]?.toUpperCase() ?? "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
              <div style={{ fontSize: 10, color: "#a78bfa" }}>Retail Analyst</div>
            </div>
          </div>
        </div>

        {/* Nav — white pill active (Paytop style, §9 nav-state-active) */}
        <div style={{ fontSize: 9, color: "rgba(167,139,250,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0 20px", marginBottom: 6 }}>OVERVIEW</div>
        <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          <LanguageSwitcher variant="sidebar" />
          {NAV.map(item => (
            <Link key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, textDecoration: "none",
              fontSize: 13, fontWeight: item.active ? 600 : 400,
              background: item.active ? "rgba(255,255,255,0.14)" : "transparent",
              color: item.active ? "#ffffff" : "rgba(167,139,250,0.55)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!item.active) e.currentTarget.style.color = "rgba(167,139,250,0.85)"; }}
            onMouseLeave={e => { if (!item.active) e.currentTarget.style.color = "rgba(167,139,250,0.55)"; }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              {item.label}
            </Link>
          ))}

          <div style={{ fontSize: 9, color: "rgba(167,139,250,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 14px 6px" }}>SECTORS</div>
          {sectors.map(s => (
            <button key={s.sectorKey} onClick={() => setSelectedSectorKey(s.sectorKey)}
              style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit", transition: "all 0.15s",
                background: selectedSectorKey === s.sectorKey ? "rgba(255,255,255,0.14)" : "transparent",
                color: selectedSectorKey === s.sectorKey ? "#ffffff" : "rgba(167,139,250,0.5)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: selectedSectorKey === s.sectorKey ? "#a78bfa" : "rgba(124,58,237,0.4)", flexShrink: 0 }} />
              {s.sectorLabel}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(124,58,237,0.1)" }}>
          <Link href="/dashboard/analysis" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, fontSize: 12, color: "#c4b5fd", textDecoration: "none", fontWeight: 600, marginBottom: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            New Analysis
          </Link>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", fontSize: 12, color: "rgba(167,139,250,0.4)", textDecoration: "none" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log out
          </Link>
        </div>
      </aside>

      {/* ── MAIN — z:2 ──────────────────────────────────────────────────── */}
      {/* main: no overflow so dropdowns aren't clipped */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 2 }}>

        {/* ── Header — sticky top, zIndex:50 so dropdown renders above content */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, background: "rgba(8,4,20,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 50 }}>
          {/* Search bar */}
          <div style={{ flex: 1, maxWidth: 400, position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, sellers, sectors..."
              style={{ width: "100%", padding: "9px 12px 9px 34px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f0f0f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Live badge (Paytop) */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>Live</span>
          </div>

          {/* Bell */}
          <button style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#888" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>

          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {displayName[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", lineHeight: 1.2 }}>{displayName}</div>
              <div style={{ fontSize: 10, color: "#555" }}>@{displayName.toLowerCase()}</div>
            </div>
          </div>
          {anonUser && <AnonBadge user={anonUser} onSignOut={() => setAnonUser(null)} />}
        </header>

        {/* Scrollable content wrapper */}
        <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── Greeting — Paytop "Hey [Name]!" ──────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", color: "#f0f0f0" }}>
                Hey {displayName}! 👋
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                {currentSector ? `Viewing: ${currentSector.sectorLabel}` : "What sector would you like to analyze today?"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/dashboard/analysis"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#7c3aed", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#6d28d9")}
                onMouseLeave={e => (e.currentTarget.style.background = "#7c3aed")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                AI Analysis
              </Link>
            </div>
          </div>

          {/* ── Stats row — Paytop/Finance styled cards ───────────────── */}
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "Sectors",   value: sectors.length,    color: "#a78bfa", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
                { label: "Companies", value: totalCompanies,    color: "#60a5fa", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
                { label: "Products",  value: totalProducts,     color: "#34d399", icon: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" },
                { label: "Images",    value: totalImages,       color: "#f59e0b", icon: "M23 7l-7 5 7 5V7z M1 5h9v14H1z" },
              ].map((s, i) => (
                <div key={s.label} style={{ ...card, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8"><path d={s.icon}/></svg>
                    </div>
                    <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600, background: "rgba(74,222,128,0.1)", padding: "2px 7px", borderRadius: 999 }}>+{(i+1)*3}%</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Scan Trend — period tabs + tooltip + summary stats ───── */}
          {(() => {
            const pd = CHART_PERIODS[chartPeriod];
            const n  = pd.current.length;
            const maxVal = Math.max(...pd.current, ...pd.previous);
            const total  = pd.current.reduce((a, b) => a + b, 0);
            const avg    = Math.round(total / n);
            const peak   = Math.max(...pd.current);
            const W = 560; const H = 150; const PL = 34; const PR = 12; const PB = 22; const PT = 12;
            const iW = W - PL - PR; const iH = H - PT - PB;
            const tx = (i: number) => PL + (i / (n - 1)) * iW;
            const ty = (v: number) => PT + iH - ((v / (maxVal * 1.15)) * iH);
            const linePath = (data: number[]) => data.map((v,i) => `${i===0?"M":"L"} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(" ");
            const areaPath = (data: number[]) => linePath(data) + ` L ${tx(n-1).toFixed(1)} ${H-PB} L ${PL} ${H-PB} Z`;
            const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ val: Math.round(maxVal * 1.15 * f), y: ty(maxVal * 1.15 * f) }));

            return (
              <div style={{ ...card, padding: "20px 22px 16px" }}>

                {/* Header: title + period tabs */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>Scan Trend</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{pd.subLabel} · số lượt phân tích hàng hóa</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["day","week","month"] as const).map(p => (
                      <button key={p} onClick={() => { setChartPeriod(p); setHoveredPoint(null); }}
                        style={{ padding: "5px 13px", borderRadius: 8, border: `1px solid ${chartPeriod===p ? "#7c3aed" : "rgba(255,255,255,0.08)"}`, background: chartPeriod===p ? "rgba(124,58,237,0.15)" : "transparent", color: chartPeriod===p ? "#a78bfa" : "#555", fontSize: 12, fontWeight: chartPeriod===p ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                        {CHART_PERIODS[p].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary stats row */}
                <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {[
                    { label: "Tổng", value: total, color: "#a78bfa" },
                    { label: "TB/" + pd.label.toLowerCase(), value: avg, color: "#60a5fa" },
                    { label: "Cao nhất", value: peak, color: "#4ade80" },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "#444", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    </div>
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <span style={{ width: 12, height: 2, background: "#7c3aed", display: "inline-block", borderRadius: 1 }} />
                      <span style={{ fontSize: 11, color: "#555" }}>Hiện tại</span>
                    </div>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <span style={{ width: 12, height: 2, background: "#3b82f6", display: "inline-block", borderRadius: 1, opacity: 0.55 }} />
                      <span style={{ fontSize: 11, color: "#555" }}>Kỳ trước</span>
                    </div>
                  </div>
                </div>

                {/* SVG Chart */}
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="tg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="tg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>

                  {/* Y-axis grid + labels */}
                  {yTicks.map(({ val, y }) => val > 0 && (
                    <g key={val}>
                      <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                      <text x={PL-5} y={y+3} textAnchor="end" fill="#333" fontSize="8.5" fontFamily="monospace">{val}</text>
                    </g>
                  ))}

                  {/* Areas */}
                  <path d={areaPath(pd.previous)} fill="url(#tg2)"/>
                  <path d={areaPath(pd.current)}  fill="url(#tg1)"/>

                  {/* Lines */}
                  <path d={linePath(pd.previous)} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.55" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3"/>
                  <path d={linePath(pd.current)}  fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>

                  {/* Hover vertical line */}
                  {hoveredPoint && (
                    <line x1={hoveredPoint.x} y1={PT} x2={hoveredPoint.x} y2={H-PB} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 2"/>
                  )}

                  {/* Data points — invisible large hit area + visible dot */}
                  {pd.current.map((v, i) => {
                    const cx = tx(i); const cy = ty(v);
                    const isHovered = hoveredPoint?.i === i;
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={10} fill="transparent" style={{ cursor: "crosshair" }}
                          onMouseEnter={() => setHoveredPoint({ i, v, x: cx, y: cy, label: pd.labels[i] })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <circle cx={cx} cy={cy} r={isHovered ? 5 : 3} fill={isHovered ? "#fff" : "#9060f0"} stroke="#7c3aed" strokeWidth="1.5" style={{ transition: "r 0.1s" }}/>
                      </g>
                    );
                  })}

                  {/* Tooltip box */}
                  {hoveredPoint && (() => {
                    const bx = Math.min(hoveredPoint.x - 30, W - PR - 68);
                    const by = Math.max(hoveredPoint.y - 44, PT);
                    const prev = pd.previous[hoveredPoint.i];
                    const diff = hoveredPoint.v - prev;
                    return (
                      <g>
                        <rect x={bx} y={by} width={68} height={36} rx="7" fill="rgba(12,4,28,0.96)" stroke="rgba(124,58,237,0.45)" strokeWidth="1"/>
                        <text x={bx+34} y={by+14} textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="600">{hoveredPoint.label}</text>
                        <text x={bx+34} y={by+27} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">{hoveredPoint.v} lượt</text>
                        {diff !== 0 && (
                          <text x={bx+34} y={by+27} textAnchor="middle" fill={diff > 0 ? "#4ade80" : "#f87171"} fontSize="8" dy="10">
                            {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}
                          </text>
                        )}
                      </g>
                    );
                  })()}

                  {/* X-axis labels */}
                  {pd.labels.map((l, i) => (
                    <text key={l} x={tx(i)} y={H-6} textAnchor="middle" fill={hoveredPoint?.i === i ? "#a78bfa" : "#333"} fontSize="9" fontWeight={hoveredPoint?.i === i ? "600" : "400"}>{l}</text>
                  ))}
                </svg>
              </div>
            );
          })()}

          {/* ── App launcher + 4 panels grid ─────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, alignItems: "start" }}>

            {/* App Launcher — compact icon grid */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Tools & Apps</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {APPS.map(app => (
                  <Link key={app.label} href={app.href}
                    style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, textDecoration: "none", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = app.color; e.currentTarget.style.background = `${app.color}14`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${app.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 16 }}>{app.icon}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#ccc", lineHeight: 1.2 }}>{app.label}</span>
                  </Link>
                ))}
              </div>
              {currentSector && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>{currentSector.sectorLabel}</div>
                  {[
                    { label: "Companies", val: currentSector.companies.length },
                    { label: "Products",  val: currentSector.companies.reduce((a,c) => a + c.products.length, 0) },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#555" }}>{r.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4 Panels grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              {/* Panel 1 — Search */}
              <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(96,165,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Search</span>
                </div>
                <div style={{ position: "relative" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}>
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
                    style={{ width: "100%", padding: "8px 10px 8px 28px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#f0f0f0", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
                  {(search ? searchResults : PROMO_PRODUCTS.slice(0, 3)).map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 7 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: "#444" }}>{p.seller}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>{fmtVND(p.salePrice)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2 — Promotions */}
              <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Promotions</span>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}>{currentSector?.sectorLabel ?? "All"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 210, overflowY: "auto" }}>
                  {promos.map(p => (
                    <div key={p.id} style={{ padding: "9px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `3px solid ${p.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.brand}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>{p.discount}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#ddd" }}>{p.title}</div>
                      <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{p.start} → {p.end}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 3 — Products */}
              <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Products</span>
                  </div>
                  <span style={{ fontSize: 10, color: "#444" }}>Newest ↓</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 210, overflowY: "auto" }}>
                  {promoProducts.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 7 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: "#444" }}>{p.seller} · {p.location}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{fmtVND(p.salePrice)}</div>
                        <div style={{ fontSize: 9, padding: "1px 5px", borderRadius: 999, background: "rgba(239,68,68,0.1)", color: "#f87171", display: "inline-block" }}>-{p.discount}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 4 — Marketplace */}
              <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Marketplace</span>
                  </div>
                  <Link href="/forum" style={{ fontSize: 11, color: "#7c3aed", textDecoration: "none" }}>See all →</Link>
                </div>
                {marketListings.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0", gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>No {currentSector?.sectorLabel} data listed yet</div>
                    <Link href="/dashboard/profile" style={{ fontSize: 11, padding: "5px 12px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 999, color: "#a78bfa", textDecoration: "none" }}>+ List your data</Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 210, overflowY: "auto" }}>
                    {marketListings.map(l => (
                      <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 7 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>
                          {l.itemType === "analysis" ? "📊" : l.itemType === "layout" ? "🏪" : "📝"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                          <div style={{ fontSize: 10, color: "#444" }}>{l.sellerEmail?.split("@")[0] ?? l.sellerWallet.slice(0,8) + "…"}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", flexShrink: 0 }}>${l.price}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
        </div>{/* end scrollable wrapper */}
      </main>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
