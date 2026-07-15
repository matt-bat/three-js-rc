import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";

let baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173";
const outputDir = new URL("../docs/screenshots/", import.meta.url);
let viteServer;

await mkdir(outputDir, { recursive: true });

async function canReachServer() {
  try {
    const response = await fetch(baseURL);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (await canReachServer()) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for screenshot server at ${baseURL}`);
}

if (!process.env.PLAYWRIGHT_BASE_URL && !(await canReachServer())) {
  viteServer = await createServer({
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true
    }
  });
  await viteServer.listen();
  baseURL = viteServer.resolvedUrls?.local?.[0]?.replace(/\/$/, "") ?? baseURL;
}

const browser = await chromium.launch();
const targets = [
  {
    name: "desktop",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: []
  },
  {
    name: "desktop-rain",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Weather"]
  },
  {
    name: "desktop-snow",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Weather", "Weather"]
  },
  {
    name: "desktop-wind",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Weather", "Weather", "Weather"]
  },
  {
    name: "desktop-cinematic",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Graphics"]
  },
  {
    name: "desktop-crawl",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Mode"]
  },
  {
    name: "desktop-armor",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Mode", "Mode", "Fire"],
    settleMs: 2100
  },
  {
    name: "desktop-truck",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Mode", "Mode", "Mode"]
  },
  {
    name: "desktop-drone",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Mode", "Mode", "Mode", "Mode"]
  },
  {
    name: "desktop-helicopter",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Mode", "Mode", "Mode", "Mode", "Mode"]
  },
  {
    name: "desktop-garage",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Garage"]
  },
  {
    name: "desktop-controls",
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    actions: ["Controls", "Transmitter", "Simulate"]
  },
  {
    name: "mobile",
    context: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    },
    actions: []
  }
];

try {
  for (const target of targets) {
    const context = await browser.newContext(target.context);
    const page = await context.newPage();
    await page.goto(`${baseURL}/?shot=${target.name}-${Date.now()}`, { waitUntil: "networkidle" });
    for (const action of target.actions) {
      await page.getByRole("button", { name: action }).click();
    }
    await page.waitForTimeout(target.settleMs ?? 850);
    await page.screenshot({
      path: new URL(`${target.name}.png`, outputDir).pathname,
      fullPage: true
    });
    await context.close();
  }
} finally {
  await browser.close();
  await viteServer?.close();
}
