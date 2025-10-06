// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * Board.DetailUtil – gemeinsame Utilities für das Task-Detail.
 * Reine Helper (Formatierung, Subtask-UI, Delete-Dialog).
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
   * Liefert die CSS-Klasse für die Kategorie-Badge im Detail-Dialog.
   * Erwartete Styles:
   *  .task-detail-badge.cat-technicaltask | .cat-userstory | .cat-bug | .cat-research
   *
   * @param {string=} category - Kategoriename (z. B. "Bug", "User Story", …).
   * @returns {string} CSS-Klassenstring für das Badge.
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
   * Normalisiert das Fälligkeitsdatum für die Anzeige.
   * Accepts:
   *  - ISO: 'yyyy-mm-dd' → wird in 'mm/dd/yyyy' umgewandelt
   *  - Bereits formatiert: 'mm/dd/yyyy' → unverändert
   *  - Sonst: Rückgabe des Originalstrings
   *
   * @param {string=} due - Datum als String.
   * @returns {string} Formatierter Datumsstring 'mm/dd/yyyy' oder Original.
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
   * Startet Inline-Editing für einen Subtask-Titel.
   * Speichert bei Enter/Blur, verwirft bei Escape.
   *
   * @param {HTMLLIElement} li - Listen-Item des Subtasks.
   * @param {number} idx - Index des Subtasks im Task-Objekt.
   * @param {Task} task - Task-Objekt, dessen Subtasks editiert werden.
   * @returns {void}
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

  /**
   * Ersetzt den Titel-Span durch ein Input-Feld und liefert relevante Referenzen.
   *
   * @param {HTMLLIElement} li - Listen-Item des Subtasks.
   * @returns {{ input: HTMLInputElement, old: string, actions: HTMLElement }}
   *  - input: erzeugtes Textfeld
   *  - old: alter Titeltext
   *  - actions: Actions-Container (wird beim Edit kurz ausgeblendet)
   */
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
   * Persistiert den (ggf. geänderten) Subtask-Titel im Task-Objekt
   * und stellt die ursprüngliche Anzeige (Span) wieder her.
   *
   * @param {HTMLLIElement} li - Listen-Item des Subtasks.
   * @param {number} idx - Index des Subtasks im Task-Objekt.
   * @param {Task} task - Task-Objekt.
   * @param {string} title - Neuer (oder alter) Titel.
   * @param {HTMLElement} actions - Actions-Container, der versteckt wird.
   * @returns {void}
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
   * Rendert die Subtask-Bearbeitungssektion (Input + Liste).
   * Aktualisiert sich selbst nach Add/Delete/Edit.
   *
   * @param {HTMLDivElement} container - Zielcontainer im Detail-Dialog.
   * @param {Task} task - Task-Objekt mit Subtasks.
   * @returns {void}
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
   * Erstellt die Eingabezeile zum Hinzufügen neuer Subtasks.
   *
   * @param {HTMLDivElement} container - Parent-Container.
   * @param {() => void} onAdd - Callback, der beim Hinzufügen ausgelöst wird.
   * @returns {HTMLInputElement} Referenz auf das Input-Feld.
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

  /**
   * Erstellt und hängt eine UL-Liste für Subtasks an den Container.
   *
   * @param {HTMLDivElement} container - Parent-Container.
   * @returns {HTMLUListElement} Erzeugte UL-Liste.
   */
  function buildList(container) {
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none'; ul.style.padding = '0'; ul.style.margin = '0';
    container.appendChild(ul); return ul;
  }

  /**
   * Fügt anhand des Eingabefelds einen Subtask dem Task hinzu
   * und rendert die Subtask-Sektion neu.
   *
   * @param {HTMLInputElement} inp - Eingabefeld (Titel).
   * @param {Task} task - Task-Objekt.
   * @param {HTMLDivElement} container - Parent-Container (für Rerender).
   * @returns {void}
   */
  function addSubtaskFromInput(inp, task, container) {
    const v = inp.value.trim(); if (!v) return;
    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    task.subtasks.push({ title: v, done: false });
    inp.value = ''; renderSubtasksEdit(container, task);
  }

  /**
   * Baut ein Listen-Item (LI) für einen Subtask und verdrahtet Events.
   *
   * @param {Subtask} st - Subtask-Daten.
   * @param {number} idx - Index in task.subtasks.
   * @param {Task} task - Task-Objekt.
   * @param {() => void} rerender - Callback zum Neu-Rendern (z. B. nach Delete).
   * @returns {HTMLLIElement} Fertiges LI-Element.
   */
  function liForSubtask(st, idx, task, rerender) {
    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.gap = '7px'; li.style.marginBottom = '4px';
    li.innerHTML = liMarkup(st);
    wireLi(li, idx, task, rerender);
    return li;
  }

  /**
   * Liefert das markup einer Subtask-Zeile (Checkbox + Titel + Actions).
   *
   * @param {Subtask} st - Subtask-Daten.
   * @returns {string} HTML-String für das LI-Innere.
   */
  function liMarkup(st) {
    return `
      <input type="checkbox" ${st.done ? 'checked' : ''} style="margin:0;">
      <span class="subtask-title" style="flex:1;">${st.title}</span>
      <span class="subtask-actions" style="display:none;">
        <button type="button" class="subtask-edit-btn" title="Bearbeiten"><img src="../assets/icons/add_task/edit.png" style="width:16px" alt=""></button>
        <button type="button" class="subtask-delete-btn" title="Löschen"><img src="../assets/icons/board/delete.png" style="width:17px" alt=""></button>
      </span>`;
  }

  /**
   * Verdrahtet Events eines Subtask-LI:
   *  - Checkbox toggelt den Done-Status
   *  - Hover zeigt/verbirgt Actions
   *  - Edit öffnet Inline-Editor
   *  - Delete entfernt den Subtask und rendert neu
   *
   * @param {HTMLLIElement} li - Ziel-Listenelement.
   * @param {number} idx - Index in task.subtasks.
   * @param {Task} task - Task-Objekt.
   * @param {() => void} rerender - Rerender-Callback (z. B. nach Delete).
   * @returns {void}
   */
  function wireLi(li, idx, task, rerender) {
    const cb = /** @type {HTMLInputElement} */ (li.querySelector('input[type="checkbox"]'));
    cb.addEventListener('change', (e) => {
      if (!Array.isArray(task.subtasks)) task.subtasks = [];
      task.subtasks[idx].done = (/** @type {HTMLInputElement} */(e.currentTarget)).checked;
    });

    li.addEventListener('mouseenter', () => {
      (/** @type {HTMLElement} */ (li.querySelector('.subtask-actions'))).style.display = 'inline-flex';
    });
    li.addEventListener('mouseleave', () => {
      (/** @type {HTMLElement} */ (li.querySelector('.subtask-actions'))).style.display = 'none';
    });

    (/** @type {HTMLButtonElement} */ (li.querySelector('.subtask-edit-btn')))
      .addEventListener('click', () => editSubtaskInline(li, idx, task));

    (/** @type {HTMLButtonElement} */ (li.querySelector('.subtask-delete-btn')))
      .addEventListener('click', () => {
        if (!Array.isArray(task.subtasks)) task.subtasks = [];
        task.subtasks.splice(idx, 1);
        rerender();
      });
  }

  // ───────────────────────────────────────────────────────────────────
  // Delete-Dialog
  // ───────────────────────────────────────────────────────────────────

  /**
   * Öffnet einen Delete-Bestätigungsdialog und löscht den Task bei Bestätigung.
   *
   * @param {string} taskId - ID des zu löschenden Tasks.
   * @param {HTMLDialogElement=} parent - Optionaler Parent-Dialog, der nach dem Löschen geschlossen wird.
   * @returns {void}
   */
  function showDeleteConfirmDialog(taskId, parent) {
    const dlg = /** @type {HTMLDialogElement} */ (document.getElementById('deleteConfirmDialog'));
    dlg.showModal();

    (/** @type {HTMLButtonElement} */ (document.getElementById('confirmDeleteBtn'))).onclick = () => {
      firebase.database().ref('tasks/' + taskId).remove().then(() => {
        dlg.close();
        parent?.close?.();
      });
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
