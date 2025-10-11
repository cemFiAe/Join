// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * @fileoverview
 * Board rendering: populates columns, search, and Firebase stream.
 * Uses UI / card / drag-and-drop functions from `window.Board.RenderUI`.
 * Exported under `window.Board.Render`.
 */

const Win = /** @type {any} */ (window);
Win.Board = Win.Board || {};
const UI = Win.Board.RenderUI; // comes from boardRender.ui.js

/** @typedef {"todo"|"inprogress"|"awaitingfeedback"|"done"} TaskStatus */
/** @typedef {"urgent"|"medium"|"low"} TaskPriority */
/** @typedef {{title:string,done:boolean}} Subtask */
/** @typedef {{ id:string, title?:string, description?:string, category?:string, dueDate?:string, priority?:TaskPriority, status:TaskStatus, assignedTo?:string[]|string, subtasks?:Subtask[] }} Task */

if (!UI) {
  console.error('boardRender.ui.js must be loaded BEFORE boardRender.js.');
} else {

  /** Currently known tasks from the stream */
  /** @type {Task[]} */
  let tasks = [];

  // ───────────────────────────────────────────────────────────────
  // Column rendering
  // ───────────────────────────────────────────────────────────────

  /**
   * Clears all board columns in the DOM.
   */
  function clearColumns() {
    Object.values(UI.COLS).forEach(id => {
      const col = /** @type {HTMLDivElement|null} */ (document.getElementById(id));
      if (col) col.innerHTML = '';
    });
  }

  /**
   * Creates and mounts cards into their corresponding columns.
   * @param {Task[]} arr - List of tasks to render
   */
  function mountCards(arr) {
    arr.forEach(t => {
      const mount = document.getElementById(UI.COLS[t.status]);
      if (mount) mount.appendChild(UI.createTaskCard(t));
    });
  }

  /**
   * Shows "No tasks ..." placeholders for empty columns.
   * @param {Task[]} arr - Tasks to check for emptiness
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
   * Renders the complete board (all columns).
   * @param {Task[]} arr - List of tasks
   */
  function renderBoard(arr) {
    clearColumns();
    mountCards(arr);
    showEmptyPlaceholders(arr);
  }

  // ───────────────────────────────────────────────────────────────
  // Search & Firebase stream
  // ───────────────────────────────────────────────────────────────

  /**
   * Filters tasks by title or description (case-insensitive) and renders them.
   * @param {string} query - Search string
   */
  function searchTasks(query) {
    const q = query.trim().toLowerCase();
    const filterFn = (t /** @type {Task} */) =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q);
    renderBoard(q ? tasks.filter(filterFn) : tasks);
  }

  /**
   * Wires desktop & mobile search inputs to the filter handler.
   */
  function wireSearchInputs() {
    const q1 = /** @type {HTMLInputElement|null} */ (document.getElementById('taskSearch'));
    const q2 = /** @type {HTMLInputElement|null} */ (document.getElementById('taskSearchMobile'));
    if (q1) q1.addEventListener('input', e => searchTasks((/** @type {HTMLInputElement} */ (e.currentTarget)).value));
    if (q2) q2.addEventListener('input', e => searchTasks((/** @type {HTMLInputElement} */ (e.currentTarget)).value));
  }

  /**
   * Subscribes to the Firebase `tasks` stream and renders on updates.
   */
  function watchTasks() {
    firebase.database().ref('tasks').on('value', snapshot => {
      const obj = /** @type {Record<string, any>|null} */ (snapshot.val()) || {};
      tasks = Object.values(obj);
      renderBoard(tasks);
    });
  }

  /**
   * Starts live stream, search inputs, and initializes all drop zones.
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
}
