// @ts-check

/** Firebase kommt über das CDN → aus `window` ziehen (Cast auf window) */
const firebase = /** @type {any} */ (window).firebase;

document.addEventListener('DOMContentLoaded', /** @param {Event} _ev */ function (_ev) {

  /* ──────────────────────────────────────────────────────────────────────────
   *  Validation Styles sicher injizieren (falls auf Add-Task-Seite nicht vorhanden)
   * ────────────────────────────────────────────────────────────────────────── */
  (function ensureValidationStyles() {
    if (document.getElementById('custom-validation-styles')) return;
    const s = document.createElement('style');
    s.id = 'custom-validation-styles';
    s.textContent = `
      .field-invalid { border: 2px solid #E74C3C !important; background-color: #fffafa; }
      .form-group .field-hint { display:none; color:#E74C3C; font-size:.9rem; }
      .form-group .field-hint.show { display:block; }
    `;
    document.head.appendChild(s);
  })();

  // ---- Form Validation (Add Task Seite) ----
  const addForm = /** @type {HTMLFormElement|null} */ (document.getElementById('addTaskForm'));

  // Falls das versteckte Pflichtfeld für Priority nicht existiert, anlegen
  let priorityHidden = /** @type {HTMLInputElement|null} */ (document.getElementById('priorityField'));
  if (!priorityHidden) {
    priorityHidden = document.createElement('input');
    priorityHidden.type = 'text';
    priorityHidden.id = 'priorityField';
    priorityHidden.name = 'priority';
    Object.assign(priorityHidden.style, {
      position: 'absolute', left: '-9999px', opacity: '0',
      width: '0', height: '0', border: '0', padding: '0'
    });
    (addForm || document.body).appendChild(priorityHidden);
  }

  // Titel/Due/Category als required (wir nutzen eigene UI, keine Browser-Bubbles)
  (/** @type {HTMLInputElement|null} */(document.getElementById('title')))?.setAttribute('required','');
  (/** @type {HTMLInputElement|null} */(document.getElementById('title')))?.setAttribute('minlength','2');
  (/** @type {HTMLInputElement|null} */(document.getElementById('due')))?.setAttribute('required','');
  (/** @type {HTMLSelectElement|null} */(document.getElementById('category')))?.setAttribute('required','');

  // Priority Helper (nur Wert halten; Fehlerdarstellung machen wir selbst)
  function setPriorityValue(v /** @type {'urgent'|'medium'|'low'|''} */) {
    if (!priorityHidden) return;
    priorityHidden.value = v || '';
  }

  /** Kategorien befüllen */
  const categories = /** @type {("Technical Task"|"User Story"|"Bug"|"Research")[]} */(
    ["Technical Task", "User Story", "Bug", "Research"]
  );
  const categorySelect = /** @type {HTMLSelectElement | null} */ (document.getElementById('category'));
  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">Select task category</option>';
    categories.forEach(cat => {
      categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }

  // ---------------------------------------------------------------------------
  // Assigned-User Dropdown (Avatare + Badges)
  // ---------------------------------------------------------------------------

  const assignedDropdown = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedDropdown'));
  const assignedBadges   = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedBadges'));

  /** @typedef {{name:string; initials:string; selected:boolean; email?:string}} AssignedUserEntry */
  /** @type {Record<string, AssignedUserEntry>} */
  let assignedUsers = {};

  const currentUserEmail = (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();

  function getInitials(name) {
    return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('');
  }

  Promise.all([
    fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/users.json").then(r => r.json()),
    fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts.json").then(r => r.json())
  ])
    .then(([users, contacts]) => {
      if (users && typeof users === 'object') {
        Object.entries(users).forEach(([id, data]) => {
          const name = (data && (data.name || data.email)) || id;
          assignedUsers[id] = { name, email: (data && data.email) || '', initials: getInitials(name), selected: false };
        });
      }
      if (contacts && typeof contacts === 'object') {
        Object.entries(contacts).forEach(([id, data]) => {
          if (!assignedUsers[id]) {
            const name = (data && data.name) || id;
            assignedUsers[id] = { name, email: '', initials: getInitials(name), selected: false };
          }
        });
      }
      renderAssignedDropdown();
      renderAssignedBadges();
    })
    .catch((err) => console.error('Failed to load users/contacts', err));

  function generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  function renderAssignedDropdown() {
    if (!assignedDropdown) return;
    assignedDropdown.innerHTML = '';

    Object.entries(assignedUsers).forEach(([id, user]) => {
      const option = document.createElement('div');
      option.className = 'custom-option';
      option.dataset.userId = id;

      option.style.borderRadius = '8px';
      option.style.padding = '4px 8px';
      option.style.transition = 'background-color 0.075s, color 0.075s';

      const avatar = document.createElement('div');
      avatar.className = 'custom-option-avatar';
      avatar.style.backgroundColor = generateColorFromString(user.name);
      avatar.textContent = user.initials;

      const label = document.createElement('div');
      label.className = 'custom-option-label';
      label.textContent = user.name + (
        user.email && user.email.trim().toLowerCase() === currentUserEmail ? ' (You)' : ''
      );

      const checkbox = document.createElement('img');
      checkbox.className = 'custom-option-checkbox';
      checkbox.src = user.selected ? '../assets/icons/add_task/selected.svg' : '../assets/icons/add_task/unselected.svg';
      checkbox.style.width = '18px';
      checkbox.style.height = '18px';

      option.append(avatar, label, checkbox);
      assignedDropdown.appendChild(option);

      function updateStyle() {
        if (user.selected) { option.style.backgroundColor = '#2A3647'; label.style.color = '#ffffff'; }
        else { option.style.backgroundColor = ''; label.style.color = ''; }
      }
      updateStyle();

      option.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        assignedUsers[id].selected = !assignedUsers[id].selected;
        checkbox.src = assignedUsers[id].selected ? '../assets/icons/add_task/unselected.svg' : '../assets/icons/add_task/selected.svg';
        renderAssignedDropdown();
        renderAssignedBadges();
      });

      option.addEventListener('mouseenter', () => { if (user.selected) option.style.backgroundColor = '#091931'; });
      option.addEventListener('mouseleave', updateStyle);
    });
  }

  function renderAssignedBadges() {
    if (!assignedBadges) return;

    const MAX_BADGES = 4;
    assignedBadges.innerHTML = '';

    const selected = Object.values(assignedUsers).filter(u => u.selected);

    selected.slice(0, MAX_BADGES).forEach(user => {
      const badge = document.createElement('div');
      badge.className = 'avatar-badge';
      badge.textContent = user.initials;
      badge.style.backgroundColor = generateColorFromString(user.name);
      assignedBadges.appendChild(badge);
    });

    const extra = selected.length - MAX_BADGES;
    if (extra > 0) {
      const more = document.createElement('div');
      more.className = 'avatar-badge avatar-badge-more';
      more.textContent = `+${extra}`;
      assignedBadges.appendChild(more);
    }
  }

  // ---------------------------------------------------------------------------
  // Priority-Buttons
  // ---------------------------------------------------------------------------
  /** @type {NodeListOf<HTMLButtonElement>} */
  const priorityBtns = document.querySelectorAll('.priority-buttons .btn');
  priorityBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.classList.contains('btn_medium')) {
      const def = /** @type {HTMLImageElement | null} */ (btn.querySelector('.icon.default'));
      const sel = /** @type {HTMLImageElement | null} */ (btn.querySelector('.icon.white'));
      if (def && sel) { def.style.display = ''; sel.style.display = 'none'; }
    }
    btn.addEventListener('click', function () {
      priorityBtns.forEach(b => {
        b.classList.remove('active');
        if (b.classList.contains('btn_medium')) {
          const def = /** @type {HTMLElement | null} */ (b.querySelector('.icon.default'));
          const sel = /** @type {HTMLElement | null} */ (b.querySelector('.icon.white'));
          if (def && sel) { def.style.display = ''; sel.style.display = 'none'; }
        }
      });
      this.classList.add('active');
      if (this.classList.contains('btn_medium')) {
        const def = /** @type {HTMLElement | null} */ (this.querySelector('.icon.default'));
        const sel = /** @type {HTMLElement | null} */ (this.querySelector('.icon.white'));
        if (def && sel) { def.style.display = 'none'; sel.style.display = ''; }
      }
      const p = (this.dataset.priority || '').toLowerCase();
      setPriorityValue((p === 'urgent' || p === 'medium' || p === 'low') ? p : '');
      document.querySelector('.priority-buttons')?.classList.remove('field-invalid');
    });
  });
  // Medium als Default
  (function preselectMedium() {
    const mediumBtn = /** @type {HTMLButtonElement | null} */(document.querySelector('.priority-buttons .btn.btn_medium'));
    if (mediumBtn) {
      mediumBtn.classList.add('active');
      const def = /** @type {HTMLElement | null} */(mediumBtn.querySelector('.icon.default'));
      const sel = /** @type {HTMLElement | null} */(mediumBtn.querySelector('.icon.white'));
      if (def && sel) { def.style.display = 'none'; sel.style.display = ''; }
      setPriorityValue('medium');
    }
  })();

  // ---------------------------------------------------------------------------
  // Subtasks
  // ---------------------------------------------------------------------------
  /** @typedef {{ title:string, done:boolean }} Subtask */
  let subtasks = /** @type {Subtask[]} */ ([]);

  const subtaskInput    = /** @type {HTMLInputElement|null} */ (document.querySelector('.input-icon-subtask input'));
  const subtaskAddBtn   = /** @type {HTMLButtonElement|null} */ (document.querySelector('.add-subtask'));
  const subtaskClearBtn = /** @type {HTMLButtonElement|null} */ (document.querySelector('.clear-subtask-input'));
  const subtaskList     = /** @type {HTMLUListElement|null} */ (document.getElementById('subtask-list'));

  const subtaskWrap = /** @type {HTMLDivElement|null} */ (document.querySelector('.input-icon-subtask'));
  let inlineWrap = /** @type {HTMLDivElement|null} */ (subtaskWrap?.querySelector('.subtask-inline-actions'));

  (function ensureInlineStyles(){
    let s = document.getElementById('subtask-inline-styles');
    if (!s) {
      s = document.createElement('style');
      s.id = 'subtask-inline-styles';
      s.textContent = `
        .input-icon-subtask{ position:relative; }
        .subtask-inline-actions{
          position:absolute; inset-inline-end:8px; top:50%;
          transform:translateY(-50%);
          display:none; gap:8px; align-items:center;
        }
        .subtask-inline-actions .inline-btn{
          border:none; background:transparent; padding:4px; line-height:1; cursor:pointer; border-radius:8px;
        }
        .subtask-inline-actions .inline-btn:hover{
          background:#f1f1f1; outline:1px solid #dcdcdc;
        }
      `;
      document.head.appendChild(s);
    }
  })();

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

    inlineWrap.append(btnClear, btnOk);
    subtaskWrap.appendChild(inlineWrap);

    btnClear.addEventListener('click', () => {
      if (!subtaskInput) return;
      subtaskInput.value = '';
      subtaskInput.focus();
      hideInlineActions();
    });
    btnOk.addEventListener('click', () => {
      addSubtask();
      subtaskInput?.focus();
      hideInlineActions();
    });
  }

  function showInlineActions() {
    if (inlineWrap) inlineWrap.style.display = 'flex';
    if (subtaskAddBtn) subtaskAddBtn.style.display = 'none';
  }
  function hideInlineActions() {
    if (inlineWrap) inlineWrap.style.display = 'none';
    if (subtaskAddBtn) subtaskAddBtn.style.display = '';
  }

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

  /** Safe HTML */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  if (subtaskInput && subtaskAddBtn) {
    subtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addSubtask(); }
    });
    subtaskAddBtn.addEventListener('click', addSubtask);
  }

  function addSubtask() {
    if (!subtaskInput || !subtaskList) return;
    const value = subtaskInput.value.trim();
    if (!value) return;

    const subtaskObj = /** @type {Subtask} */ ({ title: value, done: false });
    subtasks.push(subtaskObj);

    const li = document.createElement('li');
    li.classList.add('subtask-item');
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
      editSubtask(li, subtaskObj);
    });
    (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-delete-btn')))?.addEventListener('click', () => {
      if (!subtaskList) return;
      const idx = Array.from(subtaskList.children).indexOf(li);
      if (idx > -1) subtasks.splice(idx, 1);
      li.remove();
    });
  }

  function editSubtask(li, subtaskObj) {
    const oldValue = subtaskObj.title;
    li.classList.add('editing');

    const row = document.createElement('div');
    row.className = 'subtask-edit-box';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.width = '100%';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldValue;
    input.placeholder = 'Edit subtask';
    input.className = 'subtask-edit-input';
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

    li.innerHTML = '';
    li.appendChild(row);

    btnCancel.addEventListener('mousedown', e => e.preventDefault());
    btnOk.addEventListener('mousedown',     e => e.preventDefault());

    const rebuild = (text) => {
      subtaskObj.title = text;
      li.classList.remove('editing');
      li.innerHTML = `
        <span class="subtask-title">${escapeHtml(text)}</span>
        <span class="subtask-actions" style="display:none;">
          <button type="button" class="subtask-edit-btn" title="Bearbeiten">
            <img src="../assets/icons/add_task/edit.png" alt="Edit" style="width:16px;height:16px;">
          </button>
          <button type="button" class="subtask-delete-btn" title="Löschen">
            <img src="../assets/icons/add_task/delete.png" alt="Delete" style="width:16px;height:16px;">
          </button>
        </span>
      `;
      (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-edit-btn')))?.addEventListener('click', () => editSubtask(li, subtaskObj));
      (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-delete-btn')))?.addEventListener('click', () => {
        const ul = li.parentElement; if (!ul) return;
        const idx = Array.from(ul.children).indexOf(li);
        if (idx > -1) subtasks.splice(idx, 1);
        li.remove();
      });
    };

    const save   = () => rebuild(input.value.trim() || oldValue);
    const cancel = () => rebuild(oldValue);

    btnOk.addEventListener('click', save);
    btnCancel.addEventListener('click', cancel);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); });
    input.addEventListener('blur', save);

    input.focus();
    input.select();
  }

  if (subtaskClearBtn && subtaskInput) {
    subtaskClearBtn.addEventListener('click', () => {
      subtaskInput.value = '';
      subtaskClearBtn.style.display = 'none';
    });
  }

  // === heutiges Datum als Minimum (lokale Zeitzone) ===
  const dueInput = /** @type {HTMLInputElement|null} */ (document.getElementById('due'));
  if (dueInput) {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const todayLocalISO = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);
    dueInput.min = todayLocalISO;
    dueInput.addEventListener('input', () => {
      if (dueInput.value && dueInput.value < dueInput.min) {
        dueInput.value = dueInput.min;
      }
    });
  }

  /* ──────────────────────────────────────────────────────────────────────────
   * Eigene Validation-Helfer (zeigen/ausblenden + Hints ggf. erzeugen)
   * ────────────────────────────────────────────────────────────────────────── */
  function getFormGroup(el) {
    return el?.closest('.form-group') || el?.parentElement || null;
  }
  function ensureHintFor(el) {
    const grp = getFormGroup(el);
    if (!grp) return null;
    let hint = /** @type {HTMLElement|null} */ (grp.querySelector('.field-hint'));
    if (!hint) {
      hint = document.createElement('small');
      hint.className = 'field-hint';
    hint.textContent = 'This field is required';
      grp.appendChild(hint);
    }
    return hint;
  }
  function markInvalid(el) {
    if (!el) return;
    el.classList.add('field-invalid');
    el.setAttribute('aria-invalid', 'true');
    const hint = ensureHintFor(el);
    if (hint) hint.classList.add('show');
  }
  function clearInvalidUI(el) {
    if (!el) return;
    el.classList.remove('field-invalid');
    el.removeAttribute('aria-invalid');
    const grp = getFormGroup(el);
    const hint = grp ? grp.querySelector('.field-hint') : null;
    if (hint) hint.classList.remove('show');
  }

  // Referenzen + Live-Reset
  const titleEl       = /** @type {HTMLInputElement | null} */   (document.getElementById('title'));
  const descriptionEl = /** @type {HTMLTextAreaElement | null} */(document.getElementById('description'));
  const dueEl         = /** @type {HTMLInputElement | null} */   (document.getElementById('due'));
  const categoryElRef = /** @type {HTMLSelectElement | null} */  (document.getElementById('category'));

  titleEl?.addEventListener('input',   () => clearInvalidUI(titleEl));
  dueEl?.addEventListener('input',     () => clearInvalidUI(dueEl));
  categoryElRef?.addEventListener('change', () => clearInvalidUI(categoryElRef));

  function validateFormCustom() {
    let ok = true;

    if (!titleEl || titleEl.value.trim().length < 2) { markInvalid(titleEl); ok = false; }

    if (!dueEl || !dueEl.value) {
      markInvalid(dueEl); ok = false;
    } else {
      const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
      const todayLocalISO = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);
      if (dueEl.value < todayLocalISO) { markInvalid(dueEl); ok = false; }
    }

    if (!categoryElRef || !categoryElRef.value) { markInvalid(categoryElRef); ok = false; }

    const prioWrap = document.querySelector('.priority-buttons');
    const prioVal = priorityHidden?.value || '';
    if (!prioVal) { prioWrap?.classList.add('field-invalid'); ok = false; }
    else          { prioWrap?.classList.remove('field-invalid'); }

    return ok;
  }

  /** Slide-in toast that shows ONLY the image (which already contains the text). */
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
      #addTaskToast img { display: block; width: 300px; height: auto; }
    `;
    let toast = document.getElementById('addTaskToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'addTaskToast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<img src="../assets/icons/add_task/board_white.png" alt="">`;
    toast.classList.remove('enter');
    // @ts-ignore
    void toast.offsetHeight;
    toast.classList.add('enter');
  }

  // Create Task (nur unsere Custom-Validation)
  const createBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.create_task_btn'));
  if (createBtn) {
    createBtn.addEventListener('click', function (e) {
      e.preventDefault();

      if (!validateFormCustom()) return;

      const title       = titleEl?.value.trim() ?? '';
      const description = descriptionEl?.value.trim() ?? '';
      const dueDate     = dueEl?.value.trim() ?? '';
      const category    = categoryElRef?.value ?? '';

      const assignedTo = Object.entries(assignedUsers)
        .filter(([, u]) => u.selected)
        .map(([id]) => id);

      /** @type {'urgent'|'medium'|'low'|null} */
      let priority = null;
      const activePriorityBtn = /** @type {HTMLButtonElement | null} */ (
        document.querySelector('.priority-buttons .btn.active')
      );
      if (activePriorityBtn) {
        const p = (activePriorityBtn.dataset.priority || '').toLowerCase();
        if (p === 'urgent' || p === 'medium' || p === 'low') priority = p;
      }

      const taskObj = {
        title,
        description,
        dueDate,
        priority,
        assignedTo,
        category,
        subtasks: [...subtasks],
        status: "todo",
        createdAt: Date.now()
      };

      const newTaskKey = firebase.database().ref().child('tasks').push().key;
      firebase.database().ref('tasks/' + newTaskKey).set({ ...taskObj, id: newTaskKey })
        .then(() => {
          showAddTaskToast();
          setTimeout(() => { window.location.href = '../pages/board.html'; }, 1600);
        })
        .catch(err => console.error('Fehler beim Speichern:', err));
    });
  }

  function getCategorySelect() {
    const el =
      document.getElementById('category') ||
      document.querySelector('select#category') ||
      document.querySelector('select[name="category"]');
    return (el instanceof HTMLSelectElement) ? el : null;
  }

  /** Formular zurücksetzen */
  function clearForm() {
    const t  = /** @type {HTMLInputElement | null} */ (document.getElementById('title'));
    const d  = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('description'));
    const du = /** @type {HTMLInputElement | null} */ (document.getElementById('due'));
    if (t)  t.value = '';
    if (d)  d.value = '';
    if (du) du.value = '';

    const catEl = getCategorySelect();
    if (catEl) {
      catEl.selectedIndex = 0;
      catEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    Object.values(assignedUsers).forEach(u => (u.selected = false));
    renderAssignedDropdown();
    renderAssignedBadges();
    const dropdownLocal = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedDropdown'));
    if (dropdownLocal) dropdownLocal.classList.add('hidden');

    /** @type {NodeListOf<HTMLButtonElement>} */
    const allPrioBtns = document.querySelectorAll('.priority-buttons .btn');
    allPrioBtns.forEach(b => {
      b.classList.remove('active');
      if (b.classList.contains('btn_medium')) {
        const def = /** @type {HTMLElement | null} */ (b.querySelector('.icon.default'));
        const sel = /** @type {HTMLElement | null} */ (b.querySelector('.icon.white'));
        if (def && sel) { def.style.display = ''; sel.style.display = 'none'; }
      }
    });
    const mediumBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.priority-buttons .btn.btn_medium'));
    if (mediumBtn) {
      mediumBtn.classList.add('active');
      const def = /** @type {HTMLElement | null} */ (mediumBtn.querySelector('.icon.default'));
      const sel = /** @type {HTMLElement | null} */ (mediumBtn.querySelector('.icon.white'));
      if (def && sel) { def.style.display = 'none'; sel.style.display = ''; }
      setPriorityValue('medium');
    }
    document.querySelector('.priority-buttons')?.classList.remove('field-invalid');

    // Subtasks leeren
    subtasks = [];
    const subtaskListLocal = /** @type {HTMLUListElement | null} */ (document.getElementById('subtask-list'));
    if (subtaskListLocal) subtaskListLocal.innerHTML = '';
    const subtaskInputLocal = /** @type {HTMLInputElement | null} */ (document.querySelector('.input-icon-subtask input'));
    if (subtaskInputLocal) subtaskInputLocal.value = '';
    const clearX = /** @type {HTMLButtonElement | null} */ (document.querySelector('.clear-subtask-input'));
    if (clearX) clearX.style.display = 'none';

    // Invalid-UI überall entfernen
    clearInvalidUI(document.getElementById('title'));
    clearInvalidUI(document.getElementById('due'));
    clearInvalidUI(document.getElementById('category'));
  }

  const clearBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.clear_button'));
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearForm();
    });
  }

  // Assigned-Dropdown öffnen/schließen
  const assignedSelectBox = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedSelectBox'));
  const dropdown = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedDropdown'));
  if (assignedSelectBox && dropdown) {
    assignedSelectBox.addEventListener('click', () => dropdown.classList.toggle('hidden'));
  }
  document.addEventListener('click', (e) => {
    const wrapper = /** @type {HTMLDivElement | null} */ (document.querySelector('.assigned-to-wrapper'));
    const target = /** @type {EventTarget | null} */ (e.target);
    if (wrapper && target instanceof Node && !wrapper.contains(target)) dropdown?.classList.add('hidden');
  });
});

// Min-Datum Helper (falls irgendwo zusätzlich genutzt)
function setDateMinToday(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.setAttribute('min', new Date().toISOString().split('T')[0]);
}
document.addEventListener('DOMContentLoaded', () => {
  setDateMinToday('#task-due-date');
  setDateMinToday('#editDueDate');
});
