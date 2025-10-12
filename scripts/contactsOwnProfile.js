let currentUserId = null; 
let currentUserMail = null; 

/**
 * sets the current logged in user (f.e after login-callback)
 */
function setCurrentUser(id, mail) {
    currentUserId = id;
    currentUserMail = mail;
}

/**
 * checks, if a contact is the currently logged in user
 * @param {Object} contact - an object from contacts[]
 * @returns {boolean}
 */
function isOwnContact(contact) {
    return (contact.id === currentUserId) ||
        (contact.data && contact.data.mail && contact.data.mail === currentUserMail);
}

/**
 * adds the user to the contact list (if not already added)
 * should be called before the rendering of the contactlist!
 */
function ensureOwnContactInList() {
    if (!currentUserId || !currentUserMail) return;

    let alreadyExists = contacts.some(c => isOwnContact(c));
    if (!alreadyExists) {
        contacts.push({
            id: currentUserId,
            data: {
                name: "Mein Profil",
                mail: currentUserMail,
                phone: "-"
            }
        });
    }
}

/**
 * patches the rendering of the contacts, so that the user shows up
 */
(function () {
    const originalRenderAllContacts = window.renderAllContacts;

    window.renderAllContacts = function () {
        ensureOwnContactInList();
        originalRenderAllContacts.apply(this, arguments);
    };
})();