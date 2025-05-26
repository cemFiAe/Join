
// Password validation function

function isPasswordValid(value) {
    let letters = (value.match(/[A-Za-z]/g) || []).length;
    let numbers = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letters >= 6 && numbers >= 2;
}

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

