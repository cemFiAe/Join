
function signedUp() {
    document.getElementById('signed-up').style.display = "block"
    setTimeout(() => {
        document.getElementById('signed-up').style.display = "none"
        window.location.href = "../pages/log_in.html";
    }, 1000);
}