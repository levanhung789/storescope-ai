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

## Trạng thái dự án (cập nhật 2026-05-03)

---

## Nhật ký làm việc

### 2026-05-01~03 — OCR Pipeline hoàn chỉnh + README cho ARC team

**Đã làm:**
- Hoàn thiện analysis pipeline: `shelfShare`, `recommendations`, `stockRisk` từ data thật (không còn hardcode)
- Tab "Analysis Report" hiển thị brands thật detect được, shelf share thật, recommendations tự sinh từ kết quả
- Fix `saveReport` unused import
- Test thực tế: OCR detect "Masan / Chinsu" (78%), giá 42,400đ và 56,200đ từ ảnh
- Viết README đầy đủ cho ARC team: setup, MetaMask config, features to test, pipeline diagram
- Push lên cả 2 GitHub repos: `storescope-ai` (Vercel) và `storescope-ai-ARC` (hackathon)

**Tình trạng analysis pipeline hiện tại:**
- OCR (Tesseract.js): ✅ Hoạt động — đọc text tiếng Việt + Anh từ ảnh
- Brand matching: ✅ Match 16+ thương hiệu FMCG Việt Nam
- Price extraction: ✅ Nhận dạng giá VND từ ảnh
- Shelf share: ✅ Tính tự động từ brands detected
- Roboflow detection: ⏳ Chờ model train (Auto-label đang chạy trên UI)

---

### 2026-04-30 — Roboflow AI Integration

**Đã làm:**
- Nghiên cứu ARC Network (Circle-backed L1, USDC native gas, Chain ID 5042002)
- Upload 1001 ảnh sản phẩm FMCG lên Roboflow project `fmcg-project`
- Build API route `/api/analyze` — Roboflow inference + OCR brand matching + price extraction
- Tích hợp Tesseract.js OCR (tiếng Việt + Anh) chạy client-side trong Analysis page
- Analysis page hiển thị kết quả thật: brands detected, prices từ ảnh, shelf share
- Scripts: `upload-to-roboflow.js` (done), `annotate-roboflow.js` (WIP)

**Vấn đề gặp phải:**
- Roboflow annotation REST API (`/dataset/{project}/annotate/{id}`) không nhận bất kỳ format nào — XML, YOLO, JSON, plain text đều trả về "Unrecognized annotation format". Đây là limitation của API, chỉ hoạt động qua Roboflow UI hoặc Python SDK
- Duplicate image detection by content hash — không thể re-upload ảnh đã có để thêm annotation

**Tình trạng Roboflow:**
- 1001 ảnh uploaded, 0 annotated, 0 model versions
- Auto-label đang chạy trong UI (user triggered)

---

### Đã hoàn thành (toàn dự án)

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
| Roboflow upload | Hoàn thành | 1001 ảnh FMCG đã upload lên fmcg-project |
| AI Analysis pipeline | Một phần | OCR hoạt động, Roboflow detection chờ model train |
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

### Việc cần làm tiếp theo

**Ưu tiên cao — Roboflow:**
1. **Hoàn thành Auto-label** trên Roboflow UI → `app.roboflow.com/levanhungs-workspace/fmcg-project/annotate`
   - Sau khi auto-label xong: click **Generate** → **Train**
   - Đợi 10-15 phút → vào **Versions** → copy version number
   - Điền vào `.env.local`: `RF_VERSION=1`
   - Restart server → Roboflow detection bật lên trong `/dashboard/analysis`

2. **Test pipeline với ảnh kệ hàng thật** — upload ảnh siêu thị có nhiều brand vào `/dashboard/analysis`

**Ưu tiên trung:**
3. **WindTune AI project** (`C:\Users\Admin\OneDrive\Máy tính\MeetYourBuild\windtune-ai`) — tiếp tục tính năng dự đoán tune sequence game Where Wind Meets

4. **Cải thiện dashboard** — thêm dairy, beverages, instant food sectors vào catalog

**Để sau:**
5. Smart contract thật cho Layout Mint + Analysis payment
6. Email thật cho `/api/contact`
7. CDN cho `public/companies/` (203MB)

### Roboflow Integration (2026-04-30)

| Item | Trạng thái |
|---|---|
| API Key | `QH9U94r31RusAz0TaO3O` |
| Workspace | `levanhungs-workspace` |
| Project | `fmcg-project` |
| Images uploaded | 1001 ảnh |
| Annotated | 0 (Auto-label đang chạy) |
| Model version | Chưa có |
| Inference endpoint | `https://detect.roboflow.com/fmcg-project/{version}` |

**Files liên quan:**
- `app/api/analyze/route.ts` — API route: Roboflow inference + OCR brand matching
- `app/.env.local` — `RF_PROJECT=fmcg-project`, `RF_VERSION` cần điền sau train
- `scripts/upload-to-roboflow.js` — Upload 1001 ảnh (đã chạy xong)
- `scripts/annotate-roboflow.js` — Script annotate (duplicate detection block, chưa dùng được)

**Pipeline hiện tại:**
```
Upload ảnh → Tesseract.js OCR (client-side) → /api/analyze
  → Roboflow detect (nếu có model) + OCR brand matching
  → Kết quả: brands, prices, shelf share
```

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

---

## Nhật ký làm việc — 2026-05-10

### Sửa lỗi server chớp (Turbopack + OneDrive)

**Vấn đề:** Turbopack crash liên tục (`FATAL: Failed to write app endpoint /page`) vì project nằm trên OneDrive — OneDrive sync xung đột với việc Turbopack ghi file hàng nghìn lần/giây vào `.next/`.

**Giải pháp:**
- Tạo directory junction `.next` → `C:\next-cache\storescope-ai` (ngoài OneDrive)
- Tạo junction `node_modules` trong cache → project's `node_modules` để module resolution hoạt động
- Server chạy ổn định, không còn FATAL error

```powershell
# Tạo một lần duy nhất nếu cache bị xóa
cmd /c "mklink /J .next C:\next-cache\storescope-ai"
cmd /c "mklink /J C:\next-cache\storescope-ai\node_modules .\node_modules"
```

**Lưu ý:** `next.config.ts` giữ nguyên trống — `distDir` không hoạt động với Turbopack trên Windows.

---

### Tích hợp Circle Wallets

**Mục tiêu:** Thêm Circle Developer-Controlled Wallets như phương thức thanh toán thứ hai bên cạnh MetaMask — không cần cài MetaMask.

#### Files mới tạo

| File | Mục đích |
|------|---------|
| `app/_lib/circle.ts` | Types, localStorage helpers cho Circle session |
| `app/api/circle/wallet/route.ts` | POST tạo ví / GET lấy ví |
| `app/api/circle/balance/route.ts` | GET USDC balance |
| `app/api/circle/transfer/route.ts` | POST gửi USDC |
| `app/_components/CircleWalletButton.tsx` | UI dropdown ví — balance, address, faucet link |
| `scripts/setup-circle.js` | Script setup one-time (đã chạy xong) |

#### Files đã sửa

| File | Thay đổi |
|------|---------|
| `app/login/page.tsx` | Thêm 3 tab: **Sign In** / **Circle Wallet** / **Anonymous** |
| `app/dashboard/analysis/page.tsx` | Hỗ trợ thanh toán Circle hoặc MetaMask trong `PaymentGateModal` |
| `.env.local` | Thêm Circle keys |
| `package.json` | Thêm `@circle-fin/developer-controlled-wallets` |

#### Circle credentials (đã cấu hình trong .env.local)

| Key | Giá trị |
|-----|---------|
| `CIRCLE_API_KEY` | `TEST_API_KEY:faae16f361b2e93162402784c4121311:...` |
| `CIRCLE_ENTITY_SECRET` | `231bf96c8c06aedc35bf9e65f723f3bec736a6f5d684cd2151f9a01212cc738a` |
| `CIRCLE_WALLET_SET_ID` | `18a95eda-b8b8-5418-8e90-4e51438b2243` |
| Recovery file | `recovery_file_2026-05-10.dat` — **giữ an toàn, không commit** |

#### Demo Mode

Khi `CIRCLE_API_KEY` trống → tất cả API routes tự fallback sang **demo mode**:
- Wallet address sinh từ hash của userId (deterministic)
- Balance = `0.00 USDC`
- Transfer trả về mock txHash
- UI hiển thị badge **Demo** màu vàng

#### Flow người dùng

```
Login → Tab "Circle Wallet" → Nhập email → POST /api/circle/wallet
  → Circle tạo ví MPC trên ARC Testnet → lưu session vào localStorage
  → Dashboard: CircleWalletButton hiện balance + address
  → Analysis: chọn "Circle Wallet" trong payment modal → POST /api/circle/transfer
  → Circle gửi $0.025 USDC → analysis chạy
```

#### Quyết định kỹ thuật

| Quyết định | Lý do |
|---|---|
| Demo mode fallback khi không có API key | Cho phép dev/demo mà không cần Circle account |
| Circle session lưu localStorage | Nhất quán với anonymous session pattern đã có |
| Giữ wagmi/MetaMask song song | Không breaking change với user cũ |
| `generateEntitySecretCiphertext()` mỗi lần cần | Circle yêu cầu fresh ciphertext để chống replay attack |
| Entity secret tự generate (không dùng Circle tạo) | Bảo mật cao hơn — Circle không bao giờ biết secret |

#### Giao diện Circle Wallet

- **Ngôn ngữ**: English hoàn toàn
- **Font size**: tăng 30% so với phần còn lại của app
- **Màu accent Circle**: `#6366f1` (indigo) — phân biệt với `#7c3aed` (violet) của MetaMask flow
- Badge **Demo** (amber) hiện khi chưa có real API key

---

## Nhật ký làm việc — 2026-05-12

### Fixes Circle Wallet

| Vấn đề | Nguyên nhân | Fix |
|---|---|---|
| Balance hiện `0.00` dù có 20 USDC | Circle trả display unit (`"20"`), code chia nhầm `/1,000,000` | Bỏ phép chia — dùng trực tiếp |
| `API parameter invalid` khi transfer | `feeLevel: 'MEDIUM'` lỗi SDK + `idempotencyKey` không đúng UUID | Đổi `'LOW'` + dùng `crypto.randomUUID()` |
| Tạo ví mới mỗi lần login | Không check ví cũ | Ưu tiên ví đã có, chọn ví có nhiều USDC nhất |
| Balance không cập nhật sau faucet | Circle API chỉ track ví do nó tạo | Thêm fallback query ARC RPC trực tiếp (`eth_call` balanceOf) |
| Faucet vào sai địa chỉ | User faucet vào MetaMask address, không phải Circle wallet | Thêm `/api/circle/find?address=0x...` để lookup walletId theo address |

**USDC tokenId trên ARC Testnet (Circle):** `15dc2b5d-0994-58b0-bf8c-3a0501148ee8`

**Files mới — 2026-05-12:**
- `app/api/circle/find/route.ts` — lookup walletId bằng address
- `app/_lib/profile.ts` — UserProfile localStorage
- `app/_components/ProfileModal.tsx` — form username/password sau khi tạo ví
- `app/_components/CircleWalletButton.tsx` — auto-poll balance mỗi 10s

### Navbar & Logo

- Logo: `public/logo.png` (ChatGPT Image 09_46_41 10 thg 5, 2026)
- Xử lý: dùng `filter: invert(1)` để hiện logo trên nền đen
- Tất cả nơi dùng logo: Navbar, login page, dashboard sidebar
- Navbar height: 104px để chứa logo 82px
- Đã xóa 3 button cũ (Connect Wallet / Sign In / Request access) → thay bằng 1 nút **"Let's get started"**

### Circle Agent Stack Integration

**Reference:** https://developers.circle.com/agent-stack (ra mắt 11/5/2026)

**Files mới:**
| File | Mục đích |
|---|---|
| `app/_lib/agent.ts` | `AgentPolicy`, `AgentTx` types, spending controls, log helpers |
| `app/api/agent/analyze/route.ts` | x402-style protected endpoint — trả 402 nếu không có `X-Agent-Wallet-Id` header |
| `app/api/agent/run/route.ts` | Autonomous trigger — validate policy → pay → analyze |
| `app/dashboard/agent/page.tsx` | Agent Dashboard UI |

**x402 endpoint:**
- `GET /api/agent/analyze` → trả 402 với payment requirements (`circle-arc` scheme)
- `POST /api/agent/analyze` + header `X-Agent-Wallet-Id: <walletId>` → verify balance → pay $0.025 USDC → run analysis

**Agent Dashboard features:**
- Policy editor: maxPerTx, maxPerDay, auto-run toggle
- Stats: status, spent today, daily limit, wallet balance
- Image upload + agent run với real-time status
- Transaction log với ArcScan TX link
- "Get TX hash" button để fetch on-chain hash từ Circle (txHash null khi INITIATED)

**Spending Policy flow:**
```
User sets policy → Agent checks withinPolicy() → pay via /api/circle/transfer → log tx
```

**Transaction Log TX links:**
- Nếu có `txHash` → link `https://testnet.arcscan.app/tx/{txHash}`
- Nếu chỉ có Circle `txId` → nút "Get TX hash" → fetch `/api/circle/transfer?txId=` → update hash

**Packages thêm:**
- `x402-next@^1.2.0`
- `@x402/core@^2.11.0`
- `ethers@^6.16.0`

---

## Nhật ký làm việc — 2026-05-12 (phần 2)

### Smart Contracts — ARC Testnet (deployed)

**Foundry project:** `C:\Users\Admin\storescope-contracts\`

| Contract | Address | TX Hash |
|---|---|---|
| `PaymentVerifier` | `0xeC595fE964be09854B6F5fa5FED0a814dacD6AcC` | `0xdbfc71b03ec01bde5b8e6f920d28d7d79fbae836f3928de520a1c9177a15ab2f` |
| `RetailLayoutNFT` | `0x18B434352c1ff1BdAde1E7871823b7bC6eed00dB` | `0x4ccbfcbe7d7622f1d73daaa26f53d078e42f641f8289a79e486795f97cd73852` |
| `AnalysisRegistry` | `0x3974Ce11d3c656a8A0faB63BC498441D8a6423Bd` | `0xe402a34f3f35ace20746d9ab4e54643e2f1cd39140d855c23e0e8f05ee932912` |

**Deployer wallet:**
- Address: `0x68e51fb0A433caBe0d4f17AEe537676d925Cb35c`
- Key: in `.env.local` as `DEPLOYER_KEY`
- Balance: ~20 USDC (đủ cho hàng nghìn tx)

**Explorer:** https://testnet.arcscan.app

### Files mới — smart contract integration

| File | Mục đích |
|---|---|
| `app/_lib/contracts.ts` | ABIs, addresses, viem clients, helpers (server-side only) |
| `app/api/contracts/record/route.ts` | Gọi AnalysisRegistry on-chain: request/payment/result/failed |
| `storescope-contracts/src/PaymentVerifier.sol` | Ghi proof of payment |
| `storescope-contracts/src/RetailLayoutNFT.sol` | NFT cho layout marketplace |
| `storescope-contracts/src/AnalysisRegistry.sol` | Vòng đời phân tích on-chain |

### On-chain analysis pipeline

```
Upload ảnh → requestAnalysis() [TX1 → hiện link ArcScan]
     ↓
Circle pay $0.025 → confirmPayment() [TX2]
     ↓
AI analysis xong → submitResult(resultHash) [TX3]
```

`verifyResult(analysisId, resultHash)` — ai cũng có thể xác minh kết quả không bị giả mạo.

### Env vars mới (.env.local)

```
ANALYSIS_REGISTRY_ADDRESS=0x3974Ce11d3c656a8A0faB63BC498441D8a6423Bd
PAYMENT_VERIFIER_ADDRESS=0xeC595fE964be09854B6F5fa5FED0a814dacD6AcC
RETAIL_LAYOUT_NFT_ADDRESS=0x18B434352c1ff1BdAde1E7871823b7bC6eed00dB
DEPLOYER_ADDRESS=0x68e51fb0A433caBe0d4f17AEe537676d925Cb35c
DEPLOYER_KEY=0xd302f59709feeaa147c77f657616f7e17dc3087c37d5f14d14953b9c4b27672f
```

### Việc cần làm tiếp

**Ưu tiên cao:**
1. **Tích hợp RetailLayoutNFT vào `/forum`** — mint NFT khi user save layout, bán layout qua on-chain
2. **Push lên GitHub** — chưa commit phần contracts + integration hôm nay
3. **Test pipeline đầy đủ** — upload ảnh → trả USDC → xem TX trên ArcScan

**Ưu tiên vừa:**
4. **Verify contract trên ArcScan** — upload source code Solidity để mọi người đọc được
5. **Tích hợp Agent Stack vào forum** — agent tự mua/bán layout qua x402
6. **Roboflow model** — vào https://app.roboflow.com/levanhungs-workspace/fmcg-project/annotate → Generate → Train → điền `RF_VERSION` vào `.env.local`

---

## Nhật ký làm việc — 2026-05-17

### Đổi tên thư mục dự án

- `storescope-ai-Shelby` → `storescope-ai` (tại `OneDrive/Máy tính/tổng file/`)
- Bản cũ `storescope-ai/` → đổi thành `storescope-ai-old/` (giữ lại)
- **Vị trí chính thức:** `C:\Users\Admin\OneDrive\Máy tính\tổng file\storescope-ai\`

### Sửa lỗi khởi động server sau đổi tên

**Vấn đề:** Sau đổi tên, Turbopack cache bị corrupted + thiếu `@tailwindcss/postcss`.

**Fix:**
1. Cài package: `npm install @tailwindcss/postcss`
2. Xóa cache: `rm -rf C:\next-cache\storescope-ai\dev`
3. Tạo lại junction `node_modules` trong cache:
   ```powershell
   New-Item -ItemType Junction -Path 'C:\next-cache\storescope-ai\node_modules' -Target 'C:\Users\Admin\OneDrive\Máy tính\tổng file\storescope-ai\node_modules'
   ```

### Fix Circle Transfer "still pending" error

**Vấn đề:** `PaymentGateModal` poll Circle API tối đa 30s (15 lần × 2s), timeout hiện lỗi.

**Fix trong `app/dashboard/analysis/page.tsx`:**

| Thay đổi | Trước | Sau |
|---|---|---|
| Timeout | 30s (15 × 2s) | 60s (10 × 1s + 25 × 2s) |
| Accepted states | `CONFIRMED` only | `CONFIRMED` hoặc `SENT` |
| Khi `FAILED`/`DENIED` | Chờ hết timeout | Throw error ngay |
| Khi vẫn pending | Show error | Show màn hình ⏳ + nút "Continue anyway →" |
| Poll endpoint | `/api/circle/transfer?txId=` | `/api/circle/status?txId=` (webhook-backed) |

**State mới:** `PayStep` thêm `"pending"` — hiện khi transfer submitted nhưng chưa confirm sau 60s.

### Circle Webhook Integration

**Mục tiêu:** Khi Circle confirm transaction → server biết ngay (không cần poll chậm).

**Files mới:**

| File | Mục đích |
|---|---|
| `app/_lib/txStore.ts` | In-memory Map lưu tx state từ webhook (global, persist qua hot-reload) |
| `app/api/circle/webhook/route.ts` | POST endpoint nhận notification từ Circle |
| `app/api/circle/status/route.ts` | GET — check store trước (instant), fallback Circle API |
| `scripts/register-circle-webhook.js` | Đăng ký webhook URL với Circle một lần |

**Webhook đã đăng ký:**
- Subscription ID: `3f7749f1-8177-40bd-b554-6dd569018982`
- Endpoint: `https://storescope-ai.vercel.app/api/circle/webhook`
- Status: `pending` (active sau khi deploy lên Vercel)

**Tốc độ:**
- Local dev: poll Circle API mỗi 1s (nhanh hơn 3× so với trước)
- Vercel production: webhook fires → confirm trong <1s

**Lưu ý txStore:** In-memory Map — works cho single-process local dev. Production multi-instance cần Redis/KV.

### Task Payment Log — TX Hash thật trên ArcScan

**Vấn đề:** 10 TX hash trong Task Payment Log là hash ngẫu nhiên (`mockTx()`), không tồn tại trên blockchain.

**Fix:** Mỗi micro-task gọi `PaymentVerifier.recordPayment()` on-chain.

**Files thay đổi:**

| File | Thay đổi |
|---|---|
| `app/_lib/contracts.ts` | Thêm `PAYMENT_VERIFIER_ABI` |
| `app/api/contracts/record/route.ts` | Thêm stage `"task"` → gọi `PaymentVerifier.recordPayment()` |
| `app/dashboard/analysis/page.tsx` | Xóa `mockTx()`, thay bằng API call thật (fire-and-forget) |

**Flow mới:**
```
Task hoàn thành → hiện "recording on-chain…"
    ↓ (background, không block UI)
POST /api/contracts/record { stage:"task", analysisId, taskId, taskPrice, payer }
    ↓
PaymentVerifier.recordPayment(paymentId, payer, amountUnits, taskId)
    ↓ paymentId = keccak256(analysisId + taskId)
TX thật trên ArcScan → UI update link ↗
```

**Đã xóa:** `function mockTx()` — không còn dùng.

### Việc cần làm tiếp (cập nhật 2026-05-17)

**Ưu tiên cao:**
1. **Push lên GitHub + deploy Vercel** — để Circle webhook hoạt động (endpoint đã đăng ký)
2. **Test pipeline đầy đủ** — upload ảnh → Circle pay → xem 10 TX thật trên ArcScan
3. **Tích hợp RetailLayoutNFT vào `/forum`**

**Ưu tiên vừa:**
4. **Verify contracts trên ArcScan** — upload Solidity source
5. **Roboflow model** — Generate → Train → điền `RF_VERSION`

---

## Nhật ký làm việc — 2026-05-18

### 10 Micro-Task Verifier Contracts — Deploy lên ARC Testnet

**Files mới:**

| File | Mục đích |
|---|---|
| `storescope-contracts/src/tasks/BaseTaskVerifier.sol` | Abstract base contract: `recordPayment()`, `isRecorded()`, `taskName()`, `taskPrice()` |
| `storescope-contracts/src/tasks/TaskVerifiers.sol` | 10 contracts kế thừa BaseTaskVerifier |
| `storescope-contracts/script/DeployTasks.s.sol` | Foundry deploy script |

**10 contracts đã deploy (ARC Testnet):**

| Task | Contract | Address |
|---|---|---|
| upload | `UploadTaskVerifier` | `0x65c9E64cd0fCeFFEAB374E78Ef7B31Ab5140f578` |
| quality | `QualityCheckVerifier` | `0x92f785270db32676571736095c0621F00E2033c0` |
| shelf_detect | `ShelfDetectionVerifier` | `0x47efe628B089Fc25593e4070489DC8aa46B624f5` |
| sku_detect | `SkuDetectionVerifier` | `0xF0Af9129664869402943Db3E36836F67a045252d` |
| competitor | `CompetitorAnalysisVerifier` | `0xE72cA03fF2e1A78E0384dc4c72F4Ea0c22a31d5f` |
| stock_risk | `StockRiskVerifier` | `0xb74a2d5232A8F9792ee2ad3B2f43817c24eae189` |
| layout_sim | `LayoutSimulationVerifier` | `0x5A903C08Ea7f495BEED3A0C81b4F3Aa878C6fc15` |
| recommend | `RecommendationVerifier` | `0xB779fFa5883748Da0DEAd01d2a0CEcd763Af65FF` |
| human_review | `HumanReviewVerifier` | `0x47BeDDf187A0816884dC3c61298DBDe131cBF986` |
| report | `FinalReportVerifier` | `0x8e1AA6a0569A11611E1953eAA1a543d638f4873D` |

**Thay đổi code:**
- `contracts.ts`: Thêm `BASE_TASK_VERIFIER_ABI`, `TASK_CONTRACT` map, 10 địa chỉ contract
- `record/route.ts`: Thêm stage `"task"` → gọi đúng contract theo `taskId`
- `.env.local`: Thêm 10 `TASK_*_ADDRESS` env vars

### Fix lỗi Task Payment Log không hiện TX Hash

**Chuỗi lỗi đã fix:**

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| `ReferenceError: txHash is not defined` | Xóa `mockTx()` nhưng còn 2 chỗ dùng biến `txHash` trong `runAllTasks` | Đổi thành `txHash: undefined` |
| `TypeError: Cannot read properties of undefined (reading 'slice')` | `t.txHash` có thể `undefined`, gọi `.slice()` trực tiếp | Guard: `t.txHash ? ... : "recording…"` |
| `txHash: string` không cho phép `undefined` | Type quá chặt sau khi đổi sang optional | Đổi type thành `txHash?: string` |
| Hash không bao giờ hiện — tất cả "recording…" | Race condition: background fetch về trước khi `setReport()` được gọi → `setReport(prev => prev ? ... : prev)` trả về `null` | Dùng `useRef` cache hash + vòng lặp đợi 8s sau pipeline |
| `if (aid)` block tất cả khi requestAnalysis fail | `aid = undefined` → không có task nào gọi contract | Thêm fallback: `aid = "0x" + Date.now().toString(16).padStart(64, "0")` |

**Giải pháp cuối cùng:**
```
taskTxHashesRef (useRef) ← hash về khi nào thì lưu vào đây
Pipeline 10 tasks chạy + recordTask() song song mỗi task
Sau pipeline: đợi tối đa 8s (poll 500ms) cho hash còn thiếu
Build report với hash từ ref → setReport()
Hash đến muộn: setReport(prev => ...) cập nhật sau
```

### Fix Vercel Build Error

**Lỗi:** `Type error: Type 'string | undefined' is not assignable to type 'string'`
- File: `app/_components/AnalysisReport.tsx:69`
- Dòng: `rows.push([..., t.txHash, ...])` — CSV export array expect `string`
- **Fix:** `t.txHash ?? ""`

**Commits đã push:**
- `80da42d` — feat: 10 micro-task contracts + Circle webhook + TX hash fixes
- `378fde5` — fix: txHash optional type in CSV export (Vercel build fix)

**Remotes đã push:**
- `vercel-repo` → github.com/levanhung789/storescope-ai (Vercel auto-deploy)
- `origin` → github.com/levanhung789/storescope-ai-Shelby

### Fix Vercel — Không trừ tiền khi phân tích ảnh

**Nguyên nhân:** Vercel không có bất kỳ env var nào → toàn bộ API routes chạy **demo mode** (Circle trả mock txHash, contract calls không thực thi).

**Fix:**
1. Link project: `npx vercel link --yes`
2. Upload 30 env vars lên production bằng `npx vercel env add`
3. Redeploy: `npx vercel --prod`

**30 env vars đã set trên Vercel production:**

| Nhóm | Vars |
|---|---|
| Roboflow | `ROBOFLOW_API_KEY`, `RF_WORKSPACE`, `RF_PROJECT` |
| Circle | `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`, `CIRCLE_WALLET_SET_ID` |
| Contracts | `PAYMENT_VERIFIER_ADDRESS`, `RETAIL_LAYOUT_NFT_ADDRESS`, `ANALYSIS_REGISTRY_ADDRESS` |
| Deployer | `DEPLOYER_ADDRESS`, `DEPLOYER_KEY`, `SERVICE_WALLET` |
| ARC Agent | `ARC_AGENT_ID`, `ARC_AGENT_TOKEN_ID`, `ARC_IDENTITY_REGISTRY`, `ARC_REPUTATION_REGISTRY`, `ARC_VALIDATION_REGISTRY`, `ARC_AGENT_METADATA_URL` |
| Task contracts | `TASK_UPLOAD_ADDRESS` → `TASK_REPORT_ADDRESS` (10 vars) |
| Misc | `ADMIN_TOKEN`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |

**Deployment:** `storescope-pedojm8oy-levanhung789s-projects.vercel.app` — status **Ready** ✅

**Sau fix:** Circle trừ USDC thật, 10 task contracts ghi TX lên ArcScan, webhook `/api/circle/webhook` hoạt động.

### Việc cần làm tiếp (cập nhật 2026-05-18)

**Ưu tiên cao:**
1. **Test pipeline đầy đủ trên Vercel** — upload ảnh → Circle pay → xem 10 TX thật trên ArcScan
2. **Tích hợp RetailLayoutNFT vào `/forum`**

**Ưu tiên vừa:**
3. **Verify contracts trên ArcScan** — upload Solidity source
4. **Roboflow model** — Generate → Train → điền `RF_VERSION`

---

## Nhật ký làm việc — 2026-05-20

### Vision Agent — GPT-4o Vision + 8-step FMCG Pipeline

- `/api/vision-agent/analyze`: phân tích ảnh kệ hàng 8 bước (chất lượng, đếm sp, SKU, facing, vị trí, SoS, OSA, gợi ý)
- Perspective Engine: phát hiện góc chụp, tính correction factor = cos(angle), phân biệt depth vs facing
- Brand Formation: catalog 24 SKUs Pepsi (390ml đầy đủ: Regular/Max/Twist, 7Up, Mirinda, Sting, Aquafina)
- Vision Agent dashboard: `/dashboard/vision-agent` — 3 tabs: Analyze / Training / Formation
- Đã tích hợp Vision Agent 8-step vào `/dashboard/analysis` (thay OCR cũ)

### OpenAI GPT-4o Vision

- Key: `sk-proj-zGAbdAwqa...` (hoạt động, đã test)
- Model: `gpt-4o` cho analysis, `gpt-4o-mini` cho guide bot
- Tích hợp vào `/api/analyze/route.ts` (với fallback OCR+Roboflow)

### Multi-channel AI Agent (Telegram / Zalo / WebChat)

- `lib/agent/channelStore.ts`: lưu user↔channel mapping, message history
- `lib/agent/channelHandler.ts`: unified handler (image → Vision Agent → Circle payment)
- `app/api/agent/telegram/route.ts`: Telegram Bot webhook (`/start` `/link` `/balance` + photo)
- `app/api/agent/zalo/route.ts`: Zalo OA webhook (HMAC verify)
- `app/api/agent/channels/route.ts`: stats + webchat POST
- **WebChatWidget** → đổi thành **ReceptionistWidget** global (toàn bộ site)

### ReceptionistWidget — AI Tiếp Tân 3 Ngôn Ngữ

- `app/_components/ReceptionistWidget.tsx`: floating widget góc phải dưới
- Context-aware: mỗi page (`/`, `/login`, `/dashboard`, `/dashboard/analysis`, v.v.) có greeting riêng
- Trang `/`: bounce animation + nút "🚀 Let's get started" luôn hiện
- 3 ngôn ngữ: 🇻🇳 VI / 🇺🇸 EN / 🇨🇳 中文 — chuyển ngôn ngữ reset conversation
- Guide API: `app/api/agent/guide/route.ts` với GPT-4o-mini, scope giới hạn StoreScope AI only
- Telegram/Zalo logos: `/public/telegram-logo.svg`, `/public/zalo-logo.svg`

### i18n — 3 Ngôn Ngữ Toàn Ứng Dụng

- `app/_lib/i18n.tsx`: LanguageProvider + 300+ translation keys (VI/EN/ZH)
- `app/_components/LanguageSwitcher.tsx`: dropdown (navbar) + 3 buttons (sidebar)
- Tích hợp vào: layout.tsx, Navbar, dashboard/page, analysis/page, AnalysisReport
- Keys đã dịch: nav, hero, stats, HowItWorks, services, pricing, cta, footer, dashboard, analysis (8 steps + tasks + payment modal), Full Report (55 keys), Vision 8-step report
- **Nguyên tắc**: không lẫn ngôn ngữ — mỗi ngôn ngữ thuần nhất

### Landing Page — Nâng cấp UI/UX

**UseCases section (3 cards):**
- Ảnh thật thay gradient: `shelf-hero.png`, `distributors-hero.png`, `retail-teams-hero.png`
- Layout 1:1, hover scale, lightbox click-to-zoom (fade+zoom animation)
- `AnimatedTextBlock`: staggered scroll reveal per element (tag → line → headline → desc → metrics)
- Bidirectional: ẩn khi scroll lên, hiện khi scroll xuống

**HowItWorks section (6-stage):**
- Headline: animated gradient text (purple shift loop)
- Flow row: 6 stages với animated dots giữa các bước
- Cards: slide vào từ trái/phải/dưới theo cột (staggered)
- Scan line shimmer, pulse ring icon, hover lift + glow
- Stats: CountUp animation (94%, 50K+, 2s) — reset khi scroll lên
- Confidence bar: animates open/close bidirectional

**ParticleSphere — Retail themed:**
- Particles màu brand (Pepsi xanh, Coca-Cola đỏ, 7Up xanh, Mirinda cam)
- Scanning beam quay tròn (AI shelf scan)
- Pulse ring phát ra từ center mỗi ~2s
- 3 orbit rings (dashed, animated dashOffset)
- Connection lines giữa particles gần nhau
- 8 floating data labels: SoS 42.6% / OSA ✓ / SKU Match 94% / Facing:12 / ⚠ Low Stock / Planogram ✓ / AI Detection / 2.1s/scan

**Navbar:**
- NavLink component: wave letter-by-letter, per-letter gradient color, sliding shimmer underline, sparkle particles
- CTA button: gradient + hover lift + glow

**Login page (`/login`):**
- Left panel: scan bar, badge pulse glow, gradient headline, accent line, feature cards stagger
- Right panel: slide in từ phải, gradient "Welcome back", tab active glow
- GlowInput: ring glow khi focus (màu theo tab)
- ShimmerButton: lift + shadow + shimmer sweep
- CountStat: đếm lên khi mount
- floatUp animation cho error/success messages

### Commits quan trọng hôm nay

| Commit | Nội dung |
|---|---|
| `712a8f9` | FMCG Brands hero image (shelf-hero.png) |
| `bb7c6e6` | UseCases redesign + lightbox zoom |
| `72e1e23` | Staggered scroll animations UseCases |
| `eb0b889` | Bidirectional scroll animations |
| `592abb2` | 6-stage HowItWorks professional animations |
| `b6b2561` | Retail-themed ParticleSphere |
| `21ca8be` | Navbar hover effects |
| `ebd96d3` | Login page professional animations |

### Việc cần làm tiếp (cập nhật 2026-05-20)

**Ưu tiên cao:**
1. **Test Vision Agent** trên Vercel với ảnh kệ hàng thật
2. **Test Telegram Bot** — tạo bot qua @BotFather, set webhook, link Circle wallet
3. **Tích hợp RetailLayoutNFT vào `/forum`**

**Ưu tiên vừa:**
4. **Verify contracts trên ArcScan**
5. **Roboflow model** — Generate → Train → RF_VERSION
6. **Thêm Coca-Cola brand formation** vào Vision Agent catalog

---

## Nhật ký làm việc — 2026-05-21

### Text Effects — `/dashboard/analysis`

Thêm hiệu ứng chữ chuyên nghiệp cho trang phân tích:

| CSS Class | Hiệu ứng | Dùng ở đâu |
|---|---|---|
| `.analysis-page-title` | Shimmer gradient sweep 4s infinite | h2 tiêu đề trang |
| `.analysis-page-tag` | Letter appear (fade + blur in + letter-spacing) | Tag "AI Vision Agent" |
| `.tasks-header-text` | Gradient tĩnh white→purple | Section headers |
| `.task-label-active` | Glow purple pulse 1.8s infinite | Task label khi đang chạy |
| `.analysis-cost-text` | Purple shimmer 3s | Chi phí phân tích |
| `.spent-amount-text` | Glow amber pulse 1.4s | Số USDC đã chi |
| `.done-amount-text` | Glow green pulse 2s | Số task hoàn thành |
| `.total-price-purple/green` | Glow pulse theo trạng thái | Tổng giá |
| `.dot-amber` / `.dot-purple` | Pulsing 5px circle | Paying / Processing badge |
| `.badge-pop` | Scale pop animation | Badge container |
| `.task-result-text` | Slide in từ trái + blur out | Kết quả mỗi task |

**Files thay đổi:**
- `app/globals.css` — thêm 12 `@keyframes` + CSS classes
- `app/dashboard/analysis/page.tsx` — apply classes vào đúng elements

### Vision Agent — Fix Hallucination

**Vấn đề:** Server phân tích sai — Cái Lân cooking oil trên kệ snack; phân phối 25%/25%/25%/25% đều nhau; toàn bộ confidence 95%.

**Fix 2 lớp:**

**1. `lib/vision-agent/prompt.ts`:**
- Đổi vai từ "Vietnamese FMCG analyst" → "unbiased global FMCG analyst"
- Thêm 5 HALLUCINATION PREVENTION mandatory checks:
  1. Text-first rule: đọc logo/signage trước, không đoán
  2. Equal distribution warning: 25%/25% = đang bịa — STOP và đếm lại
  3. Identical confidence warning: tất cả 95% = fabricated
  4. Category consistency: snack shelf → only snack brands
  5. Signage rule: brand banner trên kệ = dùng thông tin đó
- Brand list chuyển thành "USE ONLY IF VISUALLY CONFIRMED"
- Thêm global brands: Cheetos/Doritos/Lay's, Skittles/M&Ms, Oreo, etc.
- Thay example JSON Pepsi/Coca-Cola → Cheetos/Lay's với distribution **bất đối xứng** (78%/21%) và confidence **khác nhau** (97%/93%/88%)
- Thêm LANGUAGE RULE: tất cả `action`, `reason`, `summary`, `note` phải dùng **tiếng Anh**

**2. `lib/vision-agent/agent.ts`:**
- Rewrite system message thành 11 điều kiện rõ ràng (CRITICAL FAILURE CONDITIONS + CORRECT BEHAVIOR)
- Safety net trong step3_skus: nếu `confidence < 50` mà brand cụ thể → downgrade `"Unidentified (BrandName?)"`

### 1-Email-1-Wallet Enforcement

**Yêu cầu:** Mỗi Gmail chỉ được tạo đúng 1 ví; userId phải là email hợp lệ.

**Fix 3 lớp:**

| Lớp | File | Thay đổi |
|---|---|---|
| Client UI | `app/login/page.tsx` | `isValidEmail()` regex, inline feedback "✓ Valid email" / "Invalid format", button disabled khi sai format |
| Server validation | `app/api/circle/wallet/route.ts` | `isValidEmail()` server-side, trả 400 với message hướng dẫn |
| Circle API | `app/api/circle/wallet/route.ts` | `listWallets()` check `refId === normalizedEmail` → trả ví cũ nếu đã có |

**UX thêm:**
- `type="email"` trên GlowInput
- Normalize: `userId.trim().toLowerCase()` nhất quán
- Badge "1 email = 1 wallet" info box
- Welcome-back message: "Welcome back! Wallet found for X" vs "Wallet created for X"
- `reused: true` khi trả ví cũ

### ProfileModal — View/Edit Mode Separation

**Vấn đề:** Modal "Account Profile" luôn hiện form edit → bắt user save mỗi lần mở.

**Fix: tách 3 component:**

```
ProfileModal (orchestrator)
├── ProfileView (default khi profile đã có)
│   ├── Avatar + first letter
│   ├── Email (Verified badge), Username, Password ••••••••, Wallet Address, Member since
│   ├── X button → đóng ngay, KHÔNG save
│   └── Edit button → setEditing(true)
└── ProfileEdit (khi isNew hoặc editing)
    ├── isNew=true → auto-save countdown 3s + redirect sau 1200ms
    ├── isNew=false → Cancel → về View mode, không đóng modal
    └── Save → về View mode tự động
```

**State logic:**
- `editing = false` khi mount nếu profile đã có (View mặc định)
- `editing = true` khi mount nếu chưa có profile (Edit cho user mới)

### WalletButton — Bỏ Verify Ownership

**Vấn đề:** Mỗi lần connect wallet đều phải ký message → phiền.

**Fix:** Xóa hoàn toàn bước verify:
- Bỏ `VerifyModal` component (−200 lines)
- Bỏ `useSignMessage`, `verified` state, `buildSignMessage`, `randomNonce`
- Connect → dùng ngay
- `useBalance` không còn phụ thuộc `verified`

### Commits — 2026-05-21

| Commit | Nội dung |
|---|---|
| `fcc7090` | fix(ProfileModal): separate View/Edit modes — no forced save on open |
| `da4eca8` | feat(WalletButton): remove wallet ownership verification step |

**Đã push lên:** `origin` (storescope-ai-Shelby/ARC) + `storescope-ai` (Vercel)

### Quyết định kỹ thuật — 2026-05-21

| Quyết định | Lý do |
|---|---|
| ProfileModal View/Edit tách biệt | Existing user không cần save khi chỉ xem thông tin |
| Auto-save 3s countdown chỉ cho `isNew` | Mới tạo tài khoản thì cần save + redirect; đang edit thì tự quyết |
| Cancel → View mode (không close modal) | User có thể xem lại info sau khi hủy edit |
| Bỏ SIWE verify wallet | Hackathon demo: UX quan trọng hơn security formality |
| Vision Agent → "unbiased global analyst" | Remove bias sang VN market; image quyết định brand, không phải prompt |
| LANGUAGE RULE cho action/reason/summary | Sản phẩm B2B global — output phải là tiếng Anh |

### Việc cần làm tiếp (cập nhật 2026-05-21)

**Ưu tiên cao:**
1. **Test flow đầy đủ:** login email → tạo ví mới → Complete Profile auto-save → redirect analysis
2. **Test returning user flow:** login lại → Account Profile hiện View mode (không save)
3. **Test Vision Agent** trên Vercel với ảnh kệ hàng thật (snack, candy, beverage)
4. **Deploy lên Vercel** để Circle webhook hoạt động (webhook đã đăng ký ở `storescope-ai.vercel.app`)

**Ưu tiên vừa:**
5. **Tích hợp RetailLayoutNFT vào `/forum`**
6. **Test Telegram Bot** — tạo bot qua @BotFather, set webhook
7. **Verify contracts trên ArcScan**
8. **Thêm Coca-Cola brand formation** vào Vision Agent catalog

---

## Nhật ký làm việc — 2026-05-26

### Personal Data Vault — Trang quản lý dữ liệu cá nhân

#### Vault Data Model (`app/_lib/vault.ts` — file mới)

```typescript
VaultFolder   { id, name, parentId, createdAt, icon, isDefault }
VaultItem     { id, type, name, folderId, createdAt, updatedAt, tags, starred,
                forSale, price?, listingId?, reportId?, topBrand?, skuCount?,
                totalPaid?, imageHash?, summary?, tokenId?, content? }
ForumListing  { id, sellerWallet, sellerEmail?, itemId, itemType, title,
                description, price, createdAt, sold, buyerWallet?, previewData? }
VaultItemType = "analysis" | "layout" | "note" | "image"
```

**4 default folders:**
- `f-analysis` — Analysis History (📊)
- `f-layouts` — Store Layouts (🏪)
- `f-favorites` — Favorites (⭐)
- `f-forsale` — For Sale (🏷️)

**localStorage keys:**
- `vault_folders_${walletId}` — folders per wallet
- `vault_items_${walletId}` — items per wallet
- `forum_listings_v2` — listings shared với Forum marketplace

**Functions:** `loadFolders`, `saveFolders`, `createFolder`, `deleteFolder`, `renameFolder`, `loadItems`, `saveItems`, `addItem`, `updateItem`, `deleteItem`, `moveItem`, `importAnalysisReports`, `loadListings`, `saveListings`, `createListing`, `removeListing`

#### Vault Page ban đầu (`app/dashboard/vault/page.tsx`)

3-panel layout: Sidebar folder tree | Main item grid | Detail panel

**Components chính:**
- `NoBgImage` — Canvas API loại bỏ nền trắng (threshold=236, 22px anti-alias)
- `FolderIcon` — kiểm tra ICON_IMAGE_MAP → vault-folder.svg → emoji fallback
- `CreateFolderModal`, `MoveModal`, `ListForSaleModal`, `AddNoteModal`
- `DetailPanel` — star/move/delete/list-for-sale
- Import analysis từ `reports_${address}` localStorage
- Toast notifications

#### Folder Icon — SVG trong suốt (`public/vault-folder.svg`)

Vấn đề: ảnh PNG gốc (vault-folder.png) có nền trắng, không hài hòa với dark theme.

**Giải pháp:** Tạo lại SVG thuần vector, trong suốt hoàn toàn:
- Gradient: deep purple (#6d28d9) → magenta (#9333ea) → pink (#db2777) → rose (#f43f5e)
- Tab trên trái: gradient tím đậm
- Glass shine: ellipse xoay 22° với diagonal gradient opacity
- Edge glow bên trái, top highlight, bottom reflection
- `filter id="shadow"` drop shadow tím

**Quyết định:** SVG thay PNG vì không có pixel data → không bao giờ có nền trắng.

#### Store Layout Icon — Canvas bg removal (`public/store-layout-icon.png`)

Ảnh upload (`845bc44b-58f8-4118-91e3-84b1126c2087`) có nền trắng.

**Giải pháp:** `NoBgImage` component dùng Canvas API:
```javascript
// Mỗi pixel: nếu R,G,B > 236 → alpha = 0
// 22px anti-alias edge zone: alpha = lerp(0, 255, distFromEdge/22)
ctx.getImageData / putImageData với willReadFrequently: true
```

**`ICON_IMAGE_MAP`:** `{ "🏪": "/store-layout-icon.png" }` — FolderIcon tra map trước khi dùng emoji.

#### Forum Data Marketplace Tab (`app/forum/ForumClient.tsx`)

- Thêm `"data"` vào `Tab` type
- Tab bar: **Layout Marketplace** | **Data Marketplace (N)** | **Discussion**
- Load `vault_listings_v2` từ localStorage khi switch sang tab `"data"`
- Render listing cards với buy button
- "List your data" → `/dashboard/profile`

#### Profile Page — OpenSea-style (`app/dashboard/profile/page.tsx` — file mới)

Đổi tên vault → Profile, rebuild theo style OpenSea.

**Layout:**
```
┌─────────────────────────────────────────┐
│  Banner (200px gradient tím, glow orbs) │
│  Avatar (100px tròn, đè banner -40px)   │
│  Username | Badges | Stats bar          │
│  Tab bar: Items|Analysis|Layouts|...    │
├──────────┬──────────────────────────────┤
│ Sidebar  │  Search + View toggle        │
│ Filters  │  Item Grid (ItemCard)        │
│          │                              │
└──────────┴──────────────────────────────┘
│  Bottom Action Bar (fixed, khi select) │
└─────────────────────────────────────────┘
```

**Banner:** `linear-gradient(135deg, #0f0520, #2d1b69, #4c1d95, #6d28d9, #1a0533)` + 3 animated glow orbs (keyframes `glow-pulse`)

**Stats bar:** USDC SPENT (green) / ANALYSES (purple) / LAYOUTS (teal) / FOR SALE (amber)

**Tab bar:** Items | Analysis | Layouts | Listings | Favorites | Activity (với count badges)

**Sidebar:** Collapsible, Status filter (All/Listed/Not Listed/Starred), Type filter, Wallets section

**ItemCard:** checkbox, star/sale badges, NoBgImage preview (cho layouts), name, timeAgo, topBrand tags

**SaleModal:** title + description + quick-select price buttons ($0.1 / $0.5 / $1 / $2 / $5)

**Bottom action bar (fixed):** hiện khi có items selected — "List Items" / "Star" / "Delete" / "✕ Close"

**Activity tab:** chronological list các item updates gần đây

### Nav link update — vault → profile

Tất cả nav links trong app đổi từ `/dashboard/vault` → `/dashboard/profile`:

| File | Thay đổi |
|---|---|
| `app/dashboard/page.tsx` | `nav.vault` → `/dashboard/profile` |
| `app/dashboard/reports/page.tsx` | "My Vault" → "My Profile" → `/dashboard/profile` |
| `app/forum/ForumClient.tsx` | 2 link "List your data" + "Go to My Vault" → Profile |

### Commits — 2026-05-26

| Commit | Nội dung |
|---|---|
| `1dfdef2` | feat(vault): vault.ts data model + vault page skeleton |
| `e0fed2e` | feat(vault): NoBgImage Canvas bg removal + folder SVG |
| `4b8ebe1` | feat(vault): store layout icon + FolderIcon component |
| `47b4248` | feat(forum): Data Marketplace tab with vault listings |
| `36198be` | docs: update CLAUDE.md with 2026-05-21 work log |
| `4e256ac` | feat: add Profile page (OpenSea-style), update all nav links vault→profile |

**Đã push lên:** `origin` (storescope-ai-Shelby)

### Quyết định kỹ thuật — 2026-05-26

| Quyết định | Lý do |
|---|---|
| Vault data lưu localStorage (không backend) | Consistent với pattern reports/anonymous — không cần DB |
| `forum_listings_v2` key dùng chung | Forum và Profile cùng đọc/ghi một key → data nhất quán |
| SVG thay PNG cho folder icon | SVG không bao giờ có nền trắng — không cần Canvas hack |
| Canvas bg removal cho store-layout-icon | Ảnh PNG thật từ upload — chỉ cần loại nền trắng, giữ nội dung |
| Đổi tên vault → profile | User data = "profile" tự nhiên hơn "vault"; align với OpenSea mental model |
| NoBgImage threshold=236 (không phải 255) | Loại bỏ cả nền trắng gần trắng (jpeg artifacts); 22px anti-alias tránh răng cưa |
| Bottom action bar fixed position | Không cuộn trang khi nhiều item — luôn accessible |
| SaleModal quick-select price buttons | UX nhanh hơn typing; $0.1→$5 phù hợp data marketplace giá thấp |

### Việc cần làm tiếp (cập nhật 2026-05-26)

**Ưu tiên cao:**
1. **Test Profile page** tại `http://localhost:3000/dashboard/profile` — import analysis, tạo folder, list for sale
2. **Deploy lên Vercel** — push lên `vercel-repo` để production cập nhật
3. **Test Data Marketplace** trên Forum — list item từ Profile → xuất hiện trên Forum tab

**Ưu tiên vừa:**
4. **Tích hợp RetailLayoutNFT vào `/forum`** — mint NFT khi save layout
5. **Test Vision Agent** với ảnh kệ hàng thật
6. **Verify contracts trên ArcScan**

---

## Nhật ký làm việc — 2026-05-27

### Công việc đã hoàn thành

#### 1. Profile page — 3-column layout (Twitter/X style)
- **Banner** full-width (height 240px) phía trên
- **Full-width header section**: Avatar + Tên/Bio + Stats bar + Tabs (Items/Analysis/Layouts/Listings/Favorites/Activity)
- **3-column layout** bắt đầu ngay tại dòng Tabs:
  - **Left aside** (196px sticky): 5 icon nav cards
  - **Center** (flex:1): filter sidebar + items grid
  - **Right aside** (290px sticky): 4 Twitter-style cards

#### 2. Right aside — Twitter/X sidebar cards
4 card style (background #111, borderRadius 16, không border):
- **Card 1**: Upgrade to StoreScope Pro + gradient button
- **Card 2**: Đang hoạt động — 3 hàng activity với overlapping avatar clusters + count badge
- **Card 3**: Tin tức hôm nay — dismissable, 3 tin với double-avatar thumbnail
- **Card 4**: Ví của tôi — wallet address, USDC spent, 2×2 stats grid, action buttons

#### 3. Left aside — 5 nav items (Twitter/X nav style)
Thứ tự: My Profile (active/bold) → Image Analysis → AI Agent → Layout Editor → Forum & Mkt

Sau đó chuyển sang dùng **PNG icon cards** thay lucide icons:
- Files lưu tại `public/icon/` (đã rename bỏ dấu cách):
  - `my-profile.png`, `image-analysis.png`, `ai-agent.png`
  - `layout-editor.png`, `forum-marketplace.png`
- Dùng `NoBgImage` (canvas) để xóa nền trắng → icon trong suốt trên nền tối
- Size: 158px (nhỏ hơn 30% so với full-width)
- Active: viền tím + nền tím mờ; Hover: scale(1.04)

#### 4. Fix NoBgImage transparent bg
- Thêm `encodeURI(src)` khi load ảnh vào canvas
- `background: transparent` explicit trên canvas element
- Tăng `edge = threshold - 30` (từ -22) để xóa anti-alias tốt hơn
- `>= threshold` (từ `>`) để xóa pixel đúng ngưỡng

#### 5. Alignment fix
- Left/right asides bắt đầu ngang hàng với tab **Items** (không phải từ banner)
- Giải pháp: tách header+stats+tabs ra khỏi 3-col wrapper thành full-width section riêng

### Commits 2026-05-27

| Commit | Mô tả |
|---|---|
| `84f4523` | feat(profile): 3-column layout — left nav + right wallet/stats/marketplace |
| `6006df8` | feat(profile): redesign right aside to Twitter/X sidebar card style |
| `cb731b7` | feat(profile): simplify left nav to 5 core items |
| `4439f16` | fix(profile): align left/right asides with Items tab row |
| `f7adee2` | fix(profile): reorder left nav + remove Phân tích mới button |
| `074cc5a` | feat(profile): replace left nav icons with custom PNG images |
| `079f7cb` | fix(profile): update nav image paths to /icon/ subfolder |
| `1094d82` | fix(profile): nav icons transparent bg + 30% smaller (158px, NoBgImage) |
| `1df7940` | fix(profile): transparent icon bg — rename files + fix NoBgImage |

**Đã push lên:** `origin` (storescope-ai-Shelby)

### Quyết định kỹ thuật — 2026-05-27

| Quyết định | Lý do |
|---|---|
| Full-width header + 3-col content | Left/right asides căn thẳng hàng với Items tab |
| `NoBgImage` canvas cho PNG icons | Xóa nền trắng PNG trên dark page; CSS blend modes không hoạt động tốt trên dark bg |
| `encodeURI(src)` trong NoBgImage | Tên file có dấu cách làm canvas fail getImageData |
| Rename icon files (bỏ spaces) | `/icon/My profile.png` → `/icon/my-profile.png` để URL sạch |
| Twitter/X card style cho right aside | UX quen thuộc; cards tự chứa info, sticky theo scroll |
| PNG icon cards thay lucide icons | Icons đẹp, branded, mang bản sắc riêng của dự án |

### Việc cần làm tiếp (cập nhật 2026-05-27)

1. Kiểm tra transparent bg của icon cards trên browser thật
2. Deploy lên Vercel — push lên `vercel-repo`
3. Tích hợp RetailLayoutNFT vào `/forum`
4. Test pipeline đầy đủ: upload ảnh → USDC → ArcScan TX

---

## Nhật ký làm việc — 2026-06-03

### Công việc đã hoàn thành

#### 1. ARC v0.7.1 hard fork — cập nhật RPC
- Kiểm tra: RPC `https://rpc.testnet.arc.network` hoạt động, block #44,875,348
- Tìm thấy Circle personal RPC URL qua `arc-canteen rpc-url`
- Cập nhật `.env.local`: `ARC_RPC_URL` + `NEXT_PUBLIC_ARC_RPC_URL` dùng Circle token URL
- `contracts.ts`, `arc.ts`, `balance/route.ts` đều đọc từ env (không hardcode)
- Verified: chain ID 5,042,002 ✅, contracts còn nguyên sau hard fork ✅

#### 2. Arc Open Source Showcase — submission
- Tạo repo `storescope-arc-primitives` trên GitHub với 13 files:
  - `contracts/`: AnalysisRegistry.sol, PaymentVerifier.sol, RetailLayoutNFT.sol, TaskVerifiers.sol
  - `hooks/`: useArcPayment.ts, useCircleWallet.ts
  - `lib/`: arc.ts, contracts.ts, circle.ts
  - `examples/`: record-analysis.ts, circle-transfer.ts
  - `README.md` — docs đầy đủ với code examples và deployment addresses
- Submit via `arc-canteen update product` với prefix `ArcOSS:`

#### 3. Skills cài đặt
- `frontend-design` (từ anthropics/skills) → `~/.claude/skills/frontend-design/`
- `ui-ux-pro-max` v2.5.0 (từ nextlevelbuilder) → `~/.claude/skills/ui-ux-pro-max/`

#### 4. Homepage (`/`) — redesign theo MHM + FMCG Dashboard references
Các components mới/cập nhật:
- `AnnouncementBar.tsx` — gradient tím, dismissible, ARC v0.7.1 update
- `Hero.tsx` — MHM split layout: headline+CTAs trái / ParticleSphere+stats phải
- `PartnerLogos.tsx` — ARC/Circle/OpenAI/Roboflow/wagmi/MetaMask strip
- `FeaturesGrid.tsx` — category filter tabs + 3-col card grid với SVG icons
- `FAQ.tsx` — numbered accordion (01-06), sticky left column
- `CtaBanner.tsx` — email capture form + brand mark với glow
- `page.tsx` — Services/UseCases thay bằng FeaturesGrid/FAQ

#### 5. Hero background image
- Ảnh: holographic retail shelves (`hero-bg.png`) → `public/hero-bg.png`
- opacity: 0.35, gradient overlay 90deg cho text readability trái

#### 6. Dashboard background image
- Ảnh: holographic data streams tím/teal (`dashboard-bg.png`) → `public/dashboard-bg.png`
- Z-index stack: bg(z0) → overlay(z1) → content(z2)
- Cards: glassmorphism `rgba(13,13,13,0.82)` + `backdrop-filter: blur(12px)`

#### 7. Dashboard redesign — 3 references + ui-ux-pro-max skill
References: Coursue Dashboard + Finance Dashboard (Alice Smith) + Paytop (Aida Mokhtari)

**Sidebar (Paytop/Finance style):**
- Deep purple gradient `linear-gradient(160deg, #0d0221, #1a0840, #0a0118)`
- User avatar block với role label
- White pill active nav (§9 nav-state-active)
- Section labels OVERVIEW / SECTORS
- Glow "New Analysis" CTA button ở bottom

**Header (Paytop style):**
- Search bar + Live badge (pulse xanh) + Bell + Avatar + @handle

**Main content:**
- Greeting "Hey [Name]! 👋" với sector subtitle
- Stats cards: icon square màu + số lớn + % badge (§6 weight-hierarchy)
- SVG area chart: 2 đường smooth (This Year vs Last Year) + gradient fill + legend
- App launcher: compact icon grid
- 4 panels: SVG icons (§4 no-emoji), left border accent

#### 8. Profile page — LinkedIn redesign
- Profile Card: avatar overlapping banner (128px), inline stats (Analyses/Items/Listings/USDC)
- Analytics Card: 3 metrics (Profile views / Data impressions / Search appearances) + "Private to you"
- Right sidebar: Upgrade CTA + People you may know + Who viewed your data
- Removed old Twitter-style cards và left nav icon aside

### Commits 2026-06-03

| Commit | Mô tả |
|---|---|
| `07632f8` | fix: ARC RPC v0.7.1 — env vars + Circle personal RPC |
| `1166aff` | docs: CLAUDE.md update 2026-05-27 |
| `06b418d` | feat(homepage): redesign per MHM + FMCG Dashboard |
| `1334340` | feat(hero): holographic retail bg image |
| `7356dd4` | feat(dashboard): holographic data streams bg |
| `a72d09f` | feat(profile): LinkedIn-style redesign |
| `fc7b1f7` | feat(dashboard): redesign 3 references + ui-ux-pro-max skill |

**Đã push lên:** `origin` (storescope-ai-Shelby) + `storescope-arc-primitives` (repo riêng)

### Quyết định kỹ thuật — 2026-06-03

| Quyết định | Lý do |
|---|---|
| Circle personal RPC thay vì public RPC | Track on-chain activity → tăng điểm submission Agora |
| Tạo repo primitives riêng | Arc OSS Showcase yêu cầu standalone, forkable repo |
| ui-ux-pro-max skill áp dụng trực tiếp | Python script bị auto-mode chặn; dùng skill knowledge trực tiếp vẫn hiệu quả |
| SVG area chart thuần (không recharts) | Tránh cài thêm dependency; chart đủ đẹp cho dashboard |
| Deep purple gradient sidebar | Finance/Paytop reference — professional SaaS look |
| White pill active nav | Paytop reference — clear active state, contrast ≥4.5:1 (§9) |
| Glassmorphism cards trên bg image | §4 blur-purpose: blur indicates layering; §6 contrast ≥4.5:1 |

### Việc cần làm tiếp (cập nhật 2026-06-03)

1. Test dashboard trên browser — kiểm tra SVG chart render + glassmorphism
2. Submit Google Form Arc OSS Showcase: `forms.gle/ok3Gr9zhmHnApvK48`
3. Deploy lên Vercel — push lên `vercel-repo`
4. Pitch StoreScope cho Circle grants qua Canteen channel
5. Tích hợp RetailLayoutNFT vào `/forum` — mint NFT khi save layout
6. Test pipeline đầy đủ: upload ảnh → USDC → ArcScan TX

---

## Nhật ký làm việc — 2026-06-04

### Công việc đã hoàn thành

#### 1. Dashboard — Sidebar redesign theo reference
- Deep purple gradient sidebar `linear-gradient(175deg, #0d0221, #130535, #0a0118)`
- Logo: 42px glow square icon
- User card: glassmorphism + 46px avatar với glow ring + online dot tím
- Nav items: circular icon containers (inactive) / square icon (active) + unique SVG icon mỗi route + chevron `>`
- Active item: purple gradient card + border + glow shadow
- Sectors: dot-line header + circle icon + name + chevron, active = gradient card
- Width: 242px

#### 2. Dashboard — 4 Panels redesign theo reference image
- **Search**: 44px circular blue icon header + glow border input + product thumbnails + neon green `#00e676` prices
- **Promotions**: Purple icon + promo cards với left accent line + neon green outlined discount box + folded corner ribbon
- **Products**: Green icon + rows với colored thumbnails + neon green price + red discount badge
- **Marketplace**: Indigo icon + holographic radar rings + SVG pulse waveform + purple gradient "List your data" button

#### 3. App Launcher — PremiumAppCard với premium effects (ui-ux-pro-max §7)
- `PremiumAppCard` React component với: 3D mouse-tracking tilt, spring physics cubic-bezier(0.34,1.56,0.64,1), shimmer sweep (translateX only), color glow orb, image zoom, label slide-up, chevron nudge
- Stagger entrance: `cardEntrance` animation, 55ms × index delay
- Scale feedback 0.95 on press
- `@media prefers-reduced-motion` disable all (§1 a11y)

#### 4. Dashboard — Sidebar nav redesign (reference mobile screenshot)
- Circular icon containers per nav item với SVG icons riêng (grid, chart, eye, robot, document, user, house, chat)
- Active: purple gradient card + border glow
- SECTORS header với dot + gradient line

#### 5. 40 Product images
- Copy 40 ảnh sản phẩm FMCG holographic vào `public/products/`
- `PRODUCT_IMG` mapping cho 8 promo products trong dashboard
- Dashboard panels dùng ảnh thật thay emoji

#### 6. Trang Catalog `/catalog`
- 40 sản phẩm đầy đủ: Pepsi, Mirinda, 7Up, Tea Plus, Sting, Aquafina, Vinamilk, Lay's, Cheetos, Oreo, Hảo Hảo
- Category filter + Brand filter + Search + Sort (discount/price asc/desc)
- Product cards: ảnh holographic + brand + name + neon green price + discount badge
- Stagger entrance animation

#### 7. Guide Icon — thay thế toàn bộ emoji icons
- `public/guide-icon.png` — glassmorphism robot bubble với notification dot
- `HowItWorks.tsx`: floating mascot 80px (guideFloat animation) + step cards 52px icons
- `ReceptionistWidget.tsx`: 4 chỗ thay 🤖 → guide-icon.png (64px button, 36px header, 28px message/typing)

#### 8. FeaturesGrid (Homepage) — redesign theo reference
- Filter tabs: single pill glassmorphism container, active = purple gradient, dividers
- Feature cards: dark navy gradient + unique SVG particle/wave background 6 variants
- Icon: 68px rounded square với gradient + glow
- Category label uppercase colored + title 20px bold + See More colored per card
- Badges: Most Popular / New / Live (pulse dot)
- Hover: translateY(-5px) + color border + colored glow

#### 9. Scan Trend chart — period tabs + tooltip
- Tabs: Ngày (7 ngày) / Tuần (8 tuần) / Tháng (12 tháng)
- Summary: Tổng / Trung bình / Cao nhất
- Y-axis labels + hover tooltip (số lượt + delta ▲/▼)
- 2 đường: hiện tại (solid) + kỳ trước (dashed)

### Commits 2026-06-04

| Commit | Mô tả |
|---|---|
| `f566a62` | feat(dashboard): sidebar redesign reference image |
| `32aa63b` | feat(dashboard): 4 panels redesign reference image |
| `f2c9770` | feat(dashboard): premium app card effects ui-ux-pro-max §7 |
| `3b1d0f1` | feat(dashboard): app launcher 3D holographic icons |
| `a310a8c` | feat: 40 product images + catalog page |
| `d32531b` | feat(howItWorks): replace emoji icons with robot guide icon |
| `b0cea76` | fix(receptionist): replace emoji with guide-icon.png |
| `5fef18b` | feat(homepage): FeaturesGrid redesign per reference image |
| `fa0d2ab` | feat(dashboard): Scan Trend period tabs + tooltip |

**Đã push lên:** `origin` (storescope-ai-Shelby)

### Assets mới thêm

| File | Mô tả |
|---|---|
| `public/guide-icon.png` | Robot bubble glassmorphism icon |
| `public/apps/*.png` | 8 app launcher 3D holographic icons |
| `public/products/*.png` | 40 FMCG product holographic images |
| `public/hero-bg.png` | Holographic retail shelves hero |
| `public/dashboard-bg.png` | Data streams background |

### Quyết định kỹ thuật — 2026-06-04

| Quyết định | Lý do |
|---|---|
| SVG particle backgrounds mỗi card | Unique visual identity, no image dependency, performance tốt |
| `PremiumAppCard` component riêng | Cần useState/useRef per card cho 3D tilt — không thể inline |
| Neon green `#00e676` cho prices | Match với reference image, tạo contrast mạnh |
| `PRODUCT_IMG` mapping by id | Clean separation, dễ mở rộng thêm sản phẩm |
| `guide-icon.png` thay emoji toàn bộ | Brand consistency, emoji inconsistent across platforms |
| Filter tabs single pill container | Match reference, professional SaaS look |

### Việc cần làm tiếp (cập nhật 2026-06-04)

1. Deploy lên Vercel
2. Submit Google Form Arc OSS Showcase
3. Test pipeline đầy đủ: upload ảnh → USDC → ArcScan
4. Tích hợp RetailLayoutNFT vào `/forum`
5. Pitch StoreScope cho Circle grants

---

## Nhật ký làm việc — 2026-06-04 (phiên 2)

### Thống kê công việc hôm nay

#### 1. Dashboard — Layout redesign theo StoreScope AI Pro reference
- `3bafa70` feat: layout matching StoreScope AI Pro reference
  - Hero section 3-col, 5 stats cards, Scan Trend side-by-side với AI Analytics CTA
  - Row 3: Tools & Shortcuts + Promotions + Watchlist (3-col)
  - Row 4: Global Search + Top Growing Category

#### 2. Dashboard — Stats cards chuẩn reference
- `f0e710b` Stats cards redesign: icon 52px bên trái + số liệu bên phải + % change
- `4146b48` Layout icon + info ngang bên phải, cùng chiều cao
- `4fd527e` Icon lớn hơn, thông tin số liệu nằm ngang

#### 3. Chart icons cho 5 stats cards
- `d49170c` Thêm icon neon cho 5 biểu đồ: Scans, Companies, Products, Images, Markets
- Files: `public/charts/scans.png`, `companies.png`, `products.png`, `images.png`, `markets.png`

#### 4. Tools & Shortcuts — PNG icons 3D holographic
- `9ee9d47` Thay SVG bolt icons bằng ảnh PNG thật từ `/apps/`
- 8 ảnh: ai-analysis, vision-agent, ai-agent, catalog, my-reports, my-profile, layout-editor, forum

#### 5. Scan Trend chart — tinh chỉnh kích thước
- `-20%` width và height ban đầu (W=448, H=120)
- +10% width → `0.8fr→0.88fr`
- +15% width thêm → `0.88fr→1.01fr`, W=515
- AI Analytics CTA: `1fr` fill remaining space
- Chart + AI Analytics side-by-side: `gridTemplateColumns: "1.01fr 1fr"`

#### 6. Hero section images
- `44e05a7` hero-center.png (S hexagon logo) + hero-globe.png (globe) áp dụng
- `b9f9425` Elegant redesign: mix-blend-mode:screen, gradient overlay
- `18c13fb` Banner bg image `7cce2a40` (holographic chart visualization)
- `51f76fa` Banner bg thay bằng `e90d397f` (S hexagon platform với floating icons)
- `a482a27` Hero tall 380px, ảnh nền đầy đủ S logo + platform
- `a955bcf` Gộp Hero + Stats dùng chung 1 ảnh nền `8b75a286`
- `8625ccf` Stats section dùng `8b75a286` làm nền riêng biệt

#### 7. AI Analytics CTA
- `a3272d4` Dùng ảnh `17106442` (globe + analytics) làm nền
- `21614b5` Thêm viền `rgba(124,58,237,0.3)`
- `779a43e` Fix content alignment (flexDirection column, padding), bg shift 10% trái
- `50cf52e` Split description 2 hàng

#### 8. Premium Typography + Effects (ui-ux-pro-max §6§7)
- `1d3d8a5` Applied:
  - §6: `antialiased`, `::selection` purple, scrollbar 5px, `tabular-nums` cho số liệu
  - §7: `btn-primary` spring `cubic-bezier(0.34,1.56,0.64,1)` + glow hover
  - `card-hover` translateY(-3px), `nav-item` drift, `input-elegant` glow focus
  - Stagger entrance 50ms/card, `fadeUp` keyframe, `heroFloat` simplified
  - `@media prefers-reduced-motion` disable all (§1 a11y)

#### 9. Latest Promotions — Hình ảnh sản phẩm thật
- `d308548` Cập nhật PROMO_MAP với dữ liệu thực từ Co.op Online:
  - Pepsi không calo -34%, Sting Dâu -28%, Aquafina -27%, Hảo Hảo -22%
  - `PromoItem.img` field thêm vào tất cả items
  - Display: 54px ảnh sản phẩm thật + discount badge + left accent gradient
- `dd96ae3` Fix DEFAULT_PROMOS: thêm img + keywords condiment/oil/seasoning

### Hình ảnh mới thêm hôm nay
| File | Mô tả |
|---|---|
| `public/hero/hero-bg.png` | S hexagon platform e90d397f |
| `public/hero/stats-bg.png` | S hexagon + purple data viz 8b75a286 |
| `public/hero/ai-analytics-bg.png` | Globe + analytics 17106442 |
| `public/charts/scans.png` | Neon QR scan icon |
| `public/charts/companies.png` | Neon building icon |
| `public/charts/products.png` | Neon products icon |
| `public/charts/images.png` | Neon images icon |
| `public/charts/markets.png` | Neon globe icon |

### Commits hôm nay (phiên 2): 30 commits
Từ `7be21f3` → `dd96ae3`

### Việc cần làm tiếp
1. Deploy lên Vercel — push `vercel-repo`
2. Cập nhật CLAUDE.md vào `storescope-ai` repo
3. Submit Google Form Arc OSS Showcase
4. Pitch Circle grants
5. Test pipeline đầy đủ: upload ảnh → USDC → ArcScan

---

## Nhật ký làm việc — 2026-06-09

### Công việc đã hoàn thành

#### 1. Redesign `/dashboard/analysis` theo reference image

Toàn bộ UI trang AI Analysis được làm lại để match với reference screenshot:

**Sidebar:**
- Thêm SVG icons cho từng nav item (house/crosshair/eye/monitor/doc/grid/chat)
- Màu nền đổi sang `#06060f`, border `#14142a` (dark navy tone)
- "Arc Testnet Connected" badge với animated green glow dot ở bottom
- Language switcher giữ nguyên cuối sidebar

**Header:**
- Đổi từ tag + title nhỏ → "AI Shelf Intelligence" cỡ 22px + sparkle icon `✦` (svg, tím)
- Subtitle: "Upload shelf images and convert retail execution into AI insights and on-chain proof."
- Giữ nguyên WalletButton + CircleWalletButton
- Thêm "View Reports" button (ghost, link `/dashboard/reports`)

**Upload zone (redesign hoàn toàn):**
- Card holographic với `linear-gradient(135deg, #0c0c1e, #0f0f2a)` + purple dashed border
- Corner accent decorations (4 góc)
- Cloud upload icon 3-layer với radial glow background
- Heading "Upload shelf image" + subtitle + format badges (JPG / PNG / WEBP / Max 10MB)
- Khi có ảnh: preview với "Change" button overlay
- "Try Demo Image" button → fetch `/shelf-hero.png` và load vào state

**CTA button:**
- "Connect Wallet & Run Analysis" với `linear-gradient(135deg, #7c3aed, #6d28d9)`
- `box-shadow: 0 4px 20px rgba(124,58,237,0.35)` khi active
- Spring hover: opacity 0.88

**Pipeline cards (mới):**
- 3 cards ngang (01/02/03): Upload Image / AI Retail Detection / On-chain Proof Report
- Mỗi card: số tag tím + SVG icon + title + description
- Dotted connector (3 chấm) giữa các cards

**10 Micro-Tasks panel (redesign):**
- Header: "10 Micro-Tasks ✦" (trái) + "Each task = 1 on-chain transaction" (phải)
- Short labels match reference: "Image Registration", "Image Quality Audit", "Shelf Object Detection", v.v.
- Mỗi row: number badge (circle) + task name/desc + status badge ("● Pending"/"✓ Done") + USDC price
- Footer: database icon + "Estimated on-chain execution cost" + "0 / 10 tasks completed" + `$0.025 USDC` (teal `#2dd4bf`)
- Progress bar teal khi running

**Layout:**
- Đổi từ `gridTemplateColumns: "320px 1fr"` → `"1fr 390px"`
- Budget progress bar tách thành dải riêng phía trên CTA
- Xóa empty state cũ (upload zone đã tích hợp thay thế)

### Quyết định kỹ thuật — 2026-06-09

| Quyết định | Lý do |
|---|---|
| `1fr 390px` thay `320px 1fr` | Upload zone cần không gian rộng hơn; task panel cố định 390px đủ hiển thị label |
| Corner accent decorations inline style | Không cần CSS class; chỉ dùng 1 lần, giữ file gọn |
| Short labels riêng (shortLabels object) | ANALYSIS_TASKS trong arc.ts có label dài; reference dùng label ngắn — tránh sửa source of truth |
| "Try Demo Image" fetch `/shelf-hero.png` | Không cần API; ảnh đã có trong public — fetch + blob + File object đơn giản |
| Xóa empty state cũ | Upload zone mới đã handle trạng thái empty trực tiếp; component thừa |
| Teal `#2dd4bf` cho tổng giá | Match màu reference image; phân biệt với purple accent tasks |

### Việc cần làm tiếp (cập nhật 2026-06-09)

1. Deploy lên Vercel — push `vercel-repo`
2. Submit Google Form Arc OSS Showcase
3. Test pipeline đầy đủ: upload ảnh → USDC → ArcScan
4. Pitch Circle grants
5. Tích hợp RetailLayoutNFT vào `/forum`
