"use strict";
const puppeteer = require("puppeteer-core");
const { mkdirSync, existsSync } = require("fs");
const { join } = require("path");

const CHROME = "C:/Users/peigu/.cache/puppeteer/chrome/win64-147.0.7727.57/chrome-win64/chrome.exe";
const DIR = join(__dirname, "screenshots");

// Pages to capture when running in multi-page mode (no URL arg)
const PAGES = [
  { path: "/",       label: "landing" },
  { path: "/studio", label: "studio"  },
];

async function nextFree(label) {
  let n = 1;
  while (existsSync(join(DIR, `screenshot-${n}-${label}.png`))) n++;
  return join(DIR, `screenshot-${n}-${label}.png`);
}

async function shot(page, url, label) {
  console.log(`  → ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
    const out = await nextFree(label);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`    saved: screenshots/${require("path").basename(out)}`);
    return out;
  } catch (err) {
    console.warn(`    skipped (${err.message.split("\n")[0]})`);
    return null;
  }
}

(async () => {
  if (!existsSync(CHROME)) {
    console.error("Chrome not found at expected path:", CHROME);
    console.error("Update the CHROME constant in screenshot.js.");
    process.exit(1);
  }

  mkdirSync(DIR, { recursive: true });

  const urlArg   = process.argv[2];   // e.g. http://localhost:3000/studio
  const labelArg = process.argv[3];   // e.g. after-fix

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  if (urlArg) {
    // Single-URL mode: node screenshot.js <url> [label]
    const label = labelArg || new URL(urlArg).pathname.replace(/\//g, "_").replace(/^_/, "") || "home";
    await shot(page, urlArg, label);
  } else {
    // Multi-page mode: snapshot all StoryLens pages
    const base = "http://localhost:3000";
    console.log(`StoryLens snapshot — ${new Date().toLocaleTimeString()}`);
    for (const { path, label } of PAGES) {
      await shot(page, base + path, label);
    }
  }

  await browser.close();
})();
