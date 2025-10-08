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
// emailInput.addEventListener('input', validateForm);
// passwordInput.addEventListener('input', validateForm);


/**
 * This function executes only if the form is valid, i.e., if user input data is written correctly.
 */
async function userLogIn(e) {
    e.preventDefault();
    if (!validateForm()) return;
    try {
        let success = await saveAsUser();
        if (success) {
            // After successful login, set loggedIn to true and redirect
            localStorage.setItem("loggedIn", "true");
            window.location.replace("./pages/summary.html"); // Replace to avoid going back
        }
    } catch (error) {
        console.error("Login failed", error);
        passwordAlert.innerHTML = "Login failed. Try again.";
    }
}
logInButton.addEventListener('click', userLogIn);


/**
 * After correct input, if input matches data from database, only then user will be logged in.
 * @param {boolean} isGuest Turns 'false' if already signed-up-user logs in. 
 * @returns If 'true' - user data is saved and user is redirected to summary page, and
 * if 'false' - user remains on login page and alertFormStyles function is called.
 */
async function saveAsUser() {
    const BASE_URL = "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/";
    const response = await fetch(BASE_URL + "users.json");
    const database = await response.json();

    // Search for the user with matching email
    let userId = null;
    let userObj = null;
    for (const [id, user] of Object.entries(database)) {
        if (user.email === emailInput.value) {
            userId = id;
            userObj = user;
            break;
        }
    }

    if (userObj && userObj.password === passwordInput.value.trim()) {
        // User found, save login data
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("currentUserName", userObj.name);
        localStorage.setItem("currentUserType", "user");
        localStorage.setItem("currentUser", JSON.stringify({
            name: userObj.name,
            email: userObj.email,
            isGuest: false
        }));

        // Add user to contacts if not already present
        try {
            const contactsResponse = await fetch(BASE_URL + "contacts.json");
            const contactsDb = await contactsResponse.json();
            let alreadyContact = false;
            if (contactsDb) {
                for (const c of Object.values(contactsDb)) {
                    if (c.mail === userObj.email) {
                        alreadyContact = true;
                        break;
                    }
                }
            }
            if (!alreadyContact) {
                const addContactRes = await fetch(BASE_URL + "contacts.json", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: userObj.name,
                        mail: userObj.email,
                        phone: userObj.phone || ""
                    })
                });
                if (!addContactRes.ok) {
                    throw new Error('Contact could not be saved!');
                }
            }
        } catch (err) {
            console.error('Error saving contact:', err);
        }

        return true;
    } else if (!userObj || userObj.password !== passwordInput.value.trim()) {
        alertFormStyle();
        return false;
    }
}

function alertFormStyle() {
    passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
    passwordAlert.style.display = "block";
    passwordAlert.innerHTML = "Invalid email or password";
    emailInput.style.borderColor = 'rgb(255, 0, 31)';
}

// Guest Login
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

function guestLogIn(e) {
    e.preventDefault();
    saveAsGuest();
    if (localStorage.getItem("loggedIn") === "true") {
        window.location.replace("./pages/summary.html"); // Replace to avoid going back
    }
}
guestLogInButton.addEventListener('click', guestLogIn);
