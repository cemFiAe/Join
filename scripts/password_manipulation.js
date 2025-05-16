
// changing the visibility of password in password field, by clicking on the visibility-logo

function showPassword() {
    let pass = document.getElementById('password');
    let lockLogo = document.getElementById('lock-logo');

    if (pass.type === "password") {
        pass.type = "text";
        lockLogo.src = "../assets/icons/log_in/visibility.svg";
    } else {
        pass.type = "password";
        lockLogo.src = "../assets/icons/log_in/visibility_off.svg";
    }
}


// does the same thing but in confirm-password field

function showConfirmPassword() {
    let confirm = document.getElementById('confirm-password');
    let lockLogo = document.getElementById('lock-logo');

    if (confirm.type === "password") {
        confirm.type = "text";
        lockLogo.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        confirm.type = "password";
        lockLogo.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}

// this event listener is the same for both password fields in log in and sign up pages, 
// and is used to;
// 1. check if there is an password input
// 2. due to visibility of password (determined by showPassword()), shows the rigth visibility-logo 
// 3. resets the password field when clicked outside

document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.password');
    let pass = document.getElementById('password');
    let lockLogo = document.getElementById('lock-logo');

    let isInsidePassword = passwordDiv.contains(e.target);
    let isLockIcon = e.target === lockLogo;

    if (isInsidePassword && !isLockIcon) {
        if (isPasswordValid(pass.value)) {
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)';
        }
        passwordDiv.classList.add('password-blue-frame');

        lockLogo.src = pass.type === "text"
            ? "../assets/icons/log_in/visibility.svg"
            : "../assets/icons/log_in/visibility_off.svg";
    } else if (!isInsidePassword) {
        passwordDiv.classList.remove('password-blue-frame');

        if (pass.value && !isPasswordValid(pass.value)) {
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        } else {
            passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        }
    }
});



// this event listener is for confirm-password field, just in sign up page, 
// and is used to;
// 1. check if there is an password input
// 2. due to visibility of password (determined by showConfirmPassword()), shows the rigth visibility-logo 
// 3. resets the password field when clicked outside

document.addEventListener('click', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let confirm = document.getElementById('confirm-password');
    let lockLogo = document.getElementById('sign-up-lock-logo');
    let pass = document.getElementById('password');

    let isInsideConfirm = confirmDiv.contains(e.target);
    let isLockIcon = e.target === lockLogo;

    if (isInsideConfirm && !isLockIcon) {
        if (confirm.value === pass.value && confirm.value !== "") {
            confirmDiv.style.borderColor = 'rgb(41, 171, 226)';
        }
        confirmDiv.classList.add('confirm-password-blue-frame');

        lockLogo.src = confirm.type === "text"
            ? "../assets/icons/sign_up/visibility.svg"
            : "../assets/icons/sign_up/visibility_off.svg";
    } else if (!isInsideConfirm) {
        confirmDiv.classList.remove('confirm-password-blue-frame');

        if (confirm.value && confirm.value !== pass.value) {
            confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        } else {
            confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        }
    }
});




// check password if it meets this conditions
// at least: 6 letters and 2 numbers

let passInput = document.getElementById('password');
let confirmInput = document.getElementById('confirm-password');
let passContainer = document.querySelector('.password');
let confirmContainer = document.querySelector('.confirm-password');

// validate password format: 6 letters + 2 numbers
function isPasswordValid(value) {
    let letterCount = (value.match(/[A-Za-z]/g) || []).length;
    let numberCount = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letterCount >= 6 && numberCount >= 2;
}

// input listener for password
passInput.addEventListener('input', () => {
    if (isPasswordValid(passInput.value)) {
        passContainer.classList.add('password-blue-frame');
        passContainer.style.borderColor = 'rgb(41, 171, 226)';
    } else if (passInput.value) {
        passContainer.classList.remove('password-blue-frame');
        passContainer.style.borderColor = 'rgb(255, 0, 31)';
    } else {
        passContainer.style.borderColor = 'rgba(0, 0, 0, 0.1)';
    }
});

// input listener for confirm-password
confirmInput.addEventListener('input', () => {
    if (confirmInput.value === passInput.value) {
        confirmContainer.classList.add('confirm-password-blue-frame');
        confirmContainer.style.borderColor = 'rgb(41, 171, 226)';
    } else if (confirmInput.value) {
        confirmContainer.classList.remove('confirm-password-blue-frame');
        confirmContainer.style.borderColor = 'rgb(255, 0, 31)';
    } else {
        confirmContainer.style.borderColor = 'rgba(0, 0, 0, 0.1)';
    }
});






