const BASE_URL = "https://join-18def-default-rtdb.europe-west1.firebasedatabase.app/"

let contacts = [];

// contacts Array füllen und auslesen
async function onloadFunction() {
    let contactResponse = await loadData("/contacts");
    let contactsArray = Object.keys(contactResponse);
    
    for (let index = 0; index < contactsArray.length; index++) {
        contacts.push(
            {
                id: contactsArray[index],
                data: contactResponse[contactsArray[index]],
            }
        )
    }
    
    console.log(contacts);
    renderAllContacts();
}

// HILFSFUNKTIONEN

// Daten anzeigen
async function loadData(path="") {
    let response = await fetch(BASE_URL + path + ".json");
    return responseToJson = await response.json();
}

// Daten erzeugen
async function postData(path="", data={}) {
    let response = await fetch(BASE_URL + path + ".json", {
       method: "POST",
       header: {
        "Content-Type": "application/json",
       },
       body: JSON.stringify(data) 
    });
    return responseToJson = await response.json();
}

// Daten ersetzen
async function putData(path="", data={}) {
    let response = await fetch(BASE_URL + path + ".json", {
       method: "PUT",
       header: {
        "Content-Type": "application/json",
       },
       body: JSON.stringify(data) 
    });
    return responseToJson = await response.json();
}

// Daten löschen
async function deleteData(path="") {
    let response = await fetch(BASE_URL + path + ".json",{
        method: "DELETE",
    });
    return responseToJson = await response.json();
}

// HILFSFUNKTIONEN

// Template for a contact
function getContactTemplateByData(data, id) {
    const initials = getInitials(data.name);
    const bgColor = getColorFromName(data.name);
    const icon = createInitialIcon(initials, bgColor);

    return `<div onclick="handleContactClick('${id}')" class="contact_entry">
          ${icon}
          <div>
            <h4 class="contact_name">${data.name}</h4>
            <span class="contact_mail">${data.mail}</span>
          </div>
        </div>`;
}

// führt entsprechend entwerder openContactOverview oder showDetails aus
function handleContactClick(id) {
    if (window.innerWidth <= 650) {
        openContactOverview();
    }
    showDetails(id);
}

// get Initials from contact in firebaseDB
function getInitials(name) {
    const parts = name.trim().split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

// Gibt eine HSL-Farbe für denselben Namen zurück
function getColorFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 70%, 60%)`;
}

// Erstellt das HTML für den farbigen Initialen-Kreis
function createInitialIcon(initials, color) {
    return `<div class="contact_icon_placeholder" style="background-color: ${color};">
              ${initials.toUpperCase()}
            </div>`;
}

// Gruppiert Kontakte nach erstem Buchstaben des Namens
function groupContactsByInitial(contactList) {
    const grouped = {};
    contactList.sort((a, b) => a.data.name.localeCompare(b.data.name));
    for (let contact of contactList) {
        const letter = contact.data.name.charAt(0).toUpperCase();
        if (!grouped[letter]) grouped[letter] = [];
        grouped[letter].push(contact);
    }
    return grouped;
}

// Erzeugt ein HTML-Element mit Überschrift (z. B. "A") und allen Kontakten dieser Gruppe
function createContactGroup(letter, contacts) {
    const group = document.createElement('div');
    group.classList.add('contact-group');
    group.innerHTML = `<h3 class="contact_letter">${letter}</h3>` +
                      contacts.map(c => getContactTemplateByData(c.data, c.id)).join('');
    return group;
}

// Erzeugt einen Devider nach den Gruppierungen
function createDivider() {
    const divider = document.createElement('div');
    divider.classList.add('contact_devider');
    return divider;
}

// rendert alle Kontakte, alphabetisch geordnet
function renderAllContacts() {
    const container = document.getElementById('contacts');
    container.innerHTML = '<button onclick="openAddContact()" class="new_contact_btn">Add new contact <img class="person_add" src="../assets/icons/contacts/person_add.svg" alt=""></button>';
    const groups = groupContactsByInitial(contacts);
    const letters = Object.keys(groups).sort();

    for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const group = createContactGroup(letter, groups[letter]);
        container.appendChild(group);
        if (i < letters.length - 1) container.appendChild(createDivider());
    }
}

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

// Liste neu rendern mit neuem Kontakt
function rerenderContactList() {
    const container = document.getElementById('contacts');
    container.innerHTML = '';
    renderAllContacts();
}

// successful overlay
function showSuccessOverlay() {
    const overlay = document.createElement('div');
    overlay.textContent = "Kontakt hinzugefügt";
    overlay.classList.add('added-contact-overlay');
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2000);
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

let currentDisplayedContactId = null;
// zeigt Kontaktinformationen an
function showDetails(id) {
    const container = document.getElementById('contact_information');
    if (currentDisplayedContactId === id) return hideContactDetails(container);
    
    currentDisplayedContactId = id;
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    prepareContactSwitch(container, contact, id);
}

function hideContactDetails(container) {
    container.classList.remove('slide-in');
    container.classList.add('slide-out');
    currentDisplayedContactId = null;
    setTimeout(() => {
        container.innerHTML = '';
        container.style.left = '100%';
    }, 300);
}

function prepareContactSwitch(container, contact, id) {
    container.classList.remove('slide-in', 'slide-out');
    container.style.left = '100%';
    void container.offsetWidth; 
    renderContactDetails(container, contact, id);
    animateContactDetails(container);
}

function renderContactDetails(container, contact, id) {
    const { name } = contact.data;
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);
    container.innerHTML = getContactDetailsTemplate(id, contact.data, initials, bgColor);
}

function animateContactDetails(container) {
    if (window.innerWidth > 650) {
        container.classList.add('slide-in');
        container.style.left = '750px';
    } else {
        container.style.left = '16px';
        container.classList.remove('slide-in', 'slide-out');
    }
}

function getContactDetailsTemplate(id, data, initials, bgColor) {
    return `
    <div class="ci-wrapper">
      <div class="ci-icon" style="background-color: ${bgColor};">${initials}</div>
      <div class="ci-menu">
        <span class="ci-name">${data.name}</span>
        <div class="ci-edit">
          <a onclick="openEditContact('${id}', event)" href="#"><img src="../assets/icons/contacts/edit.svg" alt="">Edit</a>
          <a onclick="event.stopPropagation(); deleteContact('${id}')" href="#"><img src="../assets/icons/contacts/delete.svg" alt="">Delete</a>
        </div>
      </div>
    </div>
    <span class="ci-head">Contact Information</span>
    <h3 class="ci-text">Email</h3>
    <span class="ci-mail ci-text">${data.mail}</span>
    <h3 class="ci-text">Phone</h3>
    <span class="ci-text">${data.phone}</span>`;
}

let currentlyEditingContactId = null;

function openEditContact(id) {
    event.preventDefault();
    currentlyEditingContactId = id;

    const contact = getContactById(id);
    if (!contact) return;

    fillEditForm(contact.data);
    showEditOverlay();
}

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
}

function showEditOverlay() {
    document.getElementById('edit_contact_overlay').style.left = "5%";
    document.getElementById('edit_contact_overlay').style.top = "20%";
    document.getElementById('bg_overlay').style.display = "flex";
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

function updateLocalContact(id, data) {
    const contact = getContactById(id);
    if (contact) contact.data = data;
    closeEditContact();
    rerenderContactList();
    showDetails(id);
}