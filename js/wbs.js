(() => {
  "use strict";

  const data = window.WBS_DATA;
  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const allStreams = data.groups.flatMap(group => group.streams);
  const openStreams = new Set(allStreams.map(stream => stream.id));

  function renderProgress() {
    const progress = data.calculateProgress(data.tasks);
    $("#progress-value").textContent = `${progress}%`;
    $("#progress-bar").style.width = `${progress}%`;
    $("#progress-track").setAttribute("aria-valuenow", String(progress));
    const basis = `${data.progressBasis}: ${data.tasks.length}개 동일 점수 점검 중 ${data.completed.length}개 확인 완료. 진행 중·예정은 0점`;
    $("#progress-track").setAttribute("aria-valuetext", `${progress}% · ${basis}`);
    $(".hero-progress").setAttribute("title", basis);
  }

  function renderMetrics() {
    $("#total-count").textContent = data.tasks.length;
    $("#done-count").textContent = data.completed.length;
    $("#progress-count").textContent = data.tasks.filter(task => task.status === "in_progress").length;
    $("#planned-count").textContent = data.tasks.filter(task => task.status === "planned").length;
    $("#baseline-count").textContent = `${data.completed.length}개 확인`;
  }

  function renderDashboard() {
    $("#scope-grid").innerHTML = data.groups.map(group => {
      const count = group.streams.reduce((sum, stream) => sum + stream.tasks.length, 0);
      return `<a class="scope-card tone-${escapeHtml(group.tone)}" href="#details" data-group="${escapeHtml(group.id)}">
        <div class="scope-card-top"><span>${escapeHtml(group.tag)}</span><strong>${escapeHtml(group.id)} / 04</strong></div>
        <h3>${escapeHtml(group.name)}</h3><p>${escapeHtml(group.summary)}</p>
        <div class="scope-count"><strong>${group.streams.length}</strong><span>업무 영역</span><strong>${count}</strong><span>상세 작업</span></div>
        <ul>${group.streams.map(stream => `<li>${escapeHtml(stream.name)}</li>`).join("")}</ul>
        <span class="scope-link">상세 범위 보기 <b aria-hidden="true">↗</b></span>
      </a>`;
    }).join("");

    $("#handoff-grid").innerHTML = data.handoffs.map((item, index) => `
      <article class="handoff-card">
        <div class="handoff-number">FLOW ${String(index + 1).padStart(2, "0")}</div>
        <div class="handoff-route"><span>${escapeHtml(item.from)}</span><i aria-hidden="true">→</i><span>${escapeHtml(item.to)}</span></div>
        <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p>
      </article>`).join("");

    $("#baseline-grid").innerHTML = data.completed.map(task => `
      <article class="baseline-item"><span>${escapeHtml(task.id)}</span><strong>${escapeHtml(task.title)}</strong></article>`).join("");
  }

  function renderRows(tasks) {
    return `<div class="task-table-wrap"><table class="task-table">
      <thead><tr><th>WBS</th><th>세부 작업 / 처리 범위</th><th>주요 산출물</th><th>수용·검증 기준</th><th>상태</th></tr></thead>
      <tbody>${tasks.map(task => `<tr>
        <td class="task-id">${escapeHtml(task.id)}</td>
        <td><strong class="task-title">${escapeHtml(task.title)}</strong><span class="task-description">${escapeHtml(task.description)}</span>${task.evidence ? `<span class="task-evidence">${escapeHtml(task.evidence)}</span>` : ""}</td>
        <td>${escapeHtml(task.deliverables)}</td>
        <td>${escapeHtml(task.acceptance || "기존 소스·문서에서 구현 기반 확인. 운영 인수와 별개")}</td>
        <td><span class="status-badge ${escapeHtml(task.status)}">${{ done: "확인 완료", in_progress: "진행 중", planned: "예정" }[task.status]}</span></td>
      </tr>`).join("")}</tbody>
    </table></div>`;
  }

  function renderStream(stream, tasks) {
    return `<details class="stream-card" data-stream="${escapeHtml(stream.id)}" ${openStreams.has(stream.id) ? "open" : ""}>
      <summary><span class="stream-code">${escapeHtml(stream.id)}</span><span class="stream-summary"><strong>${escapeHtml(stream.name)}</strong><small>${escapeHtml(stream.goal)}</small></span><span class="stream-task-count">${tasks.length} / ${stream.tasks.length}개 표시</span><span class="chevron" aria-hidden="true"></span></summary>
      <div class="stream-body"><div class="stream-connection"><span>업무 연결</span><strong>${escapeHtml(stream.connection)}</strong></div>${renderRows(tasks)}</div>
    </details>`;
  }

  function matches(task, query, status) {
    if (status !== "all" && task.status !== status) return false;
    if (!query) return true;
    const text = [task.id, task.title, task.description, task.deliverables, task.acceptance,
      task.groupName, task.streamName, task.connection, task.evidence].join(" ").toLocaleLowerCase("ko-KR");
    return text.includes(query);
  }

  function renderDetails() {
    const query = $("#search").value.trim().toLocaleLowerCase("ko-KR");
    const groupFilter = $("#group-filter").value;
    const status = $("#status-filter").value;
    const sections = [];
    let visible = 0;

    data.groups.forEach(group => {
      if (groupFilter !== "all" && groupFilter !== group.id) return;
      const cards = [];
      let groupCount = 0;
      group.streams.forEach(stream => {
        const tasks = stream.tasks.filter(task => matches(task, query, status));
        if (!tasks.length) return;
        groupCount += tasks.length;
        cards.push(renderStream(stream, tasks));
      });
      if (!cards.length) return;
      visible += groupCount;
      sections.push(`<section class="detail-group tone-${escapeHtml(group.tone)}" aria-labelledby="group-${escapeHtml(group.id)}-title">
        <div class="detail-group-heading"><div><span class="group-index">${escapeHtml(group.tag)}</span><h3 id="group-${escapeHtml(group.id)}-title">${escapeHtml(group.name)}</h3><p>${escapeHtml(group.summary)}</p></div><strong>${groupCount}개 표시</strong></div>
        <div class="stream-list">${cards.join("")}</div>
      </section>`);
    });

    $("#detail-list").innerHTML = sections.join("");
    $("#result-summary").textContent = `전체 ${data.tasks.length}개 항목 중 ${visible}개 표시`;
    $("#empty-state").hidden = visible !== 0;
    updateToggleLabel();
  }

  function updateToggleLabel() {
    const visibleCards = [...document.querySelectorAll("#detail-list details.stream-card")];
    const allOpen = visibleCards.length > 0 && visibleCards.every(card => card.open);
    $("#toggle-all").textContent = allOpen ? "모두 접기" : "모두 펼치기";
    $("#toggle-all").disabled = visibleCards.length === 0;
  }

  function showTab(name, moveFocus = false) {
    const tab = name === "details" ? "details" : "dashboard";
    ["dashboard", "details"].forEach(value => {
      const active = value === tab;
      const button = $(`#tab-${value}`);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      $(`#panel-${value}`).hidden = !active;
    });
    if (moveFocus) $(`#tab-${tab}`).focus();
    if (location.hash !== `#${tab}`) history.replaceState(null, "", `#${tab}`);
  }

  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
    button.addEventListener("keydown", event => {
      const target = { ArrowLeft: "dashboard", ArrowRight: "details", Home: "dashboard", End: "details" }[event.key];
      if (!target) return;
      event.preventDefault();
      showTab(target, true);
    });
  });

  $("#scope-grid").addEventListener("click", event => {
    const link = event.target.closest("[data-group]");
    if (!link) return;
    event.preventDefault();
    $("#group-filter").value = link.dataset.group;
    $("#search").value = "";
    $("#status-filter").value = "all";
    renderDetails();
    showTab("details");
    document.querySelector(".tab-nav").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  ["#search", "#group-filter", "#status-filter"].forEach(selector => {
    $(selector).addEventListener(selector === "#search" ? "input" : "change", renderDetails);
  });

  $("#toggle-all").addEventListener("click", () => {
    const cards = [...document.querySelectorAll("#detail-list details.stream-card")];
    const shouldOpen = !cards.every(card => card.open);
    cards.forEach(card => {
      card.open = shouldOpen;
      if (shouldOpen) openStreams.add(card.dataset.stream);
      else openStreams.delete(card.dataset.stream);
    });
    updateToggleLabel();
  });

  $("#detail-list").addEventListener("toggle", event => {
    const card = event.target;
    if (!card.matches?.("details.stream-card")) return;
    if (card.open) openStreams.add(card.dataset.stream);
    else openStreams.delete(card.dataset.stream);
    updateToggleLabel();
  }, true);

  window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

  renderProgress();
  renderMetrics();
  renderDashboard();
  renderDetails();
  showTab(location.hash.slice(1));
})();
