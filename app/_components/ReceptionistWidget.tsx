"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// ── Page context config ────────────────────────────────────────────────────────
const PAGE_CONTEXT: Record<string, {
  greeting:   string;
  hint:       string;
  quickLinks: { label: string; href?: string; question?: string }[];
}> = {
  "/": {
    greeting:  "👋 Xin chào! Tôi là **StoreScope AI Assistant**.\n\nChào mừng bạn đến với nền tảng phân tích kệ hàng FMCG bằng AI!\n\nBạn muốn biết gì về StoreScope AI?",
    hint:      "💡 Nhấn **Let's get started** để bắt đầu trải nghiệm ngay!",
    quickLinks: [
      { label: "🚀 Bắt đầu ngay", href: "/login" },
      { label: "StoreScope AI là gì?", question: "StoreScope AI là gì và có thể làm được gì?" },
      { label: "Chi phí thế nào?", question: "Chi phí sử dụng StoreScope AI là bao nhiêu?" },
      { label: "Cách hoạt động?", question: "StoreScope AI hoạt động như thế nào?" },
    ],
  },
  "/login": {
    greeting:  "👋 Chào mừng trở lại!\n\nBạn có thể đăng nhập bằng:\n• **Circle Wallet** — ví MPC không cần MetaMask\n• **MetaMask** — kết nối ví ARC Testnet\n• **Anonymous** — dùng thử không cần ví",
    hint:      "💡 Dùng Anonymous để trải nghiệm miễn phí ngay!",
    quickLinks: [
      { label: "Circle Wallet là gì?", question: "Circle Wallet là gì và cách tạo?" },
      { label: "Cần MetaMask không?", question: "Tôi có cần MetaMask để dùng không?" },
      { label: "Dùng Anonymous được không?", question: "Tôi có thể dùng Anonymous access không?" },
    ],
  },
  "/dashboard": {
    greeting:  "👋 Chào mừng đến Dashboard!\n\nTừ đây bạn có thể truy cập tất cả tính năng StoreScope AI.\n\nBạn cần hỗ trợ tính năng nào?",
    hint:      "💡 Thử **AI Analysis** để phân tích ảnh kệ hàng đầu tiên!",
    quickLinks: [
      { label: "Phân tích ảnh kệ hàng", href: "/dashboard/analysis" },
      { label: "Vision Agent là gì?", question: "Vision Agent khác AI Analysis như thế nào?" },
      { label: "AI Agent hoạt động sao?", question: "AI Agent hoạt động như thế nào?" },
    ],
  },
  "/dashboard/analysis": {
    greeting:  "📸 Trang **AI Analysis**\n\nUpload ảnh kệ hàng → AI phân tích 10 micro-tasks → kết quả chi tiết về SKU, Share of Shelf, OSA.",
    hint:      "💡 Phí: $0.025 USDC / lần — thanh toán qua Circle hoặc MetaMask",
    quickLinks: [
      { label: "Cách upload ảnh?", question: "Làm thế nào để upload và phân tích ảnh kệ hàng?" },
      { label: "OSA là gì?", question: "On-Shelf Availability (OSA) là gì?" },
      { label: "Share of Shelf?", question: "Share of Shelf được tính như thế nào?" },
      { label: "Nạp USDC?", question: "Cách nạp USDC để thanh toán?" },
    ],
  },
  "/dashboard/vision-agent": {
    greeting:  "🔬 Trang **Vision Agent**\n\nPhân tích chuyên sâu 8 bước FMCG:\n1. Chất lượng ảnh & phối cảnh\n2. Đếm sản phẩm\n3. Nhận diện Brand/SKU\n4. Đếm Facing\n5. Vị trí kệ\n6. Share of Shelf\n7. OSA alerts\n8. Gợi ý tối ưu",
    hint:      "💡 Tab **Formation** chứa catalog 24 SKUs Pepsi đã được training!",
    quickLinks: [
      { label: "8 bước phân tích là gì?", question: "Vision Agent phân tích 8 bước như thế nào?" },
      { label: "Formation là gì?", question: "Tab Formation dùng để làm gì?" },
      { label: "Cách training agent?", question: "Cách thêm training examples cho Vision Agent?" },
    ],
  },
  "/dashboard/agent": {
    greeting:  "🤖 Trang **AI Agent**\n\nAgent tự động phân tích và thanh toán. Kết nối với:\n• **Telegram Bot** — gửi ảnh qua Telegram\n• **Zalo OA** — gửi ảnh qua Zalo\n• **Web Chat** — chat trực tiếp",
    hint:      "💡 Kết nối Telegram Bot để nhận phân tích ngay trong ứng dụng Telegram!",
    quickLinks: [
      { label: "Setup Telegram Bot?", question: "Cách kết nối Telegram Bot với StoreScope AI?" },
      { label: "Setup Zalo OA?", question: "Cách kết nối Zalo OA với StoreScope AI?" },
      { label: "Liên kết ví Circle?", question: "Cách liên kết Circle Wallet với Telegram/Zalo?" },
    ],
  },
  "/layout-editor": {
    greeting:  "🏪 **Store Layout Editor**\n\nThiết kế layout cửa hàng 3D toon/cartoon.\n• 14+ loại fixture\n• Vẽ tường, đặt kệ, annotation\n• Mint NFT layout lên blockchain",
    hint:      "💡 Lưu layout → Mint NFT → Bán trên Marketplace!",
    quickLinks: [
      { label: "Cách vẽ layout?", question: "Cách sử dụng Store Layout Editor?" },
      { label: "Mint NFT là gì?", question: "Mint Layout NFT là gì và có lợi ích gì?" },
    ],
  },
  "/forum": {
    greeting:  "🛒 **Forum & Marketplace**\n\nMua/bán layout cửa hàng và thảo luận về FMCG.\n• Thanh toán bằng USDC\n• Layout NFT trên ARC Testnet",
    hint:      "💡 Tạo layout đẹp → Bán kiếm USDC!",
    quickLinks: [
      { label: "Mua layout thế nào?", question: "Cách mua layout trên Marketplace?" },
      { label: "Bán layout của tôi?", question: "Cách đăng bán layout của tôi?" },
    ],
  },
};

const DEFAULT_CONTEXT = {
  greeting:  "👋 Xin chào! Tôi là **StoreScope AI Assistant**.\n\nTôi có thể giúp bạn hiểu và sử dụng StoreScope AI.\n\nBạn cần hỗ trợ gì?",
  hint:      "",
  quickLinks: [
    { label: "Trang chủ", href: "/" },
    { label: "StoreScope AI là gì?", question: "StoreScope AI là gì?" },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReceptionistWidget() {
  const pathname = usePathname();
  const [open,    setOpen]    = useState(false);
  const [unread,  setUnread]  = useState(1); // start with 1 to show greeting badge
  const [loading, setLoading] = useState(false);
  const [input,   setInput]   = useState("");

  // Determine page context
  const ctx = PAGE_CONTEXT[pathname] ?? DEFAULT_CONTEXT;
  const isLanding = pathname === "/";

  const [messages, setMessages] = useState<{role:"user"|"agent";content:string;timestamp:number}[]>(() => [
    { role: "agent", content: ctx.greeting + (ctx.hint ? `\n\n${ctx.hint}` : ""), timestamp: Date.now() },
  ]);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset messages when page changes
  useEffect(() => {
    const c = PAGE_CONTEXT[pathname] ?? DEFAULT_CONTEXT;
    setMessages([{ role: "agent", content: c.greeting + (c.hint ? `\n\n${c.hint}` : ""), timestamp: Date.now() }]);
    setUnread(1);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user" as const, content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].slice(-10).map(m => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.content,
      }));

      const res  = await fetch("/api/agent/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, page: pathname }),
      });
      const data = await res.json() as { reply?: string };
      const reply = data.reply ?? "Xin lỗi, tôi không thể trả lời lúc này.";

      setMessages(prev => [...prev, { role: "agent", content: reply, timestamp: Date.now() }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "❌ Lỗi kết nối. Thử lại nhé.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, open, pathname]);

  // Render markdown-like bold
  const renderText = (text: string) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: "#f0f0f0", fontWeight: 700 }}>{part}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <>
      <style>{`
        @keyframes receptPop { from{opacity:0;transform:scale(.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes receptPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes receptBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .recept-bubble:hover { transform: scale(1.08) !important; }
      `}</style>

      {/* ── Bubble (minimized) ── */}
      {!open && (
        <button
          className="recept-bubble"
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 28, right: 28, zIndex: 9000,
            width: 58, height: 58, borderRadius: "50%", border: "none",
            background: "linear-gradient(135deg,#7c3aed,#6366f1)",
            cursor: "pointer", boxShadow: "0 6px 24px rgba(124,58,237,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, transition: "transform 0.2s",
            animation: isLanding ? "receptBounce 2s ease-in-out infinite" : "none",
          }}
          title="Hỗ trợ & Hướng dẫn"
        >
          🤖
          {unread > 0 && (
            <span style={{
              position: "absolute", top: -3, right: -3,
              background: "#ef4444", color: "#fff",
              width: 20, height: 20, borderRadius: "50%", fontSize: 11,
              fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              animation: "receptPulse 1.5s infinite",
            }}>{unread}</span>
          )}
        </button>
      )}

      {/* ── Chat window (expanded) ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9000,
          width: 360, maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          background: "#0f0f0f", border: "1px solid #2a2a2a",
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.9)",
          animation: "receptPop 0.2s ease-out",
        }}>

          {/* Header */}
          <div style={{ padding: "13px 16px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(99,102,241,0.15))", flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>StoreScope AI</div>
              <div style={{ fontSize: 10, color: "#4ade80" }}>● Tiếp tân · Luôn sẵn sàng hỗ trợ</div>
            </div>
            <button onClick={() => setOpen(false)} title="Thu nhỏ"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#888", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
              ─
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
                {m.role === "agent" && (
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginBottom: 2 }}>🤖</div>
                )}
                <div style={{
                  maxWidth: "80%", padding: "10px 13px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "#1a1a1a",
                  border: m.role === "agent" ? "1px solid #2a2a2a" : "none",
                  fontSize: 12, color: "#e0e0e0", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {renderText(m.content)}
                  <div style={{ fontSize: 9, color: m.role === "user" ? "rgba(255,255,255,0.4)" : "#444", marginTop: 4, textAlign: "right" }}>
                    {new Date(m.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
                <div style={{ padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px 16px 16px 4px", display: "flex", gap: 4 }}>
                  {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", animation: `receptPulse 1.2s ${d*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick links */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 6, flexWrap: "wrap", background: "#0a0a0a", flexShrink: 0 }}>
            {ctx.quickLinks.map((ql, i) => (
              ql.href
                ? <Link key={i} href={ql.href}
                    style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa", textDecoration: "none", display: "inline-block" }}>
                    {ql.label}
                  </Link>
                : <button key={i} onClick={() => sendMessage(ql.question)}
                    style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", cursor: "pointer" }}>
                    {ql.label}
                  </button>
            ))}
          </div>

          {/* Special CTA on landing page */}
          {isLanding && (
            <div style={{ padding: "10px 14px", background: "rgba(124,58,237,0.08)", borderTop: "1px solid rgba(124,58,237,0.2)", flexShrink: 0 }}>
              <Link href="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", background: "linear-gradient(135deg,#7c3aed,#6366f1)", color: "#fff", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                🚀 Let&apos;s get started
              </Link>
            </div>
          )}

          {/* Text input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #1f1f1f", background: "#0a0a0a", flexShrink: 0, display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Hỏi gì đó về StoreScope AI..."
              disabled={loading}
              style={{ flex: 1, background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: "9px 12px", color: "#f0f0f0", fontSize: 12, outline: "none" }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: input.trim() && !loading ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "#1a1a1a", color: input.trim() && !loading ? "#fff" : "#555", border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              {loading ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #555", borderTopColor: "#a78bfa", animation: "receptPulse 0.6s linear infinite" }} /> : "↑"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
