
// Password validation for Sign up page

var passwordDiv = document.querySelector('.sign-up-password');
var passwordInput = document.getElementById('sign-up-password');
var passwordIcon = document.getElementById('sign-up-lock-icon');
var passwordAlert = document.getElementById('sign-up-password-alert');


// Password validation function
function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}


// Check password input, validate it and update styles accordingly:
passwordInput.addEventListener('input', function () {
    const password = passwordInput.value;

    if (password === "") {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        passwordAlert.style.display = 'block';
        passwordIcon.src = "../assets/icons/sign_up/lock.svg";
        return;
    }

    const isValid = isPasswordValid(password);
    passwordDiv.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    passwordAlert.style.display = isValid ? 'none' : 'block';
});


// Check if the icon in input filed is clicked and: 
// toggle password visibility and matching icon,
document.addEventListener('click', function (e) {
    if (e.target.id === 'sign-up-lock-icon') {
        singUpVisibility(passwordInput, e.target);
    } else if (!passwordDiv.contains(e.target)) {
        passwordInput.type = "password";
        passwordIcon.src = "../assets/icons/sign_up/lock.svg";
    }
});

// Utility function to toggle password visibility
function singUpVisibility(input, icon) {
    if (input.type === "password") {
        input.type = "text";
        icon.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        input.type = "password";
        icon.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}