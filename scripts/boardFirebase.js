// =========================
// Farbpalette für Initialen
// =========================
const BADGE_COLORS = [
  "#FFA800", "#FF5EB3", "#6E52FF", "#9327FF", "#00BEE8",
  "#1FD7C1", "#FF745E", "#FFBB2B", "#424242", "#FF7A00"
];

function getInitialsColor(nameOrId) {
  let hash = 0;
  for (let i = 0; i < nameOrId.length; i++) hash = nameOrId.charCodeAt(i) + ((hash << 5) - hash);
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

// =========================
// Globale Variablen
// =========================
let tasks = [];
let users = {};
let contacts = {};

// =========================
// Kontakte/Users laden
// =========================
// Registrierte User laden
firebase.database().ref("users").once("value").then(snap => {
  users = snap.val() || {};
  window.allUsers = users;
  // Kontakte laden, dann Tasks laden!
  firebase.database().ref("contacts").once("value").then(csnap => {
    contacts = csnap.val() || {};
    window.allContacts = contacts;
    loadAllTasks();
  });
});

function getPersonData(id) {
  return users[id] || contacts[id] || null;
}


// =========================
// Tasks laden & rendern
// =========================
function loadAllTasks() {
  firebase.database().ref("tasks").on("value", snapshot => {
    const tasksObj = snapshot.val() || {};
    tasks = Object.values(tasksObj);
    renderBoard(tasks);
  });
}

// =========================
// Task-Avatare/Initialen
// =========================
function getProfileBadge(userId) {
  const user = getPersonData(userId);
  if (!user) return '';
  const name = user.name || '';
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase()
    : userId.slice(0,2).toUpperCase();
  const color = getInitialsColor(userId);
  return `<span class="profile-badge" style="background:${color};">${initials}</span>`;
}

// =========================
// Board Rendering
// =========================
function renderBoard(tasksArr) {
  const toDo = document.getElementById("toDo");
  const inProgress = document.getElementById("inProgress");
  const awaitFeedback = document.getElementById("awaitFeedback");
  const done = document.getElementById("done");
  [toDo, inProgress, awaitFeedback, done].forEach(c => c.innerHTML = "");

  if (!tasksArr.some(t => t.status === "todo")) toDo.innerHTML = `<div class="notask">No tasks To Do</div>`;
  if (!tasksArr.some(t => t.status === "inprogress")) inProgress.innerHTML = `<div class="notask">No tasks In Progress</div>`;
  if (!tasksArr.some(t => t.status === "awaitingfeedback")) awaitFeedback.innerHTML = `<div class="notask">No tasks Awaiting Feedback</div>`;
  if (!tasksArr.some(t => t.status === "done")) done.innerHTML = `<div class="notask">No tasks Done</div>`;

  tasksArr.forEach(task => {
    let col = null;
    if (task.status === "todo") col = toDo;
    else if (task.status === "inprogress") col = inProgress;
    else if (task.status === "awaitingfeedback") col = awaitFeedback;
    else if (task.status === "done") col = done;
    if (!col) return;
    col.appendChild(createTaskCard(task));
  });
}

// =========================
// Task Card Renderer
// =========================
function createTaskCard(task) {
  // Subtasks Fortschritt
  let subtasksDone = 0;
  let subtasksTotal = 0;
  if (Array.isArray(task.subtasks)) {
    // Filtere kaputte/ungültige raus
    const validSubtasks = task.subtasks.filter(st => st && typeof st === "object" && typeof st.title === "string" && st.title.trim() !== "");
    subtasksTotal = validSubtasks.length;
    subtasksDone = validSubtasks.filter(st => st.done).length;
  } else if (task.subtasks && typeof task.subtasks === "object") {
    // Für seltene Fälle, falls mal als Objekt gespeichert
    const values = Object.values(task.subtasks).filter(st => st && typeof st === "object" && typeof st.title === "string" && st.title.trim() !== "");
    subtasksTotal = values.length;
    subtasksDone = values.filter(st => st.done).length;
  }

  // Priority Icon
  let prioIcon = "../assets/icons/board/prio/prio mid.svg";
  if (task.priority === "urgent") prioIcon = "../assets/icons/board/prio/prio top.svg";
  else if (task.priority === "low") prioIcon = "../assets/icons/board/prio/prio low.svg";

  // Category Tag
  let categoryClass = "task-header";
  if (task.category) {
    if (task.category.toLowerCase().includes("technical")) categoryClass += " user-task";
    else if (task.category.toLowerCase().includes("user")) categoryClass += " tech-task";
    else if (task.category.toLowerCase().includes("bug")) categoryClass += " bug-task";
    else if (task.category.toLowerCase().includes("research")) categoryClass += " research-task";
  }

  // Kontakte/Avatare (Initialen-Badges)
  let contactBadges = '';
  if (task.assignedTo) {
    const assignedArr = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
    contactBadges = assignedArr.map(uid => getProfileBadge(uid)).join('');
  }

  // Subtasks-Anzeige
  let subtaskBar = '';
  if (subtasksTotal > 0) {
    const percent = Math.round((subtasksDone / subtasksTotal) * 100);
    subtaskBar = `
      <div class="task-bar" style="cursor:pointer;">
        <div class="bar-wrapper">
          <div class="progress-bar">
            <span class="progress-bar-fill" style="width: ${percent}%;"></span>
          </div>
        </div>
        <span class="sub-task">${subtasksDone}/${subtasksTotal} Subtasks</span>
      </div>`;
  }

  // Task Card Element bauen
  const card = document.createElement("div");
  card.className = "task";
  card.innerHTML = `
      <span class="${categoryClass}">${task.category || ""}</span>
      <h4 class="task-title">${task.title || ""}</h4>
      <p class="task-info">${task.description || ""}</p>
      ${subtaskBar}
      <div class="task-status">
        <div>
          ${contactBadges}
        </div>
        <img class="prio-icon" src="${prioIcon}" alt="">
      </div>
  `;

  // === DRAG & DROP ===
  card.setAttribute("draggable", "true");
  card.dataset.taskId = task.id;
  card.addEventListener("dragstart", dragStartHandler);
  card.addEventListener("dragend", dragEndHandler);
  card.addEventListener("click", () => openTaskDetail(task));

  return card;
}

// --- DRAG & DROP HANDLING ---
let draggedTaskId = null;
["toDo", "inProgress", "awaitFeedback", "done"].forEach(colId => {
  const col = document.getElementById(colId);
  if (!col) return;
  col.addEventListener("dragover", dragOverHandler);
  col.addEventListener("drop", dropHandler);
  col.addEventListener("dragenter", dragEnterHandler);
  col.addEventListener("dragleave", dragLeaveHandler);
});

function dragStartHandler(e) {
  draggedTaskId = this.dataset.taskId;
  setTimeout(() => this.classList.add('dragging'), 0);
}
function dragEndHandler(e) {
  draggedTaskId = null;
  this.classList.remove('dragging');
}
function dragOverHandler(e) { e.preventDefault(); }
function dragEnterHandler(e) { this.classList.add('drop-target'); }
function dragLeaveHandler(e) { this.classList.remove('drop-target'); }
function dropHandler(e) {
  e.preventDefault();
  this.classList.remove('drop-target');
  if (!draggedTaskId) return;
  const colMap = {
    toDo: "todo",
    inProgress: "inprogress",
    awaitFeedback: "awaitingfeedback",
    done: "done"
  };
  const newStatus = colMap[this.id];
  if (!newStatus) return;
  firebase.database().ref("tasks/" + draggedTaskId + "/status").set(newStatus);
}

// =========================
// Suche: Tasks filtern
// =========================
document.getElementById('taskSearch').addEventListener('input', function () {
  const value = this.value.trim().toLowerCase();
  if (!value) {
    renderBoard(tasks);
    return;
  }
  const filtered = tasks.filter(t =>
    (t.title && t.title.toLowerCase().includes(value)) ||
    (t.description && t.description.toLowerCase().includes(value))
  );
  renderBoard(filtered);
});
const mobileSearch = document.getElementById('taskSearchMobile');
if (mobileSearch) {
  mobileSearch.addEventListener('input', function () {
    const value = this.value.trim().toLowerCase();
    if (!value) {
      renderBoard(tasks);
      return;
    }
    const filtered = tasks.filter(t =>
      (t.title && t.title.toLowerCase().includes(value)) ||
      (t.description && t.description.toLowerCase().includes(value))
    );
    renderBoard(filtered);
  });
}

// =========================
// Dummy Overlay-Functions (später implementieren)
// =========================
window.openAddTaskOverlay = function () {
  alert("Add Task Overlay wird noch nicht unterstützt.");
};
window.openAddTaskMobile = function () {
  alert("Add Task Overlay für Mobile kommt bald.");
};

// =========================
// Öffnet das Task-Detail-Overlay MIT SUBTASKS LIVE!
// =========================
function openTaskDetail(task) {
  const dialog = document.getElementById("taskDetailDialog");
  const body = document.getElementById("taskDetailBody");

  // Edit-Status: Start als "readonly"
  let isEditing = false;

  renderDetail();

  function renderSubtasksEdit(container, task) {
    container.innerHTML = '';
    if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) {
      container.innerHTML = "<i>No subtasks.</i>";
      return;
    }
    // Liste editierbar bauen
    task.subtasks.forEach((st, i) => {
      let checked = !!(typeof st === "object" && st.done);
      let label = typeof st === "object" ? (st.title || "") : st;

      const wrapper = document.createElement('div');
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "8px";

      // Checkbox
      const cb = document.createElement('input');
      cb.type = "checkbox";
      cb.checked = checked;
      cb.onchange = function () {
        if (typeof task.subtasks[i] === "string") {
          task.subtasks[i] = { title: label, done: cb.checked };
        } else if (task.subtasks[i] && typeof task.subtasks[i] === "object") {
          task.subtasks[i].done = cb.checked;
        }
      };
      wrapper.appendChild(cb);

      // Titel-Input
      const input = document.createElement('input');
      input.type = "text";
      input.value = label;
      input.style.width = "70%";
      input.oninput = function () {
        if (typeof task.subtasks[i] === "string") {
          task.subtasks[i] = { title: input.value, done: cb.checked };
        } else if (task.subtasks[i] && typeof task.subtasks[i] === "object") {
          task.subtasks[i].title = input.value;
        }
      };
      wrapper.appendChild(input);

      // Delete-Button
      const del = document.createElement('button');
      del.type = "button";
      del.textContent = "🗑️";
      del.title = "Delete subtask";
      del.style.border = "none";
      del.style.background = "none";
      del.style.cursor = "pointer";
      del.onclick = function () {
        task.subtasks.splice(i, 1);
        renderSubtasksEdit(container, task); // neu rendern!
      };
      wrapper.appendChild(del);

      container.appendChild(wrapper);
    });
  }

function renderDetail() {
  body.innerHTML = `
    <button id="closeTaskDetail" class="close-task-detail" title="Close">&times;</button>
    <span class="task-detail-badge ${task.category && task.category.toLowerCase().includes('tech') ? 'task-badge-tech' : 'task-badge-user'}">${task.category || ""}</span>
    ${isEditing
      ? `<input id="editTitle" value="${task.title || ""}" class="edit-input" style="width:100%;margin-bottom:10px;font-size:1.5rem;font-weight:bold;">`
      : `<h2>${task.title || ""}</h2>`}
    ${isEditing
      ? `<textarea id="editDescription" class="edit-textarea" style="width:100%;height:64px;margin-bottom:10px;">${task.description || ""}</textarea>`
      : `<div>${task.description || ""}</div>`}
    <div class="task-detail-label"><b>Due date:</b> ${
      isEditing
        ? `<input id="editDueDate" type="date" value="${task.dueDate || ""}" style="margin-left:8px;">`
        : formatDueDate(task.dueDate)
    }</div>
    <div class="task-detail-label"><b>Priority:</b> ${
      isEditing
        ? `<select id="editPriority" style="margin-left:8px;">
            <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
           </select>`
        : (task.priority || "")
    }</div>
    <div class="task-detail-label"><b>Assigned To:</b></div>
  <div class="task-detail-contacts">
    ${isEditing
      ? `<select id="editAssignedTo" multiple style="width:100%;min-height:38px"></select>`
: (Array.isArray(task.assignedTo) && task.assignedTo.length
    ? `<div class="assigned-users-list">` +
        task.assignedTo.map(uid =>
            `<div class="assigned-user">
                ${getProfileBadge(uid)}
                <span class="assigned-user-name">${getPersonData(uid)?.name || ""}</span>
            </div>`
        ).join('') +
      `</div>`
    : (task.assignedTo
        ? `<div class="assigned-users-list">
                <div class="assigned-user">
                    ${getProfileBadge(task.assignedTo)}
                    <span class="assigned-user-name">${getPersonData(task.assignedTo)?.name || ""}</span>
                </div>
           </div>`
        : ""))
    }
  </div>
    <div class="task-detail-label"><b>Subtasks</b></div>
    <div class="task-detail-subtasks" id="edit-detail-subtasks"></div>
    <div class="task-detail-actions">
      ${isEditing
        ? `<button id="saveTaskBtn" class="edit-btn"><img src="../assets/icons/board/edit.png" alt=""> Speichern</button>
           <button id="cancelEditBtn" class="cancel-btn">Abbrechen</button>`
        : `<button id="deleteTaskBtn" class="delete-btn"><img src="../assets/icons/board/delete.png" alt=""> Löschen</button>
           <button id="editTaskBtn" class="edit-btn"><img src="../assets/icons/board/edit.png" alt=""> Bearbeiten</button>`
      }
    </div>
  `;

  // AssignedTo Multi-Select mit Registered Users + Contacts (nur im Edit-Mode)
if (isEditing) {
  const assignedSelect = document.getElementById('editAssignedTo');
  assignedSelect.innerHTML = '';

  Promise.all([
    firebase.database().ref("users").once("value").then(r => r.val()),
    firebase.database().ref("contacts").once("value").then(r => r.val())
  ]).then(([allUsers, allContacts]) => {
    // KEIN selected setzen!
    if (allUsers) {
      const groupUsers = document.createElement('optgroup');
      groupUsers.label = "Registered Users";
      Object.entries(allUsers).forEach(([userId, userData]) => {
        const opt = document.createElement('option');
        opt.value = userId;
        opt.textContent = userData.name || userData.email || userId;
        groupUsers.appendChild(opt);
      });
      assignedSelect.appendChild(groupUsers);
    }
    if (allContacts) {
      const groupContacts = document.createElement('optgroup');
      groupContacts.label = "Contacts";
      Object.entries(allContacts).forEach(([userId, userData]) => {
        const opt = document.createElement('option');
        opt.value = userId;
        opt.textContent = userData.name;
        groupContacts.appendChild(opt);
      });
      assignedSelect.appendChild(groupContacts);
    }

    // Alte Choices-Instanz killen!
    if (window.editAssignedChoices) window.editAssignedChoices.destroy();

    // Nach dem Bauen aller Optionen:
    Array.from(assignedSelect.options).forEach(opt => opt.selected = false);


    // Choices NEU initialisieren!
    if (window.editAssignedChoices) window.editAssignedChoices.destroy();
    window.editAssignedChoices = new Choices(assignedSelect, {
      removeItemButton: true,
      searchEnabled: true,
      shouldSort: false,
      placeholder: true,
      placeholderValue: 'Select contacts to assign'
    });


window.editAssignedChoices.removeActiveItems(); // alles leeren

const assignedIds = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
assignedIds.forEach(id => {
  // Existiert die Option?
  const opt = assignedSelect.querySelector(`option[value="${id}"]`);
  if (opt) window.editAssignedChoices.setChoiceByValue(id);
});

  });
}

  // Subtasks editierbar machen im Edit-Mode
  if (isEditing) {
    renderSubtasksEdit(document.getElementById('edit-detail-subtasks'), task);
  } else {
    // Subtasks im Lesemodus anzeigen
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const container = document.getElementById('edit-detail-subtasks');
    if (subtasks.length > 0) {
      container.innerHTML = subtasks.map((st, i) => {
        let checked = !!st.done;
        let label = typeof st.title === "string" ? st.title : "";
        return `<label style="display:flex;align-items:center;gap:6px;">
          <input type="checkbox" class="subtask-checkbox" data-subidx="${i}" ${checked ? "checked" : ""}>
          <span>${label}</span>
        </label>`;
      }).join('');
    } else {
      container.innerHTML = "<i>No subtasks.</i>";
    }

    // Checkbox-Änderungen speichern (wie gehabt)
    container.querySelectorAll('.subtask-checkbox').forEach(cb => {
      cb.addEventListener('change', function() {
        const subIdx = this.dataset.subidx;
        const checked = this.checked;
        if (typeof task.subtasks[subIdx] === "string") {
          task.subtasks[subIdx] = { title: task.subtasks[subIdx], done: checked };
        } else if (task.subtasks[subIdx] && typeof task.subtasks[subIdx] === "object") {
          task.subtasks[subIdx].done = checked;
        }
        firebase.database().ref("tasks/" + task.id + "/subtasks").set(task.subtasks);
      });
    });
  }

  // Close Handler
  document.getElementById('closeTaskDetail').onclick = () => dialog.close();

  // Edit-Mode wechseln
  if (!isEditing) {
    document.getElementById('editTaskBtn').onclick = () => { isEditing = true; renderDetail(); };
    document.getElementById('deleteTaskBtn').onclick = () => showDeleteConfirmDialog(task.id, dialog);
  } else {
    document.getElementById('saveTaskBtn').onclick = saveEdits;
    document.getElementById('cancelEditBtn').onclick = () => { isEditing = false; renderDetail(); };
  }

  // Speichern-Funktion innerhalb von renderDetail!
  function saveEdits() {
    const newTitle = document.getElementById('editTitle').value.trim();
    const newDesc = document.getElementById('editDescription').value.trim();
    const newDueDate = document.getElementById('editDueDate') ? document.getElementById('editDueDate').value.trim() : task.dueDate;
    const newPriority = document.getElementById('editPriority') ? document.getElementById('editPriority').value : task.priority;
    const assignedSelect = document.getElementById('editAssignedTo');
    const newAssigned = Array.from(assignedSelect.selectedOptions).map(opt => opt.value);

    // Subtasks immer bereinigen
    let cleanSubtasks = (task.subtasks || [])
      .filter(st => st && typeof st === "object" && st.title && st.title.trim() !== "")
      .map(st => ({ title: st.title.trim(), done: !!st.done }));

    firebase.database().ref("tasks/" + task.id).update({
      title: newTitle,
      description: newDesc,
      dueDate: newDueDate,
      priority: newPriority,
      assignedTo: newAssigned,
      subtasks: cleanSubtasks // nur gültige Subtasks!
      // Kategorie wird nicht angefasst!
    }).then(() => {
      isEditing = false;
      renderDetail();
    });
  }
}
  dialog.showModal();
}

// Farbe aus String (Backup, falls gebraucht)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

// === TASK LÖSCHEN ===
function deleteTask(taskId) {
  if (!confirm('Do you really want to delete this task?')) return;
  firebase.database().ref("tasks/" + taskId).remove()
    .then(() => {
      // Optional: Modal automatisch schließen
      const dialog = document.getElementById("taskDetailDialog");
      if (dialog) dialog.close();
    })
    .catch(err => alert("Error deleting task: " + err.message));
}

// === TASK EDITIEREN ===
function editTask(taskId) {
  // 1. Task finden
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  // 2. Einfache Prompt-Dialoge für Demo
  const newTitle = prompt("Edit Title:", task.title);
  if (newTitle === null) return; // Abbrechen

  const newDesc = prompt("Edit Description:", task.description || "");
  if (newDesc === null) return; // Abbrechen

  // 3. (Optional: Prio etc. auch editierbar machen)
  // ...

  // 4. DB aktualisieren
  firebase.database().ref("tasks/" + taskId).update({
    title: newTitle,
    description: newDesc
    // Hier kannst du weitere Felder ergänzen!
  }).then(() => {
    // Modal aktualisieren (optional: einfach schließen und neu öffnen)
    const dialog = document.getElementById("taskDetailDialog");
    if (dialog) dialog.close();
  });
}

function showDeleteConfirmDialog(taskId, parentDialog) {
  const deleteDialog = document.getElementById('deleteConfirmDialog');
  deleteDialog.showModal();

  // Entferne vorherige Event-Listener!
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  confirmBtn.onclick = () => {
    firebase.database().ref("tasks/" + taskId).remove().then(() => {
      deleteDialog.close();
      if (parentDialog) parentDialog.close();
    });
  };
  cancelBtn.onclick = () => {
    deleteDialog.close();
  };
}

// Formatierung für Due Date
function formatDueDate(dueDate) {
  if (!dueDate) return '';
  let dateObj = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) { // yyyy-mm-dd
    dateObj = new Date(dueDate);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dueDate)) { // dd/mm/yyyy
    const [day, month, year] = dueDate.split("/");
    dateObj = new Date(`${year}-${month}-${day}`);
  }
  if (dateObj && !isNaN(dateObj)) {
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  }
  return dueDate; // Fallback: ungeparstes Feld
}
