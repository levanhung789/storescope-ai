// In-memory store for Circle transaction statuses
// Works for local dev (single process). For production multi-instance, use Redis/KV.

export type TxRecord = {
  txId:    string;
  txHash:  string | null;
  state:   string;
  updatedAt: number;
};

// Global so it persists across hot-reloads in dev
const g = globalThis as typeof globalThis & { __txStore?: Map<string, TxRecord> };
if (!g.__txStore) g.__txStore = new Map();
const store = g.__txStore;

export function setTx(txId: string, record: Omit<TxRecord, "updatedAt">) {
  store.set(txId, { ...record, updatedAt: Date.now() });
}

export function getTx(txId: string): TxRecord | null {
  return store.get(txId) ?? null;
}

// Clean up entries older than 10 minutes
export function pruneOld() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [id, rec] of store) {
    if (rec.updatedAt < cutoff) store.delete(id);
  }
}
