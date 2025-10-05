// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * Board.DetailUtil – gemeinsame Utilities für das Task-Detail.
 */
(function (w) {
  const Win = /** @type {any} */ (w);
  Win.Board = Win.Board || {};

  /** @typedef {"urgent"|"medium"|"low"} TaskPriority */
  /** @typedef {{title:string,done:boolean}} Subtask */
  /** @typedef {{ id:string, title?:string, description?:string, category?:string, dueDate?:string, priority?:TaskPriority, status:string, assignedTo?:string[]|string, subtasks?:Subtask[] }} Task */

  // ───────────────────────────────────────────────────────────────────
  // Klassen / Datum
  // ───────────────────────────────────────────────────────────────────
  /**
   * @param {string=} category
   * @returns {string}
   */
  function getDetailCategoryClass(category) {
    const c = (category || '').toLowerCase();
    if (c.includes('bug')) return 'task-detail-badge cat-bug';
    if (c.includes('user')) return 'task-detail-badge cat-userstory';
    if (c.includes('tech')) return 'task-detail-badge cat-technicaltask';
    if (c.includes('research')) return 'task-detail-badge cat-research';
    return 'task-detail-badge';
  }

  /**
   * @param {string=} due
   * @returns {string}
   */
  function formatDueDate(due) {
    if (!due) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(due)) return due;
    if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
      const dt = new Date(due);
      if (!isNaN(+dt)) {
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${mm}/${dd}/${dt.getFullYear()}`;
      }
    }
    return due;
  }

  // ───────────────────────────────────────────────────────────────────
  // Subtasks: Inline-Edit
  // ───────────────────────────────────────────────────────────────────
  /**
   * @param {HTMLLIElement} li
   * @param {number} idx
   * @param {Task} task
   */
  function editSubtaskInline(li, idx, task) {
    const { input, old, actions } = createTitleInput(li);
    const save   = () => saveTitle(li, idx, task, input.value.trim() || old, actions);
    const cancel = () => saveTitle(li, idx, task, old, actions);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') cancel();
    });
    input.addEventListener('blur', save);
    input.focus();
  }

  /** @param {HTMLLIElement} li */
  function createTitleInput(li) {
    const span = /** @type {HTMLSpanElement} */ (li.querySelector('.subtask-title'));
    const actions = /** @type {HTMLElement} */ (li.querySelector('.subtask-actions'));
    const old = span.textContent || '';
    const input = document.createElement('input');
    input.type = 'text'; input.value = old; input.style.width = '70%';
    span.replaceWith(input);
    return { input, old, actions };
  }

  /**
   * @param {HTMLLIElement} li
   * @param {number} idx
   * @param {Task} task
   * @param {string} title
   * @param {HTMLElement} actions
   */
  function saveTitle(li, idx, task, title, actions) {
    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    task.subtasks[idx].title = title;
    const input = /** @type {HTMLInputElement} */ (li.querySelector('input[type="text"]'));
    const ns = document.createElement('span');
    ns.className = 'subtask-title'; ns.textContent = title; ns.style.flex = '1';
    input.replaceWith(ns);
    if (actions) actions.style.display = 'none';
  }

  // ───────────────────────────────────────────────────────────────────
  // Subtasks: Edit-UI Renderer
  // ───────────────────────────────────────────────────────────────────
  /**
   * @param {HTMLDivElement} container
   * @param {Task} task
   */
  function renderSubtasksEdit(container, task) {
    container.innerHTML = '';
    const inp = makeInputRow(container, () => addSubtaskFromInput(inp, task, container));
    const ul = buildList(container);
    (Array.isArray(task.subtasks) ? task.subtasks : []).forEach((st, i) => {
      if (!st.title) return;
      ul.appendChild(liForSubtask(st, i, task, () => renderSubtasksEdit(container, task)));
    });
  }

  /**
   * @param {HTMLDivElement} container
   * @param {() => void} onAdd
   */
  function makeInputRow(container, onAdd) {
    const row = document.createElement('div'); row.className = 'subtask-input-row';
    const inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = 'Add subtask'; inp.className = 'edit-subtask-input'; inp.style.flex = '1';
    const btn = document.createElement('button'); btn.type = 'button'; btn.innerHTML = '<img src="../assets/icons/add_task/subtask_icon.png" style="width:20px" alt="">'; btn.className = 'add-subtask-btn';
    row.append(inp, btn); container.appendChild(row);
    btn.onclick = onAdd;
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } });
    return inp;
  }

  /** @param {HTMLDivElement} container */ function buildList(container) {
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none'; ul.style.padding = '0'; ul.style.margin = '0';
    container.appendChild(ul); return ul;
  }

  /**
   * @param {HTMLInputElement} inp
   * @param {Task} task
   * @param {HTMLDivElement} container
   */
  function addSubtaskFromInput(inp, task, container) {
    const v = inp.value.trim(); if (!v) return;
    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    task.subtasks.push({ title: v, done: false });
    inp.value = ''; renderSubtasksEdit(container, task);
  }

  /**
   * @param {Subtask} st
   * @param {number} idx
   * @param {Task} task
   * @param {() => void} rerender
   */
  function liForSubtask(st, idx, task, rerender) {
    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.gap = '7px'; li.style.marginBottom = '4px';
    li.innerHTML = liMarkup(st);
    wireLi(li, idx, task, rerender);
    return li;
  }

  /** @param {Subtask} st */ function liMarkup(st) {
    return `
      <input type="checkbox" ${st.done ? 'checked' : ''} style="margin:0;">
      <span class="subtask-title" style="flex:1;">${st.title}</span>
      <span class="subtask-actions" style="display:none;">
        <button type="button" class="subtask-edit-btn" title="Bearbeiten"><img src="../assets/icons/add_task/edit.png" style="width:16px" alt=""></button>
        <button type="button" class="subtask-delete-btn" title="Löschen"><img src="../assets/icons/board/delete.png" style="width:17px" alt=""></button>
      </span>`;
  }

  /**
   * @param {HTMLLIElement} li
   * @param {number} idx
   * @param {Task} task
   * @param {() => void} rerender
   */
  function wireLi(li, idx, task, rerender) {
    const cb = /** @type {HTMLInputElement} */ (li.querySelector('input[type="checkbox"]'));
    cb.addEventListener('change', (e) => { if (!Array.isArray(task.subtasks)) task.subtasks = []; task.subtasks[idx].done = (/** @type {HTMLInputElement} */(e.currentTarget)).checked; });
    li.addEventListener('mouseenter', () => { (/** @type {HTMLElement} */ (li.querySelector('.subtask-actions'))).style.display = 'inline-flex'; });
    li.addEventListener('mouseleave', () => { (/** @type {HTMLElement} */ (li.querySelector('.subtask-actions'))).style.display = 'none'; });
    (/** @type {HTMLButtonElement} */ (li.querySelector('.subtask-edit-btn'))).addEventListener('click', () => editSubtaskInline(li, idx, task));
    (/** @type {HTMLButtonElement} */ (li.querySelector('.subtask-delete-btn'))).addEventListener('click', () => { if (!Array.isArray(task.subtasks)) task.subtasks = []; task.subtasks.splice(idx, 1); rerender(); });
  }

  // ───────────────────────────────────────────────────────────────────
  // Delete-Dialog
  // ───────────────────────────────────────────────────────────────────
  /**
   * @param {string} taskId
   * @param {HTMLDialogElement=} parent
   */
  function showDeleteConfirmDialog(taskId, parent) {
    const dlg = /** @type {HTMLDialogElement} */ (document.getElementById('deleteConfirmDialog'));
    dlg.showModal();
    (/** @type {HTMLButtonElement} */ (document.getElementById('confirmDeleteBtn'))).onclick = () => {
      firebase.database().ref('tasks/' + taskId).remove().then(() => { dlg.close(); parent?.close?.(); });
    };
    (/** @type {HTMLButtonElement} */ (document.getElementById('cancelDeleteBtn'))).onclick = () => dlg.close();
  }

  // Export
  Win.Board.DetailUtil = {
    getDetailCategoryClass,
    formatDueDate,
    editSubtaskInline,
    renderSubtasksEdit,
    showDeleteConfirmDialog,
  };
})(window);
