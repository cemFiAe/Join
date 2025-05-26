
// Confirm-password visibility and visibility matching icon:
function confirmVisibility(iconElement) {
    // Find the closest .confirm-password container to this icon
    let confirmDiv = iconElement.closest('.confirm-password');
    let confirmInput = confirmDiv.querySelector('input');

    if (confirmInput.type === "password") {
        confirmInput.type = "text";
        iconElement.src = "../assets/icons/sign_up/confirm_visibility.svg";
    } else {
        confirmInput.type = "password";
        iconElement.src = "../assets/icons/sign_up/confirm_visibility_off.svg";
    }
}

// ---------- Confirming the password ---------- //

// Check where is clicked, and perform accordingly:
document.addEventListener('click', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let lockLogo = document.getElementById('confirm-lock-icon');
    let confirmAlert = document.getElementById('confirm-password-alert')

    // if the icon is clicked, call toggleConfirmVisibility() 
    if (e.target.matches('confirm-lock-icon')) {
        confirmVisibility(e.target);
        return;
    }

    // if outside confirm-password input is clicked, reset input
    if (!confirmDiv.contains(e.target)) {
        lockLogo.src = "../assets/icons/sign_up/confirm_lock.svg";
        confirmAlert.innerHTML = ""
    }
});


// Validate confirm-password input, and perform accordingly:
document.addEventListener('input', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let confirmInput = document.getElementById('confirm-password');
    let passwordInput = document.getElementById('sign-up-password');
    let lockLogo = document.getElementById('confirm-lock-icon');
    let confirmAlert = document.getElementById('confirm-password-alert')

    // if confirm-password input is true --->
    if (confirmDiv && confirmDiv.contains(e.target)) {
        confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        lockLogo.src = "../assets/icons/sign_up/confirm_visibility_off.svg";

        // ---> check the confirming input/password and highlight accordingly:
        // 1. Check if confirm password matches the original password.
        // 2. Prevent the match if both inputs are empty.
        if (confirmInput.value === passwordInput.value && confirmInput.value !== '') {
            confirmDiv.style.borderColor = 'rgb(41, 171, 226)';
            confirmAlert.innerHTML = ""

        } else { // If confirmation doesn't match;
            confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
            confirmAlert.innerHTML = "Please confirm your password"
        }

        // if confirmation input is empty:
        if (confirmInput.value === "") {
            confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            confirmAlert.innerHTML = "";
            lockLogo.src = "../assets/icons/sign_up/confirm_lock.svg";
        }
    }
});
