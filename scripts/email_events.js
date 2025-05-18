
// Email validation

function isEmailValid(value) {
    
    let emailParts = value.split('@');
    // Validate the main email form (if name@domain)
    if (emailParts.length !== 2) return false;
    
    let namePart = emailParts[0]; 
    let domainPart = emailParts[1];
    
    // Validate email name part
    if (namePart.length < 8) return false;
    let letters = (localPart.match(/[A-Za-z]/g) || []).length;
    let numbers = (localPart.match(/[0-9]/g) || []).length;
    // and validate length of letters and numbers
    if (letters < 2 || numbers < 2) return false;
    
    // Split domainPart into provider and domain
    let domainParts = domainPart.split('.');
    let provider = domainParts[0].toLowerCase();
    let domain = domainParts[1];
    // and validate their length
    if (domainParts.length !== 2) return false;
    
    // Validate provider against the allowed list
    let validProviders = ['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'edu'];
    if (!validProviders.includes(provider)) return false;

    // Test domain if it has only letters and at least 2 of them
    if (!/^[A-Za-z]{2,}$/.test(domain)) return false;
    return true;
}

// log in/sign up TODO:

// 1. Rewrite if-s (conditional statements) and perform styling changes according to conditions (like in password events).
// 2. Don´t allow log in or sign up before email and passwords are correctly fulfilled
// and regarding to this show alert messages.
// ...etc

// check all current work, adjust what is eventually skipped!