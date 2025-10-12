/**
 * Initializes the guest login button once the DOM is fully loaded.
 * Attaches a click handler that logs in the user as a guest,
 * saves guest user data in localStorage, and redirects to the summary page.
 */
document.addEventListener("DOMContentLoaded", function () {
    const guestLogInButton = document.getElementById('guest-log-in-button');
    if (guestLogInButton) {
        guestLogInButton.addEventListener('click', function (e) {
            e.preventDefault();

            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("currentUserName", "Guest");
            localStorage.setItem("currentUserType", "guest");
            localStorage.setItem("currentUser", JSON.stringify({
                name: "Guest User",
                email: "guest@join.com",
                isGuest: true
            }));

            window.location.href = "./pages/summary.html";
        });
    }
});