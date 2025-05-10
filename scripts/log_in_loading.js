function showLoadingScreen() {
    setTimeout(function () {
        document.getElementById('overlay').style.display = "none";
        document.getElementById('main-window').style.display = "block";
    }, 500);
}

function checkLoadingScreen() {
    if (!sessionStorage.getItem('cameFromSignUp')) {
        showLoadingScreen();
    } else {
        document.getElementById('overlay').style.display = "none";
        document.getElementById('main-window').style.display = "block";
        sessionStorage.removeItem('cameFromSignUp');
    }
}
