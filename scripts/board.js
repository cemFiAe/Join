// @ts-check
/* global firebase */

// ===== Bootstrapping: sorgt dafür, dass onDomReady immer läuft =====
(function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReady);
  } else {
    onDomReady();
  }
})();

/** Wird nach DOM-Ready aufgerufen. Hier kommt dein bisheriger Code rein. */
/** @param {Event=} _ev */
function onDomReady(_ev) {
  // ---- MACH DIE FUNKTION GLOBAL FÜR inline onclick="openAddTaskDialog('todo')" ----
  // @ts-ignore
  window.openAddTaskDialog = function (/** @type {'todo'|'inprogress'|'awaitingfeedback'|'done'} */ status = 'todo') {
    clearAddTaskForm();
    const dialog = /** @type {HTMLDialogElement} */(document.getElementById('addTaskOverlay'));
    dialog.dataset.status = status;
    dialog.showModal();
  };
  // ──────────────────────────────────────────────────────────────────────────
  // Typen
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Ein Subtask im Add-Task/Board Overlay.
   * @typedef {Object} Subtask
   * @property {string}  title
   * @property {boolean} done
   */

  /**
   * Ein Eintrag im „Assigned to“-Dropdown (Add-Task auf dem Board).
   * @typedef {Object} AssignedUserEntry
   * @property {string}  name
   * @property {string}  initials
   * @property {boolean} selected
   * @property {string=} email
   */

  // ──────────────────────────────────────────────────────────────────────────
  // Toast
  // ──────────────────────────────────────────────────────────────────────────

  function showBoardToast() {
    const toast = /** @type {HTMLDivElement | null} */ (document.getElementById('taskToast'));
    if (!toast) return;
    toast.classList.add('show');
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hidden');
    }, 3000);
  }

  if (localStorage.getItem('showBoardToast')) {
    showBoardToast();
    localStorage.removeItem('showBoardToast');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Add-Task Overlay öffnen/schließen
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Öffnet das Add-Task-Dialogfenster:
   *  - setzt Ziel-Status
   *  - setzt min-Datum = heute
   *  - preselect „Medium“
   *  - bindet Dropdown-Handler
   */
  // @ts-ignore – absichtlich an window gehängt
  window.openAddTaskDialog = function (status = 'todo') {
    clearAddTaskForm();

    const addDlg = /** @type {HTMLDialogElement} */ (document.getElementById('addTaskOverlay'));
    addDlg.dataset.status = status;

    // min = heute (lokale TZ) für das Date-Input
    const dateInput = /** @type {HTMLInputElement | null} */ (document.getElementById('task-due-date'));
    if (dateInput) {
      const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
      dateInput.min = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);
    }

    // "Medium" standardmäßig aktiv
    document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
    const mediumBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.priority-buttons .btn[data-priority="medium"]'));
    if (mediumBtn) mediumBtn.classList.add('active');

    addDlg.showModal();
    bindAddAssignedDropdownHandlers(); // robustes (Re)Binding beim Öffnen
  };

  /** @type {HTMLDialogElement} */
  const dialog = /** @type {HTMLDialogElement} */ (document.getElementById('addTaskOverlay'));

  // Overlay schließen (X oder „Clear“)
  const closeBtn  = /** @type {HTMLButtonElement} */ (document.querySelector('.close-add-task-overlay'));
  const cancelBtn = /** @type {HTMLButtonElement} */ (document.querySelector('.clear_button'));
  closeBtn.onclick = cancelBtn.onclick = function () {
    dialog.close();
    clearAddTaskForm();
  };

  function clearAddTaskForm() {
    (/** @type {HTMLInputElement}   */ (document.getElementById('title'))).value = '';
    (/** @type {HTMLTextAreaElement}*/ (document.getElementById('description'))).value = '';
    (/** @type {HTMLInputElement}   */ (document.getElementById('task-due-date'))).value = '';
    (/** @type {HTMLSelectElement}  */ (document.getElementById('category'))).selectedIndex = 0;

    // Assigned User Reset
    Object.values(addAssignedUsers).forEach(u => (u.selected = false));
    renderAddAssignedDropdown();
    renderAddAssignedBadges();
    addAssignedDropdownEl?.classList.add('hidden');

    // Priority zurücksetzen
    document.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));

    // Subtasks zurücksetzen
    const w = /** @type {any} */ (window);
    w.boardSubtasks = /** @type {Subtask[]} */ ([]);
    (/** @type {HTMLUListElement} */ (document.getElementById('subtask-list'))).innerHTML = '';
    (/** @type {HTMLInputElement} */ (document.querySelector('.input-icon-subtask input'))).value = '';
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Priority Button Handling
  // ──────────────────────────────────────────────────────────────────────────
  document.querySelectorAll('.priority-buttons .btn')
    .forEach((btn, _, all) => {
      btn.addEventListener('click', function () {
        all.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      });
    });

  // ──────────────────────────────────────────────────────────────────────────
  // Subtask-Logik
  // ──────────────────────────────────────────────────────────────────────────
  const w = /** @type {any} */ (window);
  w.boardSubtasks = /** @type {Subtask[]} */ ([]);

  const subtaskInput  = /** @type {HTMLInputElement}  */ (document.querySelector('.input-icon-subtask input'));
  const subtaskAddBtn = /** @type {HTMLButtonElement} */ (document.querySelector('.add-subtask'));
  const subtaskList   = /** @type {HTMLUListElement}  */ (document.getElementById('subtask-list'));

  function addSubtaskToList() {
    const value = subtaskInput.value.trim();
    if (!value) return;

    /** @type {Subtask} */
    const subtask = { title: value, done: false };
    w.boardSubtasks.push(subtask);

    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.innerHTML = `
      <span>${value}</span>
      <button type="button" class="delete-subtask" title="Remove">&times;</button>
    `;
    subtaskList.appendChild(li);
    subtaskInput.value = '';

    (/** @type {HTMLButtonElement} */ (li.querySelector('.delete-subtask'))).onclick = () => {
      const idx = w.boardSubtasks.findIndex((st) => st.title === value);
      if (idx > -1) w.boardSubtasks.splice(idx, 1);
      li.remove();
    };
  }

  subtaskAddBtn.addEventListener('click', addSubtaskToList);
  subtaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtaskToList();
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Kategorien
  // ──────────────────────────────────────────────────────────────────────────
  /** @type {("Technical Task"|"User Story"|"Bug"|"Research")[]} */
  const categories = ["Technical Task", "User Story", "Bug", "Research"];

  const catSelect = /** @type {HTMLSelectElement} */ (document.getElementById('category'));
  catSelect.innerHTML = '<option value="">Select task category</option>';
  categories.forEach((c) => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    catSelect.appendChild(o);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Kleiner Hinweis-Toast (Mitte)
  // ──────────────────────────────────────────────────────────────────────────
  function showCustomWarning(msg) {
    const modal = /** @type {HTMLDivElement|null} */ (document.getElementById('custom-warning-modal'));
    if (!modal) return;

    const content = /** @type {HTMLElement|null} */ (modal.querySelector('#custom-warning-content'));
    if (content) content.innerText = msg;

    modal.classList.replace('modal-hidden', 'modal-visible');
    setTimeout(() => {
      modal.classList.replace('modal-visible', 'modal-hidden');
    }, 2500);
  }
  (/** @type {any} */ (window)).showCustomWarning = showCustomWarning;

  // ──────────────────────────────────────────────────────────────────────────
  // Assigned-to Dropdown (Add-Dialog, Kollisionen vermeiden → Prefix)
  // ──────────────────────────────────────────────────────────────────────────

  /** DOM */
  const addAssignedDropdownEl  = /** @type {HTMLDivElement} */ (document.getElementById('assignedDropdown'));
  const addAssignedBadgesEl    = /** @type {HTMLDivElement} */ (document.getElementById('assignedBadges'));
  const addAssignedSelectBoxEl = /** @type {HTMLDivElement} */ (document.getElementById('assignedSelectBox'));

  /** Daten */
  let addAssignedUsers = /** @type {Record<string, AssignedUserEntry>} */ ({});

  const currentUserEmail = (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();

  function getInitials(name) {
    return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('');
  }
  function generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  // Users + Contacts laden (einmalig)
  Promise.all([
    fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/users.json").then(r => r.json()),
    fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts.json").then(r => r.json())
  ]).then(([users, contacts]) => {
    if (users) {
      Object.entries(users).forEach(([id, data]) => {
        addAssignedUsers[id] = {
          name: data.name || data.email || id,
          email: data.email,
          initials: getInitials(data.name || data.email || id),
          selected: false
        };
      });
    }
    if (contacts) {
      Object.entries(contacts).forEach(([id, data]) => {
        if (!addAssignedUsers[id]) {
          addAssignedUsers[id] = {
            name: data.name || id,
            email: '',
            initials: getInitials(data.name || id),
            selected: false
          };
        }
      });
    }
    renderAddAssignedDropdown();
    renderAddAssignedBadges();
  });

  function renderAddAssignedDropdown() {
    if (!addAssignedDropdownEl) return;
    addAssignedDropdownEl.innerHTML = '';

    Object.entries(addAssignedUsers).forEach(([id, user]) => {
      const option = document.createElement('div');
      option.className = 'custom-option';
      option.dataset.userId = id;

      const avatar = document.createElement('div');
      avatar.className = 'custom-option-avatar';
      avatar.style.backgroundColor = generateColorFromString(user.name);
      avatar.textContent = user.initials;

      const label = document.createElement('div');
      label.className = 'custom-option-label';
      label.textContent = user.name + (
        user.email && user.email.trim().toLowerCase() === currentUserEmail ? ' (You)' : ''
      );

      const checkbox = document.createElement('div');
      checkbox.className = 'custom-option-checkbox';
      if (user.selected) checkbox.classList.add('checked');

      option.appendChild(avatar);
      option.appendChild(label);
      option.appendChild(checkbox);
      addAssignedDropdownEl.appendChild(option);

      // Auswahl toggeln – Dropdown bleibt offen
      option.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        addAssignedUsers[id].selected = !addAssignedUsers[id].selected;
        renderAddAssignedDropdown();
        renderAddAssignedBadges();
      });
    });
  }

function renderAddAssignedBadges() {
  if (!addAssignedBadgesEl) return;
  addAssignedBadgesEl.innerHTML = '';

  const MAX_BADGES = 4; // wie auf der add_task Seite
  const selected = Object.values(addAssignedUsers).filter(u => u.selected);

  // bis zu 4 echte Badges
  selected.slice(0, MAX_BADGES).forEach(user => {
    const badge = document.createElement('div');
    badge.className = 'avatar-badge';
    badge.textContent = user.initials;
    badge.style.backgroundColor = generateColorFromString(user.name);
    addAssignedBadgesEl.appendChild(badge);
  });

  // Rest als +N
  const extra = selected.length - MAX_BADGES;
  if (extra > 0) {
    const more = document.createElement('div');
    more.className = 'avatar-badge avatar-badge-more';
    more.textContent = `+${extra}`;
    addAssignedBadgesEl.appendChild(more);
  }
}


  /** Robustes Open/Close-Binding (jedes Öffnen des Dialogs) */
  function bindAddAssignedDropdownHandlers() {
    if (!addAssignedSelectBoxEl || !addAssignedDropdownEl) return;

    // Nur einmal binden
    if (!addAssignedSelectBoxEl.dataset.bound) {
      addAssignedSelectBoxEl.addEventListener('click', (ev) => {
        ev.stopPropagation();
        addAssignedDropdownEl.classList.toggle('hidden');
      });
      addAssignedSelectBoxEl.dataset.bound = '1';
    }

    // Klicks im Dropdown selbst nicht als Outside werten
    if (!addAssignedDropdownEl.dataset.bound) {
      addAssignedDropdownEl.addEventListener('click', (ev) => ev.stopPropagation());
      addAssignedDropdownEl.dataset.bound = '1';
    }

    // Outside-Click (pro Öffnen neu aktiviert → dann wieder entfernt)
    const outside = (e) => {
      const target = e.target instanceof Node ? e.target : null;
      const wrapper = /** @type {HTMLElement|null} */ (document.querySelector('.assigned-to-wrapper'));
      if (wrapper && target && !wrapper.contains(target)) {
        addAssignedDropdownEl.classList.add('hidden');
        document.removeEventListener('click', outside, true);
      }
    };
    document.addEventListener('click', outside, true);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Save Task
  // ──────────────────────────────────────────────────────────────────────────
  (/** @type {HTMLButtonElement} */ (document.querySelector('.create_task_btn')))
    .addEventListener('click', () => {
      const title       = (/** @type {HTMLInputElement}   */ (document.getElementById('title'))).value.trim();
      const description = (/** @type {HTMLTextAreaElement}*/ (document.getElementById('description'))).value.trim();
      const dueDate     = (/** @type {HTMLInputElement}   */ (document.getElementById('task-due-date'))).value.trim();
      const category    = (/** @type {HTMLSelectElement}  */ (document.getElementById('category'))).value;

      // Assigned User aus Custom-Dropdown (Add-Dialog)
      const assignedTo = Object.entries(addAssignedUsers)
        .filter(([, u]) => u.selected)
        .map(([id]) => id);

      const activeBtn = /** @type {HTMLButtonElement | null} */ (document.querySelector('.priority-buttons .btn.active'));
      const priority  = activeBtn ? activeBtn.dataset.priority : null;

      // validation
      if (!title || !dueDate || !category) {
        (/** @type {any} */ (window)).showCustomWarning("Bitte alle Pflichtfelder ausfüllen!");
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        (/** @type {any} */ (window)).showCustomWarning("Datum im Format JJJJ-MM-TT wählen.");
        return;
      }
      if (!priority) {
        (/** @type {any} */ (window)).showCustomWarning("Bitte eine Priorität auswählen!");
        return;
      }

      /** @type {Subtask[]} */
      const cleanSubtasks = (/** @type {Subtask[]} */ (w.boardSubtasks))
        .filter(st => st.title.trim())
        .map(st => ({ title: st.title.trim(), done: !!st.done }));

      const taskObj = {
        title,
        description,
        dueDate,
        priority,
        assignedTo,
        category,
        subtasks: cleanSubtasks,
        status: dialog.dataset.status,
        createdAt: Date.now()
      };

      const newKey = firebase.database().ref().child('tasks').push().key;
      firebase.database().ref('tasks/' + newKey).set({ ...taskObj, id: newKey })
        .then(() => {
          dialog.close();
          clearAddTaskForm();
          showBoardToast();
        })
        .catch(err => (/** @type {any} */ (window)).showCustomWarning("Fehler: " + err.message));
    });
}