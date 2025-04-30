
function showLoadingScreen() {
    setTimeout(function () {
        document.getElementById('overlay').style.display = "none";
        document.getElementById('main-content').style.display = "block";    
    }, 500);
}
