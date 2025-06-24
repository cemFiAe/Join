const confirmDiv = document.querySelector('.confirm-password');
const confirmInput = document.getElementById('confirm-password');
const passwordInput = document.getElementById('sign-up-password');
const lockIcon = document.getElementById('confirm-lock-icon');
const confirmAlert = document.getElementById('confirm-password-alert');

// Toggle Confirm password visibility and visibility matching icon:
function confirmVisibility(iconElement) {
    if (confirmInput.type === "password") {
        confirmInput.type = "text";
        iconElement.src = "../assets/icons/sign_up/confirm_visibility.svg";
    } else {
        confirmInput.type = "password";
        iconElement.src = "../assets/icons/sign_up/confirm_visibility_off.svg";
    }
}

// Listen for clicks at icon, which is in confirm password input
document.addEventListener('click', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let lockIcon = document.getElementById('confirm-lock-icon');

    // if the icon is clicked, call confirmVisibility();
    if (e.target.id === 'confirm-lock-icon') {
        confirmVisibility(e.target);
        return;
    }

    // if clicked outside of confirm input, reset icon
    if (!confirmDiv.contains(e.target)) {
        lockIcon.src = "../assets/icons/sign_up/confirm_lock.svg";
    }
});

// Listen for input in confirm password field
document.addEventListener('input', function (e) {
    // If input is true, check the following and act accordingly
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
