const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const references = [...html.matchAll(/\baria-(?:controls|labelledby|describedby)="([^"]+)"/g)]
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
assert.equal(window.WBS_DATA.currentProgress, 70, "과거 기반 기준선 보존");
require(path.join(root, "js/wbs-current.js"));
const data = window.WBS_DATA;
assert.equal(data.updateDate, "2026-10-20");
assert.equal(data.sourceCommit, "6a016b4c967b06bd9d17caabca6b4b66c5a78116");
assert.equal(data.simulation.progress, 100);
assert.equal(data.simulation.status, "done");
assert.equal(data.overallProgress.value, 10);
assert.equal(data.foundationAssessment.progress, 7);
assert.deepEqual(data.departments.map(item => item.progress), [null, 0, 0]);
assert.match(data.overallProgress.source, /마스터/);
assert.match(data.progressBasis, /마스터/);
assert.equal(data.tasks.length, 40);
assert.equal(data.completed.length, 24);
assert.equal(data.groups.length, 8);
assert.equal(data.tasks.filter(task => task.status === "in_progress").length, 12);
assert.equal(data.tasks.filter(task => task.status === "planned").length, 4);
assert.equal(data.currentProgress, 10);
assert.deepEqual(data.departments.map(department => data.calculateLegacyDepartmentProgress(department)), [45, 45, 45]);
assert.equal(data.calculateLegacyProgress(data.departments), 45);
assert.equal(data.stages.reduce((sum, stage) => sum + stage.weight, 0), 100);
const departmentAt = status => ({ stages: Object.fromEntries(data.stages.map(stage => [stage.id, { status }])) });
assert.equal(data.calculateLegacyProgress([]), 0);
assert.equal(data.calculateLegacyProgress([departmentAt("planned")]), 0);
assert.equal(data.calculateLegacyProgress([departmentAt("partial")]), 50);
assert.equal(data.calculateLegacyProgress([departmentAt("done")]), 100);
assert.equal(data.calculateLegacyProgress([departmentAt("done"), departmentAt("planned"), departmentAt("planned")]), 33);
assert.equal(data.calculateLegacyProgress([departmentAt("done"), departmentAt("done"), departmentAt("planned")]), 67);
const updated = structuredClone(data.departments);
updated[0].stages.acceptance.status = "partial";
assert.equal(data.calculateLegacyProgress(updated), 47, "현업 인수 일부 진행을 전체에 반영");
assert.equal(data.calculateLegacyProgress(data.departments.map(department => ({ ...department, status: "done", progress: 100 }))), 45, "표시 상태/캐시로 단계 근거 우회 금지");
data.departments.forEach(department => {
  assert.equal(department.status, department.id === "production" ? "in_progress" : "planned");
  assert.equal(department.stages.acceptance.status, "planned", "개발 시험을 현업 인수로 집계 금지");
  data.stages.forEach(stage => {
    const item = department.stages[stage.id];
    assert.ok(Object.hasOwn(data.stageScores, item.status));
    assert.ok(item.evidence && item.source);
  });
});
assert.equal(new Set(data.tasks.map(task => task.id)).size, data.tasks.length);
assert.deepEqual(data.groups.flatMap(group => group.streams.flatMap(stream => stream.tasks)), data.tasks);
assert.deepEqual(data.groups.map(group => group.streams[0].tasks.length), Array(8).fill(5));
assert.ok(data.groups.slice(6).every(group => group.streams[0].tasks.every(task => task.status !== "done")), "미확정 부서 완료 집계 금지");
assert.equal(data.tasks.find(task => task.id === "8.1.3").status, "planned", "독립 XML 뷰어를 ERP 연계 완료로 집계 금지");
assert.equal(data.tasks.find(task => task.id === "8.1.4").status, "planned", "QC 구현을 장비·시험 완료로 집계 금지");
data.tasks.forEach(task => {
  for (const field of ["title", "description", "deliverables", "acceptance", "connection", "evidence"]) {
    assert.ok(task[field], task.id + ": " + field + " 누락");
  }
  assert.ok(["done", "in_progress", "planned"].includes(task.status));
});
["3.1.3", "3.1.4", "3.1.5", "4.1.3", "4.1.4", "4.1.5"].forEach(id => {
  assert.notEqual(data.tasks.find(task => task.id === id).status, "done", id + ": 미검증 작업 완료 집계");
});
assert.match(html, /id="overall-progress-value">약 10%/);
assert.doesNotMatch(html, /id="(?:prototype-progress|progress-value|progress-track)"/);
assert.equal((html.match(/role="progressbar"/g) || []).length, 1, "전체 진행률 하나만 표시");
assert.ok(html.includes('./js/wbs-current.js'));
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

assert.equal(element("#total-count").textContent, 3);
assert.equal(element("#done-count").textContent, 0);
assert.equal(element("#progress-count").textContent, 1);
assert.equal(element("#planned-count").textContent, 2);
assert.equal(element("#overall-progress-value").textContent, "약 10%");
assert.equal(element("#overall-progress-bar").style.width, "10%");
assert.equal(element("#overall-progress-track")["aria-valuenow"], "10");
assert.equal(element("#overall-progress-track")["aria-valuetext"], "약 10%");
assert.doesNotMatch(html, /id="overall-progress-description"/);
assert.match(element("#scope-grid").innerHTML, /생산부/);
assert.match(element("#detail-list").innerHTML, /Linux 운영 복원 인수/);
assert.match(element("#detail-list").innerHTML, /ERP 6a016b4 기준/);
assert.equal((element("#detail-list").innerHTML.match(/class="task-id"/g) || []).length, 40, "완료 행 중복");
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
for (const group of data.groups) {
  element("#search").value = "";
  element("#status-filter").value = "all";
  element("#group-filter").value = group.id;
  element("#group-filter").handlers.change();
  assert.match(element("#result-summary").textContent, /5개 표시/);
  assert.ok(element("#detail-list").innerHTML.includes(group.name));
}
console.log("PASS: owner completion estimate 10%, business/engineering 0%, foundation reference 7%, current ERP evidence, pending acceptance, simulation completion, historical preservation, HTML references, tabs, search and all group filters");
