/**
 * Fügt einen neuen Kontakt zu Firebase und lokal hinzu
 * @param {event} event - verhindert das automatische Neuladen des Formulars
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
 * Holt die Daten aus den Input-Feldern des Kontaktformulars
 */
function getFormData() {
    return {
        name: document.getElementById('add-name-input').value.trim(),
        mail: document.getElementById('add-mail-input').value.trim(),
        phone: document.getElementById('add-phone-input').value.trim()
    };
}

/**
 * Prüft, ob alle Felder ausgefüllt wurden
 */
function validateContactData({ name, mail, phone }) {
    if (!name || !mail || !phone) {
        alert("Bitte alle Felder ausfüllen.");
        return false;
    }
    return true;
}

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
