// addTaskCore.js
// @ts-check

(function (w) {
  /** @typedef {{ title:string, done:boolean }} Subtask */
  /** @typedef {{name:string; initials:string; selected:boolean; email?:string}} AssignedUserEntry */

  // 👇 zuerst das Window-Objekt casten, dann benutzen
  const Win = /** @type {any} */ (w);
  const AddTask = Win.AddTask || {};
  Win.AddTask = AddTask;

  // ── State ────────────────────────────────────────────────────────────────
  AddTask.state = AddTask.state || {
    subtasks: /** @type {Subtask[]} */ ([]),
    /** @type {Record<string, AssignedUserEntry>} */ assignedUsers: {},
    currentUserEmail: (localStorage.getItem('currentUserEmail') || '').trim().toLowerCase(),
    priority: /** @type {'urgent'|'medium'|'low'|''} */ ('medium'),
  };

  // ── Utils ────────────────────────────────────────────────────────────────

  /**
   * Escaped einen String für die sichere HTML-Ausgabe (XSS-Schutz).
   * @param {any} s Beliebiger Wert, wird via `String(s)` konvertiert.
   * @returns {string} Entschärfter/escapeter String.
   */
  AddTask.escapeHtml = function (s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  };

  /**
   * Liefert das heutige Datum in lokaler Zeitzone als `YYYY-MM-DD`.
   * @returns {string} Datum (z. B. `2025-09-30`).
   */
  AddTask.todayLocalISO = function () {
    const off = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - off).toISOString().slice(0, 10);
  };

  /**
   * Injiziert einmalig minimale Styles für die Custom-Validation
   * (rote Umrandung & Hinweistext).
   * @returns {void}
   */
  AddTask.ensureValidationStyles = function () {
    if (document.getElementById('custom-validation-styles')) return;
    const s = document.createElement('style');
    s.id = 'custom-validation-styles';
    s.textContent = `
      .field-invalid{border:2px solid #E74C3C!important;background:#fffafa;}
      .form-group .field-hint{display:none;color:#E74C3C;font-size:.9rem;}
      .form-group .field-hint.show{display:block;}
    `;
    document.head.appendChild(s);
  };

  /**
   * Setzt das `min`-Attribut eines Date-Inputs auf „heute“ (lokale TZ).
   * @param {string|HTMLInputElement|null|undefined} selectorOrInput
   *  CSS-Selector oder bereits referenziertes Input-Element.
   * @returns {void}
   */
  AddTask.setDateMinToday = function (selectorOrInput) {
    const el = typeof selectorOrInput === 'string'
      ? /** @type {HTMLInputElement|null} */ (document.querySelector(selectorOrInput))
      : /** @type {HTMLInputElement|null} */ (selectorOrInput);
    if (el) el.setAttribute('min', AddTask.todayLocalISO());
  };

  /**
   * Erzeugt Initialen (max. 2 Buchstaben) aus einem Namen.
   * @param {string} name Vollständiger Name.
   * @returns {string} Initialen, z. B. "JD".
   */
  AddTask.getInitials = function (name) {
    return name.split(' ').slice(0,2).map(n=>n[0]?.toUpperCase()||'').join('');
  };

  /**
   * Erzeugt deterministisch eine HSL-Farbe aus einem String.
   * @param {string} str Beliebiger String (z. B. Name).
   * @returns {string} CSS-Farbwert, z. B. `hsl(210,70%,50%)`.
   */
  AddTask.colorFromString = function (str) {
    let h = 0; for (let i=0;i<str.length;i++) h = str.charCodeAt(i)+((h<<5)-h);
    return `hsl(${h%360},70%,50%)`;
  };

  // ── Kategorien / Priority ────────────────────────────────────────────────

  /**
   * Füllt das Category-Select mit vordefinierten Werten.
   * @param {HTMLSelectElement|null|undefined} selectEl Ziel-Select.
   * @returns {void}
   */
  AddTask.fillCategories = function (selectEl) {
    if (!selectEl) return;
    const cats = ["Technical Task","User Story","Bug","Research"];
    selectEl.innerHTML = '<option value="">Select task category</option>';
    cats.forEach(c => (selectEl.innerHTML += `<option value="${c}">${c}</option>`));
  };

  /**
   * Setzt den „active“-Zustand eines Priority-Buttons und aktualisiert den State.
   * Interne Hilfsfunktion; wird von `initPriorityButtons` benutzt.
   * @param {HTMLDivElement|null|undefined} container Wrapper mit den Buttons.
   * @param {HTMLButtonElement} btn Der geklickte Button.
   * @param {NodeListOf<HTMLButtonElement>} buttons Alle Buttons (zum Deaktivieren).
   * @returns {void}
   */
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
    AddTask.state.priority = (p==='urgent'||p==='medium'||p==='low') ? p : '';
    container?.classList.remove('field-invalid');
  }

  /**
   * Verdrahtet alle Priority-Buttons (setzt Klick-Handler und wählt
   * „Medium“ als Standard).
   * @param {HTMLDivElement|null|undefined} container Wrapper mit Buttons.
   * @returns {void}
   */
  AddTask.initPriorityButtons = function (container) {
    const buttons = /** @type {NodeListOf<HTMLButtonElement>} */(container?.querySelectorAll('.btn') ?? []);
    const medium  = /** @type {HTMLButtonElement|null} */(container?.querySelector('.btn.btn_medium') ?? null);
    buttons.forEach(b => b.addEventListener('click', () => setPrioActive(container, b, buttons)));
    if (medium) setPrioActive(container, medium, buttons);
  };

  // ── Validation (Custom) ──────────────────────────────────────────────────

  /**
   * Sucht die umgebende `.form-group` eines Elements.
   * @param {HTMLElement|null|undefined} el
   * @returns {HTMLElement|null} Gruppe oder Parent/Fallback.
   */
  function grp(el){ return el?.closest?.('.form-group') || el?.parentElement || null; }

  /**
   * Stellt sicher, dass ein `.field-hint` unterhalb der Gruppe existiert,
   * legt ihn ggf. an und gibt ihn zurück.
   * @param {HTMLElement|null|undefined} el
   * @returns {HTMLElement|null} Der Hinweis-Knoten oder `null`.
   */
  function ensureHint(el){
    const g=grp(el); if(!g)return null;
    let h=g.querySelector('.field-hint');
    if(!h){ h=document.createElement('small'); h.className='field-hint'; h.textContent='This field is required'; g.appendChild(h); }
    return /** @type {HTMLElement} */(h);
  }

  /**
   * Markiert ein Feld als ungültig (rote Border, `aria-invalid`, Hint sichtbar).
   * @param {HTMLElement|null|undefined} el
   * @returns {void}
   */
  function markInvalid(el){
    if(!el)return; el.classList.add('field-invalid'); el.setAttribute('aria-invalid','true');
    ensureHint(el)?.classList.add('show');
  }

  /**
   * Entfernt die Invalid-Darstellung (Border/aria/hint).
   * @param {HTMLElement|null|undefined} el
   * @returns {void}
   */
  function clearInvalid(el){
    if(!el)return; el.classList.remove('field-invalid'); el.removeAttribute('aria-invalid');
    grp(el)?.querySelector('.field-hint')?.classList.remove('show');
  }

  /**
   * Installiert Listener für Title/Due/Category und liefert
   * eine `validate()`-Funktion, die alle Custom-Checks ausführt.
   * @param {HTMLInputElement|null|undefined} titleEl     Titel-Input
   * @param {HTMLInputElement|null|undefined} dueEl       Date-Input (Due)
   * @param {HTMLSelectElement|null|undefined} categoryEl Kategorie-Select
   * @param {HTMLDivElement|null|undefined} priorityWrap  Wrapper der Priority-Buttons
   * @returns {{validate:()=>boolean, clearInvalid:(el:HTMLElement|null|undefined)=>void}}
   */
  AddTask.installFieldValidation = function (titleEl, dueEl, categoryEl, priorityWrap) {
    titleEl?.addEventListener('input',()=>clearInvalid(titleEl));
    dueEl?.addEventListener('input',()=>clearInvalid(dueEl));
    categoryEl?.addEventListener('change',()=>clearInvalid(categoryEl));

    /**
     * Prüft Titellänge, Due-Datum, Kategorie und gesetzte Priorität.
     * @returns {boolean} `true` wenn alles ok, sonst `false`.
     */
    function validate(){
      let ok=true, today=AddTask.todayLocalISO();
      if(!titleEl||titleEl.value.trim().length<2){ markInvalid(titleEl); ok=false; }
      if(!dueEl||!dueEl.value||dueEl.value<today){ markInvalid(dueEl); ok=false; }
      if(!categoryEl||!categoryEl.value){ markInvalid(categoryEl); ok=false; }
      if(!AddTask.state.priority){ priorityWrap?.classList.add('field-invalid'); ok=false; } else { priorityWrap?.classList.remove('field-invalid'); }
      return ok;
    }
    return { validate, clearInvalid };
  };

})(window);
