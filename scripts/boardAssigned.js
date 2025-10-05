// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/**
 * Board.Assigned – Personen-/„Assigned to“-Logik für das Board.
 * Lädt users/contacts, baut Dropdown & Badges und stellt Helper bereit.
 */
(function (w) {
  /** @type {any} */ const Win = w;
  Win.Board = Win.Board || {};
  /** @type {any} */ const Core = Win.Board.Core;

  // ───────────────────────────────────────────────────────── Types/State
  /** @typedef {{ name?: string; email?: string }} Person */
  /** @typedef {{ name: string; email?: string; initials: string; selected: boolean }} AssignedUserEntry */

  /** @type {Record<string, Person>} */  let users = {};
  /** @type {Record<string, Person>} */  let contacts = {};
  /** @type {Record<string, AssignedUserEntry>} */ let assignedUsers = {};
  /** @type {HTMLDivElement|null} */ let dd = null, badges = null, selectBox = null;

  const currentUserEmail = (localStorage.getItem('currentUserEmail') || '').toLowerCase();

  // ───────────────────────────────────────────────────────── Helpers
  /** @param {string} s */ const generateColorFromString = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return `hsl(${h % 360},70%,50%)`; };
  /** @param {string} n */ const initials = (n) => n.split(' ').slice(0, 2).map(x => x[0]?.toUpperCase() || '').join('');

  /** @param {string} id */ function getPersonData(id) { return users[id] || contacts[id] || null; }

  /** @param {string} id */ function getProfileBadge(id) {
    const p = getPersonData(id); const name = p?.name || id;
    const ini = initials(name); const color = generateColorFromString(name);
    return `<span class="profile-badge" style="background:${color};">${ini}</span>`;
  }

  // ───────────────────────────────────────────────────────── Rendering
  /** @param {AssignedUserEntry} u */ function appendBadge(u) {
    const b = document.createElement('div'); b.className = 'avatar-badge';
    b.textContent = u.initials; b.style.backgroundColor = generateColorFromString(u.name);
    badges?.appendChild(b);
  }
  /** @param {number} extra */ function appendMore(extra) {
    const m = document.createElement('div'); m.className = 'avatar-badge avatar-badge-more';
    m.textContent = `+${extra}`; badges?.appendChild(m);
  }

  /** Render Badges (max 4 + +N). */
  function renderAssignedBadges() {
    if (!badges) return; badges.innerHTML = '';
    const sel = Object.values(assignedUsers).filter(u => u.selected);
    sel.slice(0, 4).forEach(appendBadge);
    const extra = sel.length - 4; if (extra > 0) appendMore(extra);
  }

  const entriesSorted = () =>
    Object.entries(assignedUsers).sort(([, a], [, b]) => a.name.localeCompare(b.name));

  /** @param {AssignedUserEntry} u @param {number} keep */
  function buildOption(u, keep) {
    const opt = document.createElement('div');
    opt.className = 'custom-option' + (u.selected ? ' selected' : ''); opt.tabIndex = 0;
    const av = document.createElement('div'); av.className = 'custom-option-avatar';
    av.style.backgroundColor = generateColorFromString(u.name); av.textContent = u.initials;
    const lab = document.createElement('div'); lab.className = 'custom-option-label';
    lab.textContent = u.name + (((u.email || '').toLowerCase() === currentUserEmail) ? ' (You)' : '');
    const chk = document.createElement('div'); chk.className = 'custom-option-checkbox'; if (u.selected) chk.classList.add('checked');
    const toggle = (ev) => { ev.preventDefault(); ev.stopPropagation(); u.selected = !u.selected; renderAssignedDropdown(); renderAssignedBadges(); if (dd) dd.scrollTop = keep; };
    opt.addEventListener('pointerdown', toggle);
    opt.addEventListener('keydown', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') toggle(ev); });
    opt.append(av, lab, chk); return opt;
  }

  /** Dropdown rendern (alphabetisch, Scrollpos beibehalten). */
  function renderAssignedDropdown() {
    if (!dd) return; const keep = dd.scrollTop; dd.innerHTML = '';
    entriesSorted().forEach(([, u]) => dd.appendChild(buildOption(u, keep)));
    dd.scrollTop = keep;
  }

  // ───────────────────────────────────────────────────────── Init & API
  function resolveDom() {
    dd = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedDropdown'));
    badges = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedBadges'));
    selectBox = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedSelectBox'));
    return !!(dd && selectBox);
  }

  function mergePeople() {
    assignedUsers = {};
    Object.entries(users || {}).forEach(([id, u]) => {
      const name = u?.name || u?.email || id;
      assignedUsers[id] = { name, email: u?.email || '', initials: initials(name), selected: false };
    });
    Object.entries(contacts || {}).forEach(([id, c]) => {
      if (assignedUsers[id]) return; const name = c?.name || id;
      assignedUsers[id] = { name, initials: initials(name), selected: false };
    });
  }

  function setupToggleHandlers() {
    if (!selectBox || selectBox.dataset._wired === '1') return;
    selectBox.dataset._wired = '1'; let open = false;

    function openDropdown() {
      if (open) return; open = true;
      if (dd) { dd.classList.remove('hidden'); dd.style.display = 'block'; }
      setTimeout(() => {
        const off = (e) => {
          if (!(e.target instanceof Node)) return;
          if (selectBox?.parentElement?.contains(e.target)) return;
          closeDropdown(); document.removeEventListener('click', off, true);
        }; document.addEventListener('click', off, true);
      }, 0);
    }
    function closeDropdown() { if (!open) return; open = false; if (dd) { dd.classList.add('hidden'); dd.style.display = 'none'; } }
    const toggle = () => (open ? closeDropdown() : openDropdown());

    selectBox.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); });
    selectBox.addEventListener('click',       e => { e.preventDefault(); e.stopPropagation(); toggle(); });
    selectBox.addEventListener('keydown',     e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    dd?.addEventListener('click',  e => e.stopPropagation());
    dd?.addEventListener('keydown',e => { if (e.key === 'Escape') { e.preventDefault(); closeDropdown(); selectBox?.focus(); } });
  }

  /** Initialisiert das Assigned-Dropdown im Board-Overlay. */
  function initAssignedDropdown() {
    if (!resolveDom()) return;
    mergePeople(); renderAssignedDropdown(); renderAssignedBadges(); setupToggleHandlers();
  }

  /** Aktuell selektierte IDs. */  function getSelectedAssigned() { return Object.entries(assignedUsers).filter(([, u]) => u.selected).map(([id]) => id); }
  /** Auswahl zurücksetzen + UI. */ function resetAssigned() { Object.values(assignedUsers).forEach(u => (u.selected = false)); renderAssignedDropdown(); renderAssignedBadges(); dd?.classList.add('hidden'); }

  // ───────────────────────────────────────────────────────── Data load
  firebase.database().ref('users').once('value').then(s => {
    users = s.val() || {}; Win.allUsers = users;
    return firebase.database().ref('contacts').once('value');
  }).then(s => {
    contacts = s.val() || {}; Win.allContacts = contacts;
    initAssignedDropdown(); (Win.Board?.Render)?.startTasksStream?.();
  });

  // ───────────────────────────────────────────────────────── Export
  Win.Board.Assigned = {
    initAssignedDropdown,
    getSelectedAssigned,
    resetAssigned,
    getPersonData,
    getProfileBadge,
    generateColorFromString,
  };
})(window);
