// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * Board-Rendering & Interaktion (Karten, DnD, Suche, Mobile-Move-Menü).
 * Exportiert unter `window.Board.Render`.
 */
(function (w) {
  /** @type {any} */ const Win = (w);
  Win.Board = Win.Board || {};
  /** @type {any} */ const Assigned = (Win.Board.Assigned);

  /** @typedef {"todo"|"inprogress"|"awaitingfeedback"|"done"} TaskStatus */
  /** @typedef {"urgent"|"medium"|"low"} TaskPriority */
  /** @typedef {{title:string,done:boolean}} Subtask */
  /** @typedef {{ id:string, title?:string, description?:string, category?:string, dueDate?:string, priority?:TaskPriority, status:TaskStatus, assignedTo?:string[]|string, subtasks?:Subtask[] }} Task */

  const COLS  = /** @type {Record<TaskStatus,string>} */ ({ todo:'toDo', inprogress:'inProgress', awaitingfeedback:'awaitFeedback', done:'done' });
  const ORDER = /** @type {TaskStatus[]} */ (['todo','inprogress','awaitingfeedback','done']);
  const LABEL = /** @type {Record<TaskStatus,string>} */ ({ todo:'To-do', inprogress:'In progress', awaitingfeedback:'Review', done:'Done' });

  /** @type {Task[]} */ let tasks = [];
  /** @type {string|null} */ let draggedTaskId = null;

  // ───────────────────────────────────────────────────────────────
  // Move-Menü (Singleton)
  // ───────────────────────────────────────────────────────────────
  /** @type {HTMLDivElement|null} */ let menuEl = null;

  /** @returns {TaskStatus|null} */
  function adjacent(st, dir) {
    const i = ORDER.indexOf(st); if (i < 0) return null;
    return dir === 'up' ? (i > 0 ? ORDER[i - 1] : null) : (i < ORDER.length - 1 ? ORDER[i + 1] : null);
  }

  /** @returns {void} */
  function moveTaskToStatus(id, st) {
    if (!st) return;
    firebase.database().ref('tasks/' + id + '/status').set(st);
  }

  /** @returns {HTMLDivElement} */
  function getMenu() {
    if (menuEl) return menuEl;
    menuEl = createMenuEl();
    wireOutsideClose(menuEl);
    return menuEl;
  }

  /** @returns {HTMLDivElement} */
  function createMenuEl() {
    const el = document.createElement('div');
    el.className = 'move-menu'; el.style.display = 'none';
    el.innerHTML = `
      <h5>Move to</h5>
      <div class="item item-up"><span class="arrow">↑</span><span class="label-up"></span></div>
      <div class="item item-down"><span class="arrow">↓</span><span class="label-down"></span></div>`;
    document.body.appendChild(el);
    return el;
  }

  /** @returns {void} */
  function wireOutsideClose(el) {
    document.addEventListener('click', (e) => {
      if (el.style.display === 'none') return;
      if (!(e.target instanceof Node)) return;
      if (!el.contains(e.target)) el.style.display = 'none';
    });
  }

  /** @returns {void} */
  function positionMenu(el, r) {
    el.style.left = Math.min(window.innerWidth - 180, r.right + 8) + 'px';
    el.style.top  = Math.max(8, r.top) + 'px';
    el.style.display = 'block';
  }

  /** @returns {void} */
  function setMoveLabels(el, up, dn) {
    (/** @type {HTMLSpanElement} */ (el.querySelector('.label-up'))).textContent   = up ? LABEL[up] : '';
    (/** @type {HTMLSpanElement} */ (el.querySelector('.label-down'))).textContent = dn ? LABEL[dn] : '';
  }

  /** @returns {void} */
  function setItemState(n, enabled) {
    n.style.opacity = enabled ? '1' : '.35';
    n.style.pointerEvents = enabled ? 'auto' : 'none';
    n.style.display = enabled ? 'flex' : 'none';
  }

  /** @returns {void} */
  function enableDisableItems(el, up, dn) {
    const upI = /** @type {HTMLDivElement} */ (el.querySelector('.item-up'));
    const dnI = /** @type {HTMLDivElement} */ (el.querySelector('.item-down'));
    setItemState(upI, !!up); setItemState(dnI, !!dn);
    upI.replaceWith(upI.cloneNode(true)); dnI.replaceWith(dnI.cloneNode(true));
  }

  /** @returns {void} */
  function bindMoveClicks(el, task, up, dn) {
    if (up) (/** @type {HTMLDivElement} */ (el.querySelector('.item-up')))
      .addEventListener('click', () => { moveTaskToStatus(task.id, up); el.style.display = 'none'; });
    if (dn) (/** @type {HTMLDivElement} */ (el.querySelector('.item-down')))
      .addEventListener('click', () => { moveTaskToStatus(task.id, dn); el.style.display = 'none'; });
  }

  /** @returns {void} */
  function showMoveMenuForCard(card, task) {
    const el = getMenu(); positionMenu(el, card.getBoundingClientRect());
    const up = adjacent(task.status, 'up'); const dn = adjacent(task.status, 'down');
    setMoveLabels(el, up, dn); enableDisableItems(el, up, dn); bindMoveClicks(el, task, up, dn);
  }

  // ───────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────
  /** @returns {void} */
  function clearColumns() {
    Object.values(COLS).forEach(id => {
      const col = /** @type {HTMLDivElement} */ (document.getElementById(id));
      if (col) col.innerHTML = '';
    });
  }

  /** @returns {void} */
  function mountCards(arr) {
    arr.forEach(t => {
      const mount = document.getElementById(COLS[t.status]);
      if (mount) mount.appendChild(createTaskCard(t));
    });
  }

  /** @returns {void} */
  function showEmptyPlaceholders(arr) {
    Object.entries(COLS).forEach(([st, id]) => {
      const any = arr.some(t => t.status === /** @type {TaskStatus} */ (st));
      if (!any) {
        const col = document.getElementById(id);
        if (col) col.innerHTML = `<div class="notask">No tasks ${st.replace(/^\w/, c => c.toUpperCase())}</div>`;
      }
    });
  }

  /**
   * @param {Task[]} arr
   * @returns {void}
   */
  function renderBoard(arr) {
    clearColumns();
    mountCards(arr);
    showEmptyPlaceholders(arr);
  }

  // ───────────────────────────────────────────────────────────────
  // Karten
  // ───────────────────────────────────────────────────────────────
  /** @param {string=} category */ function getCategoryHeaderClass(category) {
    const c = (category || "").toLowerCase();
    if (c.includes("bug")) return "task-header bug-task";
    if (c.includes("user")) return "task-header user-task";
    if (c.includes("tech")) return "task-header tech-task";
    if (c.includes("research")) return "task-header research-task";
    return "task-header";
  }

  /** @param {Task} task */ function calcProgress(task) {
    const total = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
    const done  = Array.isArray(task.subtasks) ? task.subtasks.filter(s => s.done).length : 0;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  /** @param {Task} task */ function prioIconFor(task) {
    /** @type {Record<TaskPriority,string>} */ const map = { urgent:'prio_top', medium:'prio_mid', low:'prio_low' };
    return map[task.priority || 'medium'] || 'prio_mid';
  }

  /** @param {(string[]|string|undefined)} a */ function normalizeAssigned(a) {
    return Array.isArray(a) ? a.filter(Boolean).map(String) : (a ? [String(a)] : []);
  }

  /** @param {Task} task */ function badgesHtml(task) {
    const ids = normalizeAssigned(task.assignedTo); const vis = ids.slice(0, 4); const over = ids.length - vis.length;
    const base = vis.map(id => Assigned?.getProfileBadge?.(id) || '').join('');
    return base + (over > 0 ? `<span class="profile-badge more-badge" title="+${over} more">+${over}</span>` : '');
  }

  /** @param {{total:number,done:number,percent:number}} p */ function subBarHtml(p) {
    if (!(p.total > 0 && p.done > 0)) return '';
    return `
      <div class="task-bar">
        <div class="bar-wrapper">
          <div class="progress-bar"><span class="progress-bar-fill" style="width:${p.percent}%"></span></div>
        </div>
        <span class="sub-task">${p.done}/${p.total} Subtasks</span>
      </div>`;
  }

  /** @param {Task} task */ function buildCardEl(task) {
    const prioIcon = prioIconFor(task); const p = calcProgress(task);
    const card = document.createElement('div'); card.className = 'task';
    const headerClass = getCategoryHeaderClass(task.category || "");
    card.innerHTML = `
      <span class="${headerClass}">${task.category || ""}</span>
      <h4 class="task-title">${task.title || ""}</h4>
      <p class="task-info">${task.description || ""}</p>
      ${subBarHtml(p)}
      <div class="task-status">
        <div>${badgesHtml(task)}</div>
        <img class="prio-icon" src="../assets/icons/board/prio/${prioIcon}.svg" alt="">
      </div>`;
    return card;
  }

  /** @param {HTMLElement} card @param {Task} task */ function wireMoveBtn(card, task) {
    const btn = document.createElement('button');
    btn.className = 'mobile-move-btn'; btn.type = 'button';
    btn.innerHTML = `<img src="../assets/icons/board/switch.png" alt="">`;
    btn.addEventListener('click', (e) => { e.stopPropagation(); showMoveMenuForCard(card, task); });
    card.appendChild(btn);
  }

  /** @param {HTMLElement} card */ function wireDrag(card) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', function () {
      draggedTaskId = this.getAttribute('data-task-id'); setTimeout(() => this.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', function () {
      draggedTaskId = null; this.classList.remove('dragging');
    });
  }

  /** @param {HTMLElement} card @param {Task} task */ function wireDetail(card, task) {
    card.addEventListener('click', () => (/** @type {any} */ (Win.Board?.Detail))?.openTaskDetail?.(task));
    card.addEventListener('contextmenu', (e) => { e.preventDefault(); showMoveMenuForCard(card, task); });
  }

  /**
   * @param {Task} task
   * @returns {HTMLDivElement}
   */
  function createTaskCard(task) {
    const card = buildCardEl(task);
    card.dataset.taskId = task.id;
    wireMoveBtn(card, task); wireDrag(card); wireDetail(card, task);
    return /** @type {HTMLDivElement} */ (card);
  }

  // ───────────────────────────────────────────────────────────────
  // Drop-Ziele
  // ───────────────────────────────────────────────────────────────
  /** @param {HTMLDivElement} el */ function onDragOver(el) { el.addEventListener('dragover', e => e.preventDefault()); }

  /** @param {HTMLDivElement} el */ function onDrop(el) {
    el.addEventListener('drop', function (e) {
      e.preventDefault(); this.classList.remove('drop-target'); if (!draggedTaskId) return;
      /** @type {Record<string, TaskStatus>} */ const map = { toDo:'todo', inProgress:'inprogress', awaitFeedback:'awaitingfeedback', done:'done' };
      const st = map[this.id]; if (st) moveTaskToStatus(draggedTaskId, st);
    });
  }

  /** @param {HTMLDivElement} el */ function onDragEnter(el) {
    el.addEventListener('dragenter', function () { this.classList.add('drop-target'); });
  }

  /** @param {HTMLDivElement} el */ function onDragLeave(el) {
    el.addEventListener('dragleave', function () { this.classList.remove('drop-target'); });
  }

  /** @returns {void} */
  function initDropZoneById(id) {
    const el = /** @type {HTMLDivElement|null} */ (document.getElementById(id));
    if (!el) return; onDragOver(el); onDrop(el); onDragEnter(el); onDragLeave(el);
  }

  ['toDo', 'inProgress', 'awaitFeedback', 'done'].forEach(initDropZoneById);

  // ───────────────────────────────────────────────────────────────
  // Suche & Stream
  // ───────────────────────────────────────────────────────────────
  /** @param {string} v */ function searchTasks(v) {
    const q = v.trim().toLowerCase();
    const f = t => (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    renderBoard(q ? tasks.filter(f) : tasks);
  }

  /** @returns {void} */
  function wireSearchInputs() {
    const q1 = /** @type {HTMLInputElement|null} */ (document.getElementById('taskSearch'));
    const q2 = /** @type {HTMLInputElement|null} */ (document.getElementById('taskSearchMobile'));
    if (q1) q1.addEventListener('input', e => searchTasks((/** @type {HTMLInputElement} */ (e.currentTarget)).value));
    if (q2) q2.addEventListener('input', e => searchTasks((/** @type {HTMLInputElement} */ (e.currentTarget)).value));
  }

  /** @returns {void} */
  function watchTasks() {
    firebase.database().ref('tasks').on('value', s => {
      const obj = /** @type {Record<string, any>|null} */ (s.val()) || {};
      tasks = Object.values(obj); renderBoard(tasks);
    });
  }

  /** @returns {void} */
  function startTasksStream() {
    watchTasks(); wireSearchInputs();
  }

  // ───────────────────────────────────────────────────────────────
  // Export
  // ───────────────────────────────────────────────────────────────
  Win.Board.Render = { renderBoard, startTasksStream, showMoveMenuForCard };
})(window);
