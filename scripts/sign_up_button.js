function signedUp(event) {
    event.preventDefault();

    let name = document.querySelector('.name')
    let nameInput = document.getElementById('name-input');
    let nameAlert = document.getElementById('name-alert');

    let emailInput = document.getElementById('sign-up-email-input');
    let emailAlert = document.getElementById('sign-up-email-alert');

    let passwordDiv = document.querySelector('.sign-up-password');
    let passwordAlert = document.getElementById('sign-up-password-alert');

    let confirmDiv = document.querySelector('.confirm-password');
    let confirmAlert = document.getElementById('confirm-password-alert');

    let password = document.getElementById('sign-up-password');
    let confirm = document.getElementById('confirm-password');

    let checkbox = document.getElementById('accept-privacy-policy');

    let validPassword = isPasswordValid(password.value);
    let passwordsMatch = password.value === confirm.value;
    let email = emailInput.value.trim();
    let validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Reset alerts and borders
    nameInput.style.borderColor = '';
    nameAlert.style.display = "none";
    emailInput.style.borderColor = '';
    emailAlert.style.display = "none";
    passwordDiv.style.borderColor = '';
    passwordAlert.style.display = "none";
    confirmDiv.style.borderColor = '';
    confirmAlert.style.display = "none";

    // Validation checks
    if (nameInput.value.trim() === "") {
        nameInput.style.borderColor = 'rgb(255, 0, 31)';
        name.style.padding = "0px"
        nameAlert.style.display = "block";

        return false;
    }

    if (!validEmail) {
        emailInput.style.borderColor = 'rgb(255, 0, 31)';
        emailAlert.style.display = "block";
        return false;
    }

    if (!validPassword) {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        passwordAlert.style.display = "block";
        return false;
    }

    if (!passwordsMatch) {
        confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        confirmAlert.style.display = "block";
        return false;
    }

    if (!checkbox.checked) {
        alert('You must accept the privacy policy!');
        return false;
    }

    // Show success screen
    document.getElementById('signed-up-screen').style.display = "block";
    setTimeout(() => {
        document.getElementById('signed-up-screen').style.display = "none";
        window.location.href = "../pages/log_in.html";
        sessionStorage.setItem('cameFromSignUp', 'true');
    }, 1000);

    return true;
}
