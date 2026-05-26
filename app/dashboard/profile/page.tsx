"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  Pencil, MoreHorizontal, BarChart2, LayoutGrid, FileText,
  Upload, Search, Grid3x3, List, Star, Tag, Trash2,
  MoveRight, ShoppingBag, RefreshCw, Plus, TrendingUp,
  ChevronDown, ChevronUp, Filter, X, Check,
} from "lucide-react";
import {
  loadItems, loadFolders, createFolder, deleteFolder, renameFolder,
  moveItem, deleteItem, updateItem, addItem,
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
        const r = px[i], g = px[i+1], b = px[i+2];
        if (r > threshold && g > threshold && b > threshold) { px[i+3] = 0; }
        else if (r > edge && g > edge && b > edge) {
          const br = (r+g+b)/3;
          px[i+3] = Math.round(255*(1-(br-edge)/(threshold-edge)));
        }
      }
      ctx.putImageData(d, 0, 0);
    };
    img.src = src;
  }, [src, threshold]);
  return <canvas ref={ref} style={{ width: size, height: size, display: "inline-block", objectFit: "contain", verticalAlign: "middle" }} />;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000)    return "just now";
  if (d < 3_600_000) return `${Math.floor(d/60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d/3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
}
function shortAddr(a: string) { return a.slice(0,6)+"..."+a.slice(-4); }

type ProfileTab = "items" | "analysis" | "layouts" | "listings" | "favorites" | "activity";
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
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }} onClick={onClose}>
      <div style={{ background:"#111",border:"1px solid #2a2a2a",borderRadius:20,padding:32,width:"100%",maxWidth:440 }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ margin:"0 0 20px",fontSize:17,fontWeight:700 }}>{existing?"Update Listing":"List for Sale"}</h3>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"
            style={{ padding:"10px 14px",background:"#0a0a0a",border:"1px solid #2a2a2a",borderRadius:10,color:"#f0f0f0",fontSize:14,outline:"none" }} />
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Description..."
            style={{ padding:"10px 14px",background:"#0a0a0a",border:"1px solid #2a2a2a",borderRadius:10,color:"#f0f0f0",fontSize:13,outline:"none",resize:"vertical",fontFamily:"inherit" }} />
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <input type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(Number(e.target.value))}
              style={{ flex:1,padding:"10px 14px",background:"#0a0a0a",border:"1px solid #2a2a2a",borderRadius:10,color:"#a78bfa",fontSize:18,fontWeight:700,outline:"none" }} />
            <span style={{ color:"#555" }}>USDC</span>
          </div>
          <div style={{ display:"flex",gap:6 }}>
            {[0.1,0.5,1,2,5].map(p=>(
              <button key={p} onClick={()=>setPrice(p)}
                style={{ padding:"4px 10px",fontSize:11,borderRadius:999,border:`1px solid ${price===p?"#7c3aed":"#2a2a2a"}`,background:price===p?"rgba(124,58,237,0.15)":"#0a0a0a",color:price===p?"#a78bfa":"#555",cursor:"pointer" }}>
                ${p}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          {existing
            ? <button onClick={onRemove} style={{ flex:1,padding:"10px 0",background:"transparent",border:"1px solid rgba(239,68,68,0.3)",color:"#ef4444",borderRadius:12,cursor:"pointer",fontSize:13 }}>Remove</button>
            : <button onClick={onClose}  style={{ flex:1,padding:"10px 0",background:"transparent",border:"1px solid #2a2a2a",color:"#666",borderRadius:12,cursor:"pointer",fontSize:13 }}>Cancel</button>
          }
          <button onClick={()=>title.trim()&&price>0&&onSave(title.trim(),desc.trim(),price)}
            style={{ flex:2,padding:"10px 0",background:"#7c3aed",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:600 }}>
            {existing?"Update →":"List on Marketplace →"}
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
      style={{ background:"#111",border:`1.5px solid ${selected?"#7c3aed":"#1f1f1f"}`,borderRadius:16,overflow:"hidden",cursor:"pointer",transition:"all 0.15s",position:"relative" }}
      onMouseEnter={e=>{ if(!selected) e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e=>{ if(!selected) e.currentTarget.style.borderColor="#1f1f1f"; e.currentTarget.style.transform="translateY(0)"; }}>

      {/* Checkbox */}
      <div onClick={e=>{e.stopPropagation();onSelect();}}
        style={{ position:"absolute",top:8,left:8,zIndex:2,width:20,height:20,borderRadius:6,border:`2px solid ${selected?"#7c3aed":"rgba(255,255,255,0.2)"}`,background:selected?"#7c3aed":"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
        {selected && <Check size={11} color="#fff" />}
      </div>

      {/* Badges */}
      <div style={{ position:"absolute",top:8,right:8,display:"flex",gap:4,zIndex:2 }}>
        {item.starred && <div style={{ width:20,height:20,borderRadius:6,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center" }}><Star size={10} color="#fbbf24" fill="#fbbf24"/></div>}
        {listing && <div style={{ width:20,height:20,borderRadius:6,background:"rgba(124,58,237,0.8)",display:"flex",alignItems:"center",justifyContent:"center" }}><Tag size={10} color="#fff"/></div>}
      </div>

      {/* Preview */}
      <div style={{ height:140,background:"#0a0a0a",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:"1px solid #1a1a1a" }}>
        {item.type==="layout"
          ? <NoBgImage src="/store-layout-icon.png" size={80} />
          : <span style={{ fontSize:52 }}>{item.type==="analysis"?"📊":item.type==="note"?"📝":"🖼️"}</span>}
      </div>

      {/* Info */}
      <div style={{ padding:"12px 14px" }}>
        <div style={{ fontSize:13,fontWeight:600,color:"#f0f0f0",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</div>
        <div style={{ fontSize:11,color:"#444" }}>{timeAgo(item.updatedAt)}</div>
        {item.type==="analysis" && item.topBrand && (
          <div style={{ marginTop:6,display:"flex",gap:4,flexWrap:"wrap" }}>
            <span style={{ fontSize:10,padding:"2px 7px",borderRadius:999,background:"rgba(124,58,237,0.1)",color:"#a78bfa" }}>{item.topBrand}</span>
            {item.skuCount!==undefined && <span style={{ fontSize:10,padding:"2px 7px",borderRadius:999,background:"#1a1a1a",color:"#555" }}>{item.skuCount} SKUs</span>}
          </div>
        )}
        {listing && <div style={{ marginTop:6,fontSize:12,fontWeight:700,color:"#a78bfa" }}>${listing.price} USDC</div>}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [circleSession, setCircle] = useState<{ walletId:string; walletAddress:string; userId?:string }|null>(null);
  const walletId = circleSession?.walletAddress ?? address ?? "";
  const connected = isConnected || !!circleSession;

  const [items,    setItems]    = useState<VaultItem[]>([]);
  const [folders,  setFolders]  = useState<VaultFolder[]>([]);
  const [listings, setListings] = useState<ForumListing[]>([]);

  const [tab,          setTab]          = useState<ProfileTab>("items");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter,   setTypeFilter]   = useState<string>("all");
  const [search,       setSearch]       = useState("");
  const [viewMode,     setViewMode]     = useState<"grid"|"list">("grid");
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [saleItem,     setSaleItem]     = useState<VaultItem|null>(null);
  const [toast,        setToast]        = useState<string|null>(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [statusOpen,   setStatusOpen]   = useState(true);
  const [typeOpen,     setTypeOpen]     = useState(true);

  const showToast = (m: string) => { setToast(m); setTimeout(()=>setToast(null),3000); };

  const reload = useCallback(()=>{
    if (!walletId) return;
    setItems(loadItems(walletId));
    setFolders(loadFolders(walletId));
    setListings(loadListings());
  },[walletId]);

  useEffect(()=>{ setCircle(loadCircleSession()); },[]);
  useEffect(()=>{ reload(); },[reload]);

  const handleImport = () => {
    if (!walletId) return;
    const n = importAnalysisReports(walletId);
    reload();
    showToast(n>0?`✅ Imported ${n} report${n>1?"s":""}`:"No new reports");
  };

  // ── Filtered items ───────────────────────────────────────────────────────
  const filtered = items.filter(i=>{
    if (tab==="analysis"  && i.type!=="analysis") return false;
    if (tab==="layouts"   && i.type!=="layout")   return false;
    if (tab==="listings"  && !i.forSale)           return false;
    if (tab==="favorites" && !i.starred)           return false;
    if (statusFilter==="listed"    && !i.forSale)  return false;
    if (statusFilter==="not-listed"&&  i.forSale)  return false;
    if (statusFilter==="starred"   && !i.starred)  return false;
    if (typeFilter!=="all" && i.type!==typeFilter)  return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>b.updatedAt-a.updatedAt);

  // ── Stats ────────────────────────────────────────────────────────────────
  const analyses   = items.filter(i=>i.type==="analysis");
  const layouts    = items.filter(i=>i.type==="layout");
  const forSaleN   = items.filter(i=>i.forSale).length;
  const usdcSpent  = analyses.reduce((s,i)=>s+(i.totalPaid??0),0);
  const joinDate   = items.length>0 ? new Date(Math.min(...items.map(i=>i.createdAt))).toLocaleDateString("en-US",{month:"short",year:"numeric"}).toUpperCase() : "—";

  const displayName = circleSession?.userId
    ? circleSession.userId.split("@")[0]
    : address ? shortAddr(address) : "Anonymous";

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev=>{
      const s=new Set(prev);
      s.has(id)?s.delete(id):s.add(id);
      return s;
    });
  };

  const handleListForSale = (title:string,desc:string,price:number) => {
    if (!saleItem) return;
    if (saleItem.listingId) removeListing(saleItem.listingId);
    const lst = createListing(walletId, saleItem, title, desc, price, circleSession?.userId);
    updateItem(walletId, saleItem.id, { forSale:true, price, listingId:lst.id, folderId:"f-forsale" });
    setSaleItem(null); reload(); showToast("🏷️ Listed!");
  };

  const handleRemoveListing = () => {
    if (!saleItem?.listingId) return;
    removeListing(saleItem.listingId);
    updateItem(walletId, saleItem.id, { forSale:false, price:undefined, listingId:undefined });
    setSaleItem(null); reload(); showToast("Listing removed");
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id=>deleteItem(walletId,id));
    setSelectedIds(new Set());
    reload(); showToast(`Deleted ${selectedIds.size} item${selectedIds.size>1?"s":""}`);
  };

  const handleStarSelected = () => {
    selectedIds.forEach(id=>{
      const it = items.find(i=>i.id===id);
      if (it) updateItem(walletId,id,{starred:!it.starred});
    });
    setSelectedIds(new Set()); reload();
  };

  // ── Avatar initials ───────────────────────────────────────────────────────
  const avatarChar = circleSession?.userId
    ? circleSession.userId[0].toUpperCase()
    : address ? address[2].toUpperCase() : "?";

  const TABS: { key: ProfileTab; label: string; count?: number }[] = [
    { key:"items",     label:"Items",     count:items.length },
    { key:"analysis",  label:"Analysis",  count:analyses.length },
    { key:"layouts",   label:"Layouts",   count:layouts.length },
    { key:"listings",  label:"Listings",  count:forSaleN },
    { key:"favorites", label:"Favorites", count:items.filter(i=>i.starred).length },
    { key:"activity",  label:"Activity" },
  ];

  if (!connected) {
    return (
      <div style={{ minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20 }}>
        <div style={{ width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32 }}>🔐</div>
        <h2 style={{ margin:0,fontSize:22,color:"#f0f0f0",fontWeight:700 }}>Connect your wallet</h2>
        <p style={{ margin:0,color:"#555",fontSize:14 }}>Your profile is linked to your wallet.</p>
        <div style={{ display:"flex",gap:10 }}>
          <CircleWalletButton onDisconnect={()=>setCircle(null)}/>
          <WalletButton/>
        </div>
        <Link href="/dashboard" style={{ color:"#7c3aed",fontSize:13,textDecoration:"none" }}>← Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh",background:"#080808",color:"#f0f0f0",fontFamily:"inherit" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,padding:"10px 20px",background:"#111",border:"1px solid #2a2a2a",borderRadius:12,fontSize:13,color:"#f0f0f0",boxShadow:"0 8px 32px rgba(0,0,0,0.6)",whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}

      {/* ── Banner ──────────────────────────────────────────────────── */}
      <div style={{ height:200,background:"linear-gradient(135deg,#0f0520 0%,#2d1b69 30%,#4c1d95 55%,#6d28d9 75%,#1a0533 100%)",position:"relative",overflow:"hidden" }}>
        {/* Animated glow orbs */}
        <div style={{ position:"absolute",top:"-30%",left:"20%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.25) 0%,transparent 70%)",filter:"blur(40px)" }}/>
        <div style={{ position:"absolute",top:"10%",right:"15%",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,0.2) 0%,transparent 70%)",filter:"blur(30px)" }}/>

        {/* Top nav */}
        <div style={{ position:"absolute",top:0,left:0,right:0,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <a href="/" style={{ fontSize:16,fontWeight:800,color:"#f0f0f0",textDecoration:"none",letterSpacing:"-0.03em" }}>
            storescope<span style={{ color:"#a78bfa" }}>.ai</span>
          </a>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <CircleWalletButton onDisconnect={()=>setCircle(null)}/>
            <WalletButton/>
          </div>
        </div>
      </div>

      {/* ── Profile header ───────────────────────────────────────────── */}
      <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 24px" }}>

        {/* Avatar row */}
        <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginTop:-40,marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"flex-end",gap:16 }}>
            {/* Avatar */}
            <div style={{ width:100,height:100,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#ec4899)",border:"4px solid #080808",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,fontWeight:700,color:"#fff",flexShrink:0,boxShadow:"0 8px 32px rgba(124,58,237,0.4)" }}>
              {avatarChar}
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display:"flex",gap:8,paddingBottom:8 }}>
            <Link href="/dashboard" style={{ display:"flex",alignItems:"center",gap:5,padding:"8px 16px",background:"transparent",border:"1px solid #2a2a2a",color:"#888",borderRadius:10,fontSize:12,textDecoration:"none" }}>
              ← Dashboard
            </Link>
            <button onClick={handleImport} style={{ display:"flex",alignItems:"center",gap:5,padding:"8px 14px",background:"#111",border:"1px solid #2a2a2a",color:"#888",borderRadius:10,fontSize:12,cursor:"pointer" }}>
              <RefreshCw size={11}/> Sync
            </button>
            <Link href="/dashboard/analysis" style={{ display:"flex",alignItems:"center",gap:5,padding:"8px 14px",background:"#7c3aed",border:"none",color:"#fff",borderRadius:10,fontSize:12,fontWeight:600,textDecoration:"none" }}>
              <Plus size={11}/> New Analysis
            </Link>
          </div>
        </div>

        {/* Name + meta */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
            <h1 style={{ margin:0,fontSize:26,fontWeight:800,letterSpacing:"-0.03em",color:"#f0f0f0" }}>{displayName}</h1>
            <button style={{ background:"none",border:"none",color:"#555",cursor:"pointer",padding:2 }}>
              <Pencil size={14}/>
            </button>
            <button style={{ background:"none",border:"none",color:"#555",cursor:"pointer",padding:2 }}>
              <MoreHorizontal size={16}/>
            </button>
          </div>

          <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
            {items.length>0 && (
              <span style={{ fontSize:11,padding:"3px 10px",borderRadius:999,background:"#1a1a1a",border:"1px solid #2a2a2a",color:"#666",letterSpacing:"0.05em" }}>
                JOINED {joinDate}
              </span>
            )}
            <span style={{ fontSize:11,padding:"3px 10px",borderRadius:999,background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.25)",color:"#a78bfa" }}>
              {isConnected&&address ? "METAMASK" : circleSession ? "CIRCLE WALLET" : "WALLET"}
            </span>
            {walletId && (
              <span style={{ fontSize:11,padding:"3px 10px",borderRadius:999,background:"#1a1a1a",border:"1px solid #2a2a2a",color:"#555",fontFamily:"monospace" }}>
                {shortAddr(walletId)}
              </span>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display:"flex",gap:0,marginBottom:24,background:"#0d0d0d",border:"1px solid #1f1f1f",borderRadius:14,overflow:"hidden" }}>
          {[
            { label:"USDC SPENT", value:`$${usdcSpent.toFixed(2)}`, color:"#4ade80" },
            { label:"ANALYSES",   value:String(analyses.length),     color:"#a78bfa" },
            { label:"LAYOUTS",    value:String(layouts.length),      color:"#6ee7b7" },
            { label:"FOR SALE",   value:String(forSaleN),            color:"#f59e0b" },
          ].map((s,i,arr)=>(
            <div key={s.label} style={{ flex:1,padding:"16px 20px",borderRight:i<arr.length-1?"1px solid #1f1f1f":"none",textAlign:"center" }}>
              <div style={{ fontSize:11,color:"#444",letterSpacing:"0.1em",marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:22,fontWeight:800,color:s.color,letterSpacing:"-0.02em" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div style={{ borderBottom:"1px solid #1f1f1f",marginBottom:0,display:"flex",gap:0,overflowX:"auto" }}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>{setTab(t.key);setSelectedIds(new Set());}}
              style={{ padding:"12px 20px",background:"none",border:"none",borderBottom:`2px solid ${tab===t.key?"#7c3aed":"transparent"}`,color:tab===t.key?"#f0f0f0":"#555",fontSize:14,fontWeight:tab===t.key?600:400,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",display:"flex",alignItems:"center",gap:6 }}>
              {t.label}
              {t.count!==undefined && t.count>0 && (
                <span style={{ fontSize:10,padding:"1px 6px",borderRadius:999,background:tab===t.key?"rgba(124,58,237,0.2)":"#1a1a1a",color:tab===t.key?"#a78bfa":"#444" }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content area ────────────────────────────────────────────── */}
        <div style={{ display:"flex",gap:0,minHeight:600 }}>

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          {sidebarOpen && tab!=="activity" && (
            <aside style={{ width:240,flexShrink:0,borderRight:"1px solid #1f1f1f",paddingTop:20,paddingRight:20 }}>

              {/* Status filter */}
              <div style={{ marginBottom:20 }}>
                <button onClick={()=>setStatusOpen(v=>!v)}
                  style={{ display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"none",border:"none",color:"#f0f0f0",fontSize:13,fontWeight:600,cursor:"pointer",padding:"0 0 10px" }}>
                  Status {statusOpen?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
                </button>
                {statusOpen && (
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {(["all","listed","not-listed","starred"] as StatusFilter[]).map(s=>(
                      <button key={s} onClick={()=>setStatusFilter(s)}
                        style={{ padding:"5px 12px",borderRadius:999,border:`1px solid ${statusFilter===s?"#7c3aed":"#2a2a2a"}`,background:statusFilter===s?"rgba(124,58,237,0.12)":"transparent",color:statusFilter===s?"#a78bfa":"#666",fontSize:12,cursor:"pointer",fontWeight:statusFilter===s?600:400 }}>
                        {s==="all"?"All":s==="listed"?"Listed":s==="not-listed"?"Not Listed":"⭐ Starred"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Type filter */}
              <div style={{ marginBottom:20 }}>
                <button onClick={()=>setTypeOpen(v=>!v)}
                  style={{ display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"none",border:"none",color:"#f0f0f0",fontSize:13,fontWeight:600,cursor:"pointer",padding:"0 0 10px" }}>
                  Type {typeOpen?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
                </button>
                {typeOpen && (
                  <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                    {[
                      { key:"all",       label:"All Types",     icon:"✦" },
                      { key:"analysis",  label:"Analysis",      icon:"📊" },
                      { key:"layout",    label:"Store Layout",  icon:"🏪" },
                      { key:"note",      label:"Notes",         icon:"📝" },
                    ].map(t=>(
                      <button key={t.key} onClick={()=>setTypeFilter(t.key)}
                        style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:`1px solid ${typeFilter===t.key?"rgba(124,58,237,0.3)":"transparent"}`,background:typeFilter===t.key?"rgba(124,58,237,0.08)":"transparent",color:typeFilter===t.key?"#a78bfa":"#666",fontSize:13,cursor:"pointer",textAlign:"left" }}>
                        <span style={{ fontSize:14 }}>{t.key==="layout"?<NoBgImage src="/store-layout-icon.png" size={16}/>:t.icon}</span>
                        <span style={{ flex:1 }}>{t.label}</span>
                        <span style={{ fontSize:11,color:"#444" }}>
                          {t.key==="all"?items.length:items.filter(i=>i.type===t.key).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Wallets */}
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:"#f0f0f0",marginBottom:10 }}>Wallets</div>
                <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                  <button style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:"1px solid rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.08)",color:"#a78bfa",fontSize:12,cursor:"pointer",textAlign:"left" }}>
                    <span style={{ width:8,height:8,borderRadius:"50%",background:"#4ade80",flexShrink:0 }}/>
                    <span style={{ flex:1,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {walletId?shortAddr(walletId):"—"}
                    </span>
                    <span style={{ fontSize:10,background:"rgba(124,58,237,0.2)",padding:"1px 5px",borderRadius:999,color:"#a78bfa" }}>Active</span>
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* ── Main content ─────────────────────────────────────────── */}
          <div style={{ flex:1,minWidth:0,paddingTop:20,paddingLeft:sidebarOpen&&tab!=="activity"?20:0 }}>

            {/* Toolbar */}
            {tab!=="activity" && (
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
                <button onClick={()=>setSidebarOpen(v=>!v)}
                  style={{ padding:"8px 10px",background:"#111",border:"1px solid #1f1f1f",borderRadius:8,color:"#555",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12 }}>
                  <Filter size={12}/> {sidebarOpen?"Hide":"Filter"}
                </button>

                {/* Search */}
                <div style={{ flex:1,maxWidth:360,position:"relative" }}>
                  <Search size={13} style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#444" }}/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items..."
                    style={{ width:"100%",padding:"8px 12px 8px 30px",background:"#111",border:"1px solid #1f1f1f",borderRadius:8,color:"#f0f0f0",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                  {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#555",cursor:"pointer",padding:0 }}><X size={12}/></button>}
                </div>

                <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ fontSize:12,color:"#444" }}>{filtered.length} items</span>
                  <button onClick={()=>setViewMode(v=>v==="grid"?"list":"grid")}
                    style={{ padding:"7px 10px",background:"#111",border:"1px solid #1f1f1f",borderRadius:8,color:viewMode==="grid"?"#a78bfa":"#555",cursor:"pointer" }}>
                    {viewMode==="grid"?<Grid3x3 size={14}/>:<List size={14}/>}
                  </button>
                </div>
              </div>
            )}

            {/* Activity tab */}
            {tab==="activity" && (
              <div style={{ padding:"20px 0" }}>
                <h3 style={{ margin:"0 0 20px",fontSize:16,fontWeight:600,color:"#f0f0f0" }}>Recent Activity</h3>
                {items.slice(0,10).map(item=>(
                  <div key={item.id} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #1a1a1a" }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:"#111",border:"1px solid #1f1f1f",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {item.type==="layout"?<NoBgImage src="/store-layout-icon.png" size={22}/>:<span style={{ fontSize:18 }}>{item.type==="analysis"?"📊":item.type==="note"?"📝":"🖼️"}</span>}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:"#f0f0f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</div>
                      <div style={{ fontSize:11,color:"#444" }}>{item.forSale?"Listed for $"+item.price+" USDC":item.starred?"Starred":item.type+" added"}</div>
                    </div>
                    <div style={{ fontSize:11,color:"#444",whiteSpace:"nowrap" }}>{timeAgo(item.updatedAt)}</div>
                  </div>
                ))}
                {items.length===0 && <p style={{ color:"#444",fontSize:13 }}>No activity yet.</p>}
              </div>
            )}

            {/* Items grid */}
            {tab!=="activity" && (
              filtered.length===0 ? (
                <div style={{ textAlign:"center",padding:"80px 0",borderTop:"1px solid #1f1f1f" }}>
                  <div style={{ fontSize:64,marginBottom:16,opacity:0.3 }}>
                    {tab==="analysis"?"📊":tab==="layouts"?"🏪":tab==="listings"?"🏷️":tab==="favorites"?"⭐":"📦"}
                  </div>
                  <p style={{ color:"#333",fontSize:15,margin:"0 0 20px",fontWeight:600 }}>No items found</p>
                  {tab==="items"&&(
                    <button onClick={handleImport} style={{ padding:"10px 24px",background:"#7c3aed",border:"none",borderRadius:999,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer" }}>
                      Import Analysis History
                    </button>
                  )}
                </div>
              ) : viewMode==="grid" ? (
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14 }}>
                  {filtered.map(item=>(
                    <ItemCard
                      key={item.id}
                      item={item}
                      listing={listings.find(l=>l.itemId===item.id&&!l.sold)}
                      selected={selectedIds.has(item.id)}
                      onSelect={()=>toggleSelect(item.id)}
                      onClick={()=>setSaleItem(item)}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
                  <div style={{ display:"grid",gridTemplateColumns:"24px 1fr 100px 80px 80px 100px",gap:12,padding:"8px 14px",fontSize:11,color:"#333",textTransform:"uppercase",letterSpacing:"0.06em",borderTop:"1px solid #1f1f1f",borderBottom:"1px solid #1f1f1f" }}>
                    <div/><div>Name</div><div>Type</div><div>Status</div><div style={{textAlign:"right"}}>Price</div><div style={{textAlign:"right"}}>Updated</div>
                  </div>
                  {filtered.map(item=>{
                    const lst = listings.find(l=>l.itemId===item.id&&!l.sold);
                    return (
                      <div key={item.id} onClick={()=>setSaleItem(item)}
                        style={{ display:"grid",gridTemplateColumns:"24px 1fr 100px 80px 80px 100px",gap:12,padding:"12px 14px",borderBottom:"1px solid #0f0f0f",cursor:"pointer",alignItems:"center",transition:"background 0.1s" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="#0d0d0d")}
                        onMouseLeave={e=>(e.currentTarget.style.background="")}>
                        <input type="checkbox" checked={selectedIds.has(item.id)} onChange={()=>toggleSelect(item.id)} onClick={e=>e.stopPropagation()} style={{ cursor:"pointer" }}/>
                        <div>
                          <div style={{ fontSize:13,fontWeight:600,color:"#f0f0f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</div>
                          {item.topBrand&&<div style={{ fontSize:11,color:"#555" }}>{item.topBrand}</div>}
                        </div>
                        <div><span style={{ fontSize:10,padding:"2px 8px",borderRadius:999,background:"#1a1a1a",color:"#666" }}>{item.type}</span></div>
                        <div style={{ fontSize:11,color:lst?"#a78bfa":item.starred?"#fbbf24":"#333" }}>{lst?"For Sale":item.starred?"Starred":"—"}</div>
                        <div style={{ textAlign:"right",fontSize:12,color:lst?"#a78bfa":"#333",fontWeight:lst?700:400 }}>{lst?`$${item.price}`:"-"}</div>
                        <div style={{ textAlign:"right",fontSize:11,color:"#444" }}>{timeAgo(item.updatedAt)}</div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────── */}
      {selectedIds.size>0 && (
        <div style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(10,10,10,0.95)",backdropFilter:"blur(12px)",borderTop:"1px solid #1f1f1f",padding:"12px 24px",display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontSize:13,color:"#888" }}>{selectedIds.size} selected</span>
          <button onClick={()=>{
            const item=items.find(i=>selectedIds.has(i.id));
            if(item){setSaleItem(item);}
          }} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"#7c3aed",border:"none",color:"#fff",borderRadius:999,fontSize:13,fontWeight:600,cursor:"pointer" }}>
            <ShoppingBag size={13}/> List items
          </button>
          <button onClick={handleStarSelected}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"transparent",border:"1px solid #2a2a2a",color:"#888",borderRadius:999,fontSize:13,cursor:"pointer" }}>
            <Star size={13}/> Star
          </button>
          <button onClick={handleDeleteSelected}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"transparent",border:"1px solid rgba(239,68,68,0.25)",color:"#ef4444",borderRadius:999,fontSize:13,cursor:"pointer" }}>
            <Trash2 size={13}/> Delete
          </button>
          <button onClick={()=>setSelectedIds(new Set())} style={{ marginLeft:"auto",background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:12 }}>
            <X size={14}/>
          </button>
        </div>
      )}

      {/* Sale modal */}
      {saleItem && (
        <SaleModal
          item={saleItem} walletId={walletId} listings={listings}
          onSave={handleListForSale} onRemove={handleRemoveListing}
          onClose={()=>setSaleItem(null)}
        />
      )}

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
      `}</style>
    </div>
  );
}
