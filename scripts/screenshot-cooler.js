const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto("http://localhost:3000/layout-editor", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(4000);

  async function jsClick(titlePart) {
    await page.evaluate((t) => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.title && b.title.includes(t));
      if (btn) btn.click();
    }, titlePart);
    await page.waitForTimeout(700);
  }

  // Add a row of 3 food coolers + 1 Pepsi + 1 drink cooler
  await jsClick("Tủ mát thực phẩm");
  await jsClick("Tủ mát thực phẩm");
  await jsClick("Tủ mát thực phẩm");
  await jsClick("Tủ nước Pepsi");
  await jsClick("Tủ mát đồ uống");
  await page.waitForTimeout(1500);

  const canvas = await page.$("canvas");
  const box = await canvas.boundingBox();
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;

  // Zoom in moderately (15 steps — not too close)
  await page.evaluate(({ cx, cy }) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    for (let i = 0; i < 15; i++) {
      canvas.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true, cancelable: true,
        clientX: cx, clientY: cy,
        deltaY: -500, deltaMode: 0,
      }));
    }
  }, { cx, cy });
  await page.waitForTimeout(1000);

  // Orbit: slightly right for 3/4 front-left view
  await page.mouse.move(cx, cy);
  await page.mouse.down({ button: "left" });
  for (let i = 0; i < 12; i++) {
    await page.mouse.move(cx + i * 7, cy + i * 2, { steps: 1 });
  }
  await page.mouse.up({ button: "left" });
  await page.waitForTimeout(1200);

  // Click empty space to deselect tooltip
  await page.mouse.click(box.x + box.width * 0.85, box.y + box.height * 0.15);
  await page.waitForTimeout(600);

  const outPath = path.join(__dirname, "../screenshots/cooler-3d.png");
  await page.screenshot({ path: outPath, fullPage: false });
  console.log("Screenshot saved:", outPath);
  await browser.close();
})();
