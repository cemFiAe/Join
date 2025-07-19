// Kategorien zum Dropdown hinzufügen
const categories = ["Technical Task", "User Story", "Bug", "Research"];
const categorySelect = document.getElementById('category');
categorySelect.innerHTML = '<option value="">Select task category</option>';
categories.forEach(cat => {
  categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
});

// Kontakte aus Firebase laden
const assignedSelect = document.getElementById('assigned');
firebase.database().ref('users').once('value').then(snapshot => {
  const users = snapshot.val();
  assignedSelect.innerHTML = '<option value="">Select contacts to assign</option>';
  for (const userId in users) {
    const user = users[userId];
    assignedSelect.innerHTML += `<option value="${userId}">${user.name}</option>`;
  }
});

// Priority-Button-Logik (nur einer aktiv + Medium-Icon-Wechsel)
const priorityBtns = document.querySelectorAll('.priority-buttons .btn');
// Initial keine aktiv!
priorityBtns.forEach(btn => btn.classList.remove('active'));
priorityBtns.forEach(btn => {
  // Medium-Icon zurücksetzen
  if (btn.classList.contains('btn_medium')) {
    const def = btn.querySelector('.icon.default');
    const sel = btn.querySelector('.icon.selected');
    if (def && sel) {
      def.style.display = '';
      sel.style.display = 'none';
    }
  }
  btn.addEventListener('click', function () {
    priorityBtns.forEach(b => {
      b.classList.remove('active');
      // Medium-Button Icons zurücksetzen
      if (b.classList.contains('btn_medium')) {
        const def = b.querySelector('.icon.default');
        const sel = b.querySelector('.icon.selected');
        if (def && sel) {
          def.style.display = '';
          sel.style.display = 'none';
        }
      }
    });
    this.classList.add('active');
    // Medium: Icon wechseln
    if (this.classList.contains('btn_medium')) {
      const def = this.querySelector('.icon.default');
      const sel = this.querySelector('.icon.selected');
      if (def && sel) {
        def.style.display = 'none';
        sel.style.display = '';
      }
    }
  });
});

// Subtask-Logik: IMMER als Objekt speichern!
let subtasks = [];
const subtaskInput = document.querySelector('.input-icon-subtask input');
const subtaskAddBtn = document.querySelector('.add-subtask');
const subtaskClearBtn = document.querySelector('.clear-subtask-input');
const subtaskList = document.getElementById('subtask-list');

// "X"-Button ein-/ausblenden
subtaskInput.addEventListener('input', () => {
  subtaskClearBtn.style.display = subtaskInput.value.trim() ? 'inline-block' : 'none';
});

// ENTER fügt Subtask hinzu
subtaskInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addSubtask();
  }
});

// Klick auf das + (Häkchen)
subtaskAddBtn.addEventListener('click', addSubtask);

function addSubtask() {
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
    subtaskClearBtn.style.display = 'none';

    // Hover-Effekte für die Actions
    li.addEventListener('mouseenter', () => {
      li.querySelector('.subtask-actions').style.display = 'inline-block';
    });
    li.addEventListener('mouseleave', () => {
      li.querySelector('.subtask-actions').style.display = 'none';
    });

    // Bearbeiten
    li.querySelector('.subtask-edit-btn').addEventListener('click', function() {
      editSubtask(li, subtaskObj);
    });
    // Löschen
    li.querySelector('.subtask-delete-btn').addEventListener('click', function() {
      subtaskList.removeChild(li);
      subtasks.splice([...subtaskList.children].indexOf(li), 1);
    });
  }
}

// Klick auf das "X"
subtaskClearBtn.addEventListener('click', function() {
  subtaskInput.value = '';
  subtaskClearBtn.style.display = 'none';
});

subtaskInput.addEventListener('keydown', function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    subtaskAddBtn.click();
  }
});


// Task speichern (Create Task Button)
document.querySelector('.create_task_btn').addEventListener('click', function (e) {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const dueDate = document.getElementById('due').value.trim();
  const category = document.getElementById('category').value;
  const assignedTo = document.getElementById('assigned').value;

  // Priority auslesen: KEINE Vorauswahl, erst wenn gewählt
  let priority = null;
  const activePriorityBtn = document.querySelector('.priority-buttons .btn.active');
  if (activePriorityBtn) {
    priority = activePriorityBtn.textContent.trim().split(" ")[0].toLowerCase();
  }

  // Validation
  if (!title || !dueDate || !category || !priority) {
    alert("Bitte alle Pflichtfelder ausfüllen und eine Priorität wählen!");
    return;
  }

  // Taskobjekt
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
    alert("Task erfolgreich erstellt!");
    clearForm();
  }).catch((error) => {
    alert("Fehler beim Speichern: " + error.message);
  });
});

// Formular zurücksetzen ("Clear x" Button)
function clearForm() {
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('due').value = '';
  document.getElementById('category').selectedIndex = 0;
  document.getElementById('assigned').selectedIndex = 0;
  // Keine Priority vorauswählen
  priorityBtns.forEach((b) => {
    b.classList.remove('active');
    // Medium Icon zurücksetzen
    if (b.classList.contains('btn_medium')) {
      const def = b.querySelector('.icon.default');
      const sel = b.querySelector('.icon.selected');
      if (def && sel) {
        def.style.display = '';
        sel.style.display = 'none';
      }
    }
  });
  subtasks = [];
  subtaskList.innerHTML = '';
}

document.querySelector('.clear_button').addEventListener('click', function (e) {
  e.preventDefault();
  clearForm();
});

function editSubtask(li, subtaskObj) {
  const span = li.querySelector('.subtask-title');
  const actions = li.querySelector('.subtask-actions');
  const oldValue = span.textContent;

  // Input-Feld einfügen
  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldValue;
  input.style.width = '70%';
  span.replaceWith(input);

  // Speichern bei ENTER oder Blur
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', save);

  function save() {
    subtaskObj.title = input.value.trim() || oldValue;
    const newSpan = document.createElement('span');
    newSpan.className = 'subtask-title';
    newSpan.textContent = subtaskObj.title;
    input.replaceWith(newSpan);
    actions.style.display = 'none';
  }
  function cancel() {
    const newSpan = document.createElement('span');
    newSpan.className = 'subtask-title';
    newSpan.textContent = oldValue;
    input.replaceWith(newSpan);
    actions.style.display = 'none';
  }

  input.focus();
}
