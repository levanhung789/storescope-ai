---
description: Áp dụng khi viết TypeScript, tạo component, hoặc dùng Tailwind CSS trong dự án.
---

# Coding Conventions

## TypeScript

- Strict mode bật — không dùng `any`
- Props interface đặt ngay trên component, không export nếu chỉ dùng trong file đó
- Server component mặc định — chỉ thêm `"use client"` khi cần event handlers, state, hoặc hooks
- Không dùng `as` type cast trừ khi không còn cách nào khác (vd: `ref as React.RefObject<HTMLElement>` cho useInView)

## Component Rules

- Mỗi section = 1 file trong `_components/`
- Không prop drilling sâu hơn 1 level — dùng composition
- Content data (strings, labels, links) đặt ở đầu file dưới dạng const object, không hardcode inline
- Nếu content vượt 50 dòng, tách ra `_data/` (vd: `_data/services.ts`)
- Multilingual (nếu cần): dùng `{ vi, en }` object inline — không cài thư viện i18n

## Tailwind CSS

- Không viết CSS thuần ngoài `globals.css` (chỉ dùng cho CSS variables và `@keyframes`)
- Responsive: mobile-first — `sm:` `md:` `lg:`
- Không dùng `!important` hoặc inline style trừ trường hợp dynamic value (vd: particle position, inView state)
- Dùng `style={}` cho giá trị động (opacity, transform từ inView); dùng Tailwind class cho giá trị tĩnh

## Import Order

1. React / Next.js built-ins
2. Third-party (lucide-react, etc.)
3. Internal (`../_hooks/`, `../_components/`)
4. Types (cuối cùng)
