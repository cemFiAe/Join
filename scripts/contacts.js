// @ts-check

let currentOpenOverlay = null;

/** Cast-Helfer für Window (verhindert TS-Fehler bei window.*) */
const W = /** @type {any} */ (window);

/** DOM-Handles */
const bgEl      = /** @type {HTMLDivElement | null} */(document.getElementById('bg_overlay'));
const addDlgEl  = /** @type {HTMLDialogElement | null} */(document.getElementById('add_contact_overlay'));
const editDlgEl = /** @type {HTMLDialogElement | null} */(document.getElementById('edit_contact_overlay'));

/* ===========================
   Utils
   =========================== */
function showBg()  { if (bgEl) bgEl.style.display = 'flex'; }
function hideBg()  { if (bgEl) bgEl.style.display = 'none'; }

function initialsOf(s) {
  return String(s || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => (p[0] || '').toUpperCase())
    .join('') || '–';
}
function colorFromString(str) {
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}
function safe(v) {
  return (v == null || String(v) === 'undefined') ? '' : String(v);
}

/** Liefert die aktuell „selektierte“ Kontakt-ID aus dem DOM. */
function getSelectedContactIdFromDOM() {
  // 1) bevorzugt markierte/aktive Zeile
  let el = document.querySelector('.contact_entry.highlight-contact, .contact_entry.is-selected');
  // 2) sonst irgendein contact_entry mit data-*
  if (!el) el = document.querySelector('.contact_entry[data-contact-id], .contact_entry[data-id], .contact_entry[data-user-id], .contact_entry[data-key]');
  // 3) oder allgemein ein Element mit passenden data-Attributen
  if (!el) el = document.querySelector('[data-contact-id].is-selected, [data-id].is-selected, [data-user-id].is-selected, [data-key].is-selected');

  if (!el) return '';
  const n = /** @type {HTMLElement} */ (el);
  return (
    n.getAttribute('data-contact-id') ||
    n.getAttribute('data-id') ||
    n.getAttribute('data-user-id') ||
    n.getAttribute('data-key') ||
    ''
  );
}

/** In Map ODER Array Datensatz per id/key/uid finden. */
function findRecord(container, id) {
  if (!container || !id) return null;
  const idStr = String(id);
  if (Array.isArray(container)) {
    return container.find(x =>
      String(x?.id ?? '')  === idStr ||
      String(x?.key ?? '') === idStr ||
      String(x?.uid ?? '') === idStr
    ) || null;
  }
  if (typeof container === 'object') {
    if (container[idStr]) return container[idStr];
    const vals = Object.values(container);
    return vals.find((x) =>
      String(x?.id ?? '')  === idStr ||
      String(x?.key ?? '') === idStr ||
      String(x?.uid ?? '') === idStr
    ) || null;
  }
  return null;
}

/** Name/Email/Phone robust aus verschieden strukturierten Records extrahieren. */
function extractPerson(rec) {
  // falls Kontakte wie { id, data: {...} } aufgebaut sind
  const r = (rec && typeof rec === 'object' && 'data' in rec && rec.data) ? rec.data : rec;

  const name =
    pickFirst(r?.name,
              r?.displayName,
              [r?.firstName, r?.lastName].filter(Boolean).join(' '));

  // bei Kontakten heißt es oft "mail"
  const email =
    pickFirst(r?.email, r?.mail, r?.eMail, r?.userEmail);

  const phone =
    pickFirst(r?.phone, r?.tel, r?.phoneNumber, r?.mobile);

  return { name, email, phone };
}

/* ===========================
   BG-Overlay schließt aktives Dialog
   =========================== */
if (bgEl) {
  bgEl.addEventListener('click', () => {
    switch (currentOpenOverlay) {
      case 'add-desktop':
      case 'add-mobile':
        closeAddContact();
        break;
      case 'edit-desktop':
      case 'edit-mobile':
        closeEditContact();
        break;
    }
    currentOpenOverlay = null;
  });
}

/* Klicks im Dialog nicht „nach außen“ blubbern lassen */
addDlgEl?.addEventListener('click', (e) => e.stopPropagation());
editDlgEl?.addEventListener('click', (e) => e.stopPropagation());

/* ===========================
   ADD OVERLAY
   =========================== */
function openAddContact() {
  currentOpenOverlay = (window.innerWidth < 650) ? 'add-mobile' : 'add-desktop';
  if (addDlgEl?.showModal) addDlgEl.showModal();
  showBg();
}
function openAddContactMobile() { openAddContact(); }

function closeAddContact() {
  if (addDlgEl?.open) addDlgEl.close();
  hideBg();
  const form = /** @type {HTMLFormElement | null} */(document.getElementById('add-contact-form'));
  if (form) form.reset();
}
function closeAddContactMobile() { closeAddContact(); }

// helpers ------------------------------------------------------------
function getMaybeGlobal(name) {
  try { return (name in window) ? window[name] : (typeof globalThis[name] !== 'undefined' ? globalThis[name] : null); }
  catch { return null; }
}

function pickFirst(...vals) {
  for (const v of vals) {
    if (v != null && String(v).trim() !== '' && String(v) !== 'undefined') return String(v);
  }
  return '';
}


// EDIT OVERLAY -------------------------------------------------------
/**
 * Öffnet das Edit-Overlay (ID oder Record erlaubt) und füllt die Inputs.
 * @param {string | {id?:string, name?:string, email?:string, mail?:string, phone?:string}} contactOrId
 */
function openEditContact(contactOrId) {
  // --- 1) ID bestimmen ---
  let id = '';
  if (typeof contactOrId === 'string' && contactOrId.trim()) {
    id = contactOrId.trim();
  } else if (contactOrId && typeof contactOrId === 'object' && contactOrId.id) {
    id = String(contactOrId.id);
  } else if (editDlgEl?.dataset.contactId) {
    id = String(editDlgEl.dataset.contactId);
  } else if (W.currentDisplayedContactId) {
    id = String(W.currentDisplayedContactId);
  } else {
    id = getSelectedContactIdFromDOM();
  }

  // --- 2) Datenquellen (Map oder Array; window oder plain globals) ---
  const usersSrc    = W.users    || getMaybeGlobal('users')    || null;
  const contactsSrc = W.contacts || getMaybeGlobal('contacts') || null;

  const recUser    = findRecord(usersSrc, id);
  const recContact = findRecord(contactsSrc, id);

  // --- 3) Felder extrahieren (Contact überschreibt User) ---
  const u = extractPerson(recUser);
  const c = extractPerson(recContact);
  const name  = pickFirst(c.name,  u.name);
  const email = pickFirst(c.email, u.email);
  const phone = pickFirst(c.phone, u.phone);

  // --- 4) Inputs füllen ---
  const nameEl  = /** @type {HTMLInputElement | null} */(document.getElementById('edit-name-input'));
  const mailEl  = /** @type {HTMLInputElement | null} */(document.getElementById('edit-mail-input'));
  const phoneEl = /** @type {HTMLInputElement | null} */(document.getElementById('edit-phone-input'));
  if (nameEl)  nameEl.value  = name;
  if (mailEl)  mailEl.value  = email;
  if (phoneEl) phoneEl.value = phone;

  // --- 5) Initialen-Kreis ---
  const circle = /** @type {HTMLDivElement | null} */(document.getElementById('edit_initials_circle'));
  if (circle) {
    const base = name || email || id || '';
    const initials = initialsOf(base);
    const bg = colorFromString(base);

    // Wenn deine alte Helper-Funktion existiert, nutze sie (so wie in contactsEdit.js)
    if (typeof W.createInitialIcon === 'function') {
      circle.innerHTML = W.createInitialIcon(initials, bg, 'circle', 128);
    } else {
      // Fallback: einfacher runder Badge
      circle.textContent = initials;
      circle.style.background = bg;
      circle.style.color = '#fff';
      circle.style.display = 'grid';
      circle.style.placeItems = 'center';
    }
  }

  // --- 6) Dialog anzeigen + Meta setzen ---
  if (editDlgEl?.showModal) {
    editDlgEl.showModal();
    const t = window.matchMedia('(max-width: 650px)').matches
      ? 'translate(-50%, -50%) translateX(0) translateY(0)'
      : 'translate(-50%, -50%) translateX(0)';
    editDlgEl.style.setProperty('transform', t, 'important');
  }
  if (editDlgEl) {
    editDlgEl.dataset.contactId = id || '';
    editDlgEl.dataset.source = recUser ? 'users' : recContact ? 'contacts' : 'unknown';
  }

  // damit deine alte Save/Delete-Logik darauf zugreifen kann:
  W.currentlyEditingContactId = id;

  showBg();
  currentOpenOverlay = (window.innerWidth < 650) ? 'edit-mobile' : 'edit-desktop';
}

/** Edit aus der rechten Detailspalte (Desktop) */
function editFromOverview() {
  const id = String(W.currentDisplayedContactId || '') || getSelectedContactIdFromDOM();
  openEditContact(id);
}
/** Edit aus dem Mobile-Burger */
function editMobileContact() {
  const id = String(W.currentDisplayedContactId || '') || getSelectedContactIdFromDOM();
  openEditContact(id);
}

function closeEditContact() {
  if (editDlgEl?.open) {
    applyEditDialogTransformClosed(); // <— erst nach „draußen“ schieben
    editDlgEl.close();
  }
  hideBg();
  const b = /** @type {HTMLButtonElement | null} */(document.getElementById('burger_contact_btn'));
  if (b) b.style.zIndex = '99';
}

function isMobileWidth() {
  // identisch zu deinem Breakpoint
  return window.matchMedia('(max-width: 650px)').matches;
}

function applyEditDialogTransformOpen() {
  if (!editDlgEl) return;
  const t = isMobileWidth()
    ? 'translate(-50%, -50%) translateX(0) translateY(0)'
    : 'translate(-50%, -50%) translateX(0)';
  // wichtig: !important, damit Media-CSS nicht gewinnt
  editDlgEl.style.setProperty('transform', t, 'important');
}

function applyEditDialogTransformClosed() {
  if (!editDlgEl) return;
  const t = isMobileWidth()
    ? 'translate(-50%, -50%) translateY(200%)'
    : 'translate(-50%, -50%) translateX(200%)';
  editDlgEl.style.setProperty('transform', t, 'important');
}

// bei Größenwechsel offen gehaltene Dialoge neu positionieren
window.addEventListener('resize', () => {
  if (editDlgEl?.open) applyEditDialogTransformOpen();
});


function closeEditMobileContact() { closeEditContact(); }

/* ===========================
   Contact Overview / Options
   =========================== */
function openContactOverview() {
  const contacts = /** @type {HTMLDivElement | null} */(document.getElementById('contacts'));
  const overview = /** @type {HTMLDivElement | null} */(document.getElementById('contact-overview'));
  const info     = /** @type {HTMLDivElement | null} */(document.getElementById('contact_information'));
  const devMob   = /** @type {HTMLDivElement | null} */(document.getElementById('co-devider-mobile'));
  const addBtn   = /** @type {HTMLButtonElement | null} */(document.getElementById('add_contact_btn'));
  const burger   = /** @type {HTMLButtonElement | null} */(document.getElementById('burger_contact_btn'));
  const backBtn  = /** @type {HTMLButtonElement | null} */(document.getElementById('back_contact_btn'));

  if (contacts) contacts.style.display = 'none';
  if (overview) overview.style.display = (window.innerHeight >= 650) ? 'flex' : 'none';
  if (info) info.style.left = '16px';
  if (devMob) devMob.style.display = 'flex';
  if (addBtn) addBtn.style.display = 'none';
  if (burger) burger.style.display = 'flex';
  if (backBtn) backBtn.style.display = 'flex';
}

function openContactOptions() {
  const menu = /** @type {HTMLDivElement | null} */(document.getElementById('contact-options'));
  if (!menu) return;
  menu.style.left = 'calc(100% - 132px)';
  setTimeout(() => document.addEventListener('click', outsideClickListener), 0);
}
function closeContactOptions() {
  const menu = /** @type {HTMLDivElement | null} */(document.getElementById('contact-options'));
  if (!menu) return;
  menu.style.left = '120%';
  document.removeEventListener('click', outsideClickListener);
}
function outsideClickListener(event) {
  const menu = /** @type {HTMLDivElement | null} */(document.getElementById('contact-options'));
  const target = event.target instanceof Node ? event.target : null;
  if (menu && target && !menu.contains(target)) closeContactOptions();
}

function goBack() {
  resetContactOverview();
  document.querySelectorAll('.contact_entry.highlight-contact')
    .forEach(el => el.classList.remove('highlight-contact'));
  const info = document.getElementById('contact_information');
  if (info) info.innerHTML = '';
  W.currentDisplayedContactId = null;
}

function resetContactOverview() {
  const contacts = /** @type {HTMLDivElement | null} */(document.getElementById('contacts'));
  const overview = /** @type {HTMLDivElement | null} */(document.getElementById('contact-overview'));
  const info     = /** @type {HTMLDivElement | null} */(document.getElementById('contact_information'));
  const addBtn   = /** @type {HTMLButtonElement | null} */(document.getElementById('add_contact_btn'));
  const burger   = /** @type {HTMLButtonElement | null} */(document.getElementById('burger_contact_btn'));
  const backBtn  = /** @type {HTMLButtonElement | null} */(document.getElementById('back_contact_btn'));

  if (contacts) contacts.style.display = 'flex';
  if (overview) overview.style.display = 'none';
  if (info) info.style.left = '750px';
  if (addBtn) addBtn.style.display = 'flex';
  if (burger) burger.style.display = 'none';
  if (backBtn) backBtn.style.display = 'none';
}

/* ===========================
   Buttons verdrahten (falls vorhanden)
   =========================== */
(function wireEditButtons() {
  const desktopBtn =
    document.querySelector('[data-action="edit-contact"]') ||
    document.getElementById('edit-btn');
  if (desktopBtn) {
    desktopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openEditContact(W.currentDisplayedContactId || getSelectedContactIdFromDOM() || '');
    });
  }
  const mobileBtn = document.getElementById('edit-btn-mobile');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openEditContact(W.currentDisplayedContactId || getSelectedContactIdFromDOM() || '');
    });
  }
})();

/* ===========================
   Globale Exporte (für HTML-Handler)
   =========================== */
W.openAddContact = openAddContact;
W.closeAddContact = closeAddContact;
W.openAddContactMobile = openAddContactMobile;
W.closeAddContactMobile = closeAddContactMobile;

W.openEditContact = openEditContact;
W.editFromOverview = editFromOverview;
W.editMobileContact = editMobileContact;
W.closeEditContact = closeEditContact;
W.closeEditMobileContact = closeEditMobileContact;

W.openContactOverview = openContactOverview;
W.openContactOptions = openContactOptions;
W.closeContactOptions = closeContactOptions;
W.goBack = goBack;
W.resetContactOverview = resetContactOverview;

