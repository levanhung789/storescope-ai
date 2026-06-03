"use client";

import { useState } from "react";
import Link from "next/link";

// ── All 40 products ───────────────────────────────────────────────────────────
const ALL_PRODUCTS = [
  // Pepsi
  { id:"c01", name:"Pepsi Original 1.5L",               img:"/products/PEPsi 1.5L.png",                                  price:25000, salePrice:18000, discount:28, brand:"Pepsi",    cat:"Nước ngọt" },
  { id:"c02", name:"Nước ngọt Pepsi Cola chai 390ml",   img:"/products/Nước ngọt Pepsi Cola chai 390ml.png",             price:12000, salePrice:9000,  discount:25, brand:"Pepsi",    cat:"Nước ngọt" },
  { id:"c03", name:"Nước ngọt Pepsi Cola lon 320ml",    img:"/products/Nước ngọt Pepsi Cola lon 320ml.png",              price:10000, salePrice:7500,  discount:25, brand:"Pepsi",    cat:"Nước ngọt" },
  { id:"c04", name:"Pepsi không calo lon 320ml",        img:"/products/Nước ngọt Pepsi không calo lon 320ml.png",        price:10000, salePrice:8000,  discount:20, brand:"Pepsi",    cat:"Nước ngọt" },
  { id:"c05", name:"6 chai Pepsi Cola 390ml",           img:"/products/6 chai nước ngọt Pepsi Cola 390ml.png",           price:72000, salePrice:55000, discount:24, brand:"Pepsi",    cat:"Combo" },
  { id:"c06", name:"6 lon Pepsi Cola 320ml",            img:"/products/6 lon nước ngọt Pepsi Cola 320ml.png",            price:60000, salePrice:46000, discount:23, brand:"Pepsi",    cat:"Combo" },
  { id:"c07", name:"6 lon Pepsi không calo 320ml",      img:"/products/6 lon nước ngọt Pepsi không calo 320ml.png",     price:60000, salePrice:47000, discount:22, brand:"Pepsi",    cat:"Combo" },
  { id:"c08", name:"Thùng 24 lon Pepsi Cola 320ml",     img:"/products/Thùng 24 lon nước ngọt Pepsi Cola 320ml.png",    price:240000,salePrice:188000,discount:22, brand:"Pepsi",    cat:"Thùng" },
  { id:"c09", name:"Thùng 24 lon Pepsi không calo",     img:"/products/Thùng 24 lon nước ngọt Pepsi không calo 320ml.png",price:240000,salePrice:190000,discount:21, brand:"Pepsi", cat:"Thùng" },
  { id:"c10", name:"Thùng 24 chai Pepsi Cola 390ml",    img:"/products/Thùng 24 chai nước ngọt Pepsi Cola 390ml.png",   price:288000,salePrice:220000,discount:24, brand:"Pepsi",    cat:"Thùng" },
  // Mirinda
  { id:"c11", name:"Mirinda hương xá xị chai 390ml",    img:"/products/Nước ngọt Mirinda hương xá xị chai 390ml.png",   price:12000, salePrice:9000,  discount:25, brand:"Mirinda",  cat:"Nước ngọt" },
  { id:"c12", name:"Mirinda hương xá xị lon 320ml",     img:"/products/Nước ngọt Mirinda hương xá xị lon 320ml.png",    price:10000, salePrice:7500,  discount:25, brand:"Mirinda",  cat:"Nước ngọt" },
  { id:"c13", name:"Mirinda hương cam chai 1.5L",        img:"/products/Nước ngọt Mirinda hương cam chai 1.5 lít.png",   price:22000, salePrice:17000, discount:23, brand:"Mirinda",  cat:"Nước ngọt" },
  { id:"c14", name:"6 chai Mirinda xá xị 390ml",        img:"/products/6 chai nước ngọt Mirinda hương xá xị 390ml.png", price:72000, salePrice:55000, discount:24, brand:"Mirinda",  cat:"Combo" },
  { id:"c15", name:"6 lon Mirinda xá xị 320ml",         img:"/products/6 lon nước ngọt Mirinda hương xá xị 320ml.png",  price:60000, salePrice:46000, discount:23, brand:"Mirinda",  cat:"Combo" },
  { id:"c16", name:"Thùng 24 Mirinda xá xị 320ml",     img:"/products/Thùng 24 Nước ngọt Mirinda hương xá xị lon 320ml.png",price:240000,salePrice:185000,discount:23, brand:"Mirinda",cat:"Thùng" },
  { id:"c17", name:"Thùng 24 chai Mirinda xá xị 390ml",img:"/products/Thùng 24 chai nước ngọt Mirinda hương xá xị 390ml.png",price:288000,salePrice:218000,discount:24, brand:"Mirinda",cat:"Thùng" },
  // 7 Up
  { id:"c18", name:"7 Up vị chanh chai 1.5L",           img:"/products/Nước ngọt 7 Up vị chanh chai 1.5 lít.png",       price:22000, salePrice:17000, discount:23, brand:"7Up",      cat:"Nước ngọt" },
  { id:"c19", name:"7 Up vị chanh chai 390ml",          img:"/products/Nước ngọt 7 Up vị chanh chai 390ml.png",         price:12000, salePrice:9000,  discount:25, brand:"7Up",      cat:"Nước ngọt" },
  { id:"c20", name:"7 Up vị chanh lon 320ml",           img:"/products/Nước ngọt 7 Up vị chanh lon 320ml.png",          price:10000, salePrice:7500,  discount:25, brand:"7Up",      cat:"Nước ngọt" },
  { id:"c21", name:"6 chai 7 Up vị chanh 390ml",        img:"/products/6 chai nước ngọt 7 Up vị chanh 390ml.png",       price:72000, salePrice:55000, discount:24, brand:"7Up",      cat:"Combo" },
  { id:"c22", name:"6 lon 7 Up vị chanh 320ml",         img:"/products/6 lon nước ngọt 7 Up vị chanh 320ml.png",        price:60000, salePrice:46000, discount:23, brand:"7Up",      cat:"Combo" },
  { id:"c23", name:"Thùng 24 chai 7 Up 390ml",          img:"/products/Thùng 24 chai nước ngọt 7 Up vị chanh 390ml.png",price:288000,salePrice:218000,discount:24, brand:"7Up",      cat:"Thùng" },
  { id:"c24", name:"Thùng 24 lon 7 Up 320ml",           img:"/products/Thùng 24 lon nước ngọt 7 Up vị chanh 320ml.png", price:240000,salePrice:185000,discount:23, brand:"7Up",      cat:"Thùng" },
  // Tea Plus
  { id:"c25", name:"Trà ô long Tea Plus 320ml",         img:"/products/Trà ô long Tea Plus 320ml.png",                  price:12000, salePrice:9500,  discount:21, brand:"Tea Plus",  cat:"Trà" },
  { id:"c26", name:"Trà ô long Tea Plus vị đào 1L",    img:"/products/Trà ô long Tea Plus vị đào chai 1 lít.png",      price:22000, salePrice:17500, discount:20, brand:"Tea Plus",  cat:"Trà" },
  { id:"c27", name:"Trà chanh Tea Plus Yuzu 455ml",     img:"/products/Trà chanh Tea Plus Yuzu chai 455ml.png",         price:16000, salePrice:12500, discount:22, brand:"Tea Plus",  cat:"Trà" },
  { id:"c28", name:"6 chai Trà ô long Tea Plus 320ml", img:"/products/6 chai trà ô long Tea Plus 320ml.png",           price:72000, salePrice:56000, discount:22, brand:"Tea Plus",  cat:"Combo" },
  { id:"c29", name:"6 chai Trà ô long Tea Plus đào 1L",img:"/products/Lốc 6 chai trà ô long Tea Plus vị đào 1 lít.png",price:132000,salePrice:104000,discount:21, brand:"Tea Plus",  cat:"Combo" },
  { id:"c30", name:"6 chai Trà chanh Tea Plus Yuzu",   img:"/products/6 chai trà chanh Tea Plus Yuzu 455ml.png",       price:96000, salePrice:74000, discount:23, brand:"Tea Plus",  cat:"Combo" },
  { id:"c31", name:"Thùng 24 Trà ô long 320ml",        img:"/products/Thùng 24 chai trà ô long Tea Plus 320ml.png",   price:288000,salePrice:224000,discount:22, brand:"Tea Plus",  cat:"Thùng" },
  { id:"c32", name:"Thùng 12 Trà ô long đào 1L",       img:"/products/Thùng 12 chai trà ô long Tea Plus vị đào 1 lít.png",price:264000,salePrice:206000,discount:22, brand:"Tea Plus",cat:"Thùng" },
  { id:"c33", name:"Thùng 24 Trà chanh Yuzu 455ml",    img:"/products/Thùng 24 chai trà chanh Tea Plus Yuzu 455ml.png",price:384000,salePrice:296000,discount:23, brand:"Tea Plus",  cat:"Thùng" },
  // Khác
  { id:"c34", name:"Sting Dâu 330ml × 6",              img:"/products/Sting Dâu 330ml × 6.png",                        price:72000, salePrice:55000, discount:24, brand:"Sting",     cat:"Nước tăng lực" },
  { id:"c35", name:"Aquafina 500ml × 24",              img:"/products/Aquafina 500ml × 24.png",                        price:168000,salePrice:138000,discount:18, brand:"Aquafina",  cat:"Nước suối" },
  { id:"c36", name:"Vinamilk Sữa Tươi 1L",            img:"/products/Vinamilk Sữa Tươi 1L.png",                      price:32000, salePrice:27000, discount:16, brand:"Vinamilk",  cat:"Sữa" },
  { id:"c37", name:"Lay's Classic 120g",               img:"/products/Lay's Classic 120g.png",                         price:18000, salePrice:14000, discount:22, brand:"Lay's",     cat:"Snack" },
  { id:"c38", name:"Cheetos Flamin Hot 85g",           img:"/products/Cheetos Flamin Hot 85g.png",                     price:22000, salePrice:16000, discount:27, brand:"Cheetos",   cat:"Snack" },
  { id:"c39", name:"Oreo Sandwich 432g",               img:"/products/Oreo Sandwich 432g.png",                         price:45000, salePrice:36000, discount:20, brand:"Oreo",      cat:"Bánh" },
  { id:"c40", name:"Hảo Hảo Tôm Chua Cay ×30",       img:"/products/Hảo Hảo Tôm Chua Cay ×30.png",                 price:95000, salePrice:74000, discount:22, brand:"Hảo Hảo",  cat:"Mì gói" },
];

const CATEGORIES = ["Tất cả", "Nước ngọt", "Combo", "Thùng", "Trà", "Nước tăng lực", "Nước suối", "Sữa", "Snack", "Bánh", "Mì gói"];
const BRANDS = ["Tất cả", "Pepsi", "Mirinda", "7Up", "Tea Plus", "Sting", "Aquafina", "Vinamilk", "Lay's", "Cheetos", "Oreo", "Hảo Hảo"];

function fmtVND(n: number) { return n.toLocaleString("vi-VN") + "đ"; }

export default function CatalogPage() {
  const [cat,    setCat]    = useState("Tất cả");
  const [brand,  setBrand]  = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [sort,   setSort]   = useState<"discount"|"price_asc"|"price_desc">("discount");

  const filtered = ALL_PRODUCTS
    .filter(p => (cat   === "Tất cả" || p.cat   === cat))
    .filter(p => (brand === "Tất cả" || p.brand === brand))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "discount"   ? b.discount - a.discount :
      sort === "price_asc"  ? a.salePrice - b.salePrice :
                              b.salePrice - a.salePrice
    );

  return (
    <div style={{ minHeight: "100vh", background: "#06030e", color: "#f0f0f0", fontFamily: "inherit" }}>

      {/* BG */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url(/dashboard-bg.png)", backgroundSize: "cover", opacity: 0.1, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, background: "rgba(6,3,14,0.92)", pointerEvents: "none" }} />

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(124,58,237,0.15)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, background: "rgba(6,3,14,0.96)", backdropFilter: "blur(16px)" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
          storescope<span style={{ color: "#a78bfa" }}>.ai</span>
        </Link>
        <span style={{ color: "#2a2a2a" }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>FMCG Catalog</span>
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
            style={{ padding: "8px 14px 8px 32px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, color: "#f0f0f0", fontSize: 13, outline: "none", width: 240 }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)")}
          />
        </div>
      </header>

      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 4px" }}>
            Danh mục sản phẩm <span style={{ color: "#a78bfa" }}>FMCG</span>
          </h1>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{filtered.length} sản phẩm • Cập nhật 2026</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          {/* Category tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${cat === c ? "#7c3aed" : "rgba(255,255,255,0.08)"}`, background: cat === c ? "#7c3aed" : "transparent", color: cat === c ? "#fff" : "#555", transition: "all 0.15s" }}>
                {c}
              </button>
            ))}
          </div>
          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            style={{ marginLeft: "auto", padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#888", fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="discount">Giảm giá nhiều nhất</option>
            <option value="price_asc">Giá thấp → cao</option>
            <option value="price_desc">Giá cao → thấp</option>
          </select>
        </div>

        {/* Brand filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {BRANDS.map(b => (
            <button key={b} onClick={() => setBrand(b)}
              style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${brand === b ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.06)"}`, background: brand === b ? "rgba(167,139,250,0.12)" : "transparent", color: brand === b ? "#a78bfa" : "#444", transition: "all 0.15s" }}>
              {b}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {filtered.map((p, i) => (
            <div key={p.id}
              style={{ background: "rgba(13,6,30,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s", animation: `cardEntrance 400ms cubic-bezier(0.34,1.56,0.64,1) ${Math.min(i,15) * 40}ms both` }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.02)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}>

              {/* Product image */}
              <div style={{ position: "relative", aspectRatio: "1/1", background: "#06030e" }}>
                <img src={p.img} alt={p.name} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {/* Discount badge */}
                <div style={{ position: "absolute", top: 8, right: 8, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999 }}>
                  -{p.discount}%
                </div>
                {/* Category tag */}
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(6,3,14,0.85)", color: "#a78bfa", fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 999, letterSpacing: "0.06em" }}>
                  {p.cat}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "12px 12px 14px" }}>
                <div style={{ fontSize: 11, color: "#555", fontWeight: 600, marginBottom: 4 }}>{p.brand}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.3, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#00e676", letterSpacing: "-0.01em" }}>{fmtVND(p.salePrice)}</div>
                    <div style={{ fontSize: 10, color: "#333", textDecoration: "line-through" }}>{fmtVND(p.price)}</div>
                  </div>
                  <button style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; e.currentTarget.style.color = "#a78bfa"; }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📦</div>
            <p style={{ fontSize: 14 }}>Không tìm thấy sản phẩm phù hợp</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cardEntrance {
          from { opacity:0; transform:translateY(16px) scale(0.95); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}
