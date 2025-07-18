const BASE_URL = "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/"

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
    
    renderAllContacts();
}

// initial Function to create the first contact

/* async function onloadFunction() {
    postData("/contacts", {"mail": "test@mail.de", "name": "Max Muster", "phone": "+49 1234 567 89 0"});    
    renderAllContacts();
} */

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

    return `<div id="contact-${id}" onclick="handleContactClick('${id}')" class="contact_entry">
          ${icon}
          <div>
            <h4 class="contact_name">${data.name}</h4>
            <span class="contact_mail">${data.mail}</span>
          </div>
        </div>`;
}

// führt entsprechend entwerder openContactOverview oder showDetails aus
function handleContactClick(id) {
    const target = document.getElementById(`contact-${id}`);
    const isSameContact = currentDisplayedContactId === id;

    if (isSameContact) {
        highlightAndScrollTo(target, true);
        hideContactDetails(document.getElementById('contact_information'));
        return;
    }

    highlightAndScrollTo(target);
    if (window.innerWidth <= 650) openContactOverview();
    showDetails(id);
}

// Initialien von Kontakten in firebaseDB auslesen
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
function createInitialIcon(initials, color, extraClass = '', size) {
    return `<div class="contact_icon_placeholder ${extraClass}" style="background-color: ${color}; width: ${size}px; height: ${size}px; font-size: ${size / 2.5}px;">
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

// Liste neu rendern mit neuem Kontakt
function rerenderContactList() {
    const container = document.getElementById('contacts');
    container.innerHTML = '';
    renderAllContacts();
}

// successful overlay
function showSuccessOverlay() {
    setTimeout(() => {
        const overlay = createSuccessOverlay();
        document.body.appendChild(overlay);
        animateOverlayOut(overlay);
    }, 600);
}

function createSuccessOverlay() {
    const overlay = document.createElement('div');
    overlay.textContent = "Contact successfully created";
    overlay.classList.add('added-contact-overlay');
    const anim = window.innerWidth < 650 ? 'newSlideInBottom' : 'newSlideInRight';
    overlay.style.animation = `${anim} 0.3s ease-out forwards`;
    return overlay;
}

function animateOverlayOut(overlay) {
    const anim = window.innerWidth < 650 ? 'newSlideOutBottom' : 'newSlideOutRight';
    setTimeout(() => {
        overlay.style.animation = `${anim} 0.8s ease-in forwards`;
        overlay.addEventListener('animationend', e => e.animationName === anim && overlay.remove());
    }, 1200);
}

let currentDisplayedContactId = null;
// zeigt Kontaktinformationen an
function showDetails(id) {
    const container = document.getElementById('contact_information');
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
     const isSameContact = currentDisplayedContactId === id;
     const isVisible = container.style.left !== '100%' && container.innerHTML !== '';

    if (isSameContact && isVisible) {
     hideContactDetails(container);
    return;
}

    currentDisplayedContactId = id;
    prepareContactSwitch(container, contact, id);
}

// versteckt Kontaktinformationen wieder
function hideContactDetails(container) {
    currentDisplayedContactId = null;

    if (window.innerWidth > 650) {
        container.classList.remove('slide-in');
        container.classList.add('slide-out');
        setTimeout(() => {
            container.innerHTML = '';
            container.style.left = '100%';
        }, 300);
    } else {
        container.innerHTML = '';
        container.style.left = '100%';
    }
}

// führt die notwendigen Schritte für einen Reset durch, damit die Animation erneut abgespielt werden kann
function prepareContactSwitch(container, contact, id) {
    container.classList.remove('slide-in', 'slide-out');
    container.style.left = '100%';
    void container.offsetWidth; 
    renderContactDetails(container, contact, id);
    animateContactDetails(container);
}

// zeigt Kontakte in der Liste an
function renderContactDetails(container, contact, id) {
    const { name } = contact.data;
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);
    container.innerHTML = getContactDetailsTemplate(id, contact.data, initials, bgColor);
}

// Animation für Kontaktdetails
function animateContactDetails(container) {
    if (window.innerWidth > 650) {
        container.classList.add('slide-in');
        container.classList.remove('slide-out');
        container.style.left = '750px';
    } else {
        container.style.transition = 'none';
        container.style.left = '16px';
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

// zeigt die aktualisierte Liste der Kontakte an
function updateLocalContact(id, data) {
    const contact = getContactById(id);
    if (contact) contact.data = data;
    closeEditContact();
    rerenderContactList();
    showDetails(id);
}