
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
    let validProviders = ['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'gmx', 'edu'];
    if (!validProviders.includes(provider)) return false;

    // Domain must be letters only and at least 2 characters
    if (!/^[A-Za-z]{2,}$/.test(domain)) return false;
    return true;
}

let emailInput = document.getElementById('sign-up-email-input');
let emailAlert = document.getElementById('sign-up-email-alert');

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