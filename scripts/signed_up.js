function signedUp(event) {
    event.preventDefault();

    let pass = document.getElementById('password');
    let confirm = document.getElementById('confirm-password');
    let passwordDiv = document.querySelector('.password');
    let confirmDiv = document.querySelector('.confirm-password');
    let checkbox = document.getElementById('accept-privacy-policy');

    // Check if passwords match and follow rules
    let validPassword = isPasswordValid(pass.value);
    let passwordsMatch = pass.value === confirm.value;

    if (!validPassword) {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        return false;
    }

    if (!passwordsMatch) {
        confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        return false;
    }

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

