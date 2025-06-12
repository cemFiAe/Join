
// When the user types in the name input, validate the input and update styles accordingly
document.getElementById('name-input').addEventListener('input', function () {
    const name = this.value.trim();
    const nameDiv = this.closest('.name');
    const nameAlert = document.getElementById('name-alert');

    if (name == "") {
        this.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        nameDiv.style.padding = "0px 0px 24px";
        nameAlert.style.display = "none";
    } else {
        this.style.borderColor = 'rgb(255, 0, 31)';
        nameDiv.style.padding = "0px 0px 10px";
        nameAlert.style.display = "block";
    }
});


function signedUp(event) {
    event.preventDefault();

    // Form validation in steps
    let isValid = true;

    //  Name validation 
    const nameInput = document.getElementById('name-input');
    const nameAlert = document.getElementById('name-alert');
    const nameDiv = nameInput.closest('.name');
    const name = nameInput.value.trim();

    if (name === "") {
        nameInput.style.borderColor = 'rgb(255, 0, 31)';
        nameDiv.style.padding = "0px 0px 10px";
        nameAlert.style.display = "block";
        isValid = false;
    } else {
        nameInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        nameDiv.style.padding = "0px 0px 24px";
        nameAlert.style.display = "none";
    }

    //  Email validation 
    const emailInput = document.getElementById('sign-up-email-input');
    const emailAlert = document.getElementById('sign-up-email-alert');
    const email = emailInput.value.trim();
    const validEmail = isEmailValid(email);

    if (!validEmail) {
        emailInput.style.borderColor = 'rgb(255, 0, 31)';
        emailAlert.style.display = "block";
        isValid = false;
    } else {
        emailInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        emailAlert.style.display = "none";
    }

    //  Password validation 
    const passwordDiv = document.querySelector('.sign-up-password');
    const passwordInput = document.getElementById('sign-up-password');
    const passwordAlert = document.getElementById('sign-up-password-alert');
    const password = passwordInput.value;
    const validPassword = isPasswordValid(password);

    if (!validPassword) {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        passwordAlert.innerHTML = "Please insert correct password";
        isValid = false;
    } else {
        passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        passwordAlert.innerHTML = "";
    }

    //  Confirm-password validation 
    const confirmDiv = document.querySelector('.confirm-password');
    const confirmInput = document.getElementById('confirm-password');
    const confirmAlert = document.getElementById('confirm-password-alert');
    const confirmPassword = confirmInput.value;
    const passwordsMatch = password === confirmPassword;

    if (!confirmPassword || !passwordsMatch) {
        confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        confirmAlert.innerHTML = "Passwords do not match";
        isValid = false;
    } else {
        confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        confirmAlert.innerHTML = "";
    }

    //  Privacy Policy validation
    const checkbox = document.getElementById('accept-privacy-policy');
    const policyAlert = document.getElementById('privacy-policy-alert');

    if (!checkbox.checked) {
        policyAlert.style.display = "block";
        isValid = false;
    } else {
        policyAlert.style.display = "none";
    }

    
    //  If all validations in form are true, do thew following 
    if (isValid) {
        document.getElementById('signed-up-screen').style.display = "block";

        setTimeout(() => {
            document.getElementById('signed-up-screen').style.display = "none";
            window.location.href = "../pages/log_in.html";
            sessionStorage.setItem('cameFromSignUp', 'true');
        }, 1000);
    }
    return isValid;
}

// By changing checkbox status, show/hide alert message
const checkbox = document.getElementById('accept-privacy-policy');
const policyAlert = document.getElementById('privacy-policy-alert');

checkbox.addEventListener('change', function () {
    policyAlert.style.display = this.checked ? "none" : "block";
});



