// addTaskFirebase.js
// @ts-check

/** Casting auf Window, damit TS die globalen Objekte akzeptiert. */
const Win = /** @type {any} */ (window);
/** Firebase kommt über das CDN. */
const firebase = /** @type {any} */ (Win.firebase);

/**
 * Struktur aller DOM-Referenzen, die wir auf der Add-Task-Seite brauchen.
 * @typedef {Object} AddTaskRefs
 * @property {any} Core                         - Globale AddTask-API (aus addTaskCore.js / addTask.js)
 * @property {HTMLInputElement|null} titleEl    - Titel‐Input
 * @property {HTMLTextAreaElement|null} descEl  - Beschreibung‐Textarea
 * @property {HTMLInputElement|null} dueEl      - Fälligkeitsdatum
 * @property {HTMLSelectElement|null} catEl     - Kategorie‐Select
 * @property {HTMLDivElement|null} prioWrap     - Wrapper für Priority-Buttons
 * @property {HTMLDivElement|null} dd           - Assigned-Dropdown (Liste)
 * @property {HTMLDivElement|null} badges       - Badge-Leiste für ausgewählte Kontakte
 * @property {HTMLButtonElement|null} createBtn - „Create Task“-Button
 * @property {HTMLButtonElement|null} clearBtn  - „Clear“-Button
 * @property {HTMLDivElement|null} selectBox    - Klickfläche, die das Dropdown öffnet
 * @property {HTMLDivElement|null} ddBox        - Container des Dropdowns (zum Show/Hide)
 */

document.addEventListener('DOMContentLoaded', () => { initAddTaskPage(); });

/**
 * Sammelt alle DOM-Referenzen der Seite an einer Stelle.
 * @returns {AddTaskRefs}
 */
function getRefs() {
  const d = document;
  return {
    Core: Win.AddTask,
    titleEl: /** @type {HTMLInputElement|null} */ (d.getElementById('title')),
    descEl:  /** @type {HTMLTextAreaElement|null} */ (d.getElementById('description')),
    dueEl:   /** @type {HTMLInputElement|null} */ (d.getElementById('due')),
    catEl:   /** @type {HTMLSelectElement|null} */ (d.getElementById('category')),
    prioWrap:/** @type {HTMLDivElement|null} */ (d.querySelector('.priority-buttons')),
    dd:      /** @type {HTMLDivElement|null} */ (d.getElementById('assignedDropdown')),
    badges:  /** @type {HTMLDivElement|null} */ (d.getElementById('assignedBadges')),
    createBtn:/** @type {HTMLButtonElement|null} */ (d.querySelector('.create_task_btn')),
    clearBtn: /** @type {HTMLButtonElement|null} */ (d.querySelector('.clear_button')),
    selectBox:/** @type {HTMLDivElement|null} */ (d.getElementById('assignedSelectBox')),
    ddBox:   /** @type {HTMLDivElement|null} */ (d.getElementById('assignedDropdown')),
  };
}

/**
 * Bereitet Eingabefelder und UI-Komponenten vor
 * (Styles, Min-Datum, Kategorien, Priority-Buttons, Subtask-UI).
 * @param {AddTaskRefs} R
 * @returns {void}
 */
function prepareInputs(R) {
  R.Core.ensureValidationStyles();
  R.Core.setDateMinToday(R.dueEl);
  R.Core.fillCategories(R.catEl);
  R.Core.initPriorityButtons(R.prioWrap);
  R.Core.attachSubtaskUI();
}

/**
 * Lädt Benutzer/Kontakte und rendert das Assigned-Dropdown samt Badges.
 * @param {AddTaskRefs} R
 * @returns {void}
 */
function setupAssigned(R) {
  R.Core.loadAssignedUsers().then(() => {
    R.Core.renderAssignedDropdown(R.dd);
    R.Core.renderAssignedBadges(R.badges);
  });
}

/**
 * Verdrahtet das Öffnen/Schließen des Assigned-Dropdowns
 * inkl. Outside-Click-Handling.
 * @param {AddTaskRefs} R
 * @returns {void}
 */
function setupDropdownToggle(R) {
  if (!R.selectBox || !R.ddBox) return;
  R.selectBox.addEventListener('click', () => R.ddBox.classList.toggle('hidden'));
  document.addEventListener('click', (e) => {
    const wrap = /** @type {HTMLDivElement|null} */ (document.querySelector('.assigned-to-wrapper'));
    const tgt = e.target;
    if (wrap && tgt instanceof Node && !wrap.contains(tgt)) R.ddBox.classList.add('hidden');
  });
}

/**
 * Baut das Task-Payload aus den aktuellen Formwerten.
 * @param {AddTaskRefs} R
 * @returns {Record<string, any>} Firebase-fertiges Objekt.
 */
function createTaskPayload(R) {
  /** @type {'urgent'|'medium'|'low'|''} */
  const priority = R.Core.state.priority;
  return {
    title: R.titleEl?.value.trim() ?? '',
    description: R.descEl?.value.trim() ?? '',
    dueDate: R.dueEl?.value.trim() ?? '',
    priority: priority || null,
    assignedTo: R.Core.getAssignedIds(),
    category: R.catEl?.value ?? '',
    subtasks: [...R.Core.state.subtasks],
    status: 'todo',
    createdAt: Date.now(),
  };
}

/**
 * Verdrahtet den „Create Task“-Button:
 * validiert, schreibt in Firebase und zeigt Toast/Redirect.
 * @param {AddTaskRefs} R
 * @param {() => boolean} validate
 * @returns {void}
 */
function setupCreateHandler(R, validate) {
  R.createBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = createTaskPayload(R);
    const key = firebase.database().ref().child('tasks').push().key;
    firebase.database().ref('tasks/' + key).set({ ...payload, id: key })
      .then(() => {
        R.Core.showToast();
        setTimeout(() => { window.location.href = '../pages/board.html'; }, 1600);
      })
      .catch(err => console.error('Fehler beim Speichern:', err));
  });
}

/**
 * Verdrahtet den „Clear“-Button zum kompletten Formular-Reset.
 * @param {AddTaskRefs} R
 * @returns {void}
 */
function setupClearHandler(R) {
  R.clearBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    R.Core.clearForm();
  });
}

/**
 * Setzt Min-Datum zusätzlich auf mögliche externe Date-Inputs,
 * die außerhalb der Add-Seite existieren können.
 * @param {AddTaskRefs} R
 * @returns {void}
 */
function setExtraMins(R) {
  R.Core.setDateMinToday('#task-due-date');
  R.Core.setDateMinToday('#editDueDate');
}

/**
 * Einstiegspunkt für die Add-Task-Seite:
 * holt Refs, bereitet UI vor, lädt Assigned, bindet Handler und Validation.
 * @returns {void}
 */
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
