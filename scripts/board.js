document.addEventListener('DOMContentLoaded', function() {
  // ---------- Overlay-Handling ----------

  window.testDialog = function() {
  document.getElementById('addTaskOverlay').showModal();
};


  // Overlay öffnen (Button onclick)
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

  // Felder leeren
  function clearAddTaskForm() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('due').value = '';
    document.getElementById('category').selectedIndex = 0;
    document.getElementById('assigned').selectedIndex = 0;
    document.querySelectorAll('.priority-buttons .btn').forEach((b, i) => b.classList.toggle('active', i === 1));
    document.getElementById('subtask-list').innerHTML = '';
    window.boardSubtasks = [];
  }

  // Priority-Button-Logik (nur einer aktiv)
  document.querySelectorAll('.priority-buttons .btn').forEach((btn, idx, btns) => {
    btn.addEventListener('click', function() {
      btns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Subtask-Logik
  window.boardSubtasks = [];
  const subtaskInput = document.querySelector('.input-icon-subtask input');
  const subtaskAddBtn = document.querySelector('.add-subtask');
  const subtaskList = document.getElementById('subtask-list');
  subtaskAddBtn.addEventListener('click', function() {
    const value = subtaskInput.value.trim();
    if (value) {
      window.boardSubtasks.push({ title: value, done: false });
      const li = document.createElement('li');
      li.textContent = value;
      subtaskList.appendChild(li);
      subtaskInput.value = '';
    }
  });

  // Task speichern (Overlay)
  document.querySelector('.create_task_btn').addEventListener('click', function() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const dueDate = document.getElementById('due').value.trim();
    const category = document.getElementById('category').value;
    const assignedTo = document.getElementById('assigned').value;
    let priority = "medium";
    const activePriorityBtn = document.querySelector('.priority-buttons .btn.active');
    if (activePriorityBtn) priority = activePriorityBtn.textContent.trim().split(" ")[0].toLowerCase();

    const status = document.getElementById('addTaskOverlay').dataset.status || "todo";
    if (!title || !dueDate || !category) {
      alert("Bitte alle Pflichtfelder ausfüllen!");
      return;
    }

    const taskObj = {
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      category,
      subtasks: window.boardSubtasks,
      status,
      createdAt: Date.now()
    };

    const newTaskKey = firebase.database().ref().child('tasks').push().key;
    firebase.database().ref('tasks/' + newTaskKey).set({
      ...taskObj,
      id: newTaskKey
    }).then(() => {
      document.getElementById('addTaskOverlay').close();
      clearAddTaskForm();
    }).catch(error => alert("Fehler beim Speichern: " + error.message));
  });

  // Kategorien & Userliste laden (direkt bei Seite)
  // Categories
  const categories = ["Technical Task", "User Story", "Bug", "Research"];
  const categorySelect = document.getElementById('category');
  categorySelect.innerHTML = '<option value="">Select task category</option>';
  categories.forEach(cat => categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`);

  // Users
  const assignedSelect = document.getElementById('assigned');
  firebase.database().ref('users').once('value').then(snapshot => {
    const users = snapshot.val();
    assignedSelect.innerHTML = '<option value="">Select contacts to assign</option>';
    for (const userId in users) {
      assignedSelect.innerHTML += `<option value="${userId}">${users[userId].name}</option>`;
    }
  });

});
