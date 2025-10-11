// addTask.js
// Extends global AddTask with Assigned-/Subtasks-UI, Toast & Clear logic.

/** @typedef {{ title: string, done: boolean }} Subtask */
/** @typedef {{ name: string, initials: string, selected: boolean, email?: string }} AssignedUserEntry */

// Access AddTask (must be loaded from addTaskCore.js first)
const A = window.AddTask;
if (!A) {
  console.error('addTaskCore.js must be loaded before addTask.js');
}

// ───────────── Assigned Dropdown ─────────────

/**
 * Creates one option for the “Assigned to” dropdown with avatar, label, and toggle logic.
 * @param {string} id - User ID
 * @param {AssignedUserEntry} user - Model entry for this person
 * @param {HTMLDivElement} root - Dropdown container
 */
function createAssignedOption(id, user, root) {
  const opt = document.createElement('div');
  opt.className = 'custom-option'; opt.dataset.userId = id;
  const av = Object.assign(document.createElement('div'), {
    className: 'custom-option-avatar', textContent: user.initials,
    style: `background-color:${A.colorFromString(user.name)}`
  });
  const labelText = user.email?.trim().toLowerCase() === A.state.currentUserEmail ? `${user.name} (You)` : user.name;
  const lab = Object.assign(document.createElement('div'), { className: 'custom-option-label', textContent: labelText });
  const chk = Object.assign(document.createElement('img'), {
    className: 'custom-option-checkbox',
    src: user.selected ? '../assets/icons/add_task/selected.svg' : '../assets/icons/add_task/unselected.svg'
  });
  opt.append(av, lab, chk); root.appendChild(opt);

  const paint = () => { opt.style.backgroundColor = user.selected ? '#2A3647' : ''; lab.style.color = user.selected ? '#fff' : ''; };
  opt.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); user.selected = !user.selected; A.renderAssignedDropdown(root); A.renderAssignedBadges(document.getElementById('assignedBadges')); };
  opt.onmouseenter = () => user.selected && (opt.style.backgroundColor = '#091931');
  opt.onmouseleave = paint; paint();
}

/**
 * Renders the full “Assigned to” dropdown.
 * @param {HTMLDivElement|null} root - Dropdown container
 */
A.renderAssignedDropdown = function (root) {
  if (!root) return;
  root.innerHTML = '';
  for (const [id, user] of Object.entries(A.state.assignedUsers))
    createAssignedOption(id, user, root);
};

/**
 * Renders the round initials badges of selected users (max 4 visible, rest as "+N").
 * @param {HTMLDivElement|null} root - Badge container
 */
A.renderAssignedBadges = function (root) {
  if (!root) return;
  root.innerHTML = '';
  const sel = Object.values(A.state.assignedUsers).filter(u => u.selected);
  sel.slice(0, 4).forEach(u => { const b = document.createElement('div'); b.className='avatar-badge'; b.textContent=u.initials; b.style.backgroundColor=A.colorFromString(u.name); root.appendChild(b); });
  if (sel.length > 4) { const more=document.createElement('div'); more.className='avatar-badge avatar-badge-more'; more.textContent=`+${sel.length-4}`; root.appendChild(more); }
};

/**
 * Loads users and contacts from DB and populates AddTask.state.assignedUsers.
 */
A.loadAssignedUsers = async function () {
  try {
    const urls = [
      "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/users.json",
      "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts.json"
    ];
    const [users, contacts] = await Promise.all(urls.map(u => fetch(u).then(r => r.json())));
    const addEntry = (id, name, email = '') => A.state.assignedUsers[id] = { name, email, initials: A.getInitials(name), selected: false };
    if (users) for (const [id, d] of Object.entries(users)) addEntry(id, d.name || d.email || id, d.email);
    if (contacts) for (const [id, d] of Object.entries(contacts)) if (!A.state.assignedUsers[id]) addEntry(id, d.name || id);
  } catch (e) { console.error('Failed to load users/contacts', e); }
};

/**
 * Returns IDs of currently selected users.
 * @returns {string[]} - Array of user IDs
 */
A.getAssignedIds = () => Object.entries(A.state.assignedUsers).filter(([, u]) => u.selected).map(([id]) => id);

// ───────────── Subtasks (UI + Edit) ─────────────

/**
 * Injects inline CSS styles for subtask input once.
 */
function ensureInlineStyles() {
  if (document.getElementById('subtask-inline-styles')) return;
  const s=document.createElement('style'); s.id='subtask-inline-styles';
  s.textContent=`
    .input-icon-subtask{position:relative;}
    .subtask-inline-actions{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:none;gap:8px;align-items:center;}
    .inline-btn{border:none;background:transparent;padding:4px;cursor:pointer;border-radius:8px;}
    .inline-btn:hover{background:#f1f1f1;outline:1px solid #dcdcdc;}
  `; document.head.appendChild(s);
}

/**
 * Rebuilds a subtask list item after editing.
 */
function rebuildSubtaskLi(li, text, subtaskObj) {
  subtaskObj.title=text; li.classList.remove('editing');
  li.innerHTML=`<span class="subtask-title">${A.escapeHtml(text)}</span>
    <span class="subtask-actions" style="display:none;">
      <button class="subtask-edit-btn"><img src="../assets/icons/add_task/edit.png"></button>
      <button class="subtask-delete-btn"><img src="../assets/icons/add_task/delete.png"></button>
    </span>`;
  li.querySelector('.subtask-edit-btn')?.addEventListener('click',()=>editSubtask(li,subtaskObj));
  li.querySelector('.subtask-delete-btn')?.addEventListener('click',()=>{ const ul=li.parentElement; const idx=ul?[...ul.children].indexOf(li):-1; if(idx>-1)A.state.subtasks.splice(idx,1); li.remove(); });
}

/**
 * Builds inline edit row (input + OK/Cancel).
 */
function buildEditRow(oldValue){
  const row=document.createElement('div'); row.className='subtask-edit-box';
  Object.assign(row.style,{display:'flex',alignItems:'center',gap:'8px',width:'100%'});
  const input=Object.assign(document.createElement('input'),{type:'text',value:oldValue,placeholder:'Edit subtask'});
  input.className='subtask-edit-input'; input.style.flex='1';
  const makeBtn=(txt,title)=>Object.assign(document.createElement('button'),{type:'button',textContent:txt,title});
  const actions=document.createElement('div'); actions.className='subtask-edit-actions';
  const btnCancel=makeBtn('✕','Cancel'), btnOk=makeBtn('✓','Save'); actions.append(btnCancel,btnOk); row.append(input,actions);
  [btnCancel,btnOk].forEach(b=>b.onmousedown=e=>e.preventDefault());
  return {row,input,btnOk,btnCancel};
}

/**
 * Starts inline editing for a subtask.
 */
function editSubtask(li, subtaskObj){
  const old=subtaskObj.title;
  const {row,input,btnOk,btnCancel}=buildEditRow(old);
  li.innerHTML=''; li.appendChild(row); li.classList.add('editing');
  const save=()=>rebuildSubtaskLi(li,input.value.trim()||old,subtaskObj);
  const cancel=()=>rebuildSubtaskLi(li,old,subtaskObj);
  btnOk.onclick=save; btnCancel.onclick=cancel;
  input.onkeydown=e=>{ if(e.key==='Enter')save(); if(e.key==='Escape')cancel(); };
  input.onblur=save; input.focus(); input.select();
}

/**
 * Adds a new subtask list item.
 */
function createSubtaskLi(value,list,obj){
  const li=document.createElement('li'); li.className='subtask-item';
  li.innerHTML=`<span class="subtask-title">${A.escapeHtml(value)}</span>
    <span class="subtask-actions" style="display:none;">
      <button class="subtask-edit-btn"><img src="../assets/icons/add_task/edit.png"></button>
      <button class="subtask-delete-btn"><img src="../assets/icons/add_task/delete.png"></button>
    </span>`; list.append(li);
  const show=s=>li.querySelector('.subtask-actions')?.setAttribute('style',s);
  li.onmouseenter=()=>show('display:inline-block;'); li.onmouseleave=()=>show('display:none;');
  li.querySelector('.subtask-edit-btn')?.addEventListener('click',()=>editSubtask(li,obj));
  li.querySelector('.subtask-delete-btn')?.addEventListener('click',()=>{ const idx=[...list.children].indexOf(li); if(idx>-1)A.state.subtasks.splice(idx,1); li.remove(); });
}

/**
 * Initializes subtask input behavior.
 */
A.attachSubtaskUI=function(){
  ensureInlineStyles();
  const wrap=document.querySelector('.input-icon-subtask'), list=document.getElementById('subtask-list'),
    input=wrap?.querySelector('input'), addBtn=document.querySelector('.add-subtask'),
    clearBtn=document.querySelector('.clear-subtask-input');
  if(!wrap||!list||!input)return;
  let inline=wrap.querySelector('.subtask-inline-actions');
  if(!inline){ inline=document.createElement('div'); inline.className='subtask-inline-actions';
    const mkBtn=(t,fn)=>Object.assign(document.createElement('button'),{type:'button',textContent:t,onclick:fn});
    inline.append(mkBtn('✕',()=>{input.value='';input.focus(); hideInline();}), mkBtn('✓',()=>{addSub();input.focus();hideInline();}));
    wrap.appendChild(inline);
  }
  const showInline=()=>{inline.style.display='flex'; addBtn.style.display='none';};
  const hideInline=()=>{inline.style.display='none'; addBtn.style.display='';};
  const addSub=()=>{ const v=input.value.trim(); if(!v)return; const obj={title:v,done:false}; A.state.subtasks.push(obj); createSubtaskLi(v,list,obj); input.value=''; };
  input.onfocus=showInline; input.oninput=showInline;
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault(); addSub(); hideInline(); input.focus();}};
  input.onblur=()=>setTimeout(()=>{if(!wrap.contains(document.activeElement)&&!input.value.trim())hideInline();},0);
  addBtn?.addEventListener('click',addSub); clearBtn?.addEventListener('click',()=>{input.value=''; clearBtn.style.display='none';});
};

// ───────────── Toast & Clear ─────────────

/**
 * Shows a small “Task created” toast animation.
 */
A.showToast=function(){
  let style=document.getElementById('add-task-toast-style');
  if(!style){ style=document.createElement('style'); style.id='add-task-toast-style'; document.head.appendChild(style);}
  style.textContent=`@keyframes slideUpToCenter{0%{top:100%;transform:translate(-50%,0)}100%{top:50%;transform:translate(-50%,-50%)}}#addTaskToast{position:fixed;left:50%;top:100%;transform:translate(-50%,0);z-index:99999;background:transparent;pointer-events:none}#addTaskToast.enter{animation:slideUpToCenter .55s cubic-bezier(.2,.8,.2,1) forwards}#addTaskToast img{width:300px;display:block}`;
  let toast=document.getElementById('addTaskToast');
  if(!toast){toast=document.createElement('div'); toast.id='addTaskToast'; document.body.appendChild(toast);}
  toast.innerHTML=`<img src="../assets/icons/add_task/board_white.png" alt="">`;
  toast.classList.remove('enter'); void toast.offsetHeight; toast.classList.add('enter');
};

/**
 * Resets main input fields.
 */
function resetInputs(){
  const t=document.getElementById('title'), d=document.getElementById('description'), du=document.getElementById('due');
  if(t)t.value=''; if(d)d.value=''; if(du)du.value='';
  const cat=document.getElementById('category'); if(cat){cat.selectedIndex=0; cat.dispatchEvent(new Event('change',{bubbles:true}));}
  ['title','due','category'].forEach(id=>document.getElementById(id)?.classList.remove('field-invalid'));
}

/**
 * Clears assigned users and subtasks.
 */
function resetAssignedAndSubtasks(){
  Object.values(A.state.assignedUsers).forEach(u=>u.selected=false);
  A.renderAssignedDropdown(document.getElementById('assignedDropdown'));
  A.renderAssignedBadges(document.getElementById('assignedBadges'));
  document.getElementById('assignedDropdown')?.classList.add('hidden');
  A.state.subtasks=[]; const list=document.getElementById('subtask-list'); if(list)list.innerHTML='';
  const inp=document.querySelector('.input-icon-subtask input'); if(inp)inp.value='';
  const clearX=document.querySelector('.clear-subtask-input'); if(clearX)clearX.style.display='none';
}

/**
 * Clears the entire Add Task form.
 */
A.clearForm=function(){ resetInputs(); A.initPriorityButtons(document.querySelector('.priority-buttons')); resetAssignedAndSubtasks(); };
