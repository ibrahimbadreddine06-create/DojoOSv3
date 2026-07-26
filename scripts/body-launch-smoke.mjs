import { chromium, devices } from "playwright";

const baseURL = process.env.BODY_SMOKE_BASE_URL ?? "http://127.0.0.1:5000";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const failures = [];

async function exercise(label, contextOptions, presentation = false) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await context.request.post(`${baseURL}/api/register`, {
    data: {
      username: `body-smoke-${label}-${runId}`,
      email: `body-smoke-${label}-${runId}@example.invalid`,
      password: "BodySmoke-Only-2026!",
      name: "Body Smoke",
    },
  });
  if (response.status() !== 201) {
    failures.push(`${label}: registration returned ${response.status()}`);
    await browser.close();
    return;
  }
  if (presentation) {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      window.sessionStorage.setItem("dojo-body-presentation-mode", "true");
      window.localStorage.setItem("dojo-body-setup-skipped", "true");
    });
  }

  for (const route of [
    "/body",
    "/body/activity",
    "/body/nutrition",
    "/body/sleep",
    "/body/looks",
    "/body/detail/activity.steps",
    "/body/detail/hygiene.symptoms",
  ]) {
    const navigation = await page.goto(`${baseURL}${route}`, {
      // Every umbrella may keep a real polling query active. Waiting for
      // network-idle would incorrectly treat that healthy behavior as a hang.
      waitUntil: "domcontentloaded",
    });
    if (!navigation?.ok()) {
      failures.push(`${label} ${route}: navigation returned ${navigation?.status()}`);
      continue;
    }
    if (page.url().includes("/auth")) {
      failures.push(`${label} ${route}: unexpectedly redirected to auth`);
    }
    await page.waitForTimeout(750);
    const bodyText = await page.locator("body").innerText();
    if (!bodyText.trim()) failures.push(`${label} ${route}: rendered an empty page`);
    if (/Something went wrong|Unhandled Runtime Error/i.test(bodyText)) {
      failures.push(`${label} ${route}: rendered an application error`);
    }
    if (route.startsWith("/body/detail/") && !/Showing retained records only|Canonical storage is temporarily unavailable/i.test(bodyText)) {
      failures.push(`${label} ${route}: detail provenance state is missing`);
    }
    if (presentation && !route.startsWith("/body/detail/") && !/presentation mode/i.test(bodyText)) {
      failures.push(`${label} ${route}: presentation marker is missing`);
    }
  }

  const relevantErrors = consoleErrors.filter(
    (message) =>
      !/favicon|ERR_ABORTED|ResizeObserver loop/i.test(message),
  );
  if (relevantErrors.length) {
    failures.push(`${label}: browser errors: ${relevantErrors.slice(0, 5).join(" | ")}`);
  }
  await browser.close();
}

await exercise("desktop", { viewport: { width: 1440, height: 1000 } });
await exercise("mobile", {
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 },
});
await exercise("presentation-desktop", { viewport: { width: 1440, height: 1000 } }, true);
await exercise("presentation-mobile", {
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 },
}, true);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Body authenticated desktop/mobile smoke passed.");
