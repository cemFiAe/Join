// @ts-check
/* global firebase */ // (nur für Konsistenz, hier ungenutzt)
/// <reference path="./boardTypesD.ts" />

/**
 * Board.Core – gemeinsame UI-/Form-Utilities für die Board-Seiten.
 * Export: `window.Board.Core`
 */
(function (w) {
  /** @type {any} */ const Win = w;
  Win.Board = Win.Board || {};

  // ────────────────────────────────────────────────────────── CSS Snippets
  const VALIDATION_CSS = `
    .field-invalid{border:2px solid #E74C3C!important;background:#fffafa;}
    .form-group .field-hint{display:none;color:#E74C3C;font-size:.9rem;}
    .form-group .field-hint.show{display:block;}
  `;
  const TOAST_CSS = `
    @keyframes boardToastIn{0%{top:100%;transform:translate(-50%,0)}100%{top:50%;transform:translate(-50%,-50%)}}
    @keyframes boardToastOut{0%{top:50%;transform:translate(-50%,-50%)}100%{top:100%;transform:translate(-50%,0);opacity:0}}
    #boardAddToast{position:fixed;left:50%;top:100%;transform:translate(-50%,0);z-index:99999;background:transparent;pointer-events:none}
    #boardAddToast img{display:block;width:300px;height:auto}
    #boardAddToast.enter{animation:boardToastIn .55s cubic-bezier(.2,.8,.2,1) forwards}
    #boardAddToast.leave{animation:boardToastOut .5s ease forwards}
  `;

  // ────────────────────────────────────────────────────────── Small helpers
  /**
   * Style-Block mit ID sicherstellen.
   * @param {string} id
   * @param {string} css
   * @returns {HTMLStyleElement}
   */
  function ensureStyle(id, css) {
    let s = /** @type {HTMLStyleElement|null} */ (document.getElementById(id));
    if (!s) { s = document.createElement('style'); s.id = id; document.head.appendChild(s); }
    s.textContent = css; return s;
  }

  /**
   * Erstellt (falls nötig) das Toast-Element.
   * @returns {HTMLElement}
   */
  function ensureToastEl() {
    let el = document.getElementById('boardAddToast');
    if (!el) { el = document.createElement('div'); el.id = 'boardAddToast'; el.innerHTML = `<img src="../assets/icons/add_task/board_white.png" alt="">`; document.body.appendChild(el); }
    return el;
  }

  /**
   * CSS-Animation neu triggern (Klasse entfernen/erzwingen/hinzufügen).
   * @param {HTMLElement} el
   * @param {string[]} remove
   * @param {string} add
   */
  function retriggerAnim(el, remove, add) {
    remove.forEach(c => el.classList.remove(c));
    // @ts-ignore – Reflow erzwingen
    void el.offsetWidth;
    el.classList.add(add);
  }

  // ────────────────────────────────────────────────────────── Styles / Validation
  /**
   * Minimal-Styles für Custom-Validation injizieren.
   * @returns {void}
   */
  function ensureValidationStyles() { ensureStyle('custom-validation-styles', VALIDATION_CSS); }

  /**
   * HTML-Escaping für Nutzereingaben (XSS-Schutz).
   * @param {any} s
   * @returns {string}
   */
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /**
   * Heutiges Datum (lokale TZ) als `YYYY-MM-DD`.
   * @returns {string}
   */
  const todayLocalISO = () => { const off = new Date().getTimezoneOffset() * 60000; return new Date(Date.now() - off).toISOString().slice(0,10); };

  /**
   * Setzt `min`-Attribut eines Date-Inputs auf „heute“.
   * @param {string} selector
   * @returns {void}
   */
  function setDateMinToday(selector) {
    const el = /** @type {HTMLElement|null} */ (document.querySelector(selector));
    if (el) el.setAttribute('min', todayLocalISO());
  }

  /**
   * Nächstliegende `.form-group` holen (Fallback: Parent).
   * @param {HTMLElement | null | undefined} el
   * @returns {HTMLElement | null}
   */
  const getFormGroup = (el) =>
    (el && ('closest' in el) ? /** @type {HTMLElement|null} */ (el.closest('.form-group')) : null) ||
    (el ? /** @type {HTMLElement|null} */ (el.parentElement) : null);

  /**
   * `.field-hint` unterhalb der `.form-group` sicherstellen.
   * @param {HTMLElement | null | undefined} el
   * @returns {HTMLElement | null}
   */
  function ensureHintFor(el) {
    const grp = getFormGroup(el); if (!grp) return null;
    let hint = /** @type {HTMLElement|null} */ (grp.querySelector('.field-hint'));
    if (!hint) { hint = document.createElement('small'); hint.className = 'field-hint'; hint.textContent = 'This field is required'; grp.appendChild(hint); }
    return hint;
  }

  /**
   * Feld als invalid markieren (Border, aria, Hint).
   * @param {HTMLElement | null | undefined} el
   * @returns {void}
   */
  function markInvalid(el) {
    if (!el) return;
    el.classList.add('field-invalid'); el.setAttribute('aria-invalid','true');
    ensureHintFor(el)?.classList.add('show');
  }

  /**
   * Invalid-UI entfernen.
   * @param {HTMLElement | null | undefined} el
   * @returns {void}
   */
  function clearInvalidUI(el) {
    if (!el) return;
    el.classList.remove('field-invalid'); el.removeAttribute('aria-invalid');
    getFormGroup(el)?.querySelector('.field-hint')?.classList.remove('show');
  }

  // ────────────────────────────────────────────────────────── Toast
  /** Persistenter Timer für den Board-Toast. */
  let boardToastTimer = /** @type {number | undefined} */ (undefined);

  /**
   * Zeigt einen bildbasierten Slide-Toast (Board).
   * @returns {void}
   */
  function showBoardAddToast() {
    ensureStyle('board-add-toast-style', TOAST_CSS);
    const el = ensureToastEl();
    retriggerAnim(el, ['leave','enter'], 'enter');
    if (boardToastTimer) clearTimeout(boardToastTimer);
    boardToastTimer = window.setTimeout(() => {
      el.classList.remove('enter'); el.classList.add('leave');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 1200);
  }

  // ────────────────────────────────────────────────────────── Error dialog
  /**
   * Zentraler Fehlerdialog (Fallback: alert).
   * @param {string} message
   * @returns {void}
   */
  function showErrorDialog(message) {
    const dlg = document.getElementById('errorDialog');
    if (dlg instanceof HTMLDialogElement) {
      const p = dlg.querySelector('p'); if (p) p.textContent = message;
      if (!dlg.open) dlg.showModal();
    } else { alert(message); }
  }

  // ────────────────────────────────────────────────────────── Export
  Win.Board.Core = {
    ensureValidationStyles,
    escapeHtml,
    todayLocalISO,
    setDateMinToday,
    getFormGroup,
    ensureHintFor,
    markInvalid,
    clearInvalidUI,
    showBoardAddToast,
    showErrorDialog,
  };
})(window);
