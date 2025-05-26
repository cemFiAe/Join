
// Sign up password visibility and visibility matching icon:
function signUpVisibility(iconElement) {
    // Find the closest .log-in-password container to this icon
    let passwordDiv = iconElement.closest('.sign-up-password');
    let passwordInput = passwordDiv.querySelector('input');

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        iconElement.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        passwordInput.type = "password";
        iconElement.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}


////////// --- Password events for sign up page --- //////////

// Check where is clicked, and perform accordingly:
document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.sign-up-password');
    let lockLogo = document.getElementById('sign-up-lock-icon');
    let passwordAlert = document.getElementById('sign-up-password-alert')

    // if the icon is clicked, call toggleVisibility() 
    if (e.target.matches('sign-up-lock-icon')) {
        signUpVisibility(e.target);
        return;
    }

    // if outside password input is clicked, reset input
    if (!passwordDiv.contains(e.target)) {
        lockLogo.src = "../assets/icons/sign_up/lock.svg";
        passwordAlert.innerHTML = "";
    }
});

// Check input, and perform accordingly:
document.addEventListener('input', function (e) {
    let passwordDiv = document.querySelector('.sign-up-password');
    let passwordInput = document.getElementById('sign-up-password');
    let lockLogo = document.getElementById('sign-up-lock-icon');
    let passwordAlert = document.getElementById('sign-up-password-alert')

    // Check if input is true --->
    if (passwordDiv && passwordDiv.contains(e.target)) {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        lockLogo.src = "../assets/icons/sign_up/visibility_off.svg";

        // ---> check the input/password and change border color:
        if (isPasswordValid(passwordInput.value)) {  // if valid;
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)';
            passwordAlert.innerHTML = "";

        } else {  // if not valid;
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
            passwordAlert.innerHTML = "Please insert correct password";
        }

        // if input is empty:
        if (passwordInput.value === "") {
            passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            passwordAlert.innerHTML = "";
            lockLogo.src = "../assets/icons/sign_up/lock.svg";
        }
    }
});



