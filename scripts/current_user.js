// current_user.js

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser')) || {};
}

function isGuestUser() {
    const user = getCurrentUser();
    return !!user.isGuest;
}

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

// Setzt Avatar für Desktop und Mobile
function setUserAvatars() {
    // Desktop-Avatar
    const avatar = document.getElementById("board-user-avatar");
    if (avatar) {
        avatar.textContent = getUserInitials();
        avatar.title = isGuestUser() ? "Guest User" : (getCurrentUser().name || "User");
        avatar.classList.toggle("guest-avatar", isGuestUser());
    }
    // Mobile-Avatar
    const mobileAvatar = document.getElementById("mobile-user-avatar");
    if (mobileAvatar) {
        mobileAvatar.textContent = getUserInitials();
        mobileAvatar.title = isGuestUser() ? "Guest User" : (getCurrentUser().name || "User");
        mobileAvatar.classList.toggle("guest-avatar", isGuestUser());
    }
}

// Begrüßung färben (falls vorhanden)
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

// Nur ein Mal aufrufen, wenn DOM geladen ist:
document.addEventListener('DOMContentLoaded', function () {
    setUserAvatars();
    setGreetingName();
});
