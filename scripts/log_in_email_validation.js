
// Email validation function for both Log in and Sign up pages

function isEmailValid(email) {
    let emailParts = email.split('@');
    if (emailParts.length !== 2) return false;

    let namePart = emailParts[0];
    let domainPart = emailParts[1];

    // Name part must be at least 8 characters:
    if (namePart.length < 8) return false;

    // letters and numbers in the name part must be in this way --->
    let letters = (namePart.match(/[A-Za-z]/g) || []).length;
    let numbers = (namePart.match(/[0-9]/g) || []).length;

    // ---> at least 6 letters with maximum 2 numbers! (or just min. 8 letters)
    if (letters < 6 || numbers > 2) return false;

    // Domain part must be in this format: provider.domain 
    // and it must have 2 parts (provider + domain)!
    let domainParts = domainPart.split('.');
    if (domainParts.length !== 2) return false;

    let provider = domainParts[0].toLowerCase();
    let domain = domainParts[1];

    // This is valid providers list:
    let validProviders = ['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'gmx', 'edu'];
    if (!validProviders.includes(provider)) return false;

    // and domain must have letters only and at least 2 of them
    // following is a testing regex:
    if (!/[A-Za-z]{2,}$/.test(domain)) return false;
    return true;
}

let emailInput = document.getElementById('log-in-email-input');
let emailAlert = document.getElementById('log-in-email-alert');

emailInput.addEventListener('input', function () {
    // Reset when the input is empty
    if (emailInput.value === "") {
        emailInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        emailAlert.style.display = "none";
        return;
    }

    // Apply styles after validation: if isValid(?) then 'color/display' otherwise(:) 'color/display'
    const isValid = isEmailValid(emailInput.value);
    emailInput.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    emailAlert.style.display = isValid ? "none" : "block";
});



