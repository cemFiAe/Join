// bg overlay close
let currentOpenOverlay = null;

document.getElementById('bg_overlay').addEventListener('click', function () {
    switch (currentOpenOverlay) {
        case 'add-desktop':
            closeAddContact();
            break;
        case 'add-mobile':
            closeAddContactMobile();
            break;
        case 'edit-desktop':
            closeEditContact();
            break;
        case 'edit-mobile':
            closeEditMobileContact();
            break;
    }

    currentOpenOverlay = null;
});

/**
 * this function is used to open the add contact overlay
 */
function openAddContact() {
    currentOpenOverlay = 'add-desktop';
    document.getElementById('add_contact_overlay').style.transform = "translate(-50%, -50%) translateX(0)";
    document.getElementById('bg_overlay').style.display = "flex";
}

/**
 * this function is used to close the add contact overlay
 */
function closeAddContact() {
    document.getElementById('add_contact_overlay').style.transform = "translate(-50%, -50%) translateX(200%)";
    document.getElementById('bg_overlay').style.display = "none";
}

/**
 * this function is used to open the add contact mobile overlay
 */
function openAddContactMobile() {
    currentOpenOverlay = 'add-mobile';
    document.getElementById('add_contact_btn').style.display = "none";
    document.getElementById('burger_contact_btn').style.display = "none";
    document.getElementById('add_contact_overlay').style.setProperty("transform", "translate(-50%, -50%) translateX(0) translateY(0)", "important");
    document.getElementById('bg_overlay').style.display = "flex";
}

/**
 * this function is used to close the add contact mobile overlay
 */
function closeAddContactMobile() {
    document.getElementById('add_contact_overlay').style.transform = "translate(-50%, -50%) translateY(200%)", "!important"
    document.getElementById('bg_overlay').style.display = "none";
    document.getElementById('add_contact_btn').style.display = "flex";
    document.getElementById('burger_contact_btn').style.display = "flex";
}

document.getElementById('add_contact_overlay').addEventListener('click', function (event) {
    event.stopPropagation();
});

/**
 * this function is used to close the edit contact overlay
 */
function closeEditContact() {
    document.getElementById('edit_contact_overlay').style.transform = "translate(-50%, -50%) translateX(200%)";
    document.getElementById('bg_overlay').style.display = "none";
    document.getElementById('burger_contact_btn').style.zIndex = "99";
}

/**
 * this function is used to close the edit contact mobile overlay
 */
function closeEditMobileContact() {
    document.getElementById('edit_contact_overlay').style.transform = "translate(-50%, -50%) translateY(200%)", "!important"
    document.getElementById('bg_overlay').style.display = "none";
    document.getElementById('burger_contact_btn').style.display = "flex";
    document.getElementById('burger_contact_btn').style.zIndex = "99";
}

document.getElementById('edit_contact_overlay').addEventListener('click', function (event) {
    event.stopPropagation();
});

/**
 * this function is used to open contact details, showing them next to the contact column.
 * this is intended for display sizes of 650px and higher.
 */
function openContactOverview() {
    document.getElementById('contacts').style.display = "none";

    if (window.innerHeight >= 650) {
        document.getElementById('contact-overview').style.display = "flex";
    } else {
        document.getElementById('contact-overview').style.display = "none";
    }

    document.getElementById('contact_information').style.left = "16px";
    document.getElementById('co-devider-mobile').style.display = "flex";
    document.getElementById('add_contact_btn').style.display = "none";
    document.getElementById('burger_contact_btn').style.display = "flex";
    document.getElementById('back_contact_btn').style.display = "flex";
}

/**
 * this function is used to open a small burgermenu 
 */
function openContactOptions() {
    document.getElementById('contact-options').style.left = 'calc(100% - 132px)';
    setTimeout(() => {
        document.addEventListener("click", outsideClickListener);
    }, 0); 
}

/**
 * this function is used to close a small burgermenu
 */
function closeContactOptions() {
    document.getElementById('contact-options').style.left = '120%';
    document.removeEventListener("click", outsideClickListener);
}

function outsideClickListener(event) {
    const contact = document.getElementById('contact-options');
    if (!contact.contains(event.target)) {
        closeContactOptions();
    }
}

/**
 * this function is used to close the contact detail screen and return to the contact column 
 */
function goBack() {
    resetContactOverview();
    document.querySelectorAll('.contact_entry.highlight-contact')
        .forEach(el => el.classList.remove('highlight-contact'));
    document.getElementById('contact_information').innerHTML = '';
    currentDisplayedContactId = null;
}

/**
 * this function is used to switch the content that is being shown on the contact page.
 * the function hides the contact details and rerenders the contact list.
 */
function resetContactOverview() {
    document.getElementById('contacts').style.display = "flex";
    document.getElementById('contact-overview').style.display = "none";
    document.getElementById('contact_information').style.left = "750px";
    document.getElementById('add_contact_btn').style.display = "flex";
    document.getElementById('burger_contact_btn').style.display = "none";
    document.getElementById('back_contact_btn').style.display = "none";
}