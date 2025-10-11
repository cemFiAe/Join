// @ts-check
/* global firebase */ // (kept for consistency)
/// <reference path="./boardTypesD.ts" />

/**
 * Bridge/compatibility layer for older global functions of the Board page.
 * Exposes:
 *   - window.initAssignedDropdown()
 *   - window.__boardGetSelectedAssigned() → string[]
 *   - window.__boardResetAssigned()
 * 
 * Mirrors Board.Assigned if available. Does nothing if Board.Assigned is not defined.
 */

const Win = /** @type {any} */ (window);
Win.Board = Win.Board || {};

function exposeAssignedAPIs() {
  const B = Win.Board;
  if (B && B.Assigned) {
    /** @global */
    Win.initAssignedDropdown = B.Assigned.initAssignedDropdown;       // () => void
    /** @global */
    Win.__boardGetSelectedAssigned = B.Assigned.getSelectedAssigned;  // () => string[]
    /** @global */
    Win.__boardResetAssigned = B.Assigned.resetAssigned;             // () => void
  }
} // <-- function properly closed here

// Run when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', exposeAssignedAPIs);
} else {
  exposeAssignedAPIs();
}