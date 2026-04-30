/**
 * Auto-annotate FMCG images on Roboflow
 * Strategy: catalog images = 1 product per image → full-image bounding box
 * Format: YOLOv8 (class_id cx cy w h normalized)
 *
 * Usage: node scripts/annotate-roboflow.js
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");

const API_KEY   = "QH9U94r31RusAz0TaO3O";
const PROJECT   = "fmcg-project";
const ROOT      = path.join(__dirname, "../public/companies");
const IMG_EXTS  = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DELAY_MS  = 350;

// ── Brand classes from folder structure ────────────────────────────────────────
const COMPANY_CLASS_MAP = {
  "ajinomoto":       "ajinomoto",
  "masan":           "masan",
  "nestle":          "nestle_maggi",
  "unilever":        "knorr_unilever",
  "cholimex":        "cholimex",
  "calofic":         "calofic",
  "tuong-an":        "tuong_an",
  "vinamilk":        "vinamilk",
  "th-milk":         "th_true_milk",
  "suntory-pepsico": "pepsi",
  "coca-cola":       "coca_cola",
  "heineken":        "heineken",
  "sabeco":          "sabeco",
  "habeco":          "habeco",
  "acecook":         "acecook",
  "vifon":           "vifon",
  "moc-chau":        "moc_chau",
  "frieslandcampina":"frieslandcampina",
};

const CLASS_LIST = [...new Set(Object.values(COMPANY_CLASS_MAP))];
const classIndex = Object.fromEntries(CLASS_LIST.map((c, i) => [c, i]));

function getClass(filePath) {
  const lower = filePath.toLowerCase().replace(/\\/g, "/");
  for (const [key, cls] of Object.entries(COMPANY_CLASS_MAP)) {
    if (lower.includes(key)) return cls;
  }
  // Fallback: try to extract from path
  const parts = lower.split("/");
  const companyIdx = parts.findIndex(p => p.startsWith("cong-ty") || p.startsWith("tap-doan") || p.startsWith("xi-nghiep"));
  if (companyIdx >= 0) {
    const company = parts[companyIdx];
    for (const [key, cls] of Object.entries(COMPANY_CLASS_MAP)) {
      if (company.includes(key)) return cls;
    }
  }
  return "product"; // fallback class
}

function getAllImages(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllImages(full));
    else if (IMG_EXTS.has(path.extname(entry.name).toLowerCase())) results.push(full);
  }
  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function uploadWithAnnotation(imgPath, className) {
  return new Promise((resolve) => {
    const base64    = fs.readFileSync(imgPath).toString("base64");
    const filename  = `${Date.now()}-${Math.random().toString(36).slice(2)}-${path.basename(imgPath)}`;
    const classId   = classIndex[className] ?? classIndex["product"] ?? 0;

    // YOLO format: class_id cx cy width height (all 0-1, full image box)
    const yoloAnnotation = `${classId} 0.5 0.5 1.0 1.0`;
    const base64Annot    = Buffer.from(yoloAnnotation).toString("base64");

    const qs = new URLSearchParams({
      api_key:    API_KEY,
      name:       filename,
      split:      "train",
      annotation: base64Annot,
    }).toString();

    const options = {
      hostname: "api.roboflow.com",
      path:     `/dataset/${PROJECT}/upload?${qs}`,
      method:   "POST",
      headers:  { "Content-Type": "application/x-www-form-urlencoded" },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        try { resolve({ ok: true, ...JSON.parse(body) }); }
        catch { resolve({ ok: false, raw: body.slice(0, 80) }); }
      });
    });
    req.on("error", e => resolve({ ok: false, error: e.message }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(base64);
    req.end();
  });
}

async function main() {
  console.log("\n🏷️  FMCG Auto-Annotator for Roboflow");
  console.log(`   Project  : ${PROJECT}`);
  console.log(`   Classes  : ${CLASS_LIST.length} (${CLASS_LIST.slice(0, 5).join(", ")}...)\n`);

  const images = getAllImages(ROOT);
  console.log(`📦 Found ${images.length} images\n`);

  if (!images.length) { console.log("❌ No images."); return; }

  let success = 0, failed = 0, skipped = 0;
  const start = Date.now();

  for (let i = 0; i < images.length; i++) {
    const img       = images[i];
    const cls       = getClass(img);
    const pct       = Math.round(((i + 1) / images.length) * 100);
    const elapsed   = Math.round((Date.now() - start) / 1000);
    const eta       = i > 0 ? Math.round((elapsed / i) * (images.length - i)) : "?";

    process.stdout.write(`[${String(pct).padStart(3)}%] ${i + 1}/${images.length} | ${cls.padEnd(20)} | ETA ${eta}s | ${path.basename(img).slice(0, 30)}... `);

    const res = await uploadWithAnnotation(img, cls);

    if (res.duplicate) {
      skipped++;
      process.stdout.write(`⟳ duplicate\n`);
    } else if (res.success || res.id) {
      success++;
      process.stdout.write(`✓\n`);
    } else {
      failed++;
      process.stdout.write(`✗ ${res.error || res.raw || JSON.stringify(res).slice(0, 40)}\n`);
    }

    await sleep(DELAY_MS);
  }

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n✅ Done in ${elapsed}s`);
  console.log(`   New: ${success} | Duplicate: ${skipped} | Failed: ${failed}`);
  console.log(`\n📋 Classes (${CLASS_LIST.length}):\n   ${CLASS_LIST.join(", ")}`);
  console.log(`\n→ Next: https://app.roboflow.com/levanhungs-workspace/${PROJECT}`);
  console.log(`  Generate dataset → Train → Get version number`);
}

main().catch(console.error);
