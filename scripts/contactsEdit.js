let currentlyEditingContactId = null;
// öffnet das Edit Overlay
function openEditContact(id) {
    event.preventDefault();
    currentlyEditingContactId = id;

    const contact = getContactById(id);
    if (!contact) return;

    fillEditForm(contact.data);
    showEditOverlay();
}

// ersetzt die Daten vom Kontakt
async function editContact(event) {
    event.preventDefault();
    const id = currentlyEditingContactId;
    const contact = getContactById(id);
    if (!contact) return;

    const updatedData = collectUpdatedFormData(contact.data);
    await updateContactInFirebase(id, updatedData);
    updateLocalContact(id, updatedData);
}

function getContactById(id) {
    return contacts.find(c => c.id === id);
}

function fillEditForm(data) {
    document.getElementById('edit-name-input').value = data.name;
    document.getElementById('edit-mail-input').value = data.mail;
    document.getElementById('edit-phone-input').value = data.phone;

    const initials = getInitials(data.name);
    const color = getColorFromName(data.name);
    const circleHTML = createInitialIcon(initials, color, 'circle', 128);
    document.getElementById('edit_initials_circle').innerHTML = circleHTML;
}

function showEditOverlay() {
    editOverlayLogic();
    document.getElementById('bg_overlay').style.display = "flex";
    document.getElementById('burger_contact_btn').style.display = "none";
    document.getElementById('add_contact_btn').style.display = "none";
    document.getElementById('burger_contact_btn').style.zIndex = "999";
}

function editOverlayLogic() {
    currentOpenOverlay = (window.innerWidth <= 650) ? 'edit-mobile' : 'edit-desktop';
    if (currentOpenOverlay === 'edit-mobile') {
        editOverlayMobile();
    } else if (currentOpenOverlay === 'edit-desktop') {
        editOverlayDesktop();
    }
}

function editOverlayDesktop () {
    document.getElementById('edit_contact_overlay').style.left = "5%";
    document.getElementById('edit_contact_overlay').style.top = "20%";
}

function editOverlayMobile () {
    document.getElementById('edit_contact_overlay').style.left = "5%";
    document.getElementById('edit_contact_overlay').style.top = "6.5%", "!important";
}

function collectUpdatedFormData(current) {
    return {
        name: document.getElementById('edit-name-input').value.trim() || current.name,
        mail: document.getElementById('edit-mail-input').value.trim() || current.mail,
        phone: document.getElementById('edit-phone-input').value.trim() || current.phone,
    };
}

async function updateContactInFirebase(id, data) {
    await putData(`/contacts/${id}`, data);
}

function editMobileContact() {
    event.preventDefault();
    if (currentDisplayedContactId) {
        openEditContact(currentDisplayedContactId);
        closeContactOptions();
    }
}

function deleteContactFromEdit() {
    if (!currentlyEditingContactId) return;

    deleteContact(currentlyEditingContactId);

    closeEditContact();
}

function deleteContactFromEditMobile() {
    if (!currentlyEditingContactId) return;
    deleteContact(currentlyEditingContactId);
    closeEditContact();
    goBack();
    closeContactOptions();
}