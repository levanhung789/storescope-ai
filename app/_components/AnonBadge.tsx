"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type AnonUser, clearAnonUser } from "../_lib/anonymousAuth";

interface Props {
  user: AnonUser;
  onSignOut?: () => void;
}

export default function AnonBadge({ user, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = () => {
    clearAnonUser();
    onSignOut?.();
    router.push("/login");
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 999, padding: "6px 14px 6px 8px",
          cursor: "pointer", transition: "border-color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
      >
        {/* Avatar */}
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: user.avatarColor, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0,
        }}>
          {user.avatarInitials}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>
          {user.displayName}
        </span>
        {/* Anonymous badge */}
        <span style={{
          fontSize: 9, color: "#888", background: "#1a1a1a",
          border: "1px solid #2a2a2a", padding: "1px 6px", borderRadius: 999,
        }}>
          ANON
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "#555" }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 1000,
            background: "#111", border: "1px solid #222", borderRadius: 14,
            minWidth: 230, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", overflow: "hidden",
          }}>
            {/* Identity card */}
            <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>
                  {user.avatarInitials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{user.displayName}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Anonymous Session</div>
                </div>
              </div>
              {/* Privacy note */}
              <div style={{ padding: "8px 10px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 600, marginBottom: 3 }}>Identity Protected</div>
                <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>
                  Your real identity is hidden. This name was randomly generated for this session.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "6px 0" }}>
              <div style={{ padding: "9px 16px", fontSize: 13, color: "#555", borderBottom: "1px solid #111" }}>
                <span style={{ color: "#888" }}>Session since: </span>
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
              <a href="/dashboard" style={{ display: "block", padding: "9px 16px", fontSize: 13, color: "#888", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f0f0f0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#888")}>
                Go to Dashboard
              </a>
            </div>

            <div style={{ borderTop: "1px solid #1a1a1a" }}>
              <button
                onClick={handleSignOut}
                style={{ display: "block", width: "100%", padding: "10px 16px", fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                End Session
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
