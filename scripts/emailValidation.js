/**
 * Validates an email address according to custom rules.
 * The rules are:
 * 1. Email must have just one '@' character.
 * 2. '@' splits 'email' into 'name part' and 'domain part'.
 * 3. Name part must have at least 6 alphanumeric characters. 
 * 4. After '@', there must be letters, then a '.', then letters (e.g., "mail.de").
 * 5. Domain must contain only letters and at least 2 of them.
 * @param {string} email - The email address to validate.
 * @returns {boolean} 'true' if valid, 'false' otherwise.
 */
function isEmailValid(email) {
    let emailParts = email.split('@');
    if (emailParts.length !== 2) return false;

    let namePart = emailParts[0];
    let domainPart = emailParts[1];

    let charCount = (namePart.match(/[A-Za-z0-9]/g) || []).length;
    if (charCount < 6) return false;

    if (!/^[A-Za-z]+\.[A-Za-z]{2,}$/.test(domainPart)) return false;

    return true;
}


/**
 * This function validates the email input and updates the styles accordingly.
 * @param {boolean} isValid Returns validation result.
 * @param {string} emailInput Email input field.
 * @param {string} emailAlert Alert message beneath input field.
 * @param {boolean} isValid If 'true' email is written correctly.
 */
function validateEmailInput() {
    const isValid = isEmailValid(emailInput.value);
    emailInput.style.borderColor = isValid ? 'rgb(41, 171, 226)' : 'rgb(255, 0, 31)';
    emailAlert.style.display = isValid ? 'none' : 'block';
}
// emailInput.addEventListener('input', validateEmailInput);
