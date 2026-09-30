const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const references = [...html.matchAll(/\baria-(?:controls|labelledby)="([^"]+)"/g)]
  .flatMap(match => match[1].split(" "));
const localAssets = [...html.matchAll(/\b(?:href|src)="(\.\/[^"#]+)"/g)]
  .map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "HTML id 중복");
references.forEach(reference => assert.ok(ids.includes(reference), `없는 ARIA 대상: ${reference}`));
localAssets.forEach(asset => assert.ok(fs.existsSync(path.join(root, asset)), `없는 파일: ${asset}`));

global.window = { addEventListener() {} };
require(path.join(root, "js/wbs-data.js"));
const data = window.WBS_DATA;
assert.equal(data.baselineProgress, 3);
assert.equal(data.currentProgress, 6);
assert.equal(data.updateDate, "2026-09-30");
assert.equal(data.completed.length, 18);
assert.equal(data.groups.length, 4);
assert.equal(data.tasks.length, 113);
assert.equal(data.tasks.filter(task => task.status === "in_progress").length, 73);
assert.equal(data.tasks.filter(task => task.status === "planned").length, 22);
const commonStarted = new Set(["5.2.2", "5.2.3", "5.3.2", "5.4.1", "5.5.1", "5.5.2", "5.5.3", "5.5.5"]);
assert.ok(Math.abs(data.completed.reduce((sum, task) => sum + task.weight, 0) - 3) < 1e-8);
assert.equal(new Set(data.tasks.map(task => task.id)).size, data.tasks.length);
data.groups.forEach(group => group.streams.forEach(stream => stream.tasks.forEach(task => {
  for (const field of ["title", "description", "deliverables", "acceptance", "connection"]) {
    assert.ok(task[field], `${task.id}: ${field} 누락`);
  }
  assert.equal(task.status, group.id === "5" && !commonStarted.has(task.id) ? "planned" : "in_progress");
  if (task.status === "in_progress") assert.ok(task.evidence, `${task.id}: 진행 근거 누락`);
})));
assert.match(html, /2026\.09\.30/);
assert.match(html, /전체 진행률 6%/);
assert.match(data.tasks.find(task => task.id === "2.6.1").evidence, /로거/);
assert.doesNotMatch(data.tasks.find(task => task.id === "4.2.3").description, /챔버 예약 연결/);

const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) {
    elements.set(selector, {
      textContent: "", innerHTML: "", value: "", hidden: false, disabled: false,
      dataset: {}, style: {}, handlers: {},
      setAttribute(key, value) { this[key] = value; },
      addEventListener(key, handler) { this.handlers[key] = handler; },
      focus() { this.focused = true; },
      scrollIntoView() {}
    });
  }
  return elements.get(selector);
}
element("#group-filter").value = "all";
element("#status-filter").value = "all";
element("#tab-dashboard").dataset.tab = "dashboard";
element("#tab-details").dataset.tab = "details";
global.document = {
  querySelector: element,
  querySelectorAll(selector) {
    return selector === ".tab-button"
      ? [element("#tab-dashboard"), element("#tab-details")]
      : [];
  }
};
global.location = { hash: "" };
global.history = { replaceState(_state, _unused, hash) { location.hash = hash; } };
require(path.join(root, "js/wbs.js"));

assert.equal(element("#total-count").textContent, 113);
assert.equal(element("#done-count").textContent, 18);
assert.equal(element("#progress-count").textContent, 73);
assert.equal(element("#planned-count").textContent, 22);
assert.equal(element("#progress-value").textContent, "6%");
assert.equal(element("#progress-track")["aria-valuenow"], "6");
assert.match(element("#scope-grid").innerHTML, /생산부/);
assert.match(element("#detail-list").innerHTML, /Excel·PDF/);
assert.match(element("#detail-list").innerHTML, /2026-09-29 tempchian-erp 4786021/);
assert.match(element("#detail-list").innerHTML, /2026-09-30/);
assert.equal(element("#panel-details").hidden, true);

element("#tab-details").handlers.click();
assert.equal(element("#panel-dashboard").hidden, true);
assert.equal(element("#panel-details").hidden, false);
element("#group-filter").value = "4";
element("#group-filter").handlers.change();
element("#search").value = "VIP";
element("#search").handlers.input();
assert.match(element("#result-summary").textContent, /6개 표시/);
element("#status-filter").value = "in_progress";
element("#status-filter").handlers.change();
assert.match(element("#result-summary").textContent, /6개 표시/);
assert.equal(element("#empty-state").hidden, true);
element("#status-filter").value = "done";
element("#status-filter").handlers.change();
assert.equal(element("#empty-state").hidden, false);
assert.match(element("#result-summary").textContent, /0개 표시/);

console.log("PASS: WBS data, HTML references, tabs, search and filters");
