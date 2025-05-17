function isPasswordValid(value) {
    let letterCount = (value.match(/[A-Za-z]/g) || []).length;
    let numberCount = (value.match(/[0-9]/g) || []).length;
    return value.length >= 8 && letterCount >= 6 && numberCount >= 2;
}


function toggleVisibility(iconElement) {
    // Find the closest .password container to this icon
    let passwordDiv = iconElement.closest('.password');
    let pass = passwordDiv.querySelector('input');
    let lockLogo = iconElement;

    // Toggle password visibility and the icon
    if (pass.type === "password") {
        pass.type = "text"; // Show the password
        lockLogo.src = "../assets/icons/log_in/visibility.svg"; // Change icon to "visibility"
    } else {
        pass.type = "password"; // Hide the password
        lockLogo.src = "../assets/icons/log_in/visibility_off.svg"; // Change icon to "visibility_off"
    }
}


document.addEventListener('click', function (e) {
    let passwordDiv = document.querySelector('.password');
    let pass = document.getElementById('password');
    let lockLogo = document.getElementById('lock-logo');

    // Check if the lock icon is clicked
    if (e.target.matches('.lock-logo')) {
        toggleVisibility(e.target); // Pass the clicked lock logo element
        return; // Prevent the rest of the code from running
    }

    // If clicked outside the password input field
    if (!passwordDiv.contains(e.target)) {
        pass.value = ""; // Clear the input field
        passwordDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)'; // Reset border color
        passwordDiv.classList.remove('red-highlight'); // Remove red highlight
        pass.type = "password"; // Set input type back to password
        lockLogo.src = "../assets/icons/log_in/visibility_off.svg"; // Reset to lock icon
    }
});


document.addEventListener('input', function (e) {
    let passwordDiv = document.querySelector('.password');
    let pass = document.getElementById('password');

    if (passwordDiv.contains(e.target)) {
        passwordDiv.classList.add('red-highlight'); // Add red highlight if typing inside

        // Validate the password and change border color accordingly
        if (isPasswordValid(pass.value)) {
            passwordDiv.style.borderColor = 'rgb(41, 171, 226)'; // Valid password: blue
            passwordDiv.classList.remove('red-highlight'); // Remove red highlight if valid
        } else {
            passwordDiv.style.borderColor = 'rgb(255, 0, 31)'; // Invalid password: red
        }
    }
});





// does the same thing but in confirm-password field

function confirmPasswordVisibility() {
    let confirm = document.getElementById('confirm-password');
    let lockLogo = document.getElementById('sign-up-lock-logo');

    if (confirm.type === "password") {
        confirm.type = "text";
        lockLogo.src = "../assets/icons/sign_up/visibility.svg";
    } else {
        confirm.type = "password";
        lockLogo.src = "../assets/icons/sign_up/visibility_off.svg";
    }
}


// this event listener is for confirm-password field, just in sign up page, 
// and is used to;
// 1. check if there is an password input
// 2. due to visibility of password (determined by showConfirmPassword()), shows the rigth visibility-logo 
// 3. resets the password field when clicked outside

document.addEventListener('click', function (e) {
    let confirmDiv = document.querySelector('.confirm-password');
    let confirm = document.getElementById('confirm-password');
    let lockLogo = document.getElementById('sign-up-lock-logo');
    let pass = document.getElementById('password');

    let inputClicked = confirmDiv.contains(e.target);
    let logoClicked = e.target === lockLogo;

    if (inputClicked && !logoClicked) {
        if (confirm.value === pass.value && confirm.value !== "") {
            confirmDiv.style.borderColor = 'rgb(41, 171, 226)';
        }
        confirmDiv.classList.add('confirm-password-blue-highlight');

        lockLogo.src = confirm.type === "text"
            ? "../assets/icons/sign_up/visibility.svg"
            : "../assets/icons/sign_up/visibility_off.svg";
    } else if (!inputClicked) {
        confirmDiv.classList.remove('confirm-password-blue-highlight');

        if (confirm.value && confirm.value !== pass.value) {
            confirmDiv.style.borderColor = 'rgb(255, 0, 31)';
        } else {
            confirmDiv.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        }
    }
});





