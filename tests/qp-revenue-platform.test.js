import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const baseURL = process.env.QP_PREVIEW_URL || "http://127.0.0.1:4173";
let browser;
let server;
let serverLog = "";

before(async () => {
  if (!process.env.QP_PREVIEW_URL) {
    server = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    server.stdout.on("data", chunk => { serverLog += chunk.toString(); });
    server.stderr.on("data", chunk => { serverLog += chunk.toString(); });
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (server.exitCode !== null) throw new Error("Vite preview exited early. " + serverLog);
      try {
        const response = await fetch(baseURL + "/qp-revenue-platform.html");
        if (response.ok) { ready = true; break; }
      } catch {}
      await delay(500);
    }
    assert.ok(ready, "Vite preview did not become ready. " + serverLog);
  }
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise(resolve => server.once("exit", resolve));
  }
});

test("prototype loads with demo-mode disclosure and core navigation", async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto(baseURL + "/qp-revenue-platform.html");
  assert.equal(response?.status(), 200);
  await assert.doesNotReject(() => page.getByText("Demo mode:", { exact: false }).waitFor());
  await page.getByRole("button", { name: /Leads/ }).click();
  await page.getByRole("heading", { name: "Lead workspace" }).waitFor();
  await page.getByRole("button", { name: /Campaigns/ }).click();
  await page.getByRole("heading", { name: "Campaign studio" }).waitFor();
  await page.getByRole("button", { name: /Automations/ }).click();
  await page.getByRole("heading", { name: "Automation lab" }).waitFor();
  await page.getByRole("button", { name: /AI Growth/ }).click();
  await page.getByRole("heading", { name: "AI growth planner" }).waitFor();
  assert.deepEqual(errors, []);
  await page.close();
});

test("lead form adds escaped text safely and updates demo count", async () => {
  const page = await browser.newPage();
  await page.goto(baseURL + "/qp-revenue-platform.html");
  await page.getByRole("button", { name: /Leads/ }).click();
  await page.getByLabel("New lead name").fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "＋ Add demo lead" }).click();
  await page.getByText("<img src=x onerror=alert(1)>", { exact: true }).waitFor();
  assert.equal(await page.locator("#leadList img").count(), 0);
  assert.equal(await page.locator("#leadMetric").textContent(), "127");
  await page.close();
});

test("goal planner produces a local draft without external calls", async () => {
  const page = await browser.newPage();
  const requests = [];
  page.on("request", request => {
    if (!request.url().startsWith(baseURL)) requests.push(request.url());
  });
  await page.goto(baseURL + "/qp-revenue-platform.html");
  await page.getByRole("button", { name: /AI Growth/ }).click();
  await page.getByLabel("What revenue outcome are you working toward?").fill("Get five new customers");
  await page.getByRole("button", { name: "Create plan" }).click();
  await page.getByText("Draft plan for: Get five new customers").waitFor();
  assert.deepEqual(requests, [], "Prototype should not call external services");
  await page.close();
});

test("export downloads clearly labeled illustrative demo data", async () => {
  const page = await browser.newPage();
  await page.goto(baseURL + "/qp-revenue-platform.html");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export demo data" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "qp-demo-data.json");
  const path = await download.path();
  const { readFile } = await import("node:fs/promises");
  const data = JSON.parse(await readFile(path, "utf8"));
  assert.match(data.notice, /Illustrative demo data only/);
  assert.equal(data.metrics.attributedRevenue, 8420);
  await page.close();
});

test("mobile viewport keeps primary navigation usable", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(baseURL + "/qp-revenue-platform.html");
  await page.getByRole("button", { name: /Leads/ }).click();
  assert.equal(await page.getByRole("heading", { name: "Lead workspace" }).isVisible(), true);
  const main = await page.locator("main").boundingBox();
  assert.ok(main && main.width > 0 && main.width <= 390, "Main content should fit mobile viewport");
  await page.close();
});
