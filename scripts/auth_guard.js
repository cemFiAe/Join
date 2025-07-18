/**
 * Redirection comes from important pages which demand user log in!
 * If user is not logged in, redirect to Log in page.
 * Else, it prevents going back to the previous page.
 * redirectUser is called on page load to check if the user is logged in or not.
 */
function redirectUser() {
    if (!localStorage.getItem("loggedIn")) {
        window.location.replace("../pages/index.html");
    } else {
        window.history.forward(); 
    }
}
window.addEventListener('load', redirectUser);

