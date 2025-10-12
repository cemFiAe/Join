/** @typedef {{ title:string, done:boolean }} Subtask */
/** @typedef {{ name:string, initials:string, selected:boolean, email?:string }} AssignedUserEntry */

const AddTask = window.AddTask || {};
window.AddTask = AddTask;

// ── State ───────────────────────────────────────────────
AddTask.state = AddTask.state || {
  subtasks: /** @type {Subtask[]} */ ([]),
  assignedUsers: /** @type {Record<string, AssignedUserEntry>} */ ({}),
  currentUserEmail: (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase(),
  priority: /** @type {'urgent'|'medium'|'low'|''} */ ('medium'),
};

// ── Utils ───────────────────────────────────────────────

/**
 * Escapes a string for safe HTML output (XSS protection).
 * @param {any} s Any value
 * @returns {string} Escaped string
 */
AddTask.escapeHtml = s => String(s).replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
);

/**
 * Returns today's date in local timezone as YYYY-MM-DD.
 * @returns {string} e.g., '2025-09-30'
 */
AddTask.todayLocalISO = () => {
  const off = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - off).toISOString().slice(0, 10);
};

/**
 * Injects minimal CSS for custom validation once.
 */
AddTask.ensureValidationStyles = () => {
  if (document.getElementById('custom-validation-styles')) return;
  const s = document.createElement('style'); s.id='custom-validation-styles';
  s.textContent=`
    .field-invalid{border:2px solid #E74C3C!important;background:#fffafa;}
    .form-group .field-hint{display:none;color:#E74C3C;font-size:.9rem;}
    .form-group .field-hint.show{display:block;}
  `;
  document.head.appendChild(s);
};

/**
 * Sets a date input's min attribute to today.
 * @param {string|HTMLInputElement|null|undefined} selectorOrInput
 */
AddTask.setDateMinToday = s => {
  const el = typeof s==='string'? document.querySelector(s):s;
  if(el) el.setAttribute('min', AddTask.todayLocalISO());
};

/**
 * Returns initials (max 2 letters) from a full name.
 * @param {string} name
 * @returns {string} e.g., 'JD'
 */
AddTask.getInitials = name => name.split(' ').slice(0,2).map(n=>n[0]?.toUpperCase()||'').join('');

/**
 * Deterministically returns HSL color from a string.
 * @param {string} str
 * @returns {string} CSS color, e.g., 'hsl(210,70%,50%)'
 */
AddTask.colorFromString = str => {
  let h=0; for(let i=0;i<str.length;i++) h=str.charCodeAt(i)+((h<<5)-h);
  return `hsl(${h%360},70%,50%)`;
};

// ── Categories / Priority ───────────────────────────────

/**
 * Fills a category select with predefined values.
 * @param {HTMLSelectElement|null|undefined} selectEl
 */
AddTask.fillCategories = selectEl => {
  if(!selectEl) return;
  const cats=["Technical Task","User Story","Bug","Research"];
  selectEl.innerHTML='<option value="">Select task category</option>';
  cats.forEach(c=>selectEl.innerHTML+=`<option value="${c}">${c}</option>`);
};

/**
 * Marks the clicked priority button active and updates state.
 * @param {HTMLDivElement|null|undefined} container
 * @param {HTMLButtonElement} btn
 * @param {NodeListOf<HTMLButtonElement>} buttons
 */
function setPrioActive(container, btn, buttons){
  buttons.forEach(b=>{
    b.classList.remove('active');
    const def=b.querySelector('.icon.default'), sel=b.querySelector('.icon.white');
    if(def && sel){ def.style.display=''; sel.style.display='none'; }
  });
  btn.classList.add('active');
  const def=btn.querySelector('.icon.default'), sel=btn.querySelector('.icon.white');
  if(def && sel){ def.style.display='none'; sel.style.display=''; }
  const p=(btn.dataset.priority||'').toLowerCase();
  AddTask.state.priority = (p==='urgent'||p==='medium'||p==='low')?p:'';
  container?.classList.remove('field-invalid');
}

/**
 * Initializes priority buttons with click handlers and defaults to Medium.
 * @param {HTMLDivElement|null|undefined} container
 */
AddTask.initPriorityButtons = container => {
  const buttons = container?.querySelectorAll('.btn') ?? [];
  const medium = container?.querySelector('.btn.btn_medium') ?? null;
  buttons.forEach(b=>b.addEventListener('click',()=>setPrioActive(container,b,buttons)));
  if(medium) setPrioActive(container,medium,buttons);
};

// ── Validation (Custom) ───────────────────────────────

/** @returns {HTMLElement|null} Form group wrapper */
function grp(el){ return el?.closest?.('.form-group') || el?.parentElement || null; }

/** Ensures a .field-hint exists below the element */
function ensureHint(el){
  const g=grp(el); if(!g)return null;
  let h=g.querySelector('.field-hint');
  if(!h){ h=document.createElement('small'); h.className='field-hint'; h.textContent='This field is required'; g.appendChild(h); }
  return h;
}

/** Marks a field invalid (border, aria-invalid, hint visible) */
function markInvalid(el){
  if(!el) return; el.classList.add('field-invalid'); el.setAttribute('aria-invalid','true');
  ensureHint(el)?.classList.add('show');
}

/** Clears invalid styling */
function clearInvalid(el){
  if(!el) return; el.classList.remove('field-invalid'); el.removeAttribute('aria-invalid');
  grp(el)?.querySelector('.field-hint')?.classList.remove('show');
}

/**
 * Installs listeners for Title/Due/Category and returns validate/clear functions.
 * @param {HTMLInputElement|null|undefined} titleEl
 * @param {HTMLInputElement|null|undefined} dueEl
 * @param {HTMLSelectElement|null|undefined} categoryEl
 * @param {HTMLDivElement|null|undefined} priorityWrap
 * @returns {{validate:()=>boolean, clearInvalid:(el:HTMLElement|null|undefined)=>void}}
 */
AddTask.installFieldValidation = (titleEl,dueEl,categoryEl,priorityWrap)=>{
  titleEl?.addEventListener('input',()=>clearInvalid(titleEl));
  dueEl?.addEventListener('input',()=>clearInvalid(dueEl));
  categoryEl?.addEventListener('change',()=>clearInvalid(categoryEl));

  /** Runs all custom validation checks */
  function validate(){
    let ok=true, today=AddTask.todayLocalISO();
    if(!titleEl||titleEl.value.trim().length<2){ markInvalid(titleEl); ok=false; }
    if(!dueEl||!dueEl.value||dueEl.value<today){ markInvalid(dueEl); ok=false; }
    if(!categoryEl||!categoryEl.value){ markInvalid(categoryEl); ok=false; }
    if(!AddTask.state.priority){ priorityWrap?.classList.add('field-invalid'); ok=false; }
    else priorityWrap?.classList.remove('field-invalid');
    return ok;
  }

  return { validate, clearInvalid };
};