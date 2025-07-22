/**
 * This function checks password input, validates it and update defined styles.
 * @param {boolean} isValid According to state of this boolean, styles are applied.
 * @returns It is 'false' if input is empty, otherwise 'true' and proceeds with validation.
 */
function validatePassword() {
    if (passwordInput.value === "") {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        passwordIcon.src = "../assets/icons/sign_up/lock.svg";
        passwordAlert.style.display = 'block';
        return
    }
    const isValid = isPasswordValid(passwordInput.value);
    passwordDiv.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    passwordAlert.style.display = isValid ? 'none' : 'block';
}
passwordInput.addEventListener('input', validatePassword);


/**
 * Valid password must have minimum 8 charachters. At least 6 letters, and at least 2 numbers.
 * @param {var} value It checks value of users input; just letters and numbers allowed.
 * @returns {boolean} If conditions are fulfilled, validation is true.
 */
function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}


/**
 * It checks if user clicks on the lock-icon which is located in the password field.
 * If the lock-icon is clicked, passwordVisibility() function is called.
 * If somewhere else clicked, the password is no longer visible and the lock-icon shows up again.
 * @param {icon} e.target.id Represents the id of clicked element(in this case, lock-icon).
 * @param {string} passwordInput.type If type is "password", then the password is not visible, if type is "text" then it's visible.
 * @param {icon} passwordIcon.src URL of matching icon for each input type.
 */
function passwordLockIcon(e) {
    if (e.target.id === 'lock-icon') {
        passwordVisibility(passwordInput, e.target);
    } else if (!passwordDiv.contains(e.target)) {
        passwordInput.type = "password";
        passwordIcon.src = "../assets/icons/sign_up/lock.svg";
    }
}
document.addEventListener('click', passwordLockIcon);


/**
 * This function determines password visibility based on input type.
 * It is called by clicking on lock-icon, and with further clicking on it, input type changes and so does visibility.
 * @param {string} input.type Based on input type, input can be visible or not visible.
 * @param {icon} icon.src URL of matching icon for each input type.
 */
function passwordVisibility(input, icon) {
    if (input.type === "password") {
        input.type = "text";
        icon.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        input.type = "password";
        icon.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}