"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { X, User, Mail, Lock, Eye, EyeOff, Check, AlertCircle, ArrowRight, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile, hashPassword, type UserProfile } from "../_lib/profile";
import { loadCircleSession } from "../_lib/circle";

interface Props {
  onClose: () => void;
  redirectTo?: string; // sau khi save xong thì redirect đến đâu
}

// Kiểm tra email hợp lệ
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ProfileModal({ onClose, redirectTo = "/dashboard/analysis" }: Props) {
  const router   = useRouter();
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [email,   setEmail]     = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [status,   setStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg,   setErrMsg]   = useState("");
  const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isNew = !profile;

  useEffect(() => {
    const circle = loadCircleSession();
    // Email lấy từ Circle session (đã validate email format khi tạo ví)
    const detectedEmail = circle?.userId ?? "";
    setEmail(detectedEmail);

    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setUsername(saved.username);
      setEmail(saved.email || detectedEmail);
    }
  }, []);

  // Auto-save khi isNew và tất cả field hợp lệ
  useEffect(() => {
    if (!isNew) return;

    const allValid =
      username.trim().length >= 3 &&
      password.length >= 6 &&
      confirm.length >= 6 &&
      password === confirm;

    // Xóa timer cũ
    if (autoSaveTimer.current)  clearTimeout(autoSaveTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setAutoSaveCountdown(null);

    if (!allValid) return;

    // Bắt đầu đếm ngược 3s rồi auto-save
    let count = 3;
    setAutoSaveCountdown(count);
    countdownTimer.current = setInterval(() => {
      count--;
      if (count > 0) {
        setAutoSaveCountdown(count);
      } else {
        clearInterval(countdownTimer.current!);
        setAutoSaveCountdown(0);
      }
    }, 1000);

    autoSaveTimer.current = setTimeout(() => {
      doSave();
    }, 3000);

    return () => {
      if (autoSaveTimer.current)  clearTimeout(autoSaveTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, password, confirm, isNew]);

  const validate = () => {
    if (!username.trim())              return "Username is required.";
    if (username.trim().length < 3)    return "Username must be at least 3 characters.";
    if (isNew && !password)            return "Password is required for new accounts.";
    if (password && password.length < 6) return "Password must be at least 6 characters.";
    if (password && password !== confirm) return "Passwords do not match.";
    return null;
  };

  const doSave = () => {
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
    setPassword(""); setConfirm("");
    setStatus("saved");

    // Nếu là profile mới → đóng modal + redirect
    if (isNew) {
      setTimeout(() => {
        onClose();
        router.push(redirectTo);
      }, 1200);
    } else {
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    // Hủy auto-save nếu user bấm thủ công
    if (autoSaveTimer.current)  clearTimeout(autoSaveTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setAutoSaveCountdown(null);
    doSave();
  };

  // ── Styles ────────────────────────────────────────────────────────────────
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

  const passwordOk = password.length >= 6 && confirm.length >= 6 && password === confirm;
  const usernameOk = username.trim().length >= 3;
  const allReadyForSave = isNew ? (usernameOk && passwordOk) : true;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={status !== "saving" ? onClose : undefined}
    >
      <div
        style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#a78bfa",
            }}>
              {(profile?.username ?? email).slice(0, 1).toUpperCase() || "?"}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>
                {isNew ? "Complete your profile" : "Account Profile"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
                {isNew ? "One-time setup — takes 30 seconds" : "Manage your account info"}
              </p>
            </div>
          </div>
          {!isNew && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4, display: "flex" }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSave} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Banner mới */}
          {isNew && (
            <div style={{
              padding: "14px 16px", borderRadius: 12, fontSize: 13,
              background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)",
              color: "#c4b5fd", lineHeight: 1.65,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>✦</span>
              <span>
                Your wallet is ready. Set a <strong>username</strong> and <strong>password</strong> to activate your account — profile saves automatically.
              </span>
            </div>
          )}

          {/* Email (read-only) */}
          <div>
            <label style={labelStyle}>
              Registered Email
              <span style={{ marginLeft: 6, fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.1)", padding: "1px 7px", borderRadius: 999, verticalAlign: "middle" }}>
                Verified
              </span>
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: isValidEmail(email) ? "#4ade80" : "#555" }} />
              <input
                type="text"
                value={email}
                readOnly
                style={{ ...inputStyle, color: "#888", cursor: "default", background: "#080808", borderColor: isValidEmail(email) ? "rgba(34,197,94,0.25)" : "#2a2a2a" }}
              />
              {isValidEmail(email) && (
                <Check size={13} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: "#4ade80" }} />
              )}
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: "#444" }}>
              This email is permanently linked to your wallet and cannot be changed.
            </p>
          </div>

          {/* Username */}
          <div>
            <label style={labelStyle}>
              Username <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: usernameOk ? "#a78bfa" : "#555" }} />
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setErrMsg(""); setStatus("idle"); }}
                placeholder="At least 3 characters"
                maxLength={32}
                autoFocus
                style={{ ...inputStyle, borderColor: usernameOk ? "rgba(124,58,237,0.4)" : "#2a2a2a" }}
                onFocus={e  => (e.currentTarget.style.borderColor = "#7c3aed")}
                onBlur={e   => (e.currentTarget.style.borderColor = usernameOk ? "rgba(124,58,237,0.4)" : "#2a2a2a")}
              />
              {usernameOk && (
                <Check size={13} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: "#a78bfa" }} />
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>
              {profile?.passwordHash ? "Change Password" : "Password"} {isNew && <span style={{ color: "#ef4444" }}>*</span>}
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrMsg(""); setStatus("idle"); }}
                placeholder={profile?.passwordHash ? "Leave blank to keep current" : "At least 6 characters"}
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                onBlur={e  => (e.currentTarget.style.borderColor = "#2a2a2a")}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", padding: 0 }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          {(password || isNew) && (
            <div>
              <label style={labelStyle}>
                Confirm Password {isNew && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
                <input
                  type={showConf ? "text" : "password"}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrMsg(""); setStatus("idle"); }}
                  placeholder="Re-enter password"
                  style={{
                    ...inputStyle, paddingRight: 44,
                    borderColor: confirm && confirm !== password ? "#ef4444"
                      : confirm && confirm === password && password.length >= 6 ? "#22c55e"
                      : "#2a2a2a",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
                  onBlur={e  => {
                    e.currentTarget.style.borderColor =
                      confirm && confirm !== password ? "#ef4444"
                      : confirm && confirm === password && password.length >= 6 ? "#22c55e"
                      : "#2a2a2a";
                  }}
                />
                <button type="button" onClick={() => setShowConf(v => !v)}
                  style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", padding: 0 }}>
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "#ef4444" }}>Passwords do not match</p>
              )}
              {passwordOk && (
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={11} /> Passwords match
                </p>
              )}
            </div>
          )}

          {/* Auto-save countdown indicator */}
          {isNew && autoSaveCountdown !== null && autoSaveCountdown > 0 && allReadyForSave && (
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)",
              display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#a78bfa",
            }}>
              <Loader size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
              <span>
                All set! Auto-saving in <strong>{autoSaveCountdown}s</strong>…
                <button type="button" onClick={handleSave}
                  style={{ marginLeft: 10, background: "none", border: "none", color: "#c4b5fd", cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 }}>
                  Save now
                </button>
              </span>
            </div>
          )}

          {/* Account info nếu đã có profile */}
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
              <AlertCircle size={14} /> {errMsg}
            </div>
          )}

          {/* Saving / Saved */}
          {status === "saving" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", fontSize: 13, color: "#a78bfa" }}>
              <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
              Saving your profile…
            </div>
          )}
          {status === "saved" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 13, color: "#4ade80" }}>
              <Check size={14} />
              {isNew ? "Profile created! Redirecting to dashboard…" : "Profile saved successfully!"}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            {!isNew && (
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#888", cursor: "pointer" }}>
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={status === "saving" || status === "saved" || (isNew && !allReadyForSave)}
              style={{
                flex: isNew ? "1 1 100%" : 2,
                padding: "13px 0",
                background: status === "saved"
                  ? "#166534"
                  : !allReadyForSave && isNew
                  ? "#1a1a1a"
                  : "#7c3aed",
                color: !allReadyForSave && isNew ? "#444" : "#fff",
                border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 600,
                cursor: (status === "saving" || status === "saved" || (isNew && !allReadyForSave)) ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {status === "saving" ? (
                <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
              ) : status === "saved" ? (
                <><Check size={15} /> {isNew ? "Saved — Redirecting…" : "Saved"}</>
              ) : isNew ? (
                <><ArrowRight size={15} /> Activate Account</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </div>
    </div>
  );
}
