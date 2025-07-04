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
    // "Guest" → G, "Max Mustermann" → MM
    return user.name
        .split(" ")
        .filter(Boolean)
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function setBoardAvatar() {
    const avatarDiv = document.getElementById('board-user-avatar');
    if (!avatarDiv) return;
    avatarDiv.textContent = getUserInitials();

    if (isGuestUser()) {
        avatarDiv.title = "Guest User";
        avatarDiv.classList.add("guest-avatar");
    } else {
        const user = getCurrentUser();
        avatarDiv.title = user.name || "User";
        avatarDiv.classList.remove("guest-avatar");
    }
}

// Kann auf allen Seiten direkt nach DOMContentLoaded ausgeführt werden
document.addEventListener("DOMContentLoaded", setBoardAvatar);
