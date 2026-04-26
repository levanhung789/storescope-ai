---
name: tao-bai-viet
description: Tạo outline và nội dung bài viết hoàn chỉnh về chương trình khuyến mãi từ các trang thương hiệu Bách Hóa Xanh
---

Khi được gọi, hãy thực hiện tuần tự các bước sau:

## Bước 1 — Thu thập dữ liệu

Dùng WebFetch để đọc nội dung từ các trang sau (đọc song song, tất cả cùng lúc):

- https://www.bachhoaxanh.com/thuong-hieu/chuong-trinh-le-hoi-ct10033
- https://www.bachhoaxanh.com/thuong-hieu/test-unilever-ct14
- https://www.bachhoaxanh.com/thuong-hieu/pg-vn-ct16
- https://www.bachhoaxanh.com/thuong-hieu/bat-nap-chai-uong-thoai-mai-cung-pepsi-ct8
- https://www.bachhoaxanh.com/thuong-hieu/colgate-ct30
- https://www.bachhoaxanh.com/thuong-hieu/marico-viet-nam-ct33

Với mỗi trang, trích xuất:
- Tên thương hiệu / chương trình khuyến mãi
- Sản phẩm đang khuyến mãi
- Thời gian áp dụng (ngày bắt đầu — ngày kết thúc)
- Mức giảm giá hoặc ưu đãi cụ thể
- Link gốc của trang

## Bước 2 — Tạo bài viết hoàn chỉnh

Viết bài viết theo cấu trúc sau:

---

### 1. Tiêu đề bài viết
Ngắn gọn, dễ hiểu, nêu rõ chủ đề chương trình khuyến mãi đang diễn ra.
Ví dụ: *"Khuyến mãi tháng [X]: Tổng hợp ưu đãi nổi bật tại Bách Hóa Xanh"*

---

### 2. Mục tiêu bài viết
Sau khi đọc bài viết, người đọc sẽ:
- Hiểu rõ các chương trình khuyến mãi đang diễn ra
- Nắm được sản phẩm nào đang giảm giá và thời gian áp dụng
- Biết các đối thủ cạnh tranh của từng sản phẩm đang làm gì trên thị trường

---

### 3. Nội dung chính

Với **mỗi thương hiệu / chương trình**, trình bày theo format:

```
#### [Tên thương hiệu] — [Tên chương trình]

**Sản phẩm khuyến mãi**: [liệt kê sản phẩm]
**Thời gian**: [ngày bắt đầu] – [ngày kết thúc]
**Ưu đãi**: [mô tả % giảm / quà tặng / combo]

**Đối thủ cạnh tranh đang làm gì?**
[Phân tích ngắn: đối thủ cùng ngành hàng hiện có chương trình gì tương tự hoặc khác biệt — dùng kiến thức chung nếu không có dữ liệu trực tiếp]

**Liên kết với khách hàng sử dụng dịch vụ StoreScope AI**:
[Giải thích ngắn cách dữ liệu shelf này có thể hữu ích cho FMCG brand / distributor / retail team khi dùng StoreScope AI để theo dõi compliance trên kệ hàng]

🔗 [Xem chi tiết tại Bách Hóa Xanh]([link gốc])
```

---

### 4. Kết luận
Tóm tắt 2–3 điểm nổi bật nhất, gợi ý người đọc hành động (mua hàng trước khi hết hạn, hoặc liên hệ StoreScope AI để track shelf execution).

---

## Quy tắc viết

- Ngôn ngữ: tiếng Việt, giọng văn chuyên nghiệp nhưng dễ đọc
- Không dùng emoji trừ khi cần nhấn mạnh
- Độ dài mỗi phần thương hiệu: 80–120 từ
- Nếu một trang không load được, bỏ qua và ghi chú "[Không lấy được dữ liệu]"
- Luôn ghi rõ ngày tháng cụ thể — không viết mơ hồ như "sắp tới" hay "gần đây"
