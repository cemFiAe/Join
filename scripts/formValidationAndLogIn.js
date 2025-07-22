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
 * This is a generall function for updating styles to email and password fields.
 * @param {string} input User enters his datas.
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
emailInput.addEventListener('input', validateForm);
passwordInput.addEventListener('input', validateForm);


/**
 * This function executes only if the form is valid, i.e. if user input datas are written correctly.
 */
async function userLogIn(e) {
    e.preventDefault();
    if (!validateForm()) return;
    try {
        let success = await saveAsUser();
        if (success) {
            window.location.replace("./pages/summary.html");
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
 * @returns If 'true' - user datas are saved and user is redirected to summary page, and
 * if 'false' - user remains on log in page and alertFormStyles function is called.
 */
// 1. Login-Logik: Nur Authentifizierung!
async function saveAsUser() {
    const BASE_URL = "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/";
    const response = await fetch(BASE_URL + "users.json");
    const database = await response.json();
    
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
        setCurrentUser(userId, userObj.email);
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("currentUserName", userObj.name);
        localStorage.setItem("currentUserType", "user");
        localStorage.setItem("currentUser", JSON.stringify({
            name: userObj.name,
            email: userObj.email,
            isGuest: false
        }));
        // Füge User ggf. als Kontakt hinzu (asynchron, aber Redirect geht schon)
        addUserToContactsIfMissing(userObj.name, userObj.email, userObj.phone || "");
        // Jetzt sicher kurz warten, dann redirect:
        setTimeout(() => {
            window.location.href = "./pages/summary.html";
        }, 80); // 80–100ms reicht völlig!
        return true;
    } else {
        alertFormStyle();
        return false;
    }
}

// 2. User in Kontakte eintragen, falls noch nicht drin:
async function addUserToContactsIfMissing(name, email, phone) {
    const BASE_URL = "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/";
    const contactsResponse = await fetch(BASE_URL + "contacts.json");
    const contactsDb = await contactsResponse.json();
    let alreadyContact = false;
    if (contactsDb) {
        for (const c of Object.values(contactsDb)) {
            if (c.mail === email) {
                alreadyContact = true;
                break;
            }
        }
    }
    if (!alreadyContact) {
        await fetch(BASE_URL + "contacts.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                mail: email,
                phone: phone
            })
        });
    }
}

function alertFormStyle() {
    passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
    passwordAlert.style.display = "block";
    passwordAlert.innerHTML = "Invalid email or password";
    emailInput.style.borderColor = 'rgb(255, 0, 31)';
}


function guestLogIn(e) {
    e.preventDefault();
    saveAsGuest()
    window.location.replace("./pages/summary.html");
}
guestLogInButton.addEventListener('click', guestLogIn);


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
 * Redirect to summary if already logged in
 */
if (localStorage.getItem("loggedIn") === "true") {
    window.location.replace("./pages/summary.html");
}


/**
 Prevent going back to login page after logging in
 */
window.history.forward();

