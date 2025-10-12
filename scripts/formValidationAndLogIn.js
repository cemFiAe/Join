/**
 * Redirect to summary if user is already logged in and currently on the login page
 */
if (window.location.pathname.endsWith("index.html") && localStorage.getItem("loggedIn") === "true") {
    window.location.replace("./pages/summary.html");
}

/**
* This function ensures Form validation in Log in page.
* @param {var} emailValid Returns the value of email validation.
* @param {var} passwordValid Returns the value of password validation.
* @returns {boolean} If form validation is 'true' proceed with user log in, otherwise stop.
*/
function validateForm() {
    let emailValid = isEmailValid(emailInput.value);
    let passwordValid = isPasswordValid(passwordInput.value);
    if (passwordInput.value == "") {
        passwordIcon.src = "./assets/icons/log_in/lock.svg";
    }
    updateFormStyles(emailInput, emailAlert, emailValid);
    updateFormStyles(passwordDiv, passwordAlert, passwordValid);
    logInButton.disabled = !(emailValid && passwordValid);
    return emailValid && passwordValid;
}

/**
 * This is a general function for updating styles to email and password fields.
 * @param {string} input User enters their data.
 * @param {string} alert Alert messages show up if validation is false.
 * @param {boolean} isValid Returns values of email and password validations.
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


/**
 * This function executes only if the form is valid, i.e., if user input data is written correctly.
 */
async function userLogIn(e) {
    e.preventDefault();
    if (!validateForm()) return;
    try {
        let success = await saveAsUser();
        if (success) {
            localStorage.setItem("loggedIn", "true");
            window.location.replace("./pages/summary.html");
        }
    } catch (error) {
        console.error("Login failed", error);
        passwordAlert.innerHTML = "Login failed. Try again.";
    }
}
logInButton.addEventListener('click', userLogIn);


/**
 * Checks if a user exists in the database by email.
 * @param {Object} database - The users database object.
 * @param {string} email - The email to search for.
 * @returns {{id:string, user:Object}|null} Found user or null.
 */
function findUserByEmail(database, email) {
    for (const [id, user] of Object.entries(database)) {
        if (user.email === email) return { id, user };
    }
    return null;
}

/**
 * Saves user data in localStorage for a logged-in user.
 * @param {Object} user - The user object to save.
 */
function saveUserLocally(user) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("currentUserName", user.name);
    localStorage.setItem("currentUserType", "user");
    localStorage.setItem("currentUser", JSON.stringify({
        name: user.name,
        email: user.email,
        isGuest: false
    }));
}

/**
 * Ensures user exists in contacts database; adds if missing.
 * @param {Object} user - The user object.
 * @param {string} baseUrl - Firebase base URL.
 */
async function ensureUserContact(user, baseUrl) {
    try {
        const resp = await fetch(baseUrl + "contacts.json");
        const contacts = await resp.json();
        const exists = contacts && Object.values(contacts).some(c => c.mail === user.email);
        if (!exists) {
            await fetch(baseUrl + "contacts.json", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: user.name, mail: user.email, phone: user.phone || "" })
            });
        }
    } catch (err) { console.error('Error saving contact:', err); }
}

/**
 * Logs in a user if credentials match the database.
 * @returns {Promise<boolean>} True if login successful, false otherwise.
 */
async function saveAsUser() {
    const BASE_URL = "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/";
    const dbResp = await fetch(BASE_URL + "users.json");
    const db = await dbResp.json();

    const found = findUserByEmail(db, emailInput.value);
    if (!found || found.user.password !== passwordInput.value.trim()) {
        alertFormStyle();
        return false;
    }

    saveUserLocally(found.user);
    await ensureUserContact(found.user, BASE_URL);
    return true;
}


/**
 * Highlights the email and password input fields to indicate invalid credentials.
 * Displays an error message below the password field.
 */
function alertFormStyle() {
    passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
    passwordAlert.style.display = "block";
    passwordAlert.innerHTML = "Invalid email or password";
    emailInput.style.borderColor = 'rgb(255, 0, 31)';
}


/**
 * Saves guest user data in localStorage and marks the user as logged in.
 */
function saveAsGuest() {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("currentUserName", "Guest");
    localStorage.setItem("currentUserType", "guest");
    localStorage.setItem("currentUser", JSON.stringify({
        name: "Guest User",
        email: "guest@join.com",
        isGuest: true
    }));
}


/**
 * Handles guest login on button click.
 * Saves guest user data and redirects to the summary page if login is successful.
 * @param {Event} e - The click event from the guest login button.
 */
function guestLogIn(e) {
    e.preventDefault();
    saveAsGuest();
    if (localStorage.getItem("loggedIn") === "true") {
        window.location.replace("./pages/summary.html");
    }
}


/**
 * Attaches the guest login handler to the guest login button.
 */
guestLogInButton.addEventListener('click', guestLogIn);