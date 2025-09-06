
let overlay = document.getElementById('overlay')
let mainWindow = document.getElementById('main-window')
let headerLogo = document.getElementById('header-logo')
let noLogo = document.getElementById('no-logo')
/**
 * This function ensures that overlay with message shows up 0.5s
 * when the user successfully signs up.
 */
function showLoadingScreen() {
    setTimeout(function () {
        mainWindow.style.display = "block";
        headerLogo.style.display = "block";
    }, 200);
    noLogo.style.display = "none";
    setTimeout(function () {
        overlay.style.display = "none";
    }, 800)
}


/**
 * We can get to the log in page in three ways: when we open it first time, 
 * when we sign up and it forwards us, and when we log out and it forwards us.
 * This function checks if user didn't came from sign up! (but other two ways)
 * If so, it calls showLoadingScreen function.
 * But if the user came from sign up, there is no overlay.
*/
function checkLoadingScreen() {
    if (!sessionStorage.getItem('cameFromSignUp')) {
        showLoadingScreen();
    } else {
        overlay.style.display = "none";
        mainWindow.style.display = "block";
        sessionStorage.removeItem('cameFromSignUp');
    }
}
