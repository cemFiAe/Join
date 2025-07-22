
let isValid = true;
 /**
  * @returns {boolean} If returns are valid, user will be able to successfully sign up.
  * If not, signing up wont be possible.
  * In each state, different styles to form parts are applied.
  * Return statement has the same role in each and every form part.
  */
function nameValidation() {
    let valid = nameInput.value !== "";
    nameDiv.style.padding = valid ? "0px 0px 25px" : "0px 0px 10px";
    nameInput.style.borderColor = valid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    nameAlert.style.display = valid ? 'none' : 'block';
    return valid
}
nameInput.addEventListener('input', nameValidation)


function emailValidation() {
    let valid = isEmailValid(emailInput.value);
    emailInput.style.borderColor = valid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    emailAlert.style.display = valid ? 'none' : 'block';
    return valid
}


function passwordValidation() {
    let password = passwordInput.value.trim();
    let valid = isPasswordValid(password)
    passwordDiv.style.borderColor = valid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    passwordAlert.style.display = valid ? 'none' : 'block';
    return valid
}


function confirmPasswordValidation() {
    let password = passwordInput.value.trim();
    let confirmPassword = confirmInput.value.trim();

    let valid = confirmPassword !== "" && confirmPassword === password;
    confirmDiv.style.borderColor = valid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    confirmAlert.style.display = valid ? 'none' : 'block';
    return valid
}


function privacyPolicyValidation() {
    let valid = !checkboxUnchecked;
    policyAlert.style.display = valid ? 'none' : 'block';
    return valid;
}


let checkboxUnchecked = true;

function checkboxClick() {
    checkboxUnchecked = !checkboxUnchecked;
    checkbox.src = checkboxUnchecked ? "./assets/icons/sign_up/checkbox_unchecked.svg" : "./assets/icons/sign_up/checkbox_checked.svg";
    policyAlert.style.display = checkboxUnchecked ? 'block' : 'none'
}
checkbox.addEventListener('click', checkboxClick);


/**
 * @param {event} event This event means automatic submiting. 
 * In this case event is disabled, because before user submits(sing up), each and every form part must be validated.
 * @param {boolean} isValid Only after every validation is true, signUpUser function is called, and user successfully signs up. 
 * Otherwise, if just one validation is false, user can't sign up.
 */
function submitSignUpForm(event) {
    event.preventDefault();
    let isValid = true;
    if (!nameValidation()) isValid = false;
    if (!emailValidation()) isValid = false;
    if (!passwordValidation()) isValid = false;
    if (!confirmPasswordValidation()) isValid = false;
    if (!privacyPolicyValidation()) isValid = false;
    if (isValid) {
        let userData = {
            name: nameInput.value,
            email: emailInput.value,
            password: passwordInput.value.trim(),
        };
        signUpUser(userData);
    } else { console.log("Validation failed!") }
}


/**
 * This function is used to send user datas to a server, and to inform user of successfully signing up.
 * @param {string} userData User enters his data, which will be stored on server.
 */
async function signUpUser(userData) {
    const BASE_URL = "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app/";
    try {
        let response = await fetch(`${BASE_URL}users.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        showOverlay()
    } catch (error) {
        console.error("Failed to save user:", error.message);
    }
}

/**
 * After 1 second user is forwarded to main page, where he can log in as a registered user.
 */
function showOverlay() {
    document.getElementById('signed-up-screen').style.display = "block";
    setTimeout(() => {
        document.getElementById('signed-up-screen').style.display = "none";
        sessionStorage.setItem('cameFromSignUp', 'true');
        window.location.href = "../index.html";
    }, 1000);
}