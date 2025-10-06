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
   * Stellt einen <style>-Block mit fixer ID sicher und setzt den CSS-Inhalt.
   * @param {string} id   - DOM-ID des Style-Elements
   * @param {string} css  - CSS-Text, der in das Element geschrieben wird
   * @returns {HTMLStyleElement} Das (neu erstellte oder bestehende) Style-Element
   */
  function ensureStyle(id, css) {
    let s = /** @type {HTMLStyleElement|null} */ (document.getElementById(id));
    if (!s) { s = document.createElement('style'); s.id = id; document.head.appendChild(s); }
    s.textContent = css; return s;
  }

  /**
   * Stellt das Toast-Element für den Board-Toast sicher (lazy erstellt).
   * @returns {HTMLElement} Das Toast-Root-Element
   */
  function ensureToastEl() {
    let el = document.getElementById('boardAddToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'boardAddToast';
      el.innerHTML = `<img src="../assets/icons/add_task/board_white.png" alt="">`;
      document.body.appendChild(el);
    }
    return el;
  }

  /**
   * Triggert eine CSS-Animation neu, indem Klassen entfernt, Reflow erzwungen
   * und eine Ziel-Klasse hinzugefügt wird.
   * @param {HTMLElement} el   - Ziel-Element
   * @param {string[]} remove  - Klassen, die entfernt werden sollen
   * @param {string} add       - Klasse, die hinzugefügt wird
   * @returns {void}
   */
  function retriggerAnim(el, remove, add) {
    remove.forEach(c => el.classList.remove(c));
    // @ts-ignore – Reflow erzwingen
    void el.offsetWidth;
    el.classList.add(add);
  }

  // ────────────────────────────────────────────────────────── Styles / Validation

  /**
   * Injiziert minimale Styles für Custom-Validation (einmalig).
   * @returns {void}
   */
  function ensureValidationStyles() { ensureStyle('custom-validation-styles', VALIDATION_CSS); }

  /**
   * HTML-Entities escapen (XSS-Schutz) für beliebige Werte.
   * @param {any} s - beliebiger Wert, wird zu String konvertiert
   * @returns {string} escapeter String
   */
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /**
   * Liefert heutiges Datum in lokaler Zeitzone als `YYYY-MM-DD`.
   * @returns {string}
   */
  const todayLocalISO = () => {
    const off = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - off).toISOString().slice(0,10);
  };

  /**
   * Setzt das `min`-Attribut eines Date-Inputs (per Selector) auf „heute“.
   * @param {string} selector - CSS-Selector des Date-Inputs
   * @returns {void}
   */
  function setDateMinToday(selector) {
    const el = /** @type {HTMLElement|null} */ (document.querySelector(selector));
    if (el) el.setAttribute('min', todayLocalISO());
  }

  /**
   * Sucht die umgebende `.form-group` eines Elements, fallback: parentElement.
   * @param {HTMLElement | null | undefined} el
   * @returns {HTMLElement | null}
   */
  const getFormGroup = (el) =>
    (el && ('closest' in el) ? /** @type {HTMLElement|null} */ (el.closest('.form-group')) : null) ||
    (el ? /** @type {HTMLElement|null} */ (el.parentElement) : null);

  /**
   * Stellt einen `.field-hint`-Knoten innerhalb der `.form-group` sicher
   * und gibt ihn zurück.
   * @param {HTMLElement | null | undefined} el
   * @returns {HTMLElement | null}
   */
  function ensureHintFor(el) {
    const grp = getFormGroup(el); if (!grp) return null;
    let hint = /** @type {HTMLElement|null} */ (grp.querySelector('.field-hint'));
    if (!hint) {
      hint = document.createElement('small');
      hint.className = 'field-hint';
      hint.textContent = 'This field is required';
      grp.appendChild(hint);
    }
    return hint;
  }

  /**
   * Markiert ein Feld als ungültig (rote Border, aria-Attribut, Hint sichtbar).
   * @param {HTMLElement | null | undefined} el
   * @returns {void}
   */
  function markInvalid(el) {
    if (!el) return;
    el.classList.add('field-invalid');
    el.setAttribute('aria-invalid','true');
    ensureHintFor(el)?.classList.add('show');
  }

  /**
   * Entfernt Invalid-UI (Border/aria/hint) von einem Feld.
   * @param {HTMLElement | null | undefined} el
   * @returns {void}
   */
  function clearInvalidUI(el) {
    if (!el) return;
    el.classList.remove('field-invalid');
    el.removeAttribute('aria-invalid');
    getFormGroup(el)?.querySelector('.field-hint')?.classList.remove('show');
  }

  // ────────────────────────────────────────────────────────── Toast

  /** Persistenter Timer für den Board-Toast. */
  let boardToastTimer = /** @type {number | undefined} */ (undefined);

  /**
   * Zeigt den bildbasierten Slide-Toast („Task added“) mittig an
   * und blendet ihn automatisch wieder aus.
   * @returns {void}
   */
  function showBoardAddToast() {
    ensureStyle('board-add-toast-style', TOAST_CSS);
    const el = ensureToastEl();
    retriggerAnim(el, ['leave','enter'], 'enter');
    if (boardToastTimer) clearTimeout(boardToastTimer);
    boardToastTimer = window.setTimeout(() => {
      el.classList.remove('enter');
      el.classList.add('leave');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 1200);
  }

  // ────────────────────────────────────────────────────────── Error dialog

  /**
   * Zeigt einen zentralen Fehlerdialog (Fallback: alert) mit Nachricht.
   * Erwartet ein `<dialog id="errorDialog"><p>…</p></dialog>` im DOM.
   * @param {string} message - anzuzeigender Fehlertext
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
