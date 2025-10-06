// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * @fileoverview
 * Board-Rendering (Spalten füllen), Suche & Firebase-Stream.
 * Nutzt die UI-/Karten-/DnD-Funktionen aus `window.Board.RenderUI`.
 * Exportiert unter `window.Board.Render`.
 */

(function (w) {
  /** @type {any} */ const Win = (w);
  Win.Board = Win.Board || {};
  /** @type {any} */ const UI = Win.Board.RenderUI; // kommt aus boardRender.ui.js

  /** @typedef {"todo"|"inprogress"|"awaitingfeedback"|"done"} TaskStatus */
  /** @typedef {"urgent"|"medium"|"low"} TaskPriority */
  /** @typedef {{title:string,done:boolean}} Subtask */
  /** @typedef {{ id:string, title?:string, description?:string, category?:string, dueDate?:string, priority?:TaskPriority, status:TaskStatus, assignedTo?:string[]|string, subtasks?:Subtask[] }} Task */

  if (!UI) { console.error('boardRender.ui.js muss VOR boardRender.js geladen werden.'); return; }

  /** Aktuell bekannte Tasks (vom Stream). */
  /** @type {Task[]} */
  let tasks = [];

  // ───────────────────────────────────────────────────────────────
  // Render (Spalten)
  // ───────────────────────────────────────────────────────────────

  /**
   * Leert alle Board-Spalten (DOM-Container).
   * @returns {void}
   */
  function clearColumns() {
    Object.values(UI.COLS).forEach(id => {
      const col = /** @type {HTMLDivElement} */ (document.getElementById(id));
      if (col) col.innerHTML = '';
    });
  }

  /**
   * Erzeugt & hängt Karten in die passenden Spalten.
   * @param {Task[]} arr - Liste der zu rendernden Tasks.
   * @returns {void}
   */
  function mountCards(arr) {
    arr.forEach(t => {
      const mount = document.getElementById(UI.COLS[t.status]);
      if (mount) mount.appendChild(UI.createTaskCard(t));
    });
  }

  /**
   * Zeigt „No tasks …“-Platzhalter für leere Spalten.
   * @param {Task[]} arr - Tasks (zum Prüfen der Leere).
   * @returns {void}
   */
  function showEmptyPlaceholders(arr) {
    Object.entries(UI.COLS).forEach(([st, id]) => {
      const any = arr.some(t => t.status === /** @type {TaskStatus} */ (st));
      if (!any) {
        const col = document.getElementById(id);
        if (col) col.innerHTML = `<div class="notask">No tasks ${st.replace(/^\w/, c => c.toUpperCase())}</div>`;
      }
    });
  }

  /**
   * Rendert das komplette Board (alle Spalten).
   * @param {Task[]} arr - Aufgabenliste.
   * @returns {void}
   */
  function renderBoard(arr) {
    clearColumns();
    mountCards(arr);
    showEmptyPlaceholders(arr);
  }

  // ───────────────────────────────────────────────────────────────
  // Suche & Stream
  // ───────────────────────────────────────────────────────────────

  /**
   * Filtert Tasks nach Titel/Beschreibung (case-insensitive) und rendert.
   * @param {string} v - Suchstring.
   * @returns {void}
   */
  function searchTasks(v) {
    const q = v.trim().toLowerCase();
    const f = (t /** @type {Task} */) =>
      (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    renderBoard(q ? tasks.filter(f) : tasks);
  }

  /**
   * Verdrahtet Desktop- & Mobile-Suchfelder mit dem Filterhandler.
   * @returns {void}
   */
  function wireSearchInputs() {
    const q1 = /** @type {HTMLInputElement|null} */ (document.getElementById('taskSearch'));
    const q2 = /** @type {HTMLInputElement|null} */ (document.getElementById('taskSearchMobile'));
    if (q1) q1.addEventListener('input', e => searchTasks((/** @type {HTMLInputElement} */ (e.currentTarget)).value));
    if (q2) q2.addEventListener('input', e => searchTasks((/** @type {HTMLInputElement} */ (e.currentTarget)).value));
  }

  /**
   * Abonniert den Firebase-Stream auf `tasks` und rendert bei Änderungen.
   * @returns {void}
   */
  function watchTasks() {
    firebase.database().ref('tasks').on('value', s => {
      const obj = /** @type {Record<string, any>|null} */ (s.val()) || {};
      tasks = Object.values(obj); renderBoard(tasks);
    });
  }

  /**
   * Startet Live-Stream, Suche & initialisiert alle Drop-Zonen.
   * @returns {void}
   */
  function startTasksStream() {
    UI.initAllDropZones();
    watchTasks();
    wireSearchInputs();
  }

  // ───────────────────────────────────────────────────────────────
  // Export
  // ───────────────────────────────────────────────────────────────

  Win.Board.Render = {
    renderBoard,
    startTasksStream,
    showMoveMenuForCard: UI.showMoveMenuForCard,
  };
})(window);
