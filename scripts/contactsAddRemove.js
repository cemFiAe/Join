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

function setupValidation() {
    const nameInput = document.getElementById("add-name-input");
    const mailInput = document.getElementById("add-mail-input");
    const phoneInput = document.getElementById("add-phone-input");

    // Regex Regeln
    const nameRegex = /^[A-Za-zÄÖÜäöüß\s]+$/;
    const mailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const phoneRegex = /^\+?[0-9\s]{7,}$/;

    // --- Name ---
    nameInput.addEventListener("input", function () {
        this.value = this.value.replace(/[^A-Za-zÄÖÜäöüß\s]/g, ""); // blockiert falsche Zeichen
        const errorDiv = document.getElementById("error-name");
        if (!this.value.trim()) {
            errorDiv.textContent = "Bitte einen Namen eingeben.";
        } else if (!nameRegex.test(this.value)) {
            errorDiv.textContent = "Nur Buchstaben und Leerzeichen erlaubt.";
        } else {
            errorDiv.textContent = "";
        }
    });

    // --- Mail ---
    mailInput.addEventListener("input", function () {
        const errorDiv = document.getElementById("error-mail");
        if (!this.value.trim()) {
            errorDiv.textContent = "Bitte eine E-Mail-Adresse eingeben.";
        } else if (!mailRegex.test(this.value)) {
            errorDiv.textContent = "Bitte ein gültiges Format verwenden (z. B. name@mail.de).";
        } else {
            errorDiv.textContent = "";
        }
    });

    // --- Phone ---
    phoneInput.addEventListener("input", function () {
        this.value = this.value.replace(/(?!^\+)[^\d\s]/g, ""); // nur + am Anfang, sonst Ziffern + Leerzeichen
        const errorDiv = document.getElementById("error-phone");
        if (!this.value.trim()) {
            errorDiv.textContent = "Bitte eine Telefonnummer eingeben.";
        } else if (!phoneRegex.test(this.value)) {
            errorDiv.textContent = "Mindestens 7 Ziffern, nur Zahlen/Leerzeichen, optional + am Anfang.";
        } else {
            errorDiv.textContent = "";
        }
    });

    // --- Validierung beim Submit ---
    document.getElementById("add-contact-form").addEventListener("submit", function (event) {
        if (
            !nameRegex.test(nameInput.value.trim()) ||
            !mailRegex.test(mailInput.value.trim()) ||
            !phoneRegex.test(phoneInput.value.trim())
        ) {
            event.preventDefault();
        }
    });
}

// Call setupValidation on page load
document.addEventListener("DOMContentLoaded", setupValidation);

/**
 * Speichert den neuen Kontakt in Firebase
 */
async function saveContactToFirebase(data) {
    const response = await postData("/contacts", data);
    return response.name; // Die neue ID von Firebase
}

/**
 * Fügt Kontakt lokal in das contacts-Array ein
 */
function addContactLocally(id, data) {
    contacts.push({ id, data });
}

/**
 * Hebt neu erstellten Kontakt hervor
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
 * Scrollt zu einem Kontakt und hebt ihn hervor
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
 * Löscht einen Kontakt, entfernt ihn aus allen Aufgaben und der Datenbank
 * @param {string} id - die ID des Kontakts
 */
async function deleteContact(id) {
    // 1. Tasks laden
    let tasksResponse = await fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/tasks.json");
    let tasks = await tasksResponse.json();
    let updates = {};

// tasks: das geladene Task-Objekt (aus der Firebase-DB)
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

    // 2. Kontakt aus contacts löschen
    await deleteContactFromFirebase(id);
    removeContactFromLocalArray(id);
    document.getElementById('contact_information').innerHTML = '';
    rerenderContactList();

    if (window.loadAllTasks) window.loadAllTasks();
}




/**
 * Löscht einen Kontakt aus der Firebase-Datenbank
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
 * Entfernt Kontakt lokal aus dem Array
 */
function removeContactFromLocalArray(id) {
    contacts = contacts.filter(contact => contact.id !== id);
}

/**
 * Spezielles Löschen für Mobilgeräte (< 650px)
 */
function deleteMobileContact() {
    event.preventDefault();
    if (currentDisplayedContactId) {
        deleteContact(currentDisplayedContactId);
    }
    goBack();
    closeContactOptions();
}
