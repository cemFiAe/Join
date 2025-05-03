
function showLoadingScreen() {
    setTimeout(function () {
        document.getElementById('overlay').style.display = "none";
        document.getElementById('main-window').style.display = "block"; 
    }, 500);
}


// function showLoadingScreen() {
//     let overlay = document.getElementById('overlay');
//     let logo = document.querySelector('.mobile-log-in-logo');
//     let mainContent = document.getElementById('main-content');
//     let mobileHeaderLogo = document.getElementById('mobile-header-logo');

//     // Show header logo and main content after delay
//     setTimeout(() => {
//         mobileHeaderLogo.style.display = "block";
//         mainContent.style.display = "block";
//     }, 500);
// }
