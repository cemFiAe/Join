function signedUp(event) {
    event.preventDefault();

    let form = document.getElementById('sign-up-form');
    if (!form.checkValidity()) {
        return false;
    } 
    
    let checkbox = document.getElementById('accept-privacy-policy');
    if (!checkbox.checked) {
        alert('You must accept the privacy policy!');
        return false;
    }

    document.getElementById('signed-up').style.display = "block";
    setTimeout(() => {
        document.getElementById('signed-up').style.display = "none";
        window.location.href = "../pages/log_in.html";
        sessionStorage.setItem('cameFromSignUp', 'true');
    }, 1000);
    return true;
}
