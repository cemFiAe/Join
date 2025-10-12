/**
 * Auth Guard: prevents access on secure sites without login.
 * if not logged in, direct to index.html (Login).
 * will execute on load.
 */

window.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem("loggedIn") &&
        !window.location.pathname.endsWith("/index.html") &&
        !window.location.pathname.endsWith("index.html")
    ) {
        window.location.replace("./index.html");
    }
});