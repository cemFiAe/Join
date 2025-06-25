
// Email validation function for Log in page

function isEmailValid(email) {
    let emailParts = email.split('@');
    if (emailParts.length !== 2) return false;

    let namePart = emailParts[0];
    let domainPart = emailParts[1];

    // Name part must be at least 8 characters:
    if (namePart.length < 8) return false;

    // Count letters and numbers in the name part
    let letters = (namePart.match(/[A-Za-z]/g) || []).length;
    let numbers = (namePart.match(/[0-9]/g) || []).length;

    // ---> at least 6 letters and max 2 numbers! (or min. 8 letters)
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

    // Domain must have letters only and at least 2 of them,
    // following is a testing regex:
    if (!/[A-Za-z]{2,}$/.test(domain)) return false;
    return true;
}


let emailInput = document.getElementById('log-in-email-input');
let emailAlert = document.getElementById('log-in-email-alert');

emailInput.addEventListener('input', function () {
    const isValid = isEmailValid(emailInput.value);
    
    emailInput.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    emailAlert.style.display = isValid ? "none" : "block";
});



