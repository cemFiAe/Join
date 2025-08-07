document.addEventListener('DOMContentLoaded', function() {
  // <<< BOARD-TOAST-FUNKTION >>>
  function showBoardToast() {
    const toast = document.getElementById('taskToast');
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

  // --- Add Task Overlay ---
  window.openAddTaskDialog = function(status = "todo") {
    clearAddTaskForm();
    const dialog = document.getElementById('addTaskOverlay');
    dialog.dataset.status = status;
    dialog.showModal();
  };

  // Close overlay via X or Cancel
  const dialog = document.getElementById('addTaskOverlay');
  document.querySelector('.close-add-task-overlay').onclick =
    document.querySelector('.clear_button').onclick = function() {
      dialog.close();
      clearAddTaskForm();
    };

  // Reset all form fields
  function clearAddTaskForm() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('task-due-date').value = '';
    document.getElementById('category').selectedIndex = 0;

    // Assigned User Reset
    Object.values(assignedUsers).forEach(user => user.selected = false);
    renderAssignedDropdown();
    renderAssignedBadges();

    // reset priority buttons
    document.querySelectorAll('.priority-buttons .btn').forEach(btn =>
      btn.classList.remove('active')
    );

    // reset subtasks
    window.boardSubtasks = [];
    document.getElementById('subtask-list').innerHTML = '';
    document.querySelector('.input-icon-subtask input').value = '';
  }

  // --- Priority Button Handling ---
  document.querySelectorAll('.priority-buttons .btn').forEach((btn, _, all) => {
    btn.addEventListener('click', function() {
      all.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // --- Subtask Logic ---
  window.boardSubtasks = [];
  const subtaskInput  = document.querySelector('.input-icon-subtask input');
  const subtaskAddBtn = document.querySelector('.add-subtask');
  const subtaskList   = document.getElementById('subtask-list');

  function addSubtaskToList() {
    const value = subtaskInput.value.trim();
    if (!value) return;
    const subtask = { title: value, done: false };
    window.boardSubtasks.push(subtask);

    const li = document.createElement('li');
    li.className = 'subtask-item';
    li.innerHTML = `
      <span>${value}</span>
      <button type="button" class="delete-subtask" title="Remove">&times;</button>
    `;
    subtaskList.appendChild(li);
    subtaskInput.value = '';

    li.querySelector('.delete-subtask').onclick = () => {
      const idx = window.boardSubtasks.findIndex(st => st.title === value);
      if (idx > -1) window.boardSubtasks.splice(idx, 1);
      li.remove();
    };
  }

  subtaskAddBtn.addEventListener('click', addSubtaskToList);
  subtaskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtaskToList();
    }
  });

  // --- Categories (wie Add Task) ---
  const categories = ["Technical Task", "User Story", "Bug", "Research"];
  const catSelect  = document.getElementById('category');
  catSelect.innerHTML = '<option value="">Select task category</option>';
  categories.forEach(c => {
    const o = document.createElement('option');
    o.value       = c;
    o.textContent = c;
    catSelect.appendChild(o);
  });

  // --- Custom Warning ---
  window.showCustomWarning = msg => {
    const modal = document.getElementById('custom-warning-modal');
    modal.querySelector('#custom-warning-content').innerText = msg;
    modal.classList.replace('modal-hidden', 'modal-visible');
    setTimeout(() => {
      modal.classList.replace('modal-visible', 'modal-hidden');
    }, 2500);
  };

  // --- Assigned User Dropdown wie Add Task (custom) ---
  const assignedDropdown = document.getElementById('assignedDropdown');
  const assignedBadges = document.getElementById('assignedBadges');
  const assignedSelectBox = document.getElementById('assignedSelectBox');
  let assignedUsers = {}; // userId → { name, initials, selected }
  let currentUserEmail = (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();

  function getInitials(name) {
    return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
  }

  // Lade Users + Contacts
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

      const avatar = document.createElement('div');
      avatar.className = 'custom-option-avatar';
      avatar.style.backgroundColor = generateColorFromString(user.name);
      avatar.textContent = user.initials;

      const label = document.createElement('div');
      label.className = 'custom-option-label';
      label.textContent = user.name + (
        user.email && user.email.trim().toLowerCase() === currentUserEmail
          ? ' (You)'
          : ''
      );

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
    if (!assignedBadges) return;
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

  // Dropdown öffnen/schließen
  if (assignedSelectBox && assignedDropdown) {
    assignedSelectBox.addEventListener('click', () => {
      assignedDropdown.classList.toggle('hidden');
    });
  }
  // Klick außerhalb schließt Dropdown
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.assigned-to-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      if (assignedDropdown) assignedDropdown.classList.add('hidden');
    }
  });

  // --- Save Task ---
  document.querySelector('.create_task_btn').addEventListener('click', () => {
    const title       = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const dueDate     = document.getElementById('task-due-date').value.trim();
    const category    = document.getElementById('category').value;

    // NEU: Assigned User aus Custom-Dropdown
    const assignedTo = Object.entries(assignedUsers)
      .filter(([_, u]) => u.selected)
      .map(([id]) => id);

    const activeBtn = document.querySelector('.priority-buttons .btn.active');
    const priority  = activeBtn ? activeBtn.dataset.priority : null;

    // validation
    if (!title || !dueDate || !category) {
      showCustomWarning("Bitte alle Pflichtfelder ausfüllen!");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      showCustomWarning("Datum im Format JJJJ‑MM‑TT wählen.");
      return;
    }
    if (!priority) {
      showCustomWarning("Bitte eine Priorität auswählen!");
      return;
    }

    const cleanSubtasks = window.boardSubtasks
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
      status: document.getElementById('addTaskOverlay').dataset.status,
      createdAt: Date.now()
    };

    const newKey = firebase.database().ref().child('tasks').push().key;
    firebase.database().ref('tasks/' + newKey).set({ ...taskObj, id: newKey })
      .then(() => {
        dialog.close();
        clearAddTaskForm();
        // Optional: Toast anzeigen
        showBoardToast();
      })
      .catch(err => showCustomWarning("Fehler: " + err.message));
  });

});
