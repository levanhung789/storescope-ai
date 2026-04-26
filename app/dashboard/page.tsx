"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { loadAnonUser, type AnonUser } from "../_lib/anonymousAuth";

const AnonBadge = dynamic(() => import("../_components/AnonBadge"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  productName: string;
  productFolder: string;
  images: string[];
}

interface Company {
  companyKey: string;
  companyName: string;
  companyFolder: string;
  products: Product[];
}

interface Sector {
  sectorKey: string;
  sectorLabel: string;
  sectorFolder: string;
  companies: Company[];
}

// ── Image viewer ──────────────────────────────────────────────────────────────

function ImageViewer({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
        </svg>
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
}

function ProductCard({ product, sectorFolder, companyFolder, sectorLabel }: {
  product: Product;
  sectorFolder: string;
  companyFolder: string;
  sectorLabel: string;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => setImgIdx(0), [product]);

  const buildUrl = (img: string) =>
    encodeURI(`/companies/${sectorFolder}/${companyFolder}/${product.productFolder}/${img}`);

  const detailUrl = `/dashboard/product?sector=${encodeURIComponent(sectorFolder)}&company=${encodeURIComponent(companyFolder)}&product=${encodeURIComponent(product.productFolder)}&sLabel=${encodeURIComponent(sectorLabel)}&images=${product.images.map(encodeURIComponent).join(",")}`;

  const total = product.images.length;

  return (
    <div style={{
      background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 14,
      overflow: "hidden", transition: "border-color 0.2s, transform 0.15s", cursor: "pointer",
    }}
      onClick={() => window.location.href = detailUrl}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 160, background: "#050505", overflow: "hidden" }}>
        <ImageViewer src={buildUrl(product.images[imgIdx])} alt={product.productName} />

        {/* Badge */}
        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", color: "#888", fontSize: 10, padding: "2px 8px", borderRadius: 999 }}>
          {total} photo{total > 1 ? "s" : ""}
        </div>

        {/* Arrows */}
        {total > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); setImgIdx(p => (p - 1 + total) % total); }}
              style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ‹
            </button>
            <button onClick={e => { e.stopPropagation(); setImgIdx(p => (p + 1) % total); }}
              style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ›
            </button>
            {/* Dots */}
            <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3 }}>
              {product.images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                  style={{ width: 5, height: 5, borderRadius: "50%", border: "none", cursor: "pointer", background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.3)", padding: 0 }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#e0e0e0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 34 }}>
          {product.productName}
        </div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", padding: "2px 8px", borderRadius: 999, color: "#7c6aaa" }}>
            Matched
          </span>
          <span style={{ fontSize: 11, color: "#a78bfa" }}>View →</span>
        </div>
      </div>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Dashboard",   href: "/dashboard",          active: true  },
  { label: "AI Analysis", href: "/dashboard/analysis", active: false },
  { label: "My Reports",  href: "/dashboard/reports",  active: false },
  { label: "Store Layout",href: "/layout-editor",      active: false },
  { label: "Forum",       href: "/forum",              active: false },
  { label: "Settings",    href: "#",                   active: false },
];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [anonUser, setAnonUser] = useState<AnonUser | null>(null);

  const [selectedSectorKey,  setSelectedSectorKey]  = useState("");
  const [selectedCompanyKey, setSelectedCompanyKey] = useState("");
  const [search, setSearch] = useState("");

  // Load anonymous session if present
  useEffect(() => { setAnonUser(loadAnonUser()); }, []);

  useEffect(() => {
    fetch("/api/companies")
      .then(r => r.json())
      .then((data: Sector[]) => {
        setSectors(data);
        if (data.length > 0) {
          setSelectedSectorKey(data[0].sectorKey);
          setSelectedCompanyKey(data[0].companies[0]?.companyKey ?? "");
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load catalog."); setLoading(false); });
  }, []);

  const currentSector  = useMemo(() => sectors.find(s => s.sectorKey === selectedSectorKey) ?? sectors[0], [sectors, selectedSectorKey]);
  const currentCompany = useMemo(() => currentSector?.companies.find(c => c.companyKey === selectedCompanyKey) ?? currentSector?.companies[0], [currentSector, selectedCompanyKey]);

  // When sector changes, auto-select first company
  useEffect(() => {
    if (currentSector?.companies.length) {
      setSelectedCompanyKey(currentSector.companies[0].companyKey);
    }
  }, [selectedSectorKey]);

  const filteredProducts = useMemo(() => {
    if (!currentCompany) return [];
    if (!search.trim()) return currentCompany.products;
    const q = search.toLowerCase();
    return currentCompany.products.filter(p => p.productName.toLowerCase().includes(q));
  }, [currentCompany, search]);

  // Stats
  const totalProducts = useMemo(() => sectors.reduce((a, s) => a + s.companies.reduce((b, c) => b + c.products.length, 0), 0), [sectors]);
  const totalCompanies = useMemo(() => sectors.reduce((a, s) => a + s.companies.length, 0), [sectors]);
  const totalImages = useMemo(() => sectors.reduce((a, s) => a + s.companies.reduce((b, c) => b + c.products.reduce((d, p) => d + p.images.length, 0), 0), 0), [sectors]);

  const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 16 };
  const selectStyle: React.CSSProperties = { width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "10px 14px", color: "#f0f0f0", fontSize: 13, outline: "none", cursor: "pointer" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#080808", color: "#f0f0f0", fontFamily: "inherit" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, flexShrink: 0, background: "#0a0a0a", borderRight: "1px solid #1f1f1f", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid #1f1f1f" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.04em" }}>storescope</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", letterSpacing: "-0.04em" }}>.ai</span>
          </a>
          <div style={{ fontSize: 10, color: "#444", marginTop: 3, letterSpacing: "0.08em" }}>Retail Intelligence</div>
        </div>

        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(item => (
            <Link key={item.label} href={item.href} style={{
              display: "block", padding: "9px 12px", borderRadius: 10, textDecoration: "none",
              fontSize: 13, fontWeight: item.active ? 600 : 400,
              background: item.active ? "rgba(124,58,237,0.12)" : "transparent",
              color: item.active ? "#a78bfa" : "#666",
              border: item.active ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent",
            }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sector quick-select */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid #1f1f1f" }}>
          <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, padding: "0 4px" }}>Sectors</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {sectors.map(s => (
              <button key={s.sectorKey} onClick={() => setSelectedSectorKey(s.sectorKey)}
                style={{
                  textAlign: "left", padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11,
                  background: selectedSectorKey === s.sectorKey ? "rgba(124,58,237,0.1)" : "transparent",
                  color: selectedSectorKey === s.sectorKey ? "#a78bfa" : "#555",
                  transition: "all 0.15s",
                }}>
                {s.sectorLabel}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 10px", borderTop: "1px solid #1f1f1f" }}>
          <Link href="/" style={{ display: "block", padding: "8px 12px", fontSize: 12, color: "#555", textDecoration: "none" }}>Log out</Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid #1f1f1f", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3 }}>Admin Dashboard</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Product Catalog</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: "8px 12px 8px 32px", color: "#f0f0f0", fontSize: 13, outline: "none", width: 240 }}
                onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")} />
            </div>
            <Link href="/dashboard/analysis" style={{ background: "#7c3aed", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
              AI Analysis
            </Link>
            {anonUser && (
              <AnonBadge user={anonUser} onSignOut={() => setAnonUser(null)} />
            )}
          </div>
        </header>

        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Stats */}
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Sectors",   value: sectors.length },
                { label: "Companies", value: totalCompanies },
                { label: "Products",  value: totalProducts },
                { label: "Images",    value: totalImages },
              ].map(s => (
                <div key={s.label} style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#a78bfa" }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Selectors + Products */}
          {loading ? (
            <div style={{ ...card, padding: 48, textAlign: "center", color: "#555" }}>
              <div style={{ marginBottom: 12, fontSize: 13 }}>Loading catalog from file system…</div>
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", animation: `pulse 1s ease ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
            </div>
          ) : error ? (
            <div style={{ ...card, padding: 32, textAlign: "center", color: "#f87171" }}>{error}</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>

              {/* Left — selectors */}
              <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Filter</div>

                  <label style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7, display: "block" }}>Sector</label>
                  <select value={selectedSectorKey} onChange={e => setSelectedSectorKey(e.target.value)} style={selectStyle}>
                    {sectors.map(s => <option key={s.sectorKey} value={s.sectorKey}>{s.sectorLabel}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7, display: "block" }}>Company</label>
                  <select value={selectedCompanyKey} onChange={e => setSelectedCompanyKey(e.target.value)} style={selectStyle}>
                    {currentSector?.companies.map(c => (
                      <option key={c.companyKey} value={c.companyKey}>{c.companyName}</option>
                    ))}
                  </select>
                </div>

                {/* Stats for selection */}
                <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>Products</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{currentCompany?.products.length ?? 0}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>Images</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                      {currentCompany?.products.reduce((a, p) => a + p.images.length, 0) ?? 0}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#555" }}>Companies in sector</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{currentSector?.companies.length ?? 0}</span>
                  </div>
                </div>

                {/* AI note */}
                <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 5 }}>AI Suggested Display</div>
                  <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>
                    Images loaded from local folder structure. Upload a shelf photo to run AI matching.
                  </div>
                  <Link href="/dashboard/analysis" style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: "#7c3aed", textDecoration: "none" }}>
                    Run Analysis →
                  </Link>
                </div>
              </div>

              {/* Right — product grid */}
              <div style={{ ...card, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{currentCompany?.companyName}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                      {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                      {search ? ` matching "${search}"` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#555" }}>{currentSector?.sectorLabel}</div>
                </div>

                {filteredProducts.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12 }}>
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product.productFolder}
                        product={product}
                        sectorFolder={currentSector!.sectorFolder}
                        companyFolder={currentCompany!.companyFolder}
                        sectorLabel={currentSector!.sectorLabel}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "#555", fontSize: 13 }}>
                    {search ? `No products match "${search}"` : "No products with images for this company."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Company list */}
          {!loading && currentSector && (
            <div style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Companies in {currentSector.sectorLabel}</div>
                <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>{currentSector.companies.length} companies</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                {currentSector.companies.map((c, i) => (
                  <button key={c.companyKey} onClick={() => setSelectedCompanyKey(c.companyKey)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 10, border: "1px solid",
                      borderColor: selectedCompanyKey === c.companyKey ? "rgba(124,58,237,0.3)" : "#1f1f1f",
                      background: selectedCompanyKey === c.companyKey ? "rgba(124,58,237,0.08)" : "#0a0a0a",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "#555", minWidth: 18 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: selectedCompanyKey === c.companyKey ? "#a78bfa" : "#e0e0e0", fontWeight: 500 }}>
                        {c.companyName}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#555" }}>{c.products.length} SKUs</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
