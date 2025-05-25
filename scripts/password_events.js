
// Password validation

function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}

// Password visibility and visibility matching icon:
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

// Confirm-password visibility and visibility matching icon:
function toggleConfirmVisibility(iconElement) {
    // Find the closest .confirm-password container to this icon
    let confirmDiv = iconElement.closest('.confirm-password');
    if (!confirmDiv) return;

    let confirmInput = confirmDiv.querySelector('input');

    if (confirmInput.type === "password") {
        confirmInput.type = "text";
        iconElement.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        confirmInput.type = "password";
        iconElement.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}


////////// --- Password events for log in page --- //////////

// Check where is clicked, and perform accordingly:
document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.password');
    let lockLogo = document.getElementById('log-in-lock-icon');
    let passwordAlert = document.getElementById('log-in-password-alert')

    // if the icon is clicked, call toggleVisibility() 
    if (e.target.matches('.lock-icon')) {
        toggleVisibility(e.target);
        return;
    }

    // if outside password input is clicked, reset input
    // if (!passwordDiv.contains(e.target)) {
    //     passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
    //     passwordDiv.classList.remove('red-highlight');
    //     lockLogo.src = "../assets/icons/log_in/lock.svg";
    //     passwordAlert.innerHTML = "";
    // }
});

// Check input, and perform accordingly:
document.addEventListener('input', function (e) {
    let passwordDiv = document.querySelector('.password');
    let passwordInput = document.getElementById('log-in-password');
    let lockLogo = document.getElementById('log-in-lock-icon');
    let passwordAlert = document.getElementById('log-in-password-alert')

    // if input is true --->
    if (passwordDiv && passwordDiv.contains(e.target)) {
        passwordDiv.classList.add('red-highlight');
        lockLogo.src = "../assets/icons/log_in/visibility_off.svg";

        // ---> check the input/password and change border color:
        if (isPasswordValid(passwordInput.value)) {  // if valid;
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)';
            passwordDiv.classList.remove('red-highlight');
            passwordAlert.innerHTML = "";

        } else {  // if not valid;
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            passwordAlert.innerHTML = "Please insert correct password";
        }
    }
});


////////// --- Password and Confirm-password events for sign up page --- //////////

// Check where is clicked, and perform accordingly:
document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.password');
    // let lockLogo = document.getElementById('sign-up-lock-icon');
    let passwordAlert = document.getElementById('sign-up-password-alert')

    // if the icon is clicked, call toggleVisibility() 
    if (e.target.matches('.lock-icon')) {
        toggleVisibility(e.target);
        return;
    }

    // if outside password input is clicked, reset input
    if (!passwordDiv.contains(e.target)) {
        passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        passwordDiv.classList.remove('red-highlight');
        // lockLogo.src = "../assets/icons/sign_up/lock.svg";
        // passwordAlert.innerHTML = "";
    }
});

// Check input, and perform accordingly:
document.addEventListener('input', function (e) {
    let passwordDiv = document.querySelector('.password');
    let passwordInput = document.getElementById('sign-up-password');
    let lockLogo = document.getElementById('sign-up-lock-icon');
    let passwordAlert = document.getElementById('sign-up-password-alert')

    // if input is true --->
    if (passwordDiv.contains(e.target)) {
        passwordDiv.classList.add('red-highlight');
        lockLogo.src = "../assets/icons/sign_up/visibility_off.svg";

        // ---> check the input/password and change border color:
        if (isPasswordValid(passwordInput.value)) {  // if valid;
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)';
            passwordDiv.classList.remove('red-highlight');
            passwordAlert.innerHTML = "";

        } else {  // if not valid;
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            passwordAlert.innerHTML = "Please insert correct password";
        }
    }
});


// ---------- Confirming the password ---------- //
// Check where is clicked, and perform accordingly:
document.addEventListener('click', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let lockLogo = document.getElementById('sign-up-lock-icon');
    let confirmAlert = document.getElementById('confirm-password-alert')

    // if the icon is clicked, call toggleConfirmVisibility() 
    if (e.target.matches('.lock-icon')) {
        toggleConfirmVisibility(e.target);
        return;
    }

    //     // if outside password input is clicked, reset input
    // if (!confirmDiv && !confirmDiv.contains(e.target)) {
    //         confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
    //         confirmDiv.classList.remove('red-highlight');
    //         lockLogo.src = "../assets/icons/sign_up/lock.svg";
    //         confirmAlert.innerHTML = ""
    //     }
});


// Validate confirm-password input, and perform accordingly:
document.addEventListener('input', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let confirmInput = document.getElementById('confirm-password');
    let passwordInput = document.getElementById('sign-up-password');
    let lockLogo = document.getElementById('sign-up-lock-icon');
    let confirmAlert = document.getElementById('confirm-password-alert')

    // if confirm-password input is true --->
    if (confirmDiv && confirmDiv.contains(e.target)) {
        confirmDiv.classList.add('red-highlight');
        lockLogo.src = "../assets/icons/sign_up/visibility_off.svg";

        // ---> check the confirming input/password and change border color accordingly:
        // 1. Check if confirm password matches the original password;
        // 2. Prevent the match if both inputs are empty;
        if (confirmInput.value === passwordInput.value && confirmInput.value !== '') {
            confirmDiv.style.borderColor = 'rgb(41, 171, 226)';
            confirmDiv.classList.remove('red-highlight');
            confirmAlert.innerHTML = ""

        } else { // If confirmation doesn't match;
            confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
            confirmAlert.innerHTML = "Please confirm your password"
        }
    }
});

// log in/sign up TODO:


// for sign up page extra event listener!!!
// Don´t allow log in or sign up before passwords are correctly fulfilled
// and regarding to this show alert messages.
// ...etc

// check all current work, adjust what is eventually skipped!
