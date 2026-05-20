// Brand Formation System — Train the agent on specific brand catalogs
// Supports multiple brands, each with visual guides + training examples

import { PEPSI_SKUS, PEPSI_VISUAL_GUIDE, PEPSI_PLANOGRAM, PEPSI_BRAND } from "./brands/pepsi";

export interface BrandFormation {
  brandId:      string;
  brandName:    string;
  company:      string;
  active:       boolean;
  skuCount:     number;
  visualGuide:  string;
  planogram:    object;
  addedAt:      number;
}

// Global brand formations store
const g = globalThis as typeof globalThis & { __brandFormations?: Map<string, BrandFormation> };
if (!g.__brandFormations) {
  g.__brandFormations = new Map();
  // Auto-register Pepsi on startup
  g.__brandFormations.set("pepsi", {
    brandId:     "pepsi",
    brandName:   PEPSI_BRAND.name,
    company:     PEPSI_BRAND.company,
    active:      true,
    skuCount:    PEPSI_SKUS.length,
    visualGuide: PEPSI_VISUAL_GUIDE,
    planogram:   PEPSI_PLANOGRAM,
    addedAt:     Date.now(),
  });
}

export function getActiveBrands(): BrandFormation[] {
  return [...g.__brandFormations!.values()].filter(b => b.active);
}

export function getBrandFormation(brandId: string): BrandFormation | null {
  return g.__brandFormations!.get(brandId) ?? null;
}

export function toggleBrand(brandId: string, active: boolean) {
  const f = g.__brandFormations!.get(brandId);
  if (f) g.__brandFormations!.set(brandId, { ...f, active });
}

// ── Build brand-specific prompt injection ─────────────────────────────────────
export function buildBrandKnowledgePrompt(): string {
  const active = getActiveBrands();
  if (active.length === 0) return "";

  let out = "\n## BRAND FORMATION — Specialized Recognition Training\n";
  out += "The following brands have detailed training data. Use this knowledge for accurate SKU identification:\n";

  for (const brand of active) {
    out += `\n### ${brand.brandName} (${brand.company}) — ${brand.skuCount} SKUs trained\n`;
    out += brand.visualGuide;
    out += `\n**Planogram standard:**\n`;
    const plan = brand.planogram as typeof PEPSI_PLANOGRAM;
    out += `- Eye-level (priority): ${plan.eyeLevel?.join(", ") ?? "—"}\n`;
    out += `- Min facings eye-level: ${plan.minFacing?.eyeLevel ?? 4}\n`;
  }

  // Add SKU list for active brand
  const pepsi = active.find(b => b.brandId === "pepsi");
  if (pepsi) {
    out += "\n### Pepsi Complete SKU List (identify these specifically):\n";
    out += PEPSI_SKUS.map(s =>
      `- ${s.sku} | ${s.visual.label} | ${s.visual.distinguisher ?? ""}`
    ).join("\n");
  }

  return out;
}

// ── Get SKU details by partial match ─────────────────────────────────────────
export function findPepsiSKU(description: string) {
  const lower = description.toLowerCase();
  return PEPSI_SKUS.filter(s =>
    s.sku.toLowerCase().includes(lower) ||
    s.variant.toLowerCase().includes(lower) ||
    s.visual.label.toLowerCase().includes(lower)
  );
}
