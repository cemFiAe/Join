// ---- Firebase Config & Init ----
/** @type {any} */
const firebaseConfig = {
  apiKey: "AIzaSyDv82uEEOlU5I8YibKsHIaEv9ffhzNMaEA",
  authDomain: "join-7e2a3.firebaseapp.com",
  databaseURL: "https://join-7e2a3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "join-7e2a3",
  storageBucket: "join-7e2a3.firebasestorage.app",
  messagingSenderId: "730060662008",
  appId: "1:730060662008:web:da8166f25bbc6cf48d870d"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ---- SIGN UP ----
/**
 * Handles sign-up form submission, creates user, saves to DB, and redirects.
 * @param {Event} event
 * @returns {boolean}
 */
function signedUp(event) {
  event.preventDefault();
  const nameInput = document.getElementById("name-input");
  const emailInput = document.getElementById("sign-up-email-input");
  const passwordInput = document.getElementById("sign-up-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const signedUpScreen = document.getElementById("signed-up-screen");
  if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) return false;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return false;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      firebase.database().ref("users/" + userCredential.user.uid).set({ name, email });
      if (signedUpScreen) signedUpScreen.style.display = "flex";
      setTimeout(()=> window.location.href="../pages/log_in.html", 2000);
    })
    .catch(error => alert(error.message));

  return false;
}

// ---- LOGIN ----
/**
 * Handles login form submission, authenticates user, and redirects.
 * @param {Event} event
 * @returns {boolean}
 */
function login(event) {
  event.preventDefault();
  const emailInput = document.getElementById("log-in-email-input");
  const passwordInput = document.getElementById("log-in-password");
  if (!emailInput || !passwordInput) return false;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = "../pages/summary.html")
    .catch(error => alert(error.message));

  return false;
}

// ---- LOGOUT ----
/**
 * Logs out the current user and redirects to login page.
 */
function logout() {
  auth.signOut().then(()=> window.location.href="../pages/log_in.html");
}

// ---- Bind Form Events robustly ----
document.addEventListener("DOMContentLoaded", ()=>{
  const loginForm = document.getElementById("log-in-form");
  if (loginForm) loginForm.addEventListener("submit", login);

  const signUpForm = document.getElementById("sign-up-form");
  if (signUpForm) signUpForm.addEventListener("submit", signedUp);
});