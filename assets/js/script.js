(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* =====================================================
     Dados e utilitários
     ===================================================== */
  const KEY = "taskflow:v1";
  const THEME_KEY = "taskflow:theme";
  const TONES = { Work: "violet", Personal: "blue", Finance: "green", Health: "amber" };

  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return toISO(d); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const newId = () => Date.now() + Math.floor(Math.random() * 1000);

  function formatDue(iso) {
    if (!iso) return "No date";
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((date - today) / 864e5);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  }

  const seedTasks = () => [
    { id: 1, title: "Finalize Q3 product roadmap", description: "Review priorities and share the final draft with the product team.", due: daysFromNow(0), tag: "Work", status: "pending" },
    { id: 2, title: "Book dentist appointment", description: "Schedule a routine cleaning for next month.", due: daysFromNow(1), tag: "Personal", status: "pending" },
    { id: 3, title: "Prepare weekly team update", description: "Summarize key wins, open questions, and next steps.", due: daysFromNow(3), tag: "Work", status: "pending" },
    { id: 4, title: "Update monthly budget", description: "Reconcile recent expenses and adjust savings targets.", due: daysFromNow(7), tag: "Finance", status: "pending" },
    { id: 5, title: "Renew library membership", description: "Complete the online renewal before it expires.", due: daysFromNow(-6), tag: "Personal", status: "completed" },
  ];

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(saved)) return saved;
    } catch (e) { /* armazenamento indisponível ou corrompido */ }
    return seedTasks();
  }

  const state = { tasks: load(), filter: "all", view: "all", search: "", menuId: null, editing: null, newId: null };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state.tasks)); } catch (e) { /* ignora */ }
  }

  /* =====================================================
     Elementos
     ===================================================== */
  const app = $("#app");
  const list = $("#task-list");
  const searchInput = $("#search");
  const modal = $("#modal");
  const form = $("#task-form");
  const toast = $("#toast");
  const sidebar = $("#sidebar");
  const scrim = $("#scrim");

  /* =====================================================
     Tema
     ===================================================== */
  function applyTheme(dark, persist = true) {
    app.classList.toggle("dark", dark);
    $("#theme-toggle").setAttribute("aria-pressed", String(dark));
    $$("#theme-toggle span").forEach((s) => s.classList.toggle("selected", (s.dataset.mode === "dark") === dark));
    $('meta[name="theme-color"]').setAttribute("content", dark ? "#111214" : "#f5f5f7");
    if (persist) { try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (e) { /* ignora */ } }
  }
  applyTheme(app.classList.contains("dark"), false);
  $("#theme-toggle").addEventListener("click", () => applyTheme(!app.classList.contains("dark")));

  /* =====================================================
     Desenho (render)
     ===================================================== */
  function visibleTasks() {
    const q = state.search.trim().toLowerCase();
    let items = state.tasks.filter((t) => !q || `${t.title} ${t.description} ${t.tag}`.toLowerCase().includes(q));
    if (state.view === "upcoming") {
      items = items.filter((t) => t.status === "pending" && t.due).sort((a, b) => a.due.localeCompare(b.due));
    } else if (state.filter !== "all") {
      items = items.filter((t) => t.status === state.filter);
    }
    return items;
  }

  function taskHTML(t) {
    const done = t.status === "completed";
    const overdue = !done && t.due && t.due < toISO(new Date());
    const open = state.menuId === t.id;
    return `
      <article class="task-row${done ? " completed" : ""}${state.newId === t.id ? " is-new" : ""}" data-id="${t.id}">
        <button class="check-button" data-toggle="${t.id}" role="checkbox" aria-checked="${done}" aria-label="${done ? "Mark as pending" : "Mark as complete"}: ${esc(t.title)}">
          ${done ? '<svg class="icon" width="15" height="15"><use href="#i-check" /></svg>' : ""}
        </button>
        <div class="task-copy">
          <h2>${esc(t.title)}</h2>
          ${t.description ? `<p>${esc(t.description)}</p>` : ""}
          <div class="task-meta">
            <span class="due${overdue ? " overdue" : ""}"><svg class="icon" width="14" height="14"><use href="#i-calendar" /></svg>${esc(formatDue(t.due))}${overdue ? " · Overdue" : ""}</span>
            <span class="tag ${TONES[t.tag] || "blue"}">${esc(t.tag)}</span>
          </div>
        </div>
        <div class="menu-wrap">
          <button class="icon-button task-menu" data-menu="${t.id}" aria-haspopup="menu" aria-expanded="${open}" aria-label="Actions for ${esc(t.title)}"><svg class="icon" width="20" height="20"><use href="#i-more" /></svg></button>
          ${open ? `
            <div class="action-menu" role="menu">
              <button role="menuitem" data-edit="${t.id}"><svg class="icon" width="16" height="16"><use href="#i-edit" /></svg>Edit task</button>
              <button role="menuitem" class="danger" data-delete="${t.id}"><svg class="icon" width="16" height="16"><use href="#i-trash" /></svg>Delete</button>
            </div>` : ""}
        </div>
      </article>`;
  }

  function emptyHTML() {
    let title = "No tasks found", text = "Try changing your search or filters.";
    if (!state.tasks.length) { title = "No tasks yet"; text = "Add your first task to get started."; }
    else if (state.view === "upcoming" && !state.search) { title = "Nothing coming up"; text = "You have no pending tasks with a due date."; }
    return `<div class="empty-state"><span><svg class="icon" width="24" height="24"><use href="#i-search" /></svg></span><h2>${title}</h2><p>${text}</p></div>`;
  }

  function render() {
    const total = state.tasks.length;
    const pending = state.tasks.filter((t) => t.status === "pending").length;
    const completed = total - pending;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const items = visibleTasks();

    $("#count-all").textContent = total;
    $("#count-upcoming").textContent = state.tasks.filter((t) => t.status === "pending" && t.due).length;
    $("#stat-pending").textContent = pending;
    $("#stat-completed").textContent = completed;
    $("#stat-percent").textContent = `${percent}% of all tasks`;
    $("#progress-bar").style.width = `${percent}%`;

    $$(".nav-item").forEach((b) => {
      const active = b.dataset.view === state.view;
      b.classList.toggle("active", active);
      if (active) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    const upcoming = state.view === "upcoming";
    $("#page-title").textContent = upcoming ? "Upcoming" : "My tasks";
    $("#page-subtitle").textContent = upcoming ? "What's next, sorted by the closest due date." : "Stay focused and make progress, one task at a time.";
    document.title = `${upcoming ? "Upcoming" : "My tasks"} · TaskFlow`;
    $("#filters").hidden = upcoming;

    $$(".filter").forEach((b) => {
      const f = b.dataset.filter;
      const active = f === state.filter;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
      b.querySelector("span").textContent = f === "all" ? total : state.tasks.filter((t) => t.status === f).length;
    });
    $("#result-count").textContent = `${items.length} ${items.length === 1 ? "task" : "tasks"}`;

    list.innerHTML = items.length ? items.map(taskHTML).join("") : emptyHTML();
    state.newId = null;
  }

  /* =====================================================
     Ações sobre tarefas
     ===================================================== */
  list.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-toggle]");
    const menu = e.target.closest("[data-menu]");
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-delete]");

    if (toggle) {
      const id = Number(toggle.dataset.toggle);
      const task = state.tasks.find((t) => t.id === id);
      task.status = task.status === "pending" ? "completed" : "pending";
      save(); render();
      $(`[data-toggle="${id}"]`, list)?.focus();
    } else if (menu) {
      const id = Number(menu.dataset.menu);
      state.menuId = state.menuId === id ? null : id;
      render();
      if (state.menuId) $(".action-menu button", list)?.focus();
      else $(`[data-menu="${id}"]`, list)?.focus();
    } else if (edit) {
      const task = state.tasks.find((t) => t.id === Number(edit.dataset.edit));
      state.menuId = null; render();
      openModal(task, $(`[data-menu="${task.id}"]`, list));
    } else if (del) {
      deleteTask(Number(del.dataset.delete));
    }
  });

  // Fechar o menu de ações ao clicar fora
  document.addEventListener("click", (e) => {
    if (state.menuId !== null && !e.target.closest(".menu-wrap")) { state.menuId = null; render(); }
  });

  // Navegar no menu de ações com as setas
  list.addEventListener("keydown", (e) => {
    if (!e.target.closest(".action-menu") || !["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const items = $$(".action-menu button", list);
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
  });

  function deleteTask(id) {
    const index = state.tasks.findIndex((t) => t.id === id);
    const [removed] = state.tasks.splice(index, 1);
    state.menuId = null;
    save(); render();
    showToast("Task deleted", "Undo", () => {
      state.tasks.splice(index, 0, removed);
      save(); render();
    });
  }

  /* =====================================================
     Aviso com opção de anular
     ===================================================== */
  let toastTimer;
  function showToast(message, actionLabel, onAction) {
    clearTimeout(toastTimer);
    toast.innerHTML = `<span>${esc(message)}</span>`;
    if (actionLabel) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = actionLabel;
      btn.addEventListener("click", () => { onAction(); hideToast(); });
      toast.append(btn);
    }
    toast.hidden = false;
    toastTimer = setTimeout(hideToast, 5000);
  }
  function hideToast() { toast.hidden = true; }

  /* =====================================================
     Modal (criar / editar)
     ===================================================== */
  let lastFocus = null;

  function openModal(task = null, opener = null) {
    state.editing = task;
    lastFocus = opener || document.activeElement;
    $("#modal-eyebrow").textContent = task ? "Update details" : "A new priority";
    $("#modal-title").textContent = task ? "Edit task" : "Create a task";
    $("#modal-submit").textContent = task ? "Save changes" : "Create task";
    form.elements.title.value = task ? task.title : "";
    form.elements.description.value = task ? task.description : "";
    form.elements.due.value = task ? task.due : toISO(new Date());
    form.elements.tag.value = task ? task.tag : "Work";
    setTitleError("");
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    form.elements.title.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  function setTitleError(message) {
    $("#title-error").textContent = message;
    form.elements.title.setAttribute("aria-invalid", String(!!message));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = form.elements.title.value.trim();
    if (!title) { setTitleError("Give your task a name."); form.elements.title.focus(); return; }
    const data = {
      title,
      description: form.elements.description.value.trim(),
      due: form.elements.due.value,
      tag: form.elements.tag.value,
    };
    if (state.editing) {
      Object.assign(state.editing, data);
      showToast("Changes saved");
    } else {
      const task = { id: newId(), status: "pending", ...data };
      state.tasks.unshift(task);
      state.newId = task.id;
      // garante que a nova tarefa aparece mesmo com filtros/pesquisa ativos
      state.filter = "all"; state.search = ""; searchInput.value = ""; state.view = "all";
      showToast("Task created");
    }
    save(); closeModal(); render();
  });

  form.elements.title.addEventListener("input", () => setTitleError(""));
  $("#add-task").addEventListener("click", (e) => openModal(null, e.currentTarget));
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-cancel").addEventListener("click", closeModal);
  modal.addEventListener("mousedown", (e) => { if (e.target === modal) closeModal(); });

  // Prende o foco dentro do modal enquanto está aberto
  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = $$("button, input, textarea, select", modal).filter((el) => !el.disabled);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* =====================================================
     Filtros, vistas e pesquisa
     ===================================================== */
  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    state.filter = btn.dataset.filter;
    render();
  });

  $$(".nav-item[data-view]").forEach((btn) => btn.addEventListener("click", () => {
    state.view = btn.dataset.view;
    render();
    setSidebar(false);
  }));

  searchInput.addEventListener("input", () => { state.search = searchInput.value; render(); });

  /* =====================================================
     Menu lateral (mobile)
     ===================================================== */
  function setSidebar(open) {
    sidebar.classList.toggle("open", open);
    scrim.hidden = !open;
    document.body.classList.toggle("no-scroll", open);
    if (open) $(".nav-item", sidebar).focus();
  }
  $("#open-sidebar").addEventListener("click", () => setSidebar(true));
  scrim.addEventListener("click", () => setSidebar(false));
  matchMedia("(min-width: 851px)").addEventListener("change", (e) => { if (e.matches) setSidebar(false); });

  /* =====================================================
     Atalhos de teclado
     ===================================================== */
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  $("#shortcut").textContent = isMac ? "⌘ K" : "Ctrl K";

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }
    if (e.key !== "Escape") return;
    if (!modal.hidden) closeModal();
    else if (state.menuId !== null) { const id = state.menuId; state.menuId = null; render(); $(`[data-menu="${id}"]`, list)?.focus(); }
    else if (sidebar.classList.contains("open")) setSidebar(false);
    else if (document.activeElement === searchInput && searchInput.value) { searchInput.value = ""; state.search = ""; render(); }
    else if (!toast.hidden) hideToast();
  });

  /* =====================================================
     Início
     ===================================================== */
  render();
})();
