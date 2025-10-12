/**
 * Board.Core – shared UI / form utilities for Board pages
 * Export: `window.Board.Core`
 */
const Win = /** @type {any} */ (window);
Win.Board = Win.Board || {};

// ────────────────────────────────────────── CSS Snippets
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

// ────────────────────────────────────────── Small helpers

/**
 * Ensures a <style> element with the given ID exists and applies CSS to it.
 * @param {string} id - The ID for the style element.
 * @param {string} css - The CSS string to insert into the style element.
 * @returns {HTMLStyleElement} The created or existing style element.
 */
function ensureStyle(id, css) {
  let s = /** @type {HTMLStyleElement|null} */ (document.getElementById(id));
  if (!s) { s = document.createElement('style'); s.id = id; document.head.appendChild(s); }
  s.textContent = css; 
  return s;
}

/**
 * Ensures the toast element for board add animation exists in the DOM.
 * @returns {HTMLElement} The toast element.
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
 * Retriggers a CSS animation by removing and adding classes to an element.
 * @param {HTMLElement} el - The element to animate.
 * @param {string[]} remove - Array of class names to remove.
 * @param {string} add - Class name to add to trigger the animation.
 */
function retriggerAnim(el, remove, add) {
  remove.forEach(c => el.classList.remove(c));
  // @ts-ignore – force reflow
  void el.offsetWidth;
  el.classList.add(add);
}

// ────────────────────────────────────────── Styles / Validation

/**
 * Injects custom validation CSS into the document if not already present.
 */
function ensureValidationStyles() { ensureStyle('custom-validation-styles', VALIDATION_CSS); }

/**
 * Escapes special HTML characters to prevent injection.
 * @param {string} s - The string to escape.
 * @returns {string} The escaped HTML string.
 */
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/**
 * Returns the current date in local ISO format (YYYY-MM-DD).
 * @returns {string} The local ISO date string.
 */
const todayLocalISO = () => {
  const off = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - off).toISOString().slice(0,10);
};

/**
 * Sets the "min" attribute of an input element to today's date.
 * @param {string} selector - CSS selector for the input element.
 */
function setDateMinToday(selector) {
  const el = /** @type {HTMLElement|null} */ (document.querySelector(selector));
  if (el) el.setAttribute('min', todayLocalISO());
}

/**
 * Returns the closest form group element containing the given element.
 * @param {HTMLElement | null} el - The element to find the form group for.
 * @returns {HTMLElement | null} The closest form group or parent element.
 */
const getFormGroup = (el) =>
  (el && ('closest' in el) ? /** @type {HTMLElement|null} */ (el.closest('.form-group')) : null) ||
  (el ? /** @type {HTMLElement|null} */ (el.parentElement) : null);

/**
 * Ensures a field hint element exists for a given input within its form group.
 * @param {HTMLElement} el - The input element to attach the hint to.
 * @returns {HTMLElement | null} The hint element.
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
 * Marks an input field as invalid and shows its hint.
 * @param {HTMLElement} el - The input element to mark.
 */
function markInvalid(el) {
  if (!el) return;
  el.classList.add('field-invalid');
  el.setAttribute('aria-invalid','true');
  ensureHintFor(el)?.classList.add('show');
}

/**
 * Clears invalid styling and hides hint for a given input field.
 * @param {HTMLElement} el - The input element to clear.
 */
function clearInvalidUI(el) {
  if (!el) return;
  el.classList.remove('field-invalid');
  el.removeAttribute('aria-invalid');
  getFormGroup(el)?.querySelector('.field-hint')?.classList.remove('show');
}

// ────────────────────────────────────────── Toast

let boardToastTimer = /** @type {number | undefined} */ (undefined);

/**
 * Displays a brief board "task added" toast animation with auto-hide.
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

// ────────────────────────────────────────── Error dialog

/**
 * Displays an error dialog with a given message.
 * Falls back to alert() if the dialog element is not found.
 * @param {string} message - The error message to display.
 */
function showErrorDialog(message) {
  const dlg = document.getElementById('errorDialog');
  if (dlg instanceof HTMLDialogElement) {
    const p = dlg.querySelector('p'); if (p) p.textContent = message;
    if (!dlg.open) dlg.showModal();
  } else { alert(message); }
}

// ────────────────────────────────────────── Export
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