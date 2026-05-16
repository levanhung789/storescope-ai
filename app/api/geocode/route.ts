/**
 * GET /api/geocode?q=address&limit=6
 * Server-side geocoding proxy dung Nominatim (OSM) — tranh CORS tu browser
 * Thu nhieu cach don gian hoa dia chi neu khong tim duoc
 */
import { NextRequest, NextResponse } from "next/server";

const NOM = "https://nominatim.openstreetmap.org/search";
const HEADERS = {
  "User-Agent":       "StoreScopeAI/1.0 (storescope-ai.vercel.app)",
  "Accept-Language":  "vi,en;q=0.9",
};

async function search(q: string, limit: string) {
  const url = `${NOM}?q=${encodeURIComponent(q)}&format=json&limit=${limit}&addressdetails=0`;
  const res  = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000) });
  return res.json() as Promise<Array<{ lat: string; lon: string; display_name: string; place_id: number }>>;
}

// Thu dan cac cach simplify dia chi
function simplifyVariants(q: string): string[] {
  const variants: string[] = [];

  // Bo so nha o dau (16/1m, → )
  const noHouseNumber = q.replace(/^[\d/]+\w*[,.\s]+/, "").trim();
  if (noHouseNumber && noHouseNumber !== q) variants.push(noHouseNumber);

  // Bo phan dau tien truoc dau phay
  const afterFirstComma = q.split(",").slice(1).join(",").trim();
  if (afterFirstComma && afterFirstComma !== q) variants.push(afterFirstComma);

  // Chi lay 2 phan sau cung (quan + thanh pho)
  const parts = q.split(",");
  if (parts.length >= 3) variants.push(parts.slice(-3).join(",").trim());
  if (parts.length >= 2) variants.push(parts.slice(-2).join(",").trim());

  return [...new Set(variants)].filter(v => v.length > 4);
}

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q")?.trim();
  const limit = req.nextUrl.searchParams.get("limit") ?? "1";
  if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });

  try {
    // Thu voi dia chi goc truoc
    let data = await search(q, limit);

    // Neu khong tim thay va la single result → thu simplify
    if (!data.length && limit === "1") {
      for (const variant of simplifyVariants(q)) {
        data = await search(variant, limit);
        if (data.length) break;
      }
    }

    if (limit === "1") {
      if (!data.length) {
        return NextResponse.json(
          { error: "Address not found. Select from dropdown suggestions or navigate map manually." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        lat:          parseFloat(data[0].lat),
        lon:          parseFloat(data[0].lon),
        display_name: data[0].display_name,
      });
    }

    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
