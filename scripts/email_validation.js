/**
 * Validates an email address according to custom rules.
 * The rules are:
 * 1. Email must have just one '@' character.
 * 2. '@' splits 'email' into 'name part' and 'domain parts'.
 * 3. Name part must have at least 8 characters. 
 * 4. Name part must contain at least 6 letters.
 * 5. Name part must contain no more than 2 numbers.
 * 6. '.' splits domain parts into provider and domain.
 * 7. Provider must be valid and from the list.
 * 8. Domain must contain just letters and at least 2 of them.
 * @param {string} email - The email address to validate.
 * @returns {boolean} 'true' if valid, 'false' otherwise.
 */
function isEmailValid(email) {
    let emailParts = email.split('@');
    let namePart = emailParts[0];
    let domainPart = emailParts[1];
    if (emailParts.length !== 2) return false;

    let letters = (namePart.match(/[A-Za-z]/g) || []).length;
    let numbers = (namePart.match(/[0-9]/g) || []).length;
    if (letters < 6 || numbers > 2 || namePart.length < 8) return false

    let domainParts = domainPart.split('.');
    let provider = domainParts[0];
    let domain = domainParts[1];
    if (domainParts.length !== 2) return false;

    let validProviders = ['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'gmx', 'edu'];
    if (!validProviders.includes(provider)) return false;
    if (!/[A-Za-z]{2,}$/.test(domain)) return false;

    return true;
}


/**
 * This function validates the email input and updates the styles accordingly.
 * @param {boolean} isValid - Returns validation result.
 * @param {string} emailInput - Email input field.
 * @param {string} emailAlert - Alert message beneath input field.
 */
function validateEmailInput() {
    const isValid = isEmailValid(emailInput.value);
    emailInput.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    emailAlert.style.display = isValid ? 'none' : 'block';
}
emailInput.addEventListener('input', validateEmailInput);
