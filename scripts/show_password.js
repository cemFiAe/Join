
// password input changes

// function insertPassword() {
//     let pass = document.getElementById('password');
//     let confirm = document.getElementById('confirm-password')
//     let lockLogo = document.getElementById('lock-logo');
//     let passwordDiv = document.querySelector('.password');
//     passwordDiv.classList.add('blue-frame');

//     if (pass.value, confirm.value  != "") {
//         lockLogo.src = "../assets/icons/log_in/visibility_off.svg";
//     }
// }


// visibility of password

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


// reseting the password field when clicked outside

document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.password');
    let pass = document.getElementById('password');
    let confirm = document.getElementById('confirm-password')
    let lockLogo = document.getElementById('lock-logo');

    if (passwordDiv.contains(e.target)) {
        passwordDiv.classList.add('blue-frame');

        if (pass.type, confirm.type === "text") {
            lockLogo.src = "../assets/icons/log_in/visibility.svg";
        } else if (pass.type, confirm.type = "password") {
            lockLogo.src = "../assets/icons/log_in/visibility_off.svg";
        }

    } else {
        passwordDiv.classList.remove('blue-frame');
        pass.value = "";
        lockLogo.src = "../assets/icons/log_in/lock.svg";
    }
});


// incorrect password

