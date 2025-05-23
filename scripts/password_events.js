
// Password validation

function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}


// ---------- Password ---------- //
// check where is clicked, and perform accordingly:
document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.password');
    let lockLogo = document.getElementById('lock-icon');

    // if the icon is clicked, call toggleVisibility() 
    if (e.target.matches('.lock-icon')) {
        toggleVisibility(e.target);
        return;
    }

    // if outside password input is clicked, reset input
    if (!passwordDiv.contains(e.target)) {
        passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        passwordDiv.classList.remove('red-highlight');
        lockLogo.src = "../assets/icons/log_in/lock.svg";
    }
});


// check input, and perform accordingly:
document.addEventListener('input', function (e) {
    let logInForm = document.querySelector('.log-in-form');
    let passwordDiv = document.querySelector('.password');
    let passwordInput = document.getElementById('password');
    let passwordAlert = document.getElementById('password-alert')
    let lockLogo = document.getElementById('lock-icon');

    // if input is true;
    if (passwordDiv.contains(e.target)) {s
        logInForm.style.padding = "16px 0px 0px"
        passwordDiv.classList.add('red-highlight');
        lockLogo.src = "../assets/icons/log_in/visibility_off.svg";

        // Validate the input/password and change border color accordingly:
        if (isPasswordValid(passwordInput.value)) {  // if valid;
            logInForm.style.padding = "0px"
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)';
            passwordDiv.classList.remove('red-highlight');
            passwordAlert.style.display = "none"

        } else {  // if not valid;
            logInForm.padding = "16px 0px 0px";
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            passwordAlert.style.display = "block"
        }
    }
});


// ---------- Confirming the password ---------- //
// check where is clicked, and perform accordingly:
document.addEventListener('click', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let lockLogo = document.getElementById('sign-up-lock-icon');

    // if the icon is clicked, call toggleConfirmVisibility() 
    if (e.target.matches('.lock-icon')) {
        toggleConfirmVisibility(e.target);
        return;
    }

    // if outside password input is clicked, reset input
    if (!confirmDiv.contains(e.target)) {
        confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        confirmDiv.classList.remove('red-highlight');
        lockLogo.src = "../assets/icons/sign_up/lock.svg";
    }
});


// check input, and perform accordingly:
document.addEventListener('input', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let confirmInput = document.getElementById('confirm-password');
    let passwordInput = document.getElementById('password');
    let lockLogo = document.getElementById('sign-up-lock-icon');

    // if input is true;
    if (confirmDiv.contains(e.target)) {
        confirmDiv.classList.add('red-highlight');
        lockLogo.src = "../assets/icons/log_in/visibility_off.svg";

        // Validate the confirming input/password and change border color accordingly:
        // check if confirm password matches the original password;
        // && prevent the match if both inputs are empty;
        if (confirmInput.value === passwordInput.value && confirmInput.value !== '') {
            confirmDiv.style.borderColor = 'rgb(41, 171, 226)';
            confirmDiv.classList.remove('red-highlight');
            // If confirmation doesn't match;
        } else {
            confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        }
    }
});




// change password visibility and visibility matching icon:
function toggleVisibility(iconElement) {
    // Find the closest .password container to this icon
    let passwordDiv = iconElement.closest('.password');
    let passwordInput = passwordDiv.querySelector('input');

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        iconElement.src = "../assets/icons/log_in/visibility.svg";
    } else {
        passwordInput.type = "password";
        iconElement.src = "../assets/icons/log_in/visibility_off.svg";
    }
}

// change confirm-password visibility and visibility matching icon:
function toggleConfirmVisibility(iconElement) {
    // Find the closest .confirm-password container to this icon
    let confirmDiv = iconElement.closest('.confirm-password');
    let confirmInput = confirmDiv.querySelector('input');

    if (confirmInput.type === "password") {
        confirmInput.type = "text";
        iconElement.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        confirmInput.type = "password";
        iconElement.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}

// log in/sign up TODO:


// for sign up page extra event listener!!!
// Don´t allow log in or sign up before passwords are correctly fulfilled
// and regarding to this show alert messages.
// ...etc

// check all current work, adjust what is eventually skipped!
