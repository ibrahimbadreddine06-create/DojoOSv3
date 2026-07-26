import { chromium, devices } from "playwright";

const baseURL = process.env.DASHBOARD_SMOKE_BASE_URL ?? "http://127.0.0.1:5000";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const failures = [];

async function exercise(label, contextOptions, expectedColumns) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  const response = await context.request.post(`${baseURL}/api/register`, {
    data: {
      username: `dashboard-smoke-${label}-${runId}`,
      email: `dashboard-smoke-${label}-${runId}@example.invalid`,
      password: "DashboardSmoke-Only-2026!",
      name: "Dashboard Smoke",
    },
  });
  if (response.status() !== 201) {
    failures.push(`${label}: registration returned ${response.status()}`);
    await browser.close();
    return;
  }

  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("dojo_onboarding_completed", "true"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);

  const widgets = page.locator("[data-widget-id][role=link]");
  if (await widgets.count() !== 7) {
    failures.push(`${label}: expected 7 installed module umbrellas`);
  }
  const columnCount = await page.locator(".dojo-native-grid").evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(" ").length,
  );
  if (columnCount !== expectedColumns) {
    failures.push(`${label}: expected ${expectedColumns} columns, received ${columnCount}`);
  }

  await page.getByRole("button", { name: "Customize" }).click();
  if (await page.locator(".dojo-available-grid > *").count() !== 7) {
    failures.push(`${label}: available-widget drawer does not expose all umbrellas`);
  }
  const handle = page.locator(".dojo-resize-handle").first();
  const handleBox = await handle.boundingBox();
  if (handleBox) {
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(80);
    const targets = await page.locator(".dojo-resize-destination").allTextContents();
    if (!["1×1", "2×1", "1×2", "2×2"].every((size) => targets.includes(size))) {
      failures.push(`${label}: resize destinations are incomplete`);
    }
    await page.mouse.up();
  } else {
    failures.push(`${label}: resize handle is not visible`);
  }

  await page.getByRole("button", { name: "Done" }).click();
  await widgets.first().focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/planner$/);

  if (browserErrors.length) {
    failures.push(`${label}: ${browserErrors.join(" | ")}`);
  }
  await browser.close();
}

await exercise("desktop", { viewport: { width: 1440, height: 1000 } }, 4);
await exercise("mobile", {
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 },
}, 2);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Dashboard ModuleGrid desktop/mobile smoke passed.");
