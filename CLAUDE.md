# StoreScope AI — CLAUDE.md

## Mục tiêu dự án

Build website marketing cho **StoreScope AI** — nền tảng AI bán lẻ FMCG biến ảnh kệ hàng thành dữ liệu kinh doanh có cấu trúc. Website giới thiệu dịch vụ AI, không phải app nội bộ.

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript strict
- **Styling**: Tailwind CSS v4 — utility-first, không dùng CSS modules
- **Font**: Geist Sans (đã cài), cân nhắc thêm Inter nếu cần weight display lớn
- **Icons**: lucide-react (đã có)
- **Animation**: CSS transitions + `@keyframes` thuần, không cài thêm thư viện animation nếu chưa cần
- **3D / Particle**: Canvas API thuần hoặc Three.js nếu cần hiệu ứng sphere như reference

## Design System

### Triết lý
Tối giản — hiện đại — chuyên nghiệp. Lấy cảm hứng từ dala.craftedbygc.com:
- Nền đen tuyệt đối, không dùng gradient sặc sỡ
- Typography làm chủ layout, không dùng ảnh hero lớn
- Một màu accent duy nhất cho CTA
- Nhiều khoảng trống (generous whitespace)
- Hiệu ứng tinh tế: fade-in, subtle glow, particle/mesh 3D

### Màu sắc (Tailwind custom tokens — định nghĩa trong globals.css)
```
Background:   #080808  (--color-bg)
Surface:      #111111  (--color-surface)
Border:       #1f1f1f  (--color-border)
Text primary: #f5f5f5  (--color-text)
Text muted:   #6b6b6b  (--color-muted)
Accent:       #7c3aed  violet-700 — dùng cho CTA, highlight (--color-accent)
Accent glow:  rgba(124,58,237,0.15)
Gold particle:#f59e0b  amber-400 — chỉ dùng trong 3D visualization
```

### Typography
- **Display / Hero**: font-size clamp(3rem, 8vw, 7rem), font-weight 700–800, tracking-tight, line-height 1.05
- **Section title**: text-3xl–4xl, font-weight 600
- **Body**: text-base–lg, color muted, line-height 1.7
- **Label / Tag**: text-xs, uppercase, tracking-widest, color accent
- Không dùng màu trắng thuần `#fff` cho body text — dùng `#f5f5f5` / `#e5e5e5`

### Spacing
- Section padding: `py-32` (128px) desktop, `py-20` mobile
- Container max-width: `max-w-6xl mx-auto px-6`
- Grid gap: `gap-8` → `gap-12`

### Component style rules
- Border: `border border-white/8` — cực kỳ mỏng manh
- Card background: `bg-white/3` hoặc `bg-[#111]`
- Backdrop blur: dùng tiết kiệm, chỉ khi overlay
- Border radius: `rounded-2xl` (cards), `rounded-full` (tags/pills), `rounded-xl` (buttons)
- Không dùng `shadow-` lớn — dùng `glow` effect bằng `box-shadow: 0 0 40px var(--color-accent-glow)`

### Button
- **Primary**: bg accent + text white, `px-6 py-3 rounded-full text-sm font-semibold`
- **Ghost**: border `border-white/15`, text white, hover `bg-white/5`
- Không dùng icon emoji trong button — chỉ lucide-react

## Cấu trúc Website (Landing Page)

Trang chủ nằm tại `app/page.tsx`. Đây là **marketing landing page**, tách hoàn toàn khỏi `app/dashboard/` (app nội bộ).

### Sections theo thứ tự
1. **Navbar** — logo trái, nav links giữa, CTA button phải. Sticky, blur khi scroll
2. **Hero** — headline lớn, sub-text, 2 CTA buttons, particle sphere 3D (Canvas)
3. **Stats** — 3–4 con số nổi bật (animated counter khi vào viewport)
4. **How it works** — 3 bước flow: Upload → AI Analyze → Get Insights
5. **Services** — grid 3 cards: Shelf Detection / SKU Classification / Analytics
6. **Social proof** — logo khách hàng hoặc testimonial quote (placeholder nếu chưa có data)
7. **Pricing** — 3 tiers: Starter / Pro / Enterprise
8. **CTA Banner** — full-width dark, text lớn + button
9. **Footer** — links, copyright

### File structure
```
app/
  page.tsx                  ← Landing page (import sections)
  layout.tsx                ← Root layout (metadata, font)
  globals.css               ← CSS variables + base styles
  _components/
    Navbar.tsx              ← Có link "Liên hệ" → /contact
    Hero.tsx
    ParticleSphere.tsx      ← Canvas 3D particle effect
    Stats.tsx
    HowItWorks.tsx
    Services.tsx
    UseCases.tsx
    Pricing.tsx
    CtaBanner.tsx
    Footer.tsx
    ContactForm.tsx         ← Form liên hệ (client component)
  _hooks/
    useInView.ts
  contact/
    page.tsx                ← Trang /contact
  api/
    contact/
      route.ts              ← POST handler (placeholder, chưa gửi email thật)
  dashboard/                ← App nội bộ (giữ nguyên)
  login/                    ← Auth page (giữ nguyên)
```

## Coding Conventions

### TypeScript
- Strict mode bật. Không dùng `any`.
- Props interface đặt ngay trên component, không export nếu chỉ dùng trong file đó.
- Server component mặc định. Thêm `"use client"` chỉ khi cần event/state/hooks.

### Component rules
- Mỗi section = 1 file trong `_components/`
- Không có prop drilling sâu hơn 1 level — dùng composition
- Không hardcode string — đặt content object ở đầu file hoặc tách `content.ts`
- Multilingual: nếu cần i18n, dùng object `{ vi, en }` inline (không cài thư viện i18n)

### Tailwind
- Không viết CSS thuần ngoại trừ `globals.css` cho CSS variables và `@keyframes`
- Responsive: mobile-first — `sm:` `md:` `lg:`
- Không dùng `!important` hay override bằng inline style trừ trường hợp dynamic value (vd: particle position)

### Animation & Performance
- Dùng `IntersectionObserver` cho scroll-triggered animation, không dùng scroll event listener
- Canvas particle: request animation frame + cleanup khi unmount
- Tránh layout shift: đặt kích thước cố định cho hero section

## Quy tắc tuyệt đối KHÔNG làm
- Không dùng emoji trong UI (trừ khi user yêu cầu)
- Không thêm màu sắc mới ngoài design system đã định nghĩa
- Không thêm thư viện mới mà không hỏi trước
- Không đặt hardcoded credentials trong code
- Không dùng `<img>` ngoài thẻ Next.js `<Image>` cho ảnh sản phẩm (dùng `<img>` chỉ cho ảnh decorative/canvas)
- Không commit file `.env` hay credentials

## Dev workflow

```bash
npm run dev     # localhost:3000
npm run build   # production build
npm run lint    # ESLint check
```

Trước khi báo hoàn thành UI task: mở browser kiểm tra golden path + responsive mobile.

---

## Trạng thái dự án (cập nhật 2026-04-26)

### Đã hoàn thành

| Phần | Trạng thái | Ghi chú |
|---|---|---|
| Landing page (8 sections) | Hoàn thành | Navbar, Hero, Stats, HowItWorks, Services, UseCases, CtaBanner, Footer — **Pricing đã xóa** |
| ParticleSphere (Canvas 3D) | Hoàn thành | 520 particles, gold/white/purple, xoay auto |
| Trang `/contact` | Hoàn thành | Form 4 trường, validation 2 lớp, success card |
| API route `/api/contact` | Placeholder | Validate + log console, chưa gửi email thật |
| Layout Editor `/layout-editor` | Hoàn thành | React Three Fiber 3D, toon shading, drag/rotate, annotation notes |
| Layout Editor — Vẽ tường | Hoàn thành | Click-click chain segments, chọn/xóa, ESC thoát |
| Layout Editor — Store size editor | Hoàn thành | Popover W×H (m) |
| Layout Editor — Toon/Cartoon 3D | Hoàn thành | MeshToonMaterial, 2-step gradient, dark outlines, dark background |
| Layout Editor — Annotation/Note | Hoàn thành | Pin vàng 3D, click mở modal nhập title + text + ảnh |
| Layout Editor — English labels | Hoàn thành | Tên fixture tiếng Anh, font to hơn, layout ngang icon+text |
| Dashboard `/dashboard` | Hoàn thành | Dark theme, catalog auto-load từ `public/companies/` qua API |
| Dashboard — AI Analysis | Hoàn thành | 10 micro-task pipeline, USDC payment on ARC, report export |
| Dashboard — Product detail | Hoàn thành | `/dashboard/product` — mô tả, giá bán lẻ, đối thủ, khuyến mãi |
| Dashboard — My Reports | Hoàn thành | `/dashboard/reports` — lưu/xem/xóa/export CSV/JSON/PDF per wallet |
| Forum & Marketplace | Hoàn thành | `/forum` — mua/bán layout USDC, discussion |
| Login page | Hoàn thành | Dark theme, storescope.ai brand, show/hide password |
| Anonymous Access | Hoàn thành | Tạo danh tính ngẫu nhiên (VD: SwiftAnalyst#7F2A), toàn quyền |
| Wallet — Connect & Verify | Hoàn thành | SIWE: ký message xác nhận chủ ví mỗi session, nonce ngẫu nhiên |
| Wallet — Balance display | Hoàn thành | xx.xx USDC (6 decimals đúng cho ARC), dropdown gọn |
| ARC Network integration | Hoàn thành | wagmi v3, viem, Chain ID 5042002, USDC native gas |
| Deploy | Hoàn thành | GitHub: storescope-ai + storescope-ai-ARC, Vercel: storescope-ai.vercel.app |

### File cấu trúc Layout Editor (3D)

```
app/_components/LayoutEditor/
  LayoutEditor.tsx      ← Orchestrator, toolbar, state, store size editor, keyboard shortcuts
  LayoutCanvas3D.tsx    ← React Three Fiber scene, toon shading, drag/rotate fixtures
  FixturePanel.tsx      ← Left sidebar, fixture type buttons với SVG icons
  Inspector.tsx         ← Right sidebar, thuộc tính fixture đang chọn
  fixtureLibrary.ts     ← 14 FixtureTypeDef definitions
  types.ts              ← FixtureInstance, WallLine, ToolMode, LayoutDocument, ...
```

### Chi tiết kỹ thuật Layout Editor 3D (2026-04-25)

**Tech stack 3D:**
- `@react-three/fiber` — React renderer cho Three.js
- `@react-three/drei` — OrbitControls, Text
- `@react-three/postprocessing` — EffectComposer, Outline (cartoon black edges)
- `meshToonMaterial` + 2-step DataTexture gradient (shadow / highlight)
- `THREE.NoToneMapping` — màu flat không bị tone-map photorealistic

**Toon shading setup:**
- Toon gradient: `new Uint8Array([90, 220])` — 2-step, sharp cartoon look
- Outline: `edgeStrength={14}`, `visibleEdgeColor={0x111111}` — viền đen đậm
- Ambient light `intensity={3.5}` — flat/bright không đổ bóng quá tối
- Background: `#f0ede6` — nền kem ấm

**Fixture models đã implement:**
- `CoolerModel` — tủ mát (food + Pepsi variant): dark navy body, cyan glass door, shelves, products, LED strips
- `CheckoutModel` — quầy thu ngân: belt, POS screen, sneeze guard
- `ProduceShelfModel` — kệ rau củ: 2×3 basket grid với sphere fruits
- `FreshCounterModel`, `GondolaModel`, `WallShelfModel`, `EndcapModel`
- `BakeryShelfModel`, `PromoIslandModel`, `CheckoutImpulseModel`
- `EntryExitModel` (cổng + cây xanh), `ObstacleModel` (cột)

**Các lỗi đã fix (2026-04-25):**
- `useMemo` gọi trong JSX → tách ra hook `floorGrid` trước return
- `THREE.PCFSoftShadowMap` deprecated → `{ type: THREE.PCFShadowMap }`
- Hai glass planes chồng nhau → 1 `planeGeometry` với `DoubleSide`
- Fixtures spawn cùng vị trí → stagger `x += fixtures.length * 400mm`
- Header glow strip nằm ngang trên đỉnh tủ → chuyển thành stripe trên mặt trước
- `emissiveIntensity` quá cao (2.8–3.0) → giảm xuống 0.35–0.6 với toon material

### Bước tiếp theo

1. **Smart contract thật cho Layout Mint** — `MintModal.tsx` hiện dùng mock tx. Cần deploy `LayoutRegistry.sol` lên ARC testnet và thay `writeContract` thật.

2. **Smart contract cho Analysis payment** — `PaymentGateModal` gọi `USDC.transfer` thật nhưng chưa có contract nhận và ghi log on-chain.

3. **Kết nối gửi email thật** — `app/api/contact/route.ts` chỉ log console. Cần Resend API key hoặc SMTP credentials.

4. **Logo** — Navbar dùng text `storescope.ai`. Nếu có SVG/PNG, thêm vào `public/` và dùng `<Image>`.

5. **OG image** — `app/opengraph-image.png` chưa có.

6. **`public/companies/` trên Vercel** — 203MB ảnh sản phẩm bị gitignore, không deploy được. Cần upload lên Cloudinary/S3 hoặc dùng Vercel Blob Storage.

### Quyết định quan trọng đã đưa ra

| Quyết định | Lý do |
|---|---|
| API `/api/contact` chỉ log console | Không cài Resend/Nodemailer khi chưa có credentials |
| Layout Editor chuyển Konva 2D → R3F 3D | Yêu cầu toon/cartoon 3D — không thể làm với Konva |
| `meshToonMaterial` + 2-step gradient | Flat cartoon look, nhẹ hơn PBR |
| `useMemo` floor grid đặt ngoài JSX | React hooks rule — không gọi hook trong JSX |
| `emissiveIntensity` ≤ 0.6 với toon | Toon cộng emissive trực tiếp, dễ overexpose |
| ARC USDC = 6 decimals, không phải 18 | wagmi mặc định 18 cho native token — phải override |
| SIWE ký message mỗi session | Xác nhận chủ ví, nonce ngẫu nhiên ngăn replay attack |
| Anonymous access = localStorage only | Không cần backend, danh tính sinh client-side |
| `public/companies/` gitignored | 203MB quá lớn cho GitHub — lưu local, cần CDN cho production |
| Pricing section xóa | Demo phase — chưa thu phí, tránh gây hiểu nhầm |
| ARC Analysis = 10 micro-tasks × USDC | Mỗi task là 1 tx riêng biệt, verifiable on-chain |
| Report lưu localStorage theo wallet | Mỗi ví có data riêng, không cần backend auth |
| Anonymous identity 24×18 combos + hex | Hàng triệu tên không trùng, đủ cho demo scale |

### File cấu trúc đầy đủ (2026-04-26)

```
app/
  page.tsx                        ← Landing (8 sections, Pricing đã xóa)
  layout.tsx                      ← Root layout + ArcProvider (wagmi)
  globals.css
  _lib/
    arc.ts                        ← ARC chain config, ANALYSIS_TASKS, pricing
    anonymousAuth.ts              ← Anonymous identity generator + localStorage
  _components/
    Navbar.tsx                    ← "Request access" → /login
    Hero.tsx, Stats.tsx, HowItWorks.tsx, Services.tsx, UseCases.tsx
    CtaBanner.tsx, Footer.tsx
    ParticleSphere.tsx            ← Canvas 3D particle
    ContactForm.tsx
    ArcProvider.tsx               ← wagmi + react-query provider
    WalletButton.tsx              ← Connect + SIWE verify + balance xx.xx
    AnonBadge.tsx                 ← Anonymous identity badge
    AnalysisReport.tsx            ← Report view + exportCSV/JSON/print + saveReport
    LayoutEditor/
      LayoutEditor.tsx            ← Orchestrator, toolbar, MintModal, AnnotationEditor
      LayoutCanvas3D.tsx          ← R3F scene, toon shading, 15 fixture models
      FixturePanel.tsx            ← English labels, icon+text horizontal layout
      Inspector.tsx               ← Properties panel
      AnnotationEditor.tsx        ← Note modal (title + text + image)
      MintModal.tsx               ← Mint layout on ARC
      fixtureLibrary.ts           ← 15 fixtures (incl. annotation)
      types.ts                    ← FixtureInstance với note/noteImageUrl fields
  api/
    contact/route.ts              ← POST contact form (console log)
    companies/route.ts            ← GET catalog từ public/companies/ (graceful fallback)
  login/page.tsx                  ← Dark theme + Anonymous access button
  contact/page.tsx
  dashboard/
    page.tsx                      ← Catalog, AnonBadge, auto-load sectors
    analysis/page.tsx             ← 10 micro-tasks, USDC payment, report generation
    product/page.tsx              ← Product detail (prices, competitors, promos)
    reports/page.tsx              ← My Reports per wallet
  forum/
    page.tsx + ForumClient.tsx    ← Marketplace + Discussion
  layout-editor/page.tsx
```

### ARC Network — Technical Details

| Thuộc tính | Giá trị |
|---|---|
| Network | ARC Testnet |
| Chain ID | 5042002 |
| RPC | https://rpc.testnet.arc.network |
| USDC | 0x3600000000000000000000000000000000000000 (6 decimals) |
| Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com |
| Service wallet | 0x1234567890123456789012345678901234567890 (placeholder) |

### Analysis pricing (10 micro-tasks)

| Task | USDC |
|---|---|
| Upload / Register | $0.001 |
| Image quality check | $0.001 |
| Shelf object detection | $0.003 |
| SKU / product detection | $0.004 |
| Competitor visibility | $0.003 |
| Stock risk analysis | $0.002 |
| Store layout simulation | $0.004 |
| Recommendation generation | $0.003 |
| Human review request | $0.002 |
| Final report / proof record | $0.002 |
| **Total** | **$0.025** |

### GitHub remotes

| Remote | URL | Dùng cho |
|---|---|---|
| `vercel-repo` | github.com/levanhung789/storescope-ai | Vercel deployment |
| `arc` | github.com/levanhung789/storescope-ai-ARC | ARC hackathon submission |
| `origin` | github.com/levanhung789/storescope-ai-Shelby | Original repo |
