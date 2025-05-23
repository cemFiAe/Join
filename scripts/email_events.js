
// Email validation function

function isEmailValid(email) {
    let emailParts = email.split('@');
    if (emailParts.length !== 2) return false;

    let namePart = emailParts[0];
    let domainPart = emailParts[1];

    // Name part must be at least 8 characters
    if (namePart.length < 8) return false;

    // Count letters and numbers in the name part
    let letters = (namePart.match(/[A-Za-z]/g) || []).length;
    let numbers = (namePart.match(/[0-9]/g) || []).length;

    if (letters < 6 || numbers > 2) return false;

    // Domain part must be in the format: provider.domain
    let domainParts = domainPart.split('.');
    if (domainParts.length !== 2) return false;

    let provider = domainParts[0].toLowerCase();
    let domain = domainParts[1];

    // Valid providers list
    let validProviders = ['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'edu'];
    if (!validProviders.includes(provider)) return false;

    // Domain must be letters only and at least 2 characters
    if (!/^[A-Za-z]{2,}$/.test(domain)) return false;
    return true;
}

// this ensures that script is loaded after the html is ready
document.addEventListener('DOMContentLoaded', function () {
    let emailInput = document.getElementById('email-input');
    let emailAlert = document.getElementById('email-alert');
    let logInForm = document.querySelector('.log-in-form');
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
});



// log in/sign up TODO:


// for sign up page extra event listener!!!
// Don´t allow log in or sign up before passwords are correctly fulfilled
// and regarding to this show alert messages.
// ...etc

// check all current work, adjust what is eventually skipped!
