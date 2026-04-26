"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAccount, useConnect, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ANALYSIS_TASKS, TOTAL_ANALYSIS_PRICE, toUSDCUnits, arcTestnet, ARC_CONTRACTS, ERC20_ABI, type TaskId } from "../../_lib/arc";
import AnalysisReport, { type ReportData, saveReport } from "../../_components/AnalysisReport";
import { loadAnonUser, type AnonUser } from "../../_lib/anonymousAuth";

const AnonBadge = dynamic(() => import("../../_components/AnonBadge"), { ssr: false });

const WalletButton = dynamic(() => import("../../_components/WalletButton"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = "waiting" | "paying" | "processing" | "done" | "skipped";
type PayStep = "idle" | "connect" | "wrong_chain" | "confirm" | "approving" | "paid" | "error";

interface TaskState {
  status: TaskStatus;
  txHash?: string;
  result?: string;
}

// ── Mock results per task ─────────────────────────────────────────────────────

const TASK_RESULTS: Record<TaskId, string> = {
  upload:       "Image registered · ID: IMG-20260426-0091 · SHA256: a3f7c2…",
  quality:      "✓ Quality OK · Sharpness 87/100 · Brightness 79/100 · Angle: frontal",
  shelf_detect: "3 shelf rows detected · 1 cooler wall · 40 total facings",
  sku_detect:   "7 SKUs detected · Meizan Gold (×12) · Cái Lân (×10) · Neptune Light (×12) · Unknown (×6)",
  competitor:   "Calofic 55% shelf share · Tường An 30% · Unknown 15% · Neptune premium +34%",
  stock_risk:   "⚠ Low stock risk: Neptune Light row 3 (2 facings) · Reorder recommended",
  layout_sim:   "Store layout updated · Cooler wall segment synced · 3 fixture positions logged",
  recommend:    "Move Neptune Light to eye-level row 1 · Expand Calofic 2 facings · Investigate unknown brand",
  human_review: "No human review needed · All confidence scores ≥ 84%",
  report:       "Report ID: RPT-5042002-0091 · PDF ready · Proof hash recorded on ArcScan",
};

const TASK_DURATION: Record<TaskId, number> = {
  upload: 700, quality: 900, shelf_detect: 1800, sku_detect: 2200,
  competitor: 1400, stock_risk: 900, layout_sim: 1600, recommend: 1200,
  human_review: 600, report: 1000,
};

function mockTx() { return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""); }

const MOCK_SKUS = [
  { sku: "CAL-MEI-1L", product: "Meizan Gold Cooking Oil 1L", brand: "Meizan Gold", category: "Cooking Oil", packSpec: "1L bottle", facings: 6, priceVND: 42400, matchedCompany: "Calofic", status: "Matched" as const, scores: { brand: 28, text: 27, size: 17, category: 10, visual: 8 } },
  { sku: "CAL-MEI-2L", product: "Meizan Gold Cooking Oil 2L", brand: "Meizan Gold", category: "Cooking Oil", packSpec: "2L bottle", facings: 6, priceVND: 42400, matchedCompany: "Calofic", status: "Matched" as const, scores: { brand: 28, text: 27, size: 16, category: 10, visual: 8 } },
  { sku: "CAL-CL-1L",  product: "Cai Lan Cooking Oil 1L",    brand: "Cái Lân",    category: "Cooking Oil", packSpec: "1L bottle", facings: 5, priceVND: 42400, matchedCompany: "Calofic", status: "Matched" as const, scores: { brand: 26, text: 28, size: 16, category: 10, visual: 7 } },
  { sku: "CAL-CL-2L",  product: "Cai Lan Cooking Oil 2L",    brand: "Cái Lân",    category: "Cooking Oil", packSpec: "2L bottle", facings: 5, priceVND: 42400, matchedCompany: "Calofic", status: "Matched" as const, scores: { brand: 26, text: 28, size: 16, category: 10, visual: 7 } },
  { sku: "TAN-NEP-1L", product: "Neptune Light Cooking Oil 1L", brand: "Neptune Light", category: "Cooking Oil", packSpec: "1L bottle", facings: 6, priceVND: 56200, matchedCompany: "Tường An", status: "Matched" as const, scores: { brand: 25, text: 26, size: 15, category: 10, visual: 8 } },
  { sku: "TAN-NEP-2L", product: "Neptune Light Cooking Oil 2L", brand: "Neptune Light", category: "Cooking Oil", packSpec: "2L bottle", facings: 6, priceVND: 56200, matchedCompany: "Tường An", status: "Matched" as const, scores: { brand: 25, text: 26, size: 15, category: 10, visual: 8 } },
  { sku: "UNK-001",    product: "Unidentified brand (left column)", brand: "Unknown", category: "Cooking Oil", packSpec: "~500ml", facings: 6, priceVND: 39500, matchedCompany: "—", status: "Review" as const, scores: { brand: 0, text: 12, size: 10, category: 10, visual: 5 } },
];

// ── Payment Gate Modal ─────────────────────────────────────────────────────────

function PaymentGateModal({ onPaid, onClose }: { onPaid: () => void; onClose: () => void }) {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [step, setStep] = useState<PayStep>(() => {
    if (!isConnected) return "connect";
    if (chain?.id !== arcTestnet.id) return "wrong_chain";
    return "confirm";
  });
  const [errMsg, setErrMsg] = useState("");

  // Real USDC transfer
  const { writeContract, data: txHash, isPending: isSending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Watch for confirmation
  useEffect(() => {
    if (isConfirmed) setStep("paid");
  }, [isConfirmed]);

  useEffect(() => {
    if (writeError) {
      const msg = writeError.message || "Transaction rejected";
      setErrMsg(msg.includes("rejected") || msg.includes("denied") ? "Transaction rejected by user." : msg.slice(0, 120));
      setStep("error");
    }
  }, [writeError]);

  const handleApprove = () => {
    setStep("approving");
    writeContract({
      address: ARC_CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [ARC_CONTRACTS.SERVICE_WALLET, toUSDCUnits(TOTAL_ANALYSIS_PRICE)],
      chainId: arcTestnet.id,
    });
  };

  const isProcessing = isSending || isConfirming || step === "approving";

  const inputStyle: React.CSSProperties = { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 12 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={step !== "approving" ? onClose : undefined}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        {step === "paid" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 26, color: "#4ade80" }}>✓</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#4ade80" }}>Payment Confirmed!</h3>
            <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>
              <strong style={{ color: "#f0f0f0" }}>${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC</strong> deducted from your wallet on ARC Testnet.
            </p>
            {txHash && (
              <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-block", fontSize: 11, color: "#7c3aed", fontFamily: "monospace", wordBreak: "break-all", marginBottom: 20, textDecoration: "none" }}>
                {txHash.slice(0, 28)}…{txHash.slice(-8)} ↗
              </a>
            )}
            <button onClick={onPaid} style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Start Analysis (10 Tasks)
            </button>
          </div>

        ) : step === "connect" ? (
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>Connect Wallet</h3>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 20px" }}>Connect to ARC Testnet to pay for analysis micro-tasks.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {connectors.map(c => (
                <button key={c.id} onClick={() => connect({ connector: c, chainId: arcTestnet.id })}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", ...inputStyle, color: "#f0f0f0", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid #2a2a2a" }}>
                  <span style={{ fontSize: 20 }}>{c.name.toLowerCase().includes("metamask") ? "🦊" : "💼"}</span>
                  {c.name}
                </button>
              ))}
            </div>
            <button onClick={onClose} style={{ display: "block", width: "100%", marginTop: 12, background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 12, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>

        ) : step === "wrong_chain" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 16, color: "#fbbf24" }}>⚠</div>
            <h3 style={{ margin: "0 0 8px", color: "#fbbf24" }}>Wrong Network</h3>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 20px" }}>Switch to ARC Testnet (Chain ID 5042002) to continue.</p>
            <button onClick={() => switchChain({ chainId: arcTestnet.id })} disabled={isSwitching}
              style={{ width: "100%", background: "#b45309", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: isSwitching ? "wait" : "pointer" }}>
              {isSwitching ? "Switching…" : "Switch to ARC Testnet"}
            </button>
            <button onClick={onClose} style={{ display: "block", width: "100%", marginTop: 10, background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 12, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>

        ) : step === "error" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12, color: "#f87171" }}>✗</div>
            <p style={{ color: "#f87171", fontSize: 13 }}>{errMsg}</p>
            <button onClick={() => setStep("confirm")} style={{ marginTop: 16, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Try Again</button>
          </div>

        ) : (
          /* ── Confirm ── */
          <>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>ARC Network · USDC Micro-Payments</div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18 }}>Approve Analysis Budget</h3>
              <p style={{ color: "#555", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                Approve <strong style={{ color: "#a78bfa" }}>${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC</strong> once.
                Each of the 10 tasks deducts its micro-fee automatically as it completes.
              </p>
            </div>

            {/* Task list with prices */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #1f1f1f", display: "grid", gridTemplateColumns: "1fr 70px", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>Task</span>
                <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>USDC</span>
              </div>
              {ANALYSIS_TASKS.map((t, i) => (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8, padding: "9px 16px", borderBottom: i < ANALYSIS_TASKS.length - 1 ? "1px solid #111" : "none", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#e0e0e0" }}>{t.label}</span>
                  <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, textAlign: "right" }}>${t.price.toFixed(3)}</span>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8, padding: "12px 16px", borderTop: "1px solid #2a2a2a", background: "rgba(124,58,237,0.06)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#a78bfa", textAlign: "right" }}>${TOTAL_ANALYSIS_PRICE.toFixed(3)}</span>
              </div>
            </div>

            {/* Wallet */}
            {isConnected && (
              <div style={{ fontSize: 12, color: "#555", padding: "9px 12px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8, marginBottom: 16 }}>
                <span style={{ color: "#4ade80" }}>●</span> {address?.slice(0, 8)}…{address?.slice(-6)} · ARC Testnet
                <span style={{ marginLeft: 12, color: "#444" }}>USDC contract: {ARC_CONTRACTS.USDC.slice(0, 12)}…</span>
              </div>
            )}

            {txHash && isConfirming && (
              <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 12, fontFamily: "monospace", wordBreak: "break-all" }}>
                Confirming: {txHash.slice(0, 20)}…
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} disabled={isProcessing} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 12, padding: "12px 0", fontSize: 13, cursor: isProcessing ? "not-allowed" : "pointer" }}>Cancel</button>
              <button onClick={handleApprove} disabled={isProcessing}
                style={{ flex: 2, background: isProcessing ? "#5a2aad" : "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 600, cursor: isProcessing ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {isSending     && <><Spinner /> Confirm in wallet…</>}
                {isConfirming  && <><Spinner /> Confirming on-chain…</>}
                {!isProcessing && `Pay $${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { isConnected, chain, address } = useAccount();
  const fileRef = useRef<HTMLInputElement>(null);
  const [anonUser, setAnonUser] = useState<AnonUser | null>(null);
  useEffect(() => { setAnonUser(loadAnonUser()); }, []);

  const [imageUrl,   setImageUrl]   = useState<string | null>(null);
  const [imageName,  setImageName]  = useState("");
  const [showGate,   setShowGate]   = useState(false);
  const [approved,   setApproved]   = useState(false);
  const [running,    setRunning]     = useState(false);
  const [done,       setDone]        = useState(false);
  const [dragging,   setDragging]    = useState(false);
  const [spentTotal, setSpentTotal]  = useState(0);
  const [activeTab,  setActiveTab]   = useState<"tasks" | "report" | "full-report">("tasks");
  const [report,     setReport]      = useState<ReportData | null>(null);
  const [savedOk,    setSavedOk]     = useState(false);

  const [taskStates, setTaskStates] = useState<Record<TaskId, TaskState>>(
    Object.fromEntries(ANALYSIS_TASKS.map(t => [t.id, { status: "waiting" }])) as Record<TaskId, TaskState>
  );

  const updateTask = (id: TaskId, patch: Partial<TaskState>) =>
    setTaskStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageName(file.name);
    setImageUrl(URL.createObjectURL(file));
    setDone(false); setApproved(false); setSpentTotal(0);
    setTaskStates(Object.fromEntries(ANALYSIS_TASKS.map(t => [t.id, { status: "waiting" }])) as Record<TaskId, TaskState>);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) loadFile(f);
  }, []);

  const runAllTasks = async () => {
    setShowGate(false);
    setRunning(true);
    setSavedOk(false);

    const completedTasks: ReportData["tasks"] = [];

    for (const task of ANALYSIS_TASKS) {
      updateTask(task.id, { status: "paying" });
      await new Promise(r => setTimeout(r, 400));
      const txHash = mockTx();
      updateTask(task.id, { status: "processing", txHash });
      await new Promise(r => setTimeout(r, TASK_DURATION[task.id]));
      const result = TASK_RESULTS[task.id];
      updateTask(task.id, { status: "done", txHash, result });
      completedTasks.push({ id: task.id, label: task.label, price: task.price, txHash, result });
      setSpentTotal(prev => +(prev + task.price).toFixed(6));
    }

    // Build full report
    const reportTx = completedTasks.find(t => t.id === "report")?.txHash || mockTx();
    const now = new Date().toISOString();
    const newReport: ReportData = {
      reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
      imageId:  `IMG-${Date.now().toString(36).toUpperCase()}`,
      createdAt: now,
      walletAddress: address || "0x0000000000000000000000000000000000000000",
      imageName,
      totalPaid: TOTAL_ANALYSIS_PRICE,
      proofTxHash: reportTx,
      tasks: completedTasks,
      skus: MOCK_SKUS.map(s => ({
        sku: s.sku, product: s.product, brand: s.brand, category: s.category,
        packSpec: s.packSpec, facings: s.facings, priceVND: s.priceVND,
        matchedCompany: s.matchedCompany, status: s.status,
        confidence: s.scores.brand + s.scores.text + s.scores.size + s.scores.category + s.scores.visual,
      })),
      shelfShare: [
        { brand: "Calofic (Meizan + Cái Lân)", pct: 55 },
        { brand: "Tường An (Neptune Light)",   pct: 30 },
        { brand: "Unknown brand",              pct: 15 },
      ],
      recommendations: [
        "Move Neptune Light to eye-level row 1 — maximize premium brand visibility",
        "Expand Calofic shelf space by 2 facings — current 55% share under-represented",
        "Identify unknown left-column brand — send field audit to capture SKU details",
        "Reorder Neptune Light row 3 — stock level critical (2 facings only)",
      ],
      stockRisk: [
        "Neptune Light row 3: only 2 facings remaining — reorder recommended",
      ],
    };

    setReport(newReport);
    setRunning(false);
    setDone(true);
    setActiveTab("full-report");
  };

  const handleRunClick = () => {
    if (!imageUrl || running) return;
    if (!approved) {
      setShowGate(true);
    } else {
      runAllTasks();
    }
  };

  const wrongChain = isConnected && chain?.id !== arcTestnet.id;
  const card: React.CSSProperties = { background: "#111", border: "1px solid #1f1f1f", borderRadius: 16 };

  const completedTasks = ANALYSIS_TASKS.filter(t => taskStates[t.id].status === "done").length;
  const reportTask = taskStates["report"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#080808", color: "#f0f0f0", fontFamily: "inherit" }}>

      {showGate && (
        <PaymentGateModal
          onPaid={() => { setApproved(true); runAllTasks(); }}
          onClose={() => setShowGate(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: "#0a0a0a", borderRight: "1px solid #1f1f1f", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid #1f1f1f" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.04em" }}>storescope</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", letterSpacing: "-0.04em" }}>.ai</span>
          </a>
        </div>
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Dashboard",   href: "/dashboard",          active: false },
            { label: "AI Analysis", href: "/dashboard/analysis", active: true  },
            { label: "Store Layout",href: "/layout-editor",      active: false },
            { label: "Forum",       href: "/forum",              active: false },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: "block", padding: "9px 12px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: item.active ? 600 : 400, background: item.active ? "rgba(124,58,237,0.12)" : "transparent", color: item.active ? "#a78bfa" : "#666", border: item.active ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent" }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "12px 10px", borderTop: "1px solid #1f1f1f" }}>
          <Link href="/" style={{ display: "block", padding: "8px 12px", fontSize: 12, color: "#555", textDecoration: "none" }}>Log out</Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid #1f1f1f", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 3 }}>10 Micro-Tasks · ARC Testnet</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Shelf Image Analysis</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {anonUser && <AnonBadge user={anonUser} onSignOut={() => setAnonUser(null)} />}
            <WalletButton />
          </div>
        </header>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Top grid */}
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

            {/* Left: upload + controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Upload zone */}
              <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
                onClick={() => !running && fileRef.current?.click()}
                style={{ border: `2px dashed ${dragging ? "#7c3aed" : "#2a2a2a"}`, borderRadius: 16, cursor: running ? "default" : "pointer", overflow: "hidden", background: dragging ? "rgba(124,58,237,0.05)" : "#0a0a0a", minHeight: 180, transition: "border-color 0.2s" }}>
                {imageUrl ? (
                  <img src={imageUrl} alt="shelf" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 12 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Drop shelf image here</div>
                      <div style={{ fontSize: 11, color: "#555" }}>JPG · PNG · WEBP</div>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} style={{ display: "none" }} />
              </div>

              {/* File + budget */}
              {imageUrl && (
                <div style={{ ...card, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "#555" }}>File: <span style={{ color: "#e0e0e0", fontWeight: 500 }}>{imageName}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>Total budget</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#a78bfa" }}>${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC</div>
                    </div>
                    {running && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>Spent so far</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24" }}>${spentTotal.toFixed(3)}</div>
                      </div>
                    )}
                    {done && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#4ade80", marginBottom: 2 }}>Total paid ✓</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80" }}>${spentTotal.toFixed(3)}</div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {(running || done) && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginBottom: 4 }}>
                        <span>{completedTasks}/{ANALYSIS_TASKS.length} tasks</span>
                        <span>{Math.round((completedTasks / ANALYSIS_TASKS.length) * 100)}%</span>
                      </div>
                      <div style={{ height: 6, background: "#1f1f1f", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(completedTasks / ANALYSIS_TASKS.length) * 100}%`, background: done ? "#4ade80" : "#7c3aed", borderRadius: 99, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Run button */}
              <button onClick={handleRunClick} disabled={!imageUrl || running}
                style={{
                  background: !imageUrl || running ? "#1a1a1a" : done ? "#16a34a" : "#7c3aed",
                  color: !imageUrl || running ? "#555" : "#fff",
                  border: "none", borderRadius: 12, padding: "13px 0",
                  fontSize: 13, fontWeight: 600, cursor: imageUrl && !running ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s",
                }}
                onMouseEnter={e => { if (imageUrl && !running) e.currentTarget.style.background = done ? "#15803d" : "#6d28d9"; }}
                onMouseLeave={e => { if (imageUrl && !running) e.currentTarget.style.background = done ? "#16a34a" : "#7c3aed"; }}>
                {running ? <><Spinner /> Running {ANALYSIS_TASKS.find(t => taskStates[t.id].status === "paying" || taskStates[t.id].status === "processing")?.label ?? "…"}</> :
                 done ? "✓ Analysis Complete" :
                 !isConnected ? "Connect Wallet & Analyze" :
                 wrongChain ? "Switch to ARC Testnet" :
                 `Analyze · $${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC`}
              </button>

              {imageUrl && !isConnected && (
                <div style={{ fontSize: 11, color: "#555", textAlign: "center" }}>
                  Connect wallet in the header to pay on ARC Testnet
                </div>
              )}

              {/* Proof record */}
              {done && reportTask.txHash && (
                <div style={{ ...card, padding: "12px 14px", borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.04)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#4ade80", marginBottom: 6 }}>Proof on ArcScan</div>
                  <a href={`https://testnet.arcscan.app/tx/${reportTask.txHash}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 10, color: "#7c3aed", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "none" }}>
                    {reportTask.txHash.slice(0, 30)}…{reportTask.txHash.slice(-8)} ↗
                  </a>
                </div>
              )}
            </div>

            {/* Right: task list */}
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>10 Micro-Tasks</div>
                <div style={{ fontSize: 11, color: "#555" }}>Each task = 1 on-chain transaction · ARC Testnet</div>
              </div>

              <div>
                {ANALYSIS_TASKS.map((task, i) => {
                  const ts = taskStates[task.id];
                  const isActive = ts.status === "paying" || ts.status === "processing";
                  return (
                    <div key={task.id} style={{
                      display: "grid", gridTemplateColumns: "36px 1fr 70px 40px",
                      gap: 12, padding: "14px 20px", alignItems: "flex-start",
                      borderBottom: i < ANALYSIS_TASKS.length - 1 ? "1px solid #111" : "none",
                      background: isActive ? "rgba(124,58,237,0.04)" : "transparent",
                      transition: "background 0.3s",
                    }}>
                      {/* Status icon */}
                      <div style={{ display: "flex", justifyContent: "center", paddingTop: 2 }}>
                        {ts.status === "waiting" && (
                          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#444", fontWeight: 700 }}>{i + 1}</div>
                        )}
                        {ts.status === "paying" && (
                          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #fbbf24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Spinner />
                          </div>
                        )}
                        {ts.status === "processing" && (
                          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Spinner />
                          </div>
                        )}
                        {ts.status === "done" && (
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#4ade80" }}>✓</div>
                        )}
                      </div>

                      {/* Task info */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: ts.status === "done" ? "#f0f0f0" : isActive ? "#a78bfa" : "#888" }}>{task.label}</span>
                          {ts.status === "paying" && <span style={{ fontSize: 10, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", padding: "1px 8px", borderRadius: 999 }}>Paying…</span>}
                          {ts.status === "processing" && <span style={{ fontSize: 10, color: "#7c3aed", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", padding: "1px 8px", borderRadius: 999 }}>Processing…</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#555" }}>{task.desc}</div>
                        {ts.result && <div style={{ fontSize: 11, color: "#4ade80", marginTop: 4 }}>{ts.result}</div>}
                        {ts.txHash && ts.status === "done" && (
                          <a href={`https://testnet.arcscan.app/tx/${ts.txHash}`} target="_blank" rel="noreferrer"
                            style={{ fontSize: 10, color: "#444", fontFamily: "monospace", textDecoration: "none", marginTop: 3, display: "block" }}>
                            tx: {ts.txHash.slice(0, 16)}… ↗
                          </a>
                        )}
                      </div>

                      {/* Price */}
                      <div style={{ textAlign: "right", paddingTop: 2 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ts.status === "done" ? "#4ade80" : isActive ? "#fbbf24" : "#555" }}>
                          ${task.price.toFixed(3)}
                        </div>
                        <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>USDC</div>
                      </div>

                      {/* Mini status bar */}
                      <div style={{ paddingTop: 4 }}>
                        {isActive && (
                          <div style={{ width: "100%", height: 4, background: "#1f1f1f", borderRadius: 99, overflow: "hidden" }}>
                            <TaskProgressBar />
                          </div>
                        )}
                        {ts.status === "done" && (
                          <div style={{ width: "100%", height: 4, background: "rgba(34,197,94,0.2)", borderRadius: 99 }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer total */}
              <div style={{ padding: "14px 20px", borderTop: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0a0a" }}>
                <span style={{ fontSize: 12, color: "#555" }}>{completedTasks} of {ANALYSIS_TASKS.length} tasks complete</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#555" }}>Total:</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: done ? "#4ade80" : "#a78bfa" }}>
                    ${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Report */}
          {done && (
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #1f1f1f" }}>
                {([["tasks", "Task Log"], ["report", "Analysis Report"], ["full-report", "Full Report"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} style={{ padding: "13px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: activeTab === id ? "rgba(124,58,237,0.08)" : "transparent", color: activeTab === id ? "#a78bfa" : "#555", borderBottom: activeTab === id ? "2px solid #7c3aed" : "2px solid transparent", transition: "all 0.2s" }}>
                    {label}
                    {id === "full-report" && <span style={{ marginLeft: 6, fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.1)", padding: "1px 6px", borderRadius: 999 }}>NEW</span>}
                  </button>
                ))}
              </div>
              <div style={{ padding: 24 }}>
                {activeTab === "tasks" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ANALYSIS_TASKS.map(task => {
                      const ts = taskStates[task.id];
                      return (
                        <div key={task.id} style={{ display: "grid", gridTemplateColumns: "20px 1fr 80px 200px", gap: 14, padding: "10px 14px", background: "#0a0a0a", borderRadius: 10, alignItems: "center" }}>
                          <span style={{ color: "#4ade80", fontSize: 12 }}>✓</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f0" }}>{task.label}</div>
                            {ts.result && <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{ts.result}</div>}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", textAlign: "right" }}>${task.price.toFixed(3)}</span>
                          <a href={`https://testnet.arcscan.app/tx/${ts.txHash}`} target="_blank" rel="noreferrer"
                            style={{ fontSize: 10, color: "#555", fontFamily: "monospace", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ts.txHash?.slice(0, 20)}… ↗
                          </a>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 14px 0" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>Total paid: ${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC</span>
                    </div>
                  </div>
                )}

                {activeTab === "report" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Image ID",       value: "IMG-20260426-0091" },
                        { label: "Report ID",       value: "RPT-5042002-0091" },
                        { label: "SKUs Detected",   value: "7 SKUs" },
                        { label: "Shelf Rows",       value: "3 rows · 40 facings" },
                        { label: "Shelf Share #1",   value: "Calofic — 55%" },
                        { label: "Stock Risk",       value: "Neptune Light row 3" },
                      ].map(s => (
                        <div key={s.label} style={{ padding: "12px 14px", background: "#0a0a0a", borderRadius: 10 }}>
                          <div style={{ fontSize: 10, color: "#555", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: "16px 18px", background: "#0a0a0a", borderRadius: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", marginBottom: 10 }}>AI Recommendations</div>
                      {[
                        "Move Neptune Light to eye-level (row 1) to maximize premium brand visibility",
                        "Expand Calofic shelf space by 2 facings — current 55% share under-represented at row 3",
                        "Identify unknown left-column brand — send field audit to capture SKU details",
                        "Reorder Neptune Light row 3: stock level critical (2 facings only)",
                      ].map((r, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 3 ? 8 : 0, fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>
                          <span style={{ color: "#7c3aed", flexShrink: 0 }}>→</span>
                          {r}
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: "14px 16px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#4ade80", marginBottom: 8 }}>Blockchain Proof</div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Final report hash recorded on ARC Testnet. Immutable, verifiable.</div>
                      <a href={`https://testnet.arcscan.app/tx/${reportTask.txHash}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "none" }}>
                        {reportTask.txHash} ↗
                      </a>
                    </div>
                  </div>
                )}

                {activeTab === "full-report" && report && (
                  <div style={{ padding: 24 }}>
                    {savedOk && (
                      <div style={{ marginBottom: 16, padding: "10px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, fontSize: 13, color: "#4ade80", display: "flex", alignItems: "center", gap: 8 }}>
                        ✓ Report saved to your account. View it in{" "}
                        <Link href="/dashboard/reports" style={{ color: "#4ade80", fontWeight: 600 }}>My Reports</Link>
                      </div>
                    )}
                    <AnalysisReport
                      report={report}
                      onSaved={() => setSavedOk(true)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!imageUrl && (
            <div style={{ ...card, padding: 48, textAlign: "center" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5" style={{ margin: "0 auto 16px", display: "block" }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
              <div style={{ fontSize: 14, color: "#555", marginBottom: 8 }}>Upload a shelf image to begin</div>
              <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}>
                10 micro-tasks · Each task is a separate USDC transaction on ARC Testnet<br/>
                Total: <strong style={{ color: "#a78bfa" }}>${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC</strong> per analysis
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Micro components ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

function TaskProgressBar() {
  const [w, setW] = useState(0);
  useEffect(() => { setW(0); const t = setTimeout(() => setW(100), 30); return () => clearTimeout(t); }, []);
  return <div style={{ height: "100%", background: "#7c3aed", borderRadius: 99, width: `${w}%`, transition: "width 1.5s ease" }} />;
}
