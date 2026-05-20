import { NextRequest, NextResponse } from "next/server";
import { getActiveBrands, getBrandFormation, toggleBrand } from "../../../../lib/vision-agent/brandTraining";
import { PEPSI_SKUS } from "../../../../lib/vision-agent/brands/pepsi";

// GET — list all brand formations
export async function GET() {
  const brands = getActiveBrands();
  return NextResponse.json({
    brands: brands.map(b => ({
      brandId:   b.brandId,
      brandName: b.brandName,
      company:   b.company,
      active:    b.active,
      skuCount:  b.skuCount,
      addedAt:   b.addedAt,
    })),
    skus: {
      pepsi: PEPSI_SKUS.map(s => ({
        id:       s.id,
        sku:      s.sku,
        variant:  s.variant,
        format:   s.format,
        sizeML:   s.sizeML,
        color:    s.visual.primaryColor,
        label:    s.visual.label,
        distinguisher: (s.visual as {distinguisher?:string}).distinguisher,
        priceVND: (s as {priceVND?:{min:number;max:number}}).priceVND,
        priceEUR: (s as {priceEUR?:{min:number;max:number}}).priceEUR,
      })),
    },
  });
}

// PATCH — toggle brand active/inactive
export async function PATCH(req: NextRequest) {
  const { brandId, active } = await req.json() as { brandId: string; active: boolean };
  const brand = getBrandFormation(brandId);
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  toggleBrand(brandId, active);
  return NextResponse.json({ success: true, brandId, active });
}
