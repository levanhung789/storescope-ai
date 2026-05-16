/**
 * GET /api/building?address=...&area=...
 *
 * Lấy kích thước tòa nhà từ địa chỉ:
 * 1. Geocode địa chỉ → lat/lng (Nominatim/OSM)
 * 2. Tìm polygon tòa nhà (Overpass API)
 * 3. Tính W×D từ bounding box
 * 4. Nếu không tìm thấy → dùng area (m²) tạo hình vuông (√area × √area)
 */
import { NextRequest, NextResponse } from "next/server";

// ── Haversine distance (m) ────────────────────────────────────────────────
function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R  = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a  = Math.sin(dLat / 2) ** 2 +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Bounding box → W×D (meters) ───────────────────────────────────────────
function bboxToDimensions(lats: number[], lons: number[]) {
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const midLat = (minLat + maxLat) / 2;
  const width  = Math.round(haversineDist(midLat, minLon, midLat, maxLon));
  const depth  = Math.round(haversineDist(minLat, minLon, maxLat, minLon));
  return { width: Math.max(width, 3), depth: Math.max(depth, 3) };
}

// ── Square fallback from area (m²) ────────────────────────────────────────
function squareFromArea(areaSqm: number) {
  const side = Math.round(Math.sqrt(areaSqm));
  return { width: side, depth: side };
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim();
  const areaStr = req.nextUrl.searchParams.get("area");

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  try {
    // ── Step 1: Geocode ───────────────────────────────────────────────────
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const geoRes = await fetch(geoUrl, {
      headers: { "User-Agent": "StoreScopeAI/1.0 (storescope-ai.vercel.app)" },
      signal: AbortSignal.timeout(6000),
    });
    const geoData = await geoRes.json() as Array<{
      lat: string; lon: string; display_name: string;
      osm_id?: number; osm_type?: string;
    }>;

    if (!geoData.length) {
      // Không tìm thấy địa chỉ → fallback square nếu có area
      if (areaStr) {
        const area = Number(areaStr);
        if (area > 0) {
          const dims = squareFromArea(area);
          return NextResponse.json({
            found:    false,
            source:   "square_fallback",
            address,
            lat:      null, lon: null,
            width:    dims.width,
            depth:    dims.depth,
            area:     area,
            note:     `Address not found. Created ${dims.width}×${dims.depth}m square from ${area}m² area.`,
          });
        }
      }
      return NextResponse.json({
        found:  false,
        source: "not_found",
        error:  "Address not found. Try a more specific address or provide area (m²).",
      }, { status: 404 });
    }

    const place = geoData[0];
    const lat   = parseFloat(place.lat);
    const lon   = parseFloat(place.lon);

    // ── Step 2: Query Overpass for building polygon ───────────────────────
    const query = `
      [out:json][timeout:8];
      (
        way["building"](around:30,${lat},${lon});
        relation["building"](around:30,${lat},${lon});
      );
      out body geom;
    `;
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    let building: { width: number; depth: number; area?: number } | null = null;

    try {
      const ovRes  = await fetch(overpassUrl, {
        method:  "POST",
        body:    query,
        headers: { "Content-Type": "text/plain" },
        signal: AbortSignal.timeout(8000),
      });
      const ovData = await ovRes.json() as {
        elements: Array<{
          type: string;
          geometry?: Array<{ lat: number; lon: number }>;
          tags?: Record<string, string>;
        }>;
      };

      if (ovData.elements?.length) {
        const el = ovData.elements[0];
        if (el.geometry?.length) {
          const lats = el.geometry.map(p => p.lat);
          const lons = el.geometry.map(p => p.lon);
          const dims = bboxToDimensions(lats, lons);
          building = { ...dims, area: dims.width * dims.depth };
        }
      }
    } catch { /* Overpass failed → fallback */ }

    // ── Step 3: Fallback to square ────────────────────────────────────────
    if (!building) {
      const area = areaStr ? Number(areaStr) : 100; // default 100m²
      const dims = squareFromArea(area);
      return NextResponse.json({
        found:       true,
        source:      "square_fallback",
        address:     place.display_name,
        lat, lon,
        width:       dims.width,
        depth:       dims.depth,
        area,
        note:        `Building polygon not found in OpenStreetMap. Created ${dims.width}×${dims.depth}m square from ${area}m².`,
      });
    }

    // ── Step 4: Return real building dimensions ───────────────────────────
    return NextResponse.json({
      found:       true,
      source:      "osm_building",
      address:     place.display_name,
      lat, lon,
      width:       building.width,
      depth:       building.depth,
      area:        building.area,
      note:        `Found building polygon in OpenStreetMap: ${building.width}×${building.depth}m`,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
