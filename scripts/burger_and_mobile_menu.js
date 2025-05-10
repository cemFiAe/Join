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



const toggleBurger = document.getElementById('toggleBurger');
const burger = document.getElementById('burger');
let burgerOpen = false;

function openBurger() {
  burger.classList.add('d_flex');
  burgerOpen = true;
  document.addEventListener("click", outsideClickListener);
}

function closeMenu() {
  burger.classList.remove('d_flex');
  burgerOpen = false;
  document.removeEventListener("click", outsideClickListener);
}

function toggleBurgerMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  burgerOpen ? closeMenu() : openBurger();
}

function outsideClickListener(event) {
  if (!burger.contains(event.target) && !toggleBurger.contains(event.target)) {
    closeMenu();
  }
}

toggleBurger.addEventListener('click', toggleBurgerMenu);