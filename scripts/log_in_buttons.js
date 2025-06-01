
let passwordInput = document.getElementById('log-in-password');
let passwordAlert = document.getElementById('log-in-password-alert');

let logInButton = document.getElementById('log-in-button');
let guestLogInButton = document.getElementById('guest-log-in-button');

// Validate fields
function validateInputs() {
    let emailEmpty = emailInput.value.trim() === "";
    let passwordEmpty = passwordInput.value.trim() === "";

    if (emailEmpty && passwordEmpty) {
        emailAlert.style.display = "block";
        passwordAlert.innerHTML = "Please insert correct password";
        logInButton.disabled = true;
        guestLogInButton.disabled = true;
    } else if (emailEmpty) {
        emailAlert.style.display = "block";
        passwordAlert.innerHTML = "";
        logInButton.disabled = true;
        guestLogInButton.disabled = true;
    } else if (passwordEmpty) {
        emailAlert.style.display = "none";
        passwordAlert.innerHTML = "Please insert correct password";
        logInButton.disabled = true;
        guestLogInButton.disabled = true;
    } else {
        emailAlert.style.display = "none";
        passwordAlert.innerHTML = "";
        logInButton.disabled = false;
        guestLogInButton.disabled = false;
    }
}

// Attach listeners to both buttons
logInButton.addEventListener('click', function (e) {
    e.preventDefault(); // Stop form submission
    validateInputs();
});

guestLogInButton.addEventListener('click', function (e) {
    e.preventDefault(); // Stop form submission
    validateInputs();
});



// log in/sign up TODO:


// for sign up page extra event listener!!!
// Don´t allow log in or sign up before passwords are correctly fulfilled
// and regarding to this show alert messages.
// ...etc

// check all current work, adjust what is eventually skipped!
