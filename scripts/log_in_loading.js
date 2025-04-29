
function showLoadingScreen() {
    document.getElementById('overlay').classList.add('loading-overlay');
    document.getElementById('log-in-logo').style.display = "block";
    setTimeout(function () {
        document.getElementById('overlay').style.display = "none";
        document.getElementById('main-content').style.display = "block";    
    }, 500);
}
