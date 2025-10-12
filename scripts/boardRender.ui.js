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

  /**
  * Returns the singleton move menu element, creating it if necessary.
  * @returns {HTMLElement} The move menu element.
  */
  function getMenu() {
    if (menuEl) return menuEl;
    menuEl = createMenuEl();
    wireOutsideClose(menuEl);
    return menuEl;
  }

  /**
  * Creates the HTML element for the move menu and appends it to the document body.
  * @returns {HTMLDivElement} The created move menu element.
  */
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

  /**
  * Adds a click listener to close the menu if clicking outside of it.
  * @param {HTMLElement} el - The menu element to watch for outside clicks.
  */
  function wireOutsideClose(el) {
    document.addEventListener('click', (e) => {
      if (el.style.display === 'none') return;
      if (!(e.target instanceof Node)) return;
      if (!el.contains(e.target)) el.style.display = 'none';
    });
  }

  /**
  * Positions the move menu relative to a task card's bounding rectangle.
  * @param {HTMLElement} el - The menu element to position.
  * @param {DOMRect} r - The bounding rectangle of the card.
  */
  function positionMenu(el, r) {
    el.style.left = Math.min(window.innerWidth - 180, r.right + 8) + 'px';
    el.style.top = Math.max(8, r.top) + 'px';
    el.style.display = 'block';
  }

  /**
  * Sets the text labels for the up and down move items in the menu.
  * @param {HTMLElement} el - The menu element.
  * @param {TaskStatus|null} up - Status for the up item, or null to hide.
  * @param {TaskStatus|null} dn - Status for the down item, or null to hide.
  */
  function setMoveLabels(el, up, dn) {
    el.querySelector('.label-up').textContent = up ? LABEL[up] : '';
    el.querySelector('.label-down').textContent = dn ? LABEL[dn] : '';
  }

  /**
  * Updates the visual state (opacity, pointer events, display) of a menu item.
  * @param {HTMLElement} n - The menu item element.
  * @param {boolean} enabled - Whether the item is enabled or disabled.
  */
  function setItemState(n, enabled) {
    n.style.opacity = enabled ? '1' : '.35';
    n.style.pointerEvents = enabled ? 'auto' : 'none';
    n.style.display = enabled ? 'flex' : 'none';
  }

  /**
  * Enables or disables the up/down items in the move menu based on available statuses.
  * @param {HTMLElement} el - The menu element.
  * @param {TaskStatus|null} up - Status for the up item.
  * @param {TaskStatus|null} dn - Status for the down item.
  */
  function enableDisableItems(el, up, dn) {
    const upI = el.querySelector('.item-up');
    const dnI = el.querySelector('.item-down');
    setItemState(upI, !!up);
    setItemState(dnI, !!dn);
    upI.replaceWith(upI.cloneNode(true));
    dnI.replaceWith(dnI.cloneNode(true));
  }

  /**
  * Attaches click handlers to the move menu items to move a task.
  * @param {HTMLElement} el - The menu element.
  * @param {Task} task - The task object to move.
  * @param {TaskStatus|null} up - Status for the up item.
  * @param {TaskStatus|null} dn - Status for the down item.
  */
  function bindMoveClicks(el, task, up, dn) {
    if (up) el.querySelector('.item-up').addEventListener('click', () => { moveTaskToStatus(task.id, up); el.style.display = 'none'; });
    if (dn) el.querySelector('.item-down').addEventListener('click', () => { moveTaskToStatus(task.id, dn); el.style.display = 'none'; });
  }

  /**
  * Shows the move menu for a specific task card and sets up labels, state, and click events.
  * @param {HTMLElement} card - The task card element.
  * @param {Task} task - The task object represented by the card.
  */
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
  /**
  * Returns a CSS class for the task header based on category.
  * @param {string} category - The task's category string.
  * @returns {string} CSS class for the task header.
  */
  function getCategoryHeaderClass(category) {
    const c = (category || '').toLowerCase();
    if (c.includes('bug')) return 'task-header bug-task';
    if (c.includes('user')) return 'task-header user-task';
    if (c.includes('tech')) return 'task-header tech-task';
    if (c.includes('research')) return 'task-header research-task';
    return 'task-header';
  }

  /**
  * Calculates progress information for a task's subtasks.
  * @param {Task} task - The task object.
  * @returns {{total:number, done:number, percent:number}} Progress summary object.
  */
  function calcProgress(task) {
    const total = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
    const done = Array.isArray(task.subtasks) ? task.subtasks.filter(s => s.done).length : 0;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  /**
  * Returns the priority icon name for a task.
  * @param {Task} task - The task object.
  * @returns {string} The icon name representing task priority.
  */
  function prioIconFor(task) {
    const map = { urgent:'prio_top', medium:'prio_mid', low:'prio_low' };
    return map[task.priority || 'medium'] || 'prio_mid';
  }

  /**
  * Converts the assignedTo field to a normalized array of string IDs.
  * @param {string|string[]|undefined} a - Assigned field from the task.
  * @returns {string[]} Array of assigned user IDs.
  */
  function normalizeAssigned(a) {
    return Array.isArray(a) ? a.filter(Boolean).map(String) : (a ? [String(a)] : []);
  }

  /**
  * Returns HTML for up to 4 assigned user badges, adding a "+N" badge if more.
  * @param {Task} task - The task object.
  * @returns {string} HTML string for profile badges.
  */
  function badgesHtml(task) {
    const ids = normalizeAssigned(task.assignedTo);
    const vis = ids.slice(0, 4);
    const over = ids.length - vis.length;
    const base = vis.map(id => Assigned?.getProfileBadge?.(id) || '').join('');
    return base + (over > 0 ? `<span class="profile-badge more-badge" title="+${over} more">+${over}</span>` : '');
  }

  /**
  * Returns HTML for the subtask progress bar.
  * @param {{total:number, done:number, percent:number}} p - Progress summary object.
  * @returns {string} HTML string for the progress bar.
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
  * Builds the main task card element with header, title, description, progress, badges, and priority icon.
  * @param {Task} task - The task object.
  * @returns {HTMLDivElement} The created task card element.
  */
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

  /**
  * Appends and wires the mobile move button on a task card.
  * @param {HTMLDivElement} card - The task card element.
  * @param {Task} task - The task object.
  */
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

  /**
  * Makes a task card draggable and handles dragstart/dragend events.
  * @param {HTMLDivElement} card - The task card element.
  */
  function wireDetail(card, task) {
    card.addEventListener('click', () => Win.Board?.Detail?.openTaskDetail?.(task));
    card.addEventListener('contextmenu', (e) => { e.preventDefault(); showMoveMenuForCard(card, task); });
  }

  /**
  * Creates a full task card element with drag, move button, and detail wiring.
  * @param {Task} task - The task object.
  * @returns {HTMLDivElement} The fully initialized task card element.
  */
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
  /**
  * Adds a dragover listener to allow dropping on an element.
  * @param {HTMLElement} el - The target drop zone element.
  */
  function onDragOver(el) {
    el.addEventListener('dragover', (e) => e.preventDefault());
  }

  /**
  * Adds a drop listener to an element to handle moving tasks.
  * @param {HTMLElement} el - The target drop zone element.
  */
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

  /**
  * Adds a dragenter listener to highlight a drop zone.
  * @param {HTMLElement} el - The target drop zone element.
  */
  function onDragEnter(el) {
    el.addEventListener('dragenter', (e) => {
      e.currentTarget.classList.add('drop-target');
    });
  }

  /**
  * Adds a dragleave listener to remove highlight from a drop zone.
  * @param {HTMLElement} el - The target drop zone element.
  */
  function onDragLeave(el) {
    el.addEventListener('dragleave', (e) => {
      e.currentTarget.classList.remove('drop-target');
    });
  }

  /**
  * Initializes a drop zone element by its DOM ID with drag and drop handlers.
  * @param {string} id - The ID of the element to initialize.
  */
  function initDropZoneById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    onDragOver(el);
    onDrop(el);
    onDragEnter(el);
    onDragLeave(el);
  }

  /**
  * Initializes all standard drop zones for the board.
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