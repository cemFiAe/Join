// addTaskFirebase.js
// @ts-check

const Win = /** @type {any} */ (window);
const firebase = /** @type {any} */ (Win.firebase);

document.addEventListener('DOMContentLoaded', () => { initAddTaskPage(); });

function getRefs() {
  const d = document;
  return {
    Core: Win.AddTask,
    titleEl: /** @type {HTMLInputElement|null} */ (d.getElementById('title')),       descEl:  /** @type {HTMLTextAreaElement|null} */ (d.getElementById('description')),
    dueEl:   /** @type {HTMLInputElement|null} */ (d.getElementById('due')),         catEl:   /** @type {HTMLSelectElement|null} */ (d.getElementById('category')),
    prioWrap:/** @type {HTMLDivElement|null} */ (d.querySelector('.priority-buttons')), dd:    /** @type {HTMLDivElement|null} */ (d.getElementById('assignedDropdown')),
    badges:  /** @type {HTMLDivElement|null} */ (d.getElementById('assignedBadges')), createBtn:/** @type {HTMLButtonElement|null} */ (d.querySelector('.create_task_btn')),
    clearBtn:/** @type {HTMLButtonElement|null} */ (d.querySelector('.clear_button')), selectBox:/** @type {HTMLDivElement|null} */ (d.getElementById('assignedSelectBox')),
    ddBox:   /** @type {HTMLDivElement|null} */ (d.getElementById('assignedDropdown')),
  };
}
function prepareInputs(R) {
  R.Core.ensureValidationStyles();
  R.Core.setDateMinToday(R.dueEl);
  R.Core.fillCategories(R.catEl);
  R.Core.initPriorityButtons(R.prioWrap);
  R.Core.attachSubtaskUI();
}
function setupAssigned(R) {
  R.Core.loadAssignedUsers().then(() => {
    R.Core.renderAssignedDropdown(R.dd);
    R.Core.renderAssignedBadges(R.badges);
  });
}
function setupDropdownToggle(R) {
  if (!R.selectBox || !R.ddBox) return;
  R.selectBox.addEventListener('click', () => R.ddBox.classList.toggle('hidden'));
  document.addEventListener('click', (e) => {
    const wrap = /** @type {HTMLDivElement|null} */ (document.querySelector('.assigned-to-wrapper'));
    const tgt = e.target; if (wrap && tgt instanceof Node && !wrap.contains(tgt)) R.ddBox.classList.add('hidden');
  });
}
function createTaskPayload(R) {
  /** @type {'urgent'|'medium'|'low'|''} */ const priority = R.Core.state.priority;
  return {
    title: R.titleEl?.value.trim() ?? '',       description: R.descEl?.value.trim() ?? '',
    dueDate: R.dueEl?.value.trim() ?? '',       priority: priority || null,
    assignedTo: R.Core.getAssignedIds(),        category: R.catEl?.value ?? '',
    subtasks: [...R.Core.state.subtasks],       status: 'todo', createdAt: Date.now(),
  };
}
function setupCreateHandler(R, validate) {
  R.createBtn?.addEventListener('click', (e) => {
    e.preventDefault(); if (!validate()) return;
    const payload = createTaskPayload(R);
    const key = firebase.database().ref().child('tasks').push().key;
    firebase.database().ref('tasks/' + key).set({ ...payload, id: key })
      .then(() => { R.Core.showToast(); setTimeout(() => { window.location.href = '../pages/board.html'; }, 1600); })
      .catch(err => console.error('Fehler beim Speichern:', err));
  });
}
function setupClearHandler(R) {
  R.clearBtn?.addEventListener('click', (e) => { e.preventDefault(); R.Core.clearForm(); });
}
function setExtraMins(R) {
  R.Core.setDateMinToday('#task-due-date');
  R.Core.setDateMinToday('#editDueDate');
}
function initAddTaskPage() {
  const R = getRefs();
  prepareInputs(R);
  setupAssigned(R);
  setupDropdownToggle(R);
  const { validate } = R.Core.installFieldValidation(R.titleEl, R.dueEl, R.catEl, R.prioWrap);
  setupCreateHandler(R, validate);
  setupClearHandler(R);
  setExtraMins(R);
}
