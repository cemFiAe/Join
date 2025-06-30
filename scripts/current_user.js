function setBoardAvatar() {
    const avatarDiv = document.getElementById('board-user-avatar');
    const name = localStorage.getItem('userName') || 'User';
    let initials = name
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .slice(0,2)
        .toUpperCase();

    avatarDiv.textContent = initials;
}

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
    return user.name.split(" ").map(n => n[0]).join("").toUpperCase();
}


setBoardAvatar();
