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
// The earlier work-package source remains an unchanged historical record.
require(path.join(root, "js/wbs-data.js"));
const historical = window.WBS_DATA;
assert.equal(historical.tasks.length, 113);
assert.equal(historical.currentProgress, 24);
require(path.join(root, "js/wbs-foundation.js"));
const data = window.WBS_DATA;
assert.equal(data.updateDate, "2026-10-06");
assert.equal(data.progressBasis, "프로토타입 단계까지의 기반 준비");
assert.equal(data.overallProgress.estimate, 7);
assert.match(data.overallProgress.source, /사용자 추정/);
assert.equal(data.tasks.length, 20);
assert.equal(data.completed.length, 14);
assert.equal(data.groups.length, 4);
assert.equal(data.tasks.filter(task => task.status === "in_progress").length, 4);
assert.equal(data.tasks.filter(task => task.status === "planned").length, 2);
assert.equal(data.currentProgress, 70);
assert.equal(data.calculateProgress(data.tasks), 70);
assert.equal(data.calculateProgress([]), 0);
assert.equal(data.calculateProgress(data.tasks.map(task => ({ ...task, status: "planned" }))), 0);
assert.equal(data.calculateProgress(data.tasks.map(task => ({ ...task, status: "in_progress" }))), 0);
assert.equal(data.calculateProgress(data.tasks.map(task => ({ ...task, status: "done" }))), 100);
const nextCheckpoint = data.tasks.map(task => ({ ...task }));
nextCheckpoint.find(task => task.status === "in_progress").status = "done";
assert.equal(data.calculateProgress(nextCheckpoint), 75, "완료 점검 추가 시 진행률 갱신");
assert.equal(new Set(data.tasks.map(task => task.id)).size, data.tasks.length);
assert.deepEqual(data.groups.flatMap(group => group.streams.flatMap(stream => stream.tasks)), data.tasks);
assert.ok(!data.tasks.some(task => /생산지시|VIP 샘플|자재 마스터/.test(task.title)));
data.tasks.forEach(task => {
  for (const field of ["title", "description", "deliverables", "acceptance", "connection", "evidence"]) {
    assert.ok(task[field], task.id + ": " + field + " 누락");
  }
  assert.ok(["done", "in_progress", "planned"].includes(task.status));
});
["3.1.3", "3.1.4", "3.1.5", "4.1.3", "4.1.4", "4.1.5"].forEach(id => {
  assert.notEqual(data.tasks.find(task => task.id === id).status, "done", id + ": 미검증 작업 완료 집계");
});
assert.match(html, /id="progress-value">70%/);
assert.doesNotMatch(html, /id="(?:current-scope-notice|detail-progress-value)"|class="(?:detail-notice|hero-progress-top|footer|section-intro details-intro)"/);
assert.ok(html.includes('id="page-title">ERP WBS</h1>'));

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

assert.equal(element("#total-count").textContent, 20);
assert.equal(element("#done-count").textContent, 14);
assert.equal(element("#progress-count").textContent, 4);
assert.equal(element("#planned-count").textContent, 2);
assert.equal(element("#progress-value").textContent, "70%");
assert.equal(element("#progress-bar").style.width, "70%");
assert.equal(element("#progress-track")["aria-valuenow"], "70");
assert.equal(element("#progress-remaining").textContent, "남은 준비 30%");
assert.equal(element("#overall-progress-value").textContent, "약 7%");
assert.equal(element("#overall-progress-bar").style.width, "7%");
assert.equal(element("#overall-progress-track")["aria-valuenow"], "7");
assert.match(element("#progress-track")["aria-valuetext"], /20개.*14개/);
assert.match(element("#scope-grid").innerHTML, /공통 기능/);
assert.match(element("#detail-list").innerHTML, /Linux 운영 복원 인수/);
assert.match(element("#detail-list").innerHTML, /2026-10-06 전달 업무일지/);
assert.equal((element("#detail-list").innerHTML.match(/class="task-id"/g) || []).length, 20, "완료 행 중복");
assert.equal(element("#panel-details").hidden, true);
element("#tab-details").handlers.click();
assert.equal(element("#panel-dashboard").hidden, true);
assert.equal(element("#panel-details").hidden, false);
element("#group-filter").value = "3";
element("#group-filter").handlers.change();
assert.match(element("#result-summary").textContent, /5개 표시/);
element("#status-filter").value = "in_progress";
element("#status-filter").handlers.change();
assert.match(element("#result-summary").textContent, /3개 표시/);
element("#search").value = "승인된 운영 조건";
element("#search").handlers.input();
assert.match(element("#result-summary").textContent, /1개 표시/);
assert.equal(element("#empty-state").hidden, true);
element("#status-filter").value = "done";
element("#status-filter").handlers.change();
assert.equal(element("#empty-state").hidden, false);
assert.match(element("#result-summary").textContent, /0개 표시/);
console.log("PASS: foundation checkpoints, progress calculation, HTML references, tabs, search and filters");
