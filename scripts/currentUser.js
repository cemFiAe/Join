/**
 * Retrieves the current user object from localStorage.
 * @returns {Object} The parsed current user object, or an empty object if not found.
 */
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser')) || {};
}

/**
 * Determines if the current user is a guest.
 * @returns {boolean} True if the user is a guest, false otherwise.
 */
function isGuestUser() {
    const user = getCurrentUser();
    return !!user.isGuest;
}

/**
 * Returns the initials of the current user's name.
 * Takes up to the first two letters of the first and last name parts.
 * Defaults to "U" if no name is available.
 * @returns {string} The uppercase initials of the user.
 */
function getUserInitials() {
    const user = getCurrentUser();
    if (!user.name) return "U";
    return user.name
        .split(" ")
        .filter(Boolean)
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

/**
 * Sets the board and mobile user avatar elements with initials, title, and guest styling.
 * Updates the "board-user-avatar" and "mobile-user-avatar" elements if present.
 */
function setUserAvatars() {
    const avatar = document.getElementById("board-user-avatar");
    if (avatar) {
        avatar.textContent = getUserInitials();
        avatar.title = isGuestUser() ? "Guest User" : (getCurrentUser().name || "User");
        avatar.classList.toggle("guest-avatar", isGuestUser());
    }
    const mobileAvatar = document.getElementById("mobile-user-avatar");
    if (mobileAvatar) {
        mobileAvatar.textContent = getUserInitials();
        mobileAvatar.title = isGuestUser() ? "Guest User" : (getCurrentUser().name || "User");
        mobileAvatar.classList.toggle("guest-avatar", isGuestUser());
    }
}

/**
 * Updates the greeting element with the current user's name.
 * Highlights the last name in a different color if the name has multiple parts.
 * Uses "summary-username" element.
 */
function setGreetingName() {
    const greeting = document.getElementById("summary-username");
    if (greeting) {
        let name = getCurrentUser().name || "Guest";
        let html = "";
        let nameParts = name.split(" ");
        if (nameParts.length > 1) {
            html = nameParts[0] + ' <span style="color:#29ABE2;font-weight:800;">' + nameParts.slice(1).join(" ") + '</span>';
        } else {
            html = '<span style="color:#29ABE2;font-weight:800;">' + name + '</span>';
        }
        greeting.innerHTML = html;
    }
}

/**
 * Initializes the user avatars and greeting name when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', function () {
    setUserAvatars();
    setGreetingName();
});