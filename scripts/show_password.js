function insertPassword() {
    let pass = document.getElementById('password')
    document.querySelector('.password').classList.add('blue-frame')
    if (pass.type === "password") {
        pass.type = "password";
        document.getElementById('lock-logo').src = "../assets/icons/log_in/visibility_off.svg"
    } else if (pass.value === "")
        document.getElementById('lock-logo').src = "../assets/icons/log_in/lock.svg"
}

function showPassword() {
    let pass = document.getElementById('password')
    if (pass.type === "password") {
        pass.type = "text";
        document.getElementById('lock-logo').src = "../assets/icons/log_in/visibility.svg"
    } else {
        pass.type = "password";
        document.getElementById('lock-logo').src = "../assets/icons/log_in/visibility_off.svg"
    }
}

function confirmPassword() {
    let pass = document.getElementById('confirm-password')
    if (pass.type === "password") {
        pass.type = "text";
    } else {
        pass.type = "password";
    }
}