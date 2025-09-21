// @ts-check
/* global firebase */

// === Bootstrapping: onDomReady immer ausführen ===
(function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReady);
  } else {
    onDomReady();
  }
})();

/** Bild-Toast: slidet von unten in die Bildschirmmitte (nur das Bild). */
function showAddTaskToast() {
  let style = document.getElementById('add-task-toast-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'add-task-toast-style';
    document.head.appendChild(style);
  }
  style.textContent = `
    @keyframes slideUpToCenter {
      0%   { top: 100%; transform: translate(-50%, 0);    opacity: 1; }
      100% { top: 50%;  transform: translate(-50%, -50%); opacity: 1; }
    }
    #addTaskToast {
      position: fixed;
      left: 50%;
      top: 100%;
      transform: translate(-50%, 0);
      z-index: 99999;
      background: transparent;
      padding: 0;
      border-radius: 0;
      box-shadow: none;
      will-change: top, transform;
      pointer-events: none;
    }
    #addTaskToast.enter { animation: slideUpToCenter .55s cubic-bezier(.2,.8,.2,1) forwards; }
    #addTaskToast img { display:block; width:300px; height:auto; }
  `;

  let toast = document.getElementById('addTaskToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'addTaskToast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<img src="../assets/icons/add_task/board_white.png" alt="">`;

  toast.classList.remove('enter'); void toast.offsetHeight; toast.classList.add('enter');
}

/** ZENTRALER Fehlerdialog (nur noch für echte Fehler, nicht für Validation) */
function showErrorDialog(message) {
  const dlg = document.getElementById('errorDialog');
  if (!(dlg instanceof HTMLDialogElement)) {
    alert(message); // Fallback
    return;
  }
  const p = dlg.querySelector('p');
  if (p) p.textContent = message;
  if (!dlg.open) dlg.showModal();
}

/** Wird nach DOM-Ready aufgerufen. */
function onDomReady() {
  // ──────────────────────────────────────────────────────────────────────────
  // Globale API: Add-Task Overlay öffnen (onclick in board.html)
  // ──────────────────────────────────────────────────────────────────────────
  // @ts-ignore
  window.openAddTaskDialog = function (/** @type {'todo'|'inprogress'|'awaitingfeedback'|'done'} */ status = 'todo') {
    clearAddTaskForm();

    const addDlg = /** @type {HTMLDialogElement} */ (document.getElementById('addTaskOverlay'));
    addDlg.dataset.status = status;

    // min = heute (lokale TZ) für Date-Input
    const dateInput = /** @type {HTMLInputElement | null} */ (document.getElementById('task-due-date'));
    if (dateInput) {
      const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
      dateInput.min = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);
    }

    // "Medium" standardmäßig aktiv
    document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
    const mediumBtn = /** @type {HTMLButtonElement | null} */ (
      document.querySelector('.priority-buttons .btn[data-priority="medium"]')
    );
    if (mediumBtn) mediumBtn.classList.add('active');

    addDlg.showModal();
    // Dropdown-Setup kommt AUS boardFirebase.js
    // @ts-ignore
    window.initAssignedDropdown && window.initAssignedDropdown();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Animation nach Redirect von Add-Task
  // ──────────────────────────────────────────────────────────────────────────
  if (localStorage.getItem('showBoardToast')) {
    showBoardAddToast();
    localStorage.removeItem('showBoardToast');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Add-Task Overlay schließen
  // ──────────────────────────────────────────────────────────────────────────
  const dialog = /** @type {HTMLDialogElement} */ (document.getElementById('addTaskOverlay'));
  const closeBtn  = /** @type {HTMLButtonElement} */ (document.querySelector('.close-add-task-overlay'));
  const clearBtnL = /** @type {HTMLButtonElement} */ (document.querySelector('.clear_button'));

  if (closeBtn) closeBtn.onclick = closeAddOverlay;
  if (clearBtnL) clearBtnL.onclick = closeAddOverlay;

  function closeAddOverlay(e) {
    e?.preventDefault?.();
    dialog.close();
    clearAddTaskForm();
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // Overlay-Form + verstecktes Pflichtfeld für Priority (native Validation)
  // ──────────────────────────────────────────────────────────────────────────
  const overlayForm = /** @type {HTMLFormElement|null} */ (dialog?.querySelector('.task-form'));
  let overlayPrioHidden = /** @type {HTMLInputElement|null} */ (dialog?.querySelector('#overlayPriority'));
  if (!overlayPrioHidden) {
    overlayPrioHidden = document.createElement('input');
    overlayPrioHidden.type = 'text';
    overlayPrioHidden.id = 'overlayPriority';
    overlayPrioHidden.name = 'priority';
    overlayPrioHidden.required = true;
    Object.assign(overlayPrioHidden.style, {
      position:'absolute', left:'-9999px', opacity:'0', width:'0', height:'0', border:'0', padding:'0'
    });
    (overlayForm || document.body).appendChild(overlayPrioHidden);
  }
  function setOverlayPriority(v /** @type {'urgent'|'medium'|'low'|''} */) {
    if (!overlayPrioHidden) return;
    overlayPrioHidden.value = v || '';
    overlayPrioHidden.setCustomValidity(overlayPrioHidden.value ? '' : 'Please choose a priority');
  }

  // WICHTIG: Native Required-Attribute für Title, Date, Category setzen
  const titleEl  = /** @type {HTMLInputElement|null} */   (document.getElementById('title'));
  const dueEl    = /** @type {HTMLInputElement|null} */   (document.getElementById('task-due-date'));
  const catEl    = /** @type {HTMLSelectElement|null} */  (document.getElementById('category'));
  if (titleEl)  { titleEl.required = true; titleEl.minLength = 2; }
  if (dueEl)    { dueEl.required = true; }
  if (catEl)    { catEl.required = true; }   // ← verhindert Erstellen ohne Category

  /** Alle Felder des Overlays zurücksetzen. */
  function clearAddTaskForm() {
    (/** @type {HTMLInputElement}   */ (document.getElementById('title'))).value = '';
    (/** @type {HTMLTextAreaElement}*/ (document.getElementById('description'))).value = '';
    (/** @type {HTMLInputElement}   */ (document.getElementById('task-due-date'))).value = '';
    (/** @type {HTMLSelectElement}  */ (document.getElementById('category'))).selectedIndex = 0;

    // Assigned reset über Helper aus boardFirebase.js
    // @ts-ignore
    window.__boardResetAssigned && window.__boardResetAssigned();

    // Priority zurücksetzen → Medium aktiv + hidden required Feld setzen
    document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
    const m = /** @type {HTMLButtonElement|null} */ (document.querySelector('.priority-buttons .btn[data-priority="medium"]'));
    if (m) m.classList.add('active');
    setOverlayPriority('medium');

    // Subtasks zurücksetzen
    subtasks = [];
    const ul = /** @type {HTMLUListElement | null} */ (document.getElementById('subtask-list'));
    if (ul) ul.innerHTML = '';
    if (subtaskInput) subtaskInput.value = '';
    hideInlineActions();

    // Kein Fokus setzen & keine reportValidity hier!
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Priority Button Handling  (+ hidden required Feld setzen)
  // ──────────────────────────────────────────────────────────────────────────
  document.querySelectorAll('.priority-buttons .btn')
    .forEach((btn, _, all) => {
      btn.addEventListener('click', function () {
        all.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const p = /** @type {HTMLElement} */ (this).dataset.priority || '';
        setOverlayPriority((p === 'urgent' || p === 'medium' || p === 'low') ? p : '');
      });
    });

  // ──────────────────────────────────────────────────────────────────────────
  // Subtasks (Eingabe mit X & ✓, Liste, Inline-Edit)
  // ──────────────────────────────────────────────────────────────────────────
  /**
   * @typedef {{ title:string; done:boolean }} Subtask
   */
  let subtasks = /** @type {Subtask[]} */ ([]);

  // ---------- Subtask-Eingabe (X & ✓ im Input) ----------
  const subtaskWrap   = /** @type {HTMLDivElement|null} */ (document.querySelector('.input-icon-subtask'));
  const subtaskInput  = /** @type {HTMLInputElement|null} */  (subtaskWrap?.querySelector('input'));
  const addIconBtn    = /** @type {HTMLButtonElement|null} */ (subtaskWrap?.querySelector('.add-subtask')); // altes Plus-Icon
  const subtaskList   = /** @type {HTMLUListElement|null} */  (document.getElementById('subtask-list'));

  // Inline-Container im Input anlegen (falls nicht vorhanden)
  let inlineWrap = /** @type {HTMLDivElement|null} */ (subtaskWrap?.querySelector('.subtask-inline-actions'));
  if (subtaskWrap && !inlineWrap) {
    inlineWrap = document.createElement('div');
    inlineWrap.className = 'subtask-inline-actions';

    const btnClear = document.createElement('button');
    btnClear.type = 'button';
    btnClear.className = 'inline-btn inline-x';
    btnClear.textContent = '✕';

    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'inline-btn inline-check';
    btnOk.textContent = '✓';

    inlineWrap.appendChild(btnClear);
    inlineWrap.appendChild(btnOk);
    subtaskWrap.appendChild(inlineWrap);

    // Aktionen
    btnClear.addEventListener('click', () => {
      if (!subtaskInput) return;
      subtaskInput.value = '';
      subtaskInput.focus();
      hideInlineActions();
    });
    btnOk.addEventListener('click', () => {
      addSubtask();
      hideInlineActions();
      subtaskInput?.focus();
    });
  }

  function showInlineActions() {
    if (inlineWrap) inlineWrap.style.display = 'flex';
    if (addIconBtn) addIconBtn.style.display = 'none';
  }
  function hideInlineActions() {
    if (inlineWrap) inlineWrap.style.display = 'none';
    if (addIconBtn) addIconBtn.style.display = '';
  }

  // Events fürs Eingabefeld
  if (subtaskInput) {
    subtaskInput.addEventListener('focus', showInlineActions);
    subtaskInput.addEventListener('input', showInlineActions);
    subtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSubtask();
        hideInlineActions();
        subtaskInput.focus();
      }
    });
    subtaskInput.addEventListener('blur', () => {
      setTimeout(() => {
        const inside = document.activeElement instanceof Node && subtaskWrap
          ? subtaskWrap.contains(document.activeElement)
          : false;
        if (!inside && !subtaskInput.value.trim()) hideInlineActions();
      }, 0);
    });
  }

  if (addIconBtn) addIconBtn.addEventListener('click', addSubtask);

  function addSubtask() {
    if (!subtaskInput || !subtaskList) return;
    const value = subtaskInput.value.trim();
    if (!value) return;

    const model = /** @type {Subtask} */ ({ title: value, done: false });
    subtasks.push(model);

    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.innerHTML = `
      <span class="subtask-title">${escapeHtml(value)}</span>
      <span class="subtask-actions" style="display:none;">
        <button type="button" class="subtask-edit-btn" title="Bearbeiten">
          <img src="../assets/icons/add_task/edit.png" alt="Edit" style="width:16px;height:16px;">
        </button>
        <button type="button" class="subtask-delete-btn" title="Löschen">
          <img src="../assets/icons/add_task/delete.png" alt="Delete" style="width:16px;height:16px;">
        </button>
      </span>
    `;
    subtaskList.appendChild(li);
    subtaskInput.value = '';

    li.addEventListener('mouseenter', () => {
      const a = /** @type {HTMLElement|null} */ (li.querySelector('.subtask-actions'));
      if (a) a.style.display = 'inline-block';
    });
    li.addEventListener('mouseleave', () => {
      const a = /** @type {HTMLElement|null} */ (li.querySelector('.subtask-actions'));
      if (a) a.style.display = 'none';
    });

    (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-edit-btn')))?.addEventListener('click', () => {
      editSubtaskInline(li, model);
    });
    (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-delete-btn')))?.addEventListener('click', () => {
      if (!subtaskList) return;
      const items = Array.from(subtaskList.children);
      const idx = items.indexOf(li);
      if (idx > -1) subtasks.splice(idx, 1);
      li.remove();
    });
  }

  function editSubtaskInline(li, model) {
    const oldValue = model.title;

    const row = document.createElement('div');
    row.className = 'subtask-edit-row';
    // Input-Zeile vollbreit
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.width = '100%';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'subtask-edit-input';
    input.value = oldValue;
    input.placeholder = 'Edit subtask';
    // Input füllt die Zeile
    input.style.width = '100%';
    input.style.flex = '1 1 auto';
    input.style.boxSizing = 'border-box';

    const actions = document.createElement('div');
    actions.className = 'subtask-edit-actions';

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className = 'subtask-edit-btn';
    btnCancel.title = 'Cancel';
    btnCancel.textContent = '✕';

    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'subtask-edit-btn';
    btnOk.title = 'Save';
    btnOk.textContent = '✓';

    actions.append(btnCancel, btnOk);
    row.append(input, actions);
    li.innerHTML = ''; li.appendChild(row);

    const rebindItem = (newTitle) => {
      model.title = newTitle;
      li.innerHTML = `
        <span class="subtask-title">${escapeHtml(newTitle)}</span>
        <span class="subtask-actions" style="display:none;">
          <button type="button" class="subtask-edit-btn" title="Bearbeiten">
            <img src="../assets/icons/add_task/edit.png" alt="Edit" style="width:16px;height:16px;">
          </button>
          <button type="button" class="subtask-delete-btn" title="Löschen">
            <img src="../assets/icons/add_task/delete.png" alt="Delete" style="width:16px;height:16px;">
          </button>
        </span>
      `;
      (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-edit-btn')))?.addEventListener('click', () => editSubtaskInline(li, model));
      (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-delete-btn')))?.addEventListener('click', () => {
        const ul = li.parentElement; if (!ul) return;
        const idx = Array.from(ul.children).indexOf(li);
        if (idx > -1) subtasks.splice(idx, 1);
        li.remove();
      });
    };

    const save = () => rebindItem(input.value.trim() || oldValue);
    const cancel = () => rebindItem(oldValue);

    btnOk.addEventListener('click', save);
    btnCancel.addEventListener('click', cancel);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); });

    input.focus(); input.select();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Kategorien füllen
  // ──────────────────────────────────────────────────────────────────────────
  /** @type {("Technical Task"|"User Story"|"Bug"|"Research")[]} */
  const categories = ["Technical Task", "User Story", "Bug", "Research"];
  const catSelect = /** @type {HTMLSelectElement} */ (document.getElementById('category'));
  if (catSelect) {
    catSelect.innerHTML = '<option value="">Select task category</option>';
    categories.forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      catSelect.appendChild(o);
    });
    // sicherstellen, dass native Validation greift
    catSelect.required = true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Create Task (native HTML-Validation via reportValidity)
  // ──────────────────────────────────────────────────────────────────────────
  (/** @type {HTMLButtonElement} */ (document.querySelector('.create_task_btn')))
    .addEventListener('click', () => {
      // native Browser-Validierung des Overlays
      if (overlayForm && !overlayForm.reportValidity()) return;

      const overlayDlg = /** @type {HTMLDialogElement} */ (document.getElementById('addTaskOverlay'));

      const title       = (/** @type {HTMLInputElement}   */ (document.getElementById('title'))).value.trim();
      const description = (/** @type {HTMLTextAreaElement}*/ (document.getElementById('description'))).value.trim();
      const dueDate     = (/** @type {HTMLInputElement}   */ (document.getElementById('task-due-date'))).value.trim();
      const category    = (/** @type {HTMLSelectElement}  */ (document.getElementById('category'))).value;

      // Aus boardFirebase.js
      // @ts-ignore
      const assignedTo = (window.__boardGetSelectedAssigned && window.__boardGetSelectedAssigned()) || [];

      const activeBtn = /** @type {HTMLButtonElement | null} */ (
        document.querySelector('.priority-buttons .btn.active')
      );
      const priority  = activeBtn ? activeBtn.dataset.priority : null;

      const taskObj = {
        title,
        description,
        dueDate,
        priority,
        assignedTo,
        category,
        subtasks: [...subtasks],
        status: overlayDlg.dataset.status || 'todo',
        createdAt: Date.now()
      };

      const newKey = firebase.database().ref().child('tasks').push().key;
      firebase.database().ref('tasks/' + newKey).set({ ...taskObj, id: newKey })
        .then(() => {
          overlayDlg.close();
          // Felder leeren (wie beim Schließen)
          (/** @type {HTMLInputElement}   */ (document.getElementById('title'))).value = '';
          (/** @type {HTMLTextAreaElement}*/ (document.getElementById('description'))).value = '';
          (/** @type {HTMLInputElement}   */ (document.getElementById('task-due-date'))).value = '';
          (/** @type {HTMLSelectElement}  */ (document.getElementById('category'))).selectedIndex = 0;
          // @ts-ignore
          window.__boardResetAssigned && window.__boardResetAssigned();
          document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
          const ul = /** @type {HTMLUListElement | null} */ (document.getElementById('subtask-list'));
          if (ul) ul.innerHTML = '';

          showBoardAddToast(); // slidet rein & verschwindet automatisch
        })
        .catch(err => {
          // Nur Speichere-Fehler noch im Dialog anzeigen
          showErrorDialog("Fehler: " + err.message);
        });
    });
}

// === Kleine Helper für min-Date ===
function setDateMinToday(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.setAttribute('min', new Date().toISOString().split('T')[0]);
}
document.addEventListener('DOMContentLoaded', () => {
  setDateMinToday('#task-due-date');   // Add Task (Board-Overlay)
});

/** Image-only Slide-Toast (Board) – kommt von unten in die Mitte und verschwindet automatisch */
function showBoardAddToast() {
  // Styles nur 1× injizieren
  let style = document.getElementById('board-add-toast-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'board-add-toast-style';
    style.textContent = `
      @keyframes boardToastIn {
        0%   { top: 100%; transform: translate(-50%, 0);    opacity: 1; }
        100% { top: 50%;  transform: translate(-50%, -50%); opacity: 1; }
      }
      @keyframes boardToastOut {
        0%   { top: 50%;  transform: translate(-50%, -50%); opacity: 1; }
        100% { top: 100%; transform: translate(-50%, 0);    opacity: 0; }
      }
      #boardAddToast {
        position: fixed;
        left: 50%;
        top: 100%;
        transform: translate(-50%, 0);
        z-index: 99999;
        background: transparent;
        padding: 0;
        border-radius: 0;
        box-shadow: none;
        pointer-events: none;
      }
      #boardAddToast img { display:block; width:300px; height:auto; }
      #boardAddToast.enter { animation: boardToastIn .55s cubic-bezier(.2,.8,.2,1) forwards; }
      #boardAddToast.leave { animation: boardToastOut .5s ease forwards; }
    `;
    document.head.appendChild(style);
  }

  // Node erstellen/wiederverwenden
  let toast = document.getElementById('boardAddToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'boardAddToast';
    toast.innerHTML = `<img src="../assets/icons/add_task/board_white.png" alt="">`;
    document.body.appendChild(toast);
  }

  // Eintrittsanimation neu starten
  toast.classList.remove('leave', 'enter');
  // @ts-ignore – reflow
  void toast.offsetWidth;
  toast.classList.add('enter');

  // Auto-Hide
  clearTimeout(/** @type {any} */(showBoardAddToast)._t);
  /** @type {any} */(showBoardAddToast)._t = setTimeout(() => {
    toast.classList.remove('enter');
    toast.classList.add('leave');
    const onEnd = () => {
      toast.removeEventListener('animationend', onEnd);
      toast.remove();  // komplett raus
    };
    toast.addEventListener('animationend', onEnd);
  }, 1200);
}
