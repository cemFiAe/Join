// @ts-nocheck
const BASE_URL = "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/"

let contacts = [];

let currentDisplayedContactId = null;

/**
 * this function is used to fetch the contacts from firebase and render the contact list onload
 */
async function onloadFunction() { 
    let contactResponse = await loadData("/contacts");
    let userResponse = await loadData("/users");

    contacts = [];

    // load all contacts
    if (contactResponse) {
        let contactsArray = Object.keys(contactResponse);
        for (let index = 0; index < contactsArray.length; index++) {
            contacts.push({
                id: contactsArray[index],
                data: contactResponse[contactsArray[index]],
            });
        }
    }

    // load all users (that DONT exist already as a contact!)
    if (userResponse) {
        let userArray = Object.keys(userResponse);
        for (let index = 0; index < userArray.length; index++) {
            // add user only, if the ID doesnt exist as a contact 
            if (!contacts.find(c => c.id === userArray[index])) {
                contacts.push({
                    id: userArray[index],
                    data: userResponse[userArray[index]],
                });
            }
        }
    }

    renderAllContacts();
}

/**
 * this function is used to fetch the data from firebase and convert it into .json format
 * @param {string} path - this is used to change the root that is being fetched from firebase
 * @returns {string} - id that was generated for the contact 
 */
async function loadData(path="") {
    let response = await fetch(BASE_URL + path + ".json");
    return responseToJson = await response.json();
}

/**
 * this function is used to add Data to a specific root
 * @param {string} path - this is used to change the root that is being fetched from firebase
 * @param {json} data - this is used to set the key value pairs that should be posted to firebase
 * @returns {Obejct} - contact containing data like the id or name, mail and phone
 */
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

/**
 * this function is used to replace Data in the specific root in firebase
 * @param {string} path - this is used to change the root that is being fetched from firebase
 * @param {json} data - this is used to set the key value pairs that should be posted to firebase
 * @returns {Obejct} - contact containing data like the id or name, mail and phone
 */
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

/**
 * this function is used to delete Data from the specific root in firebase
 * @param {string} path - this is used to change the root that is being fetched from firebase
 * @returns {Obejct} - contact containing data like the id or name, mail and phone
 */
async function deleteData(path="") {
    let response = await fetch(BASE_URL + path + ".json",{
        method: "DELETE",
    });
    return responseToJson = await response.json();
}

/**
 * this function is used to create a contact template
 * @param {json} data - this is an object containing contact information
 * @param {string} id - this is the id that every entry gets from firebase 
 * @returns {HTMLDivElement} - a template for a contact, used in the contact list
 */
function getContactTemplateByData(data, id) {
    const initials = getInitials(data.name);
    const bgColor = getColorFromName(data.name);
    const icon = createInitialIcon(initials, bgColor);
    const email = data.mail || data.email || "";

    return `<div id="contact-${id}" onclick="handleContactClick('${id}')" class="contact_entry">
          ${icon}
          <div>
            <h4 class="contact_name">${data.name}</h4>
            <span class="contact_mail" title="${email}">${email}</span>
          </div>
        </div>`;
}

/**
 * this function is used to either execute openContactOverview() or showDetails(id)
 * @param {string} id - this is the id that every entry gets from firebase 
 */
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

/**
 * this function is used to gather the initials of a contact
 * @param {string} name - this is the name of a contact
 * @returns {string} - initials of a contact, f.e Tom Taylor => "TT"
 */
function getInitials(name) {
    const parts = name.trim().split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

/**
 * this function is used to create a hsl hash based on the name of a contact
 * @param {string} name - this is the name of a contact
 * @returns {string} - hsl hash that is based on the name of a contact
 */
function getColorFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 70%, 60%)`;
}

/**
 * this function is used to create the base icon of a contact
 * @param {string} initials - the initials of a contact, f.e "Tom Taylor" => "TT"
 * @param {string} color - a hsl hash, f.e "hsl(210, 70%, 60%)"
 * @param {string} extraClass - additional class for the edit overlay, so that the icon is styled accordingly
 * @param {number} size - size used for the proportions of the icon in the edit overlay and the font size inside the icon
 * @returns {HTMLDivElement} - template for the base icon of a contact
 */
function createInitialIcon(initials, color, extraClass = '', size) {
    return `<div class="contact_icon_placeholder ${extraClass}" style="background-color: ${color}; width: ${size}px; height: ${size}px; font-size: ${size / 2.5}px;">
              ${initials.toUpperCase()}
            </div>`;
}

/**
 * this function is used to group the contacts in the contact list and sort them alphebatically
 * @param {Array} contactList - this array is using the data from global contacts array, that is being looped through onloadFunction()
 * @returns {Array} - array that contains all contacts of one letter, f.e "A" as objects inside of it
 */
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

/**
 * this function is used to create contactgroups, f.e "A", and returning the template
 * @param {string} letter - f.e "A", used to create the h3
 * @param {Array} contacts - array that contains id and data(name, mail, phone)
 * @returns {HTMLElement} - containing an h3 with the letter, f.e "A" and a div for each contact
 */
function createContactGroup(letter, contacts) {
    const group = document.createElement('div');
    group.classList.add('contact-group');
    group.innerHTML = `<h3 class="contact_letter">${letter}</h3>` +
                      contacts.map(c => getContactTemplateByData(c.data, c.id)).join('');
    return group;
}

/**
 * this function is used to create a divider for the contact list
 * @returns {HTMLDivElement} - div that is used as a divider
 */
function createDivider() {
    const divider = document.createElement('div');
    divider.classList.add('contact_devider');
    return divider;
}

/**
 * this function is used to render all contacts
 */
function renderAllContacts() {
    const container = document.getElementById('contacts');
    container.innerHTML = '<button onclick="openOverlay(`add`)" class="new_contact_btn">Add new contact <img class="person_add" src="../assets/icons/contacts/person_add.svg" alt=""></button>';
    const groups = groupContactsByInitial(contacts);
    const letters = Object.keys(groups).sort();

    for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const group = createContactGroup(letter, groups[letter]);
        container.appendChild(group);
        if (i < letters.length - 1) container.appendChild(createDivider());
    }
}

/**
 * this function is used to rerender the updated contact list
 */
function rerenderContactList() {
    const container = document.getElementById('contacts');
    container.innerHTML = '';
    renderAllContacts();
}

/**
 * this function is used to animate the overlay showing a successful contact creation
 */
function showSuccessOverlay() {
    setTimeout(() => {
        const overlay = createSuccessOverlay();
        document.body.appendChild(overlay);
        animateOverlayOut(overlay);
    }, 600);
}

/**
 * this function is used to add a div element, editing and animating it
 * @returns {HTMLDivElement} - div that represents the successful overlay
 */
function createSuccessOverlay() {
    const overlay = document.createElement('div');
    overlay.textContent = "Contact successfully created";
    overlay.classList.add('added-contact-overlay');
    const anim = window.innerWidth < 650 ? 'newSlideInBottom' : 'newSlideInRight';
    overlay.style.animation = `${anim} 0.3s ease-out forwards`;
    return overlay;
}

/**
 * this function is used to animate the closing of the success overlay
 */
function animateOverlayOut(overlay) {
    const anim = window.innerWidth < 650 ? 'newSlideOutBottom' : 'newSlideOutRight';
    setTimeout(() => {
        overlay.style.animation = `${anim} 0.8s ease-in forwards`;
        overlay.addEventListener('animationend', e => e.animationName === anim && overlay.remove());
    }, 1200);
}

/**
 * this function is used to show a more detailed overview of a contact
 * @param {string} id - this is the id that every entry gets from firebase 
 */
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

/**
 * this function is used to close the detailed contact overview
 * @param {HTMLElement} container - the html element containing the contact information
 */
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

/**
 * this function is used to reset the animation of the detailed contact overview
 * @param {HTMLElement} container - the html element containing the contact information
 * @param {Object} contact - an object containing the contact data
 * @param {id} id - this is the id that every entry gets from firebase 
 */
function prepareContactSwitch(container, contact, id) {
    container.classList.remove('slide-in', 'slide-out');
    container.style.left = '100%';
    void container.offsetWidth; 
    renderContactDetails(container, contact, id);
    animateContactDetails(container);
}

/**
 * this function is used to render the contact information
 * @param {HTMLElement} container - the html element containing the contact information
 * @param {Object} contact - an object containing the contact data
 * @param {id} id - this is the id that every entry gets from firebase 
 */
function renderContactDetails(container, contact, id) {
    const { name } = contact.data;
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);
    container.innerHTML = getContactDetailsTemplate(id, contact.data, initials, bgColor);
}

/**
 * this function is used to animate the detailed contact information
 * @param {HTMLElement} container - the html element containing the contact information
 */
function animateContactDetails(container) {
    if (window.innerWidth > 650) {
        container.classList.add('slide-in');
        container.classList.remove('slide-out');
    } else {
        container.style.transition = 'none';
        container.style.left = '16px';
    }
}

/**
 * this function is used to create the template for the detailed contact information
 * @param {string} id - this is the id that every entry gets from firebase 
 * @param {Object} data - object containing contact information like name, mail or phone
 * @param {string} bgColor - hsl hash used for the background color of the profile icon
 * @returns {HTMLElement} - template for the detailed information overview
 */
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
    <span class="ci-mail ci-text">${data.mail || data.email || "–"}</span>
    <h3 class="ci-text">Phone</h3>
    <span class="ci-text">${data.phone || "–"}</span>`;
}


/**
 * this function is used to update the contact array's data
 * @param {string} id - this is the id of the contact
 * @param {Object} data - object containing contact information like name, mail or phone
 */
function updateLocalContact(id, data) {
    const contact = getContactById(id);
    if (contact) contact.data = data;

    rerenderContactList();

    const target = document.getElementById(`contact-${id}`);
    if (target) {
        highlightAndScrollTo(target);
    }

    const container = document.getElementById('contact_information');
    if (currentDisplayedContactId === id && container.innerHTML !== '') {
        renderContactDetails(container, contact, id);
        animateContactDetails(container);
    } else {
        showDetails(id);
    }
}