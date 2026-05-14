"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const ADMIN_USER = "ADmin123";
const ADMIN_PASS = "888000";

export default function AdminLogin() {
  const router = useRouter();
  const [user, setUser]     = useState("");
  const [pass, setPass]     = useState("");
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 500));
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem("admin-auth", "storescope-admin-2026");
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials.");
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0a0a0a", border: "1px solid #2a2a2a",
    borderRadius: 10, padding: "12px 14px",
    color: "#f0f0f0", fontSize: 14, outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <div style={{ width: 360, padding: "40px 32px", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 20 }}>

        {/* Logo + badge */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="StoreScope AI" style={{ height: 50, filter: "invert(1)", marginBottom: 12 }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 999 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Admin Access</span>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "#555" }}>Project Control Center</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6 }}>Username</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} required style={inp}
              onFocus={e => (e.currentTarget.style.borderColor = "#ef4444")}
              onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={show ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} required
                style={{ ...inp, paddingRight: 40 }}
                onFocus={e => (e.currentTarget.style.borderColor = "#ef4444")}
                onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")} />
              <button type="button" onClick={() => setShow(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 12 }}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "13px 0", background: loading ? "#7f1d1d" : "#dc2626", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Authenticating…" : "Access Admin Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
