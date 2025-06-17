// bg overlay close

document.getElementById('bg_overlay').addEventListener('click', function () {
    closeAddContact();
    closeEditContact();
    closeAddContactMobile();
    closeEditContact();
});

// add contact overlay

function openAddContact() {
    document.getElementById('add_contact_overlay').style.left = "5%";
    document.getElementById('add_contact_overlay').style.top = "20%";
    document.getElementById('bg_overlay').style.display = "flex";
}

function closeAddContact() {
    document.getElementById('add_contact_overlay').style.left = "105%";
    document.getElementById('bg_overlay').style.display = "none";
}

function openAddContactMobile() {
    document.getElementById('add_contact_btn').style.display = "none";
    document.getElementById('add_contact_overlay').style.top = "6.5%";
    document.getElementById('bg_overlay').style.display = "flex";
}

async function closeAddContactMobile() {
    document.getElementById('add_contact_overlay').style.top = "106.5%";
    document.getElementById('bg_overlay').style.display = "none";
    await new Promise(resolve => setTimeout(resolve, 300));
    document.getElementById('add_contact_btn').style.display = "flex";
}

document.getElementById('add_contact_overlay').addEventListener('click', function (event) {
    event.stopPropagation();
});

// edit contact overlay

function openEditContact() {
    event.preventDefault();
    document.getElementById('edit_contact_overlay').style.left = "5%";
    document.getElementById('edit_contact_overlay').style.top = "20%";
    document.getElementById('bg_overlay').style.display = "flex";
}

function closeEditContact() {
    document.getElementById('edit_contact_overlay').style.left = "105%";
    document.getElementById('bg_overlay').style.display = "none";
}

document.getElementById('edit_contact_overlay').addEventListener('click', function (event) {
    event.stopPropagation();
});

// contact overview mobile

function openContactOverview() {
    document.getElementById('contacts').style.display = "none";
    document.getElementById('contact-overview').style.display = "flex";
    document.getElementById('contact_information').style.left = "16px";
    document.getElementById('co-devider-mobile').style.display = "flex"
    document.getElementById('add_contact_btn').style.display = "none";
    document.getElementById('burger_contact_btn').style.display = "flex";
    document.getElementById('back_contact_btn').style.display = "flex";
}

function openContactOptions() {
    document.getElementById('contact-options').style.left = 'calc(100% - 132px)';
    setTimeout(() => {
        document.addEventListener("click", outsideClickListener);
    }, 0); 
}

function closeContactOptions() {
    document.getElementById('contact-options').style.left = '120%';
    document.removeEventListener("click", outsideClickListener);
}

function outsideClickListener(event) {
    const contact = document.getElementById('contact-options');
    if (!contact.contains(event.target)) {
        closeContactOptions();
    }
}

function goBack() {
    document.getElementById('contacts').style.display = "flex";
    document.getElementById('contact-overview').style.display = "none";
    document.getElementById('contact_information').style.left = "750px";
    document.getElementById('add_contact_btn').style.display = "flex";
    document.getElementById('burger_contact_btn').style.display = "none";
    document.getElementById('back_contact_btn').style.display = "none";
}

// BACK END

const BASE_URL = "https://join-18def-default-rtdb.europe-west1.firebasedatabase.app/"

let contacts = [];


// onload Funktion 

/*
// post/put
async function onloadFunction() {
    test = await putData("/contacts/-OSsdmm1y4jXi-2dTIUG", {"name": "Alex Klar", "mail": "alex.klar@mail.de", "phone": "+49 7894 567 89 0"});
    console.log(test);
} 
*/

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

// HILFSFUNKTIONEN werden später angewendet und hier entfernt

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


// Template for a contact
function getContactTemplateByData(data) {
    const initials = getInitials(data.name);
    const bgColor = getColorFromName(data.name);
    const icon = createInitialIcon(initials, bgColor);

    return `<div onclick="openContactOverview()" class="contact_entry">
              ${icon}
              <div>
                <h4 class="contact_name">${data.name}</h4>
                <span class="contact_mail">${data.mail}</span>
              </div>
            </div>`;
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
                      contacts.map(c => getContactTemplateByData(c.data)).join('');
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
    const groups = groupContactsByInitial(contacts);
    const letters = Object.keys(groups).sort();

    for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const group = createContactGroup(letter, groups[letter]);
        container.appendChild(group);
        if (i < letters.length - 1) container.appendChild(createDivider());
    }
}