"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAccount, useConnect, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ANALYSIS_TASKS, TOTAL_ANALYSIS_PRICE, toUSDCUnits, arcTestnet, ARC_CONTRACTS, ERC20_ABI, type TaskId } from "../../_lib/arc";
import AnalysisReport, { type ReportData } from "../../_components/AnalysisReport";
import { loadAnonUser, type AnonUser } from "../../_lib/anonymousAuth";
import { loadCircleSession, type CircleSession } from "../../_lib/circle";
import { loadProfile, type UserProfile } from "../../_lib/profile";
import { useLang } from "../../_lib/i18n";
import LanguageSwitcher from "../../_components/LanguageSwitcher";

const ProfileModal = dynamic(() => import("../../_components/ProfileModal"), { ssr: false });

const AnonBadge = dynamic(() => import("../../_components/AnonBadge"), { ssr: false });
const WalletButton = dynamic(() => import("../../_components/WalletButton"), { ssr: false });
const CircleWalletButton = dynamic(() => import("../../_components/CircleWalletButton"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = "waiting" | "paying" | "processing" | "done" | "skipped";
type PayStep = "idle" | "connect" | "wrong_chain" | "confirm" | "approving" | "paid" | "error" | "pending";

interface TaskState {
  status: TaskStatus;
  txHash?: string;
  result?: string;
}

// TASK_RESULTS is generated inside component using t() — see getTaskResults()
const TASK_IDS: TaskId[] = ["upload","quality","shelf_detect","sku_detect","competitor","stock_risk","layout_sim","recommend","human_review","report"];

const TASK_DURATION: Record<TaskId, number> = {
  upload: 700, quality: 900, shelf_detect: 1800, sku_detect: 2200,
  competitor: 1400, stock_risk: 900, layout_sim: 1600, recommend: 1200,
  human_review: 600, report: 1000,
};


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

function PaymentGateModal({ onPaid, onClose, circleSession, onCirclePaid }: {
  onPaid: () => void;
  onClose: () => void;
  circleSession: CircleSession | null;
  onCirclePaid?: (circleTxId: string) => void;
}) {
  const { t } = useLang();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // Chon phuong thuc thanh toan: 'metamask' hoac 'circle'
  const [payMethod, setPayMethod] = useState<"metamask" | "circle">(() =>
    circleSession ? "circle" : "metamask"
  );

  const [step, setStep] = useState<PayStep>(() => {
    if (circleSession) return "confirm";
    if (!isConnected) return "connect";
    if (chain?.id !== arcTestnet.id) return "wrong_chain";
    return "confirm";
  });
  const [errMsg, setErrMsg] = useState("");
  const [circleTxHash, setCircleTxHash] = useState<string | null>(null);

  // MetaMask USDC transfer
  const { writeContract, data: txHash, isPending: isSending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

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
    if (payMethod === "circle" && circleSession) {
      handleCirclePay();
    } else {
      setStep("approving");
      writeContract({
        address: ARC_CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [ARC_CONTRACTS.SERVICE_WALLET, toUSDCUnits(TOTAL_ANALYSIS_PRICE)],
        chainId: arcTestnet.id,
      });
    }
  };

  const handleCirclePay = async () => {
    if (!circleSession) return;
    setStep("approving");
    try {
      const res = await fetch("/api/circle/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: circleSession.walletId,
          destinationAddress: ARC_CONTRACTS.SERVICE_WALLET,
          amount: TOTAL_ANALYSIS_PRICE.toString(),
          taskName: "analysis-full",
        }),
      });
      const data = await res.json();
      console.log("[Circle Payment] Initial response:", data);

      if (res.status === 402) {
        setErrMsg(
          `Your Circle Wallet has no USDC yet.\n\n` +
          `Address: ${circleSession.walletAddress}\n\n` +
          `Steps:\n1. Go to faucet.circle.com\n2. Select "ARC Testnet"\n3. Paste your address above\n4. Request USDC\n5. Wait ~30s then retry`
        );
        setStep("error");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Circle transfer failed");

      const txId = data.txId ?? "";
      if (!txId) throw new Error("No txId in response");

      setCircleTxHash(data.txHash ?? txId);

      // Poll /api/circle/status:
      // - Vercel production: webhook fires → store updated → instant response
      // - Local dev: fallback to Circle API each poll
      // Poll every 1s for first 10s, then every 2s up to 60s total
      let confirmed = false;
      const intervals = [
        ...Array(10).fill(1000),  // first 10s: every 1s
        ...Array(25).fill(2000),  // next 50s:  every 2s
      ];
      for (let i = 0; i < intervals.length; i++) {
        await new Promise(r => setTimeout(r, intervals[i]));
        const statusRes = await fetch(`/api/circle/status?txId=${txId}`);
        const statusData = await statusRes.json() as { state?: string; txHash?: string };
        console.log(`[Circle Payment] Poll ${i + 1} (${intervals[i]}ms):`, statusData);

        if (statusData.state === "CONFIRMED" || statusData.state === "SENT") {
          confirmed = true;
          if (statusData.txHash) setCircleTxHash(statusData.txHash);
          break;
        }
        if (statusData.state === "FAILED" || statusData.state === "DENIED") {
          throw new Error(`Transaction ${statusData.state?.toLowerCase()}. Please try again.`);
        }
      }

      if (!confirmed) {
        setErrMsg(`Transfer sent but still pending confirmation (txId: ${txId.slice(0, 16)}…). The payment was submitted — click "Continue anyway" to proceed.`);
        setStep("pending");
        return;
      }

      console.log("[Circle Payment] Transfer confirmed!");
      setStep("paid");
      onCirclePaid?.(txId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Circle payment failed";
      console.error("[Circle Payment] Error:", errMsg);
      setErrMsg(errMsg);
      setStep("error");
    }
  };

  const effectiveTxHash = payMethod === "circle" ? circleTxHash : (txHash ?? null);
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
            <h3 className="done-amount-text" style={{ margin: "0 0 8px", fontSize: 18 }}>{t("pay.paid")}</h3>
            <p style={{ color: "#888", fontSize: 17, lineHeight: 1.6, margin: "0 0 4px" }}>
              <strong style={{ color: "#f0f0f0" }}>${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC</strong> {t("pay.paidSub")}{" "}
              <span style={{ color: payMethod === "circle" ? "#818cf8" : "#f0f0f0" }}>
                {payMethod === "circle" ? "Circle Wallet" : "MetaMask"}
              </span>
            </p>
            {effectiveTxHash && (
              <a href={`https://testnet.arcscan.app/tx/${effectiveTxHash}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-block", fontSize: 11, color: "#7c3aed", fontFamily: "monospace", wordBreak: "break-all", marginBottom: 20, textDecoration: "none" }}>
                {effectiveTxHash.slice(0, 28)}…{effectiveTxHash.slice(-8)} ↗
              </a>
            )}
            <button onClick={onPaid} style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {t("pay.startBtn")}
            </button>
          </div>

        ) : step === "connect" ? (
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>{t("pay.connectTitle")}</h3>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 20px" }}>{t("pay.connectSub")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {connectors.map(c => (
                <button key={c.id} onClick={() => connect({ connector: c, chainId: arcTestnet.id })}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", ...inputStyle, color: "#f0f0f0", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid #2a2a2a" }}>
                  <span style={{ fontSize: 20 }}>{c.name.toLowerCase().includes("metamask") ? "🦊" : "💼"}</span>
                  {c.name}
                </button>
              ))}
            </div>
            <button onClick={onClose} style={{ display: "block", width: "100%", marginTop: 12, background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 12, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>{t("pay.cancel")}</button>
          </div>

        ) : step === "wrong_chain" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 16, color: "#fbbf24" }}>⚠</div>
            <h3 style={{ margin: "0 0 8px", color: "#fbbf24" }}>{t("pay.wrongNet")}</h3>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 20px" }}>{t("pay.wrongNetSub")}</p>
            <button onClick={() => switchChain({ chainId: arcTestnet.id })} disabled={isSwitching}
              style={{ width: "100%", background: "#b45309", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: isSwitching ? "wait" : "pointer" }}>
              {isSwitching ? t("pay.switching") : t("pay.switchBtn")}
            </button>
            <button onClick={onClose} style={{ display: "block", width: "100%", marginTop: 10, background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 12, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>{t("pay.cancel")}</button>
          </div>

        ) : step === "error" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12, color: "#f87171" }}>✗</div>
            <p style={{ color: "#f87171", fontSize: 13, whiteSpace: "pre-line" }}>{errMsg}</p>
            <button onClick={() => setStep("confirm")} style={{ marginTop: 16, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>{t("pay.tryAgain")}</button>
          </div>

        ) : step === "pending" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12, color: "#fbbf24" }}>⏳</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#fbbf24" }}>{t("pay.transferred")}</h3>
            <p style={{ color: "#888", fontSize: 13, whiteSpace: "pre-line", lineHeight: 1.6 }}>{errMsg}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setStep("confirm")} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 12, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>{t("pay.tryAgain")}</button>
              <button onClick={() => { setStep("paid"); }} style={{ flex: 2, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("pay.continueAnyway")}</button>
            </div>
          </div>

        ) : (
          /* ── Confirm ── */
          <>
            <div style={{ marginBottom: 22 }}>
              <div className="analysis-page-tag" style={{ fontSize: 10, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>ARC Network · USDC</div>
              <h3 className="analysis-page-title" style={{ margin: "0 0 6px", fontSize: 18 }}>{t("pay.title")}</h3>
              <p style={{ color: "#555", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                {t("pay.subtitle").replace("$PRICE", TOTAL_ANALYSIS_PRICE.toFixed(3))}
              </p>
            </div>

            {/* Task list with prices */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #1f1f1f", display: "grid", gridTemplateColumns: "1fr 70px", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("pay.taskCol")}</span>
                <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>{t("pay.priceCol")}</span>
              </div>
              {ANALYSIS_TASKS.map((task, i) => (
                <div key={task.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8, padding: "9px 16px", borderBottom: i < ANALYSIS_TASKS.length - 1 ? "1px solid #111" : "none", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#e0e0e0" }}>{t(`task.${task.id}.label`)}</span>
                  <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, textAlign: "right" }}>${task.price.toFixed(3)}</span>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8, padding: "12px 16px", borderTop: "1px solid #2a2a2a", background: "rgba(124,58,237,0.06)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{t("pay.totalRow")}</span>
                <span className="analysis-cost-text" style={{ fontSize: 16, fontWeight: 800, textAlign: "right" }}>${TOTAL_ANALYSIS_PRICE.toFixed(3)}</span>
              </div>
            </div>

            {/* Payment method selector */}
            {circleSession && isConnected && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {(["circle", "metamask"] as const).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    style={{
                      padding: "10px 12px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${payMethod === m ? (m === "circle" ? "rgba(99,102,241,0.5)" : "rgba(124,58,237,0.5)") : "#2a2a2a"}`,
                      background: payMethod === m ? (m === "circle" ? "rgba(99,102,241,0.1)" : "rgba(124,58,237,0.1)") : "transparent",
                      color: payMethod === m ? (m === "circle" ? "#818cf8" : "#a78bfa") : "#555",
                    }}>
                    {m === "circle" ? "Circle Wallet" : "MetaMask"}
                  </button>
                ))}
              </div>
            )}

            {/* Wallet info */}
            {payMethod === "circle" && circleSession ? (
              <div style={{ fontSize: 15, color: "#555", padding: "10px 14px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, marginBottom: 16 }}>
                <span style={{ color: "#818cf8" }}>●</span> {circleSession.walletAddress.slice(0, 8)}…{circleSession.walletAddress.slice(-6)} · Circle Wallet · ARC Testnet
              </div>
            ) : isConnected ? (
              <div style={{ fontSize: 15, color: "#555", padding: "10px 14px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8, marginBottom: 16 }}>
                <span style={{ color: "#4ade80" }}>●</span> {address?.slice(0, 8)}…{address?.slice(-6)} · MetaMask · ARC Testnet
              </div>
            ) : null}

            {txHash && isConfirming && (
              <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 12, fontFamily: "monospace", wordBreak: "break-all" }}>
                {t("pay.confirming")}: {txHash.slice(0, 20)}…
              </div>
            )}
            {step === "approving" && payMethod === "circle" && (
              <div style={{ fontSize: 12, color: "#818cf8", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #818cf8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                {t("pay.circleConfirm")}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} disabled={isProcessing} style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: 12, padding: "12px 0", fontSize: 13, cursor: isProcessing ? "not-allowed" : "pointer" }}>{t("pay.cancel")}</button>
              <button onClick={handleApprove} disabled={isProcessing}
                style={{ flex: 2, background: isProcessing ? "#5a2aad" : "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 600, cursor: isProcessing ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {isSending     && <><Spinner /> {t("pay.confirmIn")}</>}
                {isConfirming  && <><Spinner /> {t("pay.confirming")}</>}
                {step === "approving" && payMethod === "circle" && <><Spinner /> {t("pay.circleConfirm")}</>}
                {!isProcessing && `${t("pay.payBtn")} $${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC`}
              </button>
            </div>
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { t } = useLang();

  // Task results fallback — translated
  const TASK_RESULTS: Record<TaskId, string> = {
    upload:       t("task.result.upload"),
    quality:      t("task.result.quality"),
    shelf_detect: t("task.result.shelf_detect"),
    sku_detect:   t("task.result.sku_detect"),
    competitor:   t("task.result.competitor"),
    stock_risk:   t("task.result.stock_risk"),
    layout_sim:   t("task.result.layout_sim"),
    recommend:    t("task.result.recommend"),
    human_review: t("task.result.human_review"),
    report:       t("task.result.report"),
  };

  // Translated task labels/descs (override arc.ts English labels)
  const TASK_I18N: Record<TaskId, { label: string; desc: string }> = {
    upload:       { label: t("task.upload.label"),       desc: t("task.upload.desc") },
    quality:      { label: t("task.quality.label"),      desc: t("task.quality.desc") },
    shelf_detect: { label: t("task.shelf_detect.label"), desc: t("task.shelf_detect.desc") },
    sku_detect:   { label: t("task.sku_detect.label"),   desc: t("task.sku_detect.desc") },
    competitor:   { label: t("task.competitor.label"),   desc: t("task.competitor.desc") },
    stock_risk:   { label: t("task.stock_risk.label"),   desc: t("task.stock_risk.desc") },
    layout_sim:   { label: t("task.layout_sim.label"),   desc: t("task.layout_sim.desc") },
    recommend:    { label: t("task.recommend.label"),    desc: t("task.recommend.desc") },
    human_review: { label: t("task.human_review.label"),desc: t("task.human_review.desc") },
    report:       { label: t("task.report.label"),       desc: t("task.report.desc") },
  };

  const { isConnected, chain, address } = useAccount();
  const fileRef = useRef<HTMLInputElement>(null);
  const [anonUser, setAnonUser] = useState<AnonUser | null>(null);
  const [circleSession, setCircleSession] = useState<CircleSession | null>(null);
  const [profile, setProfile]             = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile]     = useState(false);
  useEffect(() => {
    setAnonUser(loadAnonUser());
    const cs = loadCircleSession();
    setCircleSession(cs);
    setProfile(loadProfile());
    // Chi mo profile modal ngay sau khi tao vi Circle Wallet moi
    const justCreated = sessionStorage.getItem("justCreatedWallet");
    if (cs && justCreated === "1") {
      sessionStorage.removeItem("justCreatedWallet");
      setTimeout(() => setShowProfile(true), 800);
    }
  }, []);

  const [imageUrl,    setImageUrl]    = useState<string | null>(null);
  const [imageName,   setImageName]   = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const taskTxHashesRef = useRef<Record<string, string>>({});
  const [showGate,    setShowGate]    = useState(false);
  const [analysisId,  setAnalysisId]  = useState<string | null>(null);
  const [onChainTx,   setOnChainTx]   = useState<string | null>(null);  // requestAnalysis TX
  const [resultTx,    setResultTx]    = useState<string | null>(null);  // submitResult TX (most important)
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

  const fileObjRef = useRef<File | null>(null);

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    fileObjRef.current = file;
    setImageName(file.name);
    setImageUrl(URL.createObjectURL(file));
    setDone(false); setApproved(false); setSpentTotal(0);
    setAnalysisId(null); setOnChainTx(null); setResultTx(null);
    taskTxHashesRef.current = {};
    setTaskStates(Object.fromEntries(ANALYSIS_TASKS.map(t => [t.id, { status: "waiting" }])) as Record<TaskId, TaskState>);
    // Read base64 for on-chain hash
    const reader = new FileReader();
    reader.onload = e => setImageBase64((e.target?.result as string)?.split(",")[1] ?? null);
    reader.readAsDataURL(file);
  };

  // Helper: call on-chain record endpoint (fire-and-forget, no blocking)
  const recordOnChain = async (stage: string, extra: Record<string, unknown> = {}) => {
    try {
      await fetch("/api/contracts/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, ...extra }),
      });
    } catch { /* non-blocking */ }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) loadFile(f);
  }, []);

  const runAllTasks = async () => {
    setShowGate(false);
    setRunning(true);
    setSavedOk(false);

    // ── Stage 1: Record analysis request on-chain ────────────────────────
    const payer = circleSession?.walletAddress ?? address ?? "0x0000000000000000000000000000000000000000";
    const reqRes = await fetch("/api/contracts/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "request", payer, imageBase64: imageBase64 ?? "" }),
    }).then(r => r.json()).catch(() => ({})) as Record<string, unknown>;

    // Fallback analysisId nếu on-chain call thất bại — đảm bảo task contracts luôn chạy
    const aid: string = (reqRes.analysisId as string | undefined)
      ?? ("0x" + Date.now().toString(16).padStart(64, "0"));
    setAnalysisId(aid);
    if (reqRes.txHash) setOnChainTx(reqRes.txHash as string);

    const completedTasks: ReportData["tasks"] = [];

    // Vision Agent PipelineResult — populated after upload task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let visionData: Record<string, any> = {};

    // Legacy apiData shape (kept for report building compatibility)
    let apiData: {
      detections?:      { brand: string; company: string; confidence: number; source: string }[];
      prices?:          number[];
      shelfShare?:      { brand: string; pct: number }[];
      imageQuality?:    { score: number; issues: string[] };
      recommendations?: string[];
      stockRisks?:      string[];
      rawSummary?:      string;
      model?:           string;
      summary?:         { topBrand: string; priceRange?: { min: number; max: number } | null };
    } = {};
    let ocrText = "";

    for (const task of ANALYSIS_TASKS) {
      updateTask(task.id, { status: "paying" });
      await new Promise(r => setTimeout(r, 400));

      // Show pending placeholder immediately, fire real on-chain tx in background
      updateTask(task.id, { status: "processing", txHash: undefined });

      // Record task payment on-chain — await với timeout 5s để không block quá lâu
      const taskIdCapture = task.id;
      const recordTask = async () => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          const res = await fetch("/api/contracts/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stage:      "task",
              analysisId: aid,
              taskId:     taskIdCapture,
              taskPrice:  task.price,
              payer,
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);
          const d = await res.json() as Record<string, unknown>;
          if (d.txHash) {
            const hash = d.txHash as string;
            taskTxHashesRef.current[taskIdCapture] = hash;
            updateTask(taskIdCapture, { txHash: hash });
            setReport(prev => prev ? {
              ...prev,
              tasks: prev.tasks.map(t => t.id === taskIdCapture ? { ...t, txHash: hash } : t),
            } : prev);
          }
        } catch (err) {
          // Timeout hoặc lỗi khác — tiếp tục, hash sẽ hiện "recording..."
          console.warn(`[Task TX] ${taskIdCapture}:`, err instanceof Error ? err.message : err);
        }
      };
      // Chạy song song với task duration — không await để không block pipeline
      recordTask();
      let result = TASK_RESULTS[task.id];

      // ── TASK 1: Upload → gọi Vision Agent (8-step pipeline) ─────────────
      if (task.id === "upload" && fileObjRef.current) {
        try {
          const fd = new FormData();
          fd.append("image", fileObjRef.current);
          const res = await fetch("/api/vision-agent/analyze", { method: "POST", body: fd });
          if (res.ok) {
            const json = await res.json();
            visionData = json.result ?? {};

            // Map sang apiData shape để tương thích report builder
            const skus    = visionData.step3_skus ?? [];
            const facings = visionData.step4_facings ?? [];
            const sos     = visionData.step6_shelfShare ?? [];
            const osa     = visionData.step7_osa ?? [];
            const recs    = (visionData.step8_recommendations ?? []) as {action:string}[];

            apiData = {
              detections: skus.map((s: {brand:string;company:string;confidence:number}) => ({
                brand: s.brand, company: s.company, confidence: s.confidence, source: "gpt4v",
              })),
              prices: skus.map((s: {price_vnd:number|null}) => s.price_vnd).filter(Boolean) as number[],
              shelfShare: sos.map((s: {brand:string;shareOfShelf:number}) => ({ brand: s.brand, pct: s.shareOfShelf })),
              imageQuality: {
                score:  visionData.step1_quality?.score ?? 80,
                issues: visionData.step1_quality?.issues ?? [],
              },
              recommendations: recs.map((r) => r.action),
              stockRisks: osa.filter((o: {riskLevel:string}) => o.riskLevel !== "none")
                             .map((o: {sku:string;osaNote?:string;action?:string}) => `${o.sku}: ${o.action ?? o.osaNote ?? ""}`),
              rawSummary: visionData.summary ?? "",
              model: visionData.model ?? "gpt-4o",
              summary: {
                topBrand: visionData.topBrand ?? skus[0]?.brand ?? "—",
                priceRange: null,
              },
            };

            const skuCount  = skus.length;
            const totalFacing = visionData.totalFacings ?? facings.reduce((s: number, f: {facingAdjusted:number}) => s + (f.facingAdjusted ?? 0), 0);
            result = `Image registered · ${skuCount} SKUs · ${totalFacing} facings · ${visionData.step2_count?.totalUnits ?? "?"} units`;
          } else {
            result = "Image registered · Vision Agent queued";
          }
        } catch {
          result = "Image registered · Vision Agent unavailable";
        }
      }

      // ── TASK 2: Image quality → Step 1 (quality + perspective) ──────────
      if (task.id === "quality") {
        const q    = visionData.step1_quality;
        const persp = q?.perspective;
        if (q) {
          const perspNote = persp?.shootingAngle > 15
            ? ` · Góc xiên ~${persp.shootingAngle}° (hiệu chỉnh ${persp.correctionFactor}×)`
            : persp ? " · Frontal — không cần hiệu chỉnh" : "";
          const issues = q.issues?.length ? ` · ${q.issues[0]}` : "";
          result = `✓ Quality ${q.score}/100 · ${q.lighting} · ${q.blur}${perspNote}${issues}`;
        }
      }

      // ── TASK 3: Shelf detection → Step 2 (count) + Step 5 (position) ─────
      if (task.id === "shelf_detect") {
        const c = visionData.step2_count;
        const pos = visionData.step5_positions ?? [];
        if (c) {
          const eyeLevel = pos.filter((p: {tier:string}) => p.tier === "eye-level").map((p: {brand:string}) => p.brand).join(", ");
          result = `${c.shelfRows} tầng kệ · ${c.totalUnits} units · depth ~${c.estimatedDepth}` +
            (eyeLevel ? ` · Eye-level: ${eyeLevel}` : "");
        }
      }

      // ── TASK 4: SKU detection → Step 3 + Step 4 (facing) ─────────────────
      if (task.id === "sku_detect") {
        const skus    = visionData.step3_skus ?? [];
        const facings = visionData.step4_facings ?? [];
        if (skus.length > 0) {
          const top3 = facings.slice(0, 3).map((f: {brand:string;facingAdjusted:number}) =>
            `${f.brand} (${f.facingAdjusted} facing)`).join(" · ");
          result = `${skus.length} SKUs · ${top3 || skus.slice(0, 3).map((s: {brand:string}) => s.brand).join(" · ")}`;
        } else {
          result = "No products detected — try a clearer shelf photo";
        }
      }

      // ── TASK 5: Competitor → Step 6 (Share of Shelf) ─────────────────────
      if (task.id === "competitor") {
        const sos = visionData.step6_shelfShare ?? apiData.shelfShare ?? [];
        if (sos.length > 0) {
          const top2 = sos.slice(0, 2);
          result = top2.map((s: {brand:string; shareOfShelf?:number; pct?:number}) =>
            `${s.brand} ${s.shareOfShelf ?? s.pct ?? 0}%`).join(" vs ") +
            ` · Total ${visionData.totalFacings ?? "?"} facings`;
        }
      }

      // ── TASK 6: Stock risk → Step 7 (OSA) ────────────────────────────────
      if (task.id === "stock_risk") {
        const osa = visionData.step7_osa ?? [];
        const risks = osa.filter((o: {riskLevel:string}) => o.riskLevel !== "none");
        if (risks.length > 0) {
          result = risks.slice(0, 2).map((o: {sku:string;riskLevel:string;facingsRemaining:number}) =>
            `⚠ ${o.sku}: ${o.riskLevel.toUpperCase()} (${o.facingsRemaining} left)`).join(" · ");
        } else {
          result = "✓ All SKUs in-stock — no OSA risk detected";
        }
      }

      // ── TASK 7: Layout sim → Step 5 (positions) ──────────────────────────
      if (task.id === "layout_sim") {
        const pos = visionData.step5_positions ?? [];
        if (pos.length > 0) {
          const byTier: Record<string, string[]> = {};
          pos.forEach((p: {tier:string; brand:string}) => {
            if (!byTier[p.tier]) byTier[p.tier] = [];
            byTier[p.tier].push(p.brand);
          });
          result = Object.entries(byTier).map(([tier, brands]) =>
            `${tier}: ${[...new Set(brands)].join(", ")}`).join(" · ");
        }
      }

      // ── TASK 8: Recommendations → Step 8 ─────────────────────────────────
      if (task.id === "recommend") {
        const recs = visionData.step8_recommendations ?? [];
        const high = recs.filter((r: {priority:string}) => r.priority === "high");
        if (high.length > 0) {
          result = high[0].action;
        } else if (recs.length > 0) {
          result = recs[0].action;
        }
      }

      // ── TASK 9: Human review → low confidence SKUs ───────────────────────
      if (task.id === "human_review") {
        const skus = visionData.step3_skus ?? [];
        const low  = skus.filter((s: {confidence:number}) => s.confidence < 75);
        result = low.length > 0
          ? `${low.length} SKUs need review: ${low.map((s: {sku:string}) => s.sku).join(", ")}`
          : "✓ All confidence scores ≥ 75% — no human review needed";
      }

      // ── TASK 10: Final report → summary ───────────────────────────────────
      if (task.id === "report") {
        const sos = visionData.step6_shelfShare ?? [];
        const top  = sos[0];
        result = visionData.summary
          ?? (top ? `Top brand: ${top.brand} ${top.shareOfShelf ?? top.pct ?? 0}% SoS · ${visionData.step3_skus?.length ?? 0} SKUs detected` : TASK_RESULTS.report);
        ocrText = result; // store for legacy compat
      }

      await new Promise(r => setTimeout(r, TASK_DURATION[task.id]));
      updateTask(task.id, { status: "done", result });
      completedTasks.push({
        id: task.id, label: task.label, price: task.price,
        txHash: taskTxHashesRef.current[task.id] ?? undefined,
        result,
      });
      setSpentTotal(prev => +(prev + task.price).toFixed(6));
    }

    const now = new Date().toISOString();
    // Dung analysisId (on-chain) lam imageId chinh xac, proofTxHash la TX thật
    const shortAid = aid ? aid.slice(2, 10).toUpperCase() : Date.now().toString(36).toUpperCase();
    const newReport: ReportData = {
      reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
      imageId:  `IMG-${shortAid}`,
      createdAt: now,
      walletAddress: circleSession?.walletAddress || address || "—",
      imageName,
      totalPaid: TOTAL_ANALYSIS_PRICE,
      proofTxHash: onChainTx ?? "",
      visionPipeline: Object.keys(visionData).length > 0 ? visionData : undefined,
      tasks: completedTasks,
      // ── Build SKUs từ Vision Agent step3 + step4 (facings) ──────────────
      skus: (() => {
        const skus3   = visionData.step3_skus ?? apiData.detections ?? [];
        const facings4 = visionData.step4_facings ?? [];
        if (skus3.length > 0) {
          return skus3.map((s: {brand:string;company:string;sku:string;sector:string;confidence:number;price_vnd:number|null}, i: number) => {
            const facing = facings4.find((f: {sku:string;brand?:string;facingAdjusted:number}) => f.sku === s.sku || f.brand === s.brand);
            return {
              sku:            `SKU-${String(i + 1).padStart(3, "0")}`,
              product:        s.sku ?? s.brand,
              brand:          s.brand,
              category:       s.sector ?? "FMCG",
              packSpec:       "—",
              facings:        facing?.facingAdjusted ?? 1,
              priceVND:       s.price_vnd ?? null,
              matchedCompany: s.company,
              status:         (s.confidence >= 75 ? "Matched" : "Review") as "Matched" | "Review" | "Missing",
              confidence:     s.confidence,
            };
          });
        }
        return MOCK_SKUS.map(s => ({
          sku: s.sku, product: s.product, brand: s.brand, category: s.category,
          packSpec: s.packSpec, facings: s.facings, priceVND: s.priceVND,
          matchedCompany: s.matchedCompany, status: s.status,
          confidence: s.scores.brand + s.scores.text + s.scores.size + s.scores.category + s.scores.visual,
        }));
      })(),

      // ── Shelf share từ Vision Agent step6 ────────────────────────────────
      shelfShare: (() => {
        const sos = visionData.step6_shelfShare ?? [];
        if (sos.length > 0)
          return sos.map((s: {brand:string; shareOfShelf:number}) => ({ brand: s.brand, pct: s.shareOfShelf }));
        return apiData.shelfShare?.length ? apiData.shelfShare : [{ brand: "Unknown", pct: 100 }];
      })(),

      // ── Recommendations từ Vision Agent step8 ────────────────────────────
      recommendations: (() => {
        const recs8 = visionData.step8_recommendations ?? [];
        if (recs8.length > 0)
          return recs8.map((r: {action:string; reason:string}) => `${r.action}${r.reason ? ` — ${r.reason}` : ""}`);
        // Fallback
        const recs: string[] = [];
        const det = apiData.detections || [];
        if (det.length > 1) recs.push(`${det.length} brands detected — review competitor positioning`);
        if (det.length === 0) recs.push("No brands detected — ensure shelf photo is clear and frontal");
        if (recs.length === 0) recs.push("Analysis complete — no critical issues found");
        return recs;
      })(),

      // ── Stock risks từ Vision Agent step7 (OSA) ──────────────────────────
      stockRisk: (() => {
        const osa = visionData.step7_osa ?? [];
        const risks = osa.filter((o: {riskLevel:string}) => o.riskLevel !== "none")
                        .map((o: {sku:string;riskLevel:string;facingsRemaining:number;action:string}) =>
                          `${o.sku} — ${o.riskLevel.toUpperCase()} risk (${o.facingsRemaining} facing remaining): ${o.action}`);
        if (risks.length > 0) return risks;
        if ((visionData.step3_skus?.length ?? 0) === 0)
          return ["No products detected — shelf may be empty or image quality insufficient"];
        return [];
      })(),
    };

    // Đợi tối đa 8s cho các hash chưa về, poll mỗi 500ms
    let waited = 0;
    while (waited < 8000) {
      const missing = ANALYSIS_TASKS.filter(t => !taskTxHashesRef.current[t.id]);
      if (missing.length === 0) break;
      await new Promise(r => setTimeout(r, 500));
      waited += 500;
    }

    // Build report với tất cả hash đã về
    const finalTasks = completedTasks.map(t => ({
      ...t,
      txHash: taskTxHashesRef.current[t.id] ?? t.txHash,
    }));

    setReport({ ...newReport, tasks: finalTasks });
    setRunning(false);
    setDone(true);
    setActiveTab("full-report");

    // ── Stage 3: Submit result hash on-chain ─────────────────────────────
    if (aid) {
      const resultJson = JSON.stringify({ skus: newReport.skus, shelfShare: newReport.shelfShare });
      fetch("/api/contracts/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage:        "result",
          analysisId:   aid,
          resultJson,
          modelVersion: "tesseract+roboflow-fmcg",
          brandCount:   newReport.shelfShare?.length ?? 0,
          skuCount:     newReport.skus?.length ?? 0,
        }),
      })
        .then(r => r.json())
        .then((d: Record<string, unknown>) => {
          if (d.txHash) {
            const rTx = d.txHash as string;
            setResultTx(rTx);
            // Cap nhat proofTxHash trong report voi TX chinh xac nhat (submitResult)
            setReport(prev => prev ? { ...prev, proofTxHash: rTx } : prev);
          }
        })
        .catch(() => {});
    }
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
          circleSession={circleSession}
          onCirclePaid={(circleTxId) => {
            if (analysisId) recordOnChain("payment", { analysisId, circleTxId, pricePaid: TOTAL_ANALYSIS_PRICE });
          }}
        />
      )}

      {showProfile && (
        <ProfileModal onClose={() => { setShowProfile(false); setProfile(loadProfile()); }} />
      )}

      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: "#06060f", borderRight: "1px solid #14142a", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 14px", borderBottom: "1px solid #14142a" }}>
          <a href="/" style={{ textDecoration: "none", display: "flex" }}>
            <img src="/logo.png" alt="StoreScope AI" style={{ height: 73, width: "auto", objectFit: "contain", filter: "invert(1)" }} />
          </a>
        </div>
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { labelKey: "nav.dashboard",   href: "/dashboard",              active: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> },
            { labelKey: "nav.analysis",    href: "/dashboard/analysis",     active: true,  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg> },
            { labelKey: "nav.visionAgent", href: "/dashboard/vision-agent", active: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
            { labelKey: "nav.agent",       href: "/dashboard/agent",        active: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
            { labelKey: "nav.reports",     href: "/dashboard/reports",      active: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
            { labelKey: "nav.layout",      href: "/layout-editor",          active: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
            { labelKey: "nav.forum",       href: "/forum",                  active: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: item.active ? 600 : 400, background: item.active ? "rgba(124,58,237,0.15)" : "transparent", color: item.active ? "#a78bfa" : "#555", border: item.active ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent" }}>
              <span style={{ flexShrink: 0, color: item.active ? "#a78bfa" : "#3a3a5a" }}>{item.icon}</span>
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        {/* Bottom section */}
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid #14142a", display: "flex", flexDirection: "column", gap: 8 }}>
          {circleSession && (
            <button onClick={() => setShowProfile(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, cursor: "pointer", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", transition: "background 0.2s", textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,58,237,0.06)"; }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                {(profile?.username ?? circleSession.userId).slice(0, 1).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.username ?? "Set up profile"}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{circleSession.userId}</p>
              </div>
              {!profile && <span style={{ marginLeft: "auto", flexShrink: 0, width: 7, height: 7, borderRadius: "50%", background: "#f59e0b" }} />}
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.7)", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#d0d0d0" }}>Arc Testnet</div>
              <div style={{ fontSize: 10, color: "#555" }}>Connected</div>
            </div>
          </div>
          <div style={{ padding: "0 4px" }}>
            <LanguageSwitcher variant="sidebar" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid #14142a", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#06060f" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <h2 className="analysis-page-title" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>AI Shelf Intelligence</h2>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#7c3aed" style={{ flexShrink: 0 }}><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/></svg>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.5 }}>
              Upload shelf images and convert retail execution into AI insights and on-chain proof.
            </p>
            {onChainTx && (
              <a href={`https://testnet.arcscan.app/tx/${onChainTx}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 10, color: "#4ade80", textDecoration: "none", fontFamily: "monospace" }}>
                ✓ On-chain: {onChainTx.slice(0, 18)}... ↗ ArcScan
              </a>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {anonUser && <AnonBadge user={anonUser} onSignOut={() => setAnonUser(null)} />}
            <CircleWalletButton onDisconnect={() => setCircleSession(null)} />
            <WalletButton />
            <Link href="/dashboard/reports" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "1px solid #2a2a3e", color: "#888", fontSize: 13, textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
              View Reports
            </Link>
          </div>
        </header>

        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Main two-column grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 390px", gap: 20, alignItems: "start" }}>

            {/* Left: upload + pipeline cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Upload zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !running && !imageUrl && fileRef.current?.click()}
                style={{
                  border: `1.5px solid ${dragging ? "#7c3aed" : imageUrl ? "rgba(124,58,237,0.35)" : "rgba(124,58,237,0.25)"}`,
                  borderRadius: 18, cursor: running || imageUrl ? "default" : "pointer",
                  overflow: "hidden",
                  background: dragging ? "rgba(124,58,237,0.06)" : "linear-gradient(135deg, #0c0c1e 0%, #0f0f2a 50%, #0c0c1e 100%)",
                  minHeight: imageUrl ? 220 : 300,
                  transition: "border-color 0.2s",
                  position: "relative",
                  boxShadow: "0 0 40px rgba(124,58,237,0.08) inset",
                }}>
                {/* Corner accents */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderTop: "2px solid rgba(124,58,237,0.5)", borderLeft: "2px solid rgba(124,58,237,0.5)", borderRadius: "4px 0 0 0" }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: 20, borderTop: "2px solid rgba(124,58,237,0.5)", borderRight: "2px solid rgba(124,58,237,0.5)", borderRadius: "0 4px 0 0" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, width: 20, height: 20, borderBottom: "2px solid rgba(124,58,237,0.5)", borderLeft: "2px solid rgba(124,58,237,0.5)", borderRadius: "0 0 0 4px" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderBottom: "2px solid rgba(124,58,237,0.5)", borderRight: "2px solid rgba(124,58,237,0.5)", borderRadius: "0 0 4px 0" }} />

                {imageUrl ? (
                  <div style={{ position: "relative" }}>
                    <img src={imageUrl} alt="shelf" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#4ade80", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(74,222,128,0.3)", padding: "3px 10px", borderRadius: 999 }}>
                        {imageName}
                      </span>
                      <button onClick={e => { e.stopPropagation(); setImageUrl(null); setImageName(""); setDone(false); setApproved(false); }}
                        style={{ fontSize: 11, color: "#888", background: "rgba(0,0,0,0.7)", border: "1px solid #333", padding: "3px 10px", borderRadius: 999, cursor: "pointer" }}>
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", gap: 18 }}>
                    {/* Holographic upload icon */}
                    <div style={{ position: "relative", width: 88, height: 88 }}>
                      <div style={{ position: "absolute", inset: -18, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)" }} />
                      <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.1))", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.2))", border: "1px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8">
                            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#e0e0e0", letterSpacing: "-0.02em" }}>Upload shelf image</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                        Drop a retail shelf photo here<br />or <span style={{ color: "#7c3aed" }}>click to browse</span>
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                      {["JPG", "PNG", "WEBP", "Max 10MB"].map(f => (
                        <span key={f} style={{ fontSize: 11, color: "#666", background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a3e", padding: "3px 10px", borderRadius: 999 }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} style={{ display: "none" }} />
              </div>

              {/* Budget bar when running */}
              {imageUrl && (running || done) && (
                <div style={{ background: "#0c0c1e", border: "1px solid #14142a", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginBottom: 6 }}>
                      <span>{completedTasks} / {ANALYSIS_TASKS.length} tasks</span>
                      <span style={{ color: done ? "#4ade80" : "#a78bfa" }}>{Math.round((completedTasks / ANALYSIS_TASKS.length) * 100)}%</span>
                    </div>
                    <div style={{ height: 5, background: "#1a1a2e", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(completedTasks / ANALYSIS_TASKS.length) * 100}%`, background: done ? "#4ade80" : "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: 99, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>{done ? "Paid" : "Spent"}</div>
                    <div className={done ? "done-amount-text" : "spent-amount-text"} style={{ fontSize: 16, fontWeight: 700 }}>${spentTotal.toFixed(3)}</div>
                  </div>
                </div>
              )}

              {/* CTA buttons */}
              <button onClick={handleRunClick} disabled={!imageUrl || running}
                style={{
                  background: !imageUrl || running ? "rgba(124,58,237,0.1)" : done ? "linear-gradient(135deg, #16a34a, #15803d)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: !imageUrl || running ? "#555" : "#fff",
                  border: !imageUrl || running ? "1px solid rgba(124,58,237,0.2)" : "none",
                  borderRadius: 12, padding: "14px 0",
                  fontSize: 14, fontWeight: 600, cursor: imageUrl && !running ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9, transition: "opacity 0.2s",
                  boxShadow: imageUrl && !running && !done ? "0 4px 20px rgba(124,58,237,0.35)" : "none",
                }}
                onMouseEnter={e => { if (imageUrl && !running) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                {running ? (
                  <><Spinner /> {ANALYSIS_TASKS.find(task => taskStates[task.id].status === "paying" || taskStates[task.id].status === "processing")?.label ?? "Processing…"}</>
                ) : done ? (
                  "✓ Analysis Complete"
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    {!imageUrl ? "Upload Image to Continue" : !isConnected ? "Connect Wallet & Run Analysis" : wrongChain ? "Switch to ARC Testnet" : "Connect Wallet & Run Analysis"}
                  </>
                )}
              </button>

              {!imageUrl && (
                <button
                  onClick={async () => {
                    const res = await fetch("/shelf-hero.png");
                    const blob = await res.blob();
                    const file = new File([blob], "demo-shelf.png", { type: "image/png" });
                    loadFile(file);
                  }}
                  style={{ background: "transparent", border: "1px solid #2a2a3e", color: "#888", borderRadius: 12, padding: "12px 0", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#4a4a6e"; e.currentTarget.style.color = "#ccc"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.color = "#888"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                  Try Demo Image
                </button>
              )}

              {/* On-chain proof (shown after done) */}
              {done && (onChainTx || resultTx) && (
                <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 10 }}>On-chain Proof — AnalysisRegistry</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {onChainTx && (
                      <div>
                        <div style={{ fontSize: 10, color: "#555", marginBottom: 3 }}>Stage 1 · requestAnalysis()</div>
                        <a href={`https://testnet.arcscan.app/tx/${onChainTx}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 10, color: "#888", fontFamily: "monospace", textDecoration: "none", wordBreak: "break-all" }}>
                          {onChainTx.slice(0, 26)}…{onChainTx.slice(-6)} ↗
                        </a>
                      </div>
                    )}
                    {resultTx ? (
                      <div>
                        <div style={{ fontSize: 10, color: "#4ade80", marginBottom: 3, fontWeight: 600 }}>Stage 3 · submitResult() — Result hash stored ✓</div>
                        <a href={`https://testnet.arcscan.app/tx/${resultTx}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 10, color: "#7c3aed", fontFamily: "monospace", textDecoration: "none", wordBreak: "break-all" }}>
                          {resultTx.slice(0, 26)}…{resultTx.slice(-6)} ↗
                        </a>
                      </div>
                    ) : done && (
                      <div style={{ fontSize: 10, color: "#555", fontStyle: "italic" }}>Stage 3 · submitResult() — recording on-chain...</div>
                    )}
                  </div>
                </div>
              )}

              {/* Pipeline cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, position: "relative" }}>
                {[
                  {
                    num: "01", title: "Upload Image", desc: "Upload a shelf image in seconds.",
                    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.6"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
                  },
                  {
                    num: "02", title: "AI Retail Detection", desc: "Multi-model AI analyzes shelf execution.",
                    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.6"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M8 12h8M8 8h8M8 16h5"/><circle cx="18" cy="18" r="4" fill="#06060f" stroke="#a78bfa"/><path d="M16 18h4M18 16v4" strokeWidth="1.4"/></svg>,
                  },
                  {
                    num: "03", title: "On-chain Proof Report", desc: "Verified insights with on-chain proof.",
                    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
                  },
                ].map((step, i) => (
                  <div key={i} style={{ background: "#0c0c1e", border: "1px solid #14142a", borderRadius: 14, padding: "20px 18px", position: "relative" }}>
                    {/* Connector dot line between cards */}
                    {i < 2 && (
                      <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 2, zIndex: 1 }}>
                        {[0,1,2].map(d => <div key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: "#3a3a5a" }} />)}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>{step.num}</div>
                    <div style={{ marginBottom: 12 }}>{step.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d0d0d0", marginBottom: 6 }}>{step.title}</div>
                    <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 10 Micro-Tasks panel */}
            <div style={{ background: "#0c0c1e", border: "1px solid #14142a", borderRadius: 16, overflow: "hidden" }}>
              {/* Panel header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #14142a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="tasks-header-text" style={{ fontSize: 14, fontWeight: 700 }}>10 Micro-Tasks</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#7c3aed"><path d="M12 2l1.5 4.5H18l-3.75 2.75 1.5 4.5L12 11l-3.75 2.75 1.5-4.5L6 6.5h4.5z"/></svg>
                </div>
                <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.02em" }}>Each task = 1 on-chain transaction</span>
              </div>

              {/* Task rows */}
              <div style={{ overflowY: "auto", maxHeight: 520 }}>
                {ANALYSIS_TASKS.map((task, i) => {
                  const ts = taskStates[task.id];
                  const isActive = ts.status === "paying" || ts.status === "processing";
                  const shortLabels: Record<string, { label: string; desc: string }> = {
                    upload:       { label: "Image Registration",    desc: "Record image on-chain for tracking" },
                    quality:      { label: "Image Quality Audit",   desc: "Detect blur, low-light, wrong angle" },
                    shelf_detect: { label: "Shelf Object Detection", desc: "AI detects shelves, coolers, displays" },
                    sku_detect:   { label: "SKU Recognition",        desc: "AI identifies products, brands, SKUs" },
                    competitor:   { label: "Competitor Visibility",  desc: "Compare company vs competitor" },
                    stock_risk:   { label: "Stock Risk Detection",   desc: "Alert on out-of-stock conditions" },
                    layout_sim:   { label: "Layout Simulation Sync", desc: "Update store simulation from data" },
                    recommend:    { label: "AI Recommendation",      desc: "Suggest display & restocking actions" },
                    human_review: { label: "Human Review Flag",      desc: "Flag tasks needing human review" },
                    report:       { label: "Proof Report Generation",desc: "Generate report & write proof" },
                  };
                  const { label: shortLabel, desc: shortDesc } = shortLabels[task.id] ?? { label: task.label, desc: task.desc };
                  return (
                    <div key={task.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "13px 20px",
                      borderBottom: i < ANALYSIS_TASKS.length - 1 ? "1px solid #0e0e1e" : "none",
                      background: isActive ? "rgba(124,58,237,0.05)" : "transparent",
                      transition: "background 0.3s",
                    }}>
                      {/* Number badge */}
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: ts.status === "done" ? "rgba(34,197,94,0.12)" : isActive ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${ts.status === "done" ? "rgba(74,222,128,0.3)" : isActive ? "rgba(124,58,237,0.35)" : "#1e1e2e"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: ts.status === "done" ? 12 : 10, fontWeight: 700,
                        color: ts.status === "done" ? "#4ade80" : isActive ? "#a78bfa" : "#444",
                      }}>
                        {ts.status === "done" ? "✓" : (ts.status === "paying" || ts.status === "processing") ? <Spinner /> : i + 1}
                      </div>

                      {/* Task info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: ts.status === "done" ? "#d0d0d0" : isActive ? "#a78bfa" : "#888", marginBottom: 2, transition: "color 0.3s" }}>
                          <span className={isActive ? "task-label-active" : ""}>{shortLabel}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#3a3a5a", lineHeight: 1.4 }}>{shortDesc}</div>
                        {ts.result && <div className="task-result-text" style={{ fontSize: 10, color: "#4ade80", marginTop: 2 }}>{ts.result}</div>}
                      </div>

                      {/* Status badge */}
                      {ts.status === "waiting" && (
                        <span style={{ fontSize: 10, color: "#555", background: "rgba(255,255,255,0.03)", border: "1px solid #1e1e2e", padding: "2px 8px", borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="dot-amber" style={{ opacity: 0.4 }} />Pending
                        </span>
                      )}
                      {ts.status === "paying" && (
                        <span className="badge-pop" style={{ fontSize: 10, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", padding: "2px 8px", borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="dot-amber" />Paying
                        </span>
                      )}
                      {ts.status === "processing" && (
                        <span className="badge-pop" style={{ fontSize: 10, color: "#a78bfa", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", padding: "2px 8px", borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="dot-purple" />Processing
                        </span>
                      )}
                      {ts.status === "done" && ts.txHash && (
                        <a href={`https://testnet.arcscan.app/tx/${ts.txHash}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(74,222,128,0.2)", padding: "2px 8px", borderRadius: 999, flexShrink: 0, textDecoration: "none" }}>
                          ✓ Done
                        </a>
                      )}
                      {ts.status === "done" && !ts.txHash && (
                        <span style={{ fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(74,222,128,0.2)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>✓ Done</span>
                      )}

                      {/* Price */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ts.status === "done" ? "#4ade80" : isActive ? "#fbbf24" : "#444" }}>
                          {task.price.toFixed(3)}
                        </div>
                        <div style={{ fontSize: 9, color: "#333", marginTop: 1 }}>USDC</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Panel footer */}
              <div style={{ padding: "14px 20px", borderTop: "1px solid #14142a", background: "#08081a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Estimated on-chain execution cost</div>
                    <div style={{ fontSize: 11, color: "#444" }}>{completedTasks} / {ANALYSIS_TASKS.length} tasks completed</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className={done ? "total-price-green" : "total-price-purple"} style={{ fontSize: 20, fontWeight: 800, color: done ? "#2dd4bf" : "#2dd4bf", lineHeight: 1.1 }}>
                      ${TOTAL_ANALYSIS_PRICE.toFixed(3)}
                    </div>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 600, marginTop: 1 }}>USDC</div>
                  </div>
                </div>
                {(running || done) && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 3, background: "#14142a", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(completedTasks / ANALYSIS_TASKS.length) * 100}%`, background: done ? "#2dd4bf" : "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: 99, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Final Report */}
          {done && (
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #1f1f1f" }}>
                {([["tasks", t("analysis.tabTasks")], ["report", t("analysis.tabReport")], ["full-report", t("analysis.tabFull")]] as const).map(([id, label]) => (
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
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f0" }}>{TASK_I18N[task.id]?.label ?? task.label}</div>
                            {ts.result && <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{ts.result}</div>}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", textAlign: "right" }}>${task.price.toFixed(3)}</span>
                          <span style={{ fontSize: 10, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ts.txHash
                              ? <a href={`https://testnet.arcscan.app/tx/${ts.txHash}`} target="_blank" rel="noreferrer"
                                  style={{ color: "#7c3aed", textDecoration: "none" }}>
                                  {ts.txHash.slice(0, 16)}… ↗
                                </a>
                              : <span style={{ color: "#444" }}>recording on-chain…</span>
                            }
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 14px 0" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>{t("analysis.paidOk")}: ${TOTAL_ANALYSIS_PRICE.toFixed(3)} USDC</span>
                    </div>
                  </div>
                )}

                {activeTab === "report" && report && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Summary stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Report ID",       value: report.reportId },
                        { label: "Image File",      value: report.imageName || "—" },
                        { label: "SKUs Detected",   value: `${report.skus.length} brands` },
                        { label: "Top Brand",       value: report.shelfShare[0]?.brand || "—" },
                        { label: "Price Range",     value: report.skus.some(s => s.priceVND) ? `${Math.min(...report.skus.filter(s=>s.priceVND).map(s=>s.priceVND!)).toLocaleString()}đ – ${Math.max(...report.skus.filter(s=>s.priceVND).map(s=>s.priceVND!)).toLocaleString()}đ` : "No prices detected" },
                        { label: "Analysis Cost",   value: `$${report.totalPaid.toFixed(3)} USDC` },
                      ].map(s => (
                        <div key={s.label} style={{ padding: "12px 14px", background: "#0a0a0a", borderRadius: 10 }}>
                          <div style={{ fontSize: 10, color: "#555", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", wordBreak: "break-all" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Brands detected */}
                    {report.skus.length > 0 && (
                      <div style={{ padding: "16px 18px", background: "#0a0a0a", borderRadius: 12 }}>
                        <div className="tasks-header-text" style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Brands Detected</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {report.skus.map((s, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "#111", borderRadius: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.status === "Matched" ? "#4ade80" : "#fbbf24", flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 600 }}>{s.brand}</span>
                                <span style={{ fontSize: 11, color: "#555", marginLeft: 8 }}>{s.matchedCompany}</span>
                              </div>
                              <span style={{ fontSize: 12, color: "#888" }}>{s.category}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: s.status === "Matched" ? "#4ade80" : "#fbbf24" }}>{s.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shelf share */}
                    {report.shelfShare.length > 0 && (
                      <div style={{ padding: "16px 18px", background: "#0a0a0a", borderRadius: 12 }}>
                        <div className="tasks-header-text" style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Shelf Share</div>
                        {report.shelfShare.map(s => (
                          <div key={s.brand} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                              <span style={{ color: "#e0e0e0" }}>{s.brand}</span>
                              <span style={{ color: "#a78bfa", fontWeight: 700 }}>{s.pct}%</span>
                            </div>
                            <div style={{ height: 6, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${s.pct}%`, background: "#7c3aed", borderRadius: 99 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    <div style={{ padding: "16px 18px", background: "#0a0a0a", borderRadius: 12 }}>
                      <div className="tasks-header-text" style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>AI Recommendations</div>
                      {report.recommendations.map((r, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < report.recommendations.length - 1 ? 8 : 0, fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>
                          <span style={{ color: "#7c3aed", flexShrink: 0 }}>→</span>
                          {r}
                        </div>
                      ))}
                    </div>

                    {/* Blockchain Proof */}
                    <div style={{ padding: "14px 16px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#4ade80", marginBottom: 8 }}>On-chain Proof — AnalysisRegistry</div>
                      {(onChainTx || resultTx) ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {onChainTx && (
                            <div>
                              <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>Stage 1 · requestAnalysis()</div>
                              <a href={`https://testnet.arcscan.app/tx/${onChainTx}`} target="_blank" rel="noreferrer"
                                style={{ fontSize: 11, color: "#888", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "none" }}>
                                {onChainTx.slice(0, 28)}…{onChainTx.slice(-6)} ↗
                              </a>
                            </div>
                          )}
                          {resultTx && (
                            <div>
                              <div style={{ fontSize: 10, color: "#4ade80", marginBottom: 2, fontWeight: 600 }}>Stage 3 · submitResult() — Result hash ✓</div>
                              <a href={`https://testnet.arcscan.app/tx/${resultTx}`} target="_blank" rel="noreferrer"
                                style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "none" }}>
                                {resultTx.slice(0, 28)}…{resultTx.slice(-6)} ↗
                              </a>
                            </div>
                          )}
                          {!resultTx && (
                            <div style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>Stage 3 · recording on-chain...</div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "#555" }}>Not recorded on-chain yet.</div>
                      )}
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
