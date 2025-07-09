
let isValid = true;

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


let checkboxUnchecked = true;

function checkboxClick() {
    checkboxUnchecked = !checkboxUnchecked;
    checkbox.src = checkboxUnchecked ? "../assets/icons/sign_up/checkbox_unchecked.svg" : "../assets/icons/sign_up/checkbox_checked.svg";
    policyAlert.style.display = checkboxUnchecked ? 'block' : 'none'
}
checkbox.addEventListener('click', checkboxClick);


function privacyPolicyValidation() {
    let valid = !checkboxUnchecked;
    policyAlert.style.display = valid ? 'none' : 'block';
    return valid;
}


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
        let emailInput = document.getElementById('sign-up-email-input');
        let passwordInput = document.getElementById('sign-up-password');
        let userData = {
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
    let BASE_URL = "https://join-sign-up-log-in-default-rtdb.europe-west1.firebasedatabase.app/";
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



