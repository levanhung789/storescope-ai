"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// ── Language config ────────────────────────────────────────────────────────────
type Lang = "vi" | "en" | "zh";

const LANG_LABELS: Record<Lang, string> = { vi: "🇻🇳 VI", en: "🇺🇸 EN", zh: "🇨🇳 中文" };

const UI: Record<Lang, {
  online: string; subtitle: string; placeholder: string; minimize: string;
  cta: string; typing: string; error: string;
}> = {
  vi: { online: "● Tiếp tân · Luôn sẵn sàng", subtitle: "StoreScope AI", placeholder: "Hỏi về StoreScope AI...", minimize: "Thu nhỏ", cta: "🚀 Let's get started", typing: "Đang gõ...", error: "❌ Lỗi kết nối. Thử lại." },
  en: { online: "● Receptionist · Always ready", subtitle: "StoreScope AI", placeholder: "Ask about StoreScope AI...", minimize: "Minimize", cta: "🚀 Let's get started", typing: "Typing...", error: "❌ Connection error. Try again." },
  zh: { online: "● 接待员 · 随时为您服务", subtitle: "StoreScope AI", placeholder: "询问 StoreScope AI...", minimize: "最小化", cta: "🚀 立即开始", typing: "正在输入...", error: "❌ 连接错误，请重试。" },
};

// ── Page context per language ─────────────────────────────────────────────────
type PageCtx = { greeting: string; hint: string; quickLinks: { label: string; href?: string; question?: string }[] };

const PAGE_CONTEXT: Record<Lang, Record<string, PageCtx>> = {
  vi: {
    "/": {
      greeting: "👋 Xin chào! Tôi là **StoreScope AI Assistant**.\n\nChào mừng bạn đến nền tảng phân tích kệ hàng FMCG bằng AI!\n\nBạn muốn biết gì?",
      hint: "💡 Nhấn **Let's get started** để bắt đầu trải nghiệm ngay!",
      quickLinks: [
        { label: "🚀 Bắt đầu ngay", href: "/login" },
        { label: "StoreScope AI là gì?", question: "StoreScope AI là gì và làm được gì?" },
        { label: "Chi phí thế nào?", question: "Chi phí sử dụng StoreScope AI?" },
        { label: "Cách hoạt động?", question: "StoreScope AI hoạt động như thế nào?" },
      ],
    },
    "/login": {
      greeting: "👋 Chào mừng trở lại!\n\nĐăng nhập bằng:\n• **Circle Wallet** — ví MPC, không cần MetaMask\n• **MetaMask** — ví ARC Testnet\n• **Anonymous** — dùng thử miễn phí",
      hint: "💡 Dùng Anonymous để trải nghiệm không cần ví!",
      quickLinks: [
        { label: "Circle Wallet là gì?", question: "Circle Wallet là gì và cách tạo?" },
        { label: "Cần MetaMask không?", question: "Tôi có cần MetaMask không?" },
        { label: "Anonymous access?", question: "Tôi có thể dùng Anonymous không?" },
      ],
    },
    "/dashboard": {
      greeting: "👋 Chào mừng đến Dashboard!\n\nBạn có thể truy cập tất cả tính năng từ đây.\n\nCần hỗ trợ tính năng nào?",
      hint: "💡 Thử **AI Analysis** để phân tích ảnh kệ hàng đầu tiên!",
      quickLinks: [
        { label: "Phân tích ảnh", href: "/dashboard/analysis" },
        { label: "Vision Agent?", question: "Vision Agent khác AI Analysis thế nào?" },
        { label: "AI Agent là gì?", question: "AI Agent hoạt động như thế nào?" },
      ],
    },
    "/dashboard/analysis": {
      greeting: "📸 **AI Analysis**\n\nUpload ảnh kệ hàng → 10 micro-tasks → SKU, Share of Shelf, OSA.",
      hint: "💡 Phí: $0.025 USDC / lần — Circle hoặc MetaMask",
      quickLinks: [
        { label: "Cách upload ảnh?", question: "Làm thế nào để upload và phân tích ảnh?" },
        { label: "OSA là gì?", question: "On-Shelf Availability là gì?" },
        { label: "Nạp USDC?", question: "Cách nạp USDC?" },
      ],
    },
    "/dashboard/vision-agent": {
      greeting: "🔬 **Vision Agent** — Phân tích 8 bước:\n1. Chất lượng & phối cảnh\n2. Đếm sản phẩm\n3. Brand/SKU\n4. Facing count\n5. Vị trí kệ\n6. Share of Shelf\n7. OSA\n8. Gợi ý",
      hint: "💡 Tab **Formation** có 24 SKUs Pepsi đã training!",
      quickLinks: [
        { label: "8 bước là gì?", question: "Vision Agent phân tích 8 bước như thế nào?" },
        { label: "Formation?", question: "Tab Formation dùng để làm gì?" },
        { label: "Cách training?", question: "Cách thêm training examples?" },
      ],
    },
    "/dashboard/agent": {
      greeting: "🤖 **AI Agent**\n\nTự động phân tích qua:\n• **Telegram Bot** — gửi ảnh qua Telegram\n• **Zalo OA** — gửi ảnh qua Zalo\n• **Web Chat** — chat trực tiếp",
      hint: "💡 Kết nối Telegram Bot để nhận phân tích ngay trong app!",
      quickLinks: [
        { label: "Setup Telegram?", question: "Cách kết nối Telegram Bot?" },
        { label: "Setup Zalo?", question: "Cách kết nối Zalo OA?" },
        { label: "Liên kết ví?", question: "Cách liên kết Circle Wallet với Telegram?" },
      ],
    },
    "/layout-editor": {
      greeting: "🏪 **Store Layout Editor**\n\nThiết kế layout 3D · Mint NFT · Bán trên Marketplace.",
      hint: "💡 Lưu layout → Mint NFT → Bán kiếm USDC!",
      quickLinks: [
        { label: "Cách vẽ layout?", question: "Cách sử dụng Store Layout Editor?" },
        { label: "Mint NFT?", question: "Mint Layout NFT là gì?" },
      ],
    },
    "/forum": {
      greeting: "🛒 **Forum & Marketplace**\n\nMua/bán layout · Thảo luận FMCG · Thanh toán USDC.",
      hint: "💡 Tạo layout đẹp → Bán kiếm USDC!",
      quickLinks: [
        { label: "Mua layout?", question: "Cách mua layout trên Marketplace?" },
        { label: "Bán layout?", question: "Cách đăng bán layout?" },
      ],
    },
  },

  en: {
    "/": {
      greeting: "👋 Hello! I'm **StoreScope AI Assistant**.\n\nWelcome to the AI-powered FMCG shelf analytics platform!\n\nHow can I help you?",
      hint: "💡 Click **Let's get started** to begin your experience!",
      quickLinks: [
        { label: "🚀 Get Started", href: "/login" },
        { label: "What is StoreScope AI?", question: "What is StoreScope AI and what can it do?" },
        { label: "How much does it cost?", question: "What is the pricing for StoreScope AI?" },
        { label: "How does it work?", question: "How does StoreScope AI work?" },
      ],
    },
    "/login": {
      greeting: "👋 Welcome back!\n\nSign in using:\n• **Circle Wallet** — MPC wallet, no MetaMask needed\n• **MetaMask** — ARC Testnet wallet\n• **Anonymous** — try for free",
      hint: "💡 Use Anonymous access to try without a wallet!",
      quickLinks: [
        { label: "What is Circle Wallet?", question: "What is Circle Wallet and how to create one?" },
        { label: "Do I need MetaMask?", question: "Do I need MetaMask to use StoreScope AI?" },
        { label: "Anonymous access?", question: "Can I use StoreScope AI anonymously?" },
      ],
    },
    "/dashboard": {
      greeting: "👋 Welcome to your Dashboard!\n\nAccess all features from here.\n\nWhat do you need help with?",
      hint: "💡 Try **AI Analysis** to analyze your first shelf image!",
      quickLinks: [
        { label: "Analyze Shelf Image", href: "/dashboard/analysis" },
        { label: "Vision Agent?", question: "How is Vision Agent different from AI Analysis?" },
        { label: "What is AI Agent?", question: "How does the AI Agent work?" },
      ],
    },
    "/dashboard/analysis": {
      greeting: "📸 **AI Analysis**\n\nUpload shelf image → 10 micro-tasks → SKU detection, Share of Shelf, OSA alerts.",
      hint: "💡 Cost: $0.025 USDC per analysis — Circle or MetaMask",
      quickLinks: [
        { label: "How to upload?", question: "How do I upload and analyze a shelf image?" },
        { label: "What is OSA?", question: "What is On-Shelf Availability (OSA)?" },
        { label: "Fund my wallet?", question: "How do I fund my wallet with USDC?" },
      ],
    },
    "/dashboard/vision-agent": {
      greeting: "🔬 **Vision Agent** — 8-Step Analysis:\n1. Image quality & perspective\n2. Product count\n3. Brand/SKU detection\n4. Facing count\n5. Shelf position\n6. Share of Shelf\n7. OSA alerts\n8. Recommendations",
      hint: "💡 The **Formation** tab has 24 Pepsi SKUs trained!",
      quickLinks: [
        { label: "What are the 8 steps?", question: "How does Vision Agent analyze in 8 steps?" },
        { label: "What is Formation?", question: "What is the Formation tab for?" },
        { label: "How to train?", question: "How do I add training examples?" },
      ],
    },
    "/dashboard/agent": {
      greeting: "🤖 **AI Agent**\n\nAutomatic analysis via:\n• **Telegram Bot** — send images via Telegram\n• **Zalo OA** — send images via Zalo\n• **Web Chat** — direct chat",
      hint: "💡 Connect Telegram Bot to receive analysis in the Telegram app!",
      quickLinks: [
        { label: "Setup Telegram?", question: "How to connect the Telegram Bot?" },
        { label: "Setup Zalo?", question: "How to connect Zalo OA?" },
        { label: "Link Circle Wallet?", question: "How to link Circle Wallet with Telegram?" },
      ],
    },
    "/layout-editor": {
      greeting: "🏪 **Store Layout Editor**\n\n3D toon layout design · Mint NFT · Sell on Marketplace.",
      hint: "💡 Save layout → Mint NFT → Sell for USDC!",
      quickLinks: [
        { label: "How to create layout?", question: "How do I use the Store Layout Editor?" },
        { label: "Mint NFT?", question: "What is Layout NFT minting?" },
      ],
    },
    "/forum": {
      greeting: "🛒 **Forum & Marketplace**\n\nBuy/sell layouts · FMCG discussions · Pay with USDC.",
      hint: "💡 Create great layouts → Sell for USDC!",
      quickLinks: [
        { label: "Buy a layout?", question: "How do I buy a layout on the Marketplace?" },
        { label: "Sell my layout?", question: "How do I list my layout for sale?" },
      ],
    },
  },

  zh: {
    "/": {
      greeting: "👋 您好！我是 **StoreScope AI 助手**。\n\n欢迎来到 AI 驱动的 FMCG 货架分析平台！\n\n有什么可以帮您？",
      hint: "💡 点击 **立即开始** 体验我们的平台！",
      quickLinks: [
        { label: "🚀 立即开始", href: "/login" },
        { label: "什么是StoreScope AI?", question: "StoreScope AI 是什么，能做什么？" },
        { label: "费用是多少?", question: "使用 StoreScope AI 的费用是多少？" },
        { label: "如何运作?", question: "StoreScope AI 是如何运作的？" },
      ],
    },
    "/login": {
      greeting: "👋 欢迎回来！\n\n登录方式：\n• **Circle 钱包** — MPC 钱包，无需 MetaMask\n• **MetaMask** — ARC 测试网钱包\n• **匿名访问** — 免费体验",
      hint: "💡 使用匿名访问，无需钱包即可体验！",
      quickLinks: [
        { label: "什么是Circle钱包?", question: "什么是 Circle 钱包，如何创建？" },
        { label: "需要MetaMask吗?", question: "我需要 MetaMask 才能使用吗？" },
        { label: "匿名访问?", question: "我可以匿名使用 StoreScope AI 吗？" },
      ],
    },
    "/dashboard": {
      greeting: "👋 欢迎来到控制台！\n\n从这里访问所有功能。\n\n需要什么帮助？",
      hint: "💡 试试 **AI 分析** 来分析您的第一张货架图片！",
      quickLinks: [
        { label: "分析货架图片", href: "/dashboard/analysis" },
        { label: "视觉代理是什么?", question: "视觉代理和AI分析有什么不同？" },
        { label: "AI代理是什么?", question: "AI 代理是如何工作的？" },
      ],
    },
    "/dashboard/analysis": {
      greeting: "📸 **AI 分析**\n\n上传货架图片 → 10个微任务 → SKU检测、货架份额、OSA预警。",
      hint: "💡 费用：每次分析 $0.025 USDC — Circle 或 MetaMask",
      quickLinks: [
        { label: "如何上传图片?", question: "如何上传并分析货架图片？" },
        { label: "什么是OSA?", question: "什么是货架可用性（OSA）？" },
        { label: "如何充值USDC?", question: "如何充值 USDC？" },
      ],
    },
    "/dashboard/vision-agent": {
      greeting: "🔬 **视觉代理** — 8步分析：\n1. 图像质量与透视\n2. 产品计数\n3. 品牌/SKU识别\n4. 陈列面计数\n5. 货架位置\n6. 货架份额\n7. OSA预警\n8. 优化建议",
      hint: "💡 **培训** 标签已有24个百事可乐SKU！",
      quickLinks: [
        { label: "8步分析是什么?", question: "视觉代理的8步分析是什么？" },
        { label: "培训功能?", question: "培训标签有什么用？" },
        { label: "如何训练代理?", question: "如何添加训练示例？" },
      ],
    },
    "/dashboard/agent": {
      greeting: "🤖 **AI 代理**\n\n通过以下渠道自动分析：\n• **Telegram 机器人** — 通过Telegram发送图片\n• **Zalo OA** — 通过Zalo发送图片\n• **网页聊天** — 直接聊天",
      hint: "💡 连接Telegram机器人，在Telegram应用内接收分析结果！",
      quickLinks: [
        { label: "设置Telegram?", question: "如何连接 Telegram 机器人？" },
        { label: "设置Zalo?", question: "如何连接 Zalo OA？" },
        { label: "关联Circle钱包?", question: "如何将 Circle 钱包与 Telegram 关联？" },
      ],
    },
    "/layout-editor": {
      greeting: "🏪 **门店布局编辑器**\n\n3D卡通布局设计 · 铸造NFT · 在市场销售。",
      hint: "💡 创建布局 → 铸造NFT → 出售赚取USDC！",
      quickLinks: [
        { label: "如何创建布局?", question: "如何使用门店布局编辑器？" },
        { label: "铸造NFT?", question: "什么是布局NFT铸造？" },
      ],
    },
    "/forum": {
      greeting: "🛒 **论坛与市场**\n\n买卖布局 · FMCG讨论 · USDC支付。",
      hint: "💡 创建精美布局 → 出售赚取USDC！",
      quickLinks: [
        { label: "购买布局?", question: "如何在市场购买布局？" },
        { label: "出售我的布局?", question: "如何上架我的布局出售？" },
      ],
    },
  },
};

const DEFAULT_CTX: Record<Lang, PageCtx> = {
  vi: { greeting: "👋 Xin chào! Tôi có thể giúp gì cho bạn về StoreScope AI?", hint: "", quickLinks: [{ label: "Trang chủ", href: "/" }] },
  en: { greeting: "👋 Hello! How can I help you with StoreScope AI?", hint: "", quickLinks: [{ label: "Home", href: "/" }] },
  zh: { greeting: "👋 您好！我能帮您了解 StoreScope AI 的什么？", hint: "", quickLinks: [{ label: "首页", href: "/" }] },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReceptionistWidget() {
  const pathname = usePathname();
  const [open,    setOpen]   = useState(false);
  const [unread,  setUnread] = useState(1);
  const [loading, setLoading] = useState(false);
  const [input,   setInput]  = useState("");
  const [lang,    setLang]   = useState<Lang>("vi");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const ctx = (PAGE_CONTEXT[lang][pathname] ?? DEFAULT_CTX[lang]);
  const ui  = UI[lang];
  const isLanding = pathname === "/";

  const [messages, setMessages] = useState<{role:"user"|"agent";content:string;timestamp:number}[]>(() => [
    { role: "agent", content: ctx.greeting + (ctx.hint ? `\n\n${ctx.hint}` : ""), timestamp: Date.now() },
  ]);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on page or lang change
  useEffect(() => {
    const c = PAGE_CONTEXT[lang][pathname] ?? DEFAULT_CTX[lang];
    setMessages([{ role: "agent", content: c.greeting + (c.hint ? `\n\n${c.hint}` : ""), timestamp: Date.now() }]);
    setUnread(1);
  }, [pathname, lang]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setShowLangMenu(false);
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
        role: m.role === "agent" ? "assistant" : "user", content: m.content,
      }));
      const res  = await fetch("/api/agent/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, page: pathname, lang }),
      });
      const data = await res.json() as { reply?: string };
      setMessages(prev => [...prev, { role: "agent", content: data.reply ?? ui.error, timestamp: Date.now() }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: ui.error, timestamp: Date.now() }]);
    } finally { setLoading(false); }
  }, [input, loading, messages, open, pathname, lang, ui.error]);

  const renderText = (text: string) => text.split(/\*\*(.+?)\*\*/g).map((p, i) =>
    i % 2 === 1 ? <strong key={i} style={{ color: "#f0f0f0" }}>{p}</strong> : <span key={i}>{p}</span>
  );

  return (
    <>
      <style>{`
        @keyframes receptPop { from{opacity:0;transform:scale(.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes receptPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes receptBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>

      {/* Bubble */}
      {!open && (
        <button onClick={() => setOpen(true)}
          style={{ position:"fixed", bottom:28, right:28, zIndex:9000, width:64, height:64, borderRadius:"50%", border:"none", background:"linear-gradient(135deg,#4c1d95,#7c3aed)", cursor:"pointer", boxShadow:"0 6px 28px rgba(124,58,237,0.65)", display:"flex", alignItems:"center", justifyContent:"center", transition:"transform 0.2s, box-shadow 0.2s", animation: isLanding ? "receptBounce 2s ease-in-out infinite" : "none", overflow:"hidden", padding:0 }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="scale(1.12)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(124,58,237,0.8)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 6px 28px rgba(124,58,237,0.65)"; }}
        >
          <img src="/guide-icon.png" alt="AI Assistant" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          {unread > 0 && <span style={{ position:"absolute", top:-3, right:-3, background:"#ef4444", color:"#fff", width:20, height:20, borderRadius:"50%", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", animation:"receptPulse 1.5s infinite" }}>{unread}</span>}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{ position:"fixed", bottom:28, right:28, zIndex:9000, width:360, maxHeight:"82vh", display:"flex", flexDirection:"column", background:"#0f0f0f", border:"1px solid #2a2a2a", borderRadius:20, overflow:"hidden", boxShadow:"0 24px 60px rgba(0,0,0,0.9)", animation:"receptPop 0.2s ease-out" }}>

          {/* Header */}
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #1f1f1f", display:"flex", alignItems:"center", gap:10, background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(99,102,241,0.15))", flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#4c1d95,#7c3aed)", flexShrink:0, overflow:"hidden" }}>
              <img src="/guide-icon.png" alt="AI" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>{ui.subtitle}</div>
              <div style={{ fontSize:10, color:"#4ade80" }}>{ui.online}</div>
            </div>

            {/* Language selector */}
            <div style={{ position:"relative" }}>
              <button onClick={() => setShowLangMenu(v => !v)}
                style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#ccc", cursor:"pointer", padding:"4px 8px", fontSize:11, fontWeight:600 }}>
                {LANG_LABELS[lang]}
              </button>
              {showLangMenu && (
                <div style={{ position:"absolute", top:34, right:0, background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:10, overflow:"hidden", zIndex:1 }}>
                  {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
                    <button key={l} onClick={() => { setLang(l); setShowLangMenu(false); }}
                      style={{ display:"block", width:"100%", padding:"9px 16px", background: l === lang ? "rgba(124,58,237,0.15)" : "transparent", border:"none", color: l === lang ? "#a78bfa" : "#888", cursor:"pointer", fontSize:12, textAlign:"left", whiteSpace:"nowrap" }}>
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setOpen(false)} title={ui.minimize}
              style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"#888", cursor:"pointer", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>
              ─
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflow:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:10, minHeight:0 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start", alignItems:"flex-end", gap:6 }}>
                {m.role === "agent" && <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#4c1d95,#7c3aed)", flexShrink:0, marginBottom:2, overflow:"hidden" }}><img src="/guide-icon.png" alt="AI" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>}
                <div style={{ maxWidth:"80%", padding:"10px 13px", borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role==="user" ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "#1a1a1a", border: m.role==="agent" ? "1px solid #2a2a2a" : "none", fontSize:12, color:"#e0e0e0", lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                  {renderText(m.content)}
                  <div style={{ fontSize:9, color: m.role==="user" ? "rgba(255,255,255,0.4)" : "#444", marginTop:4, textAlign:"right" }}>
                    {new Date(m.timestamp).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#4c1d95,#7c3aed)", overflow:"hidden" }}><img src="/guide-icon.png" alt="AI" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>
                <div style={{ padding:"10px 14px", background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:"16px 16px 16px 4px", display:"flex", gap:4 }}>
                  {[0,1,2].map(d=><div key={d} style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed", animation:`receptPulse 1.2s ${d*.2}s infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Quick links */}
          <div style={{ padding:"8px 12px", borderTop:"1px solid #1a1a1a", display:"flex", gap:5, flexWrap:"wrap", background:"#0a0a0a", flexShrink:0 }}>
            {ctx.quickLinks.map((ql, i) => (
              ql.href
                ? <Link key={i} href={ql.href} style={{ fontSize:10, padding:"4px 9px", borderRadius:999, background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.3)", color:"#a78bfa", textDecoration:"none", display:"inline-block" }}>{ql.label}</Link>
                : <button key={i} onClick={() => sendMessage(ql.question)} style={{ fontSize:10, padding:"4px 9px", borderRadius:999, background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)", color:"#a78bfa", cursor:"pointer" }}>{ql.label}</button>
            ))}
          </div>

          {/* CTA on landing */}
          {isLanding && (
            <div style={{ padding:"10px 14px", background:"rgba(124,58,237,0.08)", borderTop:"1px solid rgba(124,58,237,0.2)", flexShrink:0 }}>
              <Link href="/login" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", background:"linear-gradient(135deg,#7c3aed,#6366f1)", color:"#fff", borderRadius:12, textDecoration:"none", fontSize:13, fontWeight:700 }}>
                {ui.cta}
              </Link>
            </div>
          )}

          {/* Input */}
          <div style={{ padding:"10px 12px", borderTop:"1px solid #1f1f1f", background:"#0a0a0a", flexShrink:0, display:"flex", gap:8 }}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
              placeholder={ui.placeholder} disabled={loading}
              style={{ flex:1, background:"#111", border:"1px solid #2a2a2a", borderRadius:10, padding:"9px 12px", color:"#f0f0f0", fontSize:12, outline:"none" }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim()||loading}
              style={{ width:38, height:38, borderRadius:10, flexShrink:0, background: input.trim()&&!loading ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "#1a1a1a", color: input.trim()&&!loading ? "#fff" : "#555", border:"none", cursor: input.trim()&&!loading ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
              {loading ? <div style={{ width:12, height:12, borderRadius:"50%", border:"2px solid #555", borderTopColor:"#a78bfa", animation:"receptPulse 0.6s linear infinite" }}/> : "↑"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
