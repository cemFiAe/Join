/**
 * @file log_in_email_validation.js
 * 
 * This file includes a function to validate email input for a login page
 * 
 * and an event listener to update the UI based on validation results.
 */

/**
 * Validates an email address according to custom rules.
 *
 * The rules are:
 * - Must have exactly one '@' symbol.
 * - Name part must be at least 8 characters.
 * - Name part must contain at least 6 letters.
 * - Name part must contain no more than 2 numbers.
 * - Domain must be valid and from an allowed provider.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} `true` if valid, `false` otherwise.
 */

function isEmailValid(email) {
    let emailParts = email.split('@');
    if (emailParts.length !== 2) return false;

    let namePart = emailParts[0];
    let domainPart = emailParts[1];

    if (namePart.length < 8) return false;

    let letters = (namePart.match(/[A-Za-z]/g) || []).length;
    let numbers = (namePart.match(/[0-9]/g) || []).length;

    if (letters < 6 || numbers > 2) return false;

    let domainParts = domainPart.split('.');
    if (domainParts.length !== 2) return false;

    let provider = domainParts[0].toLowerCase();
    let domain = domainParts[1];

    let validProviders = ['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'gmx', 'edu'];
    if (!validProviders.includes(provider)) return false;

    if (!/[A-Za-z]{2,}$/.test(domain)) return false;

    return true;
}

// ========== UI INTERACTION ==========

/**
 * Input event listener for the email input field.
 * Validates the email and updates the input border and alert message visibility accordingly.
 */
 
emailInput.addEventListener('input', function () {
    const isValid = isEmailValid(emailInput.value);
    emailInput.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    emailAlert.style.display = isValid ? 'none' : 'block';
});
