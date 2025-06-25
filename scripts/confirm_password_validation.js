
// Confirm password validation for Sign up page

var confirmDiv = document.querySelector('.confirm-password');
var confirmInput = document.getElementById('confirm-password');
var confirmIcon = document.getElementById('confirm-lock-icon');
var confirmAlert = document.getElementById('confirm-password-alert');
var passwordInput = document.getElementById('sign-up-password');

// Check confirm input, validate it and update styles accordingly:
confirmInput.addEventListener('input', function () {
    let confirmPassword = confirmInput.value;
    let password = passwordInput.value;

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


// Check if the icon in input filed is clicked and: 
// toggle password visibility and matching icon,
document.addEventListener('click', function (e) {
    if (e.target.id === 'confirm-lock-icon') {
        confirmVisibility(confirmInput, e.target);
    } else if (!confirmDiv.contains(e.target)) {
        confirmInput.type = "password";
        confirmIcon.src = "../assets/icons/sign_up/confirm_lock.svg";
    }
});


// Function for changing password visibility in confirm field and matching icon
function confirmVisibility(input, icon) {
    if (input.type === "password") {
        input.type = "text";
        icon.src = "../assets/icons/sign_up/confirm_visibility.svg";
    } else {
        input.type = "password";
        icon.src = "../assets/icons/sign_up/confirm_visibility_off.svg";
    }
}
