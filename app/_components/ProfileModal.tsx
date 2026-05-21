"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { X, User, Mail, Lock, Eye, EyeOff, Check, AlertCircle, ArrowRight, Loader, Pencil, Wallet, Calendar, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile, hashPassword, type UserProfile } from "../_lib/profile";
import { loadCircleSession } from "../_lib/circle";

interface Props {
  onClose: () => void;
  redirectTo?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ── View mode — hiển thị thông tin profile ────────────────────────────────────
function ProfileView({
  profile,
  circleAddress,
  onEdit,
  onClose,
}: {
  profile: UserProfile;
  circleAddress?: string;
  onEdit: () => void;
  onClose: () => void;
}) {
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const row = (icon: React.ReactNode, label: string, value: string, mono = false) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: "1px solid #141414" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0f0f0f", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#555" }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#d4d4d4", fontFamily: mono ? "monospace" : "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.15))",
            border: "1px solid rgba(124,58,237,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "#a78bfa",
          }}>
            {profile.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.02em" }}>
              {profile.username}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#555" }}>Active account</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onEdit}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 9,
              background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
              color: "#a78bfa", fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.18)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 6, display: "flex", borderRadius: 8 }}
            onMouseEnter={e => { e.currentTarget.style.color = "#888"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#555"; }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ padding: "4px 24px 8px" }}>
        {row(<Mail size={14} />, "Email", profile.email, false)}
        {row(<User size={14} />, "Username", profile.username, false)}
        {row(<ShieldCheck size={14} />, "Password", "••••••••", false)}
        {circleAddress && row(<Wallet size={14} />, "Wallet Address", circleAddress, true)}
        {row(<Calendar size={14} />, "Member since", joinDate, false)}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid #141414" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#333" }}>
          <Check size={11} style={{ color: "#4ade80" }} />
          Account verified · ARC Testnet
        </div>
      </div>
    </>
  );
}

// ── Edit mode — form chỉnh sửa ────────────────────────────────────────────────
function ProfileEdit({
  profile,
  email,
  onSaved,
  onCancel,
  isNew,
  redirectTo,
}: {
  profile: UserProfile | null;
  email: string;
  onSaved: (p: UserProfile) => void;
  onCancel: () => void;
  isNew: boolean;
  redirectTo: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [status,   setStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg,   setErrMsg]   = useState("");
  const [autoCount, setAutoCount] = useState<number | null>(null);

  const autoTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  const usernameOk = username.trim().length >= 3;
  const passwordOk = !isNew
    ? (!password || (password.length >= 6 && password === confirm))
    : (password.length >= 6 && confirm.length >= 6 && password === confirm);
  const allValid = usernameOk && passwordOk;

  // Auto-save countdown chỉ khi isNew
  useEffect(() => {
    if (!isNew) return;
    if (autoTimer.current)  clearTimeout(autoTimer.current);
    if (countTimer.current) clearInterval(countTimer.current);
    setAutoCount(null);
    if (!allValid) return;

    let c = 3;
    setAutoCount(c);
    countTimer.current = setInterval(() => {
      c--;
      if (c > 0) setAutoCount(c);
      else { clearInterval(countTimer.current!); setAutoCount(0); }
    }, 1000);
    autoTimer.current = setTimeout(doSave, 3000);

    return () => {
      if (autoTimer.current)  clearTimeout(autoTimer.current);
      if (countTimer.current) clearInterval(countTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, password, confirm, isNew, allValid]);

  const doSave = () => {
    if (!username.trim()) { setErrMsg("Username is required."); setStatus("error"); return; }
    if (username.trim().length < 3) { setErrMsg("Username must be at least 3 characters."); setStatus("error"); return; }
    if (isNew && !password) { setErrMsg("Password is required."); setStatus("error"); return; }
    if (password && password.length < 6) { setErrMsg("Password must be at least 6 characters."); setStatus("error"); return; }
    if (password && password !== confirm) { setErrMsg("Passwords do not match."); setStatus("error"); return; }

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
    setStatus("saved");
    onSaved(updated);

    if (isNew) {
      setTimeout(() => router.push(redirectTo), 1200);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (autoTimer.current)  clearTimeout(autoTimer.current);
    if (countTimer.current) clearInterval(countTimer.current);
    setAutoCount(null);
    doSave();
  };

  const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10,
    padding: "11px 14px 11px 40px", color: "#f0f0f0", fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
  };
  const lbl: React.CSSProperties = { display: "block", fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>
            {isNew ? "Complete your profile" : "Edit Profile"}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
            {isNew ? "One-time setup · takes 30 seconds" : "Changes save immediately"}
          </p>
        </div>
        {!isNew && (
          <button type="button" onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 6, display: "flex" }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

        {isNew && (
          <div style={{ padding: "13px 16px", borderRadius: 12, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)", color: "#c4b5fd", fontSize: 13, lineHeight: 1.65, display: "flex", gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>✦</span>
            <span>Wallet is ready. Set a <strong>username</strong> and <strong>password</strong> to activate — profile saves automatically.</span>
          </div>
        )}

        {/* Email read-only */}
        <div>
          <label style={lbl}>
            Email
            <span style={{ marginLeft: 6, fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.1)", padding: "1px 7px", borderRadius: 999 }}>Verified</span>
          </label>
          <div style={{ position: "relative" }}>
            <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#4ade80" }} />
            <input readOnly value={email} style={{ ...inp, color: "#666", cursor: "default", background: "#080808", borderColor: "rgba(34,197,94,0.2)" }} />
            <Check size={13} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: "#4ade80" }} />
          </div>
        </div>

        {/* Username */}
        <div>
          <label style={lbl}>Username <span style={{ color: "#ef4444" }}>*</span></label>
          <div style={{ position: "relative" }}>
            <User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: usernameOk ? "#a78bfa" : "#555" }} />
            <input
              type="text" value={username} maxLength={32} autoFocus
              onChange={e => { setUsername(e.target.value); setErrMsg(""); setStatus("idle"); }}
              placeholder="At least 3 characters"
              style={{ ...inp, borderColor: usernameOk ? "rgba(124,58,237,0.4)" : "#2a2a2a" }}
              onFocus={e  => (e.currentTarget.style.borderColor = "#7c3aed")}
              onBlur={e   => (e.currentTarget.style.borderColor = usernameOk ? "rgba(124,58,237,0.4)" : "#2a2a2a")}
            />
            {usernameOk && <Check size={13} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: "#a78bfa" }} />}
          </div>
        </div>

        {/* Password */}
        <div>
          <label style={lbl}>
            {profile?.passwordHash ? "Change Password" : "Password"}
            {isNew && <span style={{ color: "#ef4444" }}> *</span>}
            {!isNew && <span style={{ fontSize: 11, color: "#444", fontWeight: 400, marginLeft: 6 }}>(leave blank to keep current)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
            <input type={showPass ? "text" : "password"} value={password}
              onChange={e => { setPassword(e.target.value); setErrMsg(""); setStatus("idle"); }}
              placeholder={isNew ? "At least 6 characters" : "New password (optional)"}
              style={{ ...inp, paddingRight: 44 }}
              onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
              onBlur={e  => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", padding: 0 }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Confirm — chỉ show khi đang nhập password */}
        {password.length > 0 && (
          <div>
            <label style={lbl}>Confirm Password <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
              <input type={showConf ? "text" : "password"} value={confirm}
                onChange={e => { setConfirm(e.target.value); setErrMsg(""); setStatus("idle"); }}
                placeholder="Re-enter password"
                style={{
                  ...inp, paddingRight: 44,
                  borderColor: confirm && confirm !== password ? "#ef4444"
                    : confirm && confirm === password && password.length >= 6 ? "#22c55e"
                    : "#2a2a2a",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                onBlur={e  => { e.currentTarget.style.borderColor = confirm && confirm !== password ? "#ef4444" : confirm && confirm === password && password.length >= 6 ? "#22c55e" : "#2a2a2a"; }}
              />
              <button type="button" onClick={() => setShowConf(v => !v)}
                style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", padding: 0 }}>
                {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirm && confirm !== password && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#ef4444" }}>Passwords do not match</p>}
            {confirm && confirm === password && password.length >= 6 && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}><Check size={11} /> Passwords match</p>}
          </div>
        )}

        {/* Auto-save countdown (chỉ khi isNew) */}
        {isNew && autoCount !== null && autoCount > 0 && allValid && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#a78bfa" }}>
            <Loader size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
            <span>
              Saving in <strong>{autoCount}s</strong>…
              <button type="submit" style={{ marginLeft: 10, background: "none", border: "none", color: "#c4b5fd", cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 }}>
                Save now
              </button>
            </span>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#f87171" }}>
            <AlertCircle size={14} /> {errMsg}
          </div>
        )}

        {/* Saving */}
        {status === "saving" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", fontSize: 13, color: "#a78bfa" }}>
            <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…
          </div>
        )}

        {/* Saved */}
        {status === "saved" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 13, color: "#4ade80" }}>
            <Check size={14} />
            {isNew ? "Profile created! Redirecting…" : "Changes saved!"}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {!isNew && (
            <button type="button" onClick={onCancel}
              style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#888", cursor: "pointer" }}>
              Cancel
            </button>
          )}
          <button type="submit"
            disabled={status === "saving" || status === "saved" || (isNew && !allValid)}
            style={{
              flex: isNew ? "1 1 100%" : 2,
              padding: "13px 0",
              background: status === "saved" ? "#166534"
                : isNew && !allValid ? "#1a1a1a"
                : "#7c3aed",
              color: isNew && !allValid ? "#444" : "#fff",
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600,
              cursor: (status === "saving" || status === "saved" || (isNew && !allValid)) ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {status === "saving" ? <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
              : status === "saved" ? <><Check size={15} /> {isNew ? "Redirecting…" : "Saved!"}</>
              : isNew ? <><ArrowRight size={15} /> Activate Account</>
              : "Save Changes"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function ProfileModal({ onClose, redirectTo = "/dashboard/analysis" }: Props) {
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [email,    setEmail]    = useState("");
  const [editing,  setEditing]  = useState(false);  // false = view, true = edit
  const circleSession = typeof window !== "undefined" ? (() => {
    try { return JSON.parse(localStorage.getItem("storescope-circle-session") ?? "null"); } catch { return null; }
  })() : null;

  useEffect(() => {
    const circle = loadCircleSession();
    setEmail(circle?.userId ?? "");
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setEditing(false); // có profile rồi → view mode
    } else {
      setEditing(true);  // chưa có profile → edit mode ngay
    }
  }, []);

  const isNew = !profile;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={isNew ? undefined : onClose}
    >
      <div
        style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* View mode — chỉ show khi đã có profile và không đang edit */}
        {profile && !editing && (
          <ProfileView
            profile={profile}
            circleAddress={circleSession?.walletAddress}
            onEdit={() => setEditing(true)}
            onClose={onClose}
          />
        )}

        {/* Edit/New mode */}
        {(isNew || editing) && (
          <ProfileEdit
            profile={profile}
            email={email}
            isNew={isNew}
            redirectTo={redirectTo}
            onSaved={(updated) => {
              setProfile(updated);
              setEditing(false); // sau khi save → về view mode
            }}
            onCancel={() => setEditing(false)} // hủy edit → về view mode
          />
        )}
      </div>
    </div>
  );
}
