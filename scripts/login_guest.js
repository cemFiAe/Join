document.addEventListener("DOMContentLoaded", function () {
    const guestLogInButton = document.getElementById('guest-log-in-button');
    if (guestLogInButton) {
        guestLogInButton.addEventListener('click', function (e) {
            e.preventDefault();
            // Setze Guest-User-Daten ins localStorage für spätere Verwendung im Avatar etc.
            // Für Guest-Login
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("currentUser", JSON.stringify({
                name: "Guest User",
                email: "guest@join.com",
                isGuest: true
            }));
                // Im Guest-Login-Code
                localStorage.setItem("currentUserName", "Guest");
                localStorage.setItem("currentUserType", "guest");
                localStorage.setItem("loggedIn", "true");
                window.location.href = "../pages/summary.html";
        });
    }

        const avatar = document.getElementById("board-user-avatar");
    if (avatar) {
        avatar.innerText = getUserInitials();
        if (isGuestUser()) {
            avatar.title = "Guest User";
            avatar.classList.add("guest-avatar");
        } else {
            const user = getCurrentUser();
            avatar.title = user.name || "User";
            avatar.classList.remove("guest-avatar");
        }
    }
});
