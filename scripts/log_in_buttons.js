let passwordInput = document.getElementById('log-in-password');
let passwordAlert = document.getElementById('log-in-password-alert');

let logInButton = document.getElementById('log-in-button');
let guestLogInButton = document.getElementById('guest-log-in-button');


// Check if both inputs are valid
function validateInputs() {
    let emailValid = isEmailValid(emailInput.value);
    let passwordValid = isPasswordValid(passwordInput.value);

    // Validate Email
    if (!emailValid) {
        emailInput.style.borderColor = 'rgb(255, 0, 31)';
        emailAlert.style.display = "block";
    } else {
        emailInput.style.borderColor = 'rgb(41, 171, 226)';
        emailAlert.style.display = "none";
    }

    // Validate Password
    if (!passwordValid) {
        passwordInput.style.borderColor = 'rgb(255, 0, 31)';
        passwordAlert.innerHTML = "Please insert correct password";
    } else {
        passwordInput.style.borderColor = 'rgb(41, 171, 226)';
        passwordAlert.innerHTML = "";
    }

    // Enable buttons if both fields are valid
    if (emailValid && passwordValid) {
        logInButton.disabled = false;
        guestLogInButton.disabled = false;
        return true;
    } else {
        logInButton.disabled = true;
        guestLogInButton.disabled = true;
        return false;
    }
}

// Email input event listener
emailInput.addEventListener('input', validateInputs);

// Password input event listener
passwordInput.addEventListener('input', validateInputs);

// Log In button click event listener
logInButton.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent form submission
    if (validateInputs()) {
        // If both email and password are valid, redirect
        window.location.href = "../pages/summary.html";
    }
});

// Guest Log In button click event listener
guestLogInButton.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent form submission
    if (validateInputs()) {
        // If both email and password are valid, redirect
        window.location.href = "../pages/summary.html";
    }
});
