// fügt einen Kontakt der firebaseDB hinzu und rerendert die Liste
async function addNewContact(event) {
    event.preventDefault();
    const newContactData = getFormData();
    if (!validateContactData(newContactData)) return;

    const newId = await saveContactToFirebase(newContactData);
    addContactLocally(newId, newContactData);
    closeAddContactMobile();
    rerenderContactList();
    showSuccessOverlay();
    focusOnNewContact(newContactData);
}

// returnt die form Daten
function getFormData() {
    return {
        name: document.getElementById('add-name-input').value.trim(),
        mail: document.getElementById('add-mail-input').value.trim(),
        phone: document.getElementById('add-phone-input').value.trim()
    };
}

// Form validation
function validateContactData({ name, mail, phone }) {
    if (!name || !mail || !phone) {
        alert("Bitte alle Felder ausfüllen.");
        return false;
    }
    return true;
}

// in firebaseDB posten
async function saveContactToFirebase(data) {
    const response = await postData("/contacts", data);
    return response.name;
}

// lokal in contacts array speichern
function addContactLocally(id, data) {
    contacts.push({ id, data });
}

// neuen Kontakt focusen
function focusOnNewContact(data) {
    setTimeout(() => {
        const target = findContactElement(data);
        if (target) highlightAndScrollTo(target);
    }, 100);
}

// neuen Kontakt finden
function findContactElement(data) {
    const initials = getInitials(data.name).toUpperCase();
    const bgColor = getColorFromName(data.name);
    return [...document.querySelectorAll('.contact_entry')].find(entry => {
        const icon = entry.querySelector('.contact_icon_placeholder');
        return icon && icon.textContent.trim() === initials && icon.style.backgroundColor === bgColor;
    });
}

// zum neuen Kontakt scrollen
function highlightAndScrollTo(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('highlight-contact');
    setTimeout(() => element.classList.remove('highlight-contact'), 2000);
}

// Kontakt löschen

async function deleteContact(id) {
    await deleteContactFromFirebase(id);
    removeContactFromLocalArray(id);
    document.getElementById('contact_information').innerHTML = '';
    rerenderContactList();
}

// aus fbDB entfernen  
async function deleteContactFromFirebase(id) {
    await deleteData(`/contacts/${id}`);
}

// aus array entfernen
function removeContactFromLocalArray(id) {
    contacts = contacts.filter(contact => contact.id !== id);
}

function deleteMobileContact() {
    event.preventDefault();
    if (currentDisplayedContactId) {
        deleteContact(currentDisplayedContactId);
    }
    goBack();
    closeContactOptions();
}