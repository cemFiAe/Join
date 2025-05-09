const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
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
  if (!mobileNav.contains(event.target) && event.target !== menuToggle) {
    closeMenu();
  }
}

menuToggle.addEventListener("click", toggleMenu);