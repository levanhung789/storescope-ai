"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RetailerPrice {
  retailer: string;
  logo: string;
  price: number;
  originalPrice?: number;
  unit: string;
  inPromo: boolean;
  promoLabel?: string;
  promoEnd?: string;
  url?: string;
}

interface Competitor {
  name: string;
  brand: string;
  price: number;
  packSpec: string;
  marketShare?: number;
  color: string;
}

interface ProductDetail {
  productName: string;
  companyName: string;
  sectorLabel: string;
  category: string;
  packSpec: string;
  description: string;
  usage: string;
  ingredients?: string;
  netWeight?: string;
  barcode?: string;
  madeIn: string;
  images: string[];
  prices: RetailerPrice[];
  competitors: Competitor[];
  aiStatus: "Matched" | "Review" | "Missing";
  confidence: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function vnd(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

function priceDrop(orig: number, curr: number) {
  return Math.round(((orig - curr) / orig) * 100);
}

// ── Generate rich mock data from product folder name ──────────────────────────

function buildProductDetail(
  productFolder: string,
  companyFolder: string,
  sectorFolder: string,
  sectorLabel: string,
  images: string[]
): ProductDetail {
  const name = productFolder;
  const nameLower = name.toLowerCase();

  // Detect pack spec from name
  const packMatch = name.match(/(\d+[\.,]?\d*)\s*(ml|g|kg|lít|lit|chai|gói|hũ|can|thùng)/i);
  const packSpec = packMatch ? packMatch[0] : "Standard pack";

  // Category detection
  let category = "Food & Beverage";
  let description = "";
  let usage = "";
  let ingredients = "";

  if (nameLower.includes("bột ngọt") || nameLower.includes("msg")) {
    category = "Monosodium Glutamate (MSG)";
    description = `${name} là sản phẩm bột ngọt chất lượng cao, giúp tăng cường hương vị umami tự nhiên cho các món ăn. Được sản xuất theo công nghệ lên men hiện đại, đảm bảo tinh khiết và an toàn.`;
    usage = "Dùng nêm vào các món canh, xào, kho, hầm. Liều lượng: 1–2g cho mỗi 500ml nước dùng. Cho vào cuối quá trình nấu để giữ nguyên hương vị.";
    ingredients = "Bột ngọt (L-Glutamate natri) ≥99%";
  } else if (nameLower.includes("hạt nêm")) {
    category = "Seasoning Granules";
    description = `${name} là hạt nêm đa dụng, kết hợp hài hòa từ xương, thịt và các nguyên liệu tự nhiên. Mang lại vị ngọt đậm đà, thơm ngon cho mọi món ăn.`;
    usage = "Nêm vào các món soup, canh, xào, kho, hầm. 1 muỗng cà phê (5g) cho 400ml nước hoặc 300g thịt.";
    ingredients = "Muối, bột ngọt, đường, hương liệu tổng hợp, chiết xuất xương/thịt, tinh bột biến tính.";
  } else if (nameLower.includes("nước mắm") || nameLower.includes("nuoc mam")) {
    category = "Fish Sauce";
    description = `${name} được làm từ cá cơm tươi ủ muối truyền thống, cho vị mặn ngọt hài hòa với mùi thơm đặc trưng. Phù hợp làm nước chấm, nêm nếm và ướp thực phẩm.`;
    usage = "Dùng trực tiếp làm nước chấm, pha với chanh/tỏi/ớt. Dùng nêm trong nấu ăn hoặc ướp thịt/cá. Không đun sôi lâu để giữ hương vị.";
    ingredients = "Cá cơm, muối biển. Hàm lượng đạm tổng theo độ đạm ghi trên nhãn.";
  } else if (nameLower.includes("dầu ăn") || nameLower.includes("dầu thực vật") || nameLower.includes("cooking oil") || nameLower.includes("neptune") || nameLower.includes("cái lân") || nameLower.includes("orchid") || nameLower.includes("meizan")) {
    category = "Cooking Oil";
    description = `${name} là dầu ăn tinh luyện chất lượng cao, giàu vitamin E và axit béo không no. Chịu nhiệt tốt, không bị oxy hóa khi chiên rán ở nhiệt độ cao, giữ được màu sắc và hương vị tự nhiên của thực phẩm.`;
    usage = "Dùng để chiên, xào, nướng, làm salad và các món ăn hàng ngày. Thích hợp chiên rán ở nhiệt độ cao đến 230°C. Bảo quản nơi thoáng mát, tránh ánh sáng trực tiếp.";
    ingredients = "Dầu thực vật tinh luyện (đậu nành/cọ/hướng dương), Vitamin E (tocopherol).";
  } else if (nameLower.includes("tương ớt") || nameLower.includes("tương cà") || nameLower.includes("xốt")) {
    category = "Sauce & Condiment";
    description = `${name} được chế biến từ nguyên liệu tươi ngon, quy trình khép kín đảm bảo vệ sinh an toàn thực phẩm. Vị chua ngọt/cay đặc trưng phù hợp nhiều món ăn.`;
    usage = "Dùng trực tiếp làm nước chấm, sốt ướp, phết lên bánh mì, pizza. Bảo quản lạnh sau khi mở nắp, dùng trong 30 ngày.";
    ingredients = "Ớt/cà chua, đường, giấm, muối, tinh bột biến tính, chất bảo quản (E202).";
  } else if (nameLower.includes("dầu hào") || nameLower.includes("maggi")) {
    category = "Oyster Sauce / Soy Sauce";
    description = `${name} của Maggi (Nestlé) là sản phẩm nước chấm đa dụng nổi tiếng toàn cầu. Vị đậm đà, màu nâu cánh gián đẹp mắt, phù hợp ướp và nêm nếm các món Á.`;
    usage = "Dùng để ướp thịt, xào rau, trộn salad, nước chấm. 1–2 muỗng canh cho mỗi suất ăn. Thêm vào khi nấu gần chín để giữ hương thơm.";
    ingredients = "Nước, đường, muối, tinh bột biến tính, chiết xuất bào ngư/nấm hương, chất điều vị.";
  } else if (nameLower.includes("knorr") || nameLower.includes("gia vị")) {
    category = "Complete Seasoning Mix";
    description = `${name} là gói gia vị hoàn chỉnh của Knorr (Unilever), giúp nấu món ngon chuẩn vị chỉ với một bước đơn giản. Kết hợp từ nhiều nguyên liệu chọn lọc.`;
    usage = "Ướp thực phẩm theo tỉ lệ ghi trên bao bì (thường 1 gói cho 500g–1kg thực phẩm). Để ướp ít nhất 15–30 phút trước khi nấu.";
    ingredients = "Muối, đường, bột ngọt, hương liệu, gia vị tổng hợp, tinh bột.";
  } else if (nameLower.includes("bơ thực vật")) {
    category = "Margarine / Butter";
    description = `${name} là bơ thực vật chất lượng, tan chảy mịn màng, phù hợp làm bánh, phết bánh mì hoặc xào nấu. Hàm lượng chất béo no thấp hơn bơ động vật.`;
    usage = "Phết trực tiếp lên bánh mì, dùng trong làm bánh (thay bơ động vật tỉ lệ 1:1), xào nấu thay dầu ăn. Bảo quản lạnh 2–8°C.";
    ingredients = "Dầu thực vật tinh luyện, nước, muối, nhũ tương (E471), Vitamin A&D.";
  } else if (nameLower.includes("muối")) {
    category = "Salt & Spice";
    description = `${name} là sản phẩm muối gia vị đặc sản với hương vị độc đáo, phù hợp chấm trái cây và các món ăn vặt.`;
    usage = "Dùng chấm trực tiếp với trái cây (xoài, ổi, dưa hấu) hoặc ướp thịt/cá/tôm. Lắc đều trước khi dùng.";
    ingredients = "Muối, ớt, tỏi, đường, chất điều vị (E621), màu thực phẩm tự nhiên.";
  } else {
    category = sectorLabel;
    description = `${name} là sản phẩm FMCG chất lượng trong ngành ${sectorLabel.toLowerCase()}. Được phân phối rộng rãi tại các kênh bán lẻ hiện đại và truyền thống tại Việt Nam.`;
    usage = "Sử dụng theo hướng dẫn trên bao bì sản phẩm. Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.";
    ingredients = "Xem nhãn sản phẩm để biết thành phần chi tiết.";
  }

  // Generate realistic prices based on pack spec
  const basePrice = (() => {
    const num = parseFloat((packMatch?.[1] || "1").replace(",", "."));
    const unit = (packMatch?.[2] || "").toLowerCase();
    if (unit.includes("kg") || num >= 900) return 85000;
    if (num >= 400) return 55000;
    if (num >= 200) return 38000;
    if (num >= 100) return 22000;
    if (num >= 50) return 15000;
    return 30000;
  })();

  const prices: RetailerPrice[] = [
    {
      retailer: "Bách Hóa Xanh",
      logo: "BHX",
      price: Math.round(basePrice * 0.96 / 100) * 100,
      originalPrice: Math.round(basePrice / 100) * 100,
      unit: packSpec,
      inPromo: Math.random() > 0.4,
      promoLabel: "Giảm 4%",
      promoEnd: "30/04/2026",
    },
    {
      retailer: "VinMart / WinMart",
      logo: "WIN",
      price: Math.round(basePrice * 0.94 / 100) * 100,
      originalPrice: Math.round(basePrice * 1.02 / 100) * 100,
      unit: packSpec,
      inPromo: Math.random() > 0.5,
      promoLabel: "Thành viên -6%",
      promoEnd: "15/05/2026",
    },
    {
      retailer: "Co.opmart",
      logo: "COP",
      price: Math.round(basePrice * 0.98 / 100) * 100,
      unit: packSpec,
      inPromo: false,
    },
    {
      retailer: "Lazada",
      logo: "LAZ",
      price: Math.round(basePrice * 0.88 / 100) * 100,
      originalPrice: Math.round(basePrice / 100) * 100,
      unit: packSpec,
      inPromo: true,
      promoLabel: "Flash sale -12%",
      promoEnd: "Hôm nay 23:59",
    },
    {
      retailer: "Shopee",
      logo: "SPE",
      price: Math.round(basePrice * 0.90 / 100) * 100,
      originalPrice: Math.round(basePrice * 1.05 / 100) * 100,
      unit: packSpec,
      inPromo: true,
      promoLabel: "Voucher -10%",
      promoEnd: "05/05/2026",
    },
    {
      retailer: "Tiki",
      logo: "TKI",
      price: Math.round(basePrice * 0.93 / 100) * 100,
      unit: packSpec,
      inPromo: Math.random() > 0.6,
      promoLabel: "TikiNOW -7%",
    },
  ];

  // Competitors
  const competitors: Competitor[] = (() => {
    if (category === "Monosodium Glutamate (MSG)") return [
      { name: "Mì chính Vedan 200g",      brand: "Vedan",   price: 14000, packSpec: "200g", marketShare: 22, color: "#ef4444" },
      { name: "Mì chính Knorr 100g",       brand: "Knorr",   price: 12000, packSpec: "100g", marketShare: 15, color: "#f59e0b" },
      { name: "Mì chính Chinsu 200g",      brand: "Masan",   price: 11000, packSpec: "200g", marketShare: 12, color: "#3b82f6" },
    ];
    if (category === "Cooking Oil") return [
      { name: "Dầu Meizan Gold 1L",        brand: "Calofic",    price: 42400, packSpec: "1L",  marketShare: 28, color: "#f59e0b" },
      { name: "Dầu Simply 1L",             brand: "Calofic",    price: 48000, packSpec: "1L",  marketShare: 10, color: "#22c55e" },
      { name: "Dầu Happi Cook 1L",         brand: "Dầu Tường An", price: 38000, packSpec: "1L", marketShare: 8, color: "#a855f7" },
    ];
    if (category === "Fish Sauce") return [
      { name: "Nước mắm Chinsu 40° 720ml", brand: "Masan",    price: 52000, packSpec: "720ml", marketShare: 32, color: "#ef4444" },
      { name: "Nước mắm Knorr 242ml",      brand: "Unilever", price: 28000, packSpec: "242ml", marketShare: 18, color: "#f59e0b" },
      { name: "Nước mắm Tiến Vua 500ml",   brand: "Masan",    price: 35000, packSpec: "500ml", marketShare: 12, color: "#3b82f6" },
    ];
    if (category === "Sauce & Condiment") return [
      { name: "Tương ớt Chin-su 250g",     brand: "Masan",    price: 22000, packSpec: "250g", marketShare: 45, color: "#ef4444" },
      { name: "Tương ớt Nam Dương 255g",   brand: "Nam Dương", price: 18000, packSpec: "255g", marketShare: 18, color: "#f59e0b" },
      { name: "Tương ớt Maggi 260g",       brand: "Nestlé",   price: 24000, packSpec: "260g", marketShare: 12, color: "#3b82f6" },
    ];
    return [
      { name: "Sản phẩm tương đương A",    brand: "Competitor A", price: basePrice * 0.9, packSpec, marketShare: 15, color: "#ef4444" },
      { name: "Sản phẩm tương đương B",    brand: "Competitor B", price: basePrice * 1.1, packSpec, marketShare: 10, color: "#f59e0b" },
    ];
  })();

  return {
    productName: name,
    companyName: companyFolder.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()).replace(/Cong Ty /gi, "").replace(/Co Phan /gi, "").replace(/Tnhh /gi, "").trim(),
    sectorLabel,
    category,
    packSpec,
    description,
    usage,
    ingredients,
    madeIn: "Việt Nam",
    images,
    prices,
    competitors,
    aiStatus: "Matched",
    confidence: 87 + Math.floor(Math.random() * 12),
  };
}

// ── Page component ─────────────────────────────────────────────────────────────

function ProductPageInner() {
  const params = useSearchParams();
  const sector   = params.get("sector")   || "";
  const company  = params.get("company")  || "";
  const product  = params.get("product")  || "";
  const sLabel   = params.get("sLabel")   || "FMCG";
  const imagesRaw = params.get("images")  || "";
  const images = imagesRaw ? imagesRaw.split(",").filter(Boolean) : [];

  const [imgIdx, setImgIdx] = useState(0);
  const [detail] = useState<ProductDetail>(() =>
    buildProductDetail(product, company, sector, sLabel, images)
  );

  const buildUrl = (img: string) => encodeURI(`/companies/${sector}/${company}/${product}/${img}`);
  const lowestPrice = Math.min(...detail.prices.map(p => p.price));
  const highestPrice = Math.max(...detail.prices.map(p => p.price));
  const promoCount = detail.prices.filter(p => p.inPromo).length;

  const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 16 };

  const logoColors: Record<string, string> = {
    BHX: "#0066cc", WIN: "#00a651", COP: "#e31e24",
    LAZ: "#F57224", SPE: "#EE4D2D", TKI: "#0F68B4",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", fontFamily: "inherit" }}>

      {/* ── Topbar ── */}
      <header style={{ borderBottom: "1px solid #1f1f1f", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(8,8,8,0.9)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/dashboard" style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0", textDecoration: "none", letterSpacing: "-0.04em" }}>
            storescope<span style={{ color: "#7c3aed" }}>.ai</span>
          </Link>
          <span style={{ color: "#2a2a2a" }}>|</span>
          <Link href="/dashboard" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}>Dashboard</Link>
          <span style={{ color: "#2a2a2a" }}>›</span>
          <span style={{ fontSize: 12, color: "#888" }}>{detail.sectorLabel}</span>
          <span style={{ color: "#2a2a2a" }}>›</span>
          <span style={{ fontSize: 12, color: "#f0f0f0", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail.productName}</span>
        </div>
        <Link href="/dashboard/analysis" style={{ background: "#7c3aed", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "7px 16px", fontSize: 12, fontWeight: 600 }}>
          AI Analysis
        </Link>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Top section: image + info ── */}
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>

          {/* Images */}
          <div>
            <div style={{ position: "relative", height: 320, background: "#050505", borderRadius: 16, overflow: "hidden", border: "1px solid #1f1f1f" }}>
              {images.length > 0 ? (
                <img src={buildUrl(images[imgIdx])} alt={detail.productName}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#333" }}>No image</div>
              )}

              {/* AI badge */}
              <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 999, padding: "4px 12px", fontSize: 11, color: "#4ade80", fontWeight: 600 }}>
                ✓ AI Matched {detail.confidence}%
              </div>

              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(p => (p - 1 + images.length) % images.length)}
                    style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ‹
                  </button>
                  <button onClick={() => setImgIdx(p => (p + 1) % images.length)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
                {images.map((img, i) => (
                  <div key={i} onClick={() => setImgIdx(i)} style={{ flexShrink: 0, width: 60, height: 60, borderRadius: 10, overflow: "hidden", border: `2px solid ${i === imgIdx ? "#7c3aed" : "#1f1f1f"}`, cursor: "pointer", transition: "border-color 0.2s" }}>
                    <img src={buildUrl(img)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header */}
            <div>
              <div style={{ fontSize: 11, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
                {detail.sectorLabel} · {detail.category}
              </div>
              <h1 style={{ margin: "0 0 8px", fontSize: "clamp(1.1rem, 2vw, 1.45rem)", fontWeight: 700, lineHeight: 1.35, letterSpacing: "-0.02em" }}>
                {detail.productName}
              </h1>
              <div style={{ fontSize: 13, color: "#888" }}>
                by <span style={{ color: "#f0f0f0", fontWeight: 600 }}>{detail.companyName}</span>
                {" · "}<span>Made in {detail.madeIn}</span>
                {" · "}<span>{detail.packSpec}</span>
              </div>
            </div>

            {/* Price snapshot */}
            <div style={{ ...card, padding: "16px 20px" }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Market Price Range</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#4ade80", marginBottom: 2 }}>Lowest</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#4ade80" }}>{vnd(lowestPrice)}</div>
                </div>
                <div style={{ color: "#333", fontSize: 20 }}>—</div>
                <div>
                  <div style={{ fontSize: 11, color: "#f87171", marginBottom: 2 }}>Highest</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#f87171" }}>{vnd(highestPrice)}</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 2 }}>Active Promos</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24" }}>{promoCount}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ ...card, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Description</div>
              <p style={{ margin: 0, fontSize: 13, color: "#ccc", lineHeight: 1.75 }}>{detail.description}</p>
            </div>

            {/* Usage */}
            <div style={{ ...card, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>How to Use</div>
              <p style={{ margin: 0, fontSize: 13, color: "#ccc", lineHeight: 1.75 }}>{detail.usage}</p>
            </div>

            {detail.ingredients && (
              <div style={{ ...card, padding: "16px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Ingredients</div>
                <p style={{ margin: 0, fontSize: 13, color: "#ccc", lineHeight: 1.75 }}>{detail.ingredients}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Prices ── */}
        <div style={card}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #1f1f1f", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Retail Prices</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{detail.prices.length} retailers · Last updated today</div>
            </div>
            <div style={{ fontSize: 12, color: "#fbbf24" }}>{promoCount} active promotion{promoCount !== 1 ? "s" : ""}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 0 }}>
            {detail.prices
              .sort((a, b) => a.price - b.price)
              .map((p, i) => (
                <div key={p.retailer} style={{
                  padding: "16px 20px",
                  borderBottom: Math.floor(i / 3) < Math.floor((detail.prices.length - 1) / 3) ? "1px solid #1a1a1a" : "none",
                  borderRight: i % 3 !== 2 ? "1px solid #1a1a1a" : "none",
                  position: "relative",
                }}>
                  {/* Promo badge */}
                  {p.inPromo && (
                    <div style={{ position: "absolute", top: 12, right: 14, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
                      {p.promoLabel}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: (logoColors[p.logo] || "#333") + "22", border: `1px solid ${logoColors[p.logo] || "#333"}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: logoColors[p.logo] || "#888", letterSpacing: "0.05em", flexShrink: 0 }}>
                      {p.logo}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{p.retailer}</div>
                    {i === 0 && <span style={{ marginLeft: "auto", fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 8px", borderRadius: 999 }}>Lowest</span>}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: i === 0 ? "#4ade80" : "#f0f0f0" }}>{vnd(p.price)}</span>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span style={{ fontSize: 12, color: "#555", textDecoration: "line-through" }}>{vnd(p.originalPrice)}</span>
                    )}
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>-{priceDrop(p.originalPrice, p.price)}%</span>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: "#555" }}>{p.unit}</div>

                  {p.inPromo && p.promoEnd && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#fbbf24" }}>
                      Ends: {p.promoEnd}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* ── Competitors ── */}
        <div style={card}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #1f1f1f" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Competitors</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Direct competitors in {detail.category}</div>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* This product row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px", gap: 12, alignItems: "center", padding: "12px 16px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#7c3aed", marginBottom: 3 }}>THIS PRODUCT</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{detail.productName}</div>
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>{detail.companyName.split(" ").slice(0, 2).join(" ")}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>{vnd(lowestPrice)}</div>
              <span style={{ fontSize: 11, color: "#4ade80", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "3px 10px", borderRadius: 999, textAlign: "center" }}>Matched</span>
            </div>

            {/* Competitor rows */}
            {detail.competitors.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px", gap: 12, alignItems: "center", padding: "12px 16px", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e0e0e0" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{c.packSpec}</div>
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>{c.brand}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{vnd(c.price)}</div>
                  <div style={{ fontSize: 11, color: c.price < lowestPrice ? "#4ade80" : c.price > lowestPrice ? "#f87171" : "#888", marginTop: 2 }}>
                    {c.price < lowestPrice ? `↓ ${vnd(lowestPrice - c.price)} cheaper` : c.price > lowestPrice ? `↑ ${vnd(c.price - lowestPrice)} pricier` : "Same price"}
                  </div>
                </div>
                {c.marketShare && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{c.marketShare}%</div>
                    <div style={{ fontSize: 10, color: "#555" }}>share</div>
                  </div>
                )}
              </div>
            ))}

            {/* Market share bar */}
            {detail.competitors.some(c => c.marketShare) && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>Estimated market share</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { name: detail.productName.split(" ").slice(0, 3).join(" "), share: 100 - detail.competitors.reduce((a, c) => a + (c.marketShare || 0), 0), color: "#7c3aed" },
                    ...detail.competitors.map(c => ({ name: c.brand, share: c.marketShare || 0, color: c.color })),
                  ].filter(x => x.share > 0).map(x => (
                    <div key={x.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 12, color: "#888", minWidth: 160 }}>{x.name}</div>
                      <div style={{ flex: 1, height: 8, background: "#1f1f1f", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${x.share}%`, background: x.color, borderRadius: 99, transition: "width 0.8s ease" }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: x.color, minWidth: 32 }}>{x.share}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Promotions summary ── */}
        {promoCount > 0 && (
          <div style={{ ...card, borderColor: "rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.03)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(251,191,36,0.1)", fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>
              Active Promotions ({promoCount})
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {detail.prices.filter(p => p.inPromo).map(p => (
                <div key={p.retailer} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: (logoColors[p.logo] || "#333") + "22", border: `1px solid ${logoColors[p.logo] || "#333"}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: logoColors[p.logo] || "#888", flexShrink: 0 }}>
                    {p.logo}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.retailer}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      {p.promoLabel}
                      {p.promoEnd && <span style={{ color: "#fbbf24", marginLeft: 8 }}>· Ends {p.promoEnd}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>{vnd(p.price)}</div>
                    {p.originalPrice && <div style={{ fontSize: 11, color: "#555", textDecoration: "line-through" }}>{vnd(p.originalPrice)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>
        Loading product…
      </div>
    }>
      <ProductPageInner />
    </Suspense>
  );
}
