const assert = require("node:assert/strict");
const { homedir } = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require(path.join(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"))); }

(async () => {
  const browser = await chromium.launch({
    executablePath: path.join(process.env["ProgramFiles(x86)"] || "C:/Program Files (x86)", "Microsoft/Edge/Application/msedge.exe"),
    headless: true
  });
  const errors = [];
  const page = await browser.newPage();
  page.on("pageerror", error => errors.push(error.message));
  const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;
  async function chooseFilter(id, option) {
    const text = await page.locator(`#${id} option[value="${option}"]`).textContent();
    await page.locator(`#${id}-button`).click();
    await page.locator(`#${id}-listbox`).getByRole("option", { name: text, exact: true }).click();
    assert.equal(await page.locator(`#${id}`).inputValue(), option);
    assert.equal(await page.locator(`#${id}-button`).getAttribute("aria-expanded"), "false");
  }
  try {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      assert.equal(await page.locator("#overall-progress-value").innerText(), "약 10%");
      assert.equal(await page.getByRole("progressbar").count(), 1);
      assert.equal(await page.locator("#overall-progress-description").count(), 0);
      assert.equal(await page.locator("#scope-grid .status-badge.in_progress").count(), 1);
      assert.deepEqual(await page.locator(".department-progress").allTextContents(), ["미산정", "0%", "0%"]);
      await page.locator("summary").filter({ hasText: "산정 기준" }).click();
      assert.match(await page.locator("#progress-basis").innerText(), /전체 완성도 약 10%/);
      assert.match(await page.locator("#progress-basis").innerText(), /기초 뼈대 약 7%/);
      assert.match(await page.locator(".foundation-note").innerText(), /합산하지 않음/);
      await page.locator("summary").filter({ hasText: "산정 기준" }).click();
      assert.equal(await page.locator(".history-record").evaluate(node => node.open), false);
      assert.equal(await page.locator("#scope-grid .scope-card").count(), 3);
      assert.equal(await page.locator("#scope-grid .scope-card").first().evaluate(node => getComputedStyle(node, "::before").content), "none");
      const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(await overflow(), false, `dashboard overflow ${width}`);
      const latest = page.locator("#update-october-nineteenth");
      assert.equal(await latest.isVisible(), true);
      assert.match(await latest.innerText(), /6a016b4/);
      for (const summary of await latest.locator("details > summary").all()) {
        await summary.click();
        assert.equal(await summary.evaluate(node => node.parentElement.open), true);
        assert.equal(await overflow(), false, `current evidence overflow ${width}`);
        await summary.click();
      }
      await page.locator("#tab-details").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#detail-list .task-id").count(), 40);
      for (const id of ["group-filter", "status-filter"]) {
        const label = await page.locator(`#${id}-label`).boundingBox();
        const button = await page.locator(`#${id}-button`).boundingBox();
        assert.ok(label.y + label.height < button.y, `label above dropdown ${width}`);
      }
      await page.locator("#group-filter-button").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#group-filter").inputValue(), "8");
      await page.keyboard.press("Enter");
      await page.keyboard.press("Home");
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#group-filter").inputValue(), "8", "Escape preserves selected value");
      await page.locator("#group-filter-button").click();
      await page.locator("#status-filter-button").click();
      assert.equal(await page.locator("#group-filter-listbox").isVisible(), false);
      await page.keyboard.press("Tab");
      assert.equal(await page.locator("#status-filter-listbox").isVisible(), false);
      await page.locator("#group-filter-button").click();
      await page.locator("#search").click();
      assert.equal(await page.locator("#group-filter-listbox").isVisible(), false);
      for (const [group, count] of [["foundation", 20], ["production", 10], ["7", 5], ["8", 5]]) {
        await chooseFilter("group-filter", String(group));
        assert.equal(await page.locator("#detail-list .task-id").count(), count);
      }
      await chooseFilter("group-filter", "all");
      await chooseFilter("status-filter", "done");
      assert.equal(await page.locator("#detail-list .task-id").count(), 24);
      await chooseFilter("status-filter", "in_progress");
      assert.equal(await page.locator("#detail-list .task-id").count(), 12);
      await chooseFilter("status-filter", "planned");
      assert.equal(await page.locator("#detail-list .task-id").count(), 4);
      await chooseFilter("status-filter", "all");
      await page.locator("#search").fill("Linux 운영 복원 인수");
      assert.equal(await page.locator("#detail-list .task-id").count(), 1);
      await page.locator("#search").fill("존재하지않는항목");
      assert.equal(await page.locator("#empty-state").isVisible(), true);
      await page.locator("#search").fill("");
      await page.locator("#toggle-all").click();
      assert.equal(await page.locator("#detail-list details[open]").count(), 0);
      await page.locator("#detail-list summary").first().focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#detail-list details[open]").count(), 1);
      assert.equal(await overflow(), false, `details overflow ${width}`);
      await page.locator("#tab-details").focus();
      await page.keyboard.press("ArrowLeft");
      assert.equal(await page.locator("#panel-dashboard").isVisible(), true);
      await page.locator(".history-record > summary").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator(".history-record").evaluate(node => node.open), true);
      assert.equal(await overflow(), false, `history overflow ${width}`);
    }
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator(".history-record").isVisible(), false);
    assert.equal(await page.locator("#overall-progress-value").isVisible(), true);
    await page.emulateMedia({ media: "screen" });
    await page.locator(".history-record").evaluate(node => { node.open = false; });
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (process.env.WBS_SCREENSHOT) await page.screenshot({ path: process.env.WBS_SCREENSHOT, fullPage: false });
    if (process.env.WBS_DETAIL_SCREENSHOT) {
      await page.goto(`${url}#details`);
      await page.locator("#group-filter-button").click();
      await page.screenshot({ path: process.env.WBS_DETAIL_SCREENSHOT, fullPage: false });
    }
    assert.deepEqual(errors, []);
    console.log("PASS: Edge 1440/768/390/320px, current evidence disclosures, styled dropdowns/labels, pointer/keyboard/dismissal, no card accent lines, filters/search, tabs/history/print, overflow and JavaScript errors");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
