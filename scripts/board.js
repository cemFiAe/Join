// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * Board – Add-Task-Overlay & Erstellen von Tasks auf der Board-Seite.
 * Abhängigkeiten: Board.Core (Helper/Styles), Board.Assigned (Assigned-Dropdown)
 */
(function init() {
  /** Window als any casten, damit optionale Namespaces sauber getypt sind. */
  /** @type {any} */ const Win = (window);

  /**
   * DOM ready → alles verdrahten (Overlay, Priority, Subtasks, Validation, Create).
   * @returns {void}
   */
  function onReady() {
    /** @type {any} */ const Core = (Win.Board?.Core);
    /** @type {any} */ const Assigned = (Win.Board?.Assigned);
    Core?.ensureValidationStyles?.();

    /** @type {HTMLDialogElement} */
    const dlg = /** @type {any} */(document.getElementById('addTaskOverlay'));

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

    /**
     * Exponiert `window.openAddTaskDialog(status)` und setzt Defaults.
     * @param {HTMLDialogElement} dlgEl
     * @param {any} core
     * @param {any} assigned
     * @param {() => void} setMedium
     * @returns {void}
     */
    function exposeOpenDialog(dlgEl, core, assigned, setMedium) {
      /**
       * Öffnet das Add-Task-Overlay.
       * @param {'todo'|'inprogress'|'awaitingfeedback'|'done'} [status='todo'] Zielspalte
       * @returns {void}
       */
      Win.openAddTaskDialog = function (status = 'todo') {
        clearForm();
        dlgEl.dataset.status = status;

        /** @type {HTMLInputElement|null} */
        const due = /** @type {any} */(document.getElementById('task-due-date'));
        if (due) due.min = core?.todayLocalISO?.() || new Date().toISOString().slice(0, 10);

        setMedium();
        dlgEl.showModal();

        // Dropdown erst nach Öffnen initialisieren
        setTimeout(() => assigned?.initAssignedDropdown?.(), 0);
      };
    }

    /**
     * Verdrahtet Close/Clear-Buttons des Overlays.
     * @param {HTMLDialogElement} dlgEl
     * @returns {void}
     */
    function wireCloseOverlay(dlgEl) {
      const closeBtn = /** @type {HTMLButtonElement|null} */(document.querySelector('.close-add-task-overlay'));
      const clearBtn = /** @type {HTMLButtonElement|null} */(document.querySelector('.clear_button'));
      /** @param {Event} [e] */ const closeOverlay = (e) => { e?.preventDefault?.(); dlgEl.close(); clearForm(); };
      if (closeBtn) closeBtn.onclick = closeOverlay;
      if (clearBtn) clearBtn.onclick = closeOverlay;
    }

    /**
     * Stellt Priority-Logik bereit (Getter, Default, Wiring).
     * @returns {{getPrio:()=>'urgent'|'medium'|'low'|'', setMediumDefault:()=>void, wirePrioButtons:()=>void}}
     */
    function setupPriority() {
      /** @type {''|'urgent'|'medium'|'low'} */ let prio = 'medium';

      /**
       * Setzt intern die Priorität (validiert Union).
       * @param {string} v
       * @returns {void}
       */
      const setPrio = (v) => { prio = (v === 'urgent'||v==='medium'||v==='low') ? v : ''; };

      /** Liefert die aktuelle Priorität. */
      const getPrio = () => prio;

      /** Markiert „Medium“ visuell als aktiv und setzt `prio`. */
      const setMediumDefault = () => {
        document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
        (/** @type {HTMLButtonElement|null} */(document.querySelector('.priority-buttons .btn[data-priority="medium"]')))?.classList.add('active');
        prio = 'medium';
      };

      /**
       * Verdrahtet alle Priority-Buttons (Active-State, Validierung).
       * @returns {void}
       */
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

    /**
     * Verdrahtet Subtask-Eingabe (Inline-Actions, Liste, Delete).
     * @returns {{showInline:()=>void, hideInline:()=>void, addSub:()=>void, subtasks:{title:string,done:boolean}[]}}
     */
    function setupSubtasks() {
      const wrap = /** @type {HTMLDivElement|null} */(document.querySelector('.input-icon-subtask'));
      const inp  = /** @type {HTMLInputElement|null} */(wrap?.querySelector('input'));
      const add  = /** @type {HTMLButtonElement|null} */(wrap?.querySelector('.add-subtask'));
      const list = /** @type {HTMLUListElement|null} */(document.getElementById('subtask-list'));

      let inline = /** @type {HTMLDivElement|null} */(wrap?.querySelector('.subtask-inline-actions'));
      if (wrap && !inline) {
        inline = buildInline(
          wrap,
          inp,
          () => { addSub(); hideInline(); inp?.focus(); },
          () => { if (inp) { inp.value=''; inp.focus(); } hideInline(); }
        );
      }

      /** Zeigt die Inline-Buttons (✓/✕) an. */
      const showInline = () => { if (inline) inline.style.display='flex'; if (add) add.style.display='none'; };
      /** Versteckt die Inline-Buttons. */
      const hideInline = () => { if (inline) inline.style.display='none'; if (add) add.style.display=''; };
      /** Modell der Subtasks. */ const subtasks = /** @type {{title:string,done:boolean}[]} */([]);

      /** Escaping für Subtask-Titel. */
      const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

      /**
       * Fügt einen Subtask aus dem Eingabefeld hinzu.
       * @returns {void}
       */
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
        inp.addEventListener('keydown', e => {
          if (e.key==='Enter'){ e.preventDefault(); addSub(); hideInline(); inp.focus(); }
        });
        inp.addEventListener('blur', () => setTimeout(() => {
          const inside = document.activeElement instanceof Node && wrap ? wrap.contains(document.activeElement) : false;
          if (!inside && !inp.value.trim()) hideInline();
        }, 0));
      }
      add?.addEventListener('click', addSub);

      return { showInline, hideInline, addSub, subtasks };
    }

    /**
     * Baut die Inline-Action-Leiste (✕/✓) im Subtask-Input.
     * @param {HTMLDivElement} wrap
     * @param {HTMLInputElement|null} inp
     * @param {() => void} onOk
     * @param {() => void} onClear
     * @returns {HTMLDivElement}
     */
    function buildInline(wrap, inp, onOk, onClear) {
      const box = document.createElement('div'); box.className = 'subtask-inline-actions';
      const x = document.createElement('button'); x.type='button'; x.className='inline-btn inline-x'; x.textContent='✕';
      const ok = document.createElement('button'); ok.type='button'; ok.className='inline-btn inline-check'; ok.textContent='✓';
      box.append(x, ok); wrap.appendChild(box);
      x.addEventListener('click', onClear);
      ok.addEventListener('click', onOk);
      return box;
    }

    /**
     * Erstellt ein Subtask-Listen-Element (LI).
     * @param {string} title Escapeter Titel
     * @returns {HTMLLIElement}
     */
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

    /**
     * Verdrahtet Hover/Remove-Logik für ein Subtask-LI.
     * @param {HTMLLIElement} li
     * @param {HTMLUListElement|null} list
     * @param {{title:string,done:boolean}[]} subtasksModel
     * @returns {void}
     */
    function wireSubtaskLi(li, list, subtasksModel) {
      li.addEventListener('mouseenter', () => {
        const a = /** @type {HTMLElement|null} */(li.querySelector('.subtask-actions'));
        if (a) a.style.display='inline-block';
      });
      li.addEventListener('mouseleave', () => {
        const a = /** @type {HTMLElement|null} */(li.querySelector('.subtask-actions'));
        if (a) a.style.display='none';
      });
      (/** @type {HTMLButtonElement|null} */(li.querySelector('.subtask-delete-btn')))?.addEventListener('click', () => {
        if (!list) return;
        const idx = Array.from(list.children).indexOf(li);
        if (idx > -1) subtasksModel.splice(idx, 1);
        li.remove();
      });
    }

    /**
     * Füllt die Kategorienliste im Overlay.
     * @returns {HTMLSelectElement|null}
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
     * Bindet Clear-Invalid-Handler an Title/Due/Category.
     * @param {any} core
     * @param {HTMLSelectElement|null} catSel
     * @returns {void}
     */
    function setupValidation(core, catSel) {
      const t = /** @type {HTMLInputElement|null} */(document.getElementById('title'));
      const d = /** @type {HTMLInputElement|null} */(document.getElementById('task-due-date'));
      t?.addEventListener('input', () => core?.clearInvalidUI?.(t));
      d?.addEventListener('input', () => core?.clearInvalidUI?.(d));
      catSel?.addEventListener('change', () => core?.clearInvalidUI?.(catSel));
    }

    /**
     * Führt die Custom-Validierung aus.
     * @param {any} core
     * @param {HTMLSelectElement|null} catSel
     * @param {boolean} prioOk
     * @returns {boolean} true = alle Felder okay
     */
    function valid(core, catSel, prioOk) {
      const t = /** @type {HTMLInputElement|null} */(document.getElementById('title'));
      const d = /** @type {HTMLInputElement|null} */(document.getElementById('task-due-date'));
      let ok = true;

      if (!t || t.value.trim().length < 2) { core?.markInvalid?.(t); ok = false; }

      const today = core?.todayLocalISO?.() || new Date().toISOString().slice(0, 10);
      if (!d || !d.value || d.value < today) { core?.markInvalid?.(d); ok = false; }

      if (!catSel || !catSel.value) { core?.markInvalid?.(catSel); ok = false; }

      if (!prioOk) { document.querySelector('.priority-buttons')?.classList.add('field-invalid'); ok = false; }

      return ok;
    }

    /**
     * Verdrahtet den „Create Task“-Button: validiert und schreibt in Firebase.
     * @param {HTMLDialogElement} dlgEl
     * @param {any} assigned
     * @param {()=>'urgent'|'medium'|'low'|''} getPrio
     * @param {{title:string,done:boolean}[]} subtasksModel
     * @param {HTMLSelectElement|null} catSel
     * @param {any} core
     * @returns {void}
     */
    function wireCreateTask(dlgEl, assigned, getPrio, subtasksModel, catSel, core) {
      (/** @type {HTMLButtonElement} */(document.querySelector('.create_task_btn'))).addEventListener('click', () => {
        const prio = getPrio();
        if (!valid(core, catSel, !!prio)) return;

        /** @type {'todo'|'inprogress'|'awaitingfeedback'|'done'} */
        const status = /** @type {any} */(dlgEl.dataset.status) || 'todo';

        const task = {
          title: (/** @type {HTMLInputElement} */(document.getElementById('title'))).value.trim(),
          description: (/** @type {HTMLTextAreaElement} */(document.getElementById('description'))).value.trim(),
          dueDate: (/** @type {HTMLInputElement} */(document.getElementById('task-due-date'))).value.trim(),
          priority: prio,
          assignedTo: assigned?.getSelectedAssigned?.() || [],
          category: (/** @type {HTMLSelectElement} */(document.getElementById('category'))).value,
          subtasks: [...subtasksModel],
          status,
          createdAt: Date.now()
        };

        const key = firebase.database().ref().child('tasks').push().key;
        firebase.database().ref('tasks/' + key).set({ ...task, id: key })
          .then(() => {
            dlgEl.close();
            clearForm();
            (/** @type {any} */(Win.Board?.Core))?.showBoardAddToast?.();
          });
      });
    }

    /**
     * Setzt alle Overlay-Felder & UI-States zurück.
     * @returns {void}
     */
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
