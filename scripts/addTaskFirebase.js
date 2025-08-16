document.addEventListener('DOMContentLoaded', function() {

  // Kategorien zum Dropdown hinzufügen
  const categories = ["Technical Task", "User Story", "Bug", "Research"];
  const categorySelect = document.getElementById('category');
  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">Select task category</option>';
    categories.forEach(cat => {
      categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }

  // Assigned-User-Dropdown mit Avataren + Badges
  const assignedDropdown = document.getElementById('assignedDropdown');
  const assignedBadges = document.getElementById('assignedBadges');
  let assignedUsers = {}; // userId → { name, initials, selected }
  let currentUserEmail = (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase();

  function getInitials(name) {
    return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
  }

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
  });

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

// Schließt NICHT – bleibt offen
option.addEventListener('pointerdown', (ev) => {
  ev.preventDefault();            // verhindert Fokuswechsel
  ev.stopPropagation();           // blockt Outside-Handler
  assignedUsers[id].selected = !assignedUsers[id].selected;
  renderAssignedDropdown();       // UI aktualisieren
  renderAssignedBadges();         // Badges aktualisieren
  // WICHTIG: NICHT schließen
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

  function generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  // Priority-Button-Logik (nur einer aktiv + Medium-Icon-Wechsel)
  const priorityBtns = document.querySelectorAll('.priority-buttons .btn');
  priorityBtns.forEach(btn => btn.classList.remove('active'));
  priorityBtns.forEach(btn => {
    if (btn.classList.contains('btn_medium')) {
      const def = btn.querySelector('.icon.default');
      const sel = btn.querySelector('.icon.white');
      if (def && sel) {
        def.style.display = '';
        sel.style.display = 'none';
      }
    }
    btn.addEventListener('click', function () {
      priorityBtns.forEach(b => {
        b.classList.remove('active');
        if (b.classList.contains('btn_medium')) {
          const def = b.querySelector('.icon.default');
          const sel = b.querySelector('.icon.white');
          if (def && sel) {
            def.style.display = '';
            sel.style.display = 'none';
          }
        }
      });
      this.classList.add('active');
      if (this.classList.contains('btn_medium')) {
        const def = this.querySelector('.icon.default');
        const sel = this.querySelector('.icon.white');
        if (def && sel) {
          def.style.display = 'none';
          sel.style.display = '';
        }
      }
    });
  });

  // Subtask-Logik
  let subtasks = [];
  const subtaskInput = document.querySelector('.input-icon-subtask input');
  const subtaskAddBtn = document.querySelector('.add-subtask');
  const subtaskClearBtn = document.querySelector('.clear-subtask-input');
  const subtaskList = document.getElementById('subtask-list');

  if (subtaskInput && subtaskAddBtn) {
    subtaskInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSubtask();
      }
    });
    subtaskAddBtn.addEventListener('click', addSubtask);
  }

  function addSubtask() {
    if (!subtaskInput || !subtaskList) return;
    const value = subtaskInput.value.trim();
    if (value) {
      const subtaskObj = { title: value, done: false };
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
        li.querySelector('.subtask-actions').style.display = 'inline-block';
      });
      li.addEventListener('mouseleave', () => {
        li.querySelector('.subtask-actions').style.display = 'none';
      });

      li.querySelector('.subtask-edit-btn').addEventListener('click', function() {
        editSubtask(li, subtaskObj);
      });
      li.querySelector('.subtask-delete-btn').addEventListener('click', function() {
        subtaskList.removeChild(li);
        subtasks.splice([...subtaskList.children].indexOf(li), 1);
      });
    }
  }

  // **Fix: Edit Subtask mit DOM-Prüfung und Blur-Fehler-Fix**
  function editSubtask(li, subtaskObj) {
    const span = li.querySelector('.subtask-title');
    const actions = li.querySelector('.subtask-actions');
    const oldValue = span.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldValue;
    input.style.width = '70%';
    span.replaceWith(input);

    let replaced = false;

    input.addEventListener('keydown', function(e) {
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
      actions.style.display = 'none';
    }
    function cancel() {
      if (replaced) return;
      replaced = true;
      const newSpan = document.createElement('span');
      newSpan.className = 'subtask-title';
      newSpan.textContent = oldValue;
      if (input.parentNode) input.replaceWith(newSpan);
      actions.style.display = 'none';
    }
    input.focus();
  }

  // Clear Subtasks Input
  if (subtaskClearBtn && subtaskInput) {
    subtaskClearBtn.addEventListener('click', function() {
      subtaskInput.value = '';
      subtaskClearBtn.style.display = 'none';
    });
  }

  const createBtn = document.querySelector('.create_task_btn');
  if (createBtn) {
    createBtn.addEventListener('click', function (e) {
      e.preventDefault();

      const title = document.getElementById('title')?.value.trim();
      const description = document.getElementById('description')?.value.trim();
      const dueDate = document.getElementById('due')?.value.trim();
      const category = document.getElementById('category')?.value;

      const assignedTo = Object.entries(assignedUsers)
        .filter(([_, u]) => u.selected)
        .map(([id]) => id);

      let priority = null;
      const activePriorityBtn = document.querySelector('.priority-buttons .btn.active');
      if (activePriorityBtn) {
        priority = activePriorityBtn.textContent.trim().split(" ")[0].toLowerCase();
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
        // Merker setzen, damit auf dem Board der Toast angezeigt wird
        localStorage.setItem('showBoardToast', '1');
        // Redirect zum Board
        window.location.href = '../pages/board.html';
      }).catch((error) => {
        alert("Fehler beim Speichern: " + error.message);
      });
    });
  }

  function clearForm() {
    if (document.getElementById('title')) document.getElementById('title').value = '';
    if (document.getElementById('description')) document.getElementById('description').value = '';
    if (document.getElementById('due')) document.getElementById('due').value = '';
    if (document.getElementById('category')) document.getElementById('category').selectedIndex = 0;

    Object.values(assignedUsers).forEach(user => user.selected = false);
    renderAssignedDropdown();
    renderAssignedBadges();

    priorityBtns.forEach((b) => {
      b.classList.remove('active');
      if (b.classList.contains('btn_medium')) {
        const def = b.querySelector('.icon.default');
        const sel = b.querySelector('.icon.white');
        if (def && sel) {
          def.style.display = '';
          sel.style.display = 'none';
        }
      }
    });
    subtasks = [];
    if (subtaskList) subtaskList.innerHTML = '';
  }

  const clearBtn = document.querySelector('.clear_button');
  if (clearBtn) {
    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      clearForm();
    });
  }

  // Dropdown öffnen/schließen
  const assignedSelectBox = document.getElementById('assignedSelectBox');
  const dropdown = document.getElementById('assignedDropdown');

  if (assignedSelectBox && dropdown) {
    assignedSelectBox.addEventListener('click', () => {
      dropdown.classList.toggle('hidden');
    });
  }

  // Klick außerhalb schließt Dropdown
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.assigned-to-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      if (dropdown) dropdown.classList.add('hidden');
    }
  });
});
