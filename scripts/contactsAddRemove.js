/**
 * this function is used to add a contact to firebase / locally
 * @param {event} event - is necessary to prevent the refresh of the page on submit
 */
async function addNewContact(event) {
    event.preventDefault();
    const newContactData = getFormData();
    if (!validateContactData(newContactData)) return;

    const newId = await saveContactToFirebase(newContactData);
    addContactLocally(newId, newContactData);
    document.getElementById('add-contact-form').reset();
    closeAddContactMobile();
    rerenderContactList();
    showSuccessOverlay();
    focusOnNewContact(newId);

    if (window.innerWidth <= 650) {
        openContactOverview();
    }
}

/**
 * this function is used to gather the information from the input fields of the overlay form
 */
function getFormData() {
    return {
        name: document.getElementById('add-name-input').value.trim(),
        mail: document.getElementById('add-mail-input').value.trim(),
        phone: document.getElementById('add-phone-input').value.trim()
    };
}

/**
 * this function is used to validate all input fields are filled before creating a new contact. 
 * it also validates if one of the inputs exists already (if another contact contains the same name, mail or phone)
 * @param {string} name - name of a contact
 * @param {string} mail - mail of a contact
 * @param {string} phone - phone of a contact
 */
function validateContactData({ name, mail, phone }) {
    if (!name || !mail || !phone) {
        alert("Bitte alle Felder ausfüllen.");
        return false;
    }
    return true;
}

/**
 * this function is used to save a contact into the firebase db
 */
async function saveContactToFirebase(data) {
    const response = await postData("/contacts", data);
    return response.name;
}

/**
 * this function is used to add a contact locally into the contacts array
 * @param {string} id - the id the contact was created with from firebase
 * @param {Object} data - contact information like name, mail and phone
 */
function addContactLocally(id, data) {
    contacts.push({ id, data });
}

/**
 * this function is used to focus the newly created contact by scrolling and animating it
 * @param {*} id 
 */
function focusOnNewContact(id) {
    requestAnimationFrame(() => {
        const target = document.getElementById(`contact-${id}`);
        if (target) {
            highlightAndScrollTo(target);
            showDetails(id);
        }
    });
}

/**
 * this function is used to highlight and scroll to a newly added contact
 * @param {HTMLElement} element - the contact element that was created
 * @param {boolean} removeOnly - default: false, if true removes highlight only; if false, scrolls and highlights the contact
 */
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

/**
 * this function is used to delete a contact from firebase and locally from contacts array
 * @param {string} id - the id of the contact
 */
async function deleteContact(id) {
    await deleteContactFromFirebase(id);
    removeContactFromLocalArray(id);
    document.getElementById('contact_information').innerHTML = '';
    rerenderContactList();
}

/**
 * this function is used to delete the contact from the firebase database
 * @param {string} id - the id of the contact
 */
async function deleteContactFromFirebase(id) {
    await deleteData(`/contacts/${id}`);
}

/**
 * this function is used to remove the contact locally from the contacts array
 * @param {*} id - the id of the contact
 */
function removeContactFromLocalArray(id) {
    contacts = contacts.filter(contact => contact.id !== id);
}

/**
 * this function is used to delete a contact from firebase and locally from contacts array. it is executed on displays of <650 px width.
 */
function deleteMobileContact() {
    event.preventDefault();
    if (currentDisplayedContactId) {
        deleteContact(currentDisplayedContactId);
    }
    goBack();
    closeContactOptions();
}