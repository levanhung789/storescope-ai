"use client";

import { useState } from "react";
import { useLang, LANG_NAMES, type Lang } from "../_lib/i18n";

interface Props {
  variant?: "navbar" | "sidebar"; // navbar = horizontal, sidebar = compact
}

export default function LanguageSwitcher({ variant = "navbar" }: Props) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  const flags: Record<Lang, string> = { vi: "🇻🇳", en: "🇺🇸", zh: "🇨🇳" };
  const short: Record<Lang, string> = { vi: "VI", en: "EN", zh: "中" };

  if (variant === "sidebar") {
    return (
      <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
        {(Object.keys(flags) as Lang[]).map(l => (
          <button key={l} onClick={() => setLang(l)}
            style={{
              flex: 1, padding: "5px 0", borderRadius: 8, border: `1px solid ${lang === l ? "rgba(124,58,237,0.5)" : "#2a2a2a"}`,
              background: lang === l ? "rgba(124,58,237,0.15)" : "transparent",
              color: lang === l ? "#a78bfa" : "#555",
              cursor: "pointer", fontSize: 11, fontWeight: 600,
            }}>
            {flags[l]} {short[l]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#ccc", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
        {flags[lang]} {short[lang]}
        <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: 38, right: 0, background: "#111", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden", zIndex: 99, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            {(Object.keys(flags) as Lang[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", background: l === lang ? "rgba(124,58,237,0.12)" : "transparent", border: "none", color: l === lang ? "#a78bfa" : "#888", cursor: "pointer", fontSize: 13, textAlign: "left" }}>
                <span style={{ fontSize: 18 }}>{flags[l]}</span>
                <span style={{ fontWeight: l === lang ? 700 : 400 }}>{LANG_NAMES[l].replace(/^.+?\s/, "")}</span>
                {l === lang && <span style={{ marginLeft: "auto", fontSize: 12, color: "#7c3aed" }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
