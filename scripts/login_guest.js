// login_guest.js

document.addEventListener("DOMContentLoaded", function () {
    const guestLogInButton = document.getElementById('guest-log-in-button');
    if (guestLogInButton) {
        guestLogInButton.addEventListener('click', function (e) {
            e.preventDefault();

            // Setze Guest-User-Daten ins localStorage für spätere Verwendung
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("currentUserName", "Guest");
            localStorage.setItem("currentUserType", "guest");
            localStorage.setItem("currentUser", JSON.stringify({
                name: "Guest User",
                email: "guest@join.com",
                isGuest: true
            }));

            // Weiterleitung zur Summary-Seite
            window.location.href = "../pages/summary.html";
        });
    }
});
