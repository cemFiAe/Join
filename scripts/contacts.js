/**
 * this function opens an overlay (Add or Edit) and shows the background overlay.
 * Also attaches a global click listener to close the overlay when
 * clicking outside of it.
 * @param {"add" | "edit"} type - Which overlay should be opened
 */
function openOverlay(type) {
    const overlay = type === 'add'
        ? document.getElementById('add_contact_overlay')
        : document.getElementById('edit_contact_overlay');

    if (!overlay) return;

    const bg = document.getElementById('bg_overlay');
    bg.classList.add('d_flex');
    overlay.classList.add('show');

    setTimeout(() => {
        document.addEventListener("click", outsideOverlayClick);
    }, 0);
}

/**
 * this function closes an overlay (Add or Edit), clears inputs, and hides the background
 * after the CSS transition has finished. Removes the global click listener.
 * @param {"add" | "edit"} type - Which overlay should be closed
 */
function closeOverlay(type) {
    clearAddContactInputs();
    const overlay = type === 'add'
        ? document.getElementById('add_contact_overlay')
        : document.getElementById('edit_contact_overlay');

    if (!overlay) return;

    overlay.classList.remove('show');

    overlay.addEventListener('transitionend', function handler() {
        document.getElementById('bg_overlay').classList.remove('d_flex');
        overlay.removeEventListener('transitionend', handler);
        document.removeEventListener("click", outsideOverlayClick);
    });
}

/**
 * Global click handler that closes the currently open overlay
 * if the user clicks outside of it (on the background area).
 * @param {MouseEvent} event - The click event
 */
function outsideOverlayClick(event) {
    const addOverlay = document.getElementById('add_contact_overlay');
    const editOverlay = document.getElementById('edit_contact_overlay');
    const bg = document.getElementById('bg_overlay');

    const isAddOpen = addOverlay && addOverlay.classList.contains("show");
    const isEditOpen = editOverlay && editOverlay.classList.contains("show");

    if (!(isAddOpen || isEditOpen)) return; 

    if (
        (isAddOpen && addOverlay.contains(event.target)) ||
        (isEditOpen && editOverlay.contains(event.target))
    ) {
        return;
    }

    if (bg.contains(event.target)) {
        if (isAddOpen) closeOverlay("add");
        if (isEditOpen) closeOverlay("edit");
    }
}

/**
 * clears all inputfields and disables submit button
 * this prevents the button still being active from a valid previous entry
 */
function clearAddContactInputs() {
    const inputs = [
        document.getElementById("add-name-input"),
        document.getElementById("add-mail-input"),
        document.getElementById("add-phone-input")
    ];
    inputs.forEach(input => {
        if (input) {
            input.value = "";
            input.classList.remove("input-error");
        }
    });

    const errorIds = ["error-name", "error-mail", "error-phone"];
    errorIds.forEach(id => {
        const errorDiv = document.getElementById(id);
        if (errorDiv) errorDiv.textContent = "";
    });

    const submitBtn = document.querySelector("#add-contact-form button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;
}

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