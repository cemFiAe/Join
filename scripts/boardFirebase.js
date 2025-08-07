// =======================
// Farbpalette & Helpers
// =======================
const BADGE_COLORS = [
  "#FFA800", "#FF5EB3", "#6E52FF", "#9327FF", "#00BEE8",
  "#1FD7C1", "#FF745E", "#FFBB2B", "#424242", "#FF7A00",
  "#EB5D5D", "#009788", "#7B61FF", "#5A9FFF", "#1E90FF", "#F96D00", "#43B581", "#FF6C6C"
];
let tasks = [], users = {}, contacts = {};

function getInitialsColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

const getPersonData = id => users[id] || contacts[id] || null;

function getProfileBadge(userId) {
  const user = getPersonData(userId);
  if (!user) return '';
  const name = user.name || '';
  const initials = name
    ? name.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase()
    : userId.slice(0,2).toUpperCase();
  const color = getInitialsColor(name || userId);
  return `<span class="profile-badge" style="background:${color};">${initials}</span>`;
}

// =======================
// Daten laden
// =======================
firebase.database().ref("users").once("value").then(snap => {
  users = snap.val() || {};
  window.allUsers = users;
  firebase.database().ref("contacts").once("value").then(csnap => {
    contacts = csnap.val() || {};
    window.allContacts = contacts;
    // === WICHTIG: Jetzt erst das Dropdown initialisieren! ===
    if (typeof initAssignedDropdown === "function") {
      initAssignedDropdown();
    }
    loadAllTasks();
  });
});


function loadAllTasks() {
  firebase.database().ref("tasks").on("value", s => {
    tasks = Object.values(s.val() || {});
    renderBoard(tasks);
  });
}

// =======================
// Task-Board & Karten
// =======================
function renderBoard(arr) {
  const cols = { todo: "toDo", inprogress: "inProgress", awaitingfeedback: "awaitFeedback", done: "done" };
  Object.values(cols).forEach(id => document.getElementById(id).innerHTML = "");
  arr.forEach(task => {
    let col = cols[task.status];
    if (!col) return;
    document.getElementById(col).appendChild(createTaskCard(task));
  });
  Object.entries(cols).forEach(([st, id]) => {
    if (!arr.some(t => t.status === st)) document.getElementById(id).innerHTML = `<div class="notask">No tasks ${st.replace(/^\w/, c => c.toUpperCase())}</div>`;
  });
}

function createTaskCard(task) {
  const done = Array.isArray(task.subtasks) ? task.subtasks.filter(st => st.done).length : 0;
  const total = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
  const prioIcon = { urgent: "prio_top", medium: "prio_mid", low: "prio_low" }[task.priority] || "prio_mid";
  const categoryClass = "task-header"
    + (task.category?.toLowerCase().includes("bug") ? " bug-task"
    : task.category?.toLowerCase().includes("user") ? " tech-task"
    : task.category?.toLowerCase().includes("tech") ? " user-task"
    : task.category?.toLowerCase().includes("research") ? " research-task" : "");
  const badgeHtml = (Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo])
    .filter(Boolean).map(getProfileBadge).join('');
  const subBar = total ? `<div class="task-bar"><div class="bar-wrapper"><div class="progress-bar"><span class="progress-bar-fill" style="width:${Math.round(done / total * 100)}%"></span></div></div><span class="sub-task">${done}/${total} Subtasks</span></div>` : "";
  const card = document.createElement("div");
  card.className = "task";
  card.innerHTML = `<span class="${categoryClass}">${task.category || ""}</span>
    <h4 class="task-title">${task.title || ""}</h4>
    <p class="task-info">${task.description || ""}</p>${subBar}
    <div class="task-status"><div>${badgeHtml}</div><img class="prio-icon" src="../assets/icons/board/prio/${prioIcon}.svg"></div>`;
  card.setAttribute("draggable", "true");
  card.dataset.taskId = task.id;
  card.addEventListener("dragstart", dragStartHandler);
  card.addEventListener("dragend", dragEndHandler);
  card.addEventListener("click", () => openTaskDetail(task));
  return card;
}

// =======================
// Drag & Drop
// =======================
let draggedTaskId = null;
["toDo", "inProgress", "awaitFeedback", "done"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("dragover", e => e.preventDefault());
  el.addEventListener("drop", function (e) {
    e.preventDefault(); this.classList.remove('drop-target');
    if (!draggedTaskId) return;
    const map = { toDo: "todo", inProgress: "inprogress", awaitFeedback: "awaitingfeedback", done: "done" };
    firebase.database().ref("tasks/" + draggedTaskId + "/status").set(map[this.id]);
  });
  el.addEventListener("dragenter", function () { this.classList.add('drop-target'); });
  el.addEventListener("dragleave", function () { this.classList.remove('drop-target'); });
});
function dragStartHandler() { draggedTaskId = this.dataset.taskId; setTimeout(() => this.classList.add('dragging'), 0); }
function dragEndHandler() { draggedTaskId = null; this.classList.remove('dragging'); }

// =======================
// Suche
// =======================
function searchTasks(value) {
  value = value.trim().toLowerCase();
  renderBoard(value ? tasks.filter(t =>
    (t.title?.toLowerCase().includes(value) || t.description?.toLowerCase().includes(value))) : tasks
  );
}
document.getElementById('taskSearch').addEventListener('input', e => searchTasks(e.target.value));
const mobileSearch = document.getElementById('taskSearchMobile');
if (mobileSearch) mobileSearch.addEventListener('input', e => searchTasks(e.target.value));

// =======================
// Task-Detail & Edit Dialog
// =======================
function openTaskDetail(task) {
  const dialog = document.getElementById("taskDetailDialog");
  const body = document.getElementById("taskDetailBody");
  let isEditing = false;

  // Mapping für Kategorie-Farben (optional anpassen)
  const catClass = (task.category || '').toLowerCase().replace(/\s/g, '');
  const prioIcons = {
    urgent: "prio_top.svg",
    medium: "prio_mid.svg",
    low: "prio_low.svg"
  };
  const prioIcon = prioIcons[task.priority] || prioIcons["medium"];
  const prioLabel = (task.priority || "").charAt(0).toUpperCase() + (task.priority || "").slice(1);

  renderDetail();

  function renderDetail() {
    if (!isEditing) {
      body.innerHTML = `
        <button id="closeTaskDetail" class="close-task-detail">&times;</button>
        <span class="task-detail-badge cat-${catClass}">${task.category ? task.category : ""}</span>
        <h2 class="task-detail-title">${task.title || ""}</h2>
        <div class="task-detail-description">${task.description || ""}</div>
        <div class="task-detail-row">
          <span class="task-detail-label">Due date:</span>
          <span>${formatDueDate(task.dueDate)}</span>
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
              `<div class="assigned-user">${getProfileBadge(uid)}<span class="assigned-user-name">${getPersonData(uid)?.name || ""}</span></div>`
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
          <button id="deleteTaskBtn" class="delete-btn"><img src="../assets/icons/board/delete.png"> Delete</button>
          <button id="editTaskBtn" class="edit-btn"><img src="../assets/icons/board/edit.png"> Edit</button>
        </div>
      `;
      body.querySelectorAll('.subtask-checkbox').forEach(cb => {
        cb.onchange = function () {
          task.subtasks[this.dataset.subidx].done = this.checked;
          firebase.database().ref("tasks/" + task.id + "/subtasks").set(task.subtasks);
        }
      });
      body.querySelector('#editTaskBtn').onclick = () => { isEditing = true; renderDetail(); };
      body.querySelector('#deleteTaskBtn').onclick = () => showDeleteConfirmDialog(task.id, dialog);
      body.querySelector('#closeTaskDetail').onclick = () => dialog.close();
    } else {
      // ... hier bleibt dein Edit-Formular wie bisher, ggf. anpassen!
      body.innerHTML = `
        <button id="closeTaskDetail" class="close-task-detail">&times;</button>
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
            <button type="button" class="btn${task.priority === "urgent" ? " active" : ""}" data-priority="urgent">Urgent <img src="../assets/icons/add_task/urgent_small.png"></button>
            <button type="button" class="btn${task.priority === "medium" ? " active" : ""}" data-priority="medium">Medium <img src="../assets/icons/add_task/medium_orange.png"></button>
            <button type="button" class="btn${task.priority === "low" ? " active" : ""}" data-priority="low">Low <img src="../assets/icons/add_task/low.png"></button>
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
      // Priority Buttons Handling...
      let editPrio = task.priority || "medium";
      body.querySelectorAll('.priority-buttons .btn').forEach(btn => {
        btn.onclick = function (e) {
          e.preventDefault();
          body.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          editPrio = this.dataset.priority;
        }
      });
      // Assigned
      const assignedSelect = body.querySelector('#editAssignedTo');
      assignedSelect.innerHTML = '';
      if (window.allUsers) {
        const groupUsers = document.createElement('optgroup'); groupUsers.label = "Registered Users";
        Object.entries(window.allUsers).forEach(([uid, u]) => {
          const opt = document.createElement('option');
          opt.value = uid; opt.textContent = u.name || u.email || uid; groupUsers.appendChild(opt);
        }); assignedSelect.appendChild(groupUsers);
      }
      if (window.allContacts) {
        const groupContacts = document.createElement('optgroup'); groupContacts.label = "Contacts";
        Object.entries(window.allContacts).forEach(([uid, u]) => {
          const opt = document.createElement('option');
          opt.value = uid; opt.textContent = u.name; groupContacts.appendChild(opt);
        }); assignedSelect.appendChild(groupContacts);
      }
      // Choices.js
      if (window.editAssignedChoices) window.editAssignedChoices.destroy();
      window.editAssignedChoices = new Choices(assignedSelect, { removeItemButton: true, searchEnabled: true, shouldSort: false, placeholder: true, placeholderValue: 'Select contacts to assign' });
      const assignedIds = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
      window.editAssignedChoices.removeActiveItems(); assignedIds.forEach(id => window.editAssignedChoices.setChoiceByValue(id));
      function updateAssignedAvatars() {
        const avatarDiv = body.querySelector('#editAssignedAvatars');
        avatarDiv.innerHTML = Array.from(assignedSelect.selectedOptions).map(opt => getProfileBadge(opt.value)).join('');
      }
      updateAssignedAvatars(); assignedSelect.addEventListener('change', updateAssignedAvatars);
      renderSubtasksEdit(body.querySelector('#edit-detail-subtasks'), task);

      body.querySelector('#closeTaskDetail').onclick = () => dialog.close();
      body.querySelector('#editTaskForm').onsubmit = function (e) {
        e.preventDefault();
        const newTitle = body.querySelector('#editTitle').value.trim(),
          newDesc = body.querySelector('#editDescription').value.trim(),
          newDueDate = body.querySelector('#editDueDate').value.trim(),
          assignedSel = body.querySelector('#editAssignedTo'),
          newAssigned = Array.from(assignedSel.selectedOptions).map(opt => opt.value);
        let cleanSubtasks = (task.subtasks || []).filter(st => st && st.title && st.title.trim()).map(st => ({ title: st.title.trim(), done: !!st.done }));
        firebase.database().ref("tasks/" + task.id).update({
          title: newTitle, description: newDesc, dueDate: newDueDate,
          priority: editPrio, assignedTo: newAssigned, subtasks: cleanSubtasks
        }).then(() => { isEditing = false; renderDetail(); });
      }
    }
    dialog.showModal();
  }
}


// === NEUE SUBTASK-EDIT-FUNKTION MIT HOVER-EDIT/DELETE ===
function renderSubtasksEdit(container, task) {
  container.innerHTML = '';

  // Eingabefeld + Plus-Button
  const inputWrap = document.createElement('div');
  inputWrap.className = 'subtask-input-row';
  const subtaskInput = document.createElement('input');
  subtaskInput.type = "text";
  subtaskInput.placeholder = "Add subtask";
  subtaskInput.className = "edit-subtask-input";
  subtaskInput.style.flex = "1";
  const addBtn = document.createElement('button');
  addBtn.type = "button";
  addBtn.innerHTML = '<img src="../assets/icons/add_task/subtask_icon.png" style="width:20px;">';
  addBtn.className = "add-subtask-btn";
  addBtn.onclick = addSubtask;
  inputWrap.appendChild(subtaskInput);
  inputWrap.appendChild(addBtn);
  container.appendChild(inputWrap);

  // Subtask-Liste
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
    li.querySelector('input[type=checkbox]').onchange = function () {
      task.subtasks[idx].done = this.checked;
    };
    // Hover-Logik: Edit + Delete nur beim Hover
    li.addEventListener('mouseenter', () => {
      li.querySelector('.subtask-actions').style.display = 'inline-flex';
    });
    li.addEventListener('mouseleave', () => {
      li.querySelector('.subtask-actions').style.display = 'none';
    });
    // Edit
    li.querySelector('.subtask-edit-btn').addEventListener('click', function () {
      editSubtaskInline(li, idx, task);
    });
    // Delete
    li.querySelector('.subtask-delete-btn').addEventListener('click', function () {
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
  subtaskInput.addEventListener("keydown", e => { if (e.key === "Enter") { addSubtask(); } });
}

function editSubtaskInline(li, idx, task) {
  const span = li.querySelector('.subtask-title');
  const actions = li.querySelector('.subtask-actions');
  const oldValue = span.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldValue;
  input.style.width = '70%';
  span.replaceWith(input);

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', save);

  function save() {
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

// =======================
// Delete Dialog & Date Helper
// =======================
function showDeleteConfirmDialog(taskId, parentDialog) {
  const deleteDialog = document.getElementById('deleteConfirmDialog');
  deleteDialog.showModal();
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  confirmBtn.onclick = () => {
    firebase.database().ref("tasks/" + taskId).remove().then(() => {
      deleteDialog.close();
      if (parentDialog) parentDialog.close();
    });
  };
  cancelBtn.onclick = () => deleteDialog.close();
}
function formatDueDate(dueDate) {
  if (!dueDate) return '';
  let dateObj = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    dateObj = new Date(dueDate);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dueDate)) {
    // Schon korrektes Format
    return dueDate;
  }
  if (dateObj && !isNaN(dateObj)) {
    // MM/DD/YYYY
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
  return dueDate;
}


function renderAssignedDropdown() {
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
    label.textContent = user.name + (user.email === currentUserEmail ? ' (You)' : '');

    const checkbox = document.createElement('div');
    checkbox.className = 'custom-option-checkbox';
    if (user.selected) checkbox.classList.add('checked');

    option.appendChild(avatar);
    option.appendChild(label);
    option.appendChild(checkbox);
    assignedDropdown.appendChild(option);

    option.addEventListener('click', () => {
      assignedUsers[id].selected = !assignedUsers[id].selected;
      renderAssignedDropdown();
      renderAssignedBadges();
    });
  });
}

function renderAssignedBadges() {
  assignedBadges.innerHTML = '';
  Object.entries(assignedUsers).forEach(([id, user]) => {
    if (user.selected) {
      const badge = document.createElement('div');
      badge.className = 'avatar-badge';
      badge.textContent = user.initials;
      badge.style.backgroundColor = generateColorFromString(user.name);
      assignedBadges.appendChild(badge);
    }
  });
}