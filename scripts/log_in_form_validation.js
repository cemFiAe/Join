// log_in_form_validation.js

function validateForm() {
    let emailValid = isEmailValid(emailInput.value);
    let passwordValid = isPasswordValid(passwordInput.value);

    if (passwordInput.value == "") {
        iconElement.src = "../assets/icons/log_in/lock.svg";
    }

    updateFormStyles(emailInput, emailAlert, emailValid);
    updateFormStyles(passwordDiv, passwordAlert, passwordValid);

    // Log-in-Button deaktivieren wenn Felder nicht gültig
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

// Log In für registrierten User
logInButton.addEventListener('click', async (e) => {
    e.preventDefault(); // Verhindert echtes Abschicken

    if (!validateForm()) return;

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const BASE_URL = "https://join-sign-up-log-in-default-rtdb.europe-west1.firebasedatabase.app/";
        const response = await fetch(BASE_URL + "users.json");
        const database = await response.json();

        // Passenden User anhand der Email finden
        const user = Object.values(database).find(user => user.email === email);

        if (user && user.password === password) {
            // User-Daten im localStorage speichern
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("currentUserName", user.name);
            localStorage.setItem("currentUserType", "user");
            localStorage.setItem("currentUser", JSON.stringify({
                name: user.name,
                email: user.email,
                isGuest: false
            }));
            window.location.href = "../pages/summary.html";
        } else {
            passwordAlert.style.display = "block";
            passwordAlert.innerHTML = "Invalid email or password";
            passwordInput.style.borderColor = 'rgb(255, 0, 31)';
        }
    } catch (error) {
        console.error("Login failed", error);
        passwordAlert.innerHTML = "Login failed. Try again.";
    }
});

// Gast-Login (wird in login_guest.js ausführlicher behandelt, aber hier für Fallback)
if (guestLogInButton) {
    guestLogInButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("currentUserName", "Guest");
        localStorage.setItem("currentUserType", "guest");
        localStorage.setItem("currentUser", JSON.stringify({
            name: "Guest User",
            email: "guest@join.com",
            isGuest: true
        }));
        window.location.href = "../pages/summary.html";
    });
}
