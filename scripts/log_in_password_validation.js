var passwordDiv = document.querySelector('.log-in-password');
var passwordInput = document.getElementById('log-in-password');
var iconElement = document.getElementById('log-in-lock-icon');
var passwordAlert = document.getElementById('log-in-password-alert')

// Password validation function
function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}

// Log in password visibility and visibility matching icon:
function logInVisibility(iconElement) {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        iconElement.src = "../assets/icons/log_in/visibility.svg";
    } else {
        passwordInput.type = "password";
        iconElement.src = "../assets/icons/log_in/visibility_off.svg";
    }
}


function resetProperties() {
    passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
    passwordAlert.style.display = 'none';
    iconElement.src = "../assets/icons/log_in/lock.svg";
}

passwordInput.addEventListener('input', function () {
    // if input is empty reset styles
    if (passwordInput.value === "") {
        resetProperties()
        return;
    }

    // if not empty validate and then update accordingly
    const isValid = isPasswordValid(passwordInput.value);
    passwordDiv.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    // passwordAlert.style.display = isValid ? "none" : "block";
    iconElement.src = isValid ? "../assets/icons/log_in/visibility.svg" : "../assets/icons/log_in/visibility_off.svg";
});

// Listen for clicks at icon, which is in password input:
document.addEventListener('click', function (e) {
    // if the icon is clicked, call logInVisibility();
    if (e.target.id === 'log-in-lock-icon') {
        logInVisibility(e.target);
        return;

    // if on document clicked, but not on two buttons: reset input
    } else if (e.target.id !== 'log-in-button' && e.target.id !== 'guest-log-in-button') {
        resetProperties()
    }
});

