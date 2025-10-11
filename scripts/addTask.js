// addTask.js
// Ergänzt window.AddTask um Assigned-/Subtasks-UI, Toast & Clear.

(function (w) {
  /** @typedef {{ title:string, done:boolean }} Subtask */
  /** @typedef {{name:string; initials:string; selected:boolean; email?:string}} AssignedUserEntry */

  // window zuerst auf any casten, dann AddTask ziehen
  const Win = /** @type {any} */ (w);
  const A   = /** @type {any} */ (Win.AddTask);   // addTaskCore.js MUSS vorher geladen sein
  if (!A) { console.error('addTaskCore.js not loaded before addTask.js'); return; }

  // ───────────── Assigned Dropdown ─────────────

  /**
   * Erstellt eine einzelne Option für das „Assigned to“-Dropdown
   * inkl. Avatar, Label, Checkbox und Toggle-Logik.
   * @param {string} id                       Personen-ID
   * @param {AssignedUserEntry} user          Model-Eintrag für die Person
   * @param {HTMLDivElement} root             Container des Dropdowns
   * @returns {void}
   */
  function createAssignedOption(id, user, root) {
    const opt = document.createElement('div'); opt.className='custom-option'; opt.dataset.userId=id;
    const av = document.createElement('div'); av.className='custom-option-avatar'; av.style.backgroundColor=A.colorFromString(user.name); av.textContent=user.initials;
    const lab = document.createElement('div'); lab.className='custom-option-label';
    lab.textContent = user.name + (user.email?.trim().toLowerCase()===A.state.currentUserEmail ? ' (You)' : '');
    const chk = document.createElement('img'); chk.className='custom-option-checkbox'; chk.src = user.selected ? '../assets/icons/add_task/selected.svg' : '../assets/icons/add_task/unselected.svg';
    opt.append(av, lab, chk); root.appendChild(opt);

    const paint = () => { opt.style.backgroundColor = user.selected ? '#2A3647' : ''; lab.style.color = user.selected ? '#fff' : ''; };
    paint();
    opt.addEventListener('pointerdown', ev => {
      ev.preventDefault(); ev.stopPropagation();
      A.state.assignedUsers[id].selected = !A.state.assignedUsers[id].selected;
      A.renderAssignedDropdown(root); A.renderAssignedBadges(/** @type {HTMLDivElement} */(document.getElementById('assignedBadges')));
    });
    opt.addEventListener('mouseenter', () => { if (user.selected) opt.style.backgroundColor = '#091931'; });
    opt.addEventListener('mouseleave', paint);
  }

  /**
   * Rendert das komplette „Assigned to“-Dropdown neu.
   * @param {HTMLDivElement|null} root  Dropdown-Container
   * @returns {void}
   */
  A.renderAssignedDropdown = function (root) {
    if (!root) return;
    root.innerHTML = '';
    Object.entries(/** @type {Record<string, AssignedUserEntry>} */ (A.state.assignedUsers))
      .forEach(([id,u]) => createAssignedOption(id,u,root));
  };

  /**
   * Rendert die runden Initialen-Badges der ausgewählten Personen
   * (max. 4 sichtbar, Rest als „+N“).
   * @param {HTMLDivElement|null} root  Badge-Container
   * @returns {void}
   */
  A.renderAssignedBadges = function (root) {
    if (!root) return;
    root.innerHTML='';
    const sel = Object.values(A.state.assignedUsers).filter(u=>u.selected);
    sel.slice(0,4).forEach(u => {
      const b = document.createElement('div'); b.className='avatar-badge'; b.textContent=u.initials;
      b.style.backgroundColor = A.colorFromString(u.name); root.appendChild(b);
    });
    const extra = sel.length - 4;
    if (extra>0){ const m=document.createElement('div'); m.className='avatar-badge avatar-badge-more'; m.textContent=`+${extra}`; root.appendChild(m); }
  };

  /**
   * Lädt `users` und `contacts` aus der DB (REST-Endpoint) und
   * füllt den `AddTask.state.assignedUsers`-Store.
   * @returns {Promise<void>}
   */
  A.loadAssignedUsers = async function () {
    try {
      const [users,contacts] = await Promise.all([
        fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/users.json").then(r=>r.json()),
        fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts.json").then(r=>r.json())
      ]);
      if (users && typeof users==='object') {
        Object.entries(users).forEach(([id, d]) => {
          const name = (/** @type {any} */(d))?.name || (/** @type {any} */(d))?.email || id;
          A.state.assignedUsers[id] = { name, email:(/** @type {any} */(d))?.email||'', initials:A.getInitials(name), selected:false };
        });
      }
      if (contacts && typeof contacts==='object') {
        Object.entries(contacts).forEach(([id, d]) => {
          if (A.state.assignedUsers[id]) return;
          const name = (/** @type {any} */(d))?.name || id;
          A.state.assignedUsers[id] = { name, email:'', initials:A.getInitials(name), selected:false };
        });
      }
    } catch (e) { console.error('Failed to load users/contacts', e); }
  };

  /**
   * Liefert die IDs der aktuell ausgewählten Personen.
   * @returns {string[]} Array von Personen-IDs
   */
  A.getAssignedIds = function () {
    return Object.entries(A.state.assignedUsers).filter(([,u])=>u.selected).map(([id])=>id);
  };

  // ───────────── Subtasks (UI + Edit) ─────────────

  /**
   * Stellt einmalig Inline-Styles für die Subtask-Eingabe bereit
   * (X/✓-Buttons im Input).
   * @returns {void}
   */
  function ensureInlineStyles() {
    if (document.getElementById('subtask-inline-styles')) return;
    const s=document.createElement('style'); s.id='subtask-inline-styles'; s.textContent=`
      .input-icon-subtask{position:relative;}
      .subtask-inline-actions{position:absolute;inset-inline-end:8px;top:50%;transform:translateY(-50%);display:none;gap:8px;align-items:center;}
      .subtask-inline-actions .inline-btn{border:none;background:transparent;padding:4px;line-height:1;cursor:pointer;border-radius:8px;}
      .subtask-inline-actions .inline-btn:hover{background:#f1f1f1;outline:1px solid #dcdcdc;}`;
    document.head.appendChild(s);
  }

  /**
   * Baut ein Subtask-Listen-Item nach dem Bearbeiten wieder auf
   * (setzt Text, Aktionen & Entfernen-Logik).
   * @param {HTMLLIElement} li
   * @param {string} text
   * @param {Subtask} subtaskObj
   * @returns {void}
   */
  function rebuildSubtaskLi(li, text, subtaskObj) {
    subtaskObj.title = text; li.classList.remove('editing');
    li.innerHTML = `
      <span class="subtask-title">${A.escapeHtml(text)}</span>
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
      if (idx>-1) A.state.subtasks.splice(idx,1); li.remove();
    });
  }

  /**
   * Erzeugt die Inline-Editrow (Input + OK/Cancel) für Subtasks.
   * @param {string} oldValue  Aktueller Subtask-Text
   * @returns {{row:HTMLDivElement,input:HTMLInputElement,btnOk:HTMLButtonElement,btnCancel:HTMLButtonElement}}
   */
  function buildEditRow(oldValue) {
    const row=document.createElement('div'); row.className='subtask-edit-box';
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

  /**
   * Startet das Inline-Editing eines Subtasks (Enter = Save, Esc = Cancel).
   * @param {HTMLLIElement} li
   * @param {Subtask} subtaskObj
   * @returns {void}
   */
  function editSubtask(li, subtaskObj) {
    const old=subtaskObj.title; li.classList.add('editing');
    const {row,input,btnOk,btnCancel}=buildEditRow(old);
    li.innerHTML=''; li.appendChild(row);
    const save=()=>rebuildSubtaskLi(li, input.value.trim()||old, subtaskObj);
    const cancel=()=>rebuildSubtaskLi(li, old, subtaskObj);
    btnOk.addEventListener('click',save); btnCancel.addEventListener('click',cancel);
    input.addEventListener('keydown',e=>{ if(e.key==='Enter')save(); if(e.key==='Escape')cancel(); });
    input.addEventListener('blur',save); input.focus(); input.select();
  }

  /**
   * Fügt ein neues Subtask-Listen-Item hinzu (mit Aktionen).
   * @param {string} value                 Text des Subtasks
   * @param {HTMLUListElement} list        UL-Container
   * @param {Subtask} obj                  zugehöriges Subtask-Objekt im State
   * @returns {void}
   */
  function createSubtaskLi(value, list, obj) {
    const li=document.createElement('li'); li.classList.add('subtask-item');
    li.innerHTML = `
      <span class="subtask-title">${A.escapeHtml(value)}</span>
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
    li.querySelector('.subtask-delete-btn')?.addEventListener('click',()=>{ const idx=Array.from(list.children).indexOf(li); if(idx>-1) A.state.subtasks.splice(idx,1); li.remove(); });
  }

  /**
   * Verdrahtet die Subtask-Eingabe (Inline-Buttons, Enter-Add, Hover-Actions).
   * @returns {void}
   */
  A.attachSubtaskUI = function () {
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

    /** Fügt das aktuelle Input-Value als Subtask hinzu. */
    function addSub(){
      const v=input.value.trim(); if(!v) return;
      const obj=/** @type {Subtask} */({title:v,done:false});
      A.state.subtasks.push(obj);
      createSubtaskLi(v,list,obj);
      input.value='';
    }

    input.addEventListener('focus',showInline);
    input.addEventListener('input',showInline);
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addSub(); hideInline(); input.focus(); }});
    input.addEventListener('blur',()=>setTimeout(()=>{ const inside=document.activeElement instanceof Node && wrap?.contains(document.activeElement); if(!inside && !input.value.trim()) hideInline(); },0));
    addBtn?.addEventListener('click',addSub);
    clearBtn?.addEventListener('click',()=>{ input.value=''; clearBtn.style.display='none'; });
  };

  // ───────────── Toast & Clear ─────────────

  /**
   * Zeigt einen kleinen „Task created“-Bild-Toast in der Mitte an.
   * @returns {void}
   */
  A.showToast = function () {
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
  };

  /**
   * Setzt alle Form-Eingaben (Titel, Beschreibung, Datum, Kategorie)
   * und Fehlerklassen zurück.
   * @returns {void}
   */
  function resetInputs() {
    const t=/** @type {HTMLInputElement|null} */(document.getElementById('title'));
    const d=/** @type {HTMLTextAreaElement|null} */(document.getElementById('description'));
    const du=/** @type {HTMLInputElement|null} */(document.getElementById('due'));
    if(t)t.value=''; if(d)d.value=''; if(du)du.value='';
    const cat=/** @type {HTMLSelectElement|null} */(document.getElementById('category'));
    if(cat){ cat.selectedIndex=0; cat.dispatchEvent(new Event('change',{bubbles:true})); }
    ['title','due','category'].forEach(id=>document.getElementById(id)?.classList.remove('field-invalid'));
  }

  /**
   * Hebt alle „Assigned to“-Auswahlen auf, versteckt das Dropdown und
   * leert die Subtask-Liste samt Eingabe.
   * @returns {void}
   */
  function resetAssignedAndSubtasks() {
    Object.values(A.state.assignedUsers).forEach(u=>u.selected=false);
    A.renderAssignedDropdown(/** @type {HTMLDivElement|null} */(document.getElementById('assignedDropdown')));
    A.renderAssignedBadges(/** @type {HTMLDivElement|null} */(document.getElementById('assignedBadges')));
    document.getElementById('assignedDropdown')?.classList.add('hidden');
    A.state.subtasks = [];
    const list=/** @type {HTMLUListElement|null} */(document.getElementById('subtask-list')); if(list) list.innerHTML='';
    const inpt=/** @type {HTMLInputElement|null} */(document.querySelector('.input-icon-subtask input')); if(inpt) inpt.value='';
    const clearX=/** @type {HTMLButtonElement|null} */(document.querySelector('.clear-subtask-input')); if(clearX) clearX.style.display='none';
  }

  /**
   * Setzt das komplette Add-Task-Formular zurück
   * (Inputs, Priority-Buttons, Assigned, Subtasks).
   * @returns {void}
   */
  A.clearForm = function () {
    resetInputs();
    A.initPriorityButtons(/** @type {HTMLDivElement|null} */(document.querySelector('.priority-buttons')));
    resetAssignedAndSubtasks();
  };

})(window);