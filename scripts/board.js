// @ts-check
/* global firebase */

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
 * Expose `window.openAddTaskDialog(status)` and set defaults
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
 * Wire close/clear buttons of the overlay
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
 * Setup Subtask input (inline actions, list, delete)
 */
function setupSubtasks() {
  const wrap = /** @type {HTMLDivElement|null} */ (document.querySelector('.input-icon-subtask'));
  const inp = wrap?.querySelector('input');
  const add = wrap?.querySelector('.add-subtask');
  const list = /** @type {HTMLUListElement|null} */ (document.getElementById('subtask-list'));
  let inline = wrap?.querySelector('.subtask-inline-actions');

  if (wrap && !inline) {
    inline = buildInline(
      wrap,
      inp,
      () => { addSub(); hideInline(); inp?.focus(); },
      () => { if (inp) { inp.value=''; inp.focus(); } hideInline(); }
    );
  }

  const showInline = () => { if (inline) inline.style.display='flex'; if (add) add.style.display='none'; };
  const hideInline = () => { if (inline) inline.style.display='none'; if (add) add.style.display=''; };
  const subtasks = [];

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const addSub = () => {
    if (!inp || !list) return;
    const v = inp.value.trim(); if (!v) return;
    subtasks.push({ title:v, done:false });
    const li = buildSubtaskLi(escapeHtml(v));
    list.appendChild(li); inp.value='';
    wireSubtaskLi(li, list, subtasks);
  };

  inp?.addEventListener('focus', showInline);
  inp?.addEventListener('input', showInline);
  inp?.addEventListener('keydown', e => { if (e.key==='Enter') { e.preventDefault(); addSub(); hideInline(); inp.focus(); } });
  inp?.addEventListener('blur', () => setTimeout(() => {
    const inside = document.activeElement instanceof Node && wrap ? wrap.contains(document.activeElement) : false;
    if (!inside && !inp.value.trim()) hideInline();
  }, 0));
  add?.addEventListener('click', addSub);

  return { showInline, hideInline, addSub, subtasks };
}

/**
 * Build inline action bar for subtask input
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
 * Build a Subtask LI element
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
 * Wire hover and delete for Subtask LI
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
 * Wire validation to Title/Due/Category fields
 */
function setupValidation(core, catSel) {
  const t = document.getElementById('title');
  const d = document.getElementById('task-due-date');
  t?.addEventListener('input', () => core?.clearInvalidUI?.(t));
  d?.addEventListener('input', () => core?.clearInvalidUI?.(d));
  catSel?.addEventListener('change', () => core?.clearInvalidUI?.(catSel));
}

/**
 * Check all custom validations
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
 * Wire Create Task button
 */
function wireCreateTask(dlgEl, assigned, getPrio, subtasksModel, catSel, core) {
  const btn = document.querySelector('.create_task_btn');
  btn?.addEventListener('click', () => {
    const prio = getPrio();
    if (!valid(core, catSel, !!prio)) return;
    const status = dlgEl.dataset.status || 'todo';
    const task = {
      title: document.getElementById('title')?.value.trim() || '',
      description: document.getElementById('description')?.value.trim() || '',
      dueDate: document.getElementById('task-due-date')?.value.trim() || '',
      priority: prio,
      assignedTo: assigned?.getSelectedAssigned?.() || [],
      category: document.getElementById('category')?.value || '',
      subtasks: [...subtasksModel],
      status,
      createdAt: Date.now()
    };
    const key = firebase.database().ref().child('tasks').push().key;
    firebase.database().ref('tasks/' + key).set({ ...task, id: key }).then(() => {
      dlgEl.close();
      clearForm();
      Win.Board?.Core?.showBoardAddToast?.();
    });
  });
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