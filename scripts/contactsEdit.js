// @ts-check

/**
 * Liefert die ID des aktuell im Edit-Overlay geöffneten Kontakts.
 */
function getCurrentEditingId() {
  const dlg = /** @type {HTMLDialogElement|null} */ (document.getElementById('edit_contact_overlay'));
  const id = dlg?.dataset?.contactId || '';
  // Fallback, falls irgendwo noch eine alte Variable gesetzt wird
  // @ts-ignore
  return id || (typeof window.currentlyEditingContactId === 'string' ? window.currentlyEditingContactId : '');
}

/**
 * Form absenden → Kontakt speichern.
 */
async function editContact(event) {
  event.preventDefault();
  const id = getCurrentEditingId();
  if (!id) return;

  const contact = getContactById(id);
  if (!contact) return;

  const updatedData = collectUpdatedFormData(contact.data);
  await updateContactInFirebase(id, updatedData);
  updateLocalContact(id, updatedData);
}

/**
 * Hilfsfunktionen aus deinem bestehenden Code
 */
function getContactById(id) {
  // @ts-ignore
  return contacts.find(c => c.id === id);
}

function collectUpdatedFormData(current) {
  return {
    name:  (/** @type {HTMLInputElement} */(document.getElementById('edit-name-input'))).value.trim()  || current.name,
    mail:  (/** @type {HTMLInputElement} */(document.getElementById('edit-mail-input'))).value.trim()  || current.mail,
    phone: (/** @type {HTMLInputElement} */(document.getElementById('edit-phone-input'))).value.trim() || current.phone,
  };
}

async function updateContactInFirebase(id, data) {
  // @ts-ignore
  await putData(`/contacts/${id}`, data);
}

/**
 * Mobile: über Burger-Menü öffnen
 */
function editMobileContact() {
  // @ts-ignore
  event?.preventDefault?.();
  // @ts-ignore
  if (window.currentDisplayedContactId) {
    // openEditContact kommt aus contacts.js
    // @ts-ignore
    window.openEditContact(window.currentDisplayedContactId);
    // @ts-ignore
    closeContactOptions();
  }
}

/**
 * Löschen (Desktop)
 */
function deleteContactFromEdit() {
  const id = getCurrentEditingId();
  if (!id) return;
  // @ts-ignore
  deleteContact(id);
  // @ts-ignore
  window.closeEditContact && window.closeEditContact();
}

/**
 * Löschen (Mobile)
 */
function deleteContactFromEditMobile() {
  const id = getCurrentEditingId();
  if (!id) return;
  // @ts-ignore
  deleteContact(id);
  // @ts-ignore
  window.closeEditContact && window.closeEditContact();
  // @ts-ignore
  goBack();
  // @ts-ignore
  closeContactOptions();
}

/* ---- nur die Handler exportieren; KEIN weiteres 'W' definieren ---- */
window.editContact = editContact;
window.editMobileContact = editMobileContact;
window.deleteContactFromEdit = deleteContactFromEdit;
window.deleteContactFromEditMobile = deleteContactFromEditMobile;
