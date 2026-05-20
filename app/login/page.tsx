"use client";

import Link from "next/link";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { generateAnonUser, saveAnonUser } from "../_lib/anonymousAuth";
import { saveCircleSession } from "../_lib/circle";

const DEMO_USERNAME = "ADmin123";
const DEMO_PASSWORD = "888000";

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
    title: "Store Overview",
    desc:  "Unified visibility across all retail locations",
    color: "#7c3aed",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
      </svg>
    ),
    title: "AI Detection",
    desc:  "Sub-second SKU recognition from shelf photos",
    color: "#818cf8",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    ),
    title: "Live Analytics",
    desc:  "Actionable insights from real-time shelf data",
    color: "#34d399",
  },
];

type Tab = "signin" | "circle" | "anon";

// ── Animated counter ──────────────────────────────────────────────────────────
function CountStat({ to, suffix, label }: { to: number; suffix: string; label: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame = 0; const total = 50;
    const delay = setTimeout(() => {
      const tick = () => {
        frame++;
        setVal(Math.round(to * Math.pow(frame / total, 2)));
        if (frame < total) requestAnimationFrame(tick);
        else setVal(to);
      };
      requestAnimationFrame(tick);
    }, 800);
    return () => clearTimeout(delay);
  }, [to]);
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.03em" }}>
        {val}{suffix}
      </div>
      <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Glowing input ─────────────────────────────────────────────────────────────
function GlowInput({ type = "text", value, onChange, placeholder, required, glowColor = "#7c3aed", autoFocus }: {
  type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; glowColor?: string; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: "relative",
      borderRadius: 12,
      transition: "box-shadow 0.3s",
      boxShadow: focused ? `0 0 0 2px ${glowColor}40, 0 0 20px ${glowColor}20` : "none",
    }}>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: focused ? "#0f0f0f" : "#0a0a0a",
          border: `1px solid ${focused ? glowColor : "#2a2a2a"}`,
          borderRadius: 12, padding: "13px 16px",
          color: "#f0f0f0", fontSize: 14, outline: "none",
          transition: "border-color 0.25s, background 0.25s",
        }}
      />
    </div>
  );
}

// ── Shimmer button ────────────────────────────────────────────────────────────
function ShimmerButton({ onClick, disabled, children, color = "#7c3aed", type = "button" }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode;
  color?: string; type?: "button" | "submit";
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", padding: "13px 0", borderRadius: 12,
        background: disabled ? `${color}66` : hov ? `linear-gradient(135deg,${color},#6366f1)` : color,
        color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", overflow: "hidden",
        transform: hov && !disabled ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov && !disabled ? `0 8px 24px ${color}50` : "none",
        transition: "transform 0.2s, box-shadow 0.2s, background 0.3s",
      }}
    >
      {/* Shimmer sweep */}
      {hov && !disabled && (
        <span style={{
          position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",
          animation: "shimmerSweep 0.7s ease forwards",
          pointerEvents: "none",
        }} />
      )}
      {children}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");
  const [mounted, setMounted] = useState(false);

  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [status,       setStatus]       = useState<"idle"|"loading"|"error"|"success">("idle");
  const [anonLoading,  setAnonLoading]  = useState(false);
  const [circleEmail,  setCircleEmail]  = useState("");
  const [circleStatus, setCircleStatus] = useState<"idle"|"loading"|"error"|"success">("idle");
  const [circleError,  setCircleError]  = useState("");

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleAnonymous = async () => {
    setAnonLoading(true);
    await new Promise(r => setTimeout(r, 600));
    saveAnonUser(generateAnonUser());
    router.push("/dashboard");
  };

  const handleCircleWallet = async (e: FormEvent) => {
    e.preventDefault();
    if (!circleEmail.trim()) return;
    setCircleStatus("loading"); setCircleError("");
    try {
      const userId = circleEmail.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "");
      const res    = await fetch("/api/circle/wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create wallet");
      saveCircleSession({ walletId: data.walletId, walletAddress: data.walletAddress, walletSetId: data.walletSetId, userId: data.userId });
      setCircleStatus("success");
      sessionStorage.setItem("justCreatedWallet", "1");
      setTimeout(() => router.push("/dashboard/analysis"), 600);
    } catch (err) {
      setCircleError(err instanceof Error ? err.message : "Unknown error");
      setCircleStatus("error");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setStatus("loading");
    await new Promise(r => setTimeout(r, 600));
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setStatus("success"); setTimeout(() => router.push("/dashboard"), 500);
    } else { setStatus("error"); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#000", overflow: "hidden" }}>

      {/* ── Animations ── */}
      <style>{`
        @keyframes shimmerSweep { to { left:160%; } }
        @keyframes floatUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gradText {
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }
        @keyframes badgeGlow {
          0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0)}
          50%{box-shadow:0 0 16px 4px rgba(124,58,237,0.2)}
        }
        @keyframes lineIn { from{width:0} to{width:100%} }
        @keyframes cardIn {
          from{opacity:0;transform:translateX(-16px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes rightIn {
          from{opacity:0;transform:translateX(24px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes scanBar {
          0%{transform:translateY(-100%);opacity:0}
          10%{opacity:1}
          90%{opacity:1}
          100%{transform:translateY(600px);opacity:0}
        }
        .feat-card { transition: border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s; }
        .feat-card:hover {
          border-color: rgba(124,58,237,0.35) !important;
          background: rgba(124,58,237,0.06) !important;
          transform: translateX(4px);
          box-shadow: -3px 0 12px rgba(124,58,237,0.15);
        }
        @media (max-width:768px) {
          .login-grid { grid-template-columns:1fr !important; }
          .login-left  { display:none !important; }
        }
      `}</style>

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════════════ */}
      <div className="login-left" style={{
        position: "relative", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "48px 52px",
        background: "#070707", borderRight: "1px solid #141414", overflow: "hidden",
      }}>
        {/* Animated scan bar */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.5),transparent)",
          animation: "scanBar 4s ease-in-out infinite", top: 0,
          pointerEvents: "none",
        }} />

        {/* BG glows */}
        <div style={{ position:"absolute", top:-200, left:-200, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.13) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-100, right:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)", pointerEvents:"none" }} />

        {/* Logo */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-12px)", transition: "all 0.6s ease 0.1s", position: "relative", zIndex: 1 }}>
          <a href="/" style={{ textDecoration:"none", display:"inline-flex", transition:"opacity 0.2s" }}
            onMouseEnter={e=>(e.currentTarget.style.opacity="0.8")}
            onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="StoreScope AI" style={{ height:90, width:"auto", objectFit:"contain", filter:"invert(1)" }} />
          </a>
        </div>

        {/* Hero text */}
        <div style={{ position:"relative", zIndex:1 }}>

          {/* Badge */}
          <div style={{
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.6s ease 0.2s",
          }}>
            <span style={{
              display:"inline-block", marginBottom:20,
              fontSize:10, color:"#a78bfa", textTransform:"uppercase",
              letterSpacing:"0.2em", fontWeight:700,
              padding:"5px 14px", borderRadius:999,
              border:"1px solid rgba(124,58,237,0.35)",
              background:"rgba(124,58,237,0.1)",
              animation:"badgeGlow 3s ease-in-out infinite",
            }}>
              AI-Powered Retail Execution
            </span>
          </div>

          {/* Headline — animated gradient */}
          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "all 0.7s ease 0.35s" }}>
            <h2 style={{ fontSize:"clamp(1.9rem,3.2vw,2.7rem)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.1, margin:"0 0 18px" }}>
              <span style={{ color:"#f0f0f0" }}>Turn shelf photos<br/>into </span>
              <span style={{
                background:"linear-gradient(135deg,#7c3aed 0%,#a78bfa 40%,#818cf8 70%,#7c3aed 100%)",
                backgroundSize:"200% 200%",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                animation:"gradText 3.5s ease infinite",
              }}>
                business intelligence
              </span>
            </h2>
          </div>

          {/* Sub */}
          <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease 0.5s" }}>
            <p style={{ fontSize:14, color:"#777", lineHeight:1.8, maxWidth:380, margin:"0 0 36px" }}>
              Monitor shelves, detect SKUs and optimize store performance with AI built for modern FMCG teams.
            </p>
          </div>

          {/* Accent line */}
          <div style={{ height:1, marginBottom:28, overflow:"hidden" }}>
            <div style={{
              height:"100%", background:"linear-gradient(90deg,#7c3aed,transparent)",
              width: mounted ? "60%" : "0%", transition:"width 1s ease 0.6s",
            }} />
          </div>

          {/* Feature cards — staggered */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feat-card" style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"14px 16px", borderRadius:14,
                background:"rgba(255,255,255,0.02)",
                border:"1px solid rgba(255,255,255,0.05)",
                cursor:"default",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateX(0)" : "translateX(-20px)",
                transition: `opacity 0.6s ease ${0.65 + i * 0.12}s, transform 0.6s ease ${0.65 + i * 0.12}s`,
              }}>
                <div style={{
                  width:36, height:36, borderRadius:10, flexShrink:0,
                  background:`${f.color}15`, border:`1px solid ${f.color}30`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: f.color, transition:"transform 0.2s",
                }}>
                  {f.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#e0e0e0", marginBottom:2 }}>{f.title}</div>
                  <div style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>{f.desc}</div>
                </div>
                <div style={{ width:6, height:6, borderRadius:"50%", background:f.color, opacity:0.6 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          position:"relative", zIndex:1, display:"flex", gap:32,
          opacity: mounted ? 1 : 0, transition:"opacity 0.6s ease 1s",
          paddingTop:20, borderTop:"1px solid #141414",
        }}>
          <CountStat to={50} suffix="K+" label="SKUs tracked" />
          <CountStat to={6} suffix="-stage" label="AI pipeline" />
          <CountStat to={2} suffix="s" label="analysis time" />
        </div>
      </div>

      {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════════ */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"48px 24px", background:"#000" }}>
        <div style={{
          width:"100%", maxWidth:400,
          opacity: mounted ? 1 : 0, transform: mounted ? "translateX(0)" : "translateX(24px)",
          transition:"all 0.7s ease 0.3s",
        }}>

          {/* Form header */}
          <div style={{ marginBottom:28 }}>
            <h1 style={{
              fontSize:30, fontWeight:800, letterSpacing:"-0.04em", margin:"0 0 8px",
              background:"linear-gradient(135deg,#f0f0f0,#a78bfa 80%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            }}>
              Welcome back
            </h1>
            <p style={{ fontSize:14, color:"#444", margin:0 }}>
              Sign in to your <span style={{ color:"#7c3aed" }}>storescope.ai</span> dashboard
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
            gap:3, marginBottom:28,
            background:"#0a0a0a", borderRadius:12, padding:4,
            border:"1px solid #1a1a1a",
          }}>
            {([
              { id:"signin", label:"Sign In",      color:"#7c3aed" },
              { id:"circle", label:"Circle Wallet", color:"#6366f1" },
              { id:"anon",   label:"Anonymous",     color:"#555" },
            ] as { id:Tab; label:string; color:string }[]).map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                padding:"9px 4px", border:"none", borderRadius:9, cursor:"pointer",
                fontSize:11, fontWeight:600,
                background: tab === tb.id ? `${tb.color}20` : "transparent",
                color:      tab === tb.id ? tb.color : "#444",
                boxShadow:  tab === tb.id ? `0 0 12px ${tb.color}25` : "none",
                transition: "all 0.25s",
                transform:  tab === tb.id ? "translateY(-1px)" : "translateY(0)",
              }}>
                {tb.label}
              </button>
            ))}
          </div>

          {/* ── Sign In ── */}
          {tab === "signin" && (
            <div style={{ animation:"floatUp 0.4s ease" }}>
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <label style={{ display:"block", fontSize:11, color:"#666", marginBottom:7, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Username</label>
                  <GlowInput value={username} onChange={setUsername} placeholder="Enter your username" required autoFocus />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, color:"#666", marginBottom:7, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Password</label>
                  <div style={{ position:"relative" }}>
                    <GlowInput type={showPass ? "text" : "password"} value={password} onChange={setPassword} placeholder="Enter your password" required />
                    <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                      style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#555", padding:0, display:"flex" }}>
                      {showPass
                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:13, color:"#555" }}>
                    <input type="checkbox" style={{ accentColor:"#7c3aed", width:13, height:13 }} />
                    Remember me
                  </label>
                  <a href="#" style={{ fontSize:13, color:"#7c3aed", textDecoration:"none", transition:"color 0.2s" }}
                    onMouseEnter={e=>(e.currentTarget.style.color="#a78bfa")}
                    onMouseLeave={e=>(e.currentTarget.style.color="#7c3aed")}>
                    Forgot password?
                  </a>
                </div>
                {status === "error" && (
                  <div style={{ padding:"11px 14px", borderRadius:10, fontSize:13, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171", animation:"floatUp 0.3s ease" }}>
                    Invalid username or password. Please try again.
                  </div>
                )}
                {status === "success" && (
                  <div style={{ padding:"11px 14px", borderRadius:10, fontSize:13, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", color:"#4ade80", animation:"floatUp 0.3s ease" }}>
                    ✓ Login successful. Redirecting…
                  </div>
                )}
                <ShimmerButton type="submit" disabled={status === "loading" || status === "success"} color="#7c3aed">
                  {status === "loading" ? "Signing in…" : status === "success" ? "Redirecting…" : "Sign In →"}
                </ShimmerButton>
              </form>
              <div style={{ marginTop:14, padding:"10px 14px", borderRadius:10, background:"rgba(124,58,237,0.05)", border:"1px solid rgba(124,58,237,0.12)", fontSize:12, color:"#555" }}>
                Demo account enabled for testing.
              </div>
            </div>
          )}

          {/* ── Circle Wallet ── */}
          {tab === "circle" && (
            <div style={{ animation:"floatUp 0.4s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, marginBottom:20, background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.18)" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  💳
                </div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#a5b4fc" }}>Circle Wallet</p>
                  <p style={{ margin:0, fontSize:12, color:"#555" }}>MPC wallet on ARC Testnet — no MetaMask needed</p>
                </div>
              </div>
              <form onSubmit={handleCircleWallet} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <label style={{ display:"block", fontSize:11, color:"#666", marginBottom:7, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Email or username</label>
                  <GlowInput value={circleEmail} onChange={setCircleEmail} placeholder="e.g. user@email.com" required glowColor="#6366f1" autoFocus />
                  <p style={{ margin:"6px 0 0", fontSize:12, color:"#444" }}>Used to identify your wallet. No password required.</p>
                </div>
                {circleStatus === "error" && (
                  <div style={{ padding:"11px 14px", borderRadius:10, fontSize:13, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171", animation:"floatUp 0.3s ease" }}>
                    {circleError}
                  </div>
                )}
                {circleStatus === "success" && (
                  <div style={{ padding:"11px 14px", borderRadius:10, fontSize:13, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", color:"#4ade80", animation:"floatUp 0.3s ease" }}>
                    ✓ Wallet created! Redirecting…
                  </div>
                )}
                <ShimmerButton type="submit" disabled={circleStatus === "loading" || circleStatus === "success"} color="#6366f1">
                  {circleStatus === "loading" ? "Creating wallet…" : circleStatus === "success" ? "Success!" : "Create Circle Wallet →"}
                </ShimmerButton>
              </form>
              <div style={{ marginTop:14, padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.02)", border:"1px solid #1a1a1a", fontSize:12, color:"#444", lineHeight:1.7 }}>
                Get testnet USDC at{" "}
                <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color:"#6366f1", textDecoration:"none" }}>faucet.circle.com</a>
              </div>
            </div>
          )}

          {/* ── Anonymous ── */}
          {tab === "anon" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"floatUp 0.4s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, background:"rgba(255,255,255,0.02)", border:"1px solid #1f1f1f" }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid #2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                  🎭
                </div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#888" }}>Anonymous Access</p>
                  <p style={{ margin:0, fontSize:12, color:"#555" }}>Random identity generated — no registration required</p>
                </div>
              </div>
              <ShimmerButton onClick={handleAnonymous} disabled={anonLoading} color="#374151">
                {anonLoading ? "Creating identity…" : "Access Anonymously →"}
              </ShimmerButton>
              <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.02)", border:"1px solid #1a1a1a", fontSize:12, color:"#444", lineHeight:1.7 }}>
                Full access, no registration. Your real identity is never stored.
              </div>
            </div>
          )}

          {/* Footer */}
          <p style={{ marginTop:24, textAlign:"center", fontSize:13, color:"#333" }}>
            Need access for your team?{" "}
            <Link href="/contact" style={{ color:"#7c3aed", textDecoration:"none", fontWeight:500, transition:"color 0.2s" }}
              onMouseEnter={(e:React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color="#a78bfa")}
              onMouseLeave={(e:React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color="#7c3aed")}>
              Contact us
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
