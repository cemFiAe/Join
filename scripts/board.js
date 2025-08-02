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

    // reset Assigned Choices.js tags
    if (window.assignedChoices) {
      window.assignedChoices.removeActiveItems();
    }

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

  // --- Save Task ---
  document.querySelector('.create_task_btn').addEventListener('click', () => {
    const title       = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const dueDate     = document.getElementById('task-due-date').value.trim();
    const category    = document.getElementById('category').value;
    const assignedTo  = Array.from(
      document.getElementById('assigned').selectedOptions
    ).map(opt => opt.value);

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
      })
      .catch(err => showCustomWarning("Fehler: " + err.message));
  });

  // --- Load Categories ---
  const categories = ["Technical Task", "User Story", "Bug", "Research"];
  const catSelect  = document.getElementById('category');
  catSelect.innerHTML = '<option value="">Select task category</option>';
  categories.forEach(c => {
    const o = document.createElement('option');
    o.value       = c;
    o.textContent = c;
    catSelect.appendChild(o);
  });

  // --- Init Assigned Dropdown with Choices.js ---
  initAssignedDropdown();

  // --- Custom Warning ---
  window.showCustomWarning = msg => {
    const modal = document.getElementById('custom-warning-modal');
    modal.querySelector('#custom-warning-content').innerText = msg;
    modal.classList.replace('modal-hidden', 'modal-visible');
    setTimeout(() => {
      modal.classList.replace('modal-visible', 'modal-hidden');
    }, 2500);
  };
});

/**
 * Initialisiert das Assigned‑Dropdown mit Choices.js
 * und zeigt die Profil‑Badges. 
 * Nutzer/Contacts werden aus den globalen Variablen (users, contacts) genutzt,
 * die von boardFirebase.js bereitgestellt werden.
 */
function initAssignedDropdown() {
  const select = document.getElementById('assigned');
  if (!select || typeof Choices === 'undefined') return;

  select.innerHTML = '';

  if (window.allUsers) {
    const groupUsers = document.createElement('optgroup');
    groupUsers.label = 'Registered Users';
    Object.entries(window.allUsers).forEach(([id, u]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = u.name || u.email || id;
      groupUsers.appendChild(opt);
    });
    select.appendChild(groupUsers);
  }
  if (window.allContacts) {
    const groupContacts = document.createElement('optgroup');
    groupContacts.label = 'Contacts';
    Object.entries(window.allContacts).forEach(([id, c]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = c.name;
      groupContacts.appendChild(opt);
    });
    select.appendChild(groupContacts);
  }

  if (window.assignedChoices) window.assignedChoices.destroy();

  window.assignedChoices = new Choices(select, {
    removeItemButton: true,
    searchEnabled: true,
    shouldSort: false,
    placeholderValue: 'Select contacts to assign',
    callbackOnCreateTemplates: function(template) {
      return {
        item: (classNames, data) => template(`
          <div class="${classNames.item} ${data.highlighted ? classNames.highlightedState : ''}"
               data-item data-id="${data.id}" data-value="${data.value}"
               ${data.active ? 'aria-selected="true"' : ''}
               ${data.disabled ? 'aria-disabled="true"' : ''}>
            ${getProfileBadge(data.value)}
          </div>
        `),
        choice: (classNames, data) => template(`
          <div class="${classNames.item} ${classNames.itemChoice} ${data.disabled ? classNames.itemDisabled : classNames.itemSelectable}"
               data-select-text="${this.config.itemSelectText}"
               data-choice data-id="${data.id}" data-value="${data.value}">
            ${getProfileBadge(data.value)}
          </div>
        `)
      };
    }
  });  
}
