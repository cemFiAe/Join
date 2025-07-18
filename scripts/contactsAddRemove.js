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
    focusOnNewContact(newId);

    if (window.innerWidth <= 650) {
        openContactOverview();
    }
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
function focusOnNewContact(id) {
    requestAnimationFrame(() => {
        const target = document.getElementById(`contact-${id}`);
        if (target) {
            highlightAndScrollTo(target);
            showDetails(id);
        }
    });
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
function highlightAndScrollTo(element, removeOnly = false) {
    const container = document.getElementById('contacts');
    if (!container || !element) return;

    document.querySelectorAll('.contact_entry.highlight-contact').forEach(el => el.classList.remove('highlight-contact'));

    if (removeOnly) return;

    const elementTop = element.offsetTop;
    container.scrollTo({
        top: elementTop - container.offsetHeight / 2 + element.offsetHeight / 2,
        behavior: 'smooth'
    });

    element.classList.add('highlight-contact');
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