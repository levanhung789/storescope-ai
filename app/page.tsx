"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Language = "en" | "vi" | "zh";

const DEMO_USERNAME = "ADmin123";
const DEMO_PASSWORD = "888000";

const content = {
  en: {
    brandSub: "Retail Intelligence Platform",
    heroTag: "Smart Retail Operations",
    heroTitle1: "Welcome to the future of",
    heroTitle2: "Retail AI Management",
    heroDesc:
      "Monitor shelves, analyze products, and optimize store performance with AI-powered insights built for modern retail teams.",
    card1Title: "Store Overview",
    card1Desc: "Unified retail visibility",
    card2Title: "AI Detection",
    card2Desc: "Fast shelf recognition",
    card3Title: "Analytics",
    card3Desc: "Actionable performance data",
    welcome: "Welcome Back",
    signIn: "Sign in to your account",
    signInDesc: "Access your retail dashboard and AI monitoring tools.",
    username: "Username",
    usernamePlaceholder: "Enter your username",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    forgot: "Forgot password?",
    button: "Sign In",
    contactText: "Need access for your retail team?",
    contactLink: "Contact administrator",
    langLabel: "Language",
    success: "Login successful. Redirecting...",
    error: "Invalid username or password.",
    demoHint: "Demo account is enabled for local testing.",
  },
  vi: {
    brandSub: "Nền tảng trí tuệ bán lẻ",
    heroTag: "Vận hành bán lẻ thông minh",
    heroTitle1: "Chào mừng đến với tương lai của",
    heroTitle2: "Quản lý AI ngành bán lẻ",
    heroDesc:
      "Giám sát kệ hàng, phân tích sản phẩm và tối ưu hiệu suất cửa hàng với các thông tin chuyên sâu được hỗ trợ bởi AI dành cho đội ngũ bán lẻ hiện đại.",
    card1Title: "Tổng quan cửa hàng",
    card1Desc: "Theo dõi toàn bộ hệ thống bán lẻ",
    card2Title: "Nhận diện AI",
    card2Desc: "Nhận diện kệ hàng nhanh chóng",
    card3Title: "Phân tích dữ liệu",
    card3Desc: "Dữ liệu hành động rõ ràng",
    welcome: "Chào mừng trở lại",
    signIn: "Đăng nhập vào tài khoản",
    signInDesc: "Truy cập bảng điều khiển bán lẻ và công cụ giám sát AI.",
    username: "Tên đăng nhập",
    usernamePlaceholder: "Nhập tên đăng nhập",
    password: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu",
    remember: "Ghi nhớ đăng nhập",
    forgot: "Quên mật khẩu?",
    button: "Đăng nhập",
    contactText: "Cần quyền truy cập cho đội ngũ bán lẻ?",
    contactLink: "Liên hệ quản trị viên",
    langLabel: "Ngôn ngữ",
    success: "Đăng nhập thành công. Đang chuyển trang...",
    error: "Sai tên đăng nhập hoặc mật khẩu.",
    demoHint: "Tài khoản demo đang được bật để kiểm tra local.",
  },
  zh: {
    brandSub: "零售智能平台",
    heroTag: "智能零售运营",
    heroTitle1: "欢迎来到",
    heroTitle2: "零售 AI 管理的未来",
    heroDesc:
      "借助 AI 驱动的洞察，监控货架、分析商品并优化门店表现，为现代零售团队提供高效工具。",
    card1Title: "门店概览",
    card1Desc: "统一零售可视化",
    card2Title: "AI 识别",
    card2Desc: "快速识别货架商品",
    card3Title: "数据分析",
    card3Desc: "可执行的绩效数据",
    welcome: "欢迎回来",
    signIn: "登录您的账户",
    signInDesc: "访问您的零售仪表板和 AI 监控工具。",
    username: "用户名",
    usernamePlaceholder: "请输入用户名",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    remember: "记住我",
    forgot: "忘记密码？",
    button: "登录",
    contactText: "需要为您的零售团队开通访问权限？",
    contactLink: "联系管理员",
    langLabel: "语言",
    success: "登录成功。正在跳转...",
    error: "用户名或密码错误。",
    demoHint: "当前已启用本地测试演示账户。",
  },
};

export default function Page() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("vi");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const t = useMemo(() => content[language], [language]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setIsError(false);
      setMessage(t.success);

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);

      return;
    }

    setIsError(true);
    setMessage(t.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1400&q=80"
              alt="Retail AI Banner"
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-blue-900/70" />
          </div>

          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-slate-900 shadow-2xl shadow-cyan-500/30 ring-1 ring-white/20">
                <div className="absolute inset-1 rounded-[20px] border border-white/20" />
                <div className="relative text-2xl font-black text-white">S</div>
                <div className="absolute -right-1 -top-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-900 shadow">
                  AI
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">
                    Shelf<span className="text-cyan-300">Sight</span>
                  </h1>
                  <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-200 backdrop-blur">
                    AI
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
                  {t.brandSub}
                </p>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                {t.heroTag}
              </p>
              <h2 className="mb-6 text-5xl font-bold leading-tight">
                {t.heroTitle1}
                <span className="block text-cyan-300">{t.heroTitle2}</span>
              </h2>
              <p className="max-w-lg text-lg leading-8 text-slate-200">
                {t.heroDesc}
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-3 text-2xl text-cyan-300">🏬</div>
              <p className="font-semibold">{t.card1Title}</p>
              <p className="text-sm text-slate-300">{t.card1Desc}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-3 text-2xl text-cyan-300">📷</div>
              <p className="font-semibold">{t.card2Title}</p>
              <p className="text-sm text-slate-300">{t.card2Desc}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-3 text-2xl text-cyan-300">📊</div>
              <p className="font-semibold">{t.card3Title}</p>
              <p className="text-sm text-slate-300">{t.card3Desc}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <h1 className="text-3xl font-bold text-slate-900">
                ShelfSight AI
              </h1>
              <p className="mt-2 text-slate-600">{t.brandSub}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur">
              <div className="mb-6">
                <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t.langLabel}
                </label>

                <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      language === "en"
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    English
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage("vi")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      language === "vi"
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    Tiếng Việt
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage("zh")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      language === "zh"
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    中文
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600">
                  {t.welcome}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {t.signIn}
                </h2>
                <p className="mt-2 text-sm text-slate-500">{t.signInDesc}</p>
                <p className="mt-2 text-xs text-slate-400">{t.demoHint}</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t.username}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t.usernamePlaceholder}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>

                {message && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      isError
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="rounded" />
                    {t.remember}
                  </label>
                  <a
                    href="#"
                    className="font-medium text-cyan-600 hover:text-cyan-700"
                  >
                    {t.forgot}
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t.button}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                {t.contactText}{" "}
                <Link
                  href="#"
                  className="font-semibold text-cyan-600 hover:text-cyan-700"
                >
                  {t.contactLink}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}