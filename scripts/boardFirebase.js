// @ts-check
/* global firebase, Choices */

/**
 * =======================
 * Typen (JSDoc)
 * =======================
 */
/** @typedef {{title: string, done: boolean}} Subtask */
/** @typedef {"todo"|"inprogress"|"awaitingfeedback"|"done"} TaskStatus */
/** @typedef {"urgent"|"medium"|"low"} TaskPriority */
/**
 * @typedef {{
 *   id: string;
 *   title?: string;
 *   description?: string;
 *   category?: string;
 *   dueDate?: string;
 *   priority?: TaskPriority;
 *   status: TaskStatus;
 *   assignedTo?: string[] | string;
 *   subtasks?: Subtask[];
 * }} Task
 */
/** @typedef {{ name?: string; email?: string }} Person */
/** @typedef {Record<string, Person>} PersonMap */


/**
 * =======================
 * Farbpalette & Helpers
 * =======================
 */
/** @type {string[]} */
const BADGE_COLORS = [
  "#FFA800", "#FF5EB3", "#6E52FF", "#9327FF", "#00BEE8",
  "#1FD7C1", "#FF745E", "#FFBB2B", "#424242", "#FF7A00",
  "#EB5D5D", "#009788", "#7B61FF", "#5A9FFF", "#1E90FF", "#F96D00", "#43B581", "#FF6C6C"
];

/** @type {Task[]} */
let tasks = [];

/** Assigned-Dropdown DOM-Elemente (werden in initAssignedDropdown() gefüllt) */
/** @type {HTMLDivElement|null} */ let assignedDropdown = null;
/** @type {HTMLDivElement|null} */ let assignedBadges   = null;
/** @type {HTMLDivElement|null} */ let assignedSelectBox = null;

/** Struktur eines auswählbaren Users/Kontakts */
/** @typedef {{name:string, email?:string, initials:string, selected:boolean}} AssignedUserEntry */

/** Alle auswählbaren Personen (id -> Daten) */
/** @type {Record<string, AssignedUserEntry>} */
let assignedUsers = {};

/** aktuell eingeloggte Mail (für „(You)“) */
const currentUserEmail = (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();
let assignOutsideListenerInstalled = false;

/** Farb-Helper wie auf der Add-Task-Seite */
function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/** @type {PersonMap} */
let users = {};
/** WICHTIG: um Kollisionen zu vermeiden, NICHT „contacts“ nennen */
let boardContacts = /** @type {PersonMap} */ ({});

/** Deterministische Farbe aus einem String. */
function getInitialsColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

/** Hole Person aus users/boardContacts. */
const getPersonData = (id) => users[id] || boardContacts[id] || null;

/** HTML für runden Avatar-Badge mit Initialen. */
function getProfileBadge(userId) {
  const user = getPersonData(userId);
  if (!user) return '';
  const name = user.name || '';
  const initials = name
    ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : userId.slice(0, 2).toUpperCase();
  const color = getInitialsColor(name || userId);
  return `<span class="profile-badge" style="background:${color};">${initials}</span>`;
}

function renderBadgesCap(ids, cap = 4) {
  const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean).map(String);
  const first = list.slice(0, cap).map(getProfileBadge).join('');
  const extra = list.length - cap;
  const more  = extra > 0 ? `<span class="profile-badge profile-badge-more">+${extra}</span>` : '';
  return first + more;
}


/**
 * =======================
 * Daten laden
 * =======================
 * users -> contacts -> tasks
 */
firebase.database().ref("users").once("value").then(snap => {
  /** @type {any} */
  const val = snap.val();
  users = val || {};
  // für den Edit-Dialog
  // @ts-ignore
  window.allUsers = users;

  firebase.database().ref("contacts").once("value").then(csnap => {
    /** @type {any} */
    const cval = csnap.val();
    boardContacts = cval || {};
    // @ts-ignore
    window.allContacts = boardContacts;

    // === Custom-Dropdown IMMER initialisieren ===
    initAssignedDropdown();

    loadAllTasks();
  });
});

/** Initialisiert das „Assigned to“-Dropdown im Board-Add-Task-Dialog. */
function initAssignedDropdown() {
  // DOM aus dem Add-Task-Dialog
  assignedDropdown  = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedDropdown'));
  assignedBadges    = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedBadges'));
  assignedSelectBox = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedSelectBox'));
  if (!assignedSelectBox || !assignedDropdown) return;

  // --- Daten mergen (users + contacts) ---
  assignedUsers = {};
  Object.entries(users || {}).forEach(([id, u]) => {
    const name = u?.name || u?.email || id;
    assignedUsers[id] = {
      name,
      email: u?.email || '',
      initials: name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() || '').join(''),
      selected: false
    };
  });
  Object.entries(boardContacts || {}).forEach(([id, c]) => {
    if (assignedUsers[id]) return;
    const name = c?.name || id;
    assignedUsers[id] = {
      name,
      email: '',
      initials: name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() || '').join(''),
      selected: false
    };
  });

  // Erste UI-Synchronisierung
  renderAssignedDropdown();
  renderAssignedBadges();

  // Helper: Badges (un)sichtbar machen, ohne Layout zu ändern
  const setBadgesVisible = (show) => {
    if (!assignedBadges) return;
    assignedBadges.style.visibility = show ? 'visible' : 'hidden';
  };
  setBadgesVisible(true);

  // Helper: Placeholder nie überschreiben
  const setFixedPlaceholder = () => {
    const span = assignedSelectBox.querySelector('span');
    if (span) span.textContent = 'Select contacts to assign';
  };
  setFixedPlaceholder();

  // --- SelectBox öffnen/schließen (nur 1× verdrahten) ---
  if (!assignedSelectBox.dataset.wired) {
    assignedSelectBox.dataset.wired = '1';

    const toggleOpen = (open) => {
      if (!assignedDropdown) return;
      const wantOpen = (open === undefined)
        ? assignedDropdown.classList.contains('hidden')
        : !!open;

      if (wantOpen) {
        assignedDropdown.classList.remove('hidden');
        assignedDropdown.style.display = 'block';
        setBadgesVisible(false);     // Badges während offen unsichtbar
        setFixedPlaceholder();       // Placeholder fix halten
        // Fokus/Bedienung
        const first = /** @type {HTMLElement|null} */ (assignedDropdown.querySelector('.custom-option'));
        first?.focus();
      } else {
        assignedDropdown.classList.add('hidden');
        assignedDropdown.style.display = 'none';
        setBadgesVisible(true);      // nach dem Schließen Badges zeigen
        setFixedPlaceholder();       // Placeholder fix halten
      }
    };

    // Klick auf die Box toggelt
    assignedSelectBox.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleOpen(); // toggle
    });

    // Tastatur: Enter/Space öffnet, ESC schließt
    assignedSelectBox.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggleOpen(true);
      }
    });

    // ESC im Dropdown schließt
    assignedDropdown.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        toggleOpen(false);
        assignedSelectBox.focus();
      }
    });

    // Outside-Click schließt NUR dieses Dropdown (Listener nur 1×)
    const self = /** @type {any} */ (initAssignedDropdown);
    if (!self._outsideListenerInstalled) {
      self._outsideListenerInstalled = true;
      document.addEventListener('click', (e) => {
        if (!assignedDropdown) return;
        const wrapper = assignedDropdown.closest('.assigned-to-wrapper');
        const inside = (e.target instanceof Node) && wrapper ? wrapper.contains(e.target) : false;
        if (!inside) {
          assignedDropdown.classList.add('hidden');
          assignedDropdown.style.display = 'none';
          setBadgesVisible(true);
          setFixedPlaceholder();
        }
      });
    }
  }
}

/** Tasks abonnieren und Board rendern. */
function loadAllTasks() {
  firebase.database().ref("tasks").on("value", s => {
    /** @type {Record<string, Task> | null | undefined} */
    const obj = s.val();
    tasks = Object.values(obj || {});
    renderBoard(tasks);
  });
}


/**
 * =======================
 * Task-Board & Karten
 * =======================
 */
function renderBoard(arr) {
  /** @type {Record<TaskStatus, string>} */
  const cols = { todo: "toDo", inprogress: "inProgress", awaitingfeedback: "awaitFeedback", done: "done" };

  Object.values(cols).forEach(id => {
    const colEl = /** @type {HTMLDivElement} */(document.getElementById(id));
    if (colEl) colEl.innerHTML = "";
  });

  arr.forEach(task => {
    /** @type {string | undefined} */
    // @ts-ignore – Status kommt aus Task, map unten prüft beim Append
    const colId = cols[task.status];
    if (!colId) return;
    const mount = document.getElementById(colId);
    if (mount) mount.appendChild(createTaskCard(task));
  });

  Object.entries(cols).forEach(([st, id]) => {
    const hasAny = arr.some(t => t.status === /** @type {TaskStatus} */(st));
    if (!hasAny) {
      const colEl = document.getElementById(id);
      if (colEl) colEl.innerHTML = `<div class="notask">No tasks ${st.replace(/^\w/, c => c.toUpperCase())}</div>`;
    }
  });
}

/** Eine Task-Karte erzeugen (zeigt max. 4 Avatare, Rest als +N). */
function createTaskCard(task) {
  const done  = Array.isArray(task.subtasks) ? task.subtasks.filter(st => st.done).length : 0;
  const total = Array.isArray(task.subtasks) ? task.subtasks.length : 0;

  /** @type {Record<TaskPriority, string>} */
  const prioMap = { urgent: "prio_top", medium: "prio_mid", low: "prio_low" };
  const prioIcon = prioMap[/** @type {TaskPriority} */(task.priority || "medium")] || "prio_mid";

  const cat = (task.category || '').toLowerCase();
  const categoryClass =
    "task-header" +
    (cat.includes("bug")      ? " bug-task"
    : cat.includes("user")    ? " tech-task"
    : cat.includes("tech")    ? " user-task"
    : cat.includes("research")? " research-task" : "");

  // --- Badges: max. 4 zeigen, Rest als +N ---
  const assignedIds = Array.isArray(task.assignedTo)
    ? task.assignedTo.filter(Boolean)
    : (task.assignedTo ? [task.assignedTo] : []);

  const maxVisibleBadges = 4;
  const visibleIds = assignedIds.slice(0, maxVisibleBadges);
  const overflow = assignedIds.length - visibleIds.length;

  const badgeHtml =
    visibleIds.map(id => getProfileBadge(String(id))).join('') +
    (overflow > 0
      ? `<span class="profile-badge more-badge" title="+${overflow} more">+${overflow}</span>`
      : "");

  const subBar = total
    ? `<div class="task-bar">
         <div class="bar-wrapper">
           <div class="progress-bar">
             <span class="progress-bar-fill" style="width:${Math.round((done / total) * 100)}%"></span>
           </div>
         </div>
         <span class="sub-task">${done}/${total} Subtasks</span>
       </div>`
    : "";

  const card = document.createElement("div");
  card.className = "task";
  card.innerHTML = `
    <span class="${categoryClass}">${task.category || ""}</span>
    <h4 class="task-title">${task.title || ""}</h4>
    <p class="task-info">${task.description || ""}</p>
    ${subBar}
    <div class="task-status">
      <div>${badgeHtml}</div>
      <img class="prio-icon" src="../assets/icons/board/prio/${prioIcon}.svg" alt="">
    </div>`;

  card.setAttribute("draggable", "true");
  card.dataset.taskId = task.id;
  card.addEventListener("dragstart", dragStartHandler);
  card.addEventListener("dragend",   dragEndHandler);
  card.addEventListener("click",     () => openTaskDetail(task));

  return card;
}


/**
 * =======================
 * Drag & Drop
 * =======================
 */
let draggedTaskId = null;

["toDo", "inProgress", "awaitFeedback", "done"].forEach(id => {
  const el = /** @type {HTMLDivElement | null} */(document.getElementById(id));
  if (!el) return;

  el.addEventListener("dragover", e => e.preventDefault());

  el.addEventListener("drop", function (e) {
    e.preventDefault();
    this.classList.remove('drop-target');
    if (!draggedTaskId) return;
    /** @type {Record<string, TaskStatus>} */
    const map = { toDo: "todo", inProgress: "inprogress", awaitFeedback: "awaitingfeedback", done: "done" };
    const newStatus = map[this.id];
    if (newStatus) {
      firebase.database().ref("tasks/" + draggedTaskId + "/status").set(newStatus);
    }
  });

  el.addEventListener("dragenter", function () { this.classList.add('drop-target'); });
  el.addEventListener("dragleave", function () { this.classList.remove('drop-target'); });
});

function dragStartHandler() {
  draggedTaskId = this.dataset.taskId || null;
  setTimeout(() => this.classList.add('dragging'), 0);
}
function dragEndHandler() {
  draggedTaskId = null;
  this.classList.remove('dragging');
}


/**
 * =======================
 * Suche
 * =======================
 */
function searchTasks(value) {
  const v = value.trim().toLowerCase();
  renderBoard(
    v
      ? tasks.filter(t =>
          (t.title || "").toLowerCase().includes(v) ||
          (t.description || "").toLowerCase().includes(v))
      : tasks
  );
}

{
  const input = /** @type {HTMLInputElement | null} */(document.getElementById('taskSearch'));
  if (input) input.addEventListener('input', e => searchTasks((/** @type {HTMLInputElement} */(e.currentTarget)).value));

  const mobileSearch = /** @type {HTMLInputElement | null} */(document.getElementById('taskSearchMobile'));
  if (mobileSearch) mobileSearch.addEventListener('input', e => searchTasks((/** @type {HTMLInputElement} */(e.currentTarget)).value));
}


/**
 * =======================
 * Task-Detail & Edit Dialog
 * =======================
 */
function openTaskDetail(task) {
  const dialog = /** @type {HTMLDialogElement} */(document.getElementById("taskDetailDialog"));
  const body   = /** @type {HTMLDivElement}    */(document.getElementById("taskDetailBody"));
  let isEditing = false;

  const catClass = (task.category || '').toLowerCase().replace(/\s/g, '');
  /** @type {Record<TaskPriority, string>} */
  const prioIcons = { urgent: "prio_top.svg", medium: "prio_mid.svg", low: "prio_low.svg" };
  const prioIcon  = prioIcons[/** @type {TaskPriority} */(task.priority || "medium")];
  const prioLabel = (task.priority || "medium").charAt(0).toUpperCase() + (task.priority || "medium").slice(1);

  renderDetail();

  function renderDetail() {
    if (!isEditing) {
      body.innerHTML = `
        <button id="closeTaskDetail" class="close-task-detail" aria-label="Close">&times;</button>
        <span class="task-detail-badge cat-${catClass}">${task.category ? task.category : ""}</span>
        <h2 class="task-detail-title">${task.title || ""}</h2>
        <div class="task-detail-description">${task.description || ""}</div>
        <div class="task-detail-row">
          <span class="task-detail-label">Due date:</span>
          <span>${formatDueDate(task.dueDate || "")}</span>
        </div>
        <div class="task-detail-row">
          <span class="task-detail-label">Priority:</span>
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="color:#222;">${prioLabel}</span>
            <img src="../assets/icons/board/prio/${prioIcon}" alt="Priority" style="height:10px;">
          </span>
        </div>
        <div class="task-detail-row">
          <span class="task-detail-label">Assigned To:</span>
        </div>
        <div class="task-detail-contacts">
          ${(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo])
            .filter(Boolean)
            .map(uid =>
              `<div class="assigned-user">${getProfileBadge(String(uid))}<span class="assigned-user-name">${getPersonData(String(uid))?.name || ""}</span></div>`
            ).join('')}
        </div>
        <div class="task-detail-row" style="margin-bottom:5px;">
          <span class="task-detail-label">Subtasks</span>
        </div>
        <div class="task-detail-subtasks">
          ${
            Array.isArray(task.subtasks) && task.subtasks.length
              ? task.subtasks.map((st, i) =>
                  `<label style="display:flex;align-items:center;gap:9px;font-size:1rem;">
                    <input type="checkbox" class="subtask-checkbox" data-subidx="${i}" ${st.done ? "checked" : ""}>
                    <span>${st.title}</span>
                  </label>`
                ).join("")
              : "<i>No subtasks.</i>"
          }
        </div>
        <div class="task-detail-actions">
          <button id="deleteTaskBtn" class="delete-btn"><img src="../assets/icons/board/delete.png" alt=""> Delete</button>
          <button id="editTaskBtn" class="edit-btn"><img src="../assets/icons/board/edit.png" alt=""> Edit</button>
        </div>
      `;

      body.querySelectorAll('.subtask-checkbox').forEach((el) => {
        const input = /** @type {HTMLInputElement} */ (el);
        input.addEventListener('change', (ev) => {
          const target = /** @type {HTMLInputElement} */ (ev.currentTarget);
          const idx = Number(target.dataset.subidx || '0');
          if (Array.isArray(task.subtasks) && task.subtasks[idx]) {
            task.subtasks[idx].done = target.checked;
            firebase.database().ref("tasks/" + task.id + "/subtasks").set(task.subtasks);
          }
        });
      });

      (/** @type {HTMLButtonElement} */(body.querySelector('#editTaskBtn'))).onclick = () => { isEditing = true; renderDetail(); };
      (/** @type {HTMLButtonElement} */(body.querySelector('#deleteTaskBtn'))).onclick = () => showDeleteConfirmDialog(task.id, dialog);
      (/** @type {HTMLButtonElement} */(body.querySelector('#closeTaskDetail'))).onclick = () => dialog.close();
    } else {
      body.innerHTML = `
        <button id="closeTaskDetail" class="close-task-detail" aria-label="Close">&times;</button>
        <span class="task-detail-badge cat-${catClass}">${task.category || ""}</span>
        <form id="editTaskForm" style="display:flex;flex-direction:column;gap:14px;">
          <label for="editTitle">Title</label>
          <input id="editTitle" type="text" value="${task.title || ""}" required>
          <label for="editDescription">Description</label>
          <textarea id="editDescription" required>${task.description || ""}</textarea>
          <label for="editDueDate">Due date</label>
          <div class="input-icon-date">
            <input type="date" id="editDueDate" value="${task.dueDate || ""}" required>
          </div>
          <label>Priority</label>
          <div class="priority-buttons">
            <button type="button" class="btn${(task.priority || "medium") === "urgent" ? " active" : ""}"  data-priority="urgent">Urgent <img src="../assets/icons/add_task/urgent_small.png" alt=""></button>
            <button type="button" class="btn${(task.priority || "medium") === "medium" ? " active" : ""}" data-priority="medium">Medium <img src="../assets/icons/add_task/medium_orange.png" alt=""></button>
            <button type="button" class="btn${(task.priority || "medium") === "low" ? " active" : ""}"     data-priority="low">Low <img src="../assets/icons/add_task/low.png" alt=""></button>
          </div>
          <label>Assigned to</label>
          <select id="editAssignedTo" multiple></select>
          <div id="editAssignedAvatars" style="display:flex;gap:7px;"></div>
          <label for="edit-detail-subtasks">Subtasks</label>
          <div id="edit-detail-subtasks"></div>
          <div style="display:flex;justify-content:flex-end;gap:14px;">
            <button id="saveTaskBtn" class="create_task_btn" type="submit">Ok &#10003;</button>
          </div>
        </form>`;

      // --- Datum ab heute begrenzen (Edit-Dialog)
      {
        const editDue = /** @type {HTMLInputElement|null} */(body.querySelector('#editDueDate'));
        if (editDue) {
          const tz = new Date().getTimezoneOffset() * 60000;
          const todayLocal = new Date(Date.now() - tz).toISOString().slice(0, 10);
          editDue.min = todayLocal;
          editDue.addEventListener('input', () => {
            if (editDue.value && editDue.value < editDue.min) editDue.value = editDue.min;
          });
        }
      }

      // Priority
      /** @type {TaskPriority} */
      let editPrio = /** @type {TaskPriority} */(task.priority || "medium");
      body.querySelectorAll('.priority-buttons .btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          body.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          editPrio = /** @type {TaskPriority} */((/** @type {HTMLElement} */(this)).dataset.priority || "medium");
        });
      });

      // Assigned (Choices.js)
      const assignedSelect = /** @type {HTMLSelectElement} */(body.querySelector('#editAssignedTo'));
      assignedSelect.innerHTML = '';

      if (/** @type {any} */(window).allUsers) {
        const groupUsers = document.createElement('optgroup'); groupUsers.label = "Registered Users";
        Object
          // @ts-ignore
          .entries(window.allUsers)
          .forEach(([uid, u]) => {
            const opt = document.createElement('option');
            opt.value = String(uid);
            opt.textContent = u.name || u.email || String(uid);
            groupUsers.appendChild(opt);
          });
        assignedSelect.appendChild(groupUsers);
      }

      if (/** @type {any} */(window).allContacts) {
        const groupContacts = document.createElement('optgroup'); groupContacts.label = "Contacts";
        Object
          // @ts-ignore
          .entries(window.allContacts)
          .forEach(([uid, u]) => {
            const opt = document.createElement('option');
            opt.value = String(uid);
            opt.textContent = u.name;
            groupContacts.appendChild(opt);
          });
        assignedSelect.appendChild(groupContacts);
      }

      // Destroy/Init Choices
      if (/** @type {any} */(window).editAssignedChoices) {
        // @ts-ignore
        window.editAssignedChoices.destroy();
      }
      // @ts-ignore
      window.editAssignedChoices = new Choices(assignedSelect, {
        removeItemButton: true,
        searchEnabled: true,
        shouldSort: false,
        placeholder: true,
        placeholderValue: 'Select contacts to assign'
      });

      const assignedIds = Array.isArray(task.assignedTo)
        ? task.assignedTo
        : (task.assignedTo ? [task.assignedTo] : []);
      // @ts-ignore
      window.editAssignedChoices.removeActiveItems();
      assignedIds.forEach(id => {
        // @ts-ignore
        window.editAssignedChoices.setChoiceByValue(String(id));
      });

      function updateAssignedAvatars() {
        const avatarDiv = /** @type {HTMLDivElement} */(body.querySelector('#editAssignedAvatars'));
        avatarDiv.innerHTML = Array.from(assignedSelect.selectedOptions)
          .map(opt => getProfileBadge(opt.value))
          .join('');
      }
      updateAssignedAvatars();
      assignedSelect.addEventListener('change', updateAssignedAvatars);

      renderSubtasksEdit(/** @type {HTMLDivElement} */(body.querySelector('#edit-detail-subtasks')), task);

      (/** @type {HTMLButtonElement} */(body.querySelector('#closeTaskDetail'))).onclick = () => dialog.close();

      (/** @type {HTMLFormElement} */(body.querySelector('#editTaskForm'))).onsubmit = function (e) {
        e.preventDefault();
        const newTitle   = (/** @type {HTMLInputElement} */(body.querySelector('#editTitle'))).value.trim();
        const newDesc    = (/** @type {HTMLTextAreaElement} */(body.querySelector('#editDescription'))).value.trim();
        const newDueDate = (/** @type {HTMLInputElement} */(body.querySelector('#editDueDate'))).value.trim();

        const assignedSel = /** @type {HTMLSelectElement} */(body.querySelector('#editAssignedTo'));
        const newAssigned = Array.from(assignedSel.selectedOptions).map(opt => opt.value);

        const cleanSubtasks = (task.subtasks || [])
          .filter(st => st && st.title && st.title.trim())
          .map(st => ({ title: st.title.trim(), done: !!st.done }));

        firebase.database().ref("tasks/" + task.id).update({
          title: newTitle,
          description: newDesc,
          dueDate: newDueDate,
          priority: editPrio,
          assignedTo: newAssigned,
          subtasks: cleanSubtasks
        }).then(() => { isEditing = false; renderDetail(); });
      };
    }
    dialog.showModal();
  }
}

// === Subtasks editieren (Inline) ===
function renderSubtasksEdit(container, task) {
  container.innerHTML = '';

  // Eingabezeile
  const inputWrap = document.createElement('div');
  inputWrap.className = 'subtask-input-row';

  const subtaskInput = document.createElement('input');
  subtaskInput.type = "text";
  subtaskInput.placeholder = "Add subtask";
  subtaskInput.className = "edit-subtask-input";
  subtaskInput.style.flex = "1";

  const addBtn = document.createElement('button');
  addBtn.type = "button";
  addBtn.innerHTML = '<img src="../assets/icons/add_task/subtask_icon.png" style="width:20px;" alt="">';
  addBtn.className = "add-subtask-btn";
  addBtn.onclick = addSubtask;

  inputWrap.appendChild(subtaskInput);
  inputWrap.appendChild(addBtn);
  container.appendChild(inputWrap);

  // Liste
  const listWrap = document.createElement('div');
  listWrap.className = "subtask-list-wrap";
  const list = document.createElement('ul');
  list.style.listStyle = "none";
  list.style.padding = "0";
  list.style.margin = "0";

  (Array.isArray(task.subtasks) ? task.subtasks : []).forEach((st, idx) => {
    if (!st.title) return;
    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "7px";
    li.style.marginBottom = "4px";

    li.innerHTML = `
      <input type="checkbox" ${st.done ? "checked" : ""} style="margin:0;">
      <span class="subtask-title" style="flex:1;">${st.title}</span>
      <span class="subtask-actions" style="display:none;">
        <button type="button" class="subtask-edit-btn" title="Bearbeiten">
          <img src="../assets/icons/add_task/edit.png" alt="Edit" style="width:16px;">
        </button>
        <button type="button" class="subtask-delete-btn" title="Löschen">
          <img src="../assets/icons/board/delete.png" alt="Delete" style="width:17px;">
        </button>
      </span>
    `;

    // Checkbox
    const cb = /** @type {HTMLInputElement | null} */ (
      li.querySelector('input[type="checkbox"]')
    );
    if (cb) {
      cb.addEventListener('change', (ev) => {
        const input = /** @type {HTMLInputElement} */ (ev.currentTarget);
        if (!Array.isArray(task.subtasks)) task.subtasks = [];
        task.subtasks[idx].done = input.checked;
      });
    }

    li.addEventListener('mouseenter', () => {
      const a = /** @type {HTMLElement} */(li.querySelector('.subtask-actions'));
      a.style.display = 'inline-flex';
    });
    li.addEventListener('mouseleave', () => {
      const a = /** @type {HTMLElement} */(li.querySelector('.subtask-actions'));
      a.style.display = 'none';
    });

    (/** @type {HTMLButtonElement} */(li.querySelector('.subtask-edit-btn'))).addEventListener('click', () => {
      editSubtaskInline(li, idx, task);
    });
    (/** @type {HTMLButtonElement} */(li.querySelector('.subtask-delete-btn'))).addEventListener('click', () => {
      if (!Array.isArray(task.subtasks)) task.subtasks = [];
      task.subtasks.splice(idx, 1);
      renderSubtasksEdit(container, task);
    });

    list.appendChild(li);
  });

  listWrap.appendChild(list);
  container.appendChild(listWrap);

  function addSubtask() {
    const val = subtaskInput.value.trim();
    if (val) {
      if (!Array.isArray(task.subtasks)) task.subtasks = [];
      task.subtasks.push({ title: val, done: false });
      subtaskInput.value = '';
      renderSubtasksEdit(container, task);
    }
  }
  subtaskInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } });
}

/** Inline-Edit eines Subtasks (Save mit Enter/Blur, Cancel mit Esc). */
function editSubtaskInline(li, idx, task) {
  const span = /** @type {HTMLSpanElement} */(li.querySelector('.subtask-title'));
  const actions = /** @type {HTMLElement} */(li.querySelector('.subtask-actions'));
  const oldValue = span.textContent || '';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldValue;
  input.style.width = '70%';
  span.replaceWith(input);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', save);

  function save() {
    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    task.subtasks[idx].title = input.value.trim() || oldValue;
    const newSpan = document.createElement('span');
    newSpan.className = 'subtask-title';
    newSpan.textContent = task.subtasks[idx].title;
    newSpan.style.flex = "1";
    input.replaceWith(newSpan);
    actions.style.display = 'none';
  }
  function cancel() {
    const newSpan = document.createElement('span');
    newSpan.className = 'subtask-title';
    newSpan.textContent = oldValue;
    newSpan.style.flex = "1";
    input.replaceWith(newSpan);
    actions.style.display = 'none';
  }
  input.focus();
}


/**
 * =======================
 * Delete Dialog & Date Helper
 * =======================
 */
function showDeleteConfirmDialog(taskId, parentDialog) {
  const deleteDialog = /** @type {HTMLDialogElement} */(document.getElementById('deleteConfirmDialog'));
  deleteDialog.showModal();

  const confirmBtn = /** @type {HTMLButtonElement} */(document.getElementById('confirmDeleteBtn'));
  const cancelBtn  = /** @type {HTMLButtonElement} */(document.getElementById('cancelDeleteBtn'));

  confirmBtn.onclick = () => {
    firebase.database().ref("tasks/" + taskId).remove().then(() => {
      deleteDialog.close();
      if (parentDialog) parentDialog.close();
    });
  };
  cancelBtn.onclick = () => deleteDialog.close();
}

/** Datum in MM/DD/YYYY normalisieren (nimmt yyyy-mm-dd oder bereits mm/dd/yyyy). */
function formatDueDate(dueDate) {
  if (!dueDate) return '';
  /** @type {Date | null} */
  let dateObj = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    dateObj = new Date(dueDate);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dueDate)) {
    return dueDate;
  }
  if (dateObj && !isNaN(+dateObj)) {
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
  return dueDate;
}


/**
 * ===================================================================
 * UI-Teile aus dem Add-Task-Overlay (Board)
 * ===================================================================
 */
/** Custom-Dropdown „Assigned to“ neu rendern (fixe Liste, keine Selected-Sektion). */
function renderAssignedDropdown() {
  const dd = assignedDropdown;
  if (!dd) return;

  // Scrollposition merken, damit die Liste beim toggeln NICHT springt
  const keepScroll = dd.scrollTop;
  dd.innerHTML = '';

  // Stabile, fixe Reihenfolge (alphabetisch nach Name)
  const entries = Object.entries(assignedUsers).sort(([, a], [, b]) =>
    String(a.name).localeCompare(String(b.name))
  );

  entries.forEach(([id, user]) => {
    const option = document.createElement('div');
option.className = 'custom-option';
option.tabIndex = 0;
option.dataset.userId = id;

// ▼ NEU: markierte Einträge für CSS stylen
if (user.selected) option.classList.add('selected');


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
    dd.appendChild(option);

    // Auswahl toggeln – Dropdown bleibt offen, Liste bleibt fix
    const toggle = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      assignedUsers[id].selected = !assignedUsers[id].selected;
      renderAssignedDropdown();   // UI refresh (gleiche Reihenfolge)
      renderAssignedBadges();     // Badges refresh (mit +N)
      // Scrollposition wiederherstellen
      dd.scrollTop = keepScroll;
    };

    option.addEventListener('pointerdown', toggle);
    option.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') toggle(ev);
    });
  });

  // Scrollposition zurücksetzen
  dd.scrollTop = keepScroll;
}

/** Avatar-Badges unter dem Feld (max. 4, Rest als +N). */
function renderAssignedBadges() {
  const container = assignedBadges;
  if (!container) return;

  container.innerHTML = '';

  const selectedList = Object.entries(assignedUsers)
    .filter(([, u]) => u.selected)
    .map(([, u]) => u);

  const cap = 4;
  selectedList.slice(0, cap).forEach(user => {
    const badge = document.createElement('div');
    badge.className = 'avatar-badge';
    badge.textContent = user.initials;
    badge.style.backgroundColor = generateColorFromString(user.name);
    container.appendChild(badge);
  });

  const extra = selectedList.length - cap;
  if (extra > 0) {
    const more = document.createElement('div');
    more.className = 'avatar-badge avatar-badge-more';
    more.textContent = `+${extra}`;
    container.appendChild(more);
  }
}

// === Exporte für board.js ===
(/** @type {any} */(window)).initAssignedDropdown = initAssignedDropdown;

(/** @type {any} */(window)).__boardGetSelectedAssigned = function () {
  return Object.entries(assignedUsers)
    .filter(([, u]) => u.selected)
    .map(([id]) => id);
};

(/** @type {any} */(window)).__boardResetAssigned = function () {
  Object.values(assignedUsers).forEach(u => u.selected = false);
  renderAssignedDropdown();
  renderAssignedBadges();
  if (assignedDropdown) assignedDropdown.classList.add('hidden');
};



/**
 * ===================================================================
 * Board-Overlay Defaults: Medium-Prio + Datum "ab heute"
 * ===================================================================
 */
(function ensureBoardAddDefaults() {
  // Medium vorselektieren
  const wrap = document.querySelector('#addTaskOverlay .priority-buttons');
  if (wrap && !wrap.querySelector('.btn.active')) {
    const mediumBtn = wrap.querySelector('[data-priority="medium"]');
    if (mediumBtn instanceof HTMLButtonElement) {
      mediumBtn.classList.add('active');
    }
  }

  // Sicherstellen, dass das Dropdown auch wirklich „lebt“, sobald der Dialog aufgeht
(function ensureAddDropdownOnOpen(){
  const dlg = /** @type {HTMLDialogElement|null} */ (document.getElementById('addTaskOverlay'));
  if (!dlg) return;

  const rebind = () => setTimeout(() => initAssignedDropdown(), 0);

  // Re-init, wenn das <dialog> geöffnet wird (open-Attribut)
  new MutationObserver(() => { if (dlg.open) rebind(); })
    .observe(dlg, { attributes: true, attributeFilter: ['open'] });
})();


  // Datum ab heute
  const due = /** @type {HTMLInputElement|null} */(document.getElementById('task-due-date'));
  if (due) {
    const tz = new Date().getTimezoneOffset() * 60000;
    const todayLocal = new Date(Date.now() - tz).toISOString().slice(0, 10);
    due.min = todayLocal;
    due.addEventListener('input', () => {
      if (due.value && due.value < due.min) due.value = due.min;
    });
  }
})();
