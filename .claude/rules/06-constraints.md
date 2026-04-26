---
description: Áp dụng cho mọi task. Đây là các quy tắc tuyệt đối không được vi phạm.
---

# Hard Constraints

## Tuyệt đối KHÔNG làm

- **Không dùng emoji trong UI** — trừ khi user yêu cầu rõ ràng
- **Không thêm màu sắc mới** ngoài design system đã định nghĩa trong `02-design-system.md`
- **Không cài thêm thư viện** (npm install) mà không hỏi user trước
- **Không hardcode credentials** trong bất kỳ file nào
- **Không commit file `.env`** hay file chứa secrets
- **Không dùng `<img>` cho ảnh sản phẩm** — dùng Next.js `<Image>` (chỉ dùng `<img>` cho decorative/canvas)
- **Không chỉnh sửa `dashboard/`, `login/`, `api/`** trừ khi được yêu cầu rõ ràng
- **Không thêm `any` type** trong TypeScript
- **Không dùng icon emoji trong button** — chỉ lucide-react SVG icons
- **Không dùng màu trắng thuần `#ffffff`** cho body text — dùng `#f0f0f0`
- **Không dùng `!important`** trong CSS/Tailwind

## Trước khi báo hoàn thành

Kiểm tra checklist:
- [ ] Build không có TypeScript error
- [ ] Không có console error trên browser
- [ ] Mobile responsive (390px viewport)
- [ ] Tất cả scroll animation hoạt động
- [ ] Màu sắc đúng design system
- [ ] Không có text bị cắt hoặc overflow ẩn

## Khi gặp conflict

Nếu yêu cầu của user mâu thuẫn với rules này: **hỏi user trước**, không tự quyết định vi phạm rule.
