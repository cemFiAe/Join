/**
 * Auth Guard: Verhindert Zugriff auf geschützte Seiten ohne Login.
 * Wenn nicht eingeloggt, weiterleiten zur index.html (Login).
 * Wird beim Laden der Seite ausgeführt.
 */
// 1. Neue, robuste Umleitungslogik ganz oben!

window.addEventListener('DOMContentLoaded', function() {
    if (
        !localStorage.getItem("loggedIn") &&
        !window.location.pathname.endsWith("/index.html") &&
        !window.location.pathname.endsWith("index.html")
    ) {
        window.location.href = "../index.html";
    }
});

// 2. (Optional) Deine bisherige Logik – kannst du auch rausnehmen:
function redirectUser() {
    if (!localStorage.getItem("loggedIn")) {
        window.location.replace("../index.html");
    } else {
        window.history.forward(); 
    }
}
window.addEventListener('load', redirectUser);
