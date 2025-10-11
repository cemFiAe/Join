// @ts-check
/* global firebase */

/**
 * Board.Detail – orchestrates Task Detail dialog (View + Edit)
 * Dependencies: Board.DetailUtil (U), Board.Assigned (Assigned)
 */
const Win = /** @type {any} */ (window);
Win.Board = Win.Board || {};
const Assigned = Win.Board.Assigned;
const U = Win.Board.DetailUtil;

/** @typedef {"urgent"|"medium"|"low"} TaskPriority */
/** @typedef {{title:string,done:boolean}} Subtask */
/** @typedef {{ id:string, title?:string, description?:string, category?:string, dueDate?:string, priority?:TaskPriority, status:string, assignedTo?:string[]|string, subtasks?:Subtask[] }} Task */

// ────────────────────────────────────────── View builders

function buildViewHTML(t) {
  const pr = { urgent: 'prio_top.svg', medium: 'prio_mid.svg', low: 'prio_low.svg' };
  const prIcon = pr[t.priority || 'medium'];
  const prLabel = (t.priority || 'medium').replace(/^\w/, c => c.toUpperCase());
  const catCls = U.getDetailCategoryClass(t.category);

  const ass = (Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo])
    .filter(Boolean)
    .map(uid =>
      `<div class="assigned-user">${
        Assigned?.getProfileBadge?.(String(uid)) || ''
      }<span class="assigned-user-name">${
        Assigned?.getPersonData?.(String(uid))?.name || ''
      }</span></div>`
    ).join('');

  const subs = Array.isArray(t.subtasks) && t.subtasks.length
    ? t.subtasks.map((st,i)=>
        `<label style="display:flex;align-items:center;gap:9px;">
          <input type="checkbox" class="subtask-checkbox" data-subidx="${i}" ${st.done?'checked':''}>
          <span>${st.title}</span>
        </label>`
      ).join('')
    : '<i>No subtasks.</i>';

  return `
    <button id="closeTaskDetail" class="close-task-detail" aria-label="Close">&times;</button>
    <span class="${catCls}">${t.category||''}</span>
    <h2 class="task-detail-title">${t.title||''}</h2>
    <div class="task-detail-description">${t.description||''}</div>
    <div class="task-detail-row">
      <span class="task-detail-label">Due date:</span>
      <span>${U.formatDueDate(t.dueDate||'')}</span>
    </div>
    <div class="task-detail-row">
      <span class="task-detail-label">Priority:</span>
      <span style="display:flex;align-items:center;gap:8px;">
        <span>${prLabel}</span>
        <img src="../assets/icons/board/prio/${prIcon}" style="height:10px" alt="">
      </span>
    </div>
    <div class="task-detail-row"><span class="task-detail-label">Assigned To:</span></div>
    <div class="task-detail-contacts">${ass}</div>
    <div class="task-detail-row" style="margin-bottom:5px;">
      <span class="task-detail-label">Subtasks</span>
    </div>
    <div class="task-detail-subtasks">${subs}</div>
    <div class="task-detail-actions">
      <button id="deleteTaskBtn" class="delete-btn"><img src="../assets/icons/board/delete.png" alt=""> Delete</button>
      <button id="editTaskBtn" class="edit-btn"><img src="../assets/icons/board/edit.png" alt=""> Edit</button>
    </div>`;
}

function buildEditHTML(t) {
  const catCls = U.getDetailCategoryClass(t.category);
  const def = (p) => (t.priority || 'medium') === p ? ' active' : '';
  return `
    <button id="closeTaskDetail" class="close-task-detail" aria-label="Close">&times;</button>
    <span class="${catCls}">${t.category||''}</span>
    <form id="editTaskForm" style="display:flex;flex-direction:column;gap:14px;">
      <div class="form-group">
        <label for="editTitle">Title</label>
        <input id="editTitle" type="text" value="${t.title||''}">
      </div>

      <div class="form-group">
        <label for="editDescription">Description</label>
        <textarea id="editDescription">${t.description||''}</textarea>
      </div>

      <div class="form-group">
        <label for="editDueDate">Due date</label>
        <div class="input-icon-date">
          <input type="date" id="editDueDate" value="${t.dueDate||''}">
        </div>
      </div>

      <div class="form-group">
        <label>Priority</label>
        <div class="priority-buttons">
          <button type="button" class="btn${def('urgent')}"  data-priority="urgent">Urgent <img src="../assets/icons/add_task/urgent_small.png" alt=""></button>
          <button type="button" class="btn${def('medium')}" data-priority="medium">Medium <img src="../assets/icons/add_task/medium_orange.png" alt=""></button>
          <button type="button" class="btn${def('low')}"    data-priority="low">Low <img src="../assets/icons/add_task/low.png" alt=""></button>
        </div>
      </div>

      <div class="form-group">
        <label>Assigned to</label>
        <div class="assigned-to-wrapper">
          <div class="assigned-select-box" id="editAssignedSelectBox">
            <span>Select contacts to assign</span>
            <img class="imgDropdown" src="../assets/icons/add_task/arrow_drop_down.png" alt="">
          </div>
          <div class="assigned-dropdown hidden" id="editAssignedDropdown"></div>
          <div class="assigned-badges" id="editAssignedBadges"></div>
        </div>
      </div>

      <div class="form-group">
        <label for="edit-detail-subtasks">Subtasks</label>
        <div id="edit-detail-subtasks"></div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:14px;">
        <button id="saveTaskBtn" class="create_task_btn" type="submit">Ok &#10003;</button>
      </div>
    </form>`;
}

// ────────────────────────────────────────── Small wiring

function wireView(body, task, dlg, toEdit) {
  body.querySelectorAll('.subtask-checkbox').forEach((el) => {
    el.addEventListener('change', (ev) => {
      const i = Number((/** @type {HTMLInputElement} */(ev.currentTarget)).dataset.subidx||'0');
      if (Array.isArray(task.subtasks) && task.subtasks[i]) {
        task.subtasks[i].done = (/** @type {HTMLInputElement} */(ev.currentTarget)).checked;
        firebase.database().ref('tasks/'+task.id+'/subtasks').set(task.subtasks);
      }
    });
  });
  (/** @type {HTMLButtonElement} */(body.querySelector('#editTaskBtn'))).onclick = toEdit;
  (/** @type {HTMLButtonElement} */(body.querySelector('#deleteTaskBtn'))).onclick = () => U.showDeleteConfirmDialog(task.id, dlg);
  (/** @type {HTMLButtonElement} */(body.querySelector('#closeTaskDetail'))).onclick = () => dlg.close();
}

function setMinDate(body) {
  const el = /** @type {HTMLInputElement|null} */ (body.querySelector('#editDueDate'));
  if (!el) return;
  const off = new Date().getTimezoneOffset() * 60000;
  el.min = new Date(Date.now()-off).toISOString().slice(0,10);
  el.addEventListener('input', () => { if (el.value && el.value < el.min) el.value = el.min; });
}

function wirePrioButtons(body, current) {
  let prio = current || 'medium';
  body.querySelectorAll('.priority-buttons .btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      body.querySelectorAll('.priority-buttons .btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      prio = /** @type {TaskPriority} */ ((/** @type {HTMLElement} */(this)).dataset.priority || 'medium');
    });
  });
  return prio;
}

function buildLocalAssign(task) {
  const allU = Win.allUsers||{};
  const allC = Win.allContacts||{};
  const pre = Array.isArray(task.assignedTo) ? task.assignedTo.map(String)
    : (task.assignedTo?[String(task.assignedTo)]:[]);
  const toIni = (n)=>n.split(' ').slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('');
  const local = {};
  Object.entries(allU).forEach(([id,u])=>{
    const name=u?.name||u?.email||id;
    local[id]={name,email:u?.email||'',initials:toIni(name),selected:pre.includes(id)};
  });
  Object.entries(allC).forEach(([id,c])=>{
    if(local[id])return;
    const name=c?.name||id;
    local[id]={name,initials:toIni(name),selected:pre.includes(id)};
  });
  return local;
}

function renderAssignBadges(local, bad) {
  bad.innerHTML = '';
  const sel = Object.values(local).filter(u=>u.selected);
  sel.slice(0,4).forEach(u=>{
    const b=document.createElement('div');
    b.className='avatar-badge';
    b.textContent=u.initials;
    b.style.backgroundColor=Assigned?.generateColorFromString?.(u.name)||'#888';
    bad.appendChild(b);
  });
  const extra = sel.length-4;
  if (extra>0){
    const m=document.createElement('div');
    m.className='avatar-badge avatar-badge-more';
    m.textContent=`+${extra}`;
    bad.appendChild(m);
  }
}

function renderAssignDropdown(local, dd) {
  const keep = dd.scrollTop;
  dd.innerHTML = '';
  Object.entries(local)
    .sort(([,a],[,b])=>a.name.localeCompare(b.name))
    .forEach(([id,u])=>{
      const opt=document.createElement('div');
      opt.className='custom-option'+(u.selected?' selected':'');
      opt.tabIndex=0;

      const av=document.createElement('div');
      av.className='custom-option-avatar';
      av.style.backgroundColor=Assigned?.generateColorFromString?.(u.name)||'#888';
      av.textContent=u.initials;

      const lab=document.createElement('div');
      lab.className='custom-option-label';
      lab.textContent=
        u.name +
        (((u.email||'').toLowerCase()===(localStorage.getItem('currentUserEmail')||'').toLowerCase())
          ? ' (You)' : '');

      const chk=document.createElement('div');
      chk.className='custom-option-checkbox';
      if(u.selected) chk.classList.add('checked');

      const toggle=(ev)=>{
        ev.preventDefault(); ev.stopPropagation();
        u.selected=!u.selected;
        renderAssignDropdown(local,dd);
        renderAssignBadges(local, /** @type {HTMLDivElement} */(document.getElementById('editAssignedBadges')));
        dd.scrollTop=keep;
      };

      opt.addEventListener('pointerdown',toggle);
      opt.addEventListener('keydown',(e)=>{ if(e.key===' '||e.key==='Enter') toggle(e); });

      opt.append(av,lab,chk);
      dd.appendChild(opt);
    });
  dd.scrollTop = keep;
}

function wireAssign(body, local) {
  const sel = body.querySelector('#editAssignedSelectBox');
  const dd  = body.querySelector('#editAssignedDropdown');
  const bad = body.querySelector('#editAssignedBadges');

  sel.addEventListener('click',(e)=>{
    e.preventDefault(); e.stopPropagation();
    dd.classList.toggle('hidden');
  });

  document.addEventListener('click',(e)=>{
    if(!(e.target instanceof Node)) return;
    if(!sel.parentElement?.contains(e.target)) dd.classList.add('hidden');
  });

  renderAssignDropdown(local, dd);
  renderAssignBadges(local, bad);
}

function wireSave(body, task, local, done, getPrio) {
  body.querySelector('#editTaskForm').onsubmit = (e) => {
    e.preventDefault();
    const title = body.querySelector('#editTitle').value.trim();
    const desc  = body.querySelector('#editDescription').value.trim();
    const due   = body.querySelector('#editDueDate').value.trim();
    const assigned = Object.entries(local).filter(([,u])=>u.selected).map(([id])=>id);
    const subs = (task.subtasks||[]).filter(st=>st && st.title && st.title.trim())
      .map(st=>({title:st.title.trim(),done:!!st.done}));

    firebase.database().ref('tasks/'+task.id).update({
      title, description:desc, dueDate:due, priority:getPrio(),
      assignedTo:assigned, subtasks:subs
    }).then(done);
  };
}

// ────────────────────────────────────────── Entry point

function openTaskDetail(task) {
  const dlg = document.getElementById('taskDetailDialog');
  const body = document.getElementById('taskDetailBody');

  let isEditing = false;
  let editPrio = task.priority||'medium';

  const renderView = () => {
    body.innerHTML = buildViewHTML(task);
    wireView(body, task, dlg, () => { isEditing = true; render(); });
  };

  const renderEdit = () => {
    body.innerHTML = buildEditHTML(task);
    setMinDate(body);
    editPrio = wirePrioButtons(body, editPrio);
    const local = buildLocalAssign(task);
    wireAssign(body, local);
    U.renderSubtasksEdit(body.querySelector('#edit-detail-subtasks'), task);
    body.querySelector('#closeTaskDetail').onclick = () => dlg.close();
    wireSave(body, task, local, () => { isEditing = false; render(); }, () => editPrio);
  };

  const render = () => (isEditing ? renderEdit() : renderView());

  render();
  dlg.showModal();
}

// ────────────────────────────────────────── Export
Win.Board.Detail = { openTaskDetail };