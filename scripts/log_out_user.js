
// Log out user and redirect to Log in page
function logOutUser() {
    localStorage.removeItem("loggedIn");  
    window.location.replace("../pages/index.html"); 
}

// If user is not logged in, redirect to Log in page
if (!localStorage.getItem("loggedIn")) {
    window.location.replace("../pages/index.html"); 
}
