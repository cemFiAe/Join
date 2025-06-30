
// for updating styles to Div, not to Input 
var passwordDiv = document.querySelector('.log-in-password')
var passwordInput = document.getElementById('log-in-password');
var passwordAlert = document.getElementById('log-in-password-alert');

var logInButton = document.getElementById('log-in-button');
var guestLogInButton = document.getElementById('guest-log-in-button');


function validateForm() {
    let emailValid = isEmailValid(emailInput.value);
    let passwordValid = isPasswordValid(passwordInput.value);

    if (passwordInput.value == "") {
        iconElement.src = "../assets/icons/log_in/lock.svg";
    }

    updateFormStyles(emailInput, emailAlert, emailValid);
    updateFormStyles(passwordDiv, passwordAlert, passwordValid);

    // Disable the Log in button if email and password are not valid
    logInButton.disabled = !(emailValid && passwordValid);
    return emailValid && passwordValid;
}

function updateFormStyles(input, alert, isValid) {
    if (isValid) {
        input.style.borderColor = 'rgb(41, 171, 226)';
        alert.style.display = 'none';
    } else {
        input.style.borderColor = 'rgb(255, 0, 31)';
        alert.style.display = 'block';
    }
}
emailInput.addEventListener('input', validateForm);
passwordInput.addEventListener('input', validateForm);

// Log in user
logInButton.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent form submission

    // Validate inputs and stop if email and/or password are not valid
    if (!validateForm()) return;

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
            localStorage.setItem("userName", user.name); // <--- Name speichern!
            localStorage.setItem("currentUserName", user.name);
            localStorage.setItem("currentUserType", "user");
            window.location.href = "../pages/summary.html";
        } else {
            passwordAlert.style.display = "block"
            passwordAlert.innerHTML = "Invalid email or password (Unknown user)";
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
