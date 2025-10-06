// @ts-check
/* global firebase */ // (wird hier nicht genutzt, bleibt nur für Konsistenz)
/// <reference path="./boardTypesD.ts" />

/**
 * @fileoverview
 * Bridge/Kompatibilitätsschicht für ältere globale Funktionen der Board-Seite.
 *
 * Neue Implementierungen leben unter `window.Board.Assigned`. Älterer Code
 * erwartet jedoch globale Funktionen:
 *   - `window.initAssignedDropdown()`
 *   - `window.__boardGetSelectedAssigned()` → string[]
 *   - `window.__boardResetAssigned()`
 *
 * Dieses Skript spiegelt – sobald DOM verfügbar ist – die Methoden
 * von `Board.Assigned` auf die oben genannten globalen Funktionen.
 * Wenn `Board.Assigned` (noch) nicht existiert, passiert nichts.
 */

(function bridgeLegacyAssigned(w) {
  /**
   * Window als `any` casten, damit Properties ohne TS-Fehler gesetzt
   * werden können.
   * @type {any}
   */
  const Win = w;
  Win.Board = Win.Board || {};

  /**
   * Spiegelt (falls vorhanden) die API aus `Board.Assigned` auf globale
   * Funktionen für Legacy-Aufrufer.
   *
   * Erstellt/überschreibt folgende Globals:
   * - `window.initAssignedDropdown: () => void`
   * - `window.__boardGetSelectedAssigned: () => string[]`
   * - `window.__boardResetAssigned: () => void`
   *
   * Führt **keine** Seiteneffekte aus, wenn `Board.Assigned` nicht existiert.
   *
   * @returns {void}
   */
  function exposeAssignedAPIs() {
    /** @type {any} */
    const B = Win.Board;
    if (B && B.Assigned) {
      // ▼ Legacy-Globals für bestehenden Code bereitstellen
      /** @global */
      Win.initAssignedDropdown = B.Assigned.initAssignedDropdown;   // () => void
      /** @global */
      Win.__boardGetSelectedAssigned = B.Assigned.getSelectedAssigned; // () => string[]
      /** @global */
      Win.__boardResetAssigned = B.Assigned.resetAssigned;          // () => void
    }
  }

  // Beim ersten passenden Zeitpunkt ausführen (DOM bereit oder sofort).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', exposeAssignedAPIs);
  } else {
    exposeAssignedAPIs();
  }
})(window);
