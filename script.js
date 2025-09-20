// ------------------ MOBILE MENU ------------------ //

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const mobileAvatar = document.getElementById("mobile-user-avatar");
let menuOpen = false;

/**
 * this function is used to open the mobile burger menu
 */
function openMenu() {
  mobileNav.style.transform = "translateX(0)";
  mobileNav.style.marginRight = "16px";
  menuOpen = true;
  document.addEventListener("click", handleClickOutside);
}

/**
 * this function is used to close the mobile burger menu
 */
function closeMenu() {
  mobileNav.style.transform = "translateX(100%)";
  mobileNav.style.marginRight = "0";
  menuOpen = false;
  document.removeEventListener("click", handleClickOutside);
}

function toggleMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  menuOpen ? closeMenu() : openMenu();
}

function handleClickOutside(event) {
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

/**
 * this function is used to open the burger menu
 */
function openBurger() {
  burger.classList.add('d_flex');
  burgerOpen = true;
  document.addEventListener("click", outsideClickListener);
}

/**
 * this function is used to close the burger menu
 */
function closeBurger() {
  burger.classList.remove('d_flex');
  burgerOpen = false;
  document.removeEventListener("click", outsideClickListener);
}

/**
 * this function is used to toggle the burger menu
 */
function toggleBurgerMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  burgerOpen ? closeBurger() : openBurger();
}

function outsideClickListener(event) {
  if (!burger.contains(event.target) && !avatarTrigger.contains(event.target)) {
    closeBurger();
  }
}

if (avatarTrigger) {
  avatarTrigger.addEventListener('click', toggleBurgerMenu);
}

// -------------------- TABLET BURGER MENU ------------------ //

document.addEventListener("DOMContentLoaded", () => {
  const tabletTrigger = document.getElementById('tabletTrigger');
  const tabletMenu = document.getElementById('tabletNavBar');
  let tabletMenuOpen = false;

  function openTabletMenu() {
    tabletMenu.classList.add('d_flex');
    tabletMenuOpen = true;
    document.addEventListener("click", outsideTabletClickListener);
  }

  function closeTabletMenu() {
    tabletMenu.classList.remove('d_flex');
    tabletMenuOpen = false;
    document.removeEventListener("click", outsideTabletClickListener);
  }

  function toggleTabletMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    tabletMenuOpen ? closeTabletMenu() : openTabletMenu();
  }

  function outsideTabletClickListener(event) {
    if (!tabletMenu.contains(event.target) && !tabletTrigger.contains(event.target)) {
      closeTabletMenu();
    }
  }

  if (tabletTrigger) {
    tabletTrigger.addEventListener('click', toggleTabletMenu);
  }
});