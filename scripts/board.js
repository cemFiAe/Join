document.addEventListener('DOMContentLoaded', function() {

  // --- Overlay Modal Handler ---
  window.openAddTaskDialog = function(status = "todo") {
    clearAddTaskForm();
    const dialog = document.getElementById('addTaskOverlay');
    dialog.showModal();
    dialog.dataset.status = status;
  }

  // Overlay schließen – über X oder "Clear"
  document.querySelector('.close-add-task-overlay').onclick =
  document.querySelector('.clear_button').onclick = function() {
    document.getElementById('addTaskOverlay').close();
    clearAddTaskForm();
  };

  // --- Felder leeren und zurücksetzen ---
  function clearAddTaskForm() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('task-due-date').value = '';
    document.getElementById('category').selectedIndex = 0;

    // assigned-Select zurücksetzen
    if (window.assignedChoices) {
      window.assignedChoices.removeActiveItems();
      window.assignedChoices.setChoiceByValue('');
    }

    // Priority-Buttons komplett deaktivieren
    document.querySelectorAll('.priority-buttons .btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Subtasks zurücksetzen
    window.boardSubtasks = [];
    document.getElementById('subtask-list').innerHTML = '';
    document.querySelector('.input-icon-subtask input').value = '';
  }

  // --- Priority Button Handling ---
  document.querySelectorAll('.priority-buttons .btn').forEach((btn, idx, btns) => {
    btn.addEventListener('click', function() {
      btns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // --- Subtask-Logik ---
  window.boardSubtasks = [];
  const subtaskInput = document.querySelector('.input-icon-subtask input');
  const subtaskAddBtn = document.querySelector('.add-subtask');
  const subtaskList = document.getElementById('subtask-list');
  subtaskAddBtn.addEventListener('click', addSubtaskToList);

  subtaskInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      addSubtaskToList();
      e.preventDefault();
    }
  });

  function addSubtaskToList() {
    const value = subtaskInput.value.trim();
    if (value) {
      const subtask = { title: value, done: false };
      window.boardSubtasks.push(subtask);

      const li = document.createElement('li');
      li.innerHTML = `
        <span>${value}</span>
        <button type="button" class="delete-subtask" title="Remove">&times;</button>
      `;
      subtaskList.appendChild(li);
      subtaskInput.value = '';

      li.querySelector('.delete-subtask').onclick = function() {
        li.remove();
        window.boardSubtasks = window.boardSubtasks.filter(st => st.title !== value);
      }
    }
  }

  // --- Save Task (mit Validierung & Custom Modal) ---
  document.querySelector('.create_task_btn').addEventListener('click', function() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const dueDate = document.getElementById('task-due-date').value.trim();
    const category = document.getElementById('category').value;
    const assignedSelect = document.getElementById('assigned');
    const assignedTo = Array.from(assignedSelect.selectedOptions).map(opt => opt.value);

    // Priority prüfen (muss gewählt sein!)
    let priority = null;
    const activePriorityBtn = document.querySelector('.priority-buttons .btn.active');
    if (activePriorityBtn) priority = activePriorityBtn.dataset.value;

    // Pflichtfelder prüfen
    if (!title || !dueDate || !category) {
      showCustomWarning("Bitte alle Pflichtfelder ausfüllen!");
      return;
    }
    // Datum prüfen
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      showCustomWarning("Bitte ein gültiges Datum im Format JJJJ-MM-TT wählen.");
      return;
    }
    // Prio prüfen
    if (!priority) {
      showCustomWarning("Bitte eine Priorität auswählen!");
      return;
    }

    // Subtasks aufbereiten
    let cleanSubtasks = (window.boardSubtasks || [])
      .filter(st => st && typeof st === "object" && st.title && st.title.trim() !== "")
      .map(st => ({ title: st.title.trim(), done: !!st.done }));

    const taskObj = {
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      category,
      subtasks: cleanSubtasks,
      status: document.getElementById('addTaskOverlay').dataset.status || "todo",
      createdAt: Date.now()
    };

    // Firebase Save
    const newTaskKey = firebase.database().ref().child('tasks').push().key;
    firebase.database().ref('tasks/' + newTaskKey).set({
      ...taskObj,
      id: newTaskKey
    }).then(() => {
      document.getElementById('addTaskOverlay').close();
      clearAddTaskForm();
    }).catch(error => showCustomWarning("Fehler beim Speichern: " + error.message));
  });

  // --- Kategorien zum Dropdown hinzufügen ---
  const categories = ["Technical Task", "User Story", "Bug", "Research"];
  const categorySelect = document.getElementById('category');
  categorySelect.innerHTML = '<option value="">Select task category</option>';
  categories.forEach(cat => {
    categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
  });

  // --- Kontakte & User in assigned laden (Choices.js!) ---
  const assignedSelect = document.getElementById('assigned');
  assignedSelect.innerHTML = '';

  Promise.all([
    fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/users.json").then(r => r.json()),
    fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts.json").then(r => r.json())
  ]).then(([users, contacts]) => {
    // 1. Registrierte User zuerst:
    if (users) {
      const groupUsers = document.createElement('optgroup');
      groupUsers.label = "Registered Users";
      Object.entries(users).forEach(([userId, userData]) => {
        const opt = document.createElement('option');
        opt.value = userId;
        opt.textContent = userData.name || userData.email || userId;
        groupUsers.appendChild(opt);
      });
      assignedSelect.appendChild(groupUsers);
    }

    // 2. Kontakte darunter:
    if (contacts) {
      const groupContacts = document.createElement('optgroup');
      groupContacts.label = "Contacts";
      Object.entries(contacts).forEach(([userId, userData]) => {
        const opt = document.createElement('option');
        opt.value = userId;
        opt.textContent = userData.name;
        groupContacts.appendChild(opt);
      });
      assignedSelect.appendChild(groupContacts);
    }

    // Choices.js neu initialisieren (wenn nötig)
    if (window.Choices && assignedSelect) {
      if (window.assignedChoices) {
        window.assignedChoices.destroy();
      }
      window.assignedChoices = new Choices(assignedSelect, {
        removeItemButton: true,
        searchEnabled: true,
        shouldSort: false,
        placeholder: true,
        placeholderValue: 'Select contacts to assign',
      });
    }
  });

  // --- Custom Warning Modal ---
  window.showCustomWarning = function(msg) {
    const modal = document.getElementById('custom-warning-modal');
    document.getElementById('custom-warning-content').innerText = msg;
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    setTimeout(() => {
      modal.classList.add('modal-hidden');
      modal.classList.remove('modal-visible');
    }, 2500);
  }

});

let currentTaskId = null;

function openTaskOverlay(task) {
  currentTaskId = task.id;
  document.getElementById('task-overlay').classList.remove('hidden');

  document.getElementById('overlay-title').textContent = task.title;
  document.getElementById('overlay-description').textContent = task.description || '';
  document.getElementById('overlay-date').textContent = formatDate(task.dueDate);
  document.getElementById('overlay-category').textContent = task.category;
  document.getElementById('overlay-category').className = 'task-category ' + categoryToClass(task.category);

  document.getElementById('overlay-priority').innerHTML =
    `${capitalize(task.priority)} <img id="overlay-priority-icon" src="../assets/icons/add_task/${task.priority}.png" class="priority-icon">`;

  const assignedBox = document.getElementById('overlay-assigned');
  assignedBox.innerHTML = '';
  task.assignedTo.forEach(id => {
    const user = allUsers[id];
    assignedBox.innerHTML += `
      <div class="assigned-user">
        <div class="avatar" style="background-color:${generateColorFromString(user.name)}">${getInitials(user.name)}</div>
        ${user.name}
      </div>`;
  });

  const subtasksBox = document.getElementById('overlay-subtasks');
  subtasksBox.innerHTML = '';
  if (task.subtasks && task.subtasks.length > 0) {
    task.subtasks.forEach(st => {
      subtasksBox.innerHTML += `
        <div class="subtask-item">
          <input type="checkbox" ${st.done ? 'checked' : ''} disabled>
          <label>${st.title}</label>
        </div>`;
    });
  } else {
    subtasksBox.innerHTML = '<i>No subtasks.</i>';
  }
}

function closeTaskOverlay() {
  document.getElementById('task-overlay').classList.add('hidden');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function categoryToClass(cat) {
  const c = (cat || '').toLowerCase();
  if (c === 'bug') return 'bug';
  if (c === 'user story') return 'user-story';
  if (c === 'technical task') return 'technical';
  if (c === 'research') return 'research';
  return '';
}

function getInitials(name) {
  return name.split(' ').map(p => p[0]?.toUpperCase()).join('').substring(0, 2);
}

function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
