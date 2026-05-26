// Vault — Personal data store per wallet (localStorage-backed)

export type VaultFolder = {
  id:        string;
  name:      string;
  parentId:  string | null;
  createdAt: number;
  icon:      string;         // emoji icon
  isDefault: boolean;        // default folders can't be deleted
};

export type VaultItemType = "analysis" | "layout" | "note" | "image";

export type VaultItem = {
  id:          string;
  type:        VaultItemType;
  name:        string;
  folderId:    string;
  createdAt:   number;
  updatedAt:   number;
  tags:        string[];
  starred:     boolean;
  // marketplace
  forSale:     boolean;
  price?:      number;
  listingId?:  string;
  // analysis-specific
  reportId?:   string;
  topBrand?:   string;
  skuCount?:   number;
  totalPaid?:  number;
  imageHash?:  string;
  summary?:    string;
  // layout-specific
  tokenId?:    number;
  // note-specific
  content?:    string;
};

export type ForumListing = {
  id:              string;
  sellerWallet:    string;   // address or circle walletId
  sellerEmail?:    string;
  itemId:          string;
  itemType:        VaultItemType;
  title:           string;
  description:     string;
  price:           number;   // USDC
  createdAt:       number;
  sold:            boolean;
  buyerWallet?:    string;
  // quick preview
  previewData?:    Record<string, unknown>;
};

// ── Default folders ────────────────────────────────────────────────────────

export const DEFAULT_FOLDERS: Omit<VaultFolder, "createdAt">[] = [
  { id: "f-analysis",  name: "Analysis History", parentId: null, icon: "📊", isDefault: true },
  { id: "f-layouts",   name: "Store Layouts",    parentId: null, icon: "🏪", isDefault: true },
  { id: "f-favorites", name: "Favorites",        parentId: null, icon: "⭐", isDefault: true },
  { id: "f-forsale",   name: "For Sale",         parentId: null, icon: "🏷️", isDefault: true },
];

// ── Storage keys ──────────────────────────────────────────────────────────

function foldersKey(walletId: string) { return `vault_folders_${walletId.toLowerCase()}`; }
function itemsKey(walletId: string)   { return `vault_items_${walletId.toLowerCase()}`; }
const LISTINGS_KEY = "forum_listings_v2";

// ── Folders ───────────────────────────────────────────────────────────────

export function loadFolders(walletId: string): VaultFolder[] {
  try {
    const raw = localStorage.getItem(foldersKey(walletId));
    if (raw) return JSON.parse(raw) as VaultFolder[];
  } catch { /* ignore */ }
  // First time: create default folders
  const defaults = DEFAULT_FOLDERS.map(f => ({ ...f, createdAt: Date.now() }));
  saveFolders(walletId, defaults);
  return defaults;
}

export function saveFolders(walletId: string, folders: VaultFolder[]): void {
  localStorage.setItem(foldersKey(walletId), JSON.stringify(folders));
}

export function createFolder(walletId: string, name: string, parentId: string | null, icon = "📁"): VaultFolder {
  const folders = loadFolders(walletId);
  const folder: VaultFolder = { id: `f-${Date.now()}`, name, parentId, icon, isDefault: false, createdAt: Date.now() };
  saveFolders(walletId, [...folders, folder]);
  return folder;
}

export function deleteFolder(walletId: string, folderId: string): void {
  const folders = loadFolders(walletId).filter(f => f.id !== folderId);
  saveFolders(walletId, folders);
  // Move items to root analysis folder
  const items = loadItems(walletId).map(i => i.folderId === folderId ? { ...i, folderId: "f-analysis" } : i);
  saveItems(walletId, items);
}

export function renameFolder(walletId: string, folderId: string, name: string): void {
  const folders = loadFolders(walletId).map(f => f.id === folderId ? { ...f, name } : f);
  saveFolders(walletId, folders);
}

// ── Items ─────────────────────────────────────────────────────────────────

export function loadItems(walletId: string): VaultItem[] {
  try {
    const raw = localStorage.getItem(itemsKey(walletId));
    return raw ? (JSON.parse(raw) as VaultItem[]) : [];
  } catch { return []; }
}

export function saveItems(walletId: string, items: VaultItem[]): void {
  localStorage.setItem(itemsKey(walletId), JSON.stringify(items));
}

export function addItem(walletId: string, item: Omit<VaultItem, "id" | "createdAt" | "updatedAt" | "tags" | "starred" | "forSale">): VaultItem {
  const full: VaultItem = { ...item, id: `vi-${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now(), tags: [], starred: false, forSale: false };
  saveItems(walletId, [...loadItems(walletId), full]);
  return full;
}

export function updateItem(walletId: string, itemId: string, patch: Partial<VaultItem>): void {
  const items = loadItems(walletId).map(i => i.id === itemId ? { ...i, ...patch, updatedAt: Date.now() } : i);
  saveItems(walletId, items);
}

export function deleteItem(walletId: string, itemId: string): void {
  saveItems(walletId, loadItems(walletId).filter(i => i.id !== itemId));
}

export function moveItem(walletId: string, itemId: string, toFolderId: string): void {
  updateItem(walletId, itemId, { folderId: toFolderId });
}

// ── Import analysis reports from existing reports storage ──────────────────

export function importAnalysisReports(walletId: string): number {
  const key = `reports_${walletId.toLowerCase()}`;
  let raw: string | null = null;
  try { raw = localStorage.getItem(key); } catch { return 0; }
  if (!raw) return 0;

  const existing = loadItems(walletId);
  const existingReportIds = new Set(existing.map(i => i.reportId).filter(Boolean));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reports: any[] = JSON.parse(raw);
  let imported = 0;

  for (const r of reports) {
    if (existingReportIds.has(r.reportId)) continue;
    addItem(walletId, {
      type:     "analysis",
      name:     r.imageName || r.reportId,
      folderId: "f-analysis",
      reportId: r.reportId,
      topBrand: r.topBrand || "",
      skuCount: r.skus?.length ?? 0,
      totalPaid: r.totalPaid ?? 0,
      summary:  r.summary || "",
      imageHash: r.imageHash || "",
    });
    imported++;
  }
  return imported;
}

// ── Forum listings ─────────────────────────────────────────────────────────

export function loadListings(): ForumListing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    return raw ? (JSON.parse(raw) as ForumListing[]) : [];
  } catch { return []; }
}

export function saveListings(listings: ForumListing[]): void {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

export function createListing(
  walletId: string,
  item: VaultItem,
  title: string,
  description: string,
  price: number,
  sellerEmail?: string,
): ForumListing {
  const listing: ForumListing = {
    id:           `lst-${Date.now()}`,
    sellerWallet: walletId,
    sellerEmail,
    itemId:       item.id,
    itemType:     item.type,
    title,
    description,
    price,
    createdAt:    Date.now(),
    sold:         false,
    previewData:  { topBrand: item.topBrand, skuCount: item.skuCount, summary: item.summary },
  };
  saveListings([...loadListings(), listing]);
  return listing;
}

export function removeListing(listingId: string): void {
  saveListings(loadListings().filter(l => l.id !== listingId));
}
