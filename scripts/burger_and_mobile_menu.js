// ------------------ MOBILE MENU ------------------ //
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const mobileAvatar = document.getElementById("mobile-user-avatar"); // <-- Avatar im Mobile-Header
let menuOpen = false;

function openMenu() {
  mobileNav.style.left = "74%";
  menuOpen = true;
  document.addEventListener("click", handleClickOutside);
}

function closeMenu() {
  mobileNav.style.left = "100%";
  menuOpen = false;
  document.removeEventListener("click", handleClickOutside);
}

function toggleMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  menuOpen ? closeMenu() : openMenu();
}

function handleClickOutside(event) {
  // Schließt Menü, wenn außerhalb von mobileNav, mobileAvatar und menuToggle geklickt wird
  if (
    !mobileNav.contains(event.target) &&
    event.target !== menuToggle &&
    event.target !== mobileAvatar
  ) {
    closeMenu();
  }
}

if (menuToggle) {
  menuToggle.addEventListener("click", toggleMenu);
}
if (mobileAvatar) {
  mobileAvatar.addEventListener("click", toggleMenu);
}

// ------------------ DESKTOP BURGER MENU (Avatar-Trigger) ------------------ //
const avatarTrigger = document.getElementById('board-user-avatar');
const burger = document.getElementById('burger');
let burgerOpen = false;

function openBurger() {
  burger.classList.add('d_flex');
  burgerOpen = true;
  document.addEventListener("click", outsideClickListener);
}

function closeBurger() {
  burger.classList.remove('d_flex');
  burgerOpen = false;
  document.removeEventListener("click", outsideClickListener);
}

function toggleBurgerMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  burgerOpen ? closeBurger() : openBurger();
}

function outsideClickListener(event) {
  // Schließt das Menü, wenn außerhalb des Menüs und außerhalb des Avatars geklickt wird
  if (!burger.contains(event.target) && !avatarTrigger.contains(event.target)) {
    closeBurger();
  }
}

if (avatarTrigger) {
  avatarTrigger.addEventListener('click', toggleBurgerMenu);
}
