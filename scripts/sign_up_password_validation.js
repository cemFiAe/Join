// Password validation function
function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}

// Toggle password visibility and visibility matching icon:
function signUpVisibility(iconElement) {
    let passwordDiv = iconElement.closest('.sign-up-password');
    let passwordInput = passwordDiv.querySelector('input');

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        iconElement.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        passwordInput.type = "password";
        iconElement.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}

// Listen for clicks related to password input
document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.sign-up-password');
    let lockIcon = document.getElementById('sign-up-lock-icon');
    let passwordAlert = document.getElementById('sign-up-password-alert');

    if (e.target.id === 'sign-up-lock-icon') {
        signUpVisibility(e.target);
        return;
    }

    // Remove resetting the alert on outside click to keep validation messages visible
    if (!passwordDiv.contains(e.target)) {
        lockIcon.src = "../assets/icons/sign_up/lock.svg";
        // passwordAlert.innerHTML = "";  <-- Removed this line intentionally
    }
});

// Listen for input in password field
document.addEventListener('input', function (e) {
    let passwordDiv = document.querySelector('.sign-up-password');
    let passwordInput = document.getElementById('sign-up-password');
    let iconElement = document.getElementById('sign-up-lock-icon');
    let passwordAlert = document.getElementById('sign-up-password-alert');

    if (passwordDiv && passwordDiv.contains(e.target)) {
        if (passwordInput.value === "") {
            passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            passwordAlert.innerHTML = "";
            iconElement.src = "../assets/icons/sign_up/lock.svg";
        } else if (isPasswordValid(passwordInput.value)) {
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)';
            passwordAlert.innerHTML = "";
            iconElement.src = "../assets/icons/sign_up/visibility_off.svg";
        } else {
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            passwordAlert.innerHTML = "Please insert correct password";
            iconElement.src = "../assets/icons/sign_up/visibility_off.svg";
        }
    }
});
