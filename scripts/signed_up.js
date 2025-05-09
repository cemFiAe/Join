
function signedUp() {
    let form = document.getElementById('sign-up-form')
    if (!form.checkValidity()) {
        return false;
    }

    document.getElementById('signed-up').style.display = "block"
    setTimeout(() => {
        document.getElementById('signed-up').style.display = "none"
        window.location.href = "../pages/log_in.html";
    }, 1000);
    return true;
}