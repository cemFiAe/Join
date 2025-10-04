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
 * Initializes validation behavior for the edit contact form.
 * Sets up input sanitization, validation, and submit control.
 */
function setupEditValidation() {
    const form = document.getElementById("edit-contact-form");
    const inputs = {
        name: document.getElementById("edit-name-input"),
        mail: document.getElementById("edit-mail-input"),
        phone: document.getElementById("edit-phone-input")
    };
    const submitBtn = form.querySelector("button[type='submit']");
    const regexes = getRegexes();
    const errorMsgs = getErrorMessages();

    setupInputSanitizers(inputs);
    setupInputListeners(inputs, regexes, errorMsgs, submitBtn);
    setupFormSubmit(form, submitBtn);
    toggleSubmit(inputs, regexes, submitBtn);
}

/**
 * Returns the regular expressions used for field validation.
 * @returns {Object} Regex patterns for name, mail, and phone validation.
 */
function getRegexes() {
    return {
        name: /^[A-Za-z\s]+$/,
        mail: /^[A-Za-z0-9.]+@[A-Za-z]+\.[A-Za-z]+$/,
        phone: /^\+?[0-9\s]{7,}$/
    };
}

/**
 * Returns localized error messages for form validation.
 * @returns {Object} Error messages for name, mail, and phone inputs.
 */
function getErrorMessages() {
    return {
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
}

/**
 * Sets up input sanitization by removing invalid characters in real time.
 * @param {Object} inputs - The input elements for name, mail, and phone.
 */
function setupInputSanitizers(inputs) {
    inputs.name.addEventListener("input", () => {
        inputs.name.value = inputs.name.value.replace(/[^A-Za-z\s]/g, "");
    });
    inputs.phone.addEventListener("input", () => {
        inputs.phone.value = inputs.phone.value.replace(/(?!^\+)[^\d\s]/g, "");
    });
}

/**
 * Attaches validation and submit toggle logic to input fields.
 * @param {Object} inputs - The input elements for name, mail, and phone.
 * @param {Object} regexes - Regex patterns for validation.
 * @param {Object} msgs - Error messages for validation feedback.
 * @param {HTMLButtonElement} submitBtn - The submit button element.
 */
function setupInputListeners(inputs, regexes, msgs, submitBtn) {
    Object.entries(inputs).forEach(([key, input]) => {
        input.addEventListener("input", () => {
            validateInput(input, regexes[key], `edit-error-${key}`, msgs[key]);
            toggleSubmit(inputs, regexes, submitBtn);
        });
    });
}

/**
 * Prevents multiple form submissions and re-enables the submit button.
 * @param {HTMLFormElement} form - The form element being validated.
 * @param {HTMLButtonElement} btn - The submit button to disable temporarily.
 */
function setupFormSubmit(form, btn) {
    form.addEventListener("submit", (e) => {
        if (btn.disabled) return e.preventDefault();
        btn.disabled = true;
        setTimeout(() => (btn.disabled = false), 1500);
    });
}

/**
 * Enables or disables the submit button based on form validity.
 * @param {Object} inputs - The input elements for name, mail, and phone.
 * @param {Object} regexes - The regex validation patterns.
 * @param {HTMLButtonElement} btn - The submit button to control.
 */
function toggleSubmit(inputs, regexes, btn) {
    btn.disabled = !(
        regexes.name.test(inputs.name.value.trim()) &&
        regexes.mail.test(inputs.mail.value.trim()) &&
        regexes.phone.test(inputs.phone.value.trim())
    );
}