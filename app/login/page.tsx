"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const DEMO_USERNAME = "ADmin123";
const DEMO_PASSWORD = "888000";

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
    title: "Store Overview",
    desc: "Unified visibility across all retail locations",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
      </svg>
    ),
    title: "AI Detection",
    desc: "Sub-second SKU recognition from shelf photos",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    ),
    title: "Live Analytics",
    desc: "Actionable insights from real-time shelf data",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    await new Promise(r => setTimeout(r, 600));

    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 500);
    } else {
      setStatus("error");
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0a0a0a", border: "1px solid #2a2a2a",
    borderRadius: 12, padding: "12px 16px",
    color: "#f0f0f0", fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#000" }}>

      {/* ── Left panel ── */}
      <div style={{
        position: "relative", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "48px 56px",
        background: "#080808", borderRight: "1px solid #1f1f1f", overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: -200, left: -200,
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -100, right: -100,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Brand */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.04em" }}>storescope</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed", letterSpacing: "-0.04em" }}>.ai</span>
          </a>
          <div style={{ marginTop: 4, fontSize: 12, color: "#555", letterSpacing: "0.08em" }}>
            Retail Intelligence Platform
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-block", marginBottom: 20,
            fontSize: 10, color: "#7c3aed", textTransform: "uppercase",
            letterSpacing: "0.18em", fontWeight: 600,
            padding: "5px 14px", borderRadius: 999,
            border: "1px solid rgba(124,58,237,0.3)",
            background: "rgba(124,58,237,0.08)",
          }}>
            AI-Powered Retail Execution
          </div>

          <h2 style={{
            fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 800,
            letterSpacing: "-0.035em", lineHeight: 1.08,
            color: "#f0f0f0", margin: "0 0 20px",
          }}>
            Turn shelf photos<br />
            into <span style={{ color: "#7c3aed" }}>business intelligence</span>
          </h2>

          <p style={{ fontSize: 15, color: "#888", lineHeight: 1.7, maxWidth: 380, margin: 0 }}>
            Monitor shelves, detect SKUs and optimize store performance with AI built for modern FMCG teams.
          </p>

          {/* Feature cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 40 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 18px", borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "border-color 0.2s",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#a78bfa",
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5", marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat row */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 32 }}>
          {[["50K+", "SKUs tracked"], ["6-stage", "AI pipeline"], ["<2s", "analysis time"]].map(([val, lbl]) => (
            <div key={lbl}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — Login form ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px", background: "#000",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile logo */}
          <div style={{ marginBottom: 40, display: "none" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f0" }}>storescope</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed" }}>.ai</span>
          </div>

          {/* Form header */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 8px", color: "#f0f0f0" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: "#555", margin: 0 }}>
              Sign in to your storescope.ai dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 500 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                style={inputBase}
                onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ ...inputBase, paddingRight: 44 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#555", padding: 0, display: "flex",
                  }}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#888" }}>
                <input type="checkbox" style={{ accentColor: "#7c3aed", width: 14, height: 14 }} />
                Remember me
              </label>
              <a href="#" style={{ fontSize: 13, color: "#7c3aed", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
                onMouseLeave={e => (e.currentTarget.style.color = "#7c3aed")}
              >
                Forgot password?
              </a>
            </div>

            {/* Status messages */}
            {status === "error" && (
              <div style={{
                padding: "12px 16px", borderRadius: 10, fontSize: 13,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171",
              }}>
                Invalid username or password. Please try again.
              </div>
            )}
            {status === "success" && (
              <div style={{
                padding: "12px 16px", borderRadius: 10, fontSize: 13,
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                color: "#4ade80",
              }}>
                Login successful. Redirecting to dashboard…
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              style={{
                width: "100%", padding: "13px 0",
                background: status === "loading" || status === "success" ? "#5a2aad" : "#7c3aed",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: status === "idle" || status === "error" ? "pointer" : "not-allowed",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={e => {
                if (status === "idle" || status === "error") {
                  e.currentTarget.style.background = "#6d28d9";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#7c3aed";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {status === "loading" ? "Signing in…" : status === "success" ? "Redirecting…" : "Sign In"}
            </button>
          </form>

          {/* Demo hint */}
          <div style={{
            marginTop: 20, padding: "11px 16px", borderRadius: 10,
            background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)",
            fontSize: 12, color: "#666",
          }}>
            Demo account enabled for testing.
          </div>

          {/* Footer */}
          <p style={{ marginTop: 28, textAlign: "center", fontSize: 13, color: "#444" }}>
            Need access for your team?{" "}
            <Link href="/contact" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 500 }}
            >
              Contact us
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
