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
    e.preventDefault();

    if (!validateInputs()) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Send request to Firebase to get all users
    fetch(BASE_URL + "users.json")
        .then(function (response) {
            return response.json(); // Convert response to JSON
        })
        .then(function (data) {
            // `data` contains all users from the database
            let user = null;

            // Loop through each user to find matching email
            for (let key in data) {
                if (data[key].email === email) {
                    user = data[key]; // Save matched user
                    break; // Stop loop once found
                }
            }

            // Check if user exists and password matches
            if (user && user.password === password) {
                // Success: redirect to summary page
                window.location.href = "../pages/summary.html";
            } else {
                // Failure: show error message
                passwordAlert.textContent = "Invalid email or password";
                passwordInput.style.borderColor = 'rgb(255, 0, 31)';
            }
        })
        .catch(function (error) {
            // Handle fetch errors (like no internet or server issue)
            console.error("Login failed", error);
            passwordAlert.textContent = "Login failed. Try again.";
        });
});

// Guest Log In button click:
guestLogInButton.addEventListener('click', function (e) {
    e.preventDefault();
    if (validateInputs()) {
        // If both email and password are valid;
        window.location.href = "../pages/summary.html";
    }
})
