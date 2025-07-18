// ---- Summary-Auswertung ----
firebase.database().ref('tasks').once('value').then(snapshot => {
  const tasksObj = snapshot.val() || {};
  const tasks = Object.values(tasksObj);

  let todo = 0, done = 0, inProgress = 0, feedback = 0, urgent = 0, all = 0;
  let nextDeadline = null;

  tasks.forEach(task => {
    all++;
    const status = (task.status || "").toLowerCase();
    if (status === "todo") todo++;
    else if (status === "done") done++;
    else if (status === "inprogress") inProgress++;
    else if (status === "awaitingfeedback") feedback++;

    if (task.priority === "urgent") urgent++;

    // Nächstes Fälligkeitsdatum finden
    if (task.dueDate) {
      // Standard: dd/mm/yyyy oder yyyy-mm-dd?
      let dueDateObj;
      if (task.dueDate.includes("/")) {
        // dd/mm/yyyy
        const [day, month, year] = task.dueDate.split("/");
        dueDateObj = new Date(`${year}-${month}-${day}`);
      } else {
        // yyyy-mm-dd
        dueDateObj = new Date(task.dueDate);
      }
      if (!nextDeadline || dueDateObj < nextDeadline) {
        nextDeadline = dueDateObj;
      }
    }
  });

  // In die Summary eintragen
  document.getElementById('summary-todo').textContent = todo;
  document.getElementById('summary-done').textContent = done;
  document.getElementById('summary-inprogress').textContent = inProgress;
  document.getElementById('summary-feedback').textContent = feedback;
  document.getElementById('summary-urgent').textContent = urgent;
  document.getElementById('summary-all').textContent = all;

  // Nächste Deadline
  document.getElementById('summary-next-deadline').textContent = nextDeadline
    ? nextDeadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';
});

// ---- Optional: Username setzen (hier evtl. aus Firebase User/Session holen) ----
document.getElementById('summary-username').textContent = "Sofia Müller";