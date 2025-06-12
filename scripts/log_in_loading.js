function showLoadingScreen() {
    setTimeout(function () {
        document.getElementById('overlay').style.display = "none";
        document.getElementById('main-window').style.display = "block";
    }, 500);
}

// Check if we came from sign up page, and based on it show the loading screen
function checkLoadingScreen() {
    if (!sessionStorage.getItem('cameFromSignUp')) {
        showLoadingScreen();
    } else {
        document.getElementById('overlay').style.display = "none";
        document.getElementById('main-window').style.display = "block";
        sessionStorage.removeItem('cameFromSignUp');
    }
}
