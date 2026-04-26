---
description: Áp dụng khi chạy dev server, build, test, hoặc chụp screenshot để review UI.
---

# Dev Workflow

## Commands

```bash
npm run dev     # localhost:3000 — dev server với hot reload
npm run build   # production build — kiểm tra TypeScript errors
npm run lint    # ESLint check
```

## UI Task Checklist

Trước khi báo hoàn thành bất kỳ UI task nào:
1. `npm run build` — đảm bảo không có TypeScript / build error
2. Mở browser kiểm tra golden path (desktop 1440px)
3. Kiểm tra mobile (390px) — dùng DevTools responsive mode
4. Kiểm tra tất cả scroll animation hoạt động đúng
5. Kiểm tra hover states trên buttons, cards, links

## Screenshot Process

Dùng Playwright script tại `scripts/screenshot.js`:

```bash
node scripts/screenshot.js
# Output: screenshots/desktop.png + screenshots/mobile.png
```

Script này:
1. Navigate tới `localhost:3000`
2. Scroll qua toàn bộ trang (200px/step) để trigger IntersectionObserver
3. Inject CSS disable transitions (`0.01ms duration`) để elements hiện instant
4. Chụp full-page screenshot ở 2 viewport: desktop (1440px) và mobile (390px)

**Quan trọng**: Phải scroll trước khi chụp — nếu không, các sections có `opacity: 0` (inView=false) sẽ invisible trong screenshot.

## Khi thêm section mới

1. Tạo file trong `app/_components/`
2. Import và thêm vào `app/page.tsx` đúng thứ tự (xem `03-page-structure.md`)
3. Thêm `useInView` hook nếu section có animation
4. Chạy `npm run build` để verify
5. Chụp screenshot để review

## Git

- Branch: `main`
- Commit message ngắn gọn, tiếng Anh
- Không commit: `node_modules/`, `.env`, `screenshots/` (nếu lớn)
