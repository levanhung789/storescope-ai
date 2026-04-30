/**
 * Upload product images from public/companies/ to Roboflow
 * Usage: node scripts/upload-to-roboflow.js <project-id>
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");

const API_KEY   = "QH9U94r31RusAz0TaO3O";
const PROJECT   = process.argv[2] || "fmcg-project";
const ROOT      = path.join(__dirname, "../public/companies");
const IMG_EXTS  = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DELAY_MS  = 250; // ~4 images/sec, safely under rate limit

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

function getSplit(index, total) {
  const pct = index / total;
  if (pct < 0.70) return "train";
  if (pct < 0.85) return "valid";
  return "test";
}

async function uploadImage(filePath, filename, split) {
  return new Promise((resolve) => {
    const base64 = fs.readFileSync(filePath).toString("base64");
    const qs = new URLSearchParams({
      api_key: API_KEY,
      name: filename,
      split,
    }).toString();

    const options = {
      hostname: "api.roboflow.com",
      path: `/dataset/${PROJECT}/upload?${qs}`,
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve({ error: body.slice(0, 80) }); }
      });
    });

    req.on("error", (e) => resolve({ error: e.message }));
    req.setTimeout(20000, () => { req.destroy(); resolve({ error: "timeout" }); });
    req.write(base64);
    req.end();
  });
}

async function main() {
  console.log(`\n🚀 Roboflow Uploader — FMCG Project`);
  console.log(`   Project : ${PROJECT}`);
  console.log(`   Source  : ${ROOT}\n`);

  const images = getAllImages(ROOT);
  console.log(`📦 Found ${images.length} images\n`);

  if (!images.length) { console.log("❌ No images found."); return; }

  let success = 0, failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < images.length; i++) {
    const imgPath  = images[i];
    const filename = path.basename(imgPath);
    const split    = getSplit(i, images.length);
    const pct      = Math.round(((i + 1) / images.length) * 100);
    const elapsed  = Math.round((Date.now() - startTime) / 1000);
    const eta      = i > 0 ? Math.round((elapsed / i) * (images.length - i)) : "?";

    process.stdout.write(`[${String(pct).padStart(3)}%] ${i+1}/${images.length} | ${split.padEnd(5)} | ETA ${eta}s | ${filename.slice(0,35)}... `);

    const result = await uploadImage(imgPath, filename, split);

    if (result.success || result.id) {
      success++;
      process.stdout.write("✓\n");
    } else {
      failed++;
      process.stdout.write(`✗ ${result.error || JSON.stringify(result).slice(0,50)}\n`);
    }

    await sleep(DELAY_MS);
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n✅ Done in ${elapsed}s: ${success} uploaded, ${failed} failed`);
  console.log(`\n→ View: https://app.roboflow.com/levanhungs-workspace/${PROJECT}`);
  console.log(`→ Next: Label images → Train → Copy version number\n`);
}

main().catch(console.error);
