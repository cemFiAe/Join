// addTask.js
// Globale UI-/Helper-API (ohne DOMContentLoaded) – wird von addTaskFirebase.js benutzt.

(function (w) {
  /** @typedef {{ title:string, done:boolean }} Subtask */
  /** @typedef {{name:string; initials:string; selected:boolean; email?:string}} AssignedUserEntry */

  const state = {
    subtasks: /** @type {Subtask[]} */ ([]),
    /** @type {Record<string, AssignedUserEntry>} */ assignedUsers: {},
    currentUserEmail: (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase(),
    priority: /** @type {'urgent'|'medium'|'low'|''} */ ('medium'),
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function todayLocalISO() {
    const off = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - off).toISOString().slice(0, 10);
  }
  function ensureValidationStyles() {
    if (document.getElementById('custom-validation-styles')) return;
    const s = document.createElement('style');
    s.id = 'custom-validation-styles';
    s.textContent = `
      .field-invalid{border:2px solid #E74C3C!important;background:#fffafa;}
      .form-group .field-hint{display:none;color:#E74C3C;font-size:.9rem;}
      .form-group .field-hint.show{display:block;}
    `;
    document.head.appendChild(s);
  }
  function setDateMinToday(selectorOrInput) {
    const el = typeof selectorOrInput === 'string'
      ? /** @type {HTMLInputElement|null} */(document.querySelector(selectorOrInput))
      : /** @type {HTMLInputElement|null} */(selectorOrInput);
    if (el) el.setAttribute('min', todayLocalISO());
  }
  function getInitials(name) {
    return name.split(' ').slice(0,2).map(n=>n[0]?.toUpperCase()||'').join('');
  }
  function colorFromString(str) {
    let h = 0; for (let i=0;i<str.length;i++) h = str.charCodeAt(i)+((h<<5)-h);
    return `hsl(${h%360},70%,50%)`;
  }

  // ───────────── Categories / Priority ─────────────
  function fillCategories(selectEl) {
    if (!selectEl) return;
    const cats = ["Technical Task","User Story","Bug","Research"];
    selectEl.innerHTML = '<option value="">Select task category</option>';
    cats.forEach(c => selectEl.innerHTML += `<option value="${c}">${c}</option>`);
  }
  function setPrioActive(container, btn, buttons) {
    buttons.forEach(b => {
      b.classList.remove('active');
      const def = /** @type {HTMLElement|null} */(b.querySelector('.icon.default'));
      const sel = /** @type {HTMLElement|null} */(b.querySelector('.icon.white'));
      if (def && sel) { def.style.display=''; sel.style.display='none'; }
    });
    btn.classList.add('active');
    const def = /** @type {HTMLElement|null} */(btn.querySelector('.icon.default'));
    const sel = /** @type {HTMLElement|null} */(btn.querySelector('.icon.white'));
    if (def && sel) { def.style.display='none'; sel.style.display=''; }
    const p = (btn.dataset.priority || '').toLowerCase();
    state.priority = (p==='urgent'||p==='medium'||p==='low') ? p : '';
    container?.classList.remove('field-invalid');
  }
  function initPriorityButtons(container) {
    const buttons = /** @type {NodeListOf<HTMLButtonElement>} */(container?.querySelectorAll('.btn') ?? []);
    const medium  = /** @type {HTMLButtonElement|null} */(container?.querySelector('.btn.btn_medium') ?? null);
    buttons.forEach(b => b.addEventListener('click', () => setPrioActive(container, b, buttons)));
    if (medium) setPrioActive(container, medium, buttons);
  }

  // ───────────── Assigned Dropdown UI ─────────────
  function createAssignedOption(id, user, root) {
    const opt = document.createElement('div'); opt.className='custom-option'; opt.dataset.userId=id;
    const av = document.createElement('div'); av.className='custom-option-avatar'; av.style.backgroundColor=colorFromString(user.name); av.textContent=user.initials;
    const lab = document.createElement('div'); lab.className='custom-option-label';
    lab.textContent = user.name + (user.email?.trim().toLowerCase()===state.currentUserEmail ? ' (You)' : '');
    const chk = document.createElement('img'); chk.className='custom-option-checkbox'; chk.src = user.selected ? '../assets/icons/add_task/selected.svg' : '../assets/icons/add_task/unselected.svg';
    opt.append(av, lab, chk); root.appendChild(opt);
    const style = () => { opt.style.backgroundColor = user.selected ? '#2A3647' : ''; lab.style.color = user.selected ? '#fff' : ''; };
    style();
    opt.addEventListener('pointerdown', ev => {
      ev.preventDefault(); ev.stopPropagation();
      state.assignedUsers[id].selected = !state.assignedUsers[id].selected;
      renderAssignedDropdown(root); renderAssignedBadges(/** @type {HTMLDivElement} */(document.getElementById('assignedBadges')));
    });
    opt.addEventListener('mouseenter', () => { if (user.selected) opt.style.backgroundColor='#091931'; });
    opt.addEventListener('mouseleave', style);
  }
  function renderAssignedDropdown(root) {
    if (!root) return;
    root.innerHTML = '';
    Object.entries(state.assignedUsers).forEach(([id,u]) => createAssignedOption(id,u,root));
  }
  function renderAssignedBadges(root) {
    if (!root) return;
    root.innerHTML='';
    const sel = Object.values(state.assignedUsers).filter(u=>u.selected);
    sel.slice(0,4).forEach(u => {
      const b = document.createElement('div'); b.className='avatar-badge'; b.textContent=u.initials;
      b.style.backgroundColor = colorFromString(u.name); root.appendChild(b);
    });
    const extra = sel.length - 4;
    if (extra>0){ const m=document.createElement('div'); m.className='avatar-badge avatar-badge-more'; m.textContent=`+${extra}`; root.appendChild(m); }
  }
  async function loadAssignedUsers() {
    try {
      const [users,contacts] = await Promise.all([
        fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/users.json").then(r=>r.json()),
        fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts.json").then(r=>r.json())
      ]);
      if (users && typeof users==='object') {
        Object.entries(users).forEach(([id, d]) => {
          const name = (/** @type {any} */(d))?.name || (/** @type {any} */(d))?.email || id;
          state.assignedUsers[id] = { name, email:(/** @type {any} */(d))?.email||'', initials:getInitials(name), selected:false };
        });
      }
      if (contacts && typeof contacts==='object') {
        Object.entries(contacts).forEach(([id, d]) => {
          if (state.assignedUsers[id]) return;
          const name = (/** @type {any} */(d))?.name || id;
          state.assignedUsers[id] = { name, email:'', initials:getInitials(name), selected:false };
        });
      }
    } catch (e) { console.error('Failed to load users/contacts', e); }
  }
  function getAssignedIds() {
    return Object.entries(state.assignedUsers).filter(([,u])=>u.selected).map(([id])=>id);
  }

  // ───────────── Subtasks (UI + Edit) ─────────────
  function ensureInlineStyles() {
    if (document.getElementById('subtask-inline-styles')) return;
    const s=document.createElement('style'); s.id='subtask-inline-styles'; s.textContent=`
      .input-icon-subtask{position:relative;}
      .subtask-inline-actions{position:absolute;inset-inline-end:8px;top:50%;transform:translateY(-50%);display:none;gap:8px;align-items:center;}
      .subtask-inline-actions .inline-btn{border:none;background:transparent;padding:4px;line-height:1;cursor:pointer;border-radius:8px;}
      .subtask-inline-actions .inline-btn:hover{background:#f1f1f1;outline:1px solid #dcdcdc;}`;
    document.head.appendChild(s);
  }
  function rebuildSubtaskLi(li, text, subtaskObj) {
    subtaskObj.title = text; li.classList.remove('editing');
    li.innerHTML = `
      <span class="subtask-title">${escapeHtml(text)}</span>
      <span class="subtask-actions" style="display:none;">
        <button type="button" class="subtask-edit-btn" title="Bearbeiten">
          <img src="../assets/icons/add_task/edit.png" alt="Edit" style="width:16px;height:16px;">
        </button>
        <button type="button" class="subtask-delete-btn" title="Löschen">
          <img src="../assets/icons/add_task/delete.png" alt="Delete" style="width:16px;height:16px;">
        </button>
      </span>`;
    li.querySelector('.subtask-edit-btn')?.addEventListener('click', () => editSubtask(li, subtaskObj));
    li.querySelector('.subtask-delete-btn')?.addEventListener('click', () => {
      const ul = li.parentElement; if (!ul) return;
      const idx = Array.from(ul.children).indexOf(li);
      if (idx>-1) state.subtasks.splice(idx,1); li.remove();
    });
  }
  function buildEditRow(oldValue) {
    const row = document.createElement('div'); row.className='subtask-edit-box';
    Object.assign(row.style,{display:'flex',alignItems:'center',gap:'8px',width:'100%'});
    const input=document.createElement('input'); Object.assign(input,{type:'text',value:oldValue,placeholder:'Edit subtask'});
    input.className='subtask-edit-input'; Object.assign(input.style,{width:'100%',flex:'1 1 auto',boxSizing:'border-box'});
    const actions=document.createElement('div'); actions.className='subtask-edit-actions';
    const btnCancel=document.createElement('button'); Object.assign(btnCancel,{type:'button',title:'Cancel'}); btnCancel.className='subtask-edit-btn'; btnCancel.textContent='✕';
    const btnOk=document.createElement('button'); Object.assign(btnOk,{type:'button',title:'Save'}); btnOk.className='subtask-edit-btn'; btnOk.textContent='✓';
    actions.append(btnCancel,btnOk); row.append(input,actions);
    btnCancel.addEventListener('mousedown',e=>e.preventDefault()); btnOk.addEventListener('mousedown',e=>e.preventDefault());
    return {row,input,btnOk,btnCancel};
  }
  function editSubtask(li, subtaskObj) {
    const old = subtaskObj.title; li.classList.add('editing');
    const {row,input,btnOk,btnCancel} = buildEditRow(old);
    li.innerHTML=''; li.appendChild(row);
    const save = () => rebuildSubtaskLi(li, input.value.trim()||old, subtaskObj);
    const cancel = () => rebuildSubtaskLi(li, old, subtaskObj);
    btnOk.addEventListener('click', save); btnCancel.addEventListener('click', cancel);
    input.addEventListener('keydown', e => { if (e.key==='Enter') save(); if (e.key==='Escape') cancel(); });
    input.addEventListener('blur', save); input.focus(); input.select();
  }
  function createSubtaskLi(value, list, obj) {
    const li=document.createElement('li'); li.classList.add('subtask-item');
    li.innerHTML = `
      <span class="subtask-title">${escapeHtml(value)}</span>
      <span class="subtask-actions" style="display:none;">
        <button type="button" class="subtask-edit-btn" title="Bearbeiten">
          <img src="../assets/icons/add_task/edit.png" alt="Edit" style="width:16px;height:16px;">
        </button>
        <button type="button" class="subtask-delete-btn" title="Löschen">
          <img src="../assets/icons/add_task/delete.png" alt="Delete" style="width:16px;height:16px;">
        </button>
      </span>`;
    list.appendChild(li);
    li.addEventListener('mouseenter',()=>{const a=li.querySelector('.subtask-actions'); if(a)(a).setAttribute('style','display:inline-block;');});
    li.addEventListener('mouseleave',()=>{const a=li.querySelector('.subtask-actions'); if(a)(a).setAttribute('style','display:none;');});
    li.querySelector('.subtask-edit-btn')?.addEventListener('click',()=>editSubtask(li,obj));
    li.querySelector('.subtask-delete-btn')?.addEventListener('click',()=>{
      const idx=Array.from(list.children).indexOf(li); if(idx>-1) state.subtasks.splice(idx,1); li.remove();
    });
  }
  function attachSubtaskUI() {
    ensureInlineStyles();
    const wrap=/** @type {HTMLDivElement|null} */(document.querySelector('.input-icon-subtask'));
    const list=/** @type {HTMLUListElement|null} */(document.getElementById('subtask-list'));
    const input=/** @type {HTMLInputElement|null} */(wrap?.querySelector('input')??null);
    const addBtn=/** @type {HTMLButtonElement|null} */(document.querySelector('.add-subtask'));
    const clearBtn=/** @type {HTMLButtonElement|null} */(document.querySelector('.clear-subtask-input'));
    if (!wrap||!list||!input) return;

    let inline=/** @type {HTMLDivElement|null} */(wrap.querySelector('.subtask-inline-actions'));
    if (!inline) {
      inline=document.createElement('div'); inline.className='subtask-inline-actions';
      const x=document.createElement('button'); x.type='button'; x.className='inline-btn inline-x'; x.textContent='✕';
      const ok=document.createElement('button'); ok.type='button'; ok.className='inline-btn inline-check'; ok.textContent='✓';
      inline.append(x,ok); wrap.appendChild(inline);
      x.addEventListener('click',()=>{input.value=''; input.focus(); hideInline();});
      ok.addEventListener('click',()=>{addSub(); input.focus(); hideInline();});
    }
    const showInline=()=>{ if(inline) inline.style.display='flex'; if(addBtn) addBtn.style.display='none'; };
    const hideInline=()=>{ if(inline) inline.style.display='none'; if(addBtn) addBtn.style.display=''; };
    function addSub() {
      const v=input.value.trim(); if(!v) return;
      const obj=/** @type {Subtask} */({title:v,done:false}); state.subtasks.push(obj);
      createSubtaskLi(v, list, obj); input.value='';
    }
    input.addEventListener('focus',showInline);
    input.addEventListener('input',showInline);
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addSub(); hideInline(); input.focus(); }});
    input.addEventListener('blur',()=>setTimeout(()=>{ const inside=document.activeElement instanceof Node && wrap?.contains(document.activeElement); if(!inside && !input.value.trim()) hideInline(); },0));
    addBtn?.addEventListener('click',addSub);
    clearBtn?.addEventListener('click',()=>{ input.value=''; clearBtn.style.display='none'; });
  }

  // ───────────── Validation / Toast / Clear ─────────────
  function grp(el){ return el?.closest?.('.form-group') || el?.parentElement || null; }
  function ensureHint(el){ const g=grp(el); if(!g) return null; let h=g.querySelector('.field-hint'); if(!h){ h=document.createElement('small'); h.className='field-hint'; h.textContent='This field is required'; g.appendChild(h);} return /** @type {HTMLElement} */(h); }
  function markInvalid(el){ if(!el) return; el.classList.add('field-invalid'); el.setAttribute('aria-invalid','true'); ensureHint(el)?.classList.add('show'); }
  function clearInvalid(el){ if(!el) return; el.classList.remove('field-invalid'); el.removeAttribute('aria-invalid'); grp(el)?.querySelector('.field-hint')?.classList.remove('show'); }
  function installFieldValidation(titleEl, dueEl, categoryEl, priorityWrap) {
    titleEl?.addEventListener('input',()=>clearInvalid(titleEl));
    dueEl?.addEventListener('input',()=>clearInvalid(dueEl));
    categoryEl?.addEventListener('change',()=>clearInvalid(categoryEl));
    function validate(){
      let ok=true, today=todayLocalISO();
      if(!titleEl||titleEl.value.trim().length<2){ markInvalid(titleEl); ok=false; }
      if(!dueEl||!dueEl.value||dueEl.value<today){ markInvalid(dueEl); ok=false; }
      if(!categoryEl||!categoryEl.value){ markInvalid(categoryEl); ok=false; }
      if(!state.priority){ priorityWrap?.classList.add('field-invalid'); ok=false; } else { priorityWrap?.classList.remove('field-invalid'); }
      return ok;
    }
    return { validate, clearInvalid };
  }
  function showToast() {
    let style=document.getElementById('add-task-toast-style');
    if(!style){ style=document.createElement('style'); style.id='add-task-toast-style'; document.head.appendChild(style); }
    style.textContent = `
      @keyframes slideUpToCenter{0%{top:100%;transform:translate(-50%,0)}100%{top:50%;transform:translate(-50%,-50%)}}
      #addTaskToast{position:fixed;left:50%;top:100%;transform:translate(-50%,0);z-index:99999;background:transparent;pointer-events:none}
      #addTaskToast.enter{animation:slideUpToCenter .55s cubic-bezier(.2,.8,.2,1) forwards}
      #addTaskToast img{display:block;width:300px;height:auto}`;
    let toast=document.getElementById('addTaskToast');
    if(!toast){ toast=document.createElement('div'); toast.id='addTaskToast'; document.body.appendChild(toast); }
    toast.innerHTML = `<img src="../assets/icons/add_task/board_white.png" alt="">`;
    toast.classList.remove('enter'); void(/** @type {any} */(toast)).offsetHeight; toast.classList.add('enter');
  }
  function resetInputs() {
    const t=/** @type {HTMLInputElement|null} */(document.getElementById('title'));
    const d=/** @type {HTMLTextAreaElement|null} */(document.getElementById('description'));
    const du=/** @type {HTMLInputElement|null} */(document.getElementById('due'));
    if(t)t.value=''; if(d)d.value=''; if(du)du.value='';
    const cat=/** @type {HTMLSelectElement|null} */(document.getElementById('category'));
    if(cat){ cat.selectedIndex=0; cat.dispatchEvent(new Event('change',{bubbles:true})); }
    ['title','due','category'].forEach(id=>document.getElementById(id)?.classList.remove('field-invalid'));
  }
  function resetAssignedAndSubtasks() {
    Object.values(state.assignedUsers).forEach(u=>u.selected=false);
    renderAssignedDropdown(/** @type {HTMLDivElement|null} */(document.getElementById('assignedDropdown')));
    renderAssignedBadges(/** @type {HTMLDivElement|null} */(document.getElementById('assignedBadges')));
    document.getElementById('assignedDropdown')?.classList.add('hidden');
    state.subtasks = [];
    const list=/** @type {HTMLUListElement|null} */(document.getElementById('subtask-list')); if(list) list.innerHTML='';
    const inpt=/** @type {HTMLInputElement|null} */(document.querySelector('.input-icon-subtask input')); if(inpt) inpt.value='';
    const clearX=/** @type {HTMLButtonElement|null} */(document.querySelector('.clear-subtask-input')); if(clearX) clearX.style.display='none';
  }
  function clearForm() {
    resetInputs();
    initPriorityButtons(/** @type {HTMLDivElement|null} */(document.querySelector('.priority-buttons')));
    resetAssignedAndSubtasks();
  }

  // ───────────── Public API ─────────────
  (/** @type {any} */(w)).AddTask = {
    state,
    escapeHtml, todayLocalISO, ensureValidationStyles, setDateMinToday,
    fillCategories,
    loadAssignedUsers, renderAssignedDropdown, renderAssignedBadges, getAssignedIds,
    initPriorityButtons,
    attachSubtaskUI,
    installFieldValidation, showToast, clearForm,
    colorFromString, getInitials,
  };
})(window);
