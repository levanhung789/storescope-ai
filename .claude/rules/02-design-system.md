---
description: Áp dụng khi viết bất kỳ CSS, style inline, hoặc Tailwind class nào. Đây là nguồn sự thật duy nhất cho visual design.
---

# Design System

## Triết lý

Tối giản — hiện đại — chuyên nghiệp. Lấy cảm hứng từ dala.craftedbygc.com:
- Nền **đen tuyệt đối** `#000`, không dùng gradient sặc sỡ
- Typography làm chủ layout, không dùng ảnh hero lớn
- Một màu accent duy nhất (`#7c3aed`) cho CTA
- Generous whitespace — sections cần không gian để thở
- Hiệu ứng tinh tế: fade-in, subtle glow, particle sphere 3D xoay

## Màu sắc

```
Background:    #000000  — body background, hero background
Surface:       #111111  — card backgrounds
Surface dark:  #0a0a0a  — section alternate backgrounds  
Border:        #2a2a2a  — card borders, dividers
Border subtle: #1f1f1f  — very subtle separators
Text primary:  #f0f0f0  — headings, important text
Text muted:    #888888  — body text, descriptions
Text faint:    #555555  — secondary labels, sub-text
Accent:        #7c3aed  — CTA buttons, highlights, tags
Accent dark:   #6d28d9  — hover state of accent
Accent glow:   rgba(124,58,237,0.35) — box-shadow glow on hover
Gold particle: #f59e0b  — ONLY trong ParticleSphere canvas (85% of particles)
```

Không được thêm màu nào ngoài danh sách trên mà không hỏi trước.

## Typography

- **Hero headline**: `clamp(2.8rem, 5.5vw, 5.2rem)`, weight 800, `letter-spacing: -0.035em`, `line-height: 1.04`, color `#fff`
- **Section title**: `clamp(2rem, 4vw, 3rem)`, weight 700, `letter-spacing: -0.03em`
- **Body / description**: `clamp(0.82rem, 1.1vw, 0.96rem)` trong hero, `13–15px` trong sections, color `#888` hoặc `rgba(255,255,255,0.35)` trong hero
- **Label / Tag**: `10–11px`, uppercase, `letter-spacing: 0.15–0.18em`, color `#7c3aed`
- **Logo**: `18px`, weight 700, `letter-spacing: -0.03em`

Không dùng màu trắng thuần `#ffffff` cho body text — dùng `#f0f0f0` hoặc `rgba(255,255,255,0.35)`.

## Spacing

- Section padding: `128px 24px` desktop, `80px 24px` mobile
- Container max-width: `1152px`, margin auto, padding `0 24px`
- Card padding: `32–36px`
- Grid gap: `1px` (seamless grid) hoặc `16–48px` (separated cards)

## Component Tokens

| Element | Style |
|---|---|
| Card background | `#111` hoặc `#0a0a0a` |
| Card border | `1px solid #2a2a2a` |
| Border radius (card) | `12–20px` |
| Border radius (pill/tag) | `999px` |
| Border radius (button) | `999px` |
| Shadow | Không dùng `box-shadow` lớn — chỉ dùng glow: `0 8px 24px rgba(124,58,237,0.35)` khi hover |
| Backdrop blur | Chỉ dùng cho Navbar khi scroll: `blur(20px)` |

## Buttons

**Primary (accent)**:
```
background: #7c3aed
color: #fff
padding: 11–14px 22–28px
border-radius: 999px
font-weight: 600
font-size: 13–14px
transition: background 0.25s, transform 0.2s, box-shadow 0.25s
hover: background #6d28d9, translateY(-2px) scale(1.02), box-shadow glow
```

**Ghost (outlined)**:
```
background: transparent
border: 1px solid rgba(255,255,255,0.18)
color: #fff
padding: 7–14px 16–24px
border-radius: 999px
transition: border-color 0.25s, background 0.25s, transform 0.2s
hover: border rgba(255,255,255,0.45), background rgba(255,255,255,0.07), translateY(-1px) scale(1.02)
```

Không dùng icon emoji trong button — chỉ lucide-react SVG.

## Particle Sphere

- Màu: Gold `#f59e0b` / `#fbbf24` / `#d97706` chiếm **85%**, white `#fff` 8%, purple `#a78bfa` / `#7c3aed` 7%
- Particle count: 520
- Rotation speed: `rotY += 0.0022` per frame
- Size: `clamp(420px, 56vw, 860px)` — chiếm phần lớn viewport
- Position trong Hero: absolute top-right, `transform: translateY(-52%)`
