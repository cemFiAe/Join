// @ts-check

/** Firebase kommt über das CDN → aus `window` ziehen (Cast auf window) */
const firebase = /** @type {any} */ (window).firebase;

document.addEventListener('DOMContentLoaded', function () {
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

      // Auswahl soll Dropdown NICHT schließen → pointerdown mit stopPropagation
      option.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();    // verhindert Fokuswechsel
        ev.stopPropagation();   // blockt Outside-Handler
        assignedUsers[id].selected = !assignedUsers[id].selected;
        renderAssignedDropdown();   // UI aktualisieren
        renderAssignedBadges();     // Badges aktualisieren
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

  /** @type {HTMLInputElement | null} */
  const subtaskInput = document.querySelector('.input-icon-subtask input');
  /** @type {HTMLButtonElement | null} */
  const subtaskAddBtn = document.querySelector('.add-subtask');
  /** @type {HTMLButtonElement | null} */
  const subtaskClearBtn = document.querySelector('.clear-subtask-input');
  /** @type {HTMLUListElement | null} */
  const subtaskList = /** @type {HTMLUListElement | null} */ (document.getElementById('subtask-list'));

  if (subtaskInput && subtaskAddBtn) {
    subtaskInput.addEventListener('keydown', function (e) {
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
    if (value) {
      const subtaskObj = /** @type {Subtask} */ ({ title: value, done: false });
      subtasks.push(subtaskObj);

      const li = document.createElement('li');
      li.classList.add('subtask-item');
      li.innerHTML = `
        <span class="subtask-title">${value}</span>
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
        const actions = /** @type {HTMLElement | null} */ (li.querySelector('.subtask-actions'));
        if (actions) actions.style.display = 'inline-block';
      });
      li.addEventListener('mouseleave', () => {
        const actions = /** @type {HTMLElement | null} */ (li.querySelector('.subtask-actions'));
        if (actions) actions.style.display = 'none';
      });

      const editBtn = /** @type {HTMLButtonElement | null} */ (li.querySelector('.subtask-edit-btn'));
      const delBtn  = /** @type {HTMLButtonElement | null} */ (li.querySelector('.subtask-delete-btn'));

      if (editBtn) {
        editBtn.addEventListener('click', function () {
          editSubtask(li, subtaskObj);
        });
      }
      if (delBtn) {
        delBtn.addEventListener('click', function () {
          if (!subtaskList) return;
          subtaskList.removeChild(li);
          // Index sauber bestimmen und aus Array entfernen
          const items = Array.from(subtaskList.children);
          const idx = items.indexOf(li);
          if (idx > -1) subtasks.splice(idx, 1);
        });
      }
    }
  }

  /**
   * Inline-Edit eines Subtask-Titels mit Enter/Escape/Blur.
   * @param {HTMLLIElement} li
   * @param {Subtask} subtaskObj
   */
  function editSubtask(li, subtaskObj) {
    const span = /** @type {HTMLSpanElement} */ (li.querySelector('.subtask-title'));
    const actions = /** @type {HTMLElement | null} */ (li.querySelector('.subtask-actions'));
    const oldValue = span.textContent || '';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldValue;
    input.style.width = '70%';
    span.replaceWith(input);

    /** Guard gegen doppeltes Ersetzen durch blur + enter */
    let replaced = false;

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') cancel();
    });
    input.addEventListener('blur', save);

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
    input.focus();
  }

  // Eingabe im Subtaskfeld leeren (X-Button), falls vorhanden
  if (subtaskClearBtn && subtaskInput) {
    subtaskClearBtn.addEventListener('click', function () {
      subtaskInput.value = '';
      subtaskClearBtn.style.display = 'none';
    });
  }

  // === heutiges Datum als Minimum setzen (lokale Zeitzone korrekt) ===
  const dueInput = /** @type {HTMLInputElement|null} */(document.getElementById('due'));
  if (dueInput) {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const todayLocalISO = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);
    dueInput.min = todayLocalISO;

    // Guard: falls der User manuell zurücksetzt
    dueInput.addEventListener('input', () => {
      if (dueInput.value && dueInput.value < dueInput.min) {
        dueInput.value = dueInput.min;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Task erstellen
  // ---------------------------------------------------------------------------
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
        alert("Bitte ein Fälligkeitsdatum ab heute wählen.");
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
        alert("Bitte alle Pflichtfelder ausfüllen und eine Priorität wählen!");
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
      firebase.database().ref('tasks/' + newTaskKey).set({
        ...taskObj,
        id: newTaskKey
      }).then(() => {
        localStorage.setItem('showBoardToast', '1');
        window.location.href = '../pages/board.html';
      }).catch((error) => {
        alert("Fehler beim Speichern: " + error.message);
      });
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
