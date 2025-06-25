
// Password validation for Log in page

var passwordDiv = document.querySelector('.log-in-password');
var passwordInput = document.getElementById('log-in-password');
var iconElement = document.getElementById('log-in-lock-icon');
var passwordAlert = document.getElementById('log-in-password-alert')

// Check password input, validate it and update styles accordingly:
passwordInput.addEventListener('input', function () {
    if (passwordInput.value === "") {
        iconElement.src = "../assets/icons/log_in/lock.svg";
        return;
    }

    const isValid = isPasswordValid(passwordInput.value);
    passwordDiv.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    passwordAlert.style.display = isValid ? "none" : "block";
    iconElement.src = isValid ? "../assets/icons/log_in/visibility.svg" : "../assets/icons/log_in/visibility_off.svg";
});

// Password validation function
function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}


// Check if the icon in input filed is clicked and: 
        // toggle password visibility and matching icon,
document.addEventListener('click', function (e) {
    if (e.target.id === 'log-in-lock-icon') {
        logInVisibility(e.target);
    } else { 
        // or hide password and show lock icon    
        iconElement.src = "../assets/icons/log_in/lock.svg";
        passwordInput.type = "password"
    }
});

// Function for changing password visibility and matching icon
function logInVisibility(iconElement) {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        iconElement.src = "../assets/icons/log_in/visibility.svg";
    } else {
        passwordInput.type = "password";
        iconElement.src = "../assets/icons/log_in/visibility_off.svg";
    }
}