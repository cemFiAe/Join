let currentlyEditingContactId = null;

/**
 * this function is used to open the edit contact overlay
 * @param {string} id - id of the contact
 */
let editValidationInitialized = false;

function openEditContact(id) {
    event.preventDefault();
    currentlyEditingContactId = id;

    const contact = getContactById(id);
    if (!contact) return;

    fillEditForm(contact.data);
    openOverlay('edit');

    if (!editValidationInitialized) {
        setupEditValidation();
        editValidationInitialized = true;
    }
}

/**
 * this function is used to
 * @param {event} event - is necessary to prevent the page from refreshing
 */
async function editContact(event) {
    event.preventDefault();
    const id = currentlyEditingContactId;
    const contact = getContactById(id);
    if (!contact) return;

    const updatedData = collectUpdatedFormData(contact.data);
    await updateContactInFirebase(id, updatedData);
    updateLocalContact(id, updatedData);

    closeOverlay('edit'); 
}

/**
 * this function is used to find a contact
 * @param {string} id - id of the contact
 * @returns - object, containing contact data
 */
function getContactById(id) {
    return contacts.find(c => c.id === id);
}

/**
 * this function is used to fill the form of the edit overlay
 * @param {object} data - contains information like name, mail or phone 
 */
function fillEditForm(data) {
    document.getElementById('edit-name-input').value = data.name;
    document.getElementById('edit-mail-input').value = data.mail || data.email || "-";
    document.getElementById('edit-phone-input').value = data.phone || "-";

    const initials = getInitials(data.name);
    const color = getColorFromName(data.name);
    const circleHTML = createInitialIcon(initials, color, 'circle', 128);
    document.getElementById('edit_initials_circle').innerHTML = circleHTML;
}

/**
 * this function is used to animate the appearing of the edit overlay
 */
function editOverlayLogic() {
    currentOpenOverlay = (window.innerWidth <= 650) ? 'edit-mobile' : 'edit-desktop';
    if (currentOpenOverlay === 'edit-mobile') {
        editOverlayMobile();
    } else if (currentOpenOverlay === 'edit-desktop') {
        editOverlayDesktop();
    }
}

/**
 * this function is used to resize the edit overlay
 */
function editOverlayDesktop () {
    document.getElementById('edit_contact_overlay').style.transform = "translate(-50%, -50%) translateX(0)";
}

/**
 * this function is used to resize the edit overlay
 */
function editOverlayMobile () {
    document.getElementById('edit_contact_overlay').style.setProperty("transform", "translate(-50%, -50%) translateX(0) translateY(0)", "important");
}

/**
 * this function is used to overwrite the data of a contact
 * @param {object} current - contains the old contact data of the contact
 * @returns {object} - contains the new contact data 
 */
function collectUpdatedFormData(current) {
    return {
        name: document.getElementById('edit-name-input').value.trim() || current.name,
        mail: document.getElementById('edit-mail-input').value.trim() || current.mail,
        phone: document.getElementById('edit-phone-input').value.trim() || current.phone,
    };
}

/**
 * this function is used to update the data of a contact in firebase
 * @param {string} id - id of the contact
 * @param {object} data - contains information like name, mail or phone 
 */
async function updateContactInFirebase(id, data) {
    await putData(`/contacts/${id}`, data);
}

/**
 * this function is used to edit contact information like name, mail or phone. it is executed on displays of <650 px width.
 */
function editMobileContact() {
    event.preventDefault();
    if (currentDisplayedContactId) {
        openEditContact(currentDisplayedContactId);
        closeContactOptions();
    }
}

/**
 * this function is used to delete a contact. executed from the editing overlay.
 */
function deleteContactFromEdit() {
    if (!currentlyEditingContactId) return;

    deleteContact(currentlyEditingContactId);

    closeOverlay('edit');
}

/**
 * this function is used to delete a contact. executed from the editing overlay on displays of <650 px width
 */
function deleteContactFromEditMobile() {
    if (!currentlyEditingContactId) return;
    deleteContact(currentlyEditingContactId);
    closeEditContact();
    goBack();
    closeContactOptions();
}

/**
 * Initializes validation for the edit contact form
 */
function setupEditValidation() {
    const nameInput = document.getElementById("edit-name-input");
    const mailInput = document.getElementById("edit-mail-input");
    const phoneInput = document.getElementById("edit-phone-input");
    const form = document.getElementById("edit-contact-form");
    const submitBtn = form.querySelector("button[type='submit']");

    const regexes = {
        name: /^[A-Za-z\s]+$/,
        mail: /^[A-Za-z0-9.]+@[A-Za-z]+\.[A-Za-z]+$/, 
        phone: /^\+?[0-9\s]{7,}$/
    };

    const errorMsgs = {
        name: {
            required: "Bitte einen Namen eingeben.",
            invalid: "Nur Buchstaben und Leerzeichen erlaubt."
        },
        mail: {
            required: "Bitte eine E-Mail-Adresse eingeben.",
            invalid: "Bitte eine gültige E-Mail eingeben, z.B muster@mail.de"
        },
        phone: {
            required: "Bitte eine Telefonnummer eingeben.",
            invalid: "Mindestens 7 Ziffern, nur Zahlen/Leerzeichen, optional + am Anfang."
        }
    };

    nameInput.addEventListener("input", () => {
        nameInput.value = nameInput.value.replace(/[^A-Za-z\s]/g, "");
    });

    phoneInput.addEventListener("input", () => {
        phoneInput.value = phoneInput.value.replace(/(?!^\+)[^\d\s]/g, "");
    });

    [nameInput, mailInput, phoneInput].forEach(input => {
        input.addEventListener("input", () => {
            if (input === nameInput) {
                validateInput(input, regexes.name, "edit-error-name", errorMsgs.name);
            } else if (input === mailInput) {
                validateInput(input, regexes.mail, "edit-error-mail", errorMsgs.mail);
            } else if (input === phoneInput) {
                validateInput(input, regexes.phone, "edit-error-phone", errorMsgs.phone);
            }
            toggleSubmit();
        });
    });

    form.addEventListener("submit", (event) => {
        if (submitBtn.disabled) {
            event.preventDefault();
            return;
        }
        submitBtn.disabled = true;
        setTimeout(() => submitBtn.disabled = false, 1500);
    });

    toggleSubmit();

    function toggleSubmit() {
        submitBtn.disabled = !(
            regexes.name.test(nameInput.value.trim()) &&
            regexes.mail.test(mailInput.value.trim()) &&
            regexes.phone.test(phoneInput.value.trim())
        );
    }
}