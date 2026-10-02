const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const relative = "docs/daily-work-logs/박범준/2026-10-02.html";
const target = path.join(root, relative);
const html = fs.readFileSync(target, "utf8");
const markdownPath = target.replace(/\.html$/, ".md");
const markdown = fs.readFileSync(markdownPath, "utf8");
const originalPath = path.resolve(root, "../tempchian-erp/erp-docs/daily-work-logs/박범준/2026-10-02.md");
if (fs.existsSync(originalPath)) {
  const normalize = text => text.replaceAll("\r\n", "\n").replace(/\]\([^)]+\)/g, "]()");
  assert.equal(normalize(markdown), normalize(fs.readFileSync(originalPath, "utf8")), "링크 기준화 외 원본 상세 내용이 변경됨");
}
const main = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "상세 HTML id 중복");
assert.equal([...html.matchAll(/<h3 id="[^\"]+">\d+\./g)].length, 19, "19개 상세 작업 누락");
assert.equal([...markdown.matchAll(/^### \d+\./gm)].length, 19);
assert.equal([...html.matchAll(/<table>/g)].length, 4, "모듈·검사·커밋·WBS 표 누락");
for (const file of [target, path.join(root, "index.html")]) {
  const content = fs.readFileSync(file, "utf8");
  for (const [, raw] of content.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:)/.test(raw)) continue;
    const [part, anchor] = raw.split("#");
    const linked = part ? path.resolve(path.dirname(file), decodeURIComponent(part)) : file;
    assert.ok(fs.existsSync(linked), `없는 HTML 링크: ${raw}`);
    if (anchor && linked.endsWith(".html")) {
      const linkedHtml = fs.readFileSync(linked, "utf8");
      const tabHash = linked === path.join(root, "index.html") && ["dashboard", "details"].includes(anchor)
        && linkedHtml.includes(`data-tab="${anchor}"`) && linkedHtml.includes(`id="panel-${anchor}"`);
      assert.ok(linkedHtml.includes(`id="${decodeURIComponent(anchor)}"`) || tabHash, `없는 앵커: ${raw}`);
    }
  }
}
for (const [, , link] of markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
  if (!/^(?:https?:|#)/.test(link)) assert.ok(fs.existsSync(path.resolve(path.dirname(markdownPath), decodeURIComponent(link.split("#")[0]))), `없는 원본 링크: ${link}`);
}
assert.ok(main.includes(relative), "메인 상세 HTML 링크 누락");
assert.ok(main.indexOf("update-october-second-title") < main.indexOf('id="update-title"'), "전일 기록보다 최신 기록이 뒤에 있음");
for (const phrase of ["150개 중 137", "6 통과·2 실패", "13/13", "로그인 1회", "HDD/NAS", "운영 복원", "5432", "38개", "15개"]) {
  assert.ok(html.includes(phrase) || main.includes(phrase), `주요 기록 누락: ${phrase}`);
}
for (const content of [html, markdown, main.match(/<section class="panel-card update-panel" aria-labelledby="update-october-second-title">[\s\S]*?<\/section>/)[0]]) {
  assert.doesNotMatch(content, /192\.168\.\d+\.\d+|erp-account|postgres(?:ql)?:\/\/|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|[\w.-]+@\d+\.\d+\.\d+\.\d+/i, "공개 기록에 연결/비밀 리터럴");
}
console.log("PASS: 19 detailed tasks, four tables, local links/anchors, prior record and safe public literals");

async function browserChecks() {
  const [modules, output] = process.argv.slice(2);
  if (!modules || !output) return;
  const { chromium } = require(path.join(modules, "playwright"));
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const results = [];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(pathToFileURL(path.join(root, "index.html")).href);
      await page.locator("#update-october-second-title").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `main-${width}.png`), fullPage: false });
      assert.equal(await page.locator("#progress-value").innerText(), "6%");
      assert.equal(await page.locator("#progress-count").innerText(), "83");
      assert.ok(await page.locator("#update-october-second-title").isVisible());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `메인 ${width}px 가로 넘침`);
      await page.locator("#tab-details").click();
      await page.locator("#group-filter").selectOption("5");
      await page.locator("#status-filter").selectOption("in_progress");
      await page.locator("#search").fill("백업");
      assert.ok((await page.locator("#result-summary").innerText()).match(/[1-9]\d*개 표시/));
      assert.ok(await page.locator("#detail-list").innerText().then(text => text.includes("2026-10-02")));
      await page.locator("#tab-dashboard").click();
      await page.locator(`a[href="./${relative}"]`).click();
      await page.waitForURL(pathToFileURL(target).href);
      assert.equal(await page.locator(".log-content h3").evaluateAll(nodes => nodes.filter(node => /^\d+\./.test(node.textContent)).length), 19);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `상세 ${width}px 가로 넘침`);
      await page.screenshot({ path: path.join(output, `detail-${width}.png`), fullPage: false });
      const table = page.locator(".table-scroll").nth(1);
      await table.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `checks-${width}.png`), fullPage: false });
      await page.locator('.log-toc a[href="#section-29"]').click();
      assert.ok(await page.locator("#section-29").isVisible());
      results.push({ width, main: "pass", tabsFiltersSearch: "pass", detailTasks: 19, overflow: false });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, "verification.json"), JSON.stringify({ results, errors }, null, 2));
    console.log("PASS: Edge desktop/mobile main, tabs/filters/search, full detail, anchors and no page errors");
  } finally { await browser.close(); }
}
browserChecks().catch(error => { console.error(error); process.exitCode = 1; });
