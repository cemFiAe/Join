// @ts-check

/** Firebase kommt über das CDN → aus `window` ziehen (Cast auf window) */
const firebase = /** @type {any} */ (window).firebase;

document.addEventListener('DOMContentLoaded', /** @param {Event} _ev */ function (_ev) {

  // ---- Form Validation (Add Task Seite) ----
const addForm = /** @type {HTMLFormElement|null} */ (document.getElementById('addTaskForm'));

// Falls das versteckte Pflichtfeld für Priority nicht existiert, anlegen
let priorityHidden = /** @type {HTMLInputElement|null} */ (document.getElementById('priorityField'));
if (!priorityHidden && addForm) {
  priorityHidden = document.createElement('input');
  priorityHidden.type = 'text';
  priorityHidden.id = 'priorityField';
  priorityHidden.name = 'priority';
  priorityHidden.required = true;
  // unsichtbar machen
  priorityHidden.style.position = 'absolute';
  priorityHidden.style.left = '-9999px';
  priorityHidden.style.opacity = '0';
  priorityHidden.style.width = '0';
  priorityHidden.style.height = '0';
  priorityHidden.style.border = '0';
  priorityHidden.style.padding = '0';
  addForm.appendChild(priorityHidden);
}

// Titel/Due/Category sicherheitshalber als required markieren (falls im HTML mal fehlt)
(/** @type {HTMLInputElement|null} */(document.getElementById('title')))?.setAttribute('required','');
(/** @type {HTMLInputElement|null} */(document.getElementById('title')))?.setAttribute('minlength','2');
(/** @type {HTMLInputElement|null} */(document.getElementById('due')))?.setAttribute('required','');
(/** @type {HTMLSelectElement|null} */(document.getElementById('category')))?.setAttribute('required','');

// Helper: Priority-Wert in das versteckte Feld schreiben (+ CustomValidity)
function setPriorityValue(v /** @type {'urgent'|'medium'|'low'|''} */) {
  if (!priorityHidden) return;
  priorityHidden.value = v || '';
  priorityHidden.setCustomValidity(priorityHidden.value ? '' : 'Please choose a priority');
}


/**
 * Liste der verfügbaren Kategorien für Tasks.
 * @type {("Technical Task"|"User Story"|"Bug"|"Research")[]}
 */
const categories = ["Technical Task", "User Story", "Bug", "Research"];

/** Kategorien-Dropdown initialisieren */
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

/** Container für die Optionsliste im Dropdown */
const assignedDropdown = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedDropdown'));
/** Container für die runden Badges unter dem Feld */
const assignedBadges = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedBadges'));

/**
 * Form einer „Assigned“-Eintragung pro User/Kontakt.
 * @typedef {Object} AssignedUserEntry
 * @property {string} name
 * @property {string} initials
 * @property {boolean} selected
 * @property {string=} email
 */

/**
 * Map: userId -> AssignedUserEntry
 * @type {Record<string, AssignedUserEntry>}
 */
let assignedUsers = {};

/** aktuell eingeloggte Mail (für „(You)“-Markierung) */
const currentUserEmail = (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();

/**
 * Initialen (max. 2 Zeichen) aus einem Namen generieren.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('');
}

// Users + Contacts laden und in assignedUsers zusammenführen
Promise.all([
  fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/users.json").then(r => r.json()),
  fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts.json").then(r => r.json())
])
  .then(([users, contacts]) => {
    if (users && typeof users === 'object') {
      Object.entries(users).forEach(([id, data]) => {
        const name = (data && (data.name || data.email)) || id;
        assignedUsers[id] = {
          name,
          email: (data && data.email) || '',
          initials: getInitials(name),
          selected: false
        };
      });
    }
    if (contacts && typeof contacts === 'object') {
      Object.entries(contacts).forEach(([id, data]) => {
        if (!assignedUsers[id]) {
          const name = (data && data.name) || id;
          assignedUsers[id] = {
            name,
            email: '',
            initials: getInitials(name),
            selected: false
          };
        }
      });
    }
    renderAssignedDropdown();
    renderAssignedBadges();
  })
  .catch((err) => {
    console.error('Failed to load users/contacts', err);
  });

/**
 * Aus einem String deterministische HSL-Farbe erzeugen (für Avatare).
 * @param {string} str
 * @returns {string} hsl(...)
 */
function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Dropdown-Liste „Assigned to“ neu aufbauen.
 * Nutzt `assignedUsers` und schreibt die Optionen in `#assignedDropdown`.
 */
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

  option.appendChild(avatar);
  option.appendChild(label);
  option.appendChild(checkbox);
  assignedDropdown.appendChild(option);

  // Funktion, um Hintergrund und Schriftfarbe nur bei ausgewählten Users zu setzen
  function updateStyle() {
    if (user.selected) {
      option.style.backgroundColor = '#2A3647';
      label.style.color = '#ffffff';  
    } else {
      option.style.backgroundColor = '';
      label.style.color = '';          
    }
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

  // Hover nur, wenn User ausgewählt ist
  option.addEventListener('mouseenter', () => {
    if (user.selected) option.style.backgroundColor = '#091931';
  });
  option.addEventListener('mouseleave', () => {
    updateStyle();
  });
});
}



/**
 * Badge-Zeile unter dem Feld neu aufbauen.
 * Liest `assignedUsers` und schreibt in `#assignedBadges`.
 */
function renderAssignedBadges() {
  if (!assignedBadges) return;

  const MAX_BADGES = 4;               // bei Bedarf auf 5 ändern
  assignedBadges.innerHTML = '';

  const selected = Object.values(assignedUsers).filter(u => u.selected);

  // die ersten MAX_BADGES als Avatare
  selected.slice(0, MAX_BADGES).forEach(user => {
    const badge = document.createElement('div');
    badge.className = 'avatar-badge';
    badge.textContent = user.initials;
    badge.style.backgroundColor = generateColorFromString(user.name);
    assignedBadges.appendChild(badge);
  });

  // Rest als "+N"
  const extra = selected.length - MAX_BADGES;
  if (extra > 0) {
    const more = document.createElement('div');
    more.className = 'avatar-badge avatar-badge-more';
    more.textContent = `+${extra}`;
    assignedBadges.appendChild(more);
  }
}

// ---------------------------------------------------------------------------
// Priority-Buttons (ein Button aktiv + Icon-Wechsel bei "Medium")
// ---------------------------------------------------------------------------

/** @type {NodeListOf<HTMLButtonElement>} */
const priorityBtns = document.querySelectorAll('.priority-buttons .btn');

// alles zunächst in "inaktiv" + Icon-Default
priorityBtns.forEach(btn => {
  btn.classList.remove('active');
  if (btn.classList.contains('btn_medium')) {
    const def = /** @type {HTMLImageElement | null} */ (btn.querySelector('.icon.default'));
    const sel = /** @type {HTMLImageElement | null} */ (btn.querySelector('.icon.white'));
    if (def && sel) {
      def.style.display = '';
      sel.style.display = 'none';
    }
  }

  // Klick-Logik
  btn.addEventListener('click', function () {
    priorityBtns.forEach(b => {
      b.classList.remove('active');
      if (b.classList.contains('btn_medium')) {
        const def = /** @type {HTMLElement | null} */ (b.querySelector('.icon.default'));
        const sel = /** @type {HTMLElement | null} */ (b.querySelector('.icon.white'));
        if (def && sel) {
          def.style.display = '';
          sel.style.display = 'none';
        }
      }
    });
    this.classList.add('active');
    if (this.classList.contains('btn_medium')) {
      const def = /** @type {HTMLElement | null} */ (this.querySelector('.icon.default'));
      const sel = /** @type {HTMLElement | null} */ (this.querySelector('.icon.white'));
      if (def && sel) {
        def.style.display = 'none';
        sel.style.display = '';
      }
    }
    // NEU: verstecktes Pflichtfeld setzen (für Validation)
    const p = (this.dataset.priority || '').toLowerCase();
    if (p === 'urgent' || p === 'medium' || p === 'low') setPriorityValue(p);
    else setPriorityValue('');
  });
});

// "Medium" standardmäßig aktiv setzen (NUR EINMAL, nicht in der Schleife)
{
  const mediumBtn = /** @type {HTMLButtonElement | null} */(
    document.querySelector('.priority-buttons .btn.btn_medium')
  );
  if (mediumBtn) {
    mediumBtn.classList.add('active');
    const def = /** @type {HTMLElement | null} */(mediumBtn.querySelector('.icon.default'));
    const sel = /** @type {HTMLElement | null} */(mediumBtn.querySelector('.icon.white'));
    if (def && sel) {
      def.style.display = 'none';
      sel.style.display = '';
    }
    // NEU: Default auch im hidden Feld festhalten
    setPriorityValue('medium');
  }
}

// ---------------------------------------------------------------------------
// Subtasks (Erstellen, Inline-Edit, Löschen)
// ---------------------------------------------------------------------------

/**
 * Form eines Subtasks (Add Task Seite).
 * @typedef {Object} Subtask
 * @property {string} title
 * @property {boolean} done
 */

/** Aktuelle Subtask-Liste (wird in den Task übernommen) */
let subtasks = /** @type {Subtask[]} */ ([]);

/** DOM */
const subtaskInput    = /** @type {HTMLInputElement|null} */ (document.querySelector('.input-icon-subtask input'));
const subtaskAddBtn   = /** @type {HTMLButtonElement|null} */ (document.querySelector('.add-subtask'));
const subtaskClearBtn = /** @type {HTMLButtonElement|null} */ (document.querySelector('.clear-subtask-input'));
const subtaskList     = /** @type {HTMLUListElement|null} */ (document.getElementById('subtask-list'));

// --- Inline X & ✓ im Subtask-Input (Add Task) ---
const subtaskWrap = /** @type {HTMLDivElement|null} */ (document.querySelector('.input-icon-subtask'));
let inlineWrap = /** @type {HTMLDivElement|null} */ (subtaskWrap?.querySelector('.subtask-inline-actions'));

// Styles nur 1x injizieren
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

// Container + Buttons anlegen (falls nicht vorhanden)
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
  if (subtaskAddBtn) subtaskAddBtn.style.display = 'none'; // altes Plus ausblenden
}
function hideInlineActions() {
  if (inlineWrap) inlineWrap.style.display = 'none';
  if (subtaskAddBtn) subtaskAddBtn.style.display = '';     // Plus wieder zeigen
}

// Input-Events
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
  // Nur ausblenden, wenn leer & Fokus wirklich raus ist
  subtaskInput.addEventListener('blur', () => {
    setTimeout(() => {
      const inside = document.activeElement instanceof Node && subtaskWrap
        ? subtaskWrap.contains(document.activeElement)
        : false;
      if (!inside && !subtaskInput.value.trim()) hideInlineActions();
    }, 0);
  });
}


/** Sicheres Einfügen von Text */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

if (subtaskInput && subtaskAddBtn) {
  subtaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  });
  subtaskAddBtn.addEventListener('click', addSubtask);
}

/** Subtask hinzufügen (aus dem Eingabefeld). */
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

  // Hover-Actions
  li.addEventListener('mouseenter', () => {
    const a = /** @type {HTMLElement|null} */ (li.querySelector('.subtask-actions'));
    if (a) a.style.display = 'inline-block';
  });
  li.addEventListener('mouseleave', () => {
    const a = /** @type {HTMLElement|null} */ (li.querySelector('.subtask-actions'));
    if (a) a.style.display = 'none';
  });

  // Edit
  (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-edit-btn')))?.addEventListener('click', () => {
    editSubtask(li, subtaskObj);
  });

  // Delete
  (/** @type {HTMLButtonElement|null} */ (li.querySelector('.subtask-delete-btn')))?.addEventListener('click', () => {
    if (!subtaskList) return;
    const idx = Array.from(subtaskList.children).indexOf(li);
    if (idx > -1) subtasks.splice(idx, 1);
    li.remove();
  });
}

/**
 * Inline-Edit eines Subtask-Titels mit Enter/Escape/Blur.
 * @param {HTMLLIElement} li
 * @param {Subtask} subtaskObj
 */
function editSubtask(li, subtaskObj) {
  const span    = /** @type {HTMLSpanElement} */ (li.querySelector('.subtask-title'));
  const actions = /** @type {HTMLElement|null} */ (li.querySelector('.subtask-actions'));
  const oldValue = span.textContent || '';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldValue;
  input.style.width = '70%';
  span.replaceWith(input);

  let replaced = false; // Guard gegen doppelte Ausführung

  function save() {
    if (replaced) return;
    replaced = true;
    subtaskObj.title = input.value.trim() || oldValue;

    const newSpan = document.createElement('span');
    newSpan.className = 'subtask-title';
    newSpan.textContent = subtaskObj.title;

    if (input.parentNode) input.replaceWith(newSpan);
    if (actions) actions.style.display = 'none';
  }

  function cancel() {
    if (replaced) return;
    replaced = true;

    const newSpan = document.createElement('span');
    newSpan.className = 'subtask-title';
    newSpan.textContent = oldValue;

    if (input.parentNode) input.replaceWith(newSpan);
    if (actions) actions.style.display = 'none';
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', save);

  input.focus();
}

// Eingabe im Subtaskfeld leeren (X-Button), falls vorhanden
if (subtaskClearBtn && subtaskInput) {
  subtaskClearBtn.addEventListener('click', () => {
    subtaskInput.value = '';
    subtaskClearBtn.style.display = 'none';
  });
}

// === heutiges Datum als Minimum setzen (lokale Zeitzone korrekt) ===
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


/* kleiner Helper fürs sichere Einfügen von Text */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}


  // ---------------------------------------------------------------------------
  // ►►► Task erstellen + erst TOAST, dann Redirect auf Board ◄◄◄
  // ---------------------------------------------------------------------------

/** Slide-in toast that shows ONLY the image (which already contains the text). */
function showAddTaskToast() {
  // (Re)inject CSS every call so old styles are overwritten
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
      top: 100%;                 /* start at bottom edge */
      transform: translate(-50%, 0);
      z-index: 99999;
      background: transparent;   /* NO dark bubble behind */
      padding: 0;                /* no padding */
      border-radius: 0;          /* no radius */
      box-shadow: none;          /* no shadow */
      will-change: top, transform;
      pointer-events: none;      /* fully non-interactive */
    }
    #addTaskToast.enter {
      animation: slideUpToCenter .55s cubic-bezier(.2,.8,.2,1) forwards;
    }
    #addTaskToast img {
      display: block;            /* remove inline gaps */
      width: 300px;              /* bigger image */
      height: auto;
    }
  `;

  // Create/replace the node (image only)
  let toast = document.getElementById('addTaskToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'addTaskToast';
    document.body.appendChild(toast);
  }
    toast.innerHTML = `
      <img src="../assets/icons/add_task/board_white.png" alt="">
    `;  // ^ Use your image path that already includes the text

  // Restart animation
  toast.classList.remove('enter');
  // @ts-ignore force reflow
  void toast.offsetHeight;
  toast.classList.add('enter');
}

/* --- NEU: kleiner Fehler-Dialog statt alert() --- */
function showErrorDialog(messages /** @type {string[]} */) {
  const dlg = /** @type {HTMLDialogElement|null} */ (document.getElementById('errorDialog'));
  const list = /** @type {HTMLUListElement|null} */ (document.getElementById('errorList'));
  if (!dlg || !list) return;
  list.innerHTML = '';
  messages.forEach(m => {
    const li = document.createElement('li');
    li.textContent = m;
    list.appendChild(li);
  });
  if (!dlg.open) dlg.showModal();
}
  /** Button „Create Task“ */
  const createBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.create_task_btn'));
  if (createBtn) {
    createBtn.addEventListener('click', function (e) {
      e.preventDefault();

      const titleEl       = /** @type {HTMLInputElement | null} */   (document.getElementById('title'));
      const descriptionEl = /** @type {HTMLTextAreaElement | null} */(document.getElementById('description'));
      const dueEl         = /** @type {HTMLInputElement | null} */   (document.getElementById('due'));
      const categoryEl    = /** @type {HTMLSelectElement | null} */  (document.getElementById('category'));

      const title       = titleEl?.value.trim() ?? '';
      const description = descriptionEl?.value.trim() ?? '';
      const dueDate     = dueEl?.value.trim() ?? '';
      const category    = categoryEl?.value ?? '';

      // Falls der Browser-Validator umgangen wird
      if (dueInput && dueDate < dueInput.min) {
        // alert("Bitte ein Fälligkeitsdatum ab heute wählen.");
        showErrorDialog(['Bitte ein Fälligkeitsdatum ab heute wählen.']);
        return;
      }

      const assignedTo = Object.entries(assignedUsers)
        .filter(([, u]) => u.selected)
        .map(([id]) => id);

      /** @type {'urgent'|'medium'|'low'|null} */
      let priority = null;
      const activePriorityBtn = /** @type {HTMLButtonElement | null} */ (
        document.querySelector('.priority-buttons .btn.active')
      );
      if (activePriorityBtn) {
        const p = (activePriorityBtn.textContent || '').trim().split(/\s+/)[0].toLowerCase();
        if (p === 'urgent' || p === 'medium' || p === 'low') priority = p;
      }

      if (!title || !dueDate || !category || !priority) {
        // alert("Bitte alle Pflichtfelder ausfüllen und eine Priorität wählen!");
        showErrorDialog(['Bitte alle Pflichtfelder ausfüllen und eine Priorität wählen.']);
        return;
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
    showAddTaskToast();                     // only the image
    setTimeout(() => {
      window.location.href = '../pages/board.html';
    }, 1600);
  })
  .catch(err => {
    // alert('Fehler beim Speichern: ' + err.message)
    showErrorDialog([`Fehler beim Speichern: ${err.message}`]);
  });

;
    });
  }

  /** Formular zurücksetzen (Felder + Auswahl + Subtasks + Priority). */
  function clearForm() {
    const t  = /** @type {HTMLInputElement | null} */ (document.getElementById('title'));
    const d  = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('description'));
    const du = /** @type {HTMLInputElement | null} */ (document.getElementById('due'));
    const c  = /** @type {HTMLSelectElement | null} */ (document.getElementById('category'));

    if (t)  t.value = '';
    if (d)  d.value = '';
    if (du) du.value = '';
    if (c)  c.selectedIndex = 0;

    // Assigned zurücksetzen
    Object.values(assignedUsers).forEach(u => (u.selected = false));
    renderAssignedDropdown();
    renderAssignedBadges();

    // Dropdown sicher schließen
    const dropdownLocal = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedDropdown'));
    if (dropdownLocal) dropdownLocal.classList.add('hidden');

    // Priority zurücksetzen → "Medium" preselecten + Icon-Logik korrekt setzen
    /** @type {NodeListOf<HTMLButtonElement>} */
    const allPrioBtns = document.querySelectorAll('.priority-buttons .btn');
    allPrioBtns.forEach((b) => {
      b.classList.remove('active');
      if (b.classList.contains('btn_medium')) {
        const def = /** @type {HTMLElement | null} */ (b.querySelector('.icon.default'));
        const sel = /** @type {HTMLElement | null} */ (b.querySelector('.icon.white'));
        if (def && sel) {
          def.style.display = '';   // default sichtbar, white verstecken
          sel.style.display = 'none';
        }
      }
    });
    const mediumBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.priority-buttons .btn.btn_medium'));
    if (mediumBtn) {
      mediumBtn.classList.add('active');
      const def = /** @type {HTMLElement | null} */ (mediumBtn.querySelector('.icon.default'));
      const sel = /** @type {HTMLElement | null} */ (mediumBtn.querySelector('.icon.white'));
      if (def && sel) {
        def.style.display = 'none'; // bei aktiv: default-Icon verstecken
        sel.style.display = '';     // weißes Icon zeigen
      }
      setPriorityValue('medium');
    }

    // Subtasks leeren (Array + UI + Input)
    subtasks = [];
    const subtaskListLocal = /** @type {HTMLUListElement | null} */ (document.getElementById('subtask-list'));
    if (subtaskListLocal) subtaskListLocal.innerHTML = '';
    const subtaskInputLocal = /** @type {HTMLInputElement | null} */ (document.querySelector('.input-icon-subtask input'));
    if (subtaskInputLocal) subtaskInputLocal.value = '';
    const clearX = /** @type {HTMLButtonElement | null} */ (document.querySelector('.clear-subtask-input'));
    if (clearX) clearX.style.display = 'none';
  }

  // Clear-Button (links unten)
  const clearBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.clear_button'));
  if (clearBtn) {
    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      clearForm();
      // Fokus auf Titel nach Reset – JS-konform (kein TS "as")
      const titleEl = /** @type {HTMLInputElement | null} */ (document.getElementById('title'));
      if (titleEl) titleEl.focus();
    });
  }

  // ---------------------------------------------------------------------------
  // Dropdown öffnen/schließen (Assigned to)
  // ---------------------------------------------------------------------------
  const assignedSelectBox = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedSelectBox'));
  const dropdown = /** @type {HTMLDivElement | null} */ (document.getElementById('assignedDropdown'));

  if (assignedSelectBox && dropdown) {
    assignedSelectBox.addEventListener('click', () => {
      dropdown.classList.toggle('hidden');
    });
  }

  // Outside-Click schließt das Dropdown
  document.addEventListener('click', (e) => {
    const wrapper = /** @type {HTMLDivElement | null} */ (document.querySelector('.assigned-to-wrapper'));
    const target = /** @type {EventTarget | null} */ (e.target);
    if (wrapper && target instanceof Node && !wrapper.contains(target)) {
      if (dropdown) dropdown.classList.add('hidden');
    }
  });
});

// === Form Validation Helpers ===
function setDateMinToday(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.setAttribute('min', new Date().toISOString().split('T')[0]);
}

// überall aufrufen, wo es diese Felder gibt
document.addEventListener('DOMContentLoaded', () => {
  setDateMinToday('#task-due-date');  // Add Task
  setDateMinToday('#editDueDate');    // Edit (Board-Detail)
});

// nutze diese Funktion vor dem Speichern, wenn du Custom-Buttons hast:
function reportFormValidity(formEl) {
  if (!formEl) return true;
  // HTML5 Validation UI
  if (!formEl.reportValidity()) return false;
  return true;
}
