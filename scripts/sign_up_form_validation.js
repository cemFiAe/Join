
// Check name input and update styles accordingly
const nameInput = document.getElementById('name-input');
const nameAlert = document.getElementById('name-alert');
const nameDiv = nameInput.closest('.name');

nameInput.addEventListener('input', function () {
    const name = nameInput.value
    const valid = name !== ""

    nameInput.style.borderColor = valid ? 'rgba(0, 0, 0, 0.1)' : 'rgb(255, 0, 31)';
    nameDiv.style.padding = valid ? "0px 0px 24px" : "0px 0px 10px";
    nameAlert.style.display = valid ? 'none' : 'block';
});


// Form validation 

let isValid = true;

function nameValidation() {
    const name = nameInput.value;
    const valid = name === "";

    nameInput.style.borderColor = valid ? 'rgb(255, 0, 31)' : 'rgba(0, 0, 0, 0.1)'
    nameDiv.style.padding = valid ? "0px 0px 10px" : "0px 0px 24px";
    nameAlert.style.display = valid ? 'block' : 'none';
    return valid
}


function emailValidation() {
    const emailInput = document.getElementById('sign-up-email-input');
    const emailAlert = document.getElementById('sign-up-email-alert');

    const email = emailInput.value;
    const valid = isEmailValid(email);

    emailInput.style.borderColor = valid ? 'rgba(0, 0, 0, 0.1)' : 'rgb(255, 0, 31)';
    emailAlert.style.display = valid ? 'none' : 'block';
    return valid
}


function passwordValidation() {
    const passwordDiv = document.querySelector('.sign-up-password');
    const passwordInput = document.getElementById('sign-up-password');
    const passwordAlert = document.getElementById('sign-up-password-alert');

    const password = passwordInput.value.trim();
    const valid = isPasswordValid(password);

    passwordDiv.style.borderColor = valid ? 'rgba(0, 0, 0, 0.1)' : 'rgb(255, 0, 31)';
    passwordAlert.style.display = valid ? 'none' : 'block';
    return valid
}


function confirmPasswordValidation() {
    const confirmDiv = document.querySelector('.confirm-password');
    const confirmInput = document.getElementById('confirm-password');
    const confirmAlert = document.getElementById('confirm-password-alert');

    const confirmPassword = confirmInput.value.trim();
    const password = document.getElementById('sign-up-password').value.trim();
    const valid = confirmPassword !== "" && confirmPassword === password;

    confirmDiv.style.borderColor = valid ? 'rgba(0, 0, 0, 0.1)' : 'rgb(255, 0, 31)';
    confirmAlert.style.display = valid ? 'none' : 'block';
    return valid
}


function privacyPolicyValidation() {
    const checkbox = document.getElementById('accept-privacy-policy');
    const policyAlert = document.getElementById('privacy-policy-alert');
    const valid = checkbox.checked;

    policyAlert.style.display = valid ? 'none' : 'block';
    return valid;
}


// This is change state of checkbox
const checkbox = document.getElementById('accept-privacy-policy');
const policyAlert = document.getElementById('privacy-policy-alert');

checkbox.addEventListener('change', function () {
    policyAlert.style.display = this.checked ? "none" : "block";
});


function submitSignUpForm(event) {
    event.preventDefault();

    let isValid = true;

    // check each validation if NOT true, 
    // then isValid = false, and sign up is stopped!
    if (!nameValidation()) isValid = false;
    if (!emailValidation()) isValid = false;
    if (!passwordValidation()) isValid = false;
    if (!confirmPasswordValidation()) isValid = false;
    if (!privacyPolicyValidation()) isValid = false;

    if (isValid) {
        const emailInput = document.getElementById('sign-up-email-input');
        const passwordInput = document.getElementById('sign-up-password');

        const userData = {
            name: nameInput.value,
            email: emailInput.value,
            password: passwordInput.value.trim(),
        };
        signUpUser(userData);
    } else {
        console.log("Validation failed!");
    }
}


async function signUpUser(userData) {
    const BASE_URL = "https://join-sign-up-log-in-default-rtdb.europe-west1.firebasedatabase.app/";
    try {
        let response = await fetch(`${BASE_URL}users.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Show signed-up screen and redirect after 1 second
        document.getElementById('signed-up-screen').style.display = "block";
        setTimeout(() => {
            document.getElementById('signed-up-screen').style.display = "none";
            sessionStorage.setItem('cameFromSignUp', 'true');
            window.location.href = "../pages/index.html";
        }, 1000);
    } catch (error) {
        console.error("Failed to save user:", error.message);
    }
}



