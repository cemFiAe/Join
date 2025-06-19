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

// Check Email input:
emailInput.addEventListener('input', validateInputs);

// Check Password input:
passwordInput.addEventListener('input', validateInputs);

// Log In button click:
const BASE_URL = "https://join-sign-up-log-in-default-rtdb.europe-west1.firebasedatabase.app/";

// Log In button click:
logInButton.addEventListener('click', (e) => {
    e.preventDefault(); // prevent from default submitting

    if (!validateInputs()) return;

    let email = emailInput.value.trim();
    let password = passwordInput.value;

    async function logInUser() {
        try {
            let response = await fetch(BASE_URL + "users.json"); // get all users 
            let database = await response.json(); // and recieve it as .json

            let user = null;

            // Check each user in database to find matching email
            for (let key in database) {
                if (database[key].email === email) {
                    // if some users email from database matches the email in input:
                    user = database[key]; // we save that in user variable
                    break; // and stop with checking
                }
            }

            // Check if user exists and password matches
            if (user && user.password === password) {
                window.location.href = "../pages/summary.html";
            } else {
                passwordAlert.innerHTML = "Invalid email or password";
                passwordInput.style.borderColor = 'rgb(255, 0, 31)';
            }

        } catch (error) {
            console.error("Login failed", error);
            passwordAlert.innerHTML = "Login failed. Try again.";
        }
    }
    logInUser();
});

// Guest Log In button click:
guestLogInButton.addEventListener('click', function (e) {
    e.preventDefault();
    // if (validateInputs()) {
    //     // If both email and password are valid;
        window.location.href = "../pages/summary.html";
    // }
})
