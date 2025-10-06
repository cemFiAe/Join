// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * Board.Detail – orchestriert den Task-Detail-Dialog (View + Edit).
 * Abhängigkeiten: Board.DetailUtil (U), Board.Assigned (Assigned)
 */
(function (w) {
  /** @type {any} */ const Win = w;
  Win.Board = Win.Board || {};
  /** @type {any} */ const Assigned = Win.Board.Assigned;
  /** @type {any} */ const U = Win.Board.DetailUtil;

  /** @typedef {"urgent"|"medium"|"low"} TaskPriority */
  /** @typedef {{title:string,done:boolean}} Subtask */
  /** @typedef {{ id:string, title?:string, description?:string, category?:string, dueDate?:string, priority?:TaskPriority, status:string, assignedTo?:string[]|string, subtasks?:Subtask[] }} Task */

  // ────────────────────────────────────────────────────────── View builders

  /**
   * Erzeugt das HTML der Read-Only-Ansicht (Task-Details).
   * @param {Task} t - Der Task, der angezeigt werden soll.
   * @returns {string} Markup der Detailansicht.
   */
  function buildViewHTML(t) {
    /** @type {Record<TaskPriority,string>} */
    const pr = { urgent: 'prio_top.svg', medium: 'prio_mid.svg', low: 'prio_low.svg' };
    const prIcon = pr[t.priority || 'medium'];
    const prLabel = (t.priority || 'medium').replace(/^\w/, c => c.toUpperCase());
    const catCls = U.getDetailCategoryClass(t.category);

    // Assigned-Liste rendern
    const ass = (Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo])
      .filter(Boolean)
      .map(uid =>
        `<div class="assigned-user">${
          Assigned?.getProfileBadge?.(String(uid)) || ''
        }<span class="assigned-user-name">${
          Assigned?.getPersonData?.(String(uid))?.name || ''
        }</span></div>`
      ).join('');

    // Subtasks rendern
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

  /**
   * Erzeugt das HTML der Edit-Ansicht (Formular zum Bearbeiten).
   * @param {Task} t - Der Task, der editiert wird.
   * @returns {string} Markup der Edit-Ansicht.
   */
  function buildEditHTML(t) {
    const catCls = U.getDetailCategoryClass(t.category);
    /** @param {TaskPriority} p */ const def = (p) => (t.priority || 'medium') === p ? ' active' : '';
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

  // ────────────────────────────────────────────────────────── Small wiring

  /**
   * Verdrahtet die Read-Only-Ansicht (Subtask-Toggle, Edit/Delete/Close).
   * @param {HTMLDivElement} body - Container des Detail-Dialogs.
   * @param {Task} task - Aktueller Task.
   * @param {HTMLDialogElement} dlg - Dialog-Element.
   * @param {() => void} toEdit - Callback, um in den Edit-Modus zu wechseln.
   * @returns {void}
   */
  function wireView(body, task, dlg, toEdit) {
    // Subtasks toggeln → DB sync
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
  /**
   * Setzt Min-Datum (lokale Zeitzone) auf das Due-Date-Feld in der Edit-Ansicht
   * und verhindert Rückdatierung.
   * @param {HTMLDivElement} body - Container des Detail-Dialogs.
   * @returns {void}
   */
  function setMinDate(body) {
    const el = /** @type {HTMLInputElement|null} */ (body.querySelector('#editDueDate'));
    if (!el) return;
    const off = new Date().getTimezoneOffset() * 60000;
    el.min = new Date(Date.now()-off).toISOString().slice(0,10);
    el.addEventListener('input', () => { if (el.value && el.value < el.min) el.value = el.min; });
  }
  /**
   * Verdrahtet die Priority-Buttons im Edit-Formular.
   * @param {HTMLDivElement} body - Container des Detail-Dialogs.
   * @param {TaskPriority} current - aktuelle (vorbelegte) Priorität.
   * @returns {TaskPriority} Liefert die (mutable) Variable mit aktueller Auswahl zurück.
   */
  function wirePrioButtons(body, current) {
    /** @type {TaskPriority} */ let prio = /** @type {TaskPriority} */ (current || 'medium');
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
  /**
   * Baut eine lokale „Assigned“-Struktur (Users + Contacts) mit Vorselektion.
   * @param {Task} task - Task mit ggf. vorhandenen Zuordnungen.
   * @returns {Record<string,{name:string;email?:string;initials:string;selected:boolean}>}
   */
  function buildLocalAssign(task) {
    const allU = /** @type {Record<string,{name?:string;email?:string}>} */(Win.allUsers||{});
    const allC = /** @type {Record<string,{name?:string;email?:string}>} */(Win.allContacts||{});
    const pre = Array.isArray(task.assignedTo) ? task.assignedTo.map(String)
      : (task.assignedTo?[String(task.assignedTo)]:[]);
    const toIni = (n)=>n.split(' ').slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('');
    /** @type {Record<string,{name:string;email?:string;initials:string;selected:boolean}>} */
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
  /**
   * Rendert die Badge-Leiste (max. 4 + „+N“).
   * @param {Record<string,{name:string;email?:string;initials:string;selected:boolean}>} local
   * @param {HTMLDivElement} bad - Zielcontainer für die Badges.
   * @returns {void}
   */
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
  /**
   * Rendert die Optionsliste des „Assigned“-Dropdowns (alphabetisch, Scrollpos bleibt).
   * @param {Record<string,{name:string;email?:string;initials:string;selected:boolean}>} local
   * @param {HTMLDivElement} dd - Dropdown-Container.
   * @returns {void}
   */
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

        /** @param {Event} ev */
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
  /**
   * Verdrahtet Select-Box, Dropdown und Badges für „Assigned to“ in der Edit-Ansicht.
   * @param {HTMLDivElement} body - Dialog-Body.
   * @param {Record<string,{name:string;email?:string;initials:string;selected:boolean}>} local
   * @returns {void}
   */
  function wireAssign(body, local) {
    const sel = /** @type {HTMLDivElement} */ (body.querySelector('#editAssignedSelectBox'));
    const dd  = /** @type {HTMLDivElement} */ (body.querySelector('#editAssignedDropdown'));
    const bad = /** @type {HTMLDivElement} */ (body.querySelector('#editAssignedBadges'));

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
  /**
   * Verdrahtet den Save-Handler für das Edit-Formular (speichert in Firebase).
   * @param {HTMLDivElement} body - Dialog-Body.
   * @param {Task} task - Aktueller Task.
   * @param {Record<string,{name:string;email?:string;initials:string;selected:boolean}>} local - Lokale Assigned-Daten.
   * @param {() => void} done - Callback nach erfolgreichem Speichern (z. B. zurück zur View).
   * @param {() => TaskPriority} getPrio - Getter für die aktuell gewählte Priorität.
   * @returns {void}
   */
  function wireSave(body, task, local, done, getPrio) {
    (/** @type {HTMLFormElement} */(body.querySelector('#editTaskForm'))).onsubmit = (e) => {
      e.preventDefault();
      const title=(/** @type {HTMLInputElement} */(body.querySelector('#editTitle'))).value.trim();
      const desc =(/** @type {HTMLTextAreaElement} */(body.querySelector('#editDescription'))).value.trim();
      const due  =(/** @type {HTMLInputElement} */(body.querySelector('#editDueDate'))).value.trim();
      const assigned=Object.entries(local).filter(([,u])=>u.selected).map(([id])=>id);
      const subs=(task.subtasks||[])
        .filter(st=>st && st.title && st.title.trim())
        .map(st=>({title:st.title.trim(),done:!!st.done}));

      firebase.database().ref('tasks/'+task.id).update({
        title, description:desc, dueDate:due, priority:getPrio(),
        assignedTo:assigned, subtasks:subs
      }).then(done);
    };
  }
  // ────────────────────────────────────────────────────────── Entry point
  /**
   * Öffnet den Task-Detail-Dialog (View + Edit) und rendert initial die View.
   * @param {Task} task - Task-Objekt, dessen Details angezeigt/editiert werden.
   * @returns {void}
   */
  function openTaskDetail(task) {
    const dlg = /** @type {HTMLDialogElement} */ (document.getElementById('taskDetailDialog'));
    const body = /** @type {HTMLDivElement} */ (document.getElementById('taskDetailBody'));

    /** Flag: Edit-Modus aktiv? */
    let isEditing = false;
    /** Aktuelle, vom User im Edit-Modus gewählte Priorität. */
    /** @type {TaskPriority} */
    let editPrio = /** @type {TaskPriority} */(task.priority||'medium');

    /**
     * Rendert die Read-Only-Ansicht und verdrahtet deren Events.
     * @returns {void}
     */
    const renderView = () => {
      body.innerHTML = buildViewHTML(task);
      wireView(body, task, dlg, () => { isEditing = true; render(); });
    };

    /**
     * Rendert die Edit-Ansicht und verdrahtet deren UI-/Speicher-Logik.
     * @returns {void}
     */
    const renderEdit = () => {
      body.innerHTML = buildEditHTML(task);
      setMinDate(body);
      editPrio = wirePrioButtons(body, editPrio);
      const local = buildLocalAssign(task);
      wireAssign(body, local);
      U.renderSubtasksEdit(/** @type {HTMLDivElement} */(body.querySelector('#edit-detail-subtasks')), task);
      (/** @type {HTMLButtonElement} */(body.querySelector('#closeTaskDetail'))).onclick = () => dlg.close();
      wireSave(body, task, local, () => { isEditing = false; render(); }, () => editPrio);
    };

    /**
     * Delegiert abhängig vom Modus zu View- oder Edit-Renderer.
     * @returns {void}
     */
    const render = () => (isEditing ? renderEdit() : renderView());

    render();
    dlg.showModal();
  }

  // Export
  Win.Board.Detail = { openTaskDetail };
})(window);
