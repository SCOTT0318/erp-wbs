(() => {
  "use strict";
  const controls = [];
  document.querySelectorAll(".select-field select").forEach(select => {
    const label = select.closest(".select-field");
    const caption = label.querySelector("span");
    caption.id = `${select.id}-label`;
    const wrapper = document.createElement("div");
    wrapper.className = "filter-select";
    const button = document.createElement("button");
    button.type = "button";
    button.id = `${select.id}-button`;
    button.className = "filter-select-button";
    button.setAttribute("role", "combobox");
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", `${select.id}-listbox`);
    button.setAttribute("aria-labelledby", `${caption.id} ${select.id}-value`);
    const value = document.createElement("span");
    value.id = `${select.id}-value`;
    button.append(value);
    const list = document.createElement("div");
    list.id = `${select.id}-listbox`;
    list.className = "filter-select-menu";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-labelledby", caption.id);
    list.hidden = true;
    list.addEventListener("pointerdown", event => event.preventDefault());
    const options = [...select.options].map((option, index) => {
      const item = document.createElement("div");
      item.id = `${select.id}-option-${index}`;
      item.className = "filter-select-option";
      item.setAttribute("role", "option");
      item.textContent = option.textContent;
      item.addEventListener("pointermove", () => activate(index, false));
      item.addEventListener("click", event => { event.preventDefault(); choose(index); });
      list.append(item);
      return item;
    });
    wrapper.append(button, list);
    select.after(wrapper);
    select.hidden = true;
    let active = select.selectedIndex;
    let search = "";
    let lastTyped = 0;
    function activate(index, scroll = true) {
      active = index;
      options.forEach((item, position) => item.classList.toggle("is-active", position === active));
      button.setAttribute("aria-activedescendant", options[active].id);
      if (scroll) options[active].scrollIntoView({ block: "nearest" });
    }
    function close() {
      list.hidden = true;
      button.setAttribute("aria-expanded", "false");
      button.removeAttribute("aria-activedescendant");
      search = "";
    }
    function open() {
      controls.forEach(control => control.close());
      list.hidden = false;
      button.setAttribute("aria-expanded", "true");
      const bounds = wrapper.getBoundingClientRect();
      const below = innerHeight - bounds.bottom - 12;
      const above = bounds.top - 12;
      const opensUp = below < 250 && above > below;
      list.classList.toggle("opens-up", opensUp);
      list.style.maxHeight = `${Math.max(44, Math.min(250, opensUp ? above : below))}px`;
      activate(select.selectedIndex);
    }
    function sync() {
      value.textContent = select.options[select.selectedIndex].textContent;
      options.forEach((item, index) => item.setAttribute("aria-selected", String(index === select.selectedIndex)));
    }
    function choose(index) {
      select.selectedIndex = index;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      close();
      button.focus();
    }
    button.addEventListener("click", () => list.hidden ? open() : close());
    button.addEventListener("keydown", event => {
      if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "Escape") { close(); return; }
        if (event.key === "Enter" || event.key === " ") {
          if (list.hidden) open(); else choose(active);
          return;
        }
        if (list.hidden) open();
        const index = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
          : Math.max(0, Math.min(options.length - 1, active + (event.key === "ArrowDown" ? 1 : -1)));
        activate(index);
      } else if (event.key === "Tab") close();
      else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (list.hidden) open();
        const now = Date.now();
        search = (now - lastTyped > 700 ? "" : search) + event.key.toLocaleLowerCase("ko-KR");
        lastTyped = now;
        const index = [...select.options].findIndex(option => option.textContent.toLocaleLowerCase("ko-KR").startsWith(search));
        if (index >= 0) activate(index);
      }
    });
    select.addEventListener("change", sync);
    document.addEventListener("pointerdown", event => { if (!wrapper.contains(event.target)) close(); });
    wrapper.addEventListener("focusout", event => { if (!wrapper.contains(event.relatedTarget)) close(); });
    // Clicking the caption should focus the enhanced control, not the hidden select.
    caption.addEventListener("click", event => { event.preventDefault(); button.focus(); });
    const control = { select, close, sync };
    controls.push(control);
    sync();
  });
  document.querySelectorAll(".tab-button, #scope-grid").forEach(element => {
    element.addEventListener("click", () => controls.forEach(control => { control.close(); control.sync(); }));
    element.addEventListener("keydown", () => controls.forEach(control => control.close()));
  });
})();
