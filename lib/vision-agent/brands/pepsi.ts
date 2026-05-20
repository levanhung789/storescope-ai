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
      label:          "Blue PET bottle, Pepsi globe label, blue cap",
      shape:          "contour PET bottle 390ml",
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
      primaryColor:   "#00A550",  // green
      secondaryColor: "#FFFFFF",
      label:          "Green can, '7up' logo in white, red dot",
      distinguisher:  "Bright green — easy to spot on shelf",
    },
    priceVND:    { min: 8000,  max: 12000  },
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
      label:          "Green PET bottle, white 7up logo",
    },
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
      primaryColor:   "#FF6600",  // orange
      label:          "Orange can, Mirinda logo, orange fruit imagery",
      distinguisher:  "Bright orange — distinct from all other Pepsi brands",
    },
    priceVND:    { min: 8000,  max: 12000  },
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

  // ── Aquafina ────────────────────────────────────────────────────────────────
  {
    id:          "AQUAFINA-500ML-BOT",
    sku:         "Aquafina nước tinh khiết 500ml",
    brand:       "Aquafina",
    variant:     "Still Water",
    format:      "bottle",
    sizeML:      500,
    visual: {
      primaryColor:   "#0099CC",  // light blue
      label:          "Clear bottle, blue Aquafina label, mountain wave logo",
      distinguisher:  "Transparent bottle — water, no color",
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
- Standard can         → 330ml
- Short bottle         → 390ml (Vietnam common)
- Medium bottle        → 500ml / 1L
- Large bottle         → 1.5L (most common shelf size)
- Family size          → 2L
- Multipack            → 2-6 units shrink-wrapped

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
  eyeLevel:  ["Pepsi Regular 1.5L", "Pepsi Max 1.5L"],  // highest traffic
  topShelf:  ["Multipack 2L", "Pack Ahorro"],            // bulk purchases
  midShelf:  ["Pepsi 390ml", "Pepsi Max 330ml can"],
  bottom:    ["Pepsi 2L", "Aquafina bulk"],
  endCap:    ["Promotional SKUs", "New variants"],
  minFacing: { eyeLevel: 4, topShelf: 2, midShelf: 3, bottom: 2 },
};
