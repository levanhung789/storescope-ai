---
description: Áp dụng khi thêm scroll animation, hiệu ứng Canvas, hoặc tối ưu performance cho bất kỳ component nào.
---

# Animation & Performance

## Scroll-triggered Animations

- Dùng `IntersectionObserver` qua hook `useInView` — **không** dùng scroll event listener
- Hook nằm tại `app/_hooks/useInView.ts`, options: `{ threshold, rootMargin, once }`
- `once: true` (default) — disconnect observer sau lần trigger đầu tiên để tránh re-animate
- Pattern chuẩn:

```tsx
const { ref, inView } = useInView({ threshold: 0.15 });

<section
  ref={ref as React.RefObject<HTMLElement>}
  style={{
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  }}
>
```

- Stagger items: thêm `transitionDelay` theo index (`index * 80ms` tối đa)
- Không dùng `animation-fill-mode: forwards` cho elements dùng inView — dùng state trực tiếp

## CSS @keyframes

Các keyframe đã có trong `globals.css`:
- `fade-up` — opacity 0 → 1, translateY(20px) → 0
- `fade-in` — opacity 0 → 1
- `pulse-glow` — box-shadow pulse cho accent elements

Dùng qua class: `animate-fade-up`, `animate-fade-up delay-100`, `animate-fade-up delay-200`

## Canvas / ParticleSphere

- File: `app/_components/ParticleSphere.tsx`
- Bắt buộc `"use client"` + import qua `next/dynamic` với `ssr: false`
- Cleanup bắt buộc khi unmount:

```ts
useEffect(() => {
  const animId = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(animId);
    // resize listener cleanup
  };
}, []);
```

- Không dùng Three.js — chỉ Canvas API thuần
- Dùng `devicePixelRatio` để sharp trên retina: `canvas.width = size * dpr`

## Performance Rules

- Tránh layout shift: đặt kích thước cố định (width/height) cho hero và canvas container
- Không import thư viện animation (Framer Motion, GSAP) — dùng CSS transition thuần
- `will-change: transform` chỉ dùng cho elements đang animate thực sự, remove sau khi xong
- Lazy load sections ngoài viewport với `next/dynamic` nếu cần (hiện tại chỉ ParticleSphere)
