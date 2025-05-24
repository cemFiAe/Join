function openAddContact() {
    document.getElementById('add_contact_overlay').style.left = "5%";
    document.getElementById('bg_overlay').style.display = "flex";
}

function closeAddContact() {
    document.getElementById('add_contact_overlay').style.left = "105%";
    document.getElementById('bg_overlay').style.display = "none";
}

document.getElementById('bg_overlay').addEventListener('click', function () {
    closeAddContact();
});

document.getElementById('add_contact_overlay').addEventListener('click', function (event) {
    event.stopPropagation();
});