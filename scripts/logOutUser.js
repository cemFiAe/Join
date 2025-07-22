/**
 * Logs out user and redirects them to the login page.
 * Ensures no back navigation after logout.
 */
function logOutUser() {
    localStorage.removeItem("loggedIn");
    window.location.replace("../index.html"); 
}
