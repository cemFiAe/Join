// Toggle Confirm password visibility and visibility matching icon:
function confirmVisibility(iconElement) {
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

// Listen for clicks related to confirm password input
document.addEventListener('click', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let lockIcon = document.getElementById('confirm-lock-icon');
    let confirmAlert = document.getElementById('confirm-password-alert');

    if (e.target.id === 'confirm-lock-icon') {
        confirmVisibility(e.target);
        return;
    }

    // Remove resetting the alert on outside click to keep validation messages visible
    if (!confirmDiv.contains(e.target)) {
        lockIcon.src = "../assets/icons/sign_up/confirm_lock.svg";
        // confirmAlert.innerHTML = "";  <-- Removed this line intentionally
    }
});

// Listen for input in confirm password field
document.addEventListener('input', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let confirmInput = document.getElementById('confirm-password');
    let passwordInput = document.getElementById('sign-up-password');
    let lockIcon = document.getElementById('confirm-lock-icon');
    let confirmAlert = document.getElementById('confirm-password-alert');

    if (confirmDiv.contains(e.target)) {
        let confirmValue = confirmInput.value;
        let passwordValue = passwordInput.value;

        if (confirmValue === "") {
            confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            confirmAlert.innerHTML = "";
            lockIcon.src = "../assets/icons/sign_up/confirm_lock.svg";
        } else if (confirmValue === passwordValue) {
            confirmDiv.style.borderColor = 'rgb(41, 171, 226)';
            confirmAlert.innerHTML = "";
        } else {
            confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
            confirmAlert.innerHTML = "Passwords do not match";
        }
    }
});
