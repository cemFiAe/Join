
// Password validation function

function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}

// Check input, and perform accordingly:
document.addEventListener('input', function (e) {
    let passwordDiv = document.querySelector('.log-in-password');
    let passwordInput = document.getElementById('log-in-password');
    let iconElement = document.getElementById('log-in-lock-icon');
    let passwordAlert = document.getElementById('log-in-password-alert')

    // Check if input is true --->
    if (passwordDiv && passwordDiv.contains(e.target)) {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        iconElement.src = "../assets/icons/log_in/visibility_off.svg";

        // ---> check the input/password and highlight accordingly;
        if (isPasswordValid(passwordInput.value)) {  // if valid:
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)';
            passwordAlert.innerHTML = "";

        } else {  // if not valid:
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            passwordAlert.innerHTML = "Please insert correct password";
        }

        // if input is empty:
        if (passwordInput.value === "") {
            passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            passwordAlert.innerHTML = "";
            iconElement.src = "../assets/icons/log_in/lock.svg";
        }
    }
});

// Log in password visibility and visibility matching icon:
function logInVisibility(iconElement) {

    // Find the closest .log-in-password container to this icon
    let passwordDiv = iconElement.closest('.log-in-password');
    let passwordInput = passwordDiv.querySelector('input');

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        iconElement.src = "../assets/icons/log_in/visibility.svg";
    } else {
        passwordInput.type = "password";
        iconElement.src = "../assets/icons/log_in/visibility_off.svg";
    }
}


// Check where is clicked, and perform accordingly:
document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.log-in-password');
    let lockIcon = document.getElementById('log-in-lock-icon');
    let passwordAlert = document.getElementById('log-in-password-alert')

    // if the icon is clicked, call logInVisibility() 
    if (e.target.id === 'log-in-lock-icon') {
        logInVisibility(e.target);
        return;
    }

    // if outside password input is clicked, reset input
    // but dont clear alert message if a button was clicked
    if (
        !passwordDiv.contains(e.target) &&
        e.target.id !== 'log-in-button' &&
        e.target.id !== 'guest-log-in-button'
    ) {
        lockIcon.src = "../assets/icons/log_in/lock.svg";
        passwordAlert.innerHTML = "";
    }

});

