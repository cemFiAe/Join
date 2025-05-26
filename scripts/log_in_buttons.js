
// this ensures that script is loaded after the html is ready
let emailInput = document.getElementById('email-input');
let emailAlert = document.getElementById('email-alert');
let logInButton = document.getElementById('log-in-button');
let guestLogInButton = document.getElementById('guest-log-in-button');


// validating input value
emailInput.addEventListener('input', function () {
    // if input is true, blue highlight, don't show alert message and keep the buttons enabled
    if (isEmailValid(emailInput.value)) {
        emailInput.style.borderColor = 'rgb(41, 171, 226)';
        emailAlert.style.display = "none";
        logInButton.disabled = false
        guestLogInButton.disabled = false

        // if input is not true, red highlight, show alert message and disable the buttons
    } else {
        emailInput.style.borderColor = 'rgb(255, 0, 31)';
        emailAlert.style.display = "block"; // 
        logInButton.disabled = true;
        guestLogInButton.disabled = true
    }

    // when input field is clear, reset all/keep the changes
    if (emailInput.value === "") {
        emailInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        emailAlert.style.display = "none";
        logInButton.disabled = false;
        guestLogInButton.disabled = false
    }
});

// when the form is empty, disable both buttons
if (!logInButton || !guestLogInButton) return;

logInButton.addEventListener('click', function () {
    if (emailInput.value === "") {
        emailAlert.style.display = "block";
        logInButton.disabled = true;
    }
})

guestLogInButton.addEventListener('click', function () {
    if (emailInput.value === "") {
        emailAlert.style.display = "block";
        guestLogInButton.disabled = true;
    }
})



// log in/sign up TODO:


// for sign up page extra event listener!!!
// Don´t allow log in or sign up before passwords are correctly fulfilled
// and regarding to this show alert messages.
// ...etc

// check all current work, adjust what is eventually skipped!
