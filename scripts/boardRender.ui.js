// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * @fileoverview
 * UI / Card / Move Menu / Drag & Drop functions for the Board.
 * Exposes `window.Board.RenderUI` used by boardRender.js.
 */

(function (w) {
  /** @type {any} */
  const Win = w;
  Win.Board = Win.Board || {};
  /** @type {any} */
  const Assigned = Win.Board.Assigned;

  /** @typedef {"todo"|"inprogress"|"awaitingfeedback"|"done"} TaskStatus */
  /** @typedef {"urgent"|"medium"|"low"} TaskPriority */
  /** @typedef {{title:string,done:boolean}} Subtask */
  /** @typedef {{ id:string, title?:string, description?:string, category?:string, dueDate?:string, priority?:TaskPriority, status:TaskStatus, assignedTo?:string[]|string, subtasks?:Subtask[] }} Task */

  /** Column IDs per status in DOM */
  const COLS = { todo:'toDo', inprogress:'inProgress', awaitingfeedback:'awaitFeedback', done:'done' };
  /** Column order (for neighbor calculation) */
  const ORDER = ['todo','inprogress','awaitingfeedback','done'];
  /** Labels for move menu */
  const LABEL = { todo:'To-do', inprogress:'In progress', awaitingfeedback:'Review', done:'Done' };

  /** ID of currently dragged task */
  let draggedTaskId = null;

  // ───────────────────────────────────────────────────────────────
  // Move Menu
  // ───────────────────────────────────────────────────────────────

  /** Mobile menu element singleton */
  let menuEl = null;

  /**
   * Returns the adjacent status (up/down) for a column.
   * @param {TaskStatus} st
   * @param {'up'|'down'} dir
   * @returns {TaskStatus|null}
   */
  function adjacent(st, dir) {
    const i = ORDER.indexOf(st);
    if (i < 0) return null;
    return dir === 'up' ? (i > 0 ? ORDER[i - 1] : null) : (i < ORDER.length - 1 ? ORDER[i + 1] : null);
  }

  /**
   * Persists a status change to Firebase
   * @param {string} id
   * @param {TaskStatus} st
   */
  function moveTaskToStatus(id, st) {
    if (!st) return;
    firebase.database().ref('tasks/' + id + '/status').set(st);
  }

  function getMenu() {
    if (menuEl) return menuEl;
    menuEl = createMenuEl();
    wireOutsideClose(menuEl);
    return menuEl;
  }

  function createMenuEl() {
    const el = document.createElement('div');
    el.className = 'move-menu';
    el.style.display = 'none';
    el.innerHTML = `
      <h5>Move to</h5>
      <div class="item item-up"><span class="arrow">↑</span><span class="label-up"></span></div>
      <div class="item item-down"><span class="arrow">↓</span><span class="label-down"></span></div>`;
    document.body.appendChild(el);
    return el;
  }

  function wireOutsideClose(el) {
    document.addEventListener('click', (e) => {
      if (el.style.display === 'none') return;
      if (!(e.target instanceof Node)) return;
      if (!el.contains(e.target)) el.style.display = 'none';
    });
  }

  function positionMenu(el, r) {
    el.style.left = Math.min(window.innerWidth - 180, r.right + 8) + 'px';
    el.style.top = Math.max(8, r.top) + 'px';
    el.style.display = 'block';
  }

  function setMoveLabels(el, up, dn) {
    el.querySelector('.label-up').textContent = up ? LABEL[up] : '';
    el.querySelector('.label-down').textContent = dn ? LABEL[dn] : '';
  }

  function setItemState(n, enabled) {
    n.style.opacity = enabled ? '1' : '.35';
    n.style.pointerEvents = enabled ? 'auto' : 'none';
    n.style.display = enabled ? 'flex' : 'none';
  }

  function enableDisableItems(el, up, dn) {
    const upI = el.querySelector('.item-up');
    const dnI = el.querySelector('.item-down');
    setItemState(upI, !!up);
    setItemState(dnI, !!dn);
    upI.replaceWith(upI.cloneNode(true));
    dnI.replaceWith(dnI.cloneNode(true));
  }

  function bindMoveClicks(el, task, up, dn) {
    if (up) el.querySelector('.item-up').addEventListener('click', () => { moveTaskToStatus(task.id, up); el.style.display = 'none'; });
    if (dn) el.querySelector('.item-down').addEventListener('click', () => { moveTaskToStatus(task.id, dn); el.style.display = 'none'; });
  }

  function showMoveMenuForCard(card, task) {
    const el = getMenu();
    positionMenu(el, card.getBoundingClientRect());
    const up = adjacent(task.status, 'up');
    const dn = adjacent(task.status, 'down');
    setMoveLabels(el, up, dn);
    enableDisableItems(el, up, dn);
    bindMoveClicks(el, task, up, dn);
  }

  // ───────────────────────────────────────────────────────────────
  // Cards
  // ───────────────────────────────────────────────────────────────

  function getCategoryHeaderClass(category) {
    const c = (category || '').toLowerCase();
    if (c.includes('bug')) return 'task-header bug-task';
    if (c.includes('user')) return 'task-header user-task';
    if (c.includes('tech')) return 'task-header tech-task';
    if (c.includes('research')) return 'task-header research-task';
    return 'task-header';
  }

  function calcProgress(task) {
    const total = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
    const done = Array.isArray(task.subtasks) ? task.subtasks.filter(s => s.done).length : 0;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  function prioIconFor(task) {
    const map = { urgent:'prio_top', medium:'prio_mid', low:'prio_low' };
    return map[task.priority || 'medium'] || 'prio_mid';
  }

  function normalizeAssigned(a) {
    return Array.isArray(a) ? a.filter(Boolean).map(String) : (a ? [String(a)] : []);
  }

  function badgesHtml(task) {
    const ids = normalizeAssigned(task.assignedTo);
    const vis = ids.slice(0, 4);
    const over = ids.length - vis.length;
    const base = vis.map(id => Assigned?.getProfileBadge?.(id) || '').join('');
    return base + (over > 0 ? `<span class="profile-badge more-badge" title="+${over} more">+${over}</span>` : '');
  }

  function subBarHtml(p) {
    if (!(p.total > 0 && p.done > 0)) return '';
    return `
      <div class="task-bar">
        <div class="bar-wrapper">
          <div class="progress-bar"><span class="progress-bar-fill" style="width:${p.percent}%"></span></div>
        </div>
        <span class="sub-task">${p.done}/${p.total} Subtasks</span>
      </div>`;
  }

  function buildCardEl(task) {
    const prioIcon = prioIconFor(task);
    const p = calcProgress(task);
    const card = document.createElement('div');
    card.className = 'task';
    const headerClass = getCategoryHeaderClass(task.category || '');
    card.innerHTML = `
      <span class="${headerClass}">${task.category || ''}</span>
      <h4 class="task-title">${task.title || ''}</h4>
      <p class="task-info">${task.description || ''}</p>
      ${subBarHtml(p)}
      <div class="task-status">
        <div>${badgesHtml(task)}</div>
        <img class="prio-icon" src="../assets/icons/board/prio/${prioIcon}.svg" alt="">
      </div>`;
    return card;
  }

  function wireMoveBtn(card, task) {
    const btn = document.createElement('button');
    btn.className = 'mobile-move-btn';
    btn.type = 'button';
    btn.innerHTML = `<img src="../assets/icons/board/switch.png" alt="">`;
    btn.addEventListener('click', (e) => { e.stopPropagation(); showMoveMenuForCard(card, task); });
    card.appendChild(btn);
  }

  function wireDrag(card) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', (e) => {
      draggedTaskId = card.dataset.taskId;
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', (e) => {
      draggedTaskId = null;
      card.classList.remove('dragging');
    });
  }

  function wireDetail(card, task) {
    card.addEventListener('click', () => Win.Board?.Detail?.openTaskDetail?.(task));
    card.addEventListener('contextmenu', (e) => { e.preventDefault(); showMoveMenuForCard(card, task); });
  }

  function createTaskCard(task) {
    const card = buildCardEl(task);
    card.dataset.taskId = task.id;
    wireMoveBtn(card, task);
    wireDrag(card);
    wireDetail(card, task);
    return card;
  }

  // ───────────────────────────────────────────────────────────────
  // Drop Zones
  // ───────────────────────────────────────────────────────────────

  function onDragOver(el) {
    el.addEventListener('dragover', (e) => e.preventDefault());
  }

  function onDrop(el) {
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const target = e.currentTarget;
      target.classList.remove('drop-target');
      if (!draggedTaskId) return;

      const map = { toDo:'todo', inProgress:'inprogress', awaitFeedback:'awaitingfeedback', done:'done' };
      const st = map[target.id];
      if (st) moveTaskToStatus(draggedTaskId, st);
    });
  }

  function onDragEnter(el) {
    el.addEventListener('dragenter', (e) => {
      e.currentTarget.classList.add('drop-target');
    });
  }

  function onDragLeave(el) {
    el.addEventListener('dragleave', (e) => {
      e.currentTarget.classList.remove('drop-target');
    });
  }

  function initDropZoneById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    onDragOver(el);
    onDrop(el);
    onDragEnter(el);
    onDragLeave(el);
  }

  function initAllDropZones() {
    ['toDo', 'inProgress', 'awaitFeedback', 'done'].forEach(initDropZoneById);
  }

  // ───────────────────────────────────────────────────────────────
  // Export
  // ───────────────────────────────────────────────────────────────

  Win.Board.RenderUI = {
    COLS, ORDER, LABEL,
    adjacent, moveTaskToStatus, getMenu, createMenuEl, wireOutsideClose,
    positionMenu, setMoveLabels, setItemState, enableDisableItems, bindMoveClicks,
    showMoveMenuForCard,
    getCategoryHeaderClass, calcProgress, prioIconFor, normalizeAssigned, badgesHtml, subBarHtml,
    buildCardEl, wireMoveBtn, wireDrag, wireDetail, createTaskCard,
    initDropZoneById, initAllDropZones,
  };
})(window);