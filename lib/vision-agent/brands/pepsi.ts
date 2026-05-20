// Pepsi Brand Formation — Visual Recognition Catalog
// Suntory PepsiCo Vietnam — Complete SKU Database

export const PEPSI_BRAND = {
  name:    "Pepsi",
  company: "Suntory PepsiCo Vietnam",
  sector:  "Beverages",
  colors:  ["#003087", "#EE1020", "#FFFFFF"], // Blue, Red, White
};

// ── SKU Catalog with visual identifiers ───────────────────────────────────────
export const PEPSI_SKUS = [
  // ── Pepsi Regular ──────────────────────────────────────────────────────────
  {
    id:          "PEPSI-REG-330ML-CAN",
    sku:         "Pepsi Regular lon 330ml",
    brand:       "Pepsi",
    variant:     "Regular",
    format:      "can",
    sizeML:      330,
    visual: {
      primaryColor:   "#003087",  // deep blue
      secondaryColor: "#EE1020",  // red wave
      logo:           "PEPSI globe (blue/red/white)",
      label:          "Blue can with red Pepsi globe, white text 'pepsi'",
      shape:          "standard 330ml can, slim cylinder",
    },
    priceVND:    { min: 8000,  max: 12000  },
    priceEUR:    { min: 0.40,  max: 0.65   },
    barcode:     "8934822300042",
  },
  {
    id:          "PEPSI-REG-390ML-BOT",
    sku:         "Pepsi Regular chai 390ml",
    brand:       "Pepsi",
    variant:     "Regular",
    format:      "bottle",
    sizeML:      390,
    visual: {
      primaryColor:   "#003087",
      secondaryColor: "#EE1020",
      label:          "Chai PET xanh dương, nhãn Pepsi globe xanh/đỏ/trắng, nắp xanh",
      shape:          "Chai thon, cao ~23cm, đường kính ~6cm — nhỏ hơn 500ml, lớn hơn lon 330ml",
      distinguisher:  "Nắp XANH DƯƠNG — phân biệt với Max/Zero nắp đen",
    },
    priceVND:    { min: 10000, max: 15000  },
    barcode:     "8934822390043",
  },
  {
    id:          "PEPSI-MAX-390ML-BOT",
    sku:         "Pepsi Max chai 390ml",
    brand:       "Pepsi",
    variant:     "Max / Zero Sugar",
    format:      "bottle",
    sizeML:      390,
    visual: {
      primaryColor:   "#000000",
      secondaryColor: "#003087",
      label:          "Chai PET ĐEN, nhãn đen với globe Pepsi và chữ 'MAX', nắp ĐEN",
      shape:          "Cùng hình dạng với Pepsi Regular 390ml",
      distinguisher:  "Nắp ĐEN + chai tối màu — dễ nhầm từ xa, chú ý màu nắp",
    },
    priceVND:    { min: 10000, max: 15000  },
  },
  {
    id:          "PEPSI-TWIST-390ML-BOT",
    sku:         "Pepsi Twist Chanh chai 390ml",
    brand:       "Pepsi",
    variant:     "Twist / Lemon",
    format:      "bottle",
    sizeML:      390,
    visual: {
      primaryColor:   "#003087",
      secondaryColor: "#FFE600",
      label:          "Chai xanh dương, điểm nhấn vàng chanh, hình lát chanh trên nhãn",
      shape:          "Cùng hình dạng 390ml",
      distinguisher:  "Có màu VÀNG/XANH LÁ trên nhãn — khác Regular thuần xanh",
    },
    priceVND:    { min: 10000, max: 15000  },
  },
  {
    id:          "PEPSI-REG-1L-BOT",
    sku:         "Pepsi Regular chai 1L",
    brand:       "Pepsi",
    variant:     "Regular",
    format:      "bottle",
    sizeML:      1000,
    visual: {
      primaryColor:   "#003087",
      label:          "Large blue PET bottle, full-wrap Pepsi label",
      shape:          "tall PET bottle 1L",
    },
    priceVND:    { min: 18000, max: 25000  },
  },
  {
    id:          "PEPSI-REG-1.5L-BOT",
    sku:         "Pepsi Regular chai 1.5L",
    brand:       "Pepsi",
    variant:     "Regular",
    format:      "bottle",
    sizeML:      1500,
    visual: {
      primaryColor:   "#003087",
      label:          "Large blue PET bottle, blue/white label, blue cap",
      shape:          "large PET bottle 1.5L, wider base",
    },
    priceVND:    { min: 20000, max: 28000  },
    priceEUR:    { min: 1.00,  max: 1.50   },
  },
  {
    id:          "PEPSI-REG-2L-BOT",
    sku:         "Pepsi Regular chai 2L",
    brand:       "Pepsi",
    variant:     "Regular",
    format:      "bottle",
    sizeML:      2000,
    visual: {
      primaryColor:   "#003087",
      label:          "Family size blue PET bottle, 2L label",
      shape:          "wide PET bottle 2L",
    },
    priceVND:    { min: 28000, max: 38000  },
    priceEUR:    { min: 1.20,  max: 2.00   },
  },

  // ── Pepsi Black / Max / Zero ────────────────────────────────────────────────
  {
    id:          "PEPSI-MAX-330ML-CAN",
    sku:         "Pepsi Max lon 330ml",
    brand:       "Pepsi",
    variant:     "Max / Zero Sugar",
    format:      "can",
    sizeML:      330,
    visual: {
      primaryColor:   "#000000",  // black
      secondaryColor: "#003087",  // blue accent
      label:          "Black can, 'Pepsi MAX' in silver/blue, zero sugar badge",
      shape:          "standard 330ml can",
      distinguisher:  "MUCH darker than regular Pepsi — black background",
    },
    priceVND:    { min: 8000,  max: 12000  },
    priceEUR:    { min: 0.40,  max: 0.65   },
  },
  {
    id:          "PEPSI-MAX-1.5L-BOT",
    sku:         "Pepsi Max chai 1.5L",
    brand:       "Pepsi",
    variant:     "Max / Zero Sugar",
    format:      "bottle",
    sizeML:      1500,
    visual: {
      primaryColor:   "#000000",
      label:          "Black PET bottle with blue Pepsi globe, 'MAX' text",
      distinguisher:  "Black bottle vs blue bottle for regular",
    },
    priceEUR:    { min: 0.79,  max: 1.31   },
  },
  {
    id:          "PEPSI-MAX-2L-MULTIPACK",
    sku:         "Pepsi Max multipack 2×2L",
    brand:       "Pepsi",
    variant:     "Max / Zero Sugar",
    format:      "multipack",
    sizeML:      2000,
    visual: {
      primaryColor:   "#000000",
      label:          "2 black bottles shrink-wrapped, 'PACK AHORRO' yellow banner",
      distinguisher:  "Yellow 'PACK AHORRO' label visible on shrink wrap",
    },
    priceEUR:    { min: 1.50,  max: 2.00   },
  },

  // ── 7Up (Suntory PepsiCo) ───────────────────────────────────────────────────
  {
    id:          "7UP-330ML-CAN",
    sku:         "7Up lon 330ml",
    brand:       "7Up",
    variant:     "Regular",
    format:      "can",
    sizeML:      330,
    visual: {
      primaryColor:   "#00A550",
      secondaryColor: "#FFFFFF",
      label:          "Lon XANH LÁ, logo '7up' trắng, chấm đỏ",
      distinguisher:  "Xanh lá sáng — dễ nhận ra, chấm đỏ nhỏ trên logo",
    },
    priceVND:    { min: 8000,  max: 12000  },
  },
  {
    id:          "7UP-390ML-BOT",
    sku:         "7Up chai 390ml",
    brand:       "7Up",
    variant:     "Regular",
    format:      "bottle",
    sizeML:      390,
    visual: {
      primaryColor:   "#00A550",
      secondaryColor: "#FFFFFF",
      label:          "Chai PET XANH LÁ, nhãn 7Up trắng, nắp xanh lá",
      shape:          "Chai thon 390ml, cùng form với Pepsi 390ml",
      distinguisher:  "Màu xanh lá toàn thân — không thể nhầm với Pepsi xanh dương",
    },
    priceVND:    { min: 10000, max: 14000  },
  },
  {
    id:          "7UP-1L-BOT",
    sku:         "7Up chai 1L",
    brand:       "7Up",
    variant:     "Regular",
    format:      "bottle",
    sizeML:      1000,
    visual: {
      primaryColor:   "#00A550",
      label:          "Chai PET xanh lá 1L, nhãn 7Up",
    },
    priceVND:    { min: 15000, max: 22000  },
  },
  {
    id:          "7UP-1.5L-BOT",
    sku:         "7Up chai 1.5L",
    brand:       "7Up",
    variant:     "Regular",
    format:      "bottle",
    sizeML:      1500,
    visual: {
      primaryColor:   "#00A550",
      label:          "Chai PET xanh lá lớn, nhãn 7Up trắng",
    },
    priceVND:    { min: 20000, max: 28000  },
  },

  // ── Mirinda (Suntory PepsiCo) ───────────────────────────────────────────────
  {
    id:          "MIRINDA-ORANGE-330ML-CAN",
    sku:         "Mirinda Cam lon 330ml",
    brand:       "Mirinda",
    variant:     "Orange / Cam",
    format:      "can",
    sizeML:      330,
    visual: {
      primaryColor:   "#FF6600",
      label:          "Lon CAM, logo Mirinda, hình trái cam",
      distinguisher:  "Cam rực rỡ — KHÔNG nhầm với Fanta cam (Coca-Cola)",
    },
    priceVND:    { min: 8000,  max: 12000  },
  },
  {
    id:          "MIRINDA-ORANGE-390ML-BOT",
    sku:         "Mirinda Cam chai 390ml",
    brand:       "Mirinda",
    variant:     "Orange / Cam",
    format:      "bottle",
    sizeML:      390,
    visual: {
      primaryColor:   "#FF6600",
      label:          "Chai PET CAM, nhãn Mirinda, hình trái cam, nắp cam",
      shape:          "Chai thon 390ml",
      distinguisher:  "Màu cam đặc trưng + logo Mirinda xoáy — khác Fanta (logo chữ đơn giản hơn)",
    },
    priceVND:    { min: 10000, max: 14000  },
  },
  {
    id:          "MIRINDA-STRAWBERRY-330ML-CAN",
    sku:         "Mirinda Dâu lon 330ml",
    brand:       "Mirinda",
    variant:     "Strawberry / Dâu",
    format:      "can",
    sizeML:      330,
    visual: {
      primaryColor:   "#FF1493",
      label:          "Lon HỒNG/ĐỎ, logo Mirinda, hình dâu tây",
      distinguisher:  "Hồng đậm — phân biệt với Mirinda Cam",
    },
    priceVND:    { min: 8000,  max: 12000  },
  },
  {
    id:          "MIRINDA-STRAWBERRY-390ML-BOT",
    sku:         "Mirinda Dâu chai 390ml",
    brand:       "Mirinda",
    variant:     "Strawberry / Dâu",
    format:      "bottle",
    sizeML:      390,
    visual: {
      primaryColor:   "#FF1493",
      label:          "Chai PET HỒNG, nhãn Mirinda dâu, nắp hồng",
      shape:          "Chai thon 390ml",
    },
    priceVND:    { min: 10000, max: 14000  },
  },

  // ── Sting (Suntory PepsiCo) ─────────────────────────────────────────────────
  {
    id:          "STING-RED-330ML-CAN",
    sku:         "Sting Dâu lon 330ml",
    brand:       "Sting",
    variant:     "Red / Strawberry",
    format:      "can",
    sizeML:      330,
    visual: {
      primaryColor:   "#CC0000",  // dark red
      secondaryColor: "#FFD700",
      label:          "Red/gold can, 'STING' lightning bolt logo",
      distinguisher:  "Dark red with gold lightning bolt — energy drink look",
    },
    priceVND:    { min: 9000,  max: 14000  },
  },
  {
    id:          "STING-GOLD-330ML-CAN",
    sku:         "Sting Gold lon 330ml",
    brand:       "Sting",
    variant:     "Gold",
    format:      "can",
    sizeML:      330,
    visual: {
      primaryColor:   "#FFD700",  // gold
      label:          "Gold can, Sting logo",
    },
    priceVND:    { min: 9000,  max: 14000  },
  },

  {
    id:          "STING-390ML-BOT",
    sku:         "Sting Dâu chai 390ml",
    brand:       "Sting",
    variant:     "Red / Strawberry",
    format:      "bottle",
    sizeML:      390,
    visual: {
      primaryColor:   "#CC0000",
      secondaryColor: "#FFD700",
      label:          "Chai PET ĐỎ ĐẬM, nhãn Sting với tia sét vàng, nắp đỏ",
      shape:          "Chai thon 390ml, cùng form các brand khác",
      distinguisher:  "Đỏ đậm + tia sét vàng — năng lượng cao, KHÔNG nhầm với Mirinda Dâu (hồng nhạt hơn)",
    },
    priceVND:    { min: 10000, max: 15000  },
  },

  // ── Aquafina ────────────────────────────────────────────────────────────────
  {
    id:          "AQUAFINA-355ML-CAN",
    sku:         "Aquafina lon 355ml",
    brand:       "Aquafina",
    variant:     "Still Water",
    format:      "can",
    sizeML:      355,
    visual: {
      primaryColor:   "#0099CC",
      label:          "Lon trong xanh, nhãn Aquafina, sóng núi",
      distinguisher:  "Lon TRONG — ít gặp, thường là chai",
    },
    priceVND:    { min: 6000,  max: 10000  },
  },
  {
    id:          "AQUAFINA-390ML-BOT",
    sku:         "Aquafina chai 390ml",
    brand:       "Aquafina",
    variant:     "Still Water",
    format:      "bottle",
    sizeML:      390,
    visual: {
      primaryColor:   "#0099CC",
      label:          "Chai TRONG SUỐT, nhãn xanh Aquafina, logo sóng núi",
      shape:          "Chai thon trong suốt 390ml",
      distinguisher:  "CHAI TRONG — nhìn thấy nước bên trong, nhãn xanh nhạt",
    },
    priceVND:    { min: 5000,  max: 8000   },
  },
  {
    id:          "AQUAFINA-500ML-BOT",
    sku:         "Aquafina chai 500ml",
    brand:       "Aquafina",
    variant:     "Still Water",
    format:      "bottle",
    sizeML:      500,
    visual: {
      primaryColor:   "#0099CC",
      label:          "Chai TRONG SUỐT lớn hơn, nhãn xanh Aquafina, logo sóng núi",
      distinguisher:  "Chai trong — nước tinh khiết, nhãn xanh nhạt nhất trong Pepsi family",
    },
    priceVND:    { min: 5000,  max: 8000   },
  },
];

// ── Visual differentiation guide (for AI training) ────────────────────────────
export const PEPSI_VISUAL_GUIDE = `
## Pepsi Family Visual Identification Guide

### By Color (most important visual cue):
- DEEP BLUE bottle/can → Pepsi Regular
- BLACK bottle/can     → Pepsi Max / Zero Sugar  ← COMMON CONFUSION POINT
- BRIGHT GREEN         → 7Up
- ORANGE               → Mirinda Cam
- RED/GOLD             → Sting energy drink
- TRANSPARENT/BLUE     → Aquafina water

### By Size on Shelf:
- Tiny (palm-sized)    → 250ml can
- Standard can         → 330ml (cylindrical, H~11cm)
- Short bottle ⭐      → 390ml (Vietnam phổ biến nhất — H~23cm, thon, có nắp)
- Medium bottle        → 500ml / 1L
- Large bottle         → 1.5L (most common shelf size)
- Family size          → 2L
- Multipack            → 2-6 units shrink-wrapped

### 390ml BOTTLE IDENTIFICATION (rất quan trọng tại VN):
Tất cả 390ml đều có hình dạng GIỐNG NHAU — phân biệt qua MÀU SẮC + NẮP:
| Brand      | Màu chai  | Màu nắp   | Nhãn đặc trưng              |
|------------|-----------|-----------|------------------------------|
| Pepsi Reg  | XANH DƯƠNG| Xanh dương| Globe đỏ/trắng/xanh         |
| Pepsi Max  | ĐEN       | ĐEN       | "MAX" chữ trắng/xanh        |
| Pepsi Twist| Xanh + vàng| Xanh     | Hình lát chanh vàng          |
| 7Up        | XANH LÁ   | Xanh lá   | Logo 7up trắng + chấm đỏ    |
| Mirinda Cam| CAM       | Cam       | Hình trái cam                |
| Mirinda Dâu| HỒNG      | Hồng      | Hình dâu tây                 |
| Sting      | ĐỎ ĐẬM    | Đỏ        | Tia sét VÀNG                 |
| Aquafina   | TRONG SUỐT| Xanh nhạt | Sóng núi, thấy nước bên trong|

### CRITICAL: Pepsi Regular vs Pepsi Max
- Regular: BRIGHT BLUE with red globe logo
- Max:     BLACK background with blue Pepsi globe
- At a distance: Max looks MUCH darker
- "Pepsi Max" or "Pepsi MAX ZERO" text on black label

### PACK AHORRO (multipack) indicators:
- Yellow banner/label saying "PACK AHORRO"
- Multiple bottles shrink-wrapped together
- Often has price tag showing per-unit price

### Common shelf mistakes to avoid:
- Black Pepsi Max ≠ Coca-Cola Zero (different logo)
- Mirinda orange ≠ Fanta (different brand, check logo)
- Sting ≠ Red Bull (Sting has lightning bolt logo)
`;

// ── Shelf positioning recommendations ─────────────────────────────────────────
export const PEPSI_PLANOGRAM = {
  eyeLevel:  ["Pepsi Regular 390ml", "Pepsi Max 390ml", "Pepsi Regular 1.5L"],
  topShelf:  ["Multipack 2L", "Pack Ahorro", "Pepsi Regular 2L"],
  midShelf:  ["7Up 390ml", "Mirinda Cam 390ml", "Pepsi Max 1.5L", "Sting 390ml"],
  bottom:    ["Aquafina 390ml", "Aquafina 500ml", "Pepsi 2L bulk"],
  endCap:    ["Promotional SKUs", "New variants", "Combo packs"],
  minFacing: {
    eyeLevel: 4,
    topShelf:  2,
    midShelf:  3,
    bottom:    2,
  },
  // 390ml specific rules
  rule390ml: "Chai 390ml phải luôn có ít nhất 3 facing ở eye-level hoặc mid-shelf. Không để 390ml ở top shelf (khó với tay).",
};
