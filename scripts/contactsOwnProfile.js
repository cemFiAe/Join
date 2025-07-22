/**
 * Zeigt den eigenen Account auch in der Kontaktliste und macht ihn bearbeitbar.
 * Diese Datei muss nach currentUser.js und vor contacts.js eingebunden werden!
 */

// === Konfigurationswerte anpassen (z.B. nach Login setzen) ===
let currentUserId = null; // z.B. "abc123"
let currentUserMail = null; // z.B. "ich@beispiel.de"

// --- Initialisierung ---
/**
 * Setzt den aktuell eingeloggten User (z.B. nach Login-Callback aufrufen)
 */
function setCurrentUser(id, mail) {
    currentUserId = id;
    currentUserMail = mail;
}

/**
 * Prüft, ob ein Kontakt der aktuell eingeloggte User ist
 * @param {Object} contact - ein Kontaktobjekt aus contacts[]
 * @returns {boolean}
 */
function isOwnContact(contact) {
    // Prüft auf id oder (wenn nicht vorhanden) auf Mail
    return (contact.id === currentUserId) ||
        (contact.data && contact.data.mail && contact.data.mail === currentUserMail);
}

/**
 * Fügt den eigenen User als Kontakt zur Liste hinzu (falls nicht schon da)
 * Sollte direkt vor dem Rendern der Kontaktliste aufgerufen werden!
 */
function ensureOwnContactInList() {
    if (!currentUserId || !currentUserMail) return;

    // Ist schon als Kontakt drin?
    let alreadyExists = contacts.some(c => isOwnContact(c));
    if (!alreadyExists) {
        // Dummy-Daten, ggf. aus User-Profil laden!
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

// --- PATCH: Rendering hooken ---
/**
 * Patcht das Rendern der Kontakte so, dass der eigene User immer dabei ist
 */
(function () {
    // Original-Funktion speichern
    const originalRenderAllContacts = window.renderAllContacts;

    window.renderAllContacts = function () {
        ensureOwnContactInList();
        originalRenderAllContacts.apply(this, arguments);
    };
})();

/**
 * Optional: Beim Klick/Öffnen eines Kontakts extra Stil setzen oder Sperre
 * (z.B. falls eigenes Profil nicht löschbar sein soll)
 * Dazu kannst du in showDetails oder handleContactClick prüfen:
 * if (isOwnContact(contact)) { ... }
 */
