/**
 * This function checks first if there is any input in confirm-password field.
 * If input is true, it checks if the confirm-password matches the password.
 * Based on these checks, the styling of confirm-password field changes.
 * @param {string} password User enters his password.
 * @param {string} confirmPassword User confirms his password.
 * @param {boolean} isMatch This is the main condition user must fulfill to sign in.
 * @returns It is 'false' if confirm-password input is empty, then alert message, lock-icon and red highlight appears.
 */
function doPasswordsMatch() {
    let password = passwordInput.value.trim();
    let confirmPassword = confirmInput.value.trim();
    if (confirmPassword === "") {
        confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        confirmIcon.src = "./assets/icons/sign_up/confirm_lock.svg";
        confirmAlert.style.display = 'block';
        return
    }
    const isMatch = confirmPassword === password;
    confirmDiv.style.borderColor = isMatch ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    confirmAlert.style.display = isMatch ? 'none' : 'block';
}
confirmInput.addEventListener('input', doPasswordsMatch)


/**
 * It checks if user clicks on the lock-icon which is located in the confirm-password field.
 * If the lock-icon is clicked, confirmPasswordVisibility() function is called.
 * If somewhere else in page is clicked, but not on lock-icon, it ensures that the password is no longer visible,
 * and shows back the lock-icon.
 * @param {icon} e.target.id Represents the id of clicked element(in this case, lock-icon).
 * @param {string} confirmInput.type If type is "password", then the password is not visible, if type is "text" then it's visible.
 * @param {icon} confirmIcon.src URL of matching icon for each input type.
 */
function confirmLockIcon(e) {
    if (e.target.id === 'confirm-lock-icon') {
        passwordVisibility(confirmInput, e.target);
    } else if (!confirmDiv.contains(e.target)) {
        confirmInput.type = "password";
        confirmIcon.src = "./assets/icons/sign_up/confirm_lock.svg";
    }
}
document.addEventListener('click', confirmLockIcon);
