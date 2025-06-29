document.addEventListener('DOMContentLoaded', () => {
    const newReportButton = document.getElementById('newReportButton');
    if (newReportButton) {
        newReportButton.addEventListener('click', () => {
            window.location.href = '../html/newReportPage.html'; 
        });
    } else {
        console.warn("Element with ID 'newReportButton' not found. Cannot attach click listener.");
    }
});