// function signedUp() {
//     document.getElementById('signed-up').classList.add('signed-up-screen')
//     setTimeout(() => {
//         document.getElementById('signed-up').classList.remove('signed-up-screen')
//     }, 1000);
// }

function signedUp() {
    document.getElementById('signed-up').style.display = "block"
    setTimeout(() => {
        document.getElementById('signed-up').style.display = "none"
    }, 5000);
}