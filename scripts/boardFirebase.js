// @ts-check
/* global firebase */ // (wird hier nicht genutzt, bleibt nur für Konsistenz)
/// <reference path="./boardTypesD.ts" />

/**
 * Shim/Bridge für alte globale Funktionen der Board-Seite.
 *
 * Hintergrund:
 *  - Neue Implementierungen leben unter `window.Board.Assigned`.
 *  - Älterer Code erwartet globale Funktionen:
 *      - `window.initAssignedDropdown()`
 *      - `window.__boardGetSelectedAssigned()`
 *      - `window.__boardResetAssigned()`
 *  - Dieses Script spiegelt die Methoden von `Board.Assigned` auf die
 *    genannten Globalen, sobald DOM verfügbar ist.
 *
 * Es werden **keine** Seiteneffekte erzeugt, wenn `Board.Assigned`
 * (noch) nicht existiert; in diesem Fall passiert einfach nichts.
 */
(function (w) {
  /** Fenster als any, damit wir gefahrlos Properties setzen können. */
  /** @type {any} */
  const Win = w;
  Win.Board = Win.Board || {};

  /**
   * Spiegelt (falls vorhanden) die API aus `Board.Assigned` auf globale
   * Funktionen für Legacy-Aufrufer.
   *
   * - `window.initAssignedDropdown: () => void`
   * - `window.__boardGetSelectedAssigned: () => string[]`
   * - `window.__boardResetAssigned: () => void`
   *
   * @returns {void}
   */
  function exposeAssignedAPIs() {
    /** @type {any} */
    const B = Win.Board;
    if (B && B.Assigned) {
      // ▼ Legacy-Globals für bestehenden Code bereitstellen
      Win.initAssignedDropdown        = B.Assigned.initAssignedDropdown;   // () => void
      Win.__boardGetSelectedAssigned  = B.Assigned.getSelectedAssigned;    // () => string[]
      Win.__boardResetAssigned        = B.Assigned.resetAssigned;          // () => void
    }
  }

  // Beim ersten passenden Zeitpunkt ausführen.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', exposeAssignedAPIs);
  } else {
    exposeAssignedAPIs();
  }
})(window);
