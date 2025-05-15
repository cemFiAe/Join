
// changing the visibility of password by clicking on the visibility-logo

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


// does the same thing but in Confirm password field

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

// this function is the same for the passwords in log in and sign up pages, and is used to;
// 1. see if there is an password input 
// 2. due to visibility of password, shows the rigth visibility-logo 
// 3. reset the password field when clicked outside

document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.password');
    let pass = document.getElementById('password');
    let lockLogo = document.getElementById('lock-logo');

    if (passwordDiv.contains(e.target)) {
        passwordDiv.classList.add('password-blue-frame');
        lockLogo.src = "../assets/icons/log_in/visibility_off.svg";

        if (pass.type === "password") {
            lockLogo.src = "../assets/icons/log_in/visibility_off.svg";
        }
        else if (pass.type === "text") {
            lockLogo.src = "../assets/icons/log_in/visibility.svg";
        }
    } else {
        passwordDiv.classList.remove('password-blue-frame');
        pass.value = "";
        lockLogo.src = "../assets/icons/log_in/lock.svg";
    }
});


// this function is just for sign up page, 

document.addEventListener('click', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let confirm = document.getElementById('confirm-password');
    let lockLogo = document.getElementById('sign-up-lock-logo');

    if (confirmDiv.contains(e.target)) {
        confirmDiv.classList.add('confirm-password-blue-frame');
        lockLogo.src = "../assets/icons/sign_up/visibility_off.svg";

        if (confirm.type === "password") {
            lockLogo.src = "../assets/icons/sign_up/visibility_off.svg";
        }
        else if (confirm.type === "text") {
            lockLogo.src = "../assets/icons/sign_up/visibility.svg";
        }
    } else {
        confirmDiv.classList.remove('confirm-password-blue-frame');
        confirm.value = "";
        lockLogo.src = "../assets/icons/sign_up/lock.svg";
    }
});

// incorrect password

