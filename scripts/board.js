// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * Board – Add-Task-Overlay & Erstellen von Tasks auf der Board-Seite.
 * Abhängigkeiten: Board.Core (Helper/Styles), Board.Assigned (Assigned-Dropdown)
 */
(function init() {
  /** @type {any} */ const Win = (window);

  /** DOM ready → alles verdrahten. */
  function onReady() {
    /** @type {any} */ const Core = (Win.Board?.Core);
    /** @type {any} */ const Assigned = (Win.Board?.Assigned);
    Core?.ensureValidationStyles?.();

    /** @type {HTMLDialogElement} */ const dlg = /** @type {any} */(document.getElementById('addTaskOverlay'));
    const { showInline, hideInline, addSub, subtasks } = setupSubtasks();
    const { getPrio, setMediumDefault, wirePrioButtons } = setupPriority();
    const catSel = setupCategories();

    exposeOpenDialog(dlg, Core, Assigned, setMediumDefault);
    wireCloseOverlay(dlg);

    wirePrioButtons();
    setupValidation(Core, catSel);
    wireCreateTask(dlg, Assigned, getPrio, subtasks, catSel, Core);

    // Min-Date Helper
    Core?.setDateMinToday?.('#task-due-date');

    // kleine Utilities ↓
    function exposeOpenDialog(dlg, Core, Assigned, setMediumDefault) {
      /** @param {'todo'|'inprogress'|'awaitingfeedback'|'done'} [status='todo'] */
      Win.openAddTaskDialog = function (status = 'todo') {
        clearForm();
        dlg.dataset.status = status;
        const due = /** @type {HTMLInputElement|null} */(document.getElementById('task-due-date'));
        if (due) due.min = Core?.todayLocalISO?.() || new Date().toISOString().slice(0, 10);
        setMediumDefault();
        dlg.showModal();
        setTimeout(() => Assigned?.initAssignedDropdown?.(), 0);
      };
    }

    function wireCloseOverlay(dlg) {
      const closeBtn = /** @type {HTMLButtonElement|null} */(document.querySelector('.close-add-task-overlay'));
      const clearBtn = /** @type {HTMLButtonElement|null} */(document.querySelector('.clear_button'));
      const closeOverlay = (e) => { e?.preventDefault?.(); dlg.close(); clearForm(); };
      if (closeBtn) closeBtn.onclick = closeOverlay;
      if (clearBtn) clearBtn.onclick = closeOverlay;
    }

    function setupPriority() {
      /** @type {''|'urgent'|'medium'|'low'} */ let prio = 'medium';
      const setPrio = (v /** @type {string} */) => { prio = (v === 'urgent'||v==='medium'||v==='low') ? v : ''; };
      const getPrio = () => prio;
      const setMediumDefault = () => {
        document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
        (/** @type {HTMLButtonElement|null} */(document.querySelector('.priority-buttons .btn[data-priority="medium"]')))?.classList.add('active');
        prio = 'medium';
      };
      const wirePrioButtons = () => {
        document.querySelectorAll('.priority-buttons .btn').forEach((btn, _, all) => {
          btn.addEventListener('click', function () {
            all.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const raw = (/** @type {HTMLElement} */(this)).dataset.priority || '';
            setPrio(raw);
            document.querySelector('.priority-buttons')?.classList.remove('field-invalid');
          });
        });
      };
      return { getPrio, setMediumDefault, wirePrioButtons };
    }

    function setupSubtasks() {
      const wrap = /** @type {HTMLDivElement|null} */(document.querySelector('.input-icon-subtask'));
      const inp  = /** @type {HTMLInputElement|null} */(wrap?.querySelector('input'));
      const add  = /** @type {HTMLButtonElement|null} */(wrap?.querySelector('.add-subtask'));
      const list = /** @type {HTMLUListElement|null} */(document.getElementById('subtask-list'));
      let inline = /** @type {HTMLDivElement|null} */(wrap?.querySelector('.subtask-inline-actions'));
      if (wrap && !inline) inline = buildInline(wrap, inp, () => { addSub(); hideInline(); inp?.focus(); }, () => { if (inp) { inp.value=''; inp.focus(); } hideInline(); });
      const showInline = () => { if (inline) inline.style.display='flex'; if (add) add.style.display='none'; };
      const hideInline = () => { if (inline) inline.style.display='none'; if (add) add.style.display=''; };
      /** @type {{title:string,done:boolean}[]} */ const subtasks = [];

      const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

      const addSub = () => {
        if (!inp || !list) return;
        const v = inp.value.trim(); if (!v) return;
        subtasks.push({ title:v, done:false });
        const li = buildSubtaskLi(escapeHtml(v));
        list.appendChild(li); inp.value = '';
        wireSubtaskLi(li, list, subtasks);
      };

      if (inp) {
        inp.addEventListener('focus', showInline);
        inp.addEventListener('input', showInline);
        inp.addEventListener('keydown', e => { if (e.key==='Enter'){ e.preventDefault(); addSub(); hideInline(); inp.focus(); }});
        inp.addEventListener('blur', () => setTimeout(() => {
          const inside = document.activeElement instanceof Node && wrap ? wrap.contains(document.activeElement) : false;
          if (!inside && !inp.value.trim()) hideInline();
        }, 0));
      }
      add?.addEventListener('click', addSub);

      return { showInline, hideInline, addSub, subtasks };
    }

    function buildInline(wrap, inp, onOk, onClear) {
      const box = document.createElement('div'); box.className = 'subtask-inline-actions';
      const x = document.createElement('button'); x.type='button'; x.className='inline-btn inline-x'; x.textContent='✕';
      const ok = document.createElement('button'); ok.type='button'; ok.className='inline-btn inline-check'; ok.textContent='✓';
      box.append(x, ok); wrap.appendChild(box);
      x.addEventListener('click', onClear);
      ok.addEventListener('click', onOk);
      return box;
    }

    function buildSubtaskLi(title) {
      const li = document.createElement('li'); li.className='subtask-item';
      li.innerHTML = `
        <span class="subtask-title">${title}</span>
        <span class="subtask-actions" style="display:none;">
          <button type="button" class="subtask-edit-btn" title="Bearbeiten">
            <img src="../assets/icons/add_task/edit.png" style="width:16px" alt="">
          </button>
          <button type="button" class="subtask-delete-btn" title="Löschen">
            <img src="../assets/icons/add_task/delete.png" style="width:16px" alt="">
          </button>
        </span>`;
      return li;
    }

    function wireSubtaskLi(li, list, subtasks) {
      li.addEventListener('mouseenter', () => { const a = /** @type {HTMLElement|null} */(li.querySelector('.subtask-actions')); if (a) a.style.display='inline-block'; });
      li.addEventListener('mouseleave', () => { const a = /** @type {HTMLElement|null} */(li.querySelector('.subtask-actions')); if (a) a.style.display='none'; });
      (/** @type {HTMLButtonElement|null} */(li.querySelector('.subtask-delete-btn')))?.addEventListener('click', () => {
        if (!list) return;
        const idx = Array.from(list.children).indexOf(li);
        if (idx > -1) subtasks.splice(idx, 1);
        li.remove();
      });
    }

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

    function setupValidation(Core, catSel) {
      const t = /** @type {HTMLInputElement|null} */(document.getElementById('title'));
      const d = /** @type {HTMLInputElement|null} */(document.getElementById('task-due-date'));
      t?.addEventListener('input', () => Core?.clearInvalidUI?.(t));
      d?.addEventListener('input', () => Core?.clearInvalidUI?.(d));
      catSel?.addEventListener('change', () => Core?.clearInvalidUI?.(catSel));
    }

    function valid(Core, catSel, prioOk) {
      const t = /** @type {HTMLInputElement|null} */(document.getElementById('title'));
      const d = /** @type {HTMLInputElement|null} */(document.getElementById('task-due-date'));
      let ok = true;
      if (!t || t.value.trim().length < 2) { Core?.markInvalid?.(t); ok = false; }
      const today = Core?.todayLocalISO?.() || new Date().toISOString().slice(0, 10);
      if (!d || !d.value || d.value < today) { Core?.markInvalid?.(d); ok = false; }
      if (!catSel || !catSel.value) { Core?.markInvalid?.(catSel); ok = false; }
      if (!prioOk) { document.querySelector('.priority-buttons')?.classList.add('field-invalid'); ok = false; }
      return ok;
    }

    function wireCreateTask(dlg, Assigned, getPrio, subtasks, catSel, Core) {
      (/** @type {HTMLButtonElement} */(document.querySelector('.create_task_btn'))).addEventListener('click', () => {
        const prio = getPrio();
        if (!valid(Core, catSel, !!prio)) return;
        /** @type {'todo'|'inprogress'|'awaitingfeedback'|'done'} */
        const status = /** @type {any} */(dlg.dataset.status) || 'todo';
        const task = {
          title: (/** @type {HTMLInputElement} */(document.getElementById('title'))).value.trim(),
          description: (/** @type {HTMLTextAreaElement} */(document.getElementById('description'))).value.trim(),
          dueDate: (/** @type {HTMLInputElement} */(document.getElementById('task-due-date'))).value.trim(),
          priority: prio,
          assignedTo: Assigned?.getSelectedAssigned?.() || [],
          category: (/** @type {HTMLSelectElement} */(document.getElementById('category'))).value,
          subtasks: [...subtasks],
          status, createdAt: Date.now()
        };
        const key = firebase.database().ref().child('tasks').push().key;
        firebase.database().ref('tasks/' + key).set({ ...task, id: key })
          .then(() => { dlg.close(); clearForm(); (/** @type {any} */(Win.Board?.Core))?.showBoardAddToast?.(); });
      });
    }

    /** Alles zurücksetzen (ohne Dialog schließen). */
    function clearForm() {
      (/** @type {HTMLInputElement} */(document.getElementById('title'))).value = '';
      (/** @type {HTMLTextAreaElement} */(document.getElementById('description'))).value = '';
      (/** @type {HTMLInputElement} */(document.getElementById('task-due-date'))).value = '';
      (/** @type {HTMLSelectElement} */(document.getElementById('category'))).selectedIndex = 0;
      Assigned?.resetAssigned?.();
      document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
      const ul = /** @type {HTMLUListElement|null} */(document.getElementById('subtask-list'));
      if (ul) ul.innerHTML = '';
    }
  }

  // DOM-Ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
