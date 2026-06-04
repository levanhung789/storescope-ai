"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
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
  { img: "/apps/ai-analysis.png",   label: "AI Analysis",   href: "/dashboard/analysis",     color: "#7c3aed" },
  { img: "/apps/vision-agent.png",  label: "Vision Agent",  href: "/dashboard/vision-agent", color: "#3b82f6" },
  { img: "/apps/ai-agent.png",      label: "AI Agent",      href: "/dashboard/agent",        color: "#10b981" },
  { img: "/apps/my-reports.png",    label: "My Reports",    href: "/dashboard/reports",      color: "#f59e0b" },
  { img: "/apps/my-profile.png",    label: "My Profile",    href: "/dashboard/profile",      color: "#ec4899" },
  { img: "/apps/layout-editor.png", label: "Layout Editor", href: "/layout-editor",          color: "#8b5cf6" },
  { img: "/apps/forum.png",         label: "Forum",         href: "/forum",                  color: "#06b6d4" },
  { img: "/apps/catalog.png",       label: "Catalog",       href: "/dashboard",              color: "#a78bfa" },
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

// ── Product image mapping ─────────────────────────────────────────────────────
const PRODUCT_IMG: Record<string, string> = {
  "pp1": "/products/PEPsi 1.5L.png",
  "pp2": "/products/Lay's Classic 120g.png",
  "pp3": "/products/Sting Dâu 330ml × 6.png",
  "pp4": "/products/Vinamilk Sữa Tươi 1L.png",
  "pp5": "/products/Cheetos Flamin Hot 85g.png",
  "pp6": "/products/Aquafina 500ml × 24.png",
  "pp7": "/products/Oreo Sandwich 432g.png",
  "pp8": "/products/Hảo Hảo Tôm Chua Cay ×30.png",
};

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

// ── PremiumAppCard — §7: transform/opacity only, spring-physics, stagger ─────
type AppItem = { img: string; label: string; href: string; color: string };

function PremiumAppCard({ app, index }: { app: AppItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [tilt, setTilt]   = useState({ x: 0, y: 0 });
  const [shimmer, setShimmer] = useState(false);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 16;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const onEnter = () => { setHovered(true); setShimmer(false); setTimeout(() => setShimmer(true), 10); };
  const onLeave = () => { setHovered(false); setTilt({ x: 0, y: 0 }); setShimmer(false); };

  // §7 spring-physics: cubic-bezier mimics spring overshoot
  const springIn  = "transform 200ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 200ms ease-out, border-color 200ms ease-out";
  const springOut = "transform 280ms cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 280ms ease-out, border-color 280ms ease-out";

  const scale   = pressed ? 0.95 : hovered ? 1.05 : 1;
  const tiltStr = hovered ? `perspective(520px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` : "perspective(520px) rotateX(0) rotateY(0)";

  return (
    <Link href={app.href} style={{ textDecoration: "none", display: "block",
      animation: `cardEntrance 420ms cubic-bezier(0.34,1.56,0.64,1) ${index * 55}ms both`,
    }}>
      <div ref={ref}
        onMouseEnter={onEnter} onMouseLeave={onLeave} onMouseMove={onMouseMove}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
        style={{
          position: "relative", borderRadius: 14, overflow: "hidden",
          background: "#06030f",
          aspectRatio: "1/1", cursor: "pointer",
          transform: `${tiltStr} scale(${scale})`,
          transition: hovered ? springIn : springOut,
          border: `1px solid ${hovered ? app.color + "70" : "rgba(255,255,255,0.07)"}`,
          boxShadow: hovered
            ? `0 0 0 1px ${app.color}30, 0 12px 40px ${app.color}35, 0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`
            : "0 2px 10px rgba(0,0,0,0.35)",
        }}>

        {/* 3D image — zooms subtly on hover (§7 transform-performance) */}
        <img src={app.img} alt={app.label} style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 350ms cubic-bezier(0.25,0.46,0.45,0.94)",
        }} />

        {/* Shimmer sweep — translateX only (§7 transform-performance) */}
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
          borderRadius: 14,
        }}>
          <div style={{
            position: "absolute", top: "-50%", width: "55%", height: "200%",
            background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.1) 50%, transparent)",
            transform: "skewX(-18deg)",
            animation: shimmer ? "shimmerSlide 550ms ease-out forwards" : "none",
          }} />
        </div>

        {/* Bottom glow orb matching card color */}
        <div style={{
          position: "absolute", bottom: -16, left: "50%",
          transform: "translateX(-50%)",
          width: "85%", height: 36,
          background: `radial-gradient(ellipse, ${app.color}45 0%, transparent 70%)`,
          filter: "blur(10px)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 250ms ease-out",
          pointerEvents: "none",
        }} />

        {/* Top corner sparkle dot */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 5, height: 5, borderRadius: "50%",
          background: app.color,
          boxShadow: `0 0 6px ${app.color}`,
          opacity: hovered ? 1 : 0.3,
          transform: hovered ? "scale(1.4)" : "scale(1)",
          transition: "opacity 200ms, transform 200ms",
        }} />

        {/* Label overlay — slides up on hover */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "22px 10px 8px",
          background: "linear-gradient(0deg, rgba(3,1,14,0.96) 0%, transparent 100%)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transform: hovered ? "translateY(0)" : "translateY(3px)",
          transition: "transform 200ms ease-out",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{app.label}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5"
            style={{ transform: hovered ? "translateX(2px)" : "translateX(0)", transition: "transform 200ms ease-out" }}>
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

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

  // ── Mini sparkline for stats cards ────────────────────────────────────────
  const Sparkline = ({ pts, color }: { pts: string; color: string }) => (
    <svg width="80" height="20" viewBox="0 0 80 20" style={{ display:"block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
    </svg>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", color: "#f0f0f0", fontFamily: "inherit", position: "relative" }}>

      {/* z:0 bg image */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "url(/dashboard-bg.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15, pointerEvents: "none" }} />
      {/* z:1 dark overlay — text contrast ≥4.5:1 (§6) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(6,4,12,0.93)", pointerEvents: "none" }} />

      {/* ── SIDEBAR — reference design ───────────────────────────────────── */}
      <aside style={{
        width: 242, flexShrink: 0, zIndex: 2, position: "relative",
        background: "linear-gradient(175deg, #0d0221 0%, #130535 35%, #0c0228 65%, #080118 100%)",
        borderRight: "1px solid rgba(124,58,237,0.12)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }}>

        {/* ── Logo — icon square + text ───────────────────────────────── */}
        <div style={{ padding: "20px 18px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#5b21b6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.15)", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <div>
            <a href="/" style={{ textDecoration: "none" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>storescope<span style={{ color: "#a78bfa" }}>.ai</span></div>
            </a>
            <div style={{ fontSize: 8, color: "rgba(167,139,250,0.45)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 2 }}>Retail Intelligence</div>
          </div>
        </div>

        {/* ── User card — glassmorphism + glow ring avatar ────────────── */}
        <div style={{ margin: "0 12px 14px", padding: "14px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", borderRadius: 14, border: "1px solid rgba(124,58,237,0.22)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar with glow ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", boxShadow: "0 0 0 2px rgba(124,58,237,0.4), 0 0 20px rgba(124,58,237,0.5)" }}>
                {displayName[0]?.toUpperCase() ?? "U"}
              </div>
              {/* Online dot */}
              <div style={{ position: "absolute", bottom: 2, right: 2, width: 9, height: 9, borderRadius: "50%", background: "#a855f7", border: "2px solid #130535", boxShadow: "0 0 6px #a855f7" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
              <div style={{ fontSize: 10, color: "rgba(167,139,250,0.6)", marginTop: 1 }}>Retail Analyst</div>
            </div>
          </div>
        </div>

        {/* ── OVERVIEW nav ────────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column" }}>

          {/* Language switcher */}
          <div style={{ marginBottom: 8 }}>
            <LanguageSwitcher variant="sidebar" />
          </div>

          {/* Section label */}
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(167,139,250,0.4)", letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px 8px" }}>OVERVIEW</div>

          {/* Nav items — reference style */}
          {NAV.map((item, i) => {
            // Icon paths per nav item
            const ICONS: Record<string, React.ReactNode> = {
              "nav.dashboard":   <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
              "nav.analysis":    <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
              "nav.visionAgent": <><path d="M1 12s4-8 11-8 11 8-11 8-11-8"/><circle cx="12" cy="12" r="3"/></>,
              "nav.agent":       <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h4"/><circle cx="9" cy="9" r="0.5" fill="currentColor"/></>,
              "nav.reports":     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></>,
              "nav.vault":       <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
              "nav.layout":      <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
              "nav.forum":       <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
            };
            const icon = ICONS[item.key] ?? <circle cx="12" cy="12" r="4"/>;

            return (
              <Link key={item.key} href={item.href} style={{ textDecoration: "none", display: "block", marginBottom: 4 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: item.active ? "11px 12px" : "9px 10px",
                  borderRadius: 12,
                  background: item.active
                    ? "linear-gradient(135deg, rgba(100,40,200,0.85) 0%, rgba(140,60,230,0.7) 50%, rgba(80,20,160,0.85) 100%)"
                    : "transparent",
                  border: item.active ? "1px solid rgba(167,139,250,0.3)" : "1px solid transparent",
                  boxShadow: item.active ? "0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(124,58,237,0.1)"; e.currentTarget.style.border = "1px solid rgba(124,58,237,0.2)"; }}}
                onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.border = "1px solid transparent"; }}}>

                  {/* Icon container */}
                  {item.active ? (
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                    </div>
                  ) : (
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                    </div>
                  )}

                  {/* Label */}
                  <span style={{ flex: 1, fontSize: 13, fontWeight: item.active ? 700 : 400, color: item.active ? "#fff" : "rgba(167,139,250,0.6)", letterSpacing: item.active ? "-0.01em" : "0" }}>
                    {item.label}
                  </span>

                  {/* Chevron */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={item.active ? "rgba(255,255,255,0.7)" : "rgba(124,58,237,0.35)"} strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            );
          })}

          {/* ── SECTORS ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 10px 8px" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(167,139,250,0.4)", letterSpacing: "0.18em", textTransform: "uppercase" }}>SECTORS</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(124,58,237,0.3) 0%, transparent 100%)" }} />
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 6px #7c3aed", display: "inline-block" }} />
          </div>

          {sectors.map(s => {
            const isActive = selectedSectorKey === s.sectorKey;
            return (
              <button key={s.sectorKey} onClick={() => setSelectedSectorKey(s.sectorKey)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 12, border: isActive ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent", cursor: "pointer", fontFamily: "inherit", marginBottom: 4, transition: "all 0.2s",
                  background: isActive ? "linear-gradient(135deg, rgba(80,20,160,0.7) 0%, rgba(100,40,180,0.5) 100%)" : "transparent",
                  boxShadow: isActive ? "0 4px 16px rgba(124,58,237,0.25)" : "none",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#a78bfa" : "rgba(124,58,237,0.35)", boxShadow: isActive ? "0 0 6px #a78bfa" : "none", flexShrink: 0, transition: "all 0.2s" }} />
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                </div>
                <span style={{ flex: 1, fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? "#fff" : "rgba(167,139,250,0.55)", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sectorLabel}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isActive ? "rgba(255,255,255,0.6)" : "rgba(124,58,237,0.3)"} strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            );
          })}
        </nav>

        {/* ── Bottom actions ─────────────────────────────────────────── */}
        <div style={{ padding: "12px 10px 16px", borderTop: "1px solid rgba(124,58,237,0.1)" }}>
          <Link href="/dashboard/analysis" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "linear-gradient(135deg,rgba(100,30,200,0.4),rgba(140,60,230,0.3))", border: "1px solid rgba(124,58,237,0.35)", borderRadius: 10, fontSize: 12, color: "#c4b5fd", textDecoration: "none", fontWeight: 600, marginBottom: 4, boxShadow: "0 0 12px rgba(124,58,237,0.15)" }}>
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

        {/* ── Header — reference: ⌘K search + bell + bookmark + global ── */}
        <header style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"10px 20px", display:"flex", alignItems:"center", gap:12, flexShrink:0, background:"rgba(6,8,15,0.97)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", position:"sticky", top:0, zIndex:50 }}>
          <div style={{ flex:1, maxWidth:520, position:"relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search anything... (e.g., company, product, barcode, location)"
              style={{ width:"100%", padding:"8px 52px 8px 32px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:9, color:"#f0f0f0", fontSize:12, outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            />
            <span style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:4, padding:"1px 6px", fontSize:10, color:"#555", fontFamily:"monospace", pointerEvents:"none" }}>⌘ K</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ position:"relative" }}>
              <button style={{ width:32, height:32, borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#888" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
              <span style={{ position:"absolute", top:-3, right:-3, width:15, height:15, borderRadius:"50%", background:"#7c3aed", fontSize:8, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>3</span>
            </div>
            <button style={{ width:32, height:32, borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#888" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:7, color:"#888", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/></svg>
              Global
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>{displayName[0]?.toUpperCase() ?? "U"}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#f0f0f0", lineHeight:1.2 }}>{displayName}</div>
                <div style={{ fontSize:9, color:"#444" }}>Enterprise Admin</div>
              </div>
            </div>
            {anonUser && <AnonBadge user={anonUser} onSignOut={() => setAnonUser(null)} />}
          </div>
        </header>

        {/* Scrollable content wrapper */}
        <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── Greeting + AI Insight ─────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 270px", gap:14, alignItems:"start" }}>
            <div>
              <h1 style={{ fontSize:20, fontWeight:800, color:"#fff", margin:"0 0 3px", letterSpacing:"-0.02em" }}>Good morning, {displayName} 👋</h1>
              <p style={{ fontSize:12, color:"#555", margin:"0 0 0" }}>Your AI co-pilot for retail intelligence is ready.</p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"11px 14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#f0f0f0" }}>AI Insight</span>
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:999, background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.25)", color:"#10b981", fontWeight:700 }}>New</span>
              </div>
              <p style={{ fontSize:11, color:"#555", lineHeight:1.5, margin:"0 0 8px" }}>
                <strong style={{ color:"#a78bfa" }}>{currentSector?.sectorLabel ?? "FMCG"}</strong> sales increased this week across 24 key markets.
              </p>
              <Link href="/dashboard/analysis" style={{ fontSize:10, fontWeight:600, color:"#a78bfa", background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:7, padding:"4px 10px", textDecoration:"none" }}>View Full Insight →</Link>
            </div>
          </div>

          {/* ── 5 Stats cards with sparklines (reference style) ───────── */}
          {!loading && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
              {[
                { label:"Scans",     value:78642+sectors.length*100, change:"+16.3%", color:"#7c3aed", pts:"0,18 13,14 26,16 39,9 52,12 65,5 80,7" },
                { label:"Companies", value:totalCompanies,            change:"+8.3%",  color:"#10b981", pts:"0,17 13,13 26,15 39,9 52,12 65,6 80,8" },
                { label:"Products",  value:totalProducts,             change:"+14.7%", color:"#3b82f6", pts:"0,18 13,14 26,16 39,8 52,11 65,4 80,6" },
                { label:"Images",    value:totalImages,               change:"+19.6%", color:"#f59e0b", pts:"0,19 13,15 26,13 39,7 52,10 65,3 80,5" },
                { label:"Markets",   value:sectors.length,            change:"+5 new", color:"#ec4899", pts:"0,18 13,13 26,15 39,10 52,12 65,7 80,9" },
              ].map((s,i) => (
                <div key={i} style={{ ...card, padding:"12px 14px", cursor:"pointer", transition:"border-color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${s.color}40`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:9, color:"#555", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>{s.label}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:4 }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize:9, color:"#10b981", fontWeight:600, marginBottom:6 }}>{s.change} <span style={{ color:"#444" }}>vs 7d</span></div>
                  <Sparkline pts={s.pts} color={s.color} />
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

            {/* ── App Launcher — reference card style ─────────────────── */}
            <div style={{ background: "rgba(8,4,22,0.7)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 20, padding: "18px 16px 14px" }}>

              {/* Section title like reference */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#f0f0f0", letterSpacing: "0.18em", textTransform: "uppercase" }}>TOOLS &amp; APPS</span>
                <span style={{ color: "#a78bfa", fontSize: 12 }}>✦</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(124,58,237,0.4) 0%, transparent 100%)" }} />
              </div>

              {/* 2-col grid — PremiumAppCard with 3D tilt + shimmer + glow */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {APPS.map((app, i) => (
                  <PremiumAppCard key={app.label} app={app} index={i} />
                ))}
              </div>

              {/* Sector stats card */}
              {currentSector && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{currentSector.sectorLabel}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
                  </div>
                  {[
                    { icon: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0H5m14 0h2m-16 0H3", label: "Companies", val: currentSector.companies.length },
                    { icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", label: "Products", val: currentSector.companies.reduce((a,c) => a + c.products.length, 0) },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d={r.icon}/></svg>
                        <span style={{ fontSize: 11, color: "#555" }}>{r.label}</span>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.02em" }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 4 Panels — reference design ──────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              {/* ── Panel 1: Search ───────────────────────────────────── */}
              <div style={{ ...card, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#1e40af,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(59,130,246,0.45)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Search</span>
                  <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 6px #3b82f6" }} />
                </div>
                {/* Search input with glow */}
                <div style={{ position: "relative" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
                    style={{ width: "100%", padding: "10px 36px 10px 36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, color: "#f0f0f0", fontSize: 13, outline: "none", boxSizing: "border-box", boxShadow: "0 0 0 2px rgba(124,58,237,0.08)", transition: "border-color 0.2s, box-shadow 0.2s" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(124,58,237,0.08)"; }}
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.4)" strokeWidth="2" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                {/* Product rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                  {(search ? searchResults : PROMO_PRODUCTS.slice(0, 4)).map(p => {
                    const thumbColors: Record<string,string> = { beverage:"linear-gradient(135deg,#1e3a8a,#3b82f6)", snack:"linear-gradient(135deg,#78350f,#f59e0b)", dairy:"linear-gradient(135deg,#065f46,#10b981)", instant:"linear-gradient(135deg,#7c2d12,#ef4444)" };
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: thumbColors[p.sector] ?? "#111", flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                          {PRODUCT_IMG[p.id] ? <img src={PRODUCT_IMG[p.id]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: 16 }}>{p.sector === "beverage" ? "🥤" : p.sector === "snack" ? "🍟" : p.sector === "dairy" ? "🥛" : "🍜"}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "#555" }}>{p.seller}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#00e676", flexShrink: 0, letterSpacing: "-0.01em" }}>{fmtVND(p.salePrice)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Panel 2: Promotions ───────────────────────────────── */}
              <div style={{ ...card, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#5b21b6,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(168,85,247,0.45)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Promotions</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, padding: "3px 10px", borderRadius: 999, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)", color: "#c4b5fd", fontWeight: 600 }}>{currentSector?.sectorLabel ?? "All"}</span>
                </div>
                {/* Promo cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
                  {promos.map(p => (
                    <div key={p.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", padding: "14px 14px", background: `linear-gradient(135deg, rgba(14,6,40,0.95), rgba(30,10,80,0.85))`, border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      {/* Left accent */}
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: p.color }} />
                      <div style={{ minWidth: 0, paddingLeft: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 3 }}>{p.brand}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{p.title}</div>
                        <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>{p.start} — {p.end}</div>
                      </div>
                      {/* Neon discount box */}
                      <div style={{ flexShrink: 0, border: "2px solid #00e676", borderRadius: 8, padding: "4px 8px", color: "#00e676", fontSize: 13, fontWeight: 900, background: "rgba(0,230,118,0.06)", boxShadow: "0 0 10px rgba(0,230,118,0.2)", textAlign: "center", whiteSpace: "nowrap" }}>{p.discount}</div>
                      {/* Folded corner */}
                      <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 18px 18px 0", borderColor: `transparent ${p.color} transparent transparent`, opacity: 0.8 }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Panel 3: Products ─────────────────────────────────── */}
              <div style={{ ...card, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#065f46,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(16,185,129,0.45)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Products</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 4 }}>Newest <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></span>
                </div>
                {/* Product rows with thumbnail */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                  {promoProducts.map(p => {
                    const thumbColors: Record<string,string> = { beverage:"linear-gradient(135deg,#1e3a8a,#3b82f6)", snack:"linear-gradient(135deg,#78350f,#f59e0b)", dairy:"linear-gradient(135deg,#065f46,#10b981)", instant:"linear-gradient(135deg,#7c2d12,#ef4444)" };
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: thumbColors[p.sector] ?? "#111", flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                          {PRODUCT_IMG[p.id] ? <img src={PRODUCT_IMG[p.id]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: 18 }}>{p.sector === "beverage" ? "🥤" : p.sector === "snack" ? "🍟" : p.sector === "dairy" ? "🥛" : "🍜"}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: "#444" }}>{p.seller} · {p.location}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#00e676", letterSpacing: "-0.01em" }}>{fmtVND(p.salePrice)}</div>
                          <div style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", display: "inline-block", marginTop: 2, fontWeight: 700 }}>-{p.discount}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Panel 4: Marketplace ──────────────────────────────── */}
              <div style={{ ...card, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a8a,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(109,40,217,0.45)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Marketplace</span>
                  <Link href="/forum" style={{ marginLeft: "auto", fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>See all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
                </div>

                {marketListings.length === 0 ? (
                  /* Holographic empty state */
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 0 8px", gap: 14 }}>
                    {/* Radar rings + pulse */}
                    <div style={{ position: "relative", width: 120, height: 80 }}>
                      {[60,46,32,18].map((r,i) => (
                        <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: r*2, height: r, transform: "translate(-50%,-50%)", borderRadius: "50%", border: `1px solid rgba(124,58,237,${0.12 + i*0.08})` }} />
                      ))}
                      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 120 80">
                        <defs>
                          <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>
                        <polyline points="8,40 28,40 40,20 55,58 70,28 85,52 100,40 116,40" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" style={{ animation: "radarPulse 2s ease-in-out infinite" }}/>
                        <circle cx="55" cy="58" r="3" fill="#7c3aed" style={{ animation: "pulse 2s infinite" }}/>
                      </svg>
                    </div>
                    <div style={{ fontSize: 12, color: "#444", textAlign: "center", lineHeight: 1.5 }}>No {currentSector?.sectorLabel} data listed yet</div>
                    <Link href="/dashboard/profile" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 20px", background: "linear-gradient(135deg,rgba(80,20,180,0.4),rgba(120,50,220,0.3))", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, color: "#c4b5fd", textDecoration: "none", fontSize: 13, fontWeight: 700, boxShadow: "0 0 14px rgba(124,58,237,0.2)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      List your data
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 210, overflowY: "auto" }}>
                    {marketListings.map(l => (
                      <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#4c1d95,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                          <div style={{ fontSize: 10, color: "#444" }}>{l.sellerEmail?.split("@")[0] ?? l.sellerWallet.slice(0,8) + "…"}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa", flexShrink: 0 }}>${l.price}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Tools & Shortcuts ──────────────────────────────────────── */}
          <div style={{ ...card, padding:"12px 16px", marginTop:2 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#f0f0f0" }}>Tools &amp; Shortcuts</span>
              <Link href="/dashboard" style={{ fontSize:10, color:"#555", textDecoration:"none" }}>View all →</Link>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:8 }}>
              {([
                { label:"Smart Scanner",  href:"/dashboard/analysis",     color:"#7c3aed" },
                { label:"Image Search",   href:"/dashboard/vision-agent", color:"#3b82f6" },
                { label:"Compare",        href:"/dashboard/analysis",     color:"#10b981" },
                { label:"AI Insights",    href:"/dashboard/analysis",     color:"#f59e0b" },
                { label:"Report Builder", href:"/dashboard/reports",      color:"#ec4899" },
                { label:"Alerts",         href:"/dashboard",              color:"#ef4444" },
                { label:"Data Export",    href:"/dashboard/reports",      color:"#8b5cf6" },
                { label:"Integrations",   href:"/forum",                  color:"#06b6d4" },
              ] as {label:string;href:string;color:string}[]).map((t,i) => (
                <Link key={i} href={t.href} style={{ textDecoration:"none" }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"10px 6px", borderRadius:9, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", cursor:"pointer", transition:"all 0.15s", textAlign:"center" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${t.color}40`; e.currentTarget.style.background = `${t.color}0a`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:`${t.color}18`, border:`1px solid ${t.color}28`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <span style={{ fontSize:9, fontWeight:600, color:"#777", lineHeight:1.2 }}>{t.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Latest Promotions + Watchlist ──────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:12, marginTop:2 }}>
            <div style={{ ...card, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#f0f0f0" }}>Latest Promotions</span>
                <Link href="/forum" style={{ fontSize:10, color:"#7c3aed", textDecoration:"none" }}>View all</Link>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {promos.slice(0,3).map((p,i) => (
                  <div key={i} style={{ position:"relative", borderRadius:9, overflow:"hidden", padding:"10px 10px 8px", background:"rgba(10,5,30,0.9)", border:`1px solid ${p.color}20` }}>
                    <div style={{ position:"absolute", top:0, left:0, bottom:0, width:2, background:p.color }}/>
                    <div style={{ fontSize:10, fontWeight:800, color:p.color, marginBottom:3, paddingLeft:7 }}>{p.discount}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#fff", paddingLeft:7, marginBottom:2 }}>{p.brand}</div>
                    <div style={{ fontSize:9, color:"#444", paddingLeft:7 }}>{p.start} — {p.end}</div>
                    {PRODUCT_IMG[`pp${i+1}`] ? <img src={PRODUCT_IMG[`pp${i+1}`]} alt="" style={{ position:"absolute", bottom:-4, right:-4, width:36, height:36, objectFit:"contain", opacity:0.6 }}/> : null}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...card, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#f0f0f0" }}>My Watchlist</span>
              </div>
              {([{b:"Coca-Cola",c:"+18.6%"},{b:"Nescafe Gold",c:"+12.4%"},{b:"Lay's Classic",c:"+9.8%"},{b:"Pepsi",c:"+7.2%"}] as {b:string;c:string}[]).map((w,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width:24, height:24, borderRadius:5, background:"rgba(124,58,237,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#a78bfa", flexShrink:0 }}>{w.b[0]}</div>
                  <span style={{ flex:1, fontSize:11, color:"#ddd", fontWeight:500 }}>{w.b}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#10b981" }}>{w.c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Global Search ──────────────────────────────────────────── */}
          <div style={{ ...card, padding:"14px 18px", marginTop:2 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#f0f0f0" }}>Global Search</span>
              <span style={{ fontSize:10, color:"#444" }}>Search across companies, products, barcodes, and more.</span>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <div style={{ flex:1, position:"relative" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies, products, barcodes, categories..."
                  style={{ width:"100%", padding:"8px 12px 8px 28px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, color:"#f0f0f0", fontSize:12, outline:"none", boxSizing:"border-box" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                />
              </div>
              <Link href="/dashboard/analysis" style={{ padding:"8px 16px", background:"linear-gradient(135deg,#5b21b6,#7c3aed)", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Search
              </Link>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:9, color:"#444" }}>Popular:</span>
              {(["Coca Cola","Nescafe","Sprite","Pepsi","Lay's","Oreo","Vinamilk"] as string[]).map(t => (
                <button key={t} onClick={() => setSearch(t)}
                  style={{ padding:"2px 8px", borderRadius:999, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:"#555", fontSize:10, cursor:"pointer", fontFamily:"inherit" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

        </div>
        </div>{/* end scrollable wrapper */}
      </main>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes radarPulse { 0%,100%{opacity:0.5;filter:drop-shadow(0 0 2px #7c3aed)} 50%{opacity:1;filter:drop-shadow(0 0 8px #a78bfa)} }

        /* §7 stagger entrance — translateY + scale + opacity only */
        @keyframes cardEntrance {
          from { opacity:0; transform:perspective(520px) translateY(18px) scale(0.9); }
          to   { opacity:1; transform:perspective(520px) translateY(0)     scale(1); }
        }

        /* §7 shimmer — translateX only (hardware accelerated) */
        @keyframes shimmerSlide {
          from { transform: skewX(-18deg) translateX(-50%);  }
          to   { transform: skewX(-18deg) translateX(420%); }
        }

        /* §1 reduced-motion: disable all motion for a11y */
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
