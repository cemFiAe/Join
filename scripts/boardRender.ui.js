// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * @fileoverview
 * UI-/Karten-/Move-Menü-/Drag&Drop-Funktionen für das Board.
 * Stellt `window.Board.RenderUI` bereit – wird von boardRender.js genutzt.
 */

(function (w) {
  /** @type {any} */ const Win = w;
  Win.Board = Win.Board || {};
  /** @type {any} */ const Assigned = (Win.Board.Assigned);

  /** @typedef {"todo"|"inprogress"|"awaitingfeedback"|"done"} TaskStatus */
  /** @typedef {"urgent"|"medium"|"low"} TaskPriority */
  /** @typedef {{title:string,done:boolean}} Subtask */
  /** @typedef {{ id:string, title?:string, description?:string, category?:string, dueDate?:string, priority?:TaskPriority, status:TaskStatus, assignedTo?:string[]|string, subtasks?:Subtask[] }} Task */

  /** Spalten-IDs im DOM je Status. */
  const COLS  = /** @type {Record<TaskStatus,string>} */ ({ todo:'toDo', inprogress:'inProgress', awaitingfeedback:'awaitFeedback', done:'done' });
  /** Ordnung der Spalten (für Nachbarberechnung). */
  const ORDER = /** @type {TaskStatus[]} */ (['todo','inprogress','awaitingfeedback','done']);
  /** Lesbare Labels für das Move-Menü. */
  const LABEL = /** @type {Record<TaskStatus,string>} */ ({ todo:'To-do', inprogress:'In progress', awaitingfeedback:'Review', done:'Done' });

  /** ID der aktuell gezogenen Karte (Drag & Drop). */
  /** @type {string|null} */
  let draggedTaskId = null;

  // ───────────────────────────────────────────────────────────────
  // Move-Menü
  // ───────────────────────────────────────────────────────────────

  /** Singleton-Element für das mobile Move-Menü. */
  /** @type {HTMLDivElement|null} */
  let menuEl = null;

  /**
   * Liefert den benachbarten Status (eine Spalte hoch/runter).
   * @param {TaskStatus} st - Ausgangsstatus der Karte.
   * @param {'up'|'down'} dir - Richtung (hoch/runter).
   * @returns {TaskStatus|null} Nächster Status oder `null`, wenn Rand erreicht.
   */
  function adjacent(st, dir) {
    const i = ORDER.indexOf(st); if (i < 0) return null;
    return dir === 'up' ? (i > 0 ? ORDER[i - 1] : null) : (i < ORDER.length - 1 ? ORDER[i + 1] : null);
  }

  /**
   * Persistiert einen Statuswechsel in Firebase.
   * @param {string} id - Task-ID.
   * @param {TaskStatus} st - Neuer Status.
   * @returns {void}
   */
  function moveTaskToStatus(id, st) {
    if (!st) return; firebase.database().ref('tasks/' + id + '/status').set(st);
  }

  /**
   * Liefert das Menü-Element (erzeugt es bei Bedarf).
   * @returns {HTMLDivElement} Menü-Container.
   */
  function getMenu() {
    if (menuEl) return menuEl;
    menuEl = createMenuEl(); wireOutsideClose(menuEl); return menuEl;
  }

  /**
   * Erzeugt den DOM-Knoten für das Move-Menü.
   * @returns {HTMLDivElement} Neu erstelltes Menü.
   */
  function createMenuEl() {
    const el = document.createElement('div');
    el.className = 'move-menu'; el.style.display = 'none';
    el.innerHTML = `
      <h5>Move to</h5>
      <div class="item item-up"><span class="arrow">↑</span><span class="label-up"></span></div>
      <div class="item item-down"><span class="arrow">↓</span><span class="label-down"></span></div>`;
    document.body.appendChild(el); return el;
  }

  /**
   * Schließt das Menü bei Außenklick.
   * @param {HTMLDivElement} el - Menü-Element.
   * @returns {void}
   */
  function wireOutsideClose(el) {
    document.addEventListener('click', (e) => {
      if (el.style.display === 'none') return;
      if (!(e.target instanceof Node)) return;
      if (!el.contains(e.target)) el.style.display = 'none';
    });
  }

  /**
   * Positioniert das Menü rechts neben einer Karte.
   * @param {HTMLDivElement} el - Menü-Element.
   * @param {DOMRect} r - Bounding-Client-Rect der Karte.
   * @returns {void}
   */
  function positionMenu(el, r) {
    el.style.left = Math.min(window.innerWidth - 180, r.right + 8) + 'px';
    el.style.top  = Math.max(8, r.top) + 'px';
    el.style.display = 'block';
  }

  /**
   * Schreibt die Ziel-Labels in das Menü.
   * @param {HTMLDivElement} el - Menü-Element.
   * @param {TaskStatus|null} up - Oberes Ziel.
   * @param {TaskStatus|null} dn - Unteres Ziel.
   * @returns {void}
   */
  function setMoveLabels(el, up, dn) {
    (/** @type {HTMLSpanElement} */ (el.querySelector('.label-up'))).textContent   = up ? LABEL[up] : '';
    (/** @type {HTMLSpanElement} */ (el.querySelector('.label-down'))).textContent = dn ? LABEL[dn] : '';
  }

  /**
   * Aktiviert/Deaktiviert einen Menüeintrag visuell & interaktiv.
   * @param {HTMLElement} n - Menüzeile.
   * @param {boolean} enabled - Aktiv?
   * @returns {void}
   */
  function setItemState(n, enabled) {
    n.style.opacity = enabled ? '1' : '.35';
    n.style.pointerEvents = enabled ? 'auto' : 'none';
    n.style.display = enabled ? 'flex' : 'none';
  }

  /**
   * Schaltet Menüzeilen basierend auf gültigen Zielen um.
   * @param {HTMLDivElement} el - Menü-Element.
   * @param {TaskStatus|null} up - Oberes Ziel.
   * @param {TaskStatus|null} dn - Unteres Ziel.
   * @returns {void}
   */
  function enableDisableItems(el, up, dn) {
    const upI = /** @type {HTMLDivElement} */ (el.querySelector('.item-up'));
    const dnI = /** @type {HTMLDivElement} */ (el.querySelector('.item-down'));
    setItemState(upI, !!up); setItemState(dnI, !!dn);
    // alte Handler entfernen (durch Klonen)
    upI.replaceWith(upI.cloneNode(true)); dnI.replaceWith(dnI.cloneNode(true));
  }

  /**
   * Bindet Click-Handler zum Verschieben.
   * @param {HTMLDivElement} el - Menü-Element.
   * @param {Task} task - Aktuelle Task.
   * @param {TaskStatus|null} up - Oberes Ziel.
   * @param {TaskStatus|null} dn - Unteres Ziel.
   * @returns {void}
   */
  function bindMoveClicks(el, task, up, dn) {
    if (up) (/** @type {HTMLDivElement} */ (el.querySelector('.item-up')))
      .addEventListener('click', () => { moveTaskToStatus(task.id, up); el.style.display = 'none'; });
    if (dn) (/** @type {HTMLDivElement} */ (el.querySelector('.item-down')))
      .addEventListener('click', () => { moveTaskToStatus(task.id, dn); el.style.display = 'none'; });
  }

  /**
   * Öffnet das Move-Menü neben der angegebenen Karte.
   * @param {HTMLElement} card - Karten-Element.
   * @param {Task} task - Zugehöriger Task.
   * @returns {void}
   */
  function showMoveMenuForCard(card, task) {
    const el = getMenu(); positionMenu(el, card.getBoundingClientRect());
    const up = adjacent(task.status, 'up'); const dn = adjacent(task.status, 'down');
    setMoveLabels(el, up, dn); enableDisableItems(el, up, dn); bindMoveClicks(el, task, up, dn);
  }

  // ───────────────────────────────────────────────────────────────
  // Karten
  // ───────────────────────────────────────────────────────────────

  /**
   * Liefert die Header-CSS-Klasse anhand der Kategorie.
   * @param {string=} category - Kategorie (frei benannt).
   * @returns {string} CSS-Klassenstring.
   */
  function getCategoryHeaderClass(category) {
    const c = (category || "").toLowerCase();
    if (c.includes("bug")) return "task-header bug-task";
    if (c.includes("user")) return "task-header user-task";
    if (c.includes("tech")) return "task-header tech-task";
    if (c.includes("research")) return "task-header research-task";
    return "task-header";
  }

  /**
   * Berechnet Subtask-Fortschritt.
   * @param {Task} task
   * @returns {{total:number,done:number,percent:number}} Aggregierter Fortschritt.
   */
  function calcProgress(task) {
    const total = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
    const done  = Array.isArray(task.subtasks) ? task.subtasks.filter(s => s.done).length : 0;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  /**
   * Liefert den Prio-Icon-Namen (ohne .svg).
   * @param {Task} task
   * @returns {string} Icon-Basename.
   */
  function prioIconFor(task) {
    /** @type {Record<TaskPriority,string>} */ const map = { urgent:'prio_top', medium:'prio_mid', low:'prio_low' };
    return map[task.priority || 'medium'] || 'prio_mid';
  }

  /**
   * Normalisiert assignedTo zu einem string-Array.
   * @param {string[]|string|undefined} a
   * @returns {string[]} IDs.
   */
  function normalizeAssigned(a) {
    return Array.isArray(a) ? a.filter(Boolean).map(String) : (a ? [String(a)] : []);
  }

  /**
   * Baut HTML für Profil-Badges (+ Overflow).
   * @param {Task} task
   * @returns {string} Rohes HTML für Avatare.
   */
  function badgesHtml(task) {
    const ids = normalizeAssigned(task.assignedTo); const vis = ids.slice(0, 4); const over = ids.length - vis.length;
    const base = vis.map(id => Assigned?.getProfileBadge?.(id) || '').join('');
    return base + (over > 0 ? `<span class="profile-badge more-badge" title="+${over} more">+${over}</span>` : '');
  }

  /**
   * Erzeugt optionalen Fortschrittsbalken für Subtasks.
   * @param {{total:number,done:number,percent:number}} p - Fortschrittswerte.
   * @returns {string} HTML oder leerer String.
   */
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

  /**
   * Baut das DOM-Element einer Task-Karte (ohne Events).
   * @param {Task} task
   * @returns {HTMLDivElement} Karten-Element.
   */
  function buildCardEl(task) {
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
    return /** @type {HTMLDivElement} */(card);
  }

  /**
   * Ergänzt die Karte um den mobilen Move-Button.
   * @param {HTMLElement} card - Kartenknoten.
   * @param {Task} task - Zugehöriger Task.
   * @returns {void}
   */
  function wireMoveBtn(card, task) {
    const btn = document.createElement('button');
    btn.className = 'mobile-move-btn'; btn.type = 'button';
    btn.innerHTML = `<img src="../assets/icons/board/switch.png" alt="">`;
    btn.addEventListener('click', (e) => { e.stopPropagation(); showMoveMenuForCard(card, task); });
    card.appendChild(btn);
  }

  /**
   * Aktiviert Drag & Drop auf der Karte.
   * @param {HTMLElement} card - Kartenknoten.
   * @returns {void}
   */
  function wireDrag(card) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', function () {
      draggedTaskId = this.getAttribute('data-task-id'); setTimeout(() => this.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', function () {
      draggedTaskId = null; this.classList.remove('dragging');
    });
  }

  /**
   * Öffnet Detaildialog & Kontextmenü-Handler.
   * @param {HTMLElement} card - Kartenknoten.
   * @param {Task} task - Zugehöriger Task.
   * @returns {void}
   */
  function wireDetail(card, task) {
    card.addEventListener('click', () => (/** @type {any} */ (Win.Board?.Detail))?.openTaskDetail?.(task));
    card.addEventListener('contextmenu', (e) => { e.preventDefault(); showMoveMenuForCard(card, task); });
  }

  /**
   * Erzeugt eine interaktive Task-Karte (DOM + Events).
   * @param {Task} task
   * @returns {HTMLDivElement} Fertige Karteninstanz.
   */
  function createTaskCard(task) {
    const card = buildCardEl(task);
    card.dataset.taskId = task.id;
    wireMoveBtn(card, task); wireDrag(card); wireDetail(card, task);
    return /** @type {HTMLDivElement} */ (card);
  }

  // ───────────────────────────────────────────────────────────────
  // Drop-Zonen
  // ───────────────────────────────────────────────────────────────

  /**
   * Aktiviert Dragover auf einer Spalte (Drop erlauben).
   * @param {HTMLDivElement} el - Spaltenelement.
   * @returns {void}
   */
  function onDragOver(el) { el.addEventListener('dragover', e => e.preventDefault()); }

  /**
   * Behandelt Drop auf einer Spalte und schreibt Status.
   * @param {HTMLDivElement} el - Spaltenelement.
   * @returns {void}
   */
  function onDrop(el) {
    el.addEventListener('drop', function (e) {
      e.preventDefault(); this.classList.remove('drop-target'); if (!draggedTaskId) return;
      /** @type {Record<string, TaskStatus>} */ const map = { toDo:'todo', inProgress:'inprogress', awaitFeedback:'awaitingfeedback', done:'done' };
      const st = map[this.id]; if (st) moveTaskToStatus(draggedTaskId, st);
    });
  }

  /**
   * Markiert Spalte als Drop-Target, sobald Drag betritt.
   * @param {HTMLDivElement} el - Spaltenelement.
   * @returns {void}
   */
  function onDragEnter(el) { el.addEventListener('dragenter', function () { this.classList.add('drop-target'); }); }

  /**
   * Entfernt Drop-Target-Markierung beim Verlassen.
   * @param {HTMLDivElement} el - Spaltenelement.
   * @returns {void}
   */
  function onDragLeave(el) { el.addEventListener('dragleave', function () { this.classList.remove('drop-target'); }); }

  /**
   * Verdrahtet eine Spalte als Drop-Zone.
   * @param {string} id - DOM-ID der Spalte.
   * @returns {void}
   */
  function initDropZoneById(id) {
    const el = /** @type {HTMLDivElement|null} */ (document.getElementById(id));
    if (!el) return; onDragOver(el); onDrop(el); onDragEnter(el); onDragLeave(el);
  }

  /**
   * Initialisiert alle vier Spalten als Drop-Zonen.
   * @returns {void}
   */
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
