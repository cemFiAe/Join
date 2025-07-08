/**
 * Logs out user and redirects him to Log in page
 */
function logOutUser() {
    localStorage.removeItem("loggedIn");  
    window.location.replace("../pages/index.html"); 
}


/**
 * If user is not logged in, redirect to Log in page.
 * Redirection comes from important pages which demand user log in!
 */
function redirectUser() {
    if (!localStorage.getItem("loggedIn")) {
    window.location.replace("../pages/index.html"); 
    } 
}

