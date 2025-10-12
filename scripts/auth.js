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
 * @param {Event} event - The submit event from the sign-up form.
 * @returns {boolean} Always returns false to prevent form reload.
 */
function signedUp(event) {
  event.preventDefault();
  const els = {
    name: document.getElementById("name-input"),
    email: document.getElementById("sign-up-email-input"),
    pass: document.getElementById("sign-up-password"),
    confirm: document.getElementById("confirm-password"),
    screen: document.getElementById("signed-up-screen")
  };
  if (!els.name || !els.email || !els.pass || !els.confirm) return false;

  const name = els.name.value.trim();
  const email = els.email.value.trim();
  const pass = els.pass.value;
  const confirm = els.confirm.value;
  if (pass !== confirm) return alert("Passwords do not match!"), false;

  createUser(email, pass, name, els.screen);
  return false;
}

/**
 * Creates a new Firebase user and handles post-sign-up actions.
 * @param {string} email - The user’s email.
 * @param {string} pass - The user’s password.
 * @param {string} name - The user’s name.
 * @param {HTMLElement|null} screen - The success screen element.
 */
function createUser(email, pass, name, screen) {
  auth.createUserWithEmailAndPassword(email, pass)
    .then(u => {
      firebase.database().ref("users/" + u.user.uid).set({ name, email });
      if (screen) screen.style.display = "flex";
      setTimeout(() => window.location.href = "../pages/log_in.html", 2000);
    })
    .catch(e => alert(e.message));
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