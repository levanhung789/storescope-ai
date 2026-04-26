---
description: Áp dụng khi tạo mới, di chuyển, hoặc đặt tên file/component trong dự án.
---

# Page Structure & File Organization

## Landing Page Sections (theo thứ tự)

| # | Section | File | Ghi chú |
|---|---|---|---|
| 1 | Navbar | `Navbar.tsx` | Sticky, logo text-only, blur khi scroll |
| 2 | Hero | `Hero.tsx` | Sphere absolute top-right, text bottom-left |
| 3 | Stats | `Stats.tsx` | Animated counters với IntersectionObserver |
| 4 | How it works | `HowItWorks.tsx` | 6-stage AI pipeline grid + confidence bar |
| 5 | Services | `Services.tsx` | 6 service cards, 3-column grid |
| 6 | Use Cases | `UseCases.tsx` | 3 alternating layout cards |
| 7 | Pricing + Roadmap | `Pricing.tsx` | Roadmap 4 phases + 3 pricing tiers |
| 8 | CTA Banner | `CtaBanner.tsx` | Full-width, violet glow background |
| 9 | Footer | `Footer.tsx` | 5-column links grid |

## File Structure

```
app/
  page.tsx                  ← Assembly point — chỉ import, không có logic
  layout.tsx                ← Root layout, metadata SEO, fonts
  globals.css               ← CSS variables, @keyframes, base styles
  _components/
    Navbar.tsx
    Hero.tsx
    ParticleSphere.tsx      ← Canvas 3D — "use client", no SSR
    Stats.tsx
    HowItWorks.tsx
    Services.tsx
    UseCases.tsx
    Pricing.tsx
    CtaBanner.tsx
    Footer.tsx
  _hooks/
    useInView.ts            ← IntersectionObserver hook, once: true
  dashboard/                ← App nội bộ — KHÔNG CHỈNH SỬA
  login/                    ← Auth page — KHÔNG CHỈNH SỬA
  api/                      ← API routes — KHÔNG CHỈNH SỬA
```

## Quy tắc đặt file

- Mỗi section = 1 file trong `_components/`
- Hook dùng chung → `_hooks/`
- Constant/content data → đầu file hoặc `_data/` nếu lớn hơn 50 dòng
- Không tạo file mới trong `dashboard/`, `login/`, `api/` trừ khi được yêu cầu rõ ràng
- Prefix `_` cho thư mục private (không phải route)

## app/page.tsx

File này chỉ được phép import và assemble sections. Không có JSX logic, state, hay data fetching.

```tsx
import Navbar from "./_components/Navbar";
// ... other imports

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        {/* sections in order */}
      </main>
      <Footer />
    </>
  );
}
```
