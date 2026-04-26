const { chromium } = require("playwright");
const path = require("path");

async function takePageshotScrolled(page, outPath) {
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Inject CSS to disable transitions for screenshot accuracy
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        animation-delay: 0ms !important;
        transition-delay: 0ms !important;
      }
    `,
  });

  // Scroll in small increments to trigger ALL IntersectionObservers
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const step = 200;
  for (let y = 0; y <= pageHeight; y += step) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(400);

  // Scroll back to top for hero shot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  await page.screenshot({ path: outPath, fullPage: true });
}

async function main() {
  const browser = await chromium.launch();

  // Desktop 1440
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await takePageshotScrolled(
      page,
      path.join(__dirname, "../wedsizenet/screenshot-desktop.png")
    );
    console.log("✓ Desktop 1440 saved");
    await page.close();
  }

  // Mobile 390
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await takePageshotScrolled(
      page,
      path.join(__dirname, "../wedsizenet/screenshot-mobile.png")
    );
    console.log("✓ Mobile 390 saved");
    await page.close();
  }

  await browser.close();
  console.log("Done.");
}

main().catch(console.error);
