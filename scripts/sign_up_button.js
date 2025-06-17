
// When the user types in the name input, validate the input and update styles accordingly
document.getElementById('name-input').addEventListener('input', function () {
    const nameInput = document.getElementById('name-input');
    const nameAlert = document.getElementById('name-alert');
    const nameDiv = nameInput.closest('.name');
    const name = nameInput.value.trim()

    if (name !== "") {
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

    //  1. Name validation 

    const nameInput = document.getElementById('name-input');
    const nameAlert = document.getElementById('name-alert');
    const nameDiv = nameInput.closest('.name');
    const name = nameInput.value.trim()

    if (name == "") {
        nameInput.style.borderColor = 'rgb(255, 0, 31)';
        nameDiv.style.padding = "0px 0px 10px";
        nameAlert.style.display = "block";
    } else {
        nameInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        nameDiv.style.padding = "0px 0px 24px";
        nameAlert.style.display = "none";
    }


    //  2. Email validation 
    const emailInput = document.getElementById('sign-up-email-input');
    const emailAlert = document.getElementById('sign-up-email-alert');
    const email = emailInput.value.trim();

    if (!isEmailValid(email)) {
        emailInput.style.borderColor = 'rgb(255, 0, 31)';
        emailAlert.style.display = "block";
        isValid = false;
    } else {
        emailInput.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        emailAlert.style.display = "none";
    }


    //  3. Password validation 
    const passwordDiv = document.querySelector('.sign-up-password');
    const passwordInput = document.getElementById('sign-up-password');
    const passwordAlert = document.getElementById('sign-up-password-alert');
    const password = passwordInput.value;

    if (!isPasswordValid(password)) {
        passwordDiv.style.borderColor = 'rgb(255, 0, 31)';
        passwordAlert.innerHTML = "Please insert correct password";
        isValid = false;
    } else {
        passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        passwordAlert.innerHTML = "";
    }


    //  4. Confirm-password validation 
    const confirmDiv = document.querySelector('.confirm-password');
    const confirmInput = document.getElementById('confirm-password');
    const confirmAlert = document.getElementById('confirm-password-alert');
    const confirmPassword = confirmInput.value;

    if (!confirmPassword || confirmPassword !== password) {
        confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        confirmAlert.innerHTML = "Passwords do not match";
        isValid = false;
    } else {
        confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        confirmAlert.innerHTML = "";
    }


    //  5. Privacy Policy validation
    const checkbox = document.getElementById('accept-privacy-policy');
    const policyAlert = document.getElementById('privacy-policy-alert');

    if (!checkbox.checked) {
        policyAlert.style.display = "block";
        isValid = false;
    } else {
        policyAlert.style.display = "none";
    }


    //  If all validations in form are true, do the following:
    if (isValid) {

        // let the new useres sing up;
        const BASE_URL = "https://join-sign-up-log-in-default-rtdb.europe-west1.firebasedatabase.app/";

        let userData = {
            name: name,
            email: email,
            password: password
        };

        async function signUpUser(userData) {
            try {
                let response = await fetch(`${BASE_URL}users.json`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                        // we are sending .json content, and database must know that
                    },
                    body: JSON.stringify(userData) // important, to send our datas as text!
                });

                if (!response.ok) { // check if there any errors
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Show the signed-up screen
                document.getElementById('signed-up-screen').style.display = "block";

                // Wait for 1 second, then redirect
                setTimeout(() => {
                    document.getElementById('signed-up-screen').style.display = "none";
                    sessionStorage.setItem('cameFromSignUp', 'true');
                    window.location.href = "../pages/log_in.html";
                }, 1000);

            } catch (error) {
                console.error("Failed to save user:", error.message);
            }
        }
        signUpUser(userData);

    }
    return isValid;
}

// By changing checkbox status, show/hide alert message
const checkbox = document.getElementById('accept-privacy-policy');
const policyAlert = document.getElementById('privacy-policy-alert');

checkbox.addEventListener('change', function () {
    policyAlert.style.display = this.checked ? "none" : "block";
});



