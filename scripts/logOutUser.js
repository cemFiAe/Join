/**
 * Logs out user and redirects him to Log in page
 */
function logOutUser() {
    localStorage.removeItem("loggedIn");  
    window.location.replace("../index.html"); 
}


