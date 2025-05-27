
let logInButton = document.getElementById('log-in-button');
let guestLogInButton = document.getElementById('guest-log-in-button');

// emailInput and emailAlert are already in email validation declared
emailInput.addEventListener('input', function () {
    // if input is true; enabled buttons
    if (isEmailValid(emailInput.value)) {
        logInButton.disabled = false
        guestLogInButton.disabled = false

        // if input is not true; disable the buttons
    } else {
        logInButton.disabled = true;
        guestLogInButton.disabled = true
    }

    // when input field is clear, enable buttons
    if (emailInput.value === "") {
        logInButton.disabled = false;
        guestLogInButton.disabled = false
    }
});

// if the form is empty, disable buttons
logInButton.addEventListener('click', function () {
    if (emailInput.value === "") {
        emailAlert.style.display = "block";
        logInButton.disabled = true;
    } else {
        emailAlert.style.display = "none";

    }
});
guestLogInButton.addEventListener('click', function () {
    if (emailInput.value === "") {
        emailAlert.style.display = "block";
        guestLogInButton.disabled = true;
    }
});



// log in/sign up TODO:


// for sign up page extra event listener!!!
// Don´t allow log in or sign up before passwords are correctly fulfilled
// and regarding to this show alert messages.
// ...etc

// check all current work, adjust what is eventually skipped!
