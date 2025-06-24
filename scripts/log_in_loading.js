let overlay = document.getElementById('overlay')
let mainWindow = document.getElementById('main-window')

function showLoadingScreen() {
    setTimeout(function () {
        overlay.style.display = "none";
        mainWindow.style.display = "block";
    }, 500);
}

// Check if we came from sign up page, and based on it show the loading screen
function checkLoadingScreen() {
    if (!sessionStorage.getItem('cameFromSignUp')) {
        showLoadingScreen();
    } else {
        overlay.style.display = "none";
        mainWindow.style.display = "block";
        sessionStorage.removeItem('cameFromSignUp');
    }
}
