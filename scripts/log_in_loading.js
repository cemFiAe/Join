
function showLoadingScreen() {
    setTimeout(function () {
        document.getElementById('overlay').style.display = "none";
        document.getElementById('main-window').style.display = "block"; 
    }, 500);
}

