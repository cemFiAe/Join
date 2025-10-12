/** Casting window for TS to accept globals */
const Win = /** @type {any} */ (window);
/** Firebase from CDN */
const firebase = /** @type {any} */ (Win.firebase);

/**
 * Structure of all DOM references needed on Add-Task page.
 * @typedef {Object} AddTaskRefs
 * @property {any} Core                      
 * @property {HTMLInputElement|null} titleEl
 * @property {HTMLTextAreaElement|null} descEl
 * @property {HTMLInputElement|null} dueEl
 * @property {HTMLSelectElement|null} catEl
 * @property {HTMLDivElement|null} prioWrap
 * @property {HTMLDivElement|null} dd
 * @property {HTMLDivElement|null} badges
 * @property {HTMLButtonElement|null} createBtn
 * @property {HTMLButtonElement|null} clearBtn
 * @property {HTMLDivElement|null} selectBox
 * @property {HTMLDivElement|null} ddBox
 */

document.addEventListener('DOMContentLoaded', initAddTaskPage);

/**
 * Collects all DOM references in one object.
 * @returns {AddTaskRefs}
 */
function getRefs() {
  const d = document;
  return {
    Core: Win.AddTask,
    titleEl: d.getElementById('title'),
    descEl: d.getElementById('description'),
    dueEl: d.getElementById('due'),
    catEl: d.getElementById('category'),
    prioWrap: d.querySelector('.priority-buttons'),
    dd: d.getElementById('assignedDropdown'),
    badges: d.getElementById('assignedBadges'),
    createBtn: d.querySelector('.create_task_btn'),
    clearBtn: d.querySelector('.clear_button'),
    selectBox: d.getElementById('assignedSelectBox'),
    ddBox: d.getElementById('assignedDropdown'),
  };
}

/**
 * Prepares inputs and UI: styles, min-date, categories, priority, subtasks.
 * @param {AddTaskRefs} R
 */
function prepareInputs(R) {
  R.Core.ensureValidationStyles();
  R.Core.setDateMinToday(R.dueEl);
  R.Core.fillCategories(R.catEl);
  R.Core.initPriorityButtons(R.prioWrap);
  R.Core.attachSubtaskUI();
}

/**
 * Loads users and renders Assigned dropdown and badges.
 * @param {AddTaskRefs} R
 */
function setupAssigned(R) {
  R.Core.loadAssignedUsers().then(()=>{
    R.Core.renderAssignedDropdown(R.dd);
    R.Core.renderAssignedBadges(R.badges);
  });
}

/**
 * Handles Assigned dropdown toggle and outside click.
 * @param {AddTaskRefs} R
 */
function setupDropdownToggle(R) {
  if (!R.selectBox || !R.ddBox) return;
  R.selectBox.addEventListener('click',()=>R.ddBox.classList.toggle('hidden'));
  document.addEventListener('click',e=>{
    const wrap = document.querySelector('.assigned-to-wrapper');
    if (wrap && e.target instanceof Node && !wrap.contains(e.target)) R.ddBox.classList.add('hidden');
  });
}

/**
 * Builds Firebase-ready payload from form inputs.
 * @param {AddTaskRefs} R
 * @returns {Record<string,any>}
 */
function createTaskPayload(R) {
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
 * Wires the Create Task button: validate, save to Firebase, show toast, redirect.
 * @param {AddTaskRefs} R
 * @param {() => boolean} validate
 */
function setupCreateHandler(R, validate) {
  R.createBtn?.addEventListener('click', e=>{
    e.preventDefault();
    if(!validate()) return;
    const payload = createTaskPayload(R);
    const key = firebase.database().ref().child('tasks').push().key;
    firebase.database().ref('tasks/' + key).set({...payload,id:key})
      .then(()=>{
        R.Core.showToast();
        setTimeout(()=>{ window.location.href='../pages/board.html'; },1600);
      })
      .catch(err=>console.error('Error saving task:', err));
  });
}

/**
 * Wires Clear button to reset entire form.
 * @param {AddTaskRefs} R
 */
function setupClearHandler(R) {
  R.clearBtn?.addEventListener('click', e=>{
    e.preventDefault();
    R.Core.clearForm();
  });
}

/**
 * Sets min date for potential external date inputs.
 * @param {AddTaskRefs} R
 */
function setExtraMins(R) {
  R.Core.setDateMinToday('#task-due-date');
  R.Core.setDateMinToday('#editDueDate');
}

/**
 * Entry point for Add-Task page: gets refs, prepares UI, loads Assigned, wires handlers.
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