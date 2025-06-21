
// 🔒 Check login status on page load
if (!localStorage.getItem("loggedIn")) {
    window.location.href = "../pages/index.html";
}

// 🔓 Logout function
function logOutUser() {
    localStorage.removeItem("loggedIn");

    // Prevent navigating back by replacing history
    window.location.replace("../pages/index.html");
}
