
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

let emailInput = document.getElementById('sign-up-email-input');
let emailAlert = document.getElementById('sign-up-email-alert');

// validating input value
emailInput.addEventListener('input', function () {
    // if input is true, make blue highlight and don't show alert message
    if (isEmailValid(emailInput.value)) {
        emailInput.style.borderColor = 'rgb(41, 171, 226)';
        emailAlert.style.display = "none";

    // if input is not true, make red highlight and show alert message
    } else {
        emailInput.style.borderColor = 'rgb(255, 0, 31)';
        emailAlert.style.display = "block"; // 
    }

    // when input field is clear, remove highlight and alert message
    if (emailInput.value === "") {
        emailInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        emailAlert.style.display = "none";
    }
});