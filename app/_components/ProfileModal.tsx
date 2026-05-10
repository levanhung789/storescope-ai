"use client";

import { useState, useEffect, type FormEvent } from "react";
import { X, User, Mail, Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { loadProfile, saveProfile, hashPassword, type UserProfile } from "../_lib/profile";
import { loadCircleSession } from "../_lib/circle";
import { loadAnonUser } from "../_lib/anonymousAuth";

interface Props {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: Props) {
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [email, setEmail]         = useState("");
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [status, setStatus]       = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg, setErrMsg]       = useState("");

  useEffect(() => {
    // Lay email tu Circle session hoac Anonymous
    const circle = loadCircleSession();
    const anon   = loadAnonUser();
    const detectedEmail =
      circle?.userId ?? anon?.displayName ?? "user@storescope.ai";
    setEmail(detectedEmail);

    // Load profile da luu
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setUsername(saved.username);
      setEmail(saved.email || detectedEmail);
    }
  }, []);

  const validate = () => {
    if (!username.trim()) return "Username is required.";
    if (username.trim().length < 3) return "Username must be at least 3 characters.";
    if (password && password.length < 6) return "Password must be at least 6 characters.";
    if (password && password !== confirm) return "Passwords do not match.";
    return null;
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrMsg(err); setStatus("error"); return; }

    setStatus("saving");
    const now = new Date().toISOString();
    const updated: UserProfile = {
      email,
      username: username.trim(),
      passwordHash: password ? hashPassword(password) : (profile?.passwordHash ?? ""),
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };
    saveProfile(updated);
    setProfile(updated);
    setPassword("");
    setConfirm("");
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0a0a0a", border: "1px solid #2a2a2a",
    borderRadius: 10, padding: "11px 14px 11px 40px",
    color: "#f0f0f0", fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, color: "#888",
    marginBottom: 6, fontWeight: 500,
  };

  const isNew = !profile;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#a78bfa",
            }}>
              {(profile?.username ?? email).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>
                {isNew ? "Complete your profile" : "Account Profile"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
                {isNew ? "Set up your username and password" : "Manage your account info"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4, display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {isNew && (
            <div style={{
              padding: "12px 14px", borderRadius: 10, fontSize: 13,
              background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
              color: "#a78bfa", lineHeight: 1.6,
            }}>
              Your Circle Wallet is ready. Set a username and password to secure your account.
            </div>
          )}

          {/* Email (read-only) */}
          <div>
            <label style={labelStyle}>Registered Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
              <input
                type="text"
                value={email}
                readOnly
                style={{ ...inputStyle, color: "#666", cursor: "default", background: "#080808" }}
              />
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: "#444" }}>
              Linked to your Circle Wallet. Cannot be changed.
            </p>
          </div>

          {/* Username */}
          <div>
            <label style={labelStyle}>Username *</label>
            <div style={{ position: "relative" }}>
              <User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Choose a username"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>
              {profile?.passwordHash ? "Change Password" : "Password *"}
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={profile?.passwordHash ? "Leave blank to keep current" : "At least 6 characters"}
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", padding: 0 }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          {password && (
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
                <input
                  type={showConf ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  style={{
                    ...inputStyle, paddingRight: 44,
                    borderColor: confirm && confirm !== password ? "#ef4444" : confirm && confirm === password ? "#22c55e" : "#2a2a2a",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                  onBlur={e => {
                    e.currentTarget.style.borderColor =
                      confirm && confirm !== password ? "#ef4444"
                      : confirm && confirm === password ? "#22c55e"
                      : "#2a2a2a";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(v => !v)}
                  style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", padding: 0 }}
                >
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "#ef4444" }}>Passwords do not match</p>
              )}
              {confirm && confirm === password && (
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "#22c55e" }}>Passwords match</p>
              )}
            </div>
          )}

          {/* Profile info if saved */}
          {profile && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
                Account created: {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
              {profile.updatedAt !== profile.createdAt && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#444" }}>
                  Last updated: {new Date(profile.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#f87171" }}>
              <AlertCircle size={14} />
              {errMsg}
            </div>
          )}

          {/* Saved */}
          {status === "saved" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 13, color: "#4ade80" }}>
              <Check size={14} />
              Profile saved successfully!
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#888", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "saving"}
              style={{
                flex: 2, padding: "12px 0",
                background: status === "saved" ? "#166534" : "#7c3aed",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 600,
                cursor: status === "saving" ? "wait" : "pointer",
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {status === "saving" ? "Saving…" : status === "saved" ? <><Check size={15} /> Saved</> : isNew ? "Create Profile" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
