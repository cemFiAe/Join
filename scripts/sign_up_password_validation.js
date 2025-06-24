    var passwordDiv = document.querySelector('.sign-up-password');
    var passwordInput = document.getElementById('sign-up-password');
    var iconElement = document.getElementById('sign-up-lock-icon');
    var passwordAlert = document.getElementById('sign-up-password-alert');

// Password validation function
function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}

// Toggle password visibility and visibility matching icon:
function signUpVisibility(iconElement) {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        iconElement.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        passwordInput.type = "password";
        iconElement.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}

// Listen for clicks at icon, which is in password input:
document.addEventListener('click', function (e) {


    // if the icon is clicked, call signUpVisibility();
    if (e.target.id === 'sign-up-lock-icon') {
        signUpVisibility(e.target);
        return;
    }

    // if outside password input is clicked, reset input
    if (!passwordDiv.contains(e.target)) {
        lockIcon.src = "../assets/icons/sign_up/lock.svg";
    }
});

// Listen for input in password field
document.addEventListener('input', function (e) {

    // Validate input 
    if (passwordDiv.contains(e.target)) {
        if (passwordInput.value === "") { // if no input
            passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            passwordAlert.innerHTML = "";
            iconElement.src = "../assets/icons/sign_up/lock.svg";

        } else if (isPasswordValid(passwordInput.value)) { // if input is valid
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)';
            passwordAlert.innerHTML = "";
            iconElement.src = "../assets/icons/sign_up/visibility_off.svg";

        } else { // if input is not valid
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            passwordAlert.innerHTML = "Please insert correct password";
            iconElement.src = "../assets/icons/sign_up/visibility_off.svg";
        }
    }
});
