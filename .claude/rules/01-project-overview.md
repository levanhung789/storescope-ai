---
description: Áp dụng cho mọi task trong dự án. Mô tả mục tiêu, tech stack và ngữ cảnh tổng thể.
---

# Project Overview

## Mục tiêu

Build **marketing landing page** cho StoreScope AI — nền tảng AI bán lẻ FMCG biến ảnh kệ hàng thành dữ liệu kinh doanh có cấu trúc.

- Đây là **website giới thiệu dịch vụ**, không phải app nội bộ
- App nội bộ nằm tại `app/dashboard/` — không được chỉnh sửa trừ khi được yêu cầu rõ ràng
- Landing page nằm tại `app/page.tsx`

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict |
| Styling | Tailwind CSS v4 — utility-first, không dùng CSS modules |
| Font | Geist Sans (đã cài sẵn) |
| Icons | lucide-react |
| Animation | CSS transitions + `@keyframes` thuần |
| 3D / Particle | Canvas API thuần (ParticleSphere.tsx) |
| Blockchain | Move smart contracts trên Aptos (Shelby storage) |

## Thông tin sản phẩm (dùng làm nội dung)

- **AI Pipeline**: 6 stages — Upload → OCR → Vision → Normalize → Catalog Match → Confidence Scoring
- **Confidence weights**: Brand 30%, Text similarity 30%, Size 20%, Category 10%, Visual 10%
- **Catalog size**: 50,000+ SKUs
- **Target users**: FMCG brands, distributors, retail execution teams, field audit workflows
- **Categories**: Dairy, soft drinks, CPG, consumer packaged goods
- **Storage**: Shelby on Aptos blockchain (Move smart contracts), verifiable via Aptos Explorer
