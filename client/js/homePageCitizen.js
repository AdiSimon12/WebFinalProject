// client/js/homePageCitizen.js (דוגמה לשם קובץ חדש)

document.addEventListener('DOMContentLoaded', () => {
    const newReportButton = document.getElementById('newReportButton');

    if (newReportButton) {
        newReportButton.addEventListener('click', () => {
            window.location.href = '../html/newReportPage.html'; 
        });
    } else {
        console.warn("Element with ID 'newReportButton' not found. Cannot attach click listener.");
    }

    const myReportsButto = document.getElementById('myReportsButto');
    if (myReportsButton) {
        myReportsButton.addEventListener('click', (event) => {
            event.preventDefault(); // מונע את התנהגות ברירת המחדל של קישור (מעבר מיידי לדף הריק ב-href="#")
            window.location.href = '/html/myReportsPage.html'; 
        });
    } else {
        console.warn("Element with ID 'myReportsButton' not found. Cannot attach click listener for my reports.");
    }
});