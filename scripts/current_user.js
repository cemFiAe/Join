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

    // Avatar-Funktion für Desktop & Mobile
    function setUserAvatars() {
      function getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser')) || {};
      }
      function getUserInitials() {
        const user = getCurrentUser();
        if (!user.name) return "U";
        return user.name.split(" ").map(n => n[0]).join("").toUpperCase();
      }
      function isGuestUser() {
        const user = getCurrentUser();
        return !!user.isGuest;
      }
      // Desktop
      const avatar = document.getElementById("board-user-avatar");
      if (avatar) {
        avatar.textContent = getUserInitials();
        avatar.title = isGuestUser() ? "Guest User" : (getCurrentUser().name || "User");
        avatar.classList.toggle("guest-avatar", isGuestUser());
      }
      // Mobile
      const mobileAvatar = document.getElementById("mobile-user-avatar");
      if (mobileAvatar) {
        mobileAvatar.textContent = getUserInitials();
        mobileAvatar.title = isGuestUser() ? "Guest User" : (getCurrentUser().name || "User");
        mobileAvatar.classList.toggle("guest-avatar", isGuestUser());
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      // Username für Begrüßung
      let name = localStorage.getItem("currentUserName") || "Guest";
      let html = "";
      let nameParts = name.split(" ");
      if (nameParts.length > 1) {
        html = nameParts[0] + ' <span style="color:#29ABE2;font-weight:800;">' + nameParts.slice(1).join(" ") + '</span>';
      } else {
        html = '<span style="color:#29ABE2;font-weight:800;">' + name + '</span>';
      }
      document.getElementById("summary-username").innerHTML = html;

      setUserAvatars();
    });

// Kann auf allen Seiten direkt nach DOMContentLoaded ausgeführt werden
document.addEventListener("DOMContentLoaded", setBoardAvatar);
