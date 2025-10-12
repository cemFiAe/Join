/**
 * Board – Add-Task Overlay & Task Creation on Board Page
 * Dependencies: Board.Core (Helpers/Styles), Board.Assigned (Assigned Dropdown)
 */

/** Cast window as any for optional namespaces */
const Win = /** @type {any} */ (window);

/**
 * DOM ready → wire everything (Overlay, Priority, Subtasks, Validation, Create)
 */
function initBoardAddTask() {
  const Core = Win.Board?.Core;
  const Assigned = Win.Board?.Assigned;
  Core?.ensureValidationStyles?.();

  const dlg = /** @type {HTMLDialogElement|null} */ (document.getElementById('addTaskOverlay'));

  const { showInline, hideInline, addSub, subtasks } = setupSubtasks();
  const { getPrio, setMediumDefault, wirePrioButtons } = setupPriority();
  const catSel = setupCategories();

  exposeOpenDialog(dlg, Core, Assigned, setMediumDefault);
  wireCloseOverlay(dlg);
  wirePrioButtons();
  setupValidation(Core, catSel);
  wireCreateTask(dlg, Assigned, getPrio, subtasks, catSel, Core);
  Core?.setDateMinToday?.('#task-due-date');
}

// --- Global functions ---

/**
 * Expose `window.openAddTaskDialog(status)` and set defaults.
 * @param {HTMLDialogElement} dlgEl - The dialog element for the Add Task overlay.
 * @param {object} core - Core utilities object containing helper functions.
 * @param {object} assigned - Assigned user handler object with initialization methods.
 * @param {Function} setMedium - Function to set the medium priority as default.
 */
function exposeOpenDialog(dlgEl, core, assigned, setMedium) {
  Win.openAddTaskDialog = function(status = 'todo') {
    clearForm();
    dlgEl.dataset.status = status;

    const due = /** @type {HTMLInputElement|null} */ (document.getElementById('task-due-date'));
    if (due) due.min = core?.todayLocalISO?.() || new Date().toISOString().slice(0, 10);

    setMedium();
    dlgEl.showModal();
    setTimeout(() => assigned?.initAssignedDropdown?.(), 0);
  };
}

/**
 * Wire close/clear buttons of the overlay.
 * @param {HTMLDialogElement} dlgEl - The dialog element for the Add Task overlay.
 */
function wireCloseOverlay(dlgEl) {
  const closeBtn = /** @type {HTMLButtonElement|null} */ (document.querySelector('.close-add-task-overlay'));
  const clearBtn = /** @type {HTMLButtonElement|null} */ (document.querySelector('.clear_button'));
  const closeOverlay = (e) => { e?.preventDefault?.(); dlgEl.close(); clearForm(); };
  if (closeBtn) closeBtn.onclick = closeOverlay;
  if (clearBtn) clearBtn.onclick = closeOverlay;
}

/**
 * Setup Priority logic
 */
function setupPriority() {
  let prio = 'medium';

  const setPrio = (v) => { prio = ['urgent', 'medium', 'low'].includes(v) ? v : ''; };
  const getPrio = () => prio;

  const setMediumDefault = () => {
    document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector('.priority-buttons .btn[data-priority="medium"]');
    if (btn) btn.classList.add('active');
    prio = 'medium';
  };

  const wirePrioButtons = () => {
    document.querySelectorAll('.priority-buttons .btn').forEach((btn, _, all) => {
      btn.addEventListener('click', function() {
        all.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        setPrio(this.dataset.priority || '');
        document.querySelector('.priority-buttons')?.classList.remove('field-invalid');
      });
    });
  };

  return { getPrio, setMediumDefault, wirePrioButtons };
}

/**
 * Initializes the subtask input system with inline actions, list handling, and events.
 * @returns {{ showInline: Function, hideInline: Function, addSub: Function, subtasks: Array }}
 */
function setupSubtasks() {
  const wrap = /** @type {HTMLDivElement|null} */ (document.querySelector('.input-icon-subtask'));
  const inp = wrap?.querySelector('input');
  const add = wrap?.querySelector('.add-subtask');
  const list = /** @type {HTMLUListElement|null} */ (document.getElementById('subtask-list'));
  const inline = initInline(wrap, inp, add);
  const subtasks = [];
  const { showInline, hideInline } = inline;

  const addSub = () => handleAddSub(inp, list, subtasks, hideInline);
  setupInputEvents(inp, add, wrap, showInline, hideInline, addSub);
  add?.addEventListener('click', addSub);

  return { showInline, hideInline, addSub, subtasks };
}

/**
 * Initializes the inline action elements for the subtask input area.
 * @param {HTMLElement|null} wrap - The container element.
 * @param {HTMLInputElement|null} inp - The input element.
 * @param {HTMLElement|null} add - The add button element.
 * @returns {{ showInline: Function, hideInline: Function }}
 */
function initInline(wrap, inp, add) {
  let inline = wrap?.querySelector('.subtask-inline-actions');
  if (wrap && !inline) {
    inline = buildInline(
      wrap, inp,
      () => { add.click(); hideInline(); inp?.focus(); },
      () => { if (inp) inp.value=''; hideInline(); inp?.focus(); }
    );
  }
  const showInline = () => { if (inline) inline.style.display='flex'; if (add) add.style.display='none'; };
  const hideInline = () => { if (inline) inline.style.display='none'; if (add) add.style.display=''; };
  return { showInline, hideInline };
}

/**
 * Escapes HTML special characters in a string for safe insertion into the DOM.
 * @param {string} s - The input string.
 * @returns {string} The escaped HTML string.
 */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/**
 * Handles the logic for adding a new subtask to the list.
 * @param {HTMLInputElement|null} inp - The input field.
 * @param {HTMLUListElement|null} list - The subtask list element.
 * @param {Array} subtasks - The subtask array.
 * @param {Function} hideInline - Function to hide the inline controls.
 */
function handleAddSub(inp, list, subtasks, hideInline) {
  if (!inp || !list) return;
  const v = inp.value.trim();
  if (!v) return;
  subtasks.push({ title: v, done: false });
  const li = buildSubtaskLi(escapeHtml(v));
  list.appendChild(li);
  inp.value = '';
  wireSubtaskLi(li, list, subtasks);
  hideInline();
  inp.focus();
}

/**
 * Attaches all event listeners to the subtask input and inline UI.
 * @param {HTMLInputElement|null} inp - The input field element.
 * @param {HTMLElement|null} add - The add button element.
 * @param {HTMLElement|null} wrap - The wrapping container element.
 * @param {Function} showInline - Function to show inline actions.
 * @param {Function} hideInline - Function to hide inline actions.
 * @param {Function} addSub - Function to add a subtask.
 */
function setupInputEvents(inp, add, wrap, showInline, hideInline, addSub) {
  inp?.addEventListener('focus', showInline);
  inp?.addEventListener('input', showInline);
  inp?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSub();
    }
  });
  inp?.addEventListener('blur', () => setTimeout(() => {
    const inside = document.activeElement instanceof Node && wrap?.contains(document.activeElement);
    if (!inside && !inp.value.trim()) hideInline();
  }, 0));
}

/**
 * Build inline action bar for subtask input.
 * @param {HTMLDivElement} wrap - Wrapper element containing the input and buttons.
 * @param {HTMLInputElement|null} inp - The subtask input element.
 * @param {Function} onOk - Callback function executed when the confirm (✓) button is clicked.
 * @param {Function} onClear - Callback function executed when the clear (✕) button is clicked.
 * @returns {HTMLDivElement} The constructed inline actions container element.
 */
function buildInline(wrap, inp, onOk, onClear) {
  const box = document.createElement('div'); box.className='subtask-inline-actions';
  const x = document.createElement('button'); x.type='button'; x.className='inline-btn inline-x'; x.textContent='✕';
  const ok = document.createElement('button'); ok.type='button'; ok.className='inline-btn inline-check'; ok.textContent='✓';
  box.append(x, ok); wrap.appendChild(box);
  x.addEventListener('click', onClear);
  ok.addEventListener('click', onOk);
  return box;
}

/**
 * Build a Subtask LI element.
 * @param {string} title - The title of the subtask to display in the list item.
 * @returns {HTMLLIElement} A list item element representing the subtask.
 */
function buildSubtaskLi(title) {
  const li = document.createElement('li'); li.className='subtask-item';
  li.innerHTML = `
    <span class="subtask-title">${title}</span>
    <span class="subtask-actions" style="display:none;">
      <button type="button" class="subtask-edit-btn" title="Edit">
        <img src="../assets/icons/add_task/edit.png" style="width:16px" alt="">
      </button>
      <button type="button" class="subtask-delete-btn" title="Delete">
        <img src="../assets/icons/add_task/delete.png" style="width:16px" alt="">
      </button>
    </span>`;
  return li;
}

/**
 * Wire hover and delete for Subtask LI.
 * @param {HTMLLIElement} li - The list item element representing the subtask.
 * @param {HTMLUListElement|null} list - The unordered list element containing all subtasks.
 * @param {{ title: string, done: boolean }[]} subtasksModel - The array representing the current subtasks model.
 */
function wireSubtaskLi(li, list, subtasksModel) {
  li.addEventListener('mouseenter', () => { li.querySelector('.subtask-actions')?.setAttribute('style','display:inline-block'); });
  li.addEventListener('mouseleave', () => { li.querySelector('.subtask-actions')?.setAttribute('style','display:none'); });
  li.querySelector('.subtask-delete-btn')?.addEventListener('click', () => {
    if (!list) return;
    const idx = Array.from(list.children).indexOf(li);
    if (idx > -1) subtasksModel.splice(idx, 1);
    li.remove();
  });
}

/**
 * Fill categories select in overlay
 */
function setupCategories() {
  const sel = /** @type {HTMLSelectElement|null} */(document.getElementById('category'));
  if (!sel) return null;
  sel.innerHTML = '<option value="">Select task category</option>';
  ["Technical Task","User Story","Bug","Research"].forEach(c => {
    const o = document.createElement('option'); o.value=c; o.textContent=c; sel.appendChild(o);
  });
  sel.required = true;
  return sel;
}

/**
 * Wire validation to Title/Due/Category fields.
 * @param {object} core - Core utilities object containing validation helper methods.
 * @param {HTMLSelectElement|null} catSel - The category selection element to validate.
 */
function setupValidation(core, catSel) {
  const t = document.getElementById('title');
  const d = document.getElementById('task-due-date');
  t?.addEventListener('input', () => core?.clearInvalidUI?.(t));
  d?.addEventListener('input', () => core?.clearInvalidUI?.(d));
  catSel?.addEventListener('change', () => core?.clearInvalidUI?.(catSel));
}

/**
 * Check all custom validations.
 * @param {object} core - Core utilities object containing validation methods.
 * @param {HTMLSelectElement|null} catSel - The category selection element to validate.
 * @param {boolean} prioOk - Whether a priority has been selected.
 * @returns {boolean} True if all validations pass, otherwise false.
 */
function valid(core, catSel, prioOk) {
  const t = document.getElementById('title');
  const d = document.getElementById('task-due-date');
  let ok = true;

  if (!t || t.value.trim().length < 2) { core?.markInvalid?.(t); ok=false; }
  const today = core?.todayLocalISO?.() || new Date().toISOString().slice(0, 10);
  if (!d || !d.value || d.value < today) { core?.markInvalid?.(d); ok=false; }
  if (!catSel || !catSel.value) { core?.markInvalid?.(catSel); ok=false; }
  if (!prioOk) { document.querySelector('.priority-buttons')?.classList.add('field-invalid'); ok=false; }

  return ok;
}

/**
 * Wires the "Create Task" button and handles new task creation.
 * @param {HTMLElement} dlgEl - The dialog element for task creation.
 * @param {object} assigned - The assigned users handler.
 * @param {Function} getPrio - Function to retrieve the selected priority.
 * @param {Array} subtasksModel - Array containing current subtasks.
 * @param {HTMLElement} catSel - The category selector element.
 * @param {object} core - The core validation or app context object.
 */
function wireCreateTask(dlgEl, assigned, getPrio, subtasksModel, catSel, core) {
  const btn = document.querySelector('.create_task_btn');
  btn?.addEventListener('click', async () => {
    const prio = getPrio();
    if (!valid(core, catSel, !!prio)) return;
    const task = buildTaskObject(dlgEl, assigned, prio, subtasksModel);
    await saveTaskToFirebase(task, dlgEl);
  });
}

/**
 * Builds a task object from form input and given parameters.
 * @param {HTMLElement} dlgEl - The dialog element containing data attributes.
 * @param {object} assigned - The assigned users handler.
 * @param {string} prio - The selected priority.
 * @param {Array} subtasksModel - The list of subtasks.
 * @returns {object} The constructed task object.
 */
function buildTaskObject(dlgEl, assigned, prio, subtasksModel) {
  const getVal = id => document.getElementById(id)?.value.trim() || '';
  return {
    title: getVal('title'),
    description: getVal('description'),
    dueDate: getVal('task-due-date'),
    priority: prio,
    assignedTo: assigned?.getSelectedAssigned?.() || [],
    category: document.getElementById('category')?.value || '',
    subtasks: [...subtasksModel],
    status: dlgEl.dataset.status || 'todo',
    createdAt: Date.now()
  };
}

/**
 * Saves the task object to Firebase and handles UI feedback after success.
 * @param {object} task - The task object to be saved.
 * @param {HTMLElement} dlgEl - The dialog element to close after save.
 */
async function saveTaskToFirebase(task, dlgEl) {
  const key = firebase.database().ref().child('tasks').push().key;
  await firebase.database().ref('tasks/' + key).set({ ...task, id: key });
  dlgEl.close();
  clearForm();
  Win.Board?.Core?.showBoardAddToast?.();
}

/**
 * Clear all overlay fields & UI states
 */
function clearForm() {
  const Assigned = Win.Board?.Assigned;
  const title = document.getElementById('title'); if (title) title.value='';
  const desc = document.getElementById('description'); if (desc) desc.value='';
  const due = document.getElementById('task-due-date'); if (due) due.value='';
  const cat = document.getElementById('category'); if (cat) cat.selectedIndex=0;

  Assigned?.resetAssigned?.();
  document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));

  const ul = document.getElementById('subtask-list'); if (ul) ul.innerHTML='';
}

// --- Initialize on DOM ready ---
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBoardAddTask);
else initBoardAddTask();