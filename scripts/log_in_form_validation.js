/**
 * This function ensures Form validation in Log in page
 * 
 * @var emailValid - returns the value of email validation
 * @var passwordValid - returns the value of password validation
 * @returns - if 'true' proceed to user log in, if 'false' then stop
 * 
 *  */

function validateForm() {
    let emailValid = isEmailValid(emailInput.value);
    let passwordValid = isPasswordValid(passwordInput.value);

    if (passwordInput.value == "") {
        iconElement.src = "../assets/icons/log_in/lock.svg";
    }
    updateFormStyles(emailInput, emailAlert, emailValid);
    updateFormStyles(passwordDiv, passwordAlert, passwordValid);
    logInButton.disabled = !(emailValid && passwordValid);
    return emailValid && passwordValid;
}


/**
 * Generall function for updating styles to email and password fields
 * @param {string} input - User enters his datas
 * @param {string} alert - Alert messages show up if validation is false
 * @param {var} isValid - Returns values of email and password validations
 */

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


/**
 * This function executes only if the form is valid, i.e. if user datas are written correctly.
 * User is logged in only if input matches the data from database.
 * If it doesn't match
 * @returns 
 */
async function userLogIn(e) {
    e.preventDefault(); // Verhindert echtes Abschicken
    if (!validateForm()) return;
    try {
        const BASE_URL = "https://join-sign-up-log-in-default-rtdb.europe-west1.firebasedatabase.app/";
        const response = await fetch(BASE_URL + "users.json");
        const database = await response.json();

        const email = emailInput.value;
        const password = passwordInput.value;
        const user = Object.values(database).find(user => user.email === email);
        if (user && user.password === password) {
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
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            emailInput.style.borderColor = 'rgb(255, 0, 31)';
        }
    } catch (error) {
        console.error("Login failed", error);
        passwordAlert.innerHTML = "Login failed. Try again.";
    }
}
logInButton.addEventListener('click', userLogIn);


/**
 * Gast-Login (wird in login_guest.js ausführlicher behandelt, aber hier für Fallback)
 * 
 */
function guestLogIn() {
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
}
guestLogInButton.addEventListener('click', guestLogIn);
