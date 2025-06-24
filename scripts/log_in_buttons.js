var passwordDiv = document.querySelector('.log-in-password')
// for updating styles to Div, not to Input 
var passwordInput = document.getElementById('log-in-password');
var passwordAlert = document.getElementById('log-in-password-alert');
var logInButton = document.getElementById('log-in-button');
var guestLogInButton = document.getElementById('guest-log-in-button');

function validateInputs() {
    let emailValid = isEmailValid(emailInput.value);
    let passwordValid = isPasswordValid(passwordInput.value);

    // Update styles and alerts based on validation
    updateInputStyles(emailInput, emailAlert, emailValid);
    updateInputStyles(passwordDiv, passwordAlert, passwordValid);

    // Disable the Log in button if email and password are not valid
    logInButton.disabled = !(emailValid && passwordValid);
    return emailValid && passwordValid;
}

function updateInputStyles(input, alert, isValid) {
    if (isValid) {
        input.style.borderColor = 'rgb(41, 171, 226)';
        alert.style.display = 'none';
    } else {
        input.style.borderColor = 'rgb(255, 0, 31)';
        alert.style.display = 'block';
    }
}

emailInput.addEventListener('input', validateInputs);
passwordInput.addEventListener('input', validateInputs);

logInButton.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent form submission

    // Validate inputs and stop proceeding if email and/or password are not valid
    if (!validateInputs()) return;

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const BASE_URL = "https://join-sign-up-log-in-default-rtdb.europe-west1.firebasedatabase.app/";
        const response = await fetch(BASE_URL + "users.json");
        const database = await response.json();
        
        // Find matching user by email
        const user = Object.values(database).find(user => user.email === email);

        if (user && user.password === password) {
            localStorage.setItem("loggedIn", "true");
            window.location.href = "../pages/summary.html";
        } else {
            passwordAlert.style.display = "block"
            passwordAlert.innerHTML = "Invalid email or password";
            passwordInput.style.borderColor = 'rgb(255, 0, 31)';
        }

    } catch (error) {
        console.error("Login failed", error);
        passwordAlert.innerHTML = "Login failed. Try again.";
    }
});

guestLogInButton.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.setItem("loggedIn", "true");
    window.location.href = "../pages/summary.html";
});
