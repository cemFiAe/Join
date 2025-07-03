/**
 * test
 */

var confirmDiv = document.querySelector('.confirm-password');
var confirmInput = document.getElementById('confirm-password');
var confirmIcon = document.getElementById('confirm-lock-icon');
var confirmAlert = document.getElementById('confirm-password-alert');
var passwordInput = document.getElementById('sign-up-password');


/**
 * This event listener checks the confirm password input, then validates if it matches the password input
 * and based on validation updates the styles of confirm password field.
 * 
 * @param password - User enters his password.
 * @param confirmPassword - User confirms his password.
 * @param isMatch - This is the main condition user must fulfill to sign in.
 */

confirmInput.addEventListener('input', function () {
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
});


/**
 * Event listener checks if user clicks on the lock-icon which is located in the password field,
 * and if yes, it calls confirmPasswordVisibility() function.
 * Otherwise, if somewhere else in page is clicked, it ensures that the password is no longer visible,
 * and shows back lock-icon.
 * 
 * @param e.target.id - Represents the id of element on which is clicked.
 * @param confirmInput.type - If type is "password", then the password is not visible, if type is "text" then it's visible.
 * @param confirmIcon.src - URL of displayed icon.
 */

document.addEventListener('click', function (e) {
    if (e.target.id === 'confirm-lock-icon') {
        confirmPasswordVisibility(confirmInput, e.target);
    } else if (!confirmDiv.contains(e.target)) {
        confirmInput.type = "password";
        confirmIcon.src = "../assets/icons/sign_up/confirm_lock.svg";
    }
});


/**
 * This function determines that password and icon are either visible or not visible 
 * and regarding to visibility, updates it's two parameters.
 * The click event above toggles that visibility.
 * 
 * @param {string} input.type - Depending on input type, input can be visible or not visible.
 * @param {icon} icon.src - These URLs are matching icons for each input type.
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
