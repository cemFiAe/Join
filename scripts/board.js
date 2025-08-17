// @ts-check
/* global firebase */


document.addEventListener('DOMContentLoaded', function () {
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
   * Ein Eintrag im „Assigned to“-Dropdown.
   * @typedef {Object} AssignedUserEntry
   * @property {string}  name
   * @property {string}  initials
   * @property {boolean} selected
   * @property {string=} email
   */

  // ──────────────────────────────────────────────────────────────────────────
  // Toast
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Zeigt den „Task created“-Toast oben rechts kurz an.
   * @returns {void}
   */
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
   * Öffnet das Add-Task-Dialogfenster und setzt das Ziel-Statusfeld vor.
   * @param {'todo'|'inprogress'|'awaitingfeedback'|'done'} [status='todo']
   */
  // @ts-ignore: wir hängen absichtlich an window
  window.openAddTaskDialog = function (status = 'todo') {
    clearAddTaskForm();
    const dialog = /** @type {HTMLDialogElement} */ (document.getElementById('addTaskOverlay'));
    dialog.dataset.status = status;
    dialog.showModal();
  };

  /** @type {HTMLDialogElement} */
  const dialog = /** @type {HTMLDialogElement} */ (document.getElementById('addTaskOverlay'));

  // Close overlay via X or Cancel
  const closeBtn  = /** @type {HTMLButtonElement} */ (document.querySelector('.close-add-task-overlay'));
  const cancelBtn = /** @type {HTMLButtonElement} */ (document.querySelector('.clear_button'));
  closeBtn.onclick = cancelBtn.onclick = function () {
    dialog.close();
    clearAddTaskForm();
  };

  /**
   * Setzt alle Felder des Overlays zurück.
   * @returns {void}
   */
  function clearAddTaskForm() {
    (/** @type {HTMLInputElement} */ (document.getElementById('title'))).value = '';
    (/** @type {HTMLTextAreaElement} */ (document.getElementById('description'))).value = '';
    (/** @type {HTMLInputElement} */ (document.getElementById('task-due-date'))).value = '';
    (/** @type {HTMLSelectElement} */ (document.getElementById('category'))).selectedIndex = 0;

    // Assigned User Reset
    Object.values(assignedUsers).forEach(u => (u.selected = false));
    renderAssignedDropdown();
    renderAssignedBadges();

    // Priority zurücksetzen
    document.querySelectorAll('.priority-buttons .btn')
      .forEach(b => b.classList.remove('active'));

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

  const subtaskInput  = /** @type {HTMLInputElement} */   (document.querySelector('.input-icon-subtask input'));
  const subtaskAddBtn = /** @type {HTMLButtonElement} */  (document.querySelector('.add-subtask'));
  const subtaskList   = /** @type {HTMLUListElement} */   (document.getElementById('subtask-list'));

  /**
   * Fügt den aktuellen Subtask aus dem Eingabefeld zur Liste hinzu.
   * @returns {void}
   */
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
  // Kategorien (wie Add Task)
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

// --- Custom Warning (kleiner Hinweis-Toast in der Mitte) ---

/**
 * Zeigt eine kurze Warnung im Overlay an.
 * @param {string} msg
 */
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

/* Optional global verfügbar machen (für Aufrufe aus anderen Dateien) */
(/** @type {any} */ (window)).showCustomWarning = showCustomWarning;


  // ──────────────────────────────────────────────────────────────────────────
  // Assigned-to Dropdown (custom, wie in Add Task)
  // ──────────────────────────────────────────────────────────────────────────
  const assignedDropdown  = /** @type {HTMLDivElement} */ (document.getElementById('assignedDropdown'));
  const assignedBadges    = /** @type {HTMLDivElement} */ (document.getElementById('assignedBadges'));
  const assignedSelectBox = /** @type {HTMLDivElement} */ (document.getElementById('assignedSelectBox'));

  /** Map: userId → AssignedUserEntry */
  let assignedUsers = /** @type {Record<string, AssignedUserEntry>} */ ({});

  /** Für „(You)“-Markierung */
  const currentUserEmail = (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();

  /**
   * Initialen (max. 2 Zeichen) aus Name generieren.
   * @param {string} name
   * @returns {string}
   */
  function getInitials(name) {
    return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('');
  }

  // Users + Contacts laden
  Promise.all([
    fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/users.json").then(r => r.json()),
    fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts.json").then(r => r.json())
  ]).then(([users, contacts]) => {
    if (users) {
      Object.entries(users).forEach(([id, data]) => {
        assignedUsers[id] = {
          name: data.name || data.email || id,
          email: data.email,
          initials: getInitials(data.name || data.email || id),
          selected: false
        };
      });
    }
    if (contacts) {
      Object.entries(contacts).forEach(([id, data]) => {
        if (!assignedUsers[id]) {
          assignedUsers[id] = {
            name: data.name || id,
            email: '',
            initials: getInitials(data.name || id),
            selected: false
          };
        }
      });
    }
    renderAssignedDropdown();
    renderAssignedBadges();
  });

  /**
   * Erzeugt aus einem String eine deterministische HSL-Farbe (für Avatare).
   * @param {string} str
   * @returns {string} CSS-HSL
   */
  function generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * Baut die Optionsliste im „Assigned to“-Dropdown neu auf.
   * @returns {void}
   */
  function renderAssignedDropdown() {
    if (!assignedDropdown) return;
    assignedDropdown.innerHTML = '';

    Object.entries(assignedUsers).forEach(([id, user]) => {
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
      assignedDropdown.appendChild(option);

      // NICHT schließen beim Auswählen – Dropdown bleibt offen
      option.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();          // verhindert Fokuswechsel
        ev.stopPropagation();         // blockt Outside-Handler
        assignedUsers[id].selected = !assignedUsers[id].selected;
        renderAssignedDropdown();     // UI refresh
        renderAssignedBadges();       // Badges refresh
      });
    });
  }

  /**
   * Zeigt die runden Initialen-Badges unter dem Feld an (ausgewählte User).
   * @returns {void}
   */
  function renderAssignedBadges() {
    if (!assignedBadges) return;
    assignedBadges.innerHTML = '';
    Object.entries(assignedUsers).forEach(([_, user]) => {
      if (user.selected) {
        const badge = document.createElement('div');
        badge.className = 'avatar-badge';
        badge.textContent = user.initials;
        badge.style.backgroundColor = generateColorFromString(user.name);
        assignedBadges.appendChild(badge);
      }
    });
  }

  // Dropdown öffnen/schließen
  if (assignedSelectBox && assignedDropdown) {
    assignedSelectBox.addEventListener('click', () => {
      assignedDropdown.classList.toggle('hidden');
    });
  }
  // Klick außerhalb schließt Dropdown
  document.addEventListener('click', (e) => {
    const wrapper = /** @type {HTMLDivElement | null} */ (document.querySelector('.assigned-to-wrapper'));
    const target = /** @type {EventTarget | null} */ (e.target);
    if (wrapper && target instanceof Node && !wrapper.contains(target)) {
      if (assignedDropdown) assignedDropdown.classList.add('hidden');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Save Task
  // ──────────────────────────────────────────────────────────────────────────
  (/** @type {HTMLButtonElement} */ (document.querySelector('.create_task_btn')))
    .addEventListener('click', () => {
      const title       = (/** @type {HTMLInputElement}  */ (document.getElementById('title'))).value.trim();
      const description = (/** @type {HTMLTextAreaElement}*/ (document.getElementById('description'))).value.trim();
      const dueDate     = (/** @type {HTMLInputElement}  */ (document.getElementById('task-due-date'))).value.trim();
      const category    = (/** @type {HTMLSelectElement}  */ (document.getElementById('category'))).value;

      // Assigned User aus Custom-Dropdown
      const assignedTo = Object.entries(assignedUsers)
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
});
