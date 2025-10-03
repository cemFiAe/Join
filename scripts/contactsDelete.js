/**
 * Deletes a contact and removes them from all tasks and contact list.
 * @param {string} id - The ID of the contact.
 */
async function deleteContact(id) {
    const tasks = await loadAllTasksFromFirebase();
    await updateTasksAssignedToContact(tasks, id);
    await finalizeContactDeletion(id);
}

/**
 * Loads all tasks from Firebase.
 * @returns {Promise<Object>} - The tasks object from Firebase.
 */
async function loadAllTasksFromFirebase() {
    const res = await fetch("https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/tasks.json");
    return res.json();
}

/**
 * Updates task assignments to remove a specific contact ID.
 * @param {Object} tasks - The tasks object from Firebase.
 * @param {string} id - The contact ID to remove.
 */
async function updateTasksAssignedToContact(tasks, id) {
    for (let taskId in tasks) {
        let task = tasks[taskId];
        if (Array.isArray(task.assignedTo)) {
            await removeIdFromTaskArray(taskId, task.assignedTo, id);
        } else if (task.assignedTo === id) {
            await clearTaskAssignment(taskId);
        }
    }
}

/**
 * Removes a specific contact ID from a task's assignedTo array in Firebase.
 * If the contact ID is not in the array, no update is performed.
 * @param {string} taskId - The ID of the task to update.
 * @param {string[]} assignedTo - The current array of assigned contact IDs.
 * @param {string} id - The contact ID to remove.
 */
async function removeIdFromTaskArray(taskId, assignedTo, id) {
    if (!assignedTo.includes(id)) return;
    const newAssigned = assignedTo.filter(uid => uid !== id);
    await updateTaskAssignedTo(taskId, newAssigned);
}

/**
 * Clears the assignedTo field of a task in Firebase.
 * Used when the contact ID was the only assignment.
 * @param {string} taskId - The ID of the task to clear.
 */
async function clearTaskAssignment(taskId) {
    await updateTaskAssignedTo(taskId, []);
}

/**
 * Updates the assignedTo field of a task in Firebase with a new array of contact IDs.
 * @param {string} taskId - The ID of the task to update.
 * @param {string[]} assignedTo - The new array of assigned contact IDs.
 */
async function updateTaskAssignedTo(taskId, assignedTo) {
    await fetch(`https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/tasks/${taskId}/assignedTo.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignedTo)
    });
}

/**
 * Finalizes the deletion of a contact by removing it from Firebase,
 * updating the local array, clearing UI state, and re-rendering the contact list.
 * @param {string} id - The contact ID to delete.
 */
async function finalizeContactDeletion(id) {
    await deleteContactFromFirebase(id);
    removeContactFromLocalArray(id);
    document.getElementById('contact_information').innerHTML = '';
    rerenderContactList();
    if (window.loadAllTasks) window.loadAllTasks();
}

/**
 * Deletes a contact from Firebase by its ID.
 * Throws an error if the deletion fails.
 * @param {string} id - The contact ID to delete.
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
 * Removes a contact from the local contacts array by filtering it out.
 * @param {string} id - The contact ID to remove from the array.
 */
function removeContactFromLocalArray(id) {
    contacts = contacts.filter(contact => contact.id !== id);
}

/**
 * Handles special contact deletion for mobile devices (< 650px width).
 * Prevents default event behavior, deletes the currently displayed contact,
 * and navigates back while closing the contact options menu.
 */
function deleteMobileContact() {
    event.preventDefault();
    if (currentDisplayedContactId) {
        deleteContact(currentDisplayedContactId);
    }
    goBack();
    closeContactOptions();
}