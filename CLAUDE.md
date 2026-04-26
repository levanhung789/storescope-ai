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

## Trạng thái dự án (cập nhật 2026-04-25)

### Đã hoàn thành

| Phần | Trạng thái | Ghi chú |
|---|---|---|
| Landing page (9 sections) | Hoàn thành | Navbar, Hero, Stats, HowItWorks, Services, UseCases, Pricing, CtaBanner, Footer |
| ParticleSphere (Canvas 3D) | Hoàn thành | 520 particles, gold/white/purple, xoay auto |
| `.claude/rules/` (01–07) | Hoàn thành | Tách từ CLAUDE.md, mỗi file có `description` frontmatter |
| `.claude/agents/researcher.md` | Hoàn thành | Research agent, model claude-sonnet-4-6, tóm tắt ≤500 từ + Recommendation |
| `.claude/skills/tao-bai-viet.md` | Hoàn thành | Skill fetch 6 trang Bách Hóa Xanh, tạo bài viết có cấu trúc |
| Trang `/contact` | Hoàn thành | Form 4 trường, validation 2 lớp, success card, responsive mobile |
| API route `/api/contact` | Placeholder | Validate + log console, **chưa gửi email thật** |
| Layout Editor `/layout-editor` | Hoàn thành | Konva 2D drag-drop → **đã chuyển sang 3D (React Three Fiber)** |
| Layout Editor — Vẽ tường | Hoàn thành | Click-click vẽ đường tường đen, chain segments, chọn/xóa tường, ESC thoát |
| Layout Editor — Store size editor | Hoàn thành | Popover nhập W×H (m), lưu vào `doc.canvas.width/height` |
| Layout Editor — Toon/Cartoon 3D | Hoàn thành | MeshToonMaterial + Outline postprocessing, 2-step gradient, dark outlines |
| Dashboard link | Hoàn thành | Sidebar "Bố trí cửa hàng" → `/layout-editor` |

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

1. **Kết nối gửi email thật** — Cần chọn 1 trong 2:
   - **Resend** (`npm install resend`) — đơn giản nhất cho Next.js, miễn phí 3000 email/tháng. Cần `RESEND_API_KEY` trong `.env.local`
   - **Nodemailer + SMTP** — dùng Gmail/SMTP của công ty. Cần `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
   - Khi có credentials, chỉnh sửa `app/api/contact/route.ts` để thay thế `console.log`

2. **Deploy** — Nghiên cứu đã xác định: Vercel Hobby miễn phí nhưng **cấm dùng thương mại** (B2B). Phải nâng lên Pro ($20/tháng) hoặc dùng Cloudflare Pages (miễn phí, không giới hạn thương mại).

3. **Logo** — Navbar hiện dùng text `storescope.ai`. Nếu có file logo SVG/PNG, thêm vào `public/` và dùng `<Image>` trong Navbar.

4. **OG image** — `app/opengraph-image.png` chưa có. Cần tạo để social share hiển thị đúng.

5. **Layout Editor — cải thiện tiếp:**
   - Màu sản phẩm bên trong tủ mát còn nhạt — cần tăng độ tương phản
   - Có thể thêm shadow dưới chân fixture cho chiều sâu
   - Xem xét thêm "Auto-arrange" để fixtures tự xếp thành hàng

### Quyết định quan trọng đã đưa ra

| Quyết định | Lý do |
|---|---|
| API `/api/contact` chỉ log console, không gửi email | Không cài npm package (Resend/Nodemailer) khi chưa có credentials — tránh setup thừa |
| Phone field là optional | Thông tin liên lạc bổ sung, không nên block người dùng nếu không có SĐT |
| Navbar dùng `<a>` thay `<Link>` cho link /contact | Giữ nhất quán với pattern hiện tại — Navbar đã dùng `<a>` cho tất cả links |
| Contact page là Server Component, chỉ ContactForm là client | Giảm JS bundle — form cần state/event nhưng wrapper page không cần |
| Vercel Hobby không phù hợp cho sản phẩm B2B thương mại | Terms of Service cấm commercial use trên Hobby plan — cần Pro hoặc Cloudflare |
| Layout Editor canvas 20000×15000mm | Fixtures trong JSON export vượt 12000mm — canvas cũ quá nhỏ |
| Wall drawing dùng click-click chain (không end-on-click) | UX tự nhiên hơn: mỗi click hoàn thành 1 đoạn và bắt đầu đoạn tiếp theo, giống pen tool |
| Dashboard dùng `<a>` thay `<Link>` cho link layout-editor | Next.js Link gây lỗi navigation với trang có Konva canvas |
| Layout Editor chuyển từ Konva 2D → React Three Fiber 3D | Yêu cầu hiển thị toon/cartoon 3D như reference image — không thể làm với Konva |
| Dùng `meshToonMaterial` thay `meshStandardMaterial` | Flat cartoon look, không cần PBR — nhẹ hơn, consistent hơn với design intent |
| `useMemo` cho floor grid phải đặt ngoài JSX return | React hooks rule: không được gọi hook bên trong JSX expression |
| `emissiveIntensity` tối đa 0.6 với toon material | Toon material cộng emissive trực tiếp lên màu, không bị scale bởi lighting → dễ overexpose |
