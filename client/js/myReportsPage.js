document.addEventListener('DOMContentLoaded', () => {
    // מזהה את כפתור החץ חזרה לפי ה-ID שלו
    const backButton = document.getElementById('backButton'); 

    // מוודא שהכפתור קיים בדף
    if (backButton) {
        // מוסיף Event Listener ללחיצה על הכפתור
        backButton.addEventListener('click', (event) => {
            event.preventDefault(); // מונע את התנהגות ברירת המחדל של קישור (אם ה-href הוא # או ריק)
            
            // מנתב לדף הבית של האזרח
            // הנתיב המומלץ הוא נתיב מוחלט מהשורש של השרת
            // בהנחה שדף הבית של האזרח הוא 'homePageCitizen.html' ונמצא בתיקיית '/html'
            window.location.href = '/html/homePageCitizen.html'; 
        });
    } else {
        console.warn("Element with ID 'backButton' not found on newReportPage.html. Cannot attach click listener.");
    }

});