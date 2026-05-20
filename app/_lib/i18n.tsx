"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "vi" | "en" | "zh";

export const LANG_NAMES: Record<Lang, string> = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇺🇸 English",
  zh: "🇨🇳 简体中文",
};

// ── Translations ───────────────────────────────────────────────────────────────
export const T: Record<Lang, Record<string, string>> = {
  vi: {
    // Navbar
    "nav.home":          "Trang chủ",
    "nav.dashboard":     "Dashboard",
    "nav.analysis":      "AI Analysis",
    "nav.visionAgent":   "Vision Agent",
    "nav.agent":         "AI Agent",
    "nav.reports":       "Báo cáo",
    "nav.layout":        "Store Layout",
    "nav.forum":         "Diễn đàn",
    "nav.login":         "Đăng nhập",
    "nav.getStarted":    "Let's get started",
    "nav.contact":       "Liên hệ",

    // Hero
    "hero.tag":          "Nền tảng AI cho FMCG Bán lẻ",
    "hero.title1":       "Biến ảnh kệ hàng",
    "hero.title2":       "thành dữ liệu kinh doanh",
    "hero.subtitle":     "StoreScope AI phân tích hình ảnh kệ hàng bằng AI, đo lường Share of Shelf, phát hiện hàng hết — thanh toán micro-transaction trên blockchain ARC.",
    "hero.cta1":         "Bắt đầu phân tích",
    "hero.cta2":         "Xem demo",

    // Stats
    "stats.accuracy":    "Độ chính xác AI",
    "stats.skus":        "SKUs trong catalog",
    "stats.steps":       "Bước phân tích",
    "stats.payment":     "Phí / lần phân tích",

    // HowItWorks
    "how.title":         "Cách hoạt động",
    "how.step1.title":   "Upload ảnh",
    "how.step1.desc":    "Chụp ảnh kệ hàng và upload lên nền tảng",
    "how.step2.title":   "AI Phân tích",
    "how.step2.desc":    "GPT-4o Vision phân tích 8 bước chuyên sâu",
    "how.step3.title":   "Nhận báo cáo",
    "how.step3.desc":    "Kết quả chi tiết: SKU, SoS, OSA, gợi ý tối ưu",

    // Services
    "services.title":    "Tính năng",
    "services.s1.title": "Phân tích kệ hàng AI",
    "services.s1.desc":  "GPT-4o Vision nhận dạng brand, SKU, facing count và Share of Shelf",
    "services.s2.title": "On-Shelf Availability",
    "services.s2.desc":  "Phát hiện hàng sắp hết, kệ trống — cảnh báo theo mức độ rủi ro",
    "services.s3.title": "Thanh toán Blockchain",
    "services.s3.desc":  "Micro-transaction USDC trên ARC Testnet, minh bạch on-chain",

    // Pricing
    "pricing.title":     "Chi phí",
    "pricing.per":       "mỗi lần phân tích",
    "pricing.tasks":     "10 micro-tasks",
    "pricing.desc":      "Mỗi task là 1 giao dịch USDC riêng biệt, có thể xác minh trên ArcScan",

    // CTA Banner
    "cta.title":         "Sẵn sàng tối ưu kệ hàng?",
    "cta.subtitle":      "Tham gia cùng các đội FMCG đang sử dụng AI để tăng doanh số",
    "cta.button":        "Bắt đầu ngay — miễn phí",

    // Footer
    "footer.rights":     "Tất cả quyền được bảo lưu",
    "footer.product":    "Sản phẩm",
    "footer.company":    "Công ty",
    "footer.contact":    "Liên hệ",

    // Dashboard
    "dash.welcome":      "Chào mừng",
    "dash.analyze":      "Phân tích ngay",
    "dash.recentReports":"Báo cáo gần đây",
    "dash.noReports":    "Chưa có báo cáo",
    "dash.totalAnalyses":"Tổng phân tích",
    "dash.connected":    "Đã kết nối",
    "dash.notConnected": "Chưa kết nối",

    // Analysis
    "analysis.upload":   "Upload ảnh kệ hàng",
    "analysis.drop":     "Kéo thả ảnh vào đây",
    "analysis.formats":  "JPG · PNG · WEBP",
    "analysis.run":      "Phân tích",
    "analysis.running":  "Đang phân tích...",
    "analysis.done":     "✓ Hoàn thành",
    "analysis.cost":     "Phí phân tích",

    // Common
    "common.save":       "Lưu",
    "common.cancel":     "Hủy",
    "common.close":      "Đóng",
    "common.loading":    "Đang tải...",
    "common.error":      "Lỗi",
    "common.success":    "Thành công",
    "common.viewMore":   "Xem thêm",
    "common.logout":     "Đăng xuất",
    "common.connect":    "Kết nối ví",
    "common.balance":    "Số dư",
  },

  en: {
    "nav.home":          "Home",
    "nav.dashboard":     "Dashboard",
    "nav.analysis":      "AI Analysis",
    "nav.visionAgent":   "Vision Agent",
    "nav.agent":         "AI Agent",
    "nav.reports":       "Reports",
    "nav.layout":        "Store Layout",
    "nav.forum":         "Forum",
    "nav.login":         "Sign In",
    "nav.getStarted":    "Let's get started",
    "nav.contact":       "Contact",

    "hero.tag":          "AI Platform for FMCG Retail",
    "hero.title1":       "Turn shelf images into",
    "hero.title2":       "business intelligence",
    "hero.subtitle":     "StoreScope AI analyzes shelf images with AI, measures Share of Shelf, detects stockouts — powered by micro-transactions on ARC blockchain.",
    "hero.cta1":         "Start analyzing",
    "hero.cta2":         "Watch demo",

    "stats.accuracy":    "AI Accuracy",
    "stats.skus":        "SKUs in catalog",
    "stats.steps":       "Analysis steps",
    "stats.payment":     "Cost per analysis",

    "how.title":         "How it works",
    "how.step1.title":   "Upload photo",
    "how.step1.desc":    "Take a shelf photo and upload to the platform",
    "how.step2.title":   "AI Analysis",
    "how.step2.desc":    "GPT-4o Vision runs 8-step in-depth analysis",
    "how.step3.title":   "Get report",
    "how.step3.desc":    "Detailed results: SKU, SoS, OSA alerts, optimization tips",

    "services.title":    "Features",
    "services.s1.title": "AI Shelf Analysis",
    "services.s1.desc":  "GPT-4o Vision identifies brands, SKUs, facing count and Share of Shelf",
    "services.s2.title": "On-Shelf Availability",
    "services.s2.desc":  "Detect low-stock and empty shelves with risk-level alerts",
    "services.s3.title": "Blockchain Payments",
    "services.s3.desc":  "USDC micro-transactions on ARC Testnet, verifiable on-chain",

    "pricing.title":     "Pricing",
    "pricing.per":       "per analysis",
    "pricing.tasks":     "10 micro-tasks",
    "pricing.desc":      "Each task is a separate USDC transaction, verifiable on ArcScan",

    "cta.title":         "Ready to optimize your shelves?",
    "cta.subtitle":      "Join FMCG teams using AI to boost sales",
    "cta.button":        "Get started — free",

    "footer.rights":     "All rights reserved",
    "footer.product":    "Product",
    "footer.company":    "Company",
    "footer.contact":    "Contact",

    "dash.welcome":      "Welcome",
    "dash.analyze":      "Analyze now",
    "dash.recentReports":"Recent reports",
    "dash.noReports":    "No reports yet",
    "dash.totalAnalyses":"Total analyses",
    "dash.connected":    "Connected",
    "dash.notConnected": "Not connected",

    "analysis.upload":   "Upload shelf image",
    "analysis.drop":     "Drop image here",
    "analysis.formats":  "JPG · PNG · WEBP",
    "analysis.run":      "Analyze",
    "analysis.running":  "Analyzing...",
    "analysis.done":     "✓ Complete",
    "analysis.cost":     "Analysis cost",

    "common.save":       "Save",
    "common.cancel":     "Cancel",
    "common.close":      "Close",
    "common.loading":    "Loading...",
    "common.error":      "Error",
    "common.success":    "Success",
    "common.viewMore":   "View more",
    "common.logout":     "Log out",
    "common.connect":    "Connect wallet",
    "common.balance":    "Balance",
  },

  zh: {
    "nav.home":          "首页",
    "nav.dashboard":     "控制台",
    "nav.analysis":      "AI 分析",
    "nav.visionAgent":   "视觉代理",
    "nav.agent":         "AI 代理",
    "nav.reports":       "报告",
    "nav.layout":        "门店布局",
    "nav.forum":         "论坛",
    "nav.login":         "登录",
    "nav.getStarted":    "立即开始",
    "nav.contact":       "联系我们",

    "hero.tag":          "FMCG 零售 AI 平台",
    "hero.title1":       "将货架图片转化为",
    "hero.title2":       "商业智能数据",
    "hero.subtitle":     "StoreScope AI 使用人工智能分析货架图片，测量货架占有率，检测缺货——通过 ARC 区块链微支付驱动。",
    "hero.cta1":         "开始分析",
    "hero.cta2":         "观看演示",

    "stats.accuracy":    "AI 准确率",
    "stats.skus":        "目录中的SKU",
    "stats.steps":       "分析步骤",
    "stats.payment":     "每次分析费用",

    "how.title":         "工作原理",
    "how.step1.title":   "上传图片",
    "how.step1.desc":    "拍摄货架照片并上传到平台",
    "how.step2.title":   "AI 分析",
    "how.step2.desc":    "GPT-4o Vision 进行8步深度分析",
    "how.step3.title":   "获取报告",
    "how.step3.desc":    "详细结果：SKU、货架占有率、OSA 预警、优化建议",

    "services.title":    "功能特点",
    "services.s1.title": "AI 货架分析",
    "services.s1.desc":  "GPT-4o Vision 识别品牌、SKU、陈列面数和货架占有率",
    "services.s2.title": "货架可用性监控",
    "services.s2.desc":  "检测低库存和空货架，按风险级别发出警报",
    "services.s3.title": "区块链支付",
    "services.s3.desc":  "ARC 测试网上的 USDC 微支付，链上可验证",

    "pricing.title":     "定价",
    "pricing.per":       "每次分析",
    "pricing.tasks":     "10 个微任务",
    "pricing.desc":      "每个任务是独立的 USDC 交易，可在 ArcScan 上验证",

    "cta.title":         "准备好优化您的货架了吗？",
    "cta.subtitle":      "加入使用 AI 提升销售额的 FMCG 团队",
    "cta.button":        "立即开始 — 免费",

    "footer.rights":     "版权所有",
    "footer.product":    "产品",
    "footer.company":    "公司",
    "footer.contact":    "联系我们",

    "dash.welcome":      "欢迎",
    "dash.analyze":      "立即分析",
    "dash.recentReports":"近期报告",
    "dash.noReports":    "暂无报告",
    "dash.totalAnalyses":"总分析次数",
    "dash.connected":    "已连接",
    "dash.notConnected": "未连接",

    "analysis.upload":   "上传货架图片",
    "analysis.drop":     "将图片拖放到此处",
    "analysis.formats":  "JPG · PNG · WEBP",
    "analysis.run":      "开始分析",
    "analysis.running":  "分析中...",
    "analysis.done":     "✓ 完成",
    "analysis.cost":     "分析费用",

    "common.save":       "保存",
    "common.cancel":     "取消",
    "common.close":      "关闭",
    "common.loading":    "加载中...",
    "common.error":      "错误",
    "common.success":    "成功",
    "common.viewMore":   "查看更多",
    "common.logout":     "退出登录",
    "common.connect":    "连接钱包",
    "common.balance":    "余额",
  },
};

// ── Context ────────────────────────────────────────────────────────────────────
interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string; }
const LangContext = createContext<LangCtx>({ lang: "vi", setLang: () => {}, t: k => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("vi");

  useEffect(() => {
    const saved = localStorage.getItem("storescope-lang") as Lang | null;
    if (saved && saved in T) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("storescope-lang", l);
  };

  const t = (key: string) => T[lang][key] ?? T["vi"][key] ?? key;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() { return useContext(LangContext); }
