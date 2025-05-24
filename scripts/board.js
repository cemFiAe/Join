function openAddTaskOverlay() {
    document.getElementById('add_task_overlay').style.left = '5%';
    document.getElementById('bg_overlay').style.display = "flex";
}

function closeAddTaskOverlay() {
    document.getElementById('add_task_overlay').style.left = '105%';
    document.getElementById('bg_overlay').style.display = 'none';
}

function openAddTaskMobile() {
    window.location.href = "./add_task.html";
}

document.getElementById('bg_overlay').addEventListener('click', function () {
    closeAddTaskOverlay();
});

document.getElementById('add_task_overlay').addEventListener('click', function (event) {
    event.stopPropagation();
});