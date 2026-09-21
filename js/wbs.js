(() => {
  "use strict";

  const data = window.WBS_DATA;
  const body = document.querySelector("#wbs-body");
  const search = document.querySelector("#search");
  const empty = document.querySelector("#empty-state");
  const summary = document.querySelector("#result-summary");
  let activeStatus = "all";

  const escapeHtml = value => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const statusLabel = status => status === "done" ? "완료" : "예정";
  const formatPercent = value => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

  function renderCurrentDate() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    document.querySelector("#current-date").textContent = `${now.getFullYear()}.${month}.${day}`;
  }

  function renderProgress() {
    const completed = Math.min(100, Math.max(0, Number(data.baselineProgress) || 0));
    const value = formatPercent(completed);
    document.querySelector("#progress-value").textContent = value;
    document.querySelector("#progress-bar").style.width = value;
    document.querySelector("#progress-track").setAttribute("aria-valuenow", String(completed));
    document.querySelector("#progress-card").setAttribute("aria-label", `전체 진행률 ${value}`);
  }

  function renderCompleted() {
    const items = data.tasks.filter(task => task.status === "done");
    document.querySelector("#completed-grid").innerHTML = items.map(task => `
      <article class="completed-card">
        <span class="code">WBS ${escapeHtml(task.id)}</span>
        <h3>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description)}</p>
      </article>
    `).join("");
  }

  function renderTable() {
    const query = search.value.trim().toLocaleLowerCase("ko-KR");
    const tasks = data.tasks.filter(task => {
      const statusMatches = activeStatus === "all" || task.status === activeStatus;
      const text = `${task.id} ${task.title} ${task.description} ${task.deliverables}`.toLocaleLowerCase("ko-KR");
      return statusMatches && (!query || text.includes(query));
    });

    body.innerHTML = tasks.map(task => `
      <tr>
        <td>${escapeHtml(task.id)}</td>
        <td><strong class="task-title">${escapeHtml(task.title)}</strong><span class="task-description">${escapeHtml(task.description)}</span></td>
        <td><span class="status ${escapeHtml(task.status)}">${statusLabel(task.status)}</span></td>
        <td class="deliverables">${escapeHtml(task.deliverables)}</td>
      </tr>
    `).join("");

    empty.hidden = tasks.length !== 0;
    summary.textContent = `총 ${data.tasks.length}개 중 ${tasks.length}개 표시`;
  }

  const done = data.tasks.filter(task => task.status === "done");
  document.querySelector("#total-count").textContent = data.tasks.length;
  document.querySelector("#done-count").textContent = done.length;
  document.querySelector("#todo-count").textContent = data.tasks.length - done.length;

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      activeStatus = button.dataset.status;
      document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === button));
      renderTable();
    });
  });
  search.addEventListener("input", renderTable);

  renderCurrentDate();
  renderProgress();
  renderCompleted();
  renderTable();
})();
