/**
 * This function ensures Form validation in Log in page.
 * @param {var} emailValid - returns the value of email validation.
 * @param {var} passwordValid - returns the value of password validation.
 * @returns {boolean} - if form validation is 'true' proceed with user log in, otherwise stop.
 */
function validateForm() {
    let emailValid = isEmailValid(emailInput.value);
    let passwordValid = isPasswordValid(passwordInput.value);

    if (passwordInput.value == "") {
        passwordIcon.src = "../assets/icons/log_in/lock.svg";
    }
    updateFormStyles(emailInput, emailAlert, emailValid);
    updateFormStyles(passwordDiv, passwordAlert, passwordValid);
    logInButton.disabled = !(emailValid && passwordValid);
    return emailValid && passwordValid;
}


/**
 * Generall function for updating styles to email and password fields.
 * @param {string} input - User enters his datas.
 * @param {string} alert - Alert messages show up if validation is false.
 * @param {boolean} isValid - Returns values of email and password validations.
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
 * This function executes only if the form is valid, i.e. if user input datas are written correctly.
 * User will be logged in, only if his input matches data from database.
 * If not, function stops, form fields highlight red and alert message shows up.
 * @param {boolean} isGuest - turns 'false' if already signed up user logs in. 
 */
async function userLogIn(e) {
    e.preventDefault(); // prevent the usual action, and proceed with function execution.
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
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            passwordAlert.style.display = "block";
            passwordAlert.innerHTML = "Invalid email or password";
            emailInput.style.borderColor = 'rgb(255, 0, 31)';
        }
    } catch (error) {
        console.error("Login failed", error);
        passwordAlert.innerHTML = "Login failed. Try again.";
    }
}
logInButton.addEventListener('click', userLogIn);


/**
 * User logs in as a guest, therefore needs not to sign up.
 */
function guestLogIn(e) {
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
