document.addEventListener('DOMContentLoaded', () => {
    // קבל את האלמנטים ב-HTML שבהם נציג את פרטי הדיווח
    const displayFaultType = document.getElementById('displayFaultType');
    const displayLocation = document.getElementById('displayLocation');
    const displayDate = document.getElementById('displayDate');
    const displayTime = document.getElementById('displayTime');
    const displayDescription = document.getElementById('displayDescription');
    const displayMedia = document.getElementById('displayMedia');
    const mediaPreview = document.getElementById('mediaPreview');

    // ****** השינוי כאן: הסרת קבלת האלמנטים לסיכום התאריך והשעה בראש העמוד ******
    // const displayDateSummary = document.getElementById('displayDateSummary');
    // const displayTimeSummary = document = document.getElementById('displayTimeSummary');

    // קבל את הכפתורים
    const goToMyReportsBtn = document.getElementById('goToMyReportsBtn');
    const goToHomeBtn = document.getElementById('goToHomeBtn');

    // טען את פרטי הדיווח מ-sessionStorage
    const lastReportDetails = JSON.parse(sessionStorage.getItem('lastReportDetails'));

    if (lastReportDetails) {
        console.log('פרטי דיווח אחרונים שנמצאו:', lastReportDetails);

        // הצגת סוג התקלה
        displayFaultType.textContent = lastReportDetails.faultType || 'לא ידוע';

        // הצגת מיקום
        displayLocation.textContent = lastReportDetails.location || 'לא ידוע';

        // פרסור תאריך ושעה
        if (lastReportDetails.timestamp) {
            const date = new Date(lastReportDetails.timestamp);
            
            // מילוי התאריך והשעה בתוך "פרטי הדיווח" (כפי שביקשת)
            displayDate.textContent = date.toLocaleDateString('he-IL'); // פורמט תאריך ישראלי
            displayTime.textContent = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }); // פורמט שעה ישראלי

            // ****** השינוי כאן: הסרת מילוי האלמנטים לסיכום בראש העמוד ******
            // displayDateSummary.textContent = date.toLocaleDateString('he-IL');
            // displayTimeSummary.textContent = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

        } else {
            displayDate.textContent = 'לא ידוע';
            displayTime.textContent = 'לא ידוע';
            // אם אין timestamp, גם הסיכום היה 'לא ידוע', אבל הסרנו אותו.
            // displayDateSummary.textContent = 'לא ידוע'; 
            // displayTimeSummary.textContent = 'לא ידוע';
        }

        // הצגת תיאור התקלה (אם קיים)
        displayDescription.textContent = lastReportDetails.faultDescription || 'אין תיאור';

        // הצגת קובץ המדיה
        if (lastReportDetails.mediaFileName && lastReportDetails.mediaFileName !== 'אין קובץ') {
            displayMedia.textContent = lastReportDetails.mediaFileName;

            const mediaUrl = `http://localhost:3000/uploads/${lastReportDetails.mediaFileName}`; // נתיב לקובץ מהשרת
            const fileExtension = lastReportDetails.mediaFileName.split('.').pop().toLowerCase();

            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                mediaPreview.src = mediaUrl;
                mediaPreview.style.display = 'block'; // הצג את התמונה
            } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                const videoElement = document.createElement('video');
                videoElement.controls = true;
                videoElement.src = mediaUrl;
                videoElement.classList.add('uploaded-media-preview');
                displayMedia.appendChild(videoElement);
                mediaPreview.style.display = 'none';
            } else {
                mediaPreview.style.display = 'none';
            }
        } else {
            displayMedia.textContent = 'אין קובץ מצורף';
            mediaPreview.style.display = 'none';
        }

    } else {
        // אם אין נתונים ב-sessionStorage (לדוגמה, המשתמש הגיע לדף ישירות)
        console.warn('לא נמצאו פרטי דיווח אחרונים ב-sessionStorage.');
        displayFaultType.textContent = 'אין נתונים';
        displayLocation.textContent = 'אין נתונים';
        displayDate.textContent = 'אין נתונים';
        displayTime.textContent = 'אין נתונים';
        displayDescription.textContent = 'אין נתונים';
        displayMedia.textContent = 'אין נתונים';
        mediaPreview.style.display = 'none';
        // אם אין נתונים, גם הסיכום היה 'אין נתונים', אבל הסרנו אותו.
        // displayDateSummary.textContent = 'אין נתונים'; 
        // displayTimeSummary.textContent = 'אין נתונים';
    }

    // --- טיפול בכפתורים ---
    if (goToMyReportsBtn) {
        goToMyReportsBtn.addEventListener('click', () => {
            window.location.href = '/html/myReportsPage.html';
        });
    }

    if (goToHomeBtn) {
        goToHomeBtn.addEventListener('click', () => {
            window.location.href = '/html/homePageCitizen.html';
        });
    }
});