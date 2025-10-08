// ------------------ MOBILE MENU ------------------ //

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const mobileAvatar = document.getElementById("mobile-user-avatar");
let menuOpen = false;

/**
 * Opens the mobile burger menu by sliding it into view.
 * Also attaches a document-wide click listener to detect outside clicks.
 */
function openMenu() {
  if (!mobileNav) return;
  mobileNav.style.transform = "translateX(0)";
  mobileNav.style.marginRight = "16px";
  menuOpen = true;
  document.addEventListener("click", handleClickOutside);
}

/**
 * Closes the mobile burger menu by sliding it out of view.
 * Removes the previously attached outside click listener.
 */
function closeMenu() {
  if (!mobileNav) return;
  mobileNav.style.transform = "translateX(100%)";
  mobileNav.style.marginRight = "0";
  menuOpen = false;
  document.removeEventListener("click", handleClickOutside);
}

/**
 * Toggles the mobile burger menu between open and closed states.
 * Prevents the default link or button behavior and stops event bubbling.
 * @param {MouseEvent} event - The click event that triggered the toggle.
 */
function toggleMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  menuOpen ? closeMenu() : openMenu();
}

/**
 * Handles clicks outside of the mobile navigation and trigger elements.
 * Closes the menu when the user clicks outside of it.
 * @param {MouseEvent} event - The document click event.
 */
function handleClickOutside(event) {
  if (
    mobileNav &&
    !mobileNav.contains(event.target) &&
    event.target !== menuToggle &&
    event.target !== mobileAvatar
  ) {
    closeMenu();
  }
}

/**
 * Attaches event listeners for mobile menu toggling.
 */
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
 * Opens the desktop burger menu and adds a global click listener.
 * Makes the menu visible by adding the 'd_flex' class.
 */
function openBurger() {
  if (!burger) return;
  burger.classList.add('d_flex');
  burgerOpen = true;
  document.addEventListener("click", outsideClickListener);
}

/**
 * Closes the desktop burger menu and removes the global click listener.
 * Hides the menu by removing the 'd_flex' class.
 */
function closeBurger() {
  if (!burger) return;
  burger.classList.remove('d_flex');
  burgerOpen = false;
  document.removeEventListener("click", outsideClickListener);
}

/**
 * Toggles the desktop burger menu between open and closed states.
 * Prevents default click behavior and event propagation.
 * @param {MouseEvent} event - The click event that triggered the toggle.
 */
function toggleBurgerMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  burgerOpen ? closeBurger() : openBurger();
}

/**
 * Detects clicks outside of the burger menu and its trigger avatar.
 * Closes the menu when a click occurs elsewhere on the page.
 * @param {MouseEvent} event - The document click event.
 */
function outsideClickListener(event) {
  if (
    burger &&
    avatarTrigger &&
    !burger.contains(event.target) &&
    !avatarTrigger.contains(event.target)
  ) {
    closeBurger();
  }
}

/**
 * Attaches the click listener to the desktop avatar trigger.
 */
if (avatarTrigger) {
  avatarTrigger.addEventListener('click', toggleBurgerMenu);
}

// -------------------- TABLET BURGER MENU ------------------ //

const tabletTrigger = document.getElementById('tabletTrigger');
const tabletMenu = document.getElementById('tabletNavBar');
let tabletMenuOpen = false;

/**
 * Opens the tablet navigation menu and attaches an outside click listener.
 * Adds the 'd_flex' class to make the menu visible.
 */
function openTabletMenu() {
  if (!tabletMenu) return;
  tabletMenu.classList.add('d_flex');
  tabletMenuOpen = true;
  document.addEventListener("click", outsideTabletClickListener);
}

/**
 * Closes the tablet navigation menu and removes the outside click listener.
 * Removes the 'd_flex' class to hide the menu.
 */
function closeTabletMenu() {
  if (!tabletMenu) return;
  tabletMenu.classList.remove('d_flex');
  tabletMenuOpen = false;
  document.removeEventListener("click", outsideTabletClickListener);
}

/**
 * Toggles the tablet navigation menu between open and closed states.
 * Prevents default click behavior and stops event propagation.
 * @param {MouseEvent} event - The click event triggering the toggle.
 */
function toggleTabletMenu(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  tabletMenuOpen ? closeTabletMenu() : openTabletMenu();
}

/**
 * Detects clicks outside of the tablet menu and its trigger button.
 * Closes the menu if the user clicks anywhere else on the document.
 * @param {MouseEvent} event - The click event on the document.
 */
function outsideTabletClickListener(event) {
  if (
    tabletMenu &&
    tabletTrigger &&
    !tabletMenu.contains(event.target) &&
    !tabletTrigger.contains(event.target)
  ) {
    closeTabletMenu();
  }
}

/**
 * Attaches the main click listener to the tablet trigger button
 * if the element exists in the DOM.
 */
if (tabletTrigger) {
  tabletTrigger.addEventListener('click', toggleTabletMenu);
}