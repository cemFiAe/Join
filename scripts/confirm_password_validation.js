
var confirmDiv = document.querySelector('.confirm-password');
var confirmInput = document.getElementById('confirm-password');
var confirmIcon = document.getElementById('confirm-lock-icon');
var confirmAlert = document.getElementById('confirm-password-alert');
var passwordInput = document.getElementById('sign-up-password');


/**
 * This function checks if there is any input in confirm-password field.
 * If input is true, it checks if the confirm-password input matches the password input.
 * Based on these checkings, the styling of confirm password field changes.
 * @param {string} password - User enters his password.
 * @param {string} confirmPassword - User confirms his password.
 * @param {boolean} isMatch - This is the main condition user must fulfill to sign in.
 * @returns - 'false' if confirm-password input is empty, alert messages appears, lock-icon and red highlight.
 */
function confirmInputListener() {
    let password = passwordInput.value;
    let confirmPassword = confirmInput.value;

    if (confirmPassword === "") {
        confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        confirmAlert.style.display = 'block';
        confirmIcon.src = "../assets/icons/sign_up/confirm_lock.svg";
        return;
    }
    const isMatch = confirmPassword === password;
    confirmDiv.style.borderColor = isMatch ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    confirmAlert.style.display = isMatch ? 'none' : 'block';
}
confirmInput.addEventListener('input', confirmInputListener)


/**
 * It checks if user clicks on the lock-icon which is located in the confirm password field.
 * If the lock-icon is clicked, confirmPasswordVisibility() function is called.
 * If somewhere else in page is clicked, but not on lock-icon, it ensures that the password is no longer visible,
 * and shows back the lock-icon.
 * @param {icon} e.target.id - Represents the id of clicked element(in this case, lock-icon).
 * @param {string} confirmInput.type - If type is "password", then the password is not visible, if type is "text" then it's visible.
 * @param {icon} confirmIcon.src - URL of matching icon for each input type.
 */
function confirmLockIcon() {
   if (e.target.id === 'confirm-lock-icon') {
        confirmPasswordVisibility(confirmInput, e.target);
    } else if (!confirmDiv.contains(e.target)) {
        confirmInput.type = "password";
        confirmIcon.src = "../assets/icons/sign_up/confirm_lock.svg";
    }
}
document.addEventListener('click', confirmLockIcon);


/**
 * This function determines confirm password visibility based on input type.
 * @param {string} input.type - Based on input type, input can be visible or not visible.
 * @param {icon} icon.src - URL of matching icon for each input type.
 */
function confirmPasswordVisibility(input, icon) {
    if (input.type === "password") {
        input.type = "text";
        icon.src = "../assets/icons/sign_up/confirm_visibility.svg";
    } else {
        input.type = "password";
        icon.src = "../assets/icons/sign_up/confirm_visibility_off.svg";
    }
}
