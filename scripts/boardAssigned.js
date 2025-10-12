/**
 * Board.Assigned – People / "Assigned to" logic for the Board
 * Loads users/contacts, builds dropdown & badges, provides helpers
 */
const Win = /** @type {any} */ (window);
Win.Board = Win.Board || {};
const Core = Win.Board.Core;

// ────────────────────────────── Types/State
/** @typedef {{ name?: string; email?: string }} Person */
/** @typedef {{ name: string; email?: string; initials: string; selected: boolean }} AssignedUserEntry */

let users = {};
let contacts = {};
let assignedUsers = {};
let dd = null, badges = null, selectBox = null;

const currentUserEmail = (localStorage.getItem('currentUserEmail') || '').toLowerCase();

// ────────────────────────────── Helpers

/**
 * Deterministic HSL color based on a string
 * @param {string} s
 * @returns {string}
 */
function generateColorFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${h % 360},70%,50%)`;
}

/**
 * Get initials (max 2) from a name
 * @param {string} n
 * @returns {string}
 */
function initials(n) {
  return n.split(' ').slice(0, 2).map(x => x[0]?.toUpperCase() || '').join('');
}

/**
 * Get person data from users/contacts
 * @param {string} id
 * @returns {Person|null}
 */
function getPersonData(id) {
  return users[id] || contacts[id] || null;
}

/**
 * Build HTML for a round profile badge
 * @param {string} id
 * @returns {string}
 */
function getProfileBadge(id) {
  const p = getPersonData(id);
  const name = p?.name || id;
  const ini = initials(name);
  const color = generateColorFromString(name);
  return `<span class="profile-badge" style="background:${color};">${ini}</span>`;
}

// ────────────────────────────── Rendering

/**
 * Creates and appends an avatar badge element for a selected user.
 * @param {{ name: string, initials: string }} u - The user object containing name and initials.
 */
function appendBadge(u) {
  const b = document.createElement('div');
  b.className = 'avatar-badge';
  b.textContent = u.initials;
  b.style.backgroundColor = generateColorFromString(u.name);
  badges?.appendChild(b);
}

/**
 * Appends a "+N" badge when there are more than 4 assigned users.
 * @param {number} extra - The number of additional users beyond the visible badges.
 */
function appendMore(extra) {
  const m = document.createElement('div');
  m.className = 'avatar-badge avatar-badge-more';
  m.textContent = `+${extra}`;
  badges?.appendChild(m);
}

/**
 * Renders up to 4 assigned user badges and, if necessary, a "+N" badge
 * for any remaining selected users.
 */
function renderAssignedBadges() {
  if (!badges) return;
  badges.innerHTML = '';
  const sel = Object.values(assignedUsers).filter(u => u.selected);
  sel.slice(0, 4).forEach(appendBadge);
  const extra = sel.length - 4;
  if (extra > 0) appendMore(extra);
}

/**
 * Returns the assigned users as a sorted array of entries, ordered alphabetically by name.
 * @returns {[string, { name: string, initials: string, selected: boolean, email?: string }][]}
 * An array of key-value pairs representing user entries.
 */
function entriesSorted() {
  return Object.entries(assignedUsers).sort(([, a], [, b]) => a.name.localeCompare(b.name));
}

/**
 * Builds a selectable dropdown option element for an assigned user,
 * including avatar, name, and selection toggle behavior.
 * @param {{ name: string, initials: string, email?: string, selected: boolean }} u - The user object to render.
 * @param {number} keep - The current scroll position to maintain after re-render.
 * @returns {HTMLDivElement} The constructed option element.
 */
function buildOption(u, keep) {
  const opt = document.createElement('div');
  opt.className = 'custom-option' + (u.selected ? ' selected' : '');
  opt.tabIndex = 0;

  const av = buildOptionAvatar(u);
  const lab = buildOptionLabel(u);
  const chk = buildOptionCheckbox(u);

  attachOptionToggle(opt, u, keep);
  opt.append(av, lab, chk);
  return opt;
}

/** Builds the avatar element for a dropdown option */
function buildOptionAvatar(u) {
  const av = document.createElement('div');
  av.className = 'custom-option-avatar';
  av.style.backgroundColor = generateColorFromString(u.name);
  av.textContent = u.initials;
  return av;
}

/** Builds the label element for a dropdown option */
function buildOptionLabel(u) {
  const lab = document.createElement('div');
  lab.className = 'custom-option-label';
  lab.textContent = u.name + (((u.email || '').toLowerCase() === currentUserEmail) ? ' (You)' : '');
  return lab;
}

/** Builds the checkbox element for a dropdown option */
function buildOptionCheckbox(u) {
  const chk = document.createElement('div');
  chk.className = 'custom-option-checkbox';
  if (u.selected) chk.classList.add('checked');
  return chk;
}

/** Attaches click and keyboard toggle handlers to the option element */
function attachOptionToggle(opt, u, keep) {
  const toggle = (ev) => {
    ev.preventDefault(); ev.stopPropagation();
    u.selected = !u.selected;
    renderAssignedDropdown();
    renderAssignedBadges();
    if (dd) dd.scrollTop = keep;
  };
  opt.addEventListener('pointerdown', toggle);
  opt.addEventListener('keydown', ev => { if (ev.key === ' ' || ev.key === 'Enter') toggle(ev); });
}

/**
 * Renders the full “Assigned to” dropdown by sorting and displaying all user options.
 * Preserves scroll position during re-render.
 */
function renderAssignedDropdown() {
  if (!dd) return;
  const keep = dd.scrollTop;
  dd.innerHTML = '';
  entriesSorted().forEach(([, u]) => dd.appendChild(buildOption(u, keep)));
  dd.scrollTop = keep;
}

// ────────────────────────────── Init & API

/**
 * Resolves and caches references to key DOM elements used in the assigned user UI.
 * @returns {boolean} True if all required elements were found, otherwise false.
 */
function resolveDom() {
  dd = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedDropdown'));
  badges = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedBadges'));
  selectBox = /** @type {HTMLDivElement|null} */ (document.getElementById('assignedSelectBox'));
  return !!(dd && selectBox);
}

/**
 * Merges users and contacts into a unified assignedUsers object,
 * ensuring no duplicates and adding default selection state and initials.
 */
function mergePeople() {
  assignedUsers = {};
  Object.entries(users || {}).forEach(([id, u]) => {
    const name = u?.name || u?.email || id;
    assignedUsers[id] = { name, email: u?.email || '', initials: initials(name), selected: false };
  });
  Object.entries(contacts || {}).forEach(([id, c]) => {
    if (assignedUsers[id]) return;
    const name = c?.name || id;
    assignedUsers[id] = { name, initials: initials(name), selected: false };
  });
}

/**
 * Initializes dropdown toggle logic by wiring up event listeners
 * for opening, closing, and keyboard interactions on a custom select box.
 * Ensures only one wiring per element by checking a dataset flag.
 */
function setupToggleHandlers() {
  if (!selectBox || selectBox.dataset._wired === '1') return;
  selectBox.dataset._wired = '1';
  let open = false;

  const openDropdown = () => {
    if (open) return;
    open = true;
    if (dd) { dd.classList.remove('hidden'); dd.style.display = 'block'; }
    attachOutsideClickHandler(closeDropdown);
  };

  const closeDropdown = () => {
    if (!open) return;
    open = false;
    if (dd) { dd.classList.add('hidden'); dd.style.display = 'none'; }
  };

  initToggleEvents({ openDropdown, closeDropdown, isOpen: () => open });
}

/**
 * Attaches a temporary global click listener that closes the dropdown
 * when the user clicks outside of the select box area.
 * Automatically removes itself after execution.
 * @param {Function} closeFn - The function to close the dropdown
 */
function attachOutsideClickHandler(closeFn) {
  setTimeout(() => {
    const off = (e) => {
      if (!(e.target instanceof Node)) return;
      if (selectBox?.parentElement?.contains(e.target)) return;
      closeFn();
      document.removeEventListener('click', off, true);
    };
    document.addEventListener('click', off, true);
  }, 0);
}

/**
 * Initializes click, keyboard, and pointer handlers for dropdown toggle.
 * @param {{ openDropdown: Function, closeDropdown: Function, isOpen: Function }} actions
 */
function initToggleEvents({ openDropdown, closeDropdown, isOpen }) {
  const toggle = () => (isOpen() ? closeDropdown() : openDropdown());

  selectBox.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); });
  selectBox.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
  selectBox.addEventListener('keydown', e => { if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); toggle(); } });

  dd?.addEventListener('click', e => e.stopPropagation());
  dd?.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closeDropdown(); selectBox?.focus(); } });
}

/**
 * Initializes the "Assigned to" dropdown by resolving DOM elements,
 * merging users and contacts, rendering dropdown options and badges,
 * and setting up dropdown toggle event handlers.
 */
function initAssignedDropdown() {
  if (!resolveDom()) return;
  mergePeople();
  renderAssignedDropdown();
  renderAssignedBadges();
  setupToggleHandlers();
}

/**
 * Retrieves the IDs of all currently selected assigned users.
 * @returns {string[]} An array of user IDs corresponding to selected users.
 */
function getSelectedAssigned() {
  return Object.entries(assignedUsers).filter(([, u]) => u.selected).map(([id]) => id);
}

/**
 * Resets all assigned user selections to false, re-renders the dropdown and badges,
 * and hides the dropdown menu element.
 */
function resetAssigned() {
  Object.values(assignedUsers).forEach(u => u.selected = false);
  renderAssignedDropdown();
  renderAssignedBadges();
  dd?.classList.add('hidden');
}

// ────────────────────────────── Data load
firebase.database().ref('users').once('value').then(s => {
  users = s.val() || {}; Win.allUsers = users;
  return firebase.database().ref('contacts').once('value');
}).then(s => {
  contacts = s.val() || {}; Win.allContacts = contacts;
  initAssignedDropdown();
  Win.Board?.Render?.startTasksStream?.();
});

// ────────────────────────────── Export
Win.Board.Assigned = {
  initAssignedDropdown,
  getSelectedAssigned,
  resetAssigned,
  getPersonData,
  getProfileBadge,
  generateColorFromString
};