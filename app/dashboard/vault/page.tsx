"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  FolderPlus, Star, Tag, Trash2,
  MoveRight, Pencil, ShoppingBag, BarChart2, LayoutGrid,
  FileText, RefreshCw, Search, Grid, List, X, Check,
  ChevronRight, Upload, TrendingUp,
} from "lucide-react";
import {
  loadFolders, saveFolders, loadItems, createFolder, deleteFolder,
  renameFolder, moveItem, deleteItem, updateItem, addItem,
  importAnalysisReports, createListing, removeListing, loadListings,
  type VaultFolder, type VaultItem, type ForumListing,
} from "../../_lib/vault";
import { loadCircleSession } from "../../_lib/circle";

const WalletButton        = dynamic(() => import("../../_components/WalletButton"),        { ssr: false });
const CircleWalletButton  = dynamic(() => import("../../_components/CircleWalletButton"),   { ssr: false });

// ── Icon helpers ──────────────────────────────────────────────────────────

const FOLDER_EMOJIS = ["📁", "📂", "🗂️"];

/** Canvas-based image renderer — removes white/near-white background pixels */
function NoBgImage({ src, size, threshold = 236 }: { src: string; size: number; threshold?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const d  = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = d.data;
      const edge = threshold - 22; // smooth edge zone

      for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        if (r > threshold && g > threshold && b > threshold) {
          px[i + 3] = 0; // fully transparent
        } else if (r > edge && g > edge && b > edge) {
          // soft anti-alias transition
          const brightness = (r + g + b) / 3;
          px[i + 3] = Math.round(255 * (1 - (brightness - edge) / (threshold - edge)));
        }
      }
      ctx.putImageData(d, 0, 0);
    };
    img.src = src;
  }, [src, threshold]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: "inline-block", objectFit: "contain", verticalAlign: "middle" }}
    />
  );
}

/** Map specific emoji → custom PNG icon (white bg removed via canvas) */
const ICON_IMAGE_MAP: Record<string, string> = {
  "🏪": "/store-layout-icon.png",
};

/** Renders correct icon: SVG for folders, PNG (no-bg) for mapped icons, emoji otherwise */
function FolderIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const mapped = ICON_IMAGE_MAP[icon];
  if (mapped) {
    return <NoBgImage src={mapped} size={size} />;
  }
  if (FOLDER_EMOJIS.includes(icon)) {
    return (
      <Image
        src="/vault-folder.svg"
        alt="folder"
        width={size}
        height={size}
        style={{ objectFit: "contain", display: "inline-block", verticalAlign: "middle" }}
        unoptimized
      />
    );
  }
  return <span style={{ fontSize: size - 2 }}>{icon}</span>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000)   return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function itemIcon(type: VaultItem["type"]) {
  if (type === "analysis") return <BarChart2 size={16} color="#a78bfa" />;
  if (type === "layout")   return <NoBgImage src="/store-layout-icon.png" size={18} />;
  if (type === "note")     return <FileText size={16} color="#fbbf24" />;
  return <Upload size={16} color="#94a3b8" />;
}

// ── Modals ─────────────────────────────────────────────────────────────────

function ModalWrap({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, padding: 32, width: "100%", maxWidth: 460 }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function CreateFolderModal({ onSave, onClose }: { onSave: (name: string, icon: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const icons = ["📁","📂","🗂️","📋","📌","🔖","💼","🏷️","📦","🗃️","💡","📝"];
  return (
    <ModalWrap onClose={onClose}>
      <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>New Folder</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {icons.map(i => (
          <button key={i} onClick={() => setIcon(i)}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: `2px solid ${i === icon ? "#7c3aed" : "#2a2a2a"}`, background: i === icon ? "rgba(124,58,237,0.15)" : "#0a0a0a", cursor: "pointer" }}>
            <FolderIcon icon={i} size={22} />
          </button>
        ))}
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Folder name..."
        style={{ width: "100%", padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 14, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
        onKeyDown={e => e.key === "Enter" && name.trim() && onSave(name.trim(), icon)}
        autoFocus />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid #2a2a2a", color: "#666", borderRadius: 12, cursor: "pointer", fontSize: 13 }}>Cancel</button>
        <button onClick={() => name.trim() && onSave(name.trim(), icon)} disabled={!name.trim()}
          style={{ flex: 2, padding: "10px 0", background: name.trim() ? "#7c3aed" : "#1f1f1f", color: name.trim() ? "#fff" : "#555", border: "none", borderRadius: 12, cursor: name.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}>
          Create Folder
        </button>
      </div>
    </ModalWrap>
  );
}

function MoveModal({ item, folders, onMove, onClose }: { item: VaultItem; folders: VaultFolder[]; onMove: (folderId: string) => void; onClose: () => void }) {
  return (
    <ModalWrap onClose={onClose}>
      <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700 }}>Move Item</h3>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#666" }}>Move <strong style={{ color: "#f0f0f0" }}>{item.name}</strong> to:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
        {folders.filter(f => f.id !== item.folderId).map(f => (
          <button key={f.id} onClick={() => onMove(f.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 14, cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.background = "#0a0a0a"; }}>
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            <span>{f.name}</span>
            <ChevronRight size={14} color="#555" style={{ marginLeft: "auto" }} />
          </button>
        ))}
      </div>
      <button onClick={onClose} style={{ width: "100%", marginTop: 16, padding: "10px 0", background: "transparent", border: "1px solid #2a2a2a", color: "#666", borderRadius: 12, cursor: "pointer", fontSize: 13 }}>Cancel</button>
    </ModalWrap>
  );
}

function ListForSaleModal({ item, walletId, sellerEmail, listings, onSave, onRemove, onClose }: {
  item: VaultItem; walletId: string; sellerEmail?: string;
  listings: ForumListing[];
  onSave: (title: string, desc: string, price: number) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const existing = listings.find(l => l.itemId === item.id && !l.sold);
  const [title, setTitle]   = useState(existing?.title ?? item.name);
  const [desc, setDesc]     = useState(existing?.description ?? (item.summary ?? ""));
  const [price, setPrice]   = useState(existing?.price ?? 0.5);

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShoppingBag size={18} color="#a78bfa" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{existing ? "Update Listing" : "List for Sale"}</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#666" }}>Forum Marketplace · USDC on ARC</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
            placeholder="Describe what buyers will get..."
            style={{ width: "100%", padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 13, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Price (USDC)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))}
              style={{ flex: 1, padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#a78bfa", fontSize: 18, fontWeight: 700, boxSizing: "border-box", outline: "none" }} />
            <span style={{ fontSize: 14, color: "#555" }}>USDC</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[0.1, 0.5, 1, 2, 5].map(p => (
              <button key={p} onClick={() => setPrice(p)}
                style={{ padding: "4px 10px", fontSize: 11, borderRadius: 999, border: `1px solid ${price === p ? "#7c3aed" : "#2a2a2a"}`, background: price === p ? "rgba(124,58,237,0.15)" : "#0a0a0a", color: price === p ? "#a78bfa" : "#555", cursor: "pointer" }}>
                ${p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview data */}
      {item.type === "analysis" && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: "#0a0a0a", borderRadius: 10, border: "1px solid #1f1f1f", fontSize: 12, color: "#555", display: "flex", gap: 16 }}>
          {item.topBrand && <span>🏆 {item.topBrand}</span>}
          {item.skuCount  && <span>📦 {item.skuCount} SKUs</span>}
          {item.totalPaid !== undefined && <span>💰 ${item.totalPaid.toFixed(3)} paid</span>}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {existing ? (
          <button onClick={onRemove}
            style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 12, cursor: "pointer", fontSize: 13 }}>
            Remove Listing
          </button>
        ) : (
          <button onClick={onClose}
            style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid #2a2a2a", color: "#666", borderRadius: 12, cursor: "pointer", fontSize: 13 }}>
            Cancel
          </button>
        )}
        <button onClick={() => title.trim() && price > 0 && onSave(title.trim(), desc.trim(), price)}
          disabled={!title.trim() || price <= 0}
          style={{ flex: 2, padding: "10px 0", background: title.trim() && price > 0 ? "#7c3aed" : "#1f1f1f", color: title.trim() && price > 0 ? "#fff" : "#555", border: "none", borderRadius: 12, cursor: title.trim() && price > 0 ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}>
          {existing ? "Update" : "List on Marketplace →"}
        </button>
      </div>
    </ModalWrap>
  );
}

function AddNoteModal({ folderId, onSave, onClose }: { folderId: string; onSave: (name: string, content: string) => void; onClose: () => void }) {
  const [name, setName]       = useState("");
  const [content, setContent] = useState("");
  return (
    <ModalWrap onClose={onClose}>
      <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700 }}>New Note</h3>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Note title..."
        style={{ width: "100%", padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
        autoFocus />
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
        placeholder="Write your notes here..."
        style={{ width: "100%", padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 13, marginBottom: 20, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "1px solid #2a2a2a", color: "#666", borderRadius: 12, cursor: "pointer", fontSize: 13 }}>Cancel</button>
        <button onClick={() => name.trim() && onSave(name.trim(), content)} disabled={!name.trim()}
          style={{ flex: 2, padding: "10px 0", background: name.trim() ? "#7c3aed" : "#1f1f1f", color: name.trim() ? "#fff" : "#555", border: "none", borderRadius: 12, cursor: name.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}>
          Save Note
        </button>
      </div>
    </ModalWrap>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────

function DetailPanel({ item, folder, listings, onClose, onStar, onMove, onDelete, onListForSale }: {
  item: VaultItem; folder?: VaultFolder; listings: ForumListing[];
  onClose: () => void; onStar: () => void; onMove: () => void;
  onDelete: () => void; onListForSale: () => void;
}) {
  const listing = listings.find(l => l.itemId === item.id && !l.sold);
  return (
    <div style={{ width: 320, flexShrink: 0, background: "#0d0d0d", borderLeft: "1px solid #1f1f1f", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>Details</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2 }}><X size={15} /></button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Icon + Name */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#111", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            {item.type === "layout"
              ? <NoBgImage src="/store-layout-icon.png" size={44} />
              : <span style={{ fontSize: 32 }}>{item.type === "analysis" ? "📊" : item.type === "note" ? "📝" : "🖼️"}</span>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0", marginBottom: 4, wordBreak: "break-word" }}>{item.name}</div>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.type}</div>
        </div>

        {/* Listing badge */}
        {listing && (
          <div style={{ padding: "10px 14px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}>🏷️ Listed for Sale</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#a78bfa" }}>${listing.price} USDC</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{listing.title}</div>
          </div>
        )}

        {/* Stats for analysis */}
        {item.type === "analysis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {item.topBrand && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#555" }}>Top Brand</span>
                <span style={{ color: "#a78bfa", fontWeight: 600 }}>{item.topBrand}</span>
              </div>
            )}
            {item.skuCount !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#555" }}>SKUs found</span>
                <span style={{ color: "#f0f0f0", fontWeight: 600 }}>{item.skuCount}</span>
              </div>
            )}
            {item.totalPaid !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#555" }}>Analysis cost</span>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>${item.totalPaid.toFixed(3)} USDC</span>
              </div>
            )}
            {item.summary && (
              <div style={{ padding: "10px 12px", background: "#111", borderRadius: 10, border: "1px solid #1f1f1f", fontSize: 12, color: "#888", lineHeight: 1.6, marginTop: 4 }}>
                {item.summary}
              </div>
            )}
          </div>
        )}

        {/* Note content */}
        {item.type === "note" && item.content && (
          <div style={{ padding: "12px 14px", background: "#111", borderRadius: 10, border: "1px solid #1f1f1f", fontSize: 13, color: "#aaa", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {item.content}
          </div>
        )}

        {/* Metadata */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#444" }}>Folder</span>
            <span style={{ color: "#666", display: "inline-flex", alignItems: "center", gap: 4 }}><FolderIcon icon={folder?.icon ?? "📁"} size={13} />{folder?.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#444" }}>Created</span>
            <span style={{ color: "#666" }}>{timeAgo(item.createdAt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#444" }}>Updated</span>
            <span style={{ color: "#666" }}>{timeAgo(item.updatedAt)}</span>
          </div>
          {item.reportId && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#444" }}>Report ID</span>
              <span style={{ color: "#555", fontFamily: "monospace", fontSize: 11 }}>{item.reportId.slice(0, 16)}…</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "14px 18px", borderTop: "1px solid #1f1f1f", display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={onListForSale}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", background: listing ? "rgba(124,58,237,0.1)" : "#7c3aed", border: listing ? "1px solid rgba(124,58,237,0.3)" : "none", color: listing ? "#a78bfa" : "#fff", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <ShoppingBag size={13} />
          {listing ? "Update Listing" : "List for Sale"}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onStar}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", background: "transparent", border: `1px solid ${item.starred ? "rgba(251,191,36,0.4)" : "#2a2a2a"}`, color: item.starred ? "#fbbf24" : "#555", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>
            <Star size={12} fill={item.starred ? "#fbbf24" : "none"} /> {item.starred ? "Starred" : "Star"}
          </button>
          <button onClick={onMove}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>
            <MoveRight size={12} /> Move
          </button>
          <button onClick={onDelete}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
        {item.reportId && (
          <Link href="/dashboard/reports"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 10, cursor: "pointer", fontSize: 12, textDecoration: "none" }}>
            <TrendingUp size={12} /> View Full Report
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const [circleSession, setCircle] = useState<{ walletId: string; walletAddress: string; userId?: string } | null>(null);

  // Active wallet id (MetaMask address OR Circle walletId)
  const walletId = circleSession?.walletAddress ?? address ?? "";
  const connected = isConnected || !!circleSession;

  const [folders,   setFolders]   = useState<VaultFolder[]>([]);
  const [items,     setItems]     = useState<VaultItem[]>([]);
  const [listings,  setListings]  = useState<ForumListing[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("f-analysis");
  const [selected, setSelected]   = useState<VaultItem | null>(null);
  const [view,     setView]       = useState<"grid" | "list">("grid");
  const [search,   setSearch]     = useState("");

  // Modals
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showMove,    setShowMove]    = useState(false);
  const [showForSale, setShowForSale] = useState(false);
  const [showNote,    setShowNote]    = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const reload = useCallback(() => {
    if (!walletId) return;
    setFolders(loadFolders(walletId));
    setItems(loadItems(walletId));
    setListings(loadListings());
  }, [walletId]);

  useEffect(() => { setCircle(loadCircleSession()); }, []);
  useEffect(() => { reload(); }, [reload]);

  const handleImport = () => {
    if (!walletId) return;
    const n = importAnalysisReports(walletId);
    setImportedCount(n);
    reload();
    showToast(n > 0 ? `✅ Imported ${n} analysis report${n > 1 ? "s" : ""}` : "No new reports to import");
  };

  // Current folder items
  const displayItems = items
    .filter(i => {
      if (activeFolder === "f-favorites") return i.starred;
      if (activeFolder === "f-forsale")   return i.forSale;
      return i.folderId === activeFolder;
    })
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const currentFolder = folders.find(f => f.id === activeFolder);
  const forSaleCount  = items.filter(i => i.forSale).length;
  const listingCount  = listings.filter(l => !l.sold).length;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreateFolder = (name: string, icon: string) => {
    createFolder(walletId, name, null, icon);
    setShowCreateFolder(false);
    reload();
    showToast(`Folder "${name}" created`);
  };

  const handleDeleteFolder = (id: string) => {
    if (folders.find(f => f.id === id)?.isDefault) return;
    deleteFolder(walletId, id);
    if (activeFolder === id) setActiveFolder("f-analysis");
    reload();
    showToast("Folder deleted");
  };

  const handleRenameFolder = (id: string) => {
    if (!renameValue.trim()) { setRenamingFolder(null); return; }
    renameFolder(walletId, id, renameValue.trim());
    setRenamingFolder(null);
    reload();
  };

  const handleMoveItem = (toFolderId: string) => {
    if (!selected) return;
    moveItem(walletId, selected.id, toFolderId);
    reload();
    setShowMove(false);
    showToast(`Moved to ${folders.find(f => f.id === toFolderId)?.name}`);
  };

  const handleDeleteItem = () => {
    if (!selected) return;
    // Also remove listing
    if (selected.listingId) removeListing(selected.listingId);
    deleteItem(walletId, selected.id);
    setSelected(null);
    reload();
    showToast("Item deleted");
  };

  const handleStar = () => {
    if (!selected) return;
    updateItem(walletId, selected.id, { starred: !selected.starred });
    reload();
    setSelected(prev => prev ? { ...prev, starred: !prev.starred } : null);
  };

  const handleListForSale = (title: string, desc: string, price: number) => {
    if (!selected) return;
    // Remove old listing if exists
    if (selected.listingId) removeListing(selected.listingId);
    const listing = createListing(walletId, selected, title, desc, price, circleSession?.userId);
    updateItem(walletId, selected.id, { forSale: true, price, listingId: listing.id, folderId: "f-forsale" });
    setShowForSale(false);
    reload();
    setSelected(null);
    showToast("🏷️ Listed on marketplace!");
  };

  const handleRemoveListing = () => {
    if (!selected?.listingId) return;
    removeListing(selected.listingId);
    updateItem(walletId, selected.id, { forSale: false, price: undefined, listingId: undefined });
    setShowForSale(false);
    reload();
    setSelected(null);
    showToast("Listing removed");
  };

  const handleAddNote = (name: string, content: string) => {
    addItem(walletId, { type: "note", name, folderId: activeFolder, content });
    setShowNote(false);
    reload();
    showToast("📝 Note saved");
  };

  if (!connected) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 48 }}>🔐</div>
        <h2 style={{ margin: 0, fontSize: 22, color: "#f0f0f0", fontWeight: 700 }}>Connect your wallet</h2>
        <p style={{ margin: 0, color: "#555", fontSize: 14 }}>Your personal data vault is linked to your wallet address.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <CircleWalletButton onDisconnect={() => setCircle(null)} />
          <WalletButton />
        </div>
        <Link href="/dashboard" style={{ color: "#7c3aed", fontSize: 13, textDecoration: "none" }}>← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", display: "flex", flexDirection: "column" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 20px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 13, color: "#f0f0f0", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: "1px solid #1f1f1f", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/" style={{ fontSize: 15, fontWeight: 800, color: "#f0f0f0", textDecoration: "none", letterSpacing: "-0.03em" }}>
            storescope<span style={{ color: "#7c3aed" }}>.ai</span>
          </a>
          <div style={{ width: 1, height: 20, background: "#1f1f1f" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>My Vault</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CircleWalletButton onDisconnect={() => setCircle(null)} />
          <WalletButton />
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside style={{ width: 240, flexShrink: 0, background: "#0a0a0a", borderRight: "1px solid #1f1f1f", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Wallet info */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #1f1f1f" }}>
            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Wallet</div>
            <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace", wordBreak: "break-all" }}>
              {walletId ? `${walletId.slice(0, 14)}...${walletId.slice(-6)}` : "—"}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 11 }}>
              <span style={{ color: "#555" }}>{items.length} items</span>
              <span style={{ color: "#a78bfa" }}>{forSaleCount} for sale</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: "10px 10px 4px" }}>
            <button onClick={handleImport}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, color: "#a78bfa", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              <RefreshCw size={11} /> Import from Analysis
              {importedCount !== null && importedCount > 0 && <span style={{ marginLeft: "auto", background: "#7c3aed", color: "#fff", borderRadius: 999, padding: "1px 6px", fontSize: 10 }}>+{importedCount}</span>}
            </button>
          </div>

          {/* Folder list */}
          <nav style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 4px 4px", marginBottom: 2 }}>Folders</div>
            {folders.map(f => {
              const count = f.id === "f-favorites" ? items.filter(i => i.starred).length
                          : f.id === "f-forsale"   ? forSaleCount
                          : items.filter(i => i.folderId === f.id).length;
              const isActive = activeFolder === f.id;
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 8, marginBottom: 1, background: isActive ? "rgba(124,58,237,0.1)" : "transparent", border: `1px solid ${isActive ? "rgba(124,58,237,0.2)" : "transparent"}` }}>
                  {renamingFolder === f.id ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "4px 8px" }}>
                      <span style={{ fontSize: 15 }}>{f.icon}</span>
                      <input value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === "Enter") handleRenameFolder(f.id); if (e.key === "Escape") setRenamingFolder(null); }}
                        style={{ flex: 1, background: "#1a1a1a", border: "1px solid #7c3aed", borderRadius: 6, padding: "3px 6px", color: "#f0f0f0", fontSize: 12, outline: "none" }} />
                      <button onClick={() => handleRenameFolder(f.id)} style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", padding: 0 }}><Check size={12} /></button>
                      <button onClick={() => setRenamingFolder(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0 }}><X size={12} /></button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setActiveFolder(f.id)}
                        style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", color: isActive ? "#a78bfa" : "#666", cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400, textAlign: "left" }}>
                        <FolderIcon icon={f.icon} size={18} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        {count > 0 && <span style={{ fontSize: 10, background: isActive ? "rgba(124,58,237,0.2)" : "#1a1a1a", color: isActive ? "#a78bfa" : "#444", borderRadius: 999, padding: "1px 6px" }}>{count}</span>}
                      </button>
                      {!f.isDefault && (
                        <div style={{ display: "flex", opacity: 0, transition: "opacity 0.1s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}>
                          <button onClick={() => { setRenamingFolder(f.id); setRenameValue(f.name); }}
                            style={{ padding: "6px 4px", background: "none", border: "none", color: "#555", cursor: "pointer" }}
                            title="Rename"><Pencil size={11} /></button>
                          <button onClick={() => handleDeleteFolder(f.id)}
                            style={{ padding: "6px 6px 6px 2px", background: "none", border: "none", color: "#555", cursor: "pointer" }}
                            title="Delete folder"><Trash2 size={11} /></button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            <button onClick={() => setShowCreateFolder(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "none", border: "1px dashed #2a2a2a", borderRadius: 8, color: "#444", fontSize: 12, cursor: "pointer", marginTop: 6 }}>
              <FolderPlus size={12} /> New Folder
            </button>
          </nav>

          {/* Bottom nav */}
          <div style={{ padding: "10px 10px", borderTop: "1px solid #1f1f1f", display: "flex", flexDirection: "column", gap: 1 }}>
            {[
              { label: "Dashboard",  href: "/dashboard" },
              { label: "AI Analysis", href: "/dashboard/analysis" },
              { label: "Forum",      href: "/forum" },
            ].map(n => (
              <Link key={n.href} href={n.href}
                style={{ padding: "7px 10px", fontSize: 12, color: "#444", textDecoration: "none", borderRadius: 8, display: "block" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#888"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#444"; }}>
                {n.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* ── Main area ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{ padding: "14px 24px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FolderIcon icon={currentFolder?.icon ?? "📁"} size={24} />
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{currentFolder?.name ?? "All Items"}</h2>
                <div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>{displayItems.length} item{displayItems.length !== 1 ? "s" : ""}</div>
              </div>
            </div>

            {/* Search */}
            <div style={{ flex: 1, maxWidth: 300, position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#444" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
                style={{ width: "100%", padding: "7px 12px 7px 30px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, color: "#f0f0f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
              <button onClick={() => setShowNote(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer" }}>
                <FileText size={12} /> New Note
              </button>
              <Link href="/dashboard/analysis"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
                <BarChart2 size={12} /> New Analysis
              </Link>
              <button onClick={() => setView(v => v === "grid" ? "list" : "grid")}
                style={{ padding: "7px 10px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, color: "#555", cursor: "pointer" }}>
                {view === "grid" ? <List size={14} /> : <Grid size={14} />}
              </button>
            </div>
          </div>

          {/* Marketplace banner */}
          {listingCount > 0 && (
            <div style={{ margin: "0 24px", marginTop: 16, padding: "10px 16px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: "#a78bfa" }}>🏷️ You have <strong>{listingCount}</strong> active listing{listingCount > 1 ? "s" : ""} on the marketplace</span>
              <Link href="/forum" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>View on Forum →</Link>
            </div>
          )}

          {/* Items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {displayItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                  {activeFolder === "f-analysis" ? <span style={{ fontSize: 48 }}>📊</span>
                   : activeFolder === "f-favorites" ? <span style={{ fontSize: 48 }}>⭐</span>
                   : activeFolder === "f-forsale" ? <span style={{ fontSize: 48 }}>🏷️</span>
                   : <Image src="/vault-folder.svg" alt="folder" width={72} height={72} style={{ objectFit: "contain" }} unoptimized />}
                </div>
                <p style={{ color: "#444", fontSize: 14, margin: "0 0 20px" }}>
                  {activeFolder === "f-analysis"
                    ? "No analysis reports yet."
                    : activeFolder === "f-favorites"
                    ? "No starred items."
                    : activeFolder === "f-forsale"
                    ? "No items listed for sale."
                    : "This folder is empty."}
                </p>
                {activeFolder === "f-analysis" && (
                  <button onClick={handleImport}
                    style={{ padding: "10px 24px", background: "#7c3aed", border: "none", borderRadius: 999, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Import from Analysis History
                  </button>
                )}
              </div>
            ) : view === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                {displayItems.map(item => {
                  const isSelected = selected?.id === item.id;
                  const hasListing = listings.some(l => l.itemId === item.id && !l.sold);
                  return (
                    <div key={item.id}
                      onClick={() => setSelected(isSelected ? null : item)}
                      style={{ background: "#111", border: `1.5px solid ${isSelected ? "#7c3aed" : "#1f1f1f"}`, borderRadius: 16, padding: 16, cursor: "pointer", transition: "all 0.15s", position: "relative" }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "#2a2a2a"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "#1f1f1f"; }}>

                      {/* Badges */}
                      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
                        {item.starred && <Star size={12} color="#fbbf24" fill="#fbbf24" />}
                        {hasListing && <Tag size={12} color="#a78bfa" />}
                      </div>

                      {/* Icon area */}
                      <div style={{ height: 80, background: "#0a0a0a", borderRadius: 10, border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                        {item.type === "layout"
                          ? <NoBgImage src="/store-layout-icon.png" size={52} />
                          : <span style={{ fontSize: 32 }}>{item.type === "analysis" ? "📊" : item.type === "note" ? "📝" : "🖼️"}</span>}
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "#444" }}>{timeAgo(item.updatedAt)}</div>

                      {item.type === "analysis" && item.topBrand && (
                        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>{item.topBrand}</span>
                          {item.skuCount !== undefined && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#1a1a1a", color: "#555" }}>{item.skuCount} SKUs</span>}
                        </div>
                      )}

                      {item.type === "note" && item.content && (
                        <div style={{ marginTop: 6, fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.content}</div>
                      )}

                      {hasListing && (
                        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>${item.price} USDC</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // List view
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 80px 80px 80px", gap: 12, padding: "6px 14px", fontSize: 11, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <div />
                  <div>Name</div>
                  <div>Folder</div>
                  <div>Type</div>
                  <div style={{ textAlign: "right" }}>Price</div>
                  <div style={{ textAlign: "right" }}>Updated</div>
                </div>
                {displayItems.map(item => {
                  const isSelected = selected?.id === item.id;
                  const folder     = folders.find(f => f.id === item.folderId);
                  const hasListing = listings.some(l => l.itemId === item.id && !l.sold);
                  return (
                    <div key={item.id}
                      onClick={() => setSelected(isSelected ? null : item)}
                      style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 80px 80px 80px", gap: 12, padding: "10px 14px", background: isSelected ? "rgba(124,58,237,0.06)" : "#111", border: `1px solid ${isSelected ? "rgba(124,58,237,0.3)" : "#1f1f1f"}`, borderRadius: 10, cursor: "pointer", alignItems: "center", transition: "all 0.1s" }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#0f0f0f"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "#111"; }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{itemIcon(item.type)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                        {item.topBrand && <div style={{ fontSize: 11, color: "#555" }}>{item.topBrand}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 4 }}><FolderIcon icon={folder?.icon ?? "📁"} size={13} />{folder?.name}</div>
                      <div><span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#1a1a1a", color: "#666" }}>{item.type}</span></div>
                      <div style={{ textAlign: "right", fontSize: 12, color: hasListing ? "#a78bfa" : "#333", fontWeight: hasListing ? 700 : 400 }}>
                        {hasListing ? `$${item.price}` : "—"}
                      </div>
                      <div style={{ textAlign: "right", fontSize: 11, color: "#444" }}>{timeAgo(item.updatedAt)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Panel ─────────────────────────────────────────────── */}
        {selected && (
          <DetailPanel
            item={selected}
            folder={folders.find(f => f.id === selected.folderId)}
            listings={listings}
            onClose={() => setSelected(null)}
            onStar={handleStar}
            onMove={() => setShowMove(true)}
            onDelete={handleDeleteItem}
            onListForSale={() => setShowForSale(true)}
          />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showCreateFolder && (
        <CreateFolderModal onSave={handleCreateFolder} onClose={() => setShowCreateFolder(false)} />
      )}
      {showMove && selected && (
        <MoveModal item={selected} folders={folders} onMove={handleMoveItem} onClose={() => setShowMove(false)} />
      )}
      {showForSale && selected && (
        <ListForSaleModal
          item={selected} walletId={walletId} sellerEmail={circleSession?.userId}
          listings={listings}
          onSave={handleListForSale} onRemove={handleRemoveListing} onClose={() => setShowForSale(false)}
        />
      )}
      {showNote && (
        <AddNoteModal folderId={activeFolder} onSave={handleAddNote} onClose={() => setShowNote(false)} />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
