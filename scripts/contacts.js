// add contact overlay

function openAddContact() {
    document.getElementById('add_contact_overlay').style.left = "5%";
    document.getElementById('add_contact_overlay').style.top = "20%";
    document.getElementById('bg_overlay').style.display = "flex";
}

function closeAddContact() {
    document.getElementById('add_contact_overlay').style.left = "105%";
    document.getElementById('bg_overlay').style.display = "none";
}

function openAddContactMobile() {
    document.getElementById('add_contact_btn').style.display = "none";
    document.getElementById('add_contact_overlay').style.top = "6.5%";
    document.getElementById('bg_overlay').style.display = "flex";
}

async function closeAddContactMobile() {
    document.getElementById('add_contact_overlay').style.top = "106.5%";
    document.getElementById('bg_overlay').style.display = "none";
    await new Promise(resolve => setTimeout(resolve, 300));
    document.getElementById('add_contact_btn').style.display = "flex";
}

document.getElementById('add_contact_overlay').addEventListener('click', function (event) {
    event.stopPropagation();
});

document.getElementById('bg_overlay').addEventListener('click', function () {
    closeAddContact();
});

// edit contact overlay

function openEditContact() {
    document.getElementById('edit_contact_overlay').style.left = "5%";
    document.getElementById('edit_contact_overlay').style.top = "20%";
    document.getElementById('bg_overlay').style.display = "flex";
}

function closeEditContact() {
    document.getElementById('edit_contact_overlay').style.left = "105%";
    document.getElementById('bg_overlay').style.display = "none";
}

document.getElementById('bg_overlay').addEventListener('click', function () {
    closeEditContact();
});

document.getElementById('edit_contact_overlay').addEventListener('click', function (event) {
    event.stopPropagation();
});