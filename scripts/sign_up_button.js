const nameInput = document.getElementById('name-input');
const nameAlert = document.getElementById('name-alert');
const nameDiv = nameInput.closest('.name');
// When the user types in the name input, update styles accordingly

document.getElementById('name-input').addEventListener('input', function () {
    let name = nameInput.value.trim()
    if (name !== "") {
        nameInput.style.borderColor = 'rgb(41, 171, 226)';
        nameDiv.style.padding = "0px 0px 24px";
        nameAlert.style.display = 'none';
    } else {
        nameInput.style.borderColor = 'rgb(255, 0, 31)';
        nameDiv.style.padding = "0px 0px 10px";
        nameAlert.style.display = 'block';
    }
});

// Initial setup
let isValid = true;

function nameValidation() {
    let name = nameInput.value.trim();
    if (name === "") {
        nameInput.style.borderColor = 'rgb(255, 0, 31)';
        nameDiv.style.padding = "0px 0px 10px";
        nameAlert.style.display = 'block';
        isValid = false;
    } else {
        nameInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        nameDiv.style.padding = "0px 0px 24px";
        nameAlert.style.display = 'none';
    }
}


function emailValidation() {
    const emailInput = document.getElementById('sign-up-email-input');
    const emailAlert = document.getElementById('sign-up-email-alert');
    const email = emailInput.value.trim();

    if (!isEmailValid(email)) {
        emailInput.style.borderColor = 'rgb(255, 0, 31)';
        emailAlert.style.display = 'block';
        isValid = false;
    } else {
        emailInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        emailAlert.style.display = 'none';
    }
}


function passwordValidation() {
    const passwordDiv = document.querySelector('.sign-up-password');
    const passwordInput = document.getElementById('sign-up-password');
    const passwordAlert = document.getElementById('sign-up-password-alert');
    const password = passwordInput.value;

    if (!isPasswordValid(password)) {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        passwordAlert.style.display = 'block';
        isValid = false;
    } else {
        passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        passwordAlert.style.display = 'none';
    }
}


function confirmPasswordValidation() {
    const confirmDiv = document.querySelector('.confirm-password');
    const confirmInput = document.getElementById('confirm-password');
    const confirmAlert = document.getElementById('confirm-password-alert');
    const confirmPassword = confirmInput.value;
    const password = document.getElementById('sign-up-password').value;

    if (!confirmPassword || confirmPassword !== password) {
        confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        confirmAlert.style.display = 'block';
        isValid = false;
    } else {
        confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        confirmAlert.style.display = 'none';
    }
}


function privacyPolicyValidation() {
    const checkbox = document.getElementById('accept-privacy-policy');
    const policyAlert = document.getElementById('privacy-policy-alert');

    if (!checkbox.checked) {
        policyAlert.style.display = 'block';
        isValid = false;
    } else {
        policyAlert.style.display = 'none';
    }
}


const checkbox = document.getElementById('accept-privacy-policy');
const policyAlert = document.getElementById('privacy-policy-alert');
checkbox.addEventListener('change', function () {
    policyAlert.style.display = this.checked ? "none" : "block";
});


function submitSignUpForm(event) {
    event.preventDefault();

    // Reset isValid before running validation checks
    isValid = true;

    // Run validations
    nameValidation();
    emailValidation();
    passwordValidation();
    confirmPasswordValidation();
    privacyPolicyValidation();

    // If all validations pass, proceed with sign up
    if (isValid) {
        const userData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
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



