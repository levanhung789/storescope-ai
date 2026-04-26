import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "public", "companies");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// Sector display names
const SECTOR_LABELS: Record<string, string> = {
  "dau-an-nuoc-cham-gia-vi": "Condiments, Oil & Seasoning",
  "dairy":                    "Dairy & Dairy Products",
  "dry-instant":              "Dry Food & Instant Meals",
  "non-alcoholic":            "Non-Alcoholic Beverages",
  "alcoholic":                "Alcoholic Beverages",
  "fresh-frozen":             "Fresh & Frozen Food",
  "nutrition-confectionery":  "Nutrition & Confectionery",
  "cafe-chain":               "Café Chains",
  "restaurant-chain":         "Restaurant Chains",
};

function safeName(raw: string): string {
  return raw.replace(/\/$/, "").trim();
}

function getImages(dir: string): string[] {
  try {
    return fs.readdirSync(dir)
      .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .slice(0, 6); // max 6 images per product
  } catch { return []; }
}

function buildCatalog() {
  const sectors: {
    sectorKey: string;
    sectorLabel: string;
    sectorFolder: string;
    companies: {
      companyKey: string;
      companyName: string;
      companyFolder: string;
      products: {
        productName: string;
        productFolder: string;
        images: string[];
      }[];
    }[];
  }[] = [];

  let sectorFolders: string[];
  try {
    sectorFolders = fs.readdirSync(ROOT).filter(f =>
      fs.statSync(path.join(ROOT, f)).isDirectory()
    );
  } catch { return []; }

  for (const sectorFolder of sectorFolders) {
    const sectorPath = path.join(ROOT, sectorFolder);
    const sectorLabel = SECTOR_LABELS[sectorFolder] || sectorFolder;
    const sectorKey = sectorFolder;

    let companyFolders: string[];
    try {
      companyFolders = fs.readdirSync(sectorPath).filter(f =>
        fs.statSync(path.join(sectorPath, f)).isDirectory()
      );
    } catch { continue; }

    const companies = [];
    for (const companyFolder of companyFolders) {
      const companyPath = path.join(sectorPath, companyFolder);

      let productFolders: string[];
      try {
        productFolders = fs.readdirSync(companyPath).filter(f =>
          fs.statSync(path.join(companyPath, f)).isDirectory()
        );
      } catch { continue; }

      const products = [];
      for (const productFolder of productFolders) {
        const productPath = path.join(companyPath, productFolder);
        const images = getImages(productPath);
        if (images.length > 0) {
          products.push({
            productName: safeName(productFolder),
            productFolder: safeName(productFolder),
            images,
          });
        }
      }

      if (products.length > 0) {
        // Prettify company name from folder name
        const companyName = companyFolder
          .replace(/-/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase())
          .replace(/Cong Ty /gi, "")
          .replace(/Co Phan /gi, "")
          .replace(/Tnhh /gi, "")
          .trim();

        companies.push({
          companyKey: companyFolder,
          companyName,
          companyFolder,
          products,
        });
      }
    }

    if (companies.length > 0) {
      sectors.push({ sectorKey, sectorLabel, sectorFolder, companies });
    }
  }

  return sectors;
}

export async function GET() {
  const catalog = buildCatalog();
  return NextResponse.json(catalog, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
