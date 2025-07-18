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

// Priority-Button-Logik (nur einer aktiv)
document.querySelectorAll('.priority-buttons .btn').forEach((btn, idx, btns) => {
  btn.addEventListener('click', function() {
    btns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

// Subtask-Logik: IMMER als Objekt speichern!
let subtasks = [];
const subtaskInput = document.querySelector('.input-icon-subtask input');
const subtaskAddBtn = document.querySelector('.add-subtask');
const subtaskList = document.getElementById('subtask-list'); // Verwende ein vorhandenes <ul id="subtask-list"></ul>

subtaskAddBtn.addEventListener('click', function() {
  const value = subtaskInput.value.trim();
  if (value) {
    // Immer als Objekt speichern!
    const subtaskObj = { title: value, done: false };
    subtasks.push(subtaskObj);

    // Visuell anzeigen
    const li = document.createElement('li');
    li.textContent = value;
    subtaskList.appendChild(li);
    subtaskInput.value = '';
  }
});

// Task speichern (Create Task Button)
document.querySelector('.create_task_btn').addEventListener('click', function(e) {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const dueDate = document.getElementById('due').value.trim();
  const category = document.getElementById('category').value;
  const assignedTo = document.getElementById('assigned').value;

  // Priority auslesen
  let priority = "medium";
  const activePriorityBtn = document.querySelector('.priority-buttons .btn.active');
  if (activePriorityBtn) {
    priority = activePriorityBtn.textContent.trim().split(" ")[0].toLowerCase();
  }

  // Validation
  if (!title || !dueDate || !category) {
    alert("Bitte alle Pflichtfelder ausfüllen!");
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
    subtasks: [...subtasks], // Wichtig: Immer als Array von Objekten
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

// Formular zurücksetzen
function clearForm() {
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('due').value = '';
  document.getElementById('category').selectedIndex = 0;
  document.getElementById('assigned').selectedIndex = 0;
  document.querySelectorAll('.priority-buttons .btn').forEach((b, i) => b.classList.toggle('active', i === 1));
  subtasks = [];
  subtaskList.innerHTML = '';
}
