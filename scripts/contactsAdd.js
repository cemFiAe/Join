// @ts-nocheck
/**
 * this function is used to add a contact to firebase / locally
 * @param {event} event - is necessary to prevent the refresh of the page on submit
 */
async function addNewContact(event) {
    event.preventDefault();
    const newContactData = getFormData();

    const newId = await saveContactToFirebase(newContactData);
    addContactLocally(newId, newContactData);
    document.getElementById('add-contact-form').reset();
    closeOverlay('add');
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
 * Validates an input field against a regex and displays error messages.
 * @param {HTMLInputElement} input - The input element to validate.
 * @param {RegExp} regex - Regular expression used for validation.
 * @param {string} errorId - The ID of the corresponding error container (DIV).
 * @param {{required: string, invalid: string}} errorMsg - Error messages for empty or invalid input.
 * @returns {boolean} - True if input is valid, otherwise false.
 */
function validateInput(input, regex, errorId, errorMsg) {
    const errorDiv = document.getElementById(errorId);
    errorDiv.classList.add("error-message");

    if (!input.value.trim()) {
        errorDiv.textContent = errorMsg.required;
        input.classList.add("input-error");
        return false;
    } else if (!regex.test(input.value.trim())) {
        errorDiv.textContent = errorMsg.invalid;
        input.classList.add("input-error");
        return false;
    }

    errorDiv.textContent = "";
    input.classList.remove("input-error");
    return true;
}

/**
 * Checks all input fields (name, email, phone) and enables/disables the submit button.
 * @returns {boolean} - True if all inputs are valid, otherwise false.
 */
function allInputsValid() {
    const nameInput = document.getElementById("add-name-input");
    const mailInput = document.getElementById("add-mail-input");
    const phoneInput = document.getElementById("add-phone-input");

    const regexes = {
        name: /^[A-Za-z\s]+$/,
        mail: /^[A-Za-z0-9.]+@[A-Za-z]+\.[A-Za-z]+$/,
        phone: /^\+?[0-9\s]{7,}$/
    };

    return (
        regexes.name.test(nameInput.value.trim()) &&
        regexes.mail.test(mailInput.value.trim()) &&
        regexes.phone.test(phoneInput.value.trim())
    );
}

/**
 * Regular expression constants used for validating name, email, and phone inputs.
 * - name: Allows only letters (A-Z, a-z) and spaces.
 * - mail: Requires alphanumeric characters and dots before "@", followed by a valid domain.
 * - phone: Allows digits and spaces with an optional leading "+"; must contain at least 7 digits.
 */
const regexes = {
    name: /^[A-Za-z\s]+$/,
    mail: /^[A-Za-z0-9.]+@[A-Za-z]+\.[A-Za-z]+$/,
    phone: /^\+?[0-9\s]{7,}$/
};

/**
 * Error message templates for each input field.
 * Each field has a "required" and an "invalid" message,
 * which are displayed depending on validation result.
 */
const errorMsgs = {
    name: {
        required: "Please enter a name.",
        invalid: "Only letters and spaces are allowed."
    },
    mail: {
        required: "Please enter an e-mail.",
        invalid: "Please enter a valid e-mail, e.g example@mail.de"
    },
    phone: {
        required: "Please enter a phone number.",
        invalid: "At least 7 numbers, only numbers / spaces allowed, optional + at start."
    }
};

/**
 * Attaches input sanitizers to the name and phone fields.
 * - Name field: Removes all characters except letters and spaces.
 * - Phone field: Removes all characters except digits, spaces, and a leading "+".
 * @param {HTMLInputElement} nameInput - Input element for the contact name.
 * @param {HTMLInputElement} phoneInput - Input element for the contact phone number.
 */
function setupSanitizers(nameInput, phoneInput) {
    nameInput.addEventListener("input", () => {
        nameInput.value = nameInput.value.replace(/[^A-Za-z\s]/g, "");
    });

    phoneInput.addEventListener("input", () => {
        phoneInput.value = phoneInput.value.replace(/(?!^\+)[^\d\s]/g, "");
    });
}

/**
 * Sets up real-time validation listeners for the given input fields.
 * On each keystroke, validates the active input field and updates
 * the submit button/overlay state.
 * @param {HTMLInputElement[]} inputs - Array of input elements (name, mail, phone).
 * @param {HTMLButtonElement} submitBtn - The submit button of the form.
 * @param {HTMLElement} overlay - The overlay element used to indicate submit state.
 */
function setupValidationListeners(inputs, submitBtn, overlay) {
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            if (document.activeElement === input) {
                validateSpecificInput(input);
            }
            toggleSubmitState(submitBtn, overlay);
        });
    });
}

/**
 * Validates a specific input field by matching its ID against
 * the corresponding regex and error messages.
 * @param {HTMLInputElement} input - The input element to validate.
 */
function validateSpecificInput(input) {
    if (input.id === "add-name-input") {
        validateInput(input, regexes.name, "error-name", errorMsgs.name);
    } else if (input.id === "add-mail-input") {
        validateInput(input, regexes.mail, "error-mail", errorMsgs.mail);
    } else if (input.id === "add-phone-input") {
        validateInput(input, regexes.phone, "error-phone", errorMsgs.phone);
    }
}


/**
 * Updates the submit button and overlay state depending on form validity.
 * - Disables the submit button if any input is invalid.
 * - Shows the overlay when submit is disabled, hides it otherwise.
 * @param {HTMLButtonElement} submitBtn - The submit button of the form.
 * @param {HTMLElement} overlay - The overlay element used to indicate submit state.
 */
function toggleSubmitState(submitBtn, overlay) {
    submitBtn.disabled = !allInputsValid();
    overlay.style.display = submitBtn.disabled ? "block" : "none";
}

/**
 * Sets up form submission behavior and overlay click validation.
 * - Prevents submission if inputs are invalid.
 * - Temporarily disables submit button and shows overlay on submit.
 * - Validates all inputs when the overlay is clicked.
 * @param {HTMLFormElement} form - The contact form element.
 * @param {HTMLButtonElement} submitBtn - The submit button of the form.
 * @param {HTMLElement} overlay - The overlay element used to indicate submit state.
 * @param {HTMLInputElement[]} inputs - Array of input elements (name, mail, phone).
 */
function setupFormSubmit(form, submitBtn, overlay, inputs) {
    form.addEventListener("submit", (event) => {
        if (!allInputsValid()) {
            event.preventDefault();
            return;
        }
        submitBtn.disabled = true;
        overlay.style.display = "block";
        setTimeout(() => {
            submitBtn.disabled = false;
            overlay.style.display = "none";
        }, 1500);
    });

    overlay.addEventListener("click", () => {
        inputs.forEach(input => validateSpecificInput(input));
    });
}

/**
 * Initializes form validation logic.
 * - Binds sanitizers to name and phone fields.
 * - Sets up validation listeners for all inputs.
 * - Configures submit behavior and overlay interaction.
 * - Disables submit button and shows overlay by default.
 */
function setupValidation() {
    const nameInput = document.getElementById("add-name-input");
    const mailInput = document.getElementById("add-mail-input");
    const phoneInput = document.getElementById("add-phone-input");
    const form = document.getElementById("add-contact-form");
    const submitBtn = form.querySelector("button[type='submit']");
    const overlay = document.getElementById("submit-overlay");

    const inputs = [nameInput, mailInput, phoneInput];

    setupSanitizers(nameInput, phoneInput);
    setupValidationListeners(inputs, submitBtn, overlay);
    setupFormSubmit(form, submitBtn, overlay, inputs);

    submitBtn.disabled = true;
    overlay.style.display = "block";
}


/** 
 * call setupValidation on page load
 */ 
document.addEventListener("DOMContentLoaded", setupValidation);

/**
 * Saves a new contact to Firebase Realtime Database.
 * @param {Object} data - Contact data object containing name, mail, and phone.
 * @returns {Promise<string>} - The newly generated contact ID from Firebase.
 */
async function saveContactToFirebase(data) {
    const response = await postData("/contacts", data);
    return response.name;
}

/**
 * Adds a contact to the local contacts array.
 * @param {string} id - Unique contact ID (from Firebase).
 * @param {Object} data - Contact data object containing name, mail, and phone.
 */
function addContactLocally(id, data) {
    contacts.push({ id, data });
}

/**
 * Focuses on the newly created contact in the contact list.
 * Uses requestAnimationFrame to ensure the DOM is updated before scrolling/highlighting.
 * @param {string} id - The ID of the contact to focus on.
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
 * Scrolls to and highlights a specific contact element inside the contacts container.
 * If removeOnly is true, existing highlights are cleared without applying a new one.
 * @param {HTMLElement} element - The contact element to scroll to and highlight.
 * @param {boolean} [removeOnly=false] - If true, removes highlights without adding a new one.
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