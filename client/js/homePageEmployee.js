document.addEventListener('DOMContentLoaded', () => {
    const reportsViewButton = document.getElementById('reportsViewButton');
    if (reportsViewButton) {
        reportsViewButton.addEventListener('click', () => {
            window.location.href = '../html/reportsViewPage.html'; 
        });
    } else {
        console.warn("Element with ID 'reportsViewButton' not found. Cannot attach click listener.");
    }
});
