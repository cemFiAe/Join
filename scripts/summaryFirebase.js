// ---------- Hilfsfunktion für robustes Datum-Parsing ----------
function parseTaskDate(dateStr) {
  if (!dateStr) return null;

  // ISO: yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  // Deutsch: dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    // JS: yyyy-mm-dd
    return new Date(`${year}-${month}-${day}`);
  }
  // Fallback: nativer Date-Parser
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return null;
}

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

    // ----- Nächstes Fälligkeitsdatum finden -----
    if (task.dueDate) {
      const dueDateObj = parseTaskDate(task.dueDate);
      if (dueDateObj) {
        if (!nextDeadline || dueDateObj < nextDeadline) {
          nextDeadline = dueDateObj;
        }
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
  ? nextDeadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
  : '-';
});

// ---- Optional: Username setzen (hier evtl. aus Firebase User/Session holen) ----
document.getElementById('summary-username').textContent = "Sofia Müller";

// -------- Username und Greeting --------
document.addEventListener('DOMContentLoaded', function() {
    // Tageszeit-basiertes Greeting
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 5) return "Good night,";
        if (hour < 12) return "Good morning,";
        if (hour < 18) return "Good afternoon,";
        return "Good evening,";
    }

    // Namen aus localStorage holen (wie beim Avatar)
    let name = localStorage.getItem("currentUserName");
    if (!name) name = "Guest"; // Fallback

    // Nachnamen farbig, wie gehabt
    let html = "";
    let nameParts = name.split(" ");
    if (nameParts.length > 1) {
        html = nameParts[0] + ' <span style="color:#29ABE2;font-weight:800;">' + nameParts.slice(1).join(" ") + '</span>';
    } else {
        html = '<span style="color:#29ABE2;font-weight:800;">' + name + '</span>';
    }

    // Begrüßung anzeigen
    document.getElementById("greeting-message").innerText = getGreeting();
    document.getElementById("summary-username").innerHTML = html;
});
