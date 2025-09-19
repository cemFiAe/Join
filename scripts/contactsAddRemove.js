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
 * Initializes form validation:
 * - Validates only the currently focused input
 * - Disables the submit button until all inputs are valid
 */
function setupValidation() {
    const nameInput = document.getElementById("add-name-input");
    const mailInput = document.getElementById("add-mail-input");
    const phoneInput = document.getElementById("add-phone-input");
    const form = document.getElementById("add-contact-form");
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

    // Echtzeit-Filter für Name
    nameInput.addEventListener("input", () => {
        nameInput.value = nameInput.value.replace(/[^A-Za-z\s]/g, "");
    });

    // Echtzeit-Filter für Phone
    phoneInput.addEventListener("input", () => {
        phoneInput.value = phoneInput.value.replace(/(?!^\+)[^\d\s]/g, "");
    });

    // Validation nur für das aktuell fokussierte Feld
    [nameInput, mailInput, phoneInput].forEach(input => {
        input.addEventListener("input", () => {
            if (document.activeElement === input) {
                if (input === nameInput) {
                    validateInput(input, regexes.name, "error-name", errorMsgs.name);
                } else if (input === mailInput) {
                    validateInput(input, regexes.mail, "error-mail", errorMsgs.mail);
                } else if (input === phoneInput) {
                    validateInput(input, regexes.phone, "error-phone", errorMsgs.phone);
                }
            }
            submitBtn.disabled = !allInputsValid();
        });
    });

    // Block mehrfach Submit
    form.addEventListener("submit", (event) => {
        if (!allInputsValid()) {
            event.preventDefault();
            return;
        }
        submitBtn.disabled = true;
        setTimeout(() => submitBtn.disabled = false, 1500);
    });

    // Initial state
    submitBtn.disabled = true;
}

/** 
 * Call setupValidation on page load
 */ 
document.addEventListener("DOMContentLoaded", setupValidation);

/**
 * saves new contact to firebase
 */
async function saveContactToFirebase(data) {
    const response = await postData("/contacts", data);
    return response.name; // new ID from firebase
}

/**
 * adds contact locally to contacts array
 */
function addContactLocally(id, data) {
    contacts.push({ id, data });
}

/**
 * focuses on the newly created contact
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
 * scrolls and highlights the newly created contact
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
 * deletes a contact and removes him from all tasks and contact list
 * @param {string} id - die ID des Kontakts
 */
async function deleteContact(id) {
    // 1. load tasks 
    let tasksResponse = await fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/tasks.json");
    let tasks = await tasksResponse.json();
    let updates = {};

// tasks: the loaded task-object from firebase
for (let taskId in tasks) {
    let t = tasks[taskId];
    if (Array.isArray(t.assignedTo)) {
        if (t.assignedTo.includes(id)) {
            const newAssigned = t.assignedTo.filter(uid => uid !== id);
            await fetch(`https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}/assignedTo.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAssigned)
            });
        }
    } else if (typeof t.assignedTo === "string" && t.assignedTo === id) {
        await fetch(`https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}/assignedTo.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([])
        });
    }
}

    // 2. deletes contact from contacts 
    await deleteContactFromFirebase(id);
    removeContactFromLocalArray(id);
    document.getElementById('contact_information').innerHTML = '';
    rerenderContactList();

    if (window.loadAllTasks) window.loadAllTasks();
}




/**
 * deletes contact from firebase
 */
async function deleteContactFromFirebase(id) {
    try {
        const url = `https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/contacts/${id}.json`;
        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) {
            throw new Error("Fehler beim Löschen aus Firebase: " + response.status);
        }
    } catch (err) {
        console.error("DELETE Kontakt-Fehler:", err);
        throw err;
    }
}

/**
 * deletes contact from local contact array
 */
function removeContactFromLocalArray(id) {
    contacts = contacts.filter(contact => contact.id !== id);
}

/**
 * special delete for mobile (< 650px)
 */
function deleteMobileContact() {
    event.preventDefault();
    if (currentDisplayedContactId) {
        deleteContact(currentDisplayedContactId);
    }
    goBack();
    closeContactOptions();
}