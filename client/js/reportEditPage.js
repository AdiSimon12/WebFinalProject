document.addEventListener('DOMContentLoaded', async () => {
    // 1. קבלת ID הדיווח מה-URL
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    const reportsTitleElement = document.querySelector('.reports-title h1'); // אלמנט הכותרת "דיווח #"
    const backArrow = document.querySelector('.back-arrow'); // כפתור חזור

    if (!reportId) {
        reportsTitleElement.textContent = 'שגיאה: ID דיווח חסר';
        console.error('Report ID is missing from the URL.');
        // אולי להפנות לדף שגיאה או לדף הדיווחים הראשי
        return;
    }

    // עדכון כותרת הדף
    reportsTitleElement.textContent = `דיווח #${reportId.substring(reportId.length - 4)}`; // מציג את 4 התווים האחרונים של ה-ID

    // 2. שליפת פרטי הדיווח מהשרת
    try {
        const response = await fetch(`/api/reports/${reportId}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('דיווח לא נמצא.');
            }
            throw new Error(`שגיאה בשליפת דיווח: ${response.statusText}`);
        }
        const report = await response.json();
        console.log('Report details fetched:', report);

        // 3. מילוי הנתונים בדף
        document.getElementById('displayFaultType').textContent = report.faultType || 'לא ידוע';
        
        // טיפול בשדה המיקום
        if (report.location) {
            let locationText = '';
            if (report.location.city) {
                locationText += report.location.city;
            }
            if (report.location.street) {
                locationText += `, ${report.location.street}`;
            }
            if (report.location.houseNumber) {
                locationText += ` ${report.location.houseNumber}`;
            }
            document.getElementById('displayLocation').textContent = locationText || 'לא הוזן מיקום';
        } else {
            document.getElementById('displayLocation').textContent = 'לא הוזן מיקום';
        }

        // טיפול בתאריך ושעה
        if (report.timestamp) {
            const date = new Date(report.timestamp);
            document.getElementById('displayDate').textContent = date.toLocaleDateString('he-IL');
            document.getElementById('displayTime').textContent = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        } else {
            document.getElementById('displayDate').textContent = 'לא ידוע';
            document.getElementById('displayTime').textContent = 'לא ידוע';
        }
        
        document.getElementById('displayDescription').textContent = report.description || 'אין תיאור.';

        // 4. הצגת מדיה (תמונה/סרטון)
        const mediaContainer = document.getElementById('mediaContainer'); // נצטרך להוסיף div זה ל-HTML
        if (report.media) {
            const mediaUrl = `/uploads/${report.media}`; // נתיב לקובץ בשרת
            if (report.media.match(/\.(jpeg|jpg|gif|png)$/i)) { // אם זו תמונה
                const img = document.createElement('img');
                img.src = mediaUrl;
                img.alt = 'תמונה מצורפת לדיווח';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                mediaContainer.appendChild(img);
            } else if (report.media.match(/\.(mp4|webm|ogg)$/i)) { // אם זה וידאו
                const video = document.createElement('video');
                video.src = mediaUrl;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.height = 'auto';
                mediaContainer.appendChild(video);
            } else {
                mediaContainer.textContent = 'קובץ מדיה לא נתמך.';
            }
        } else {
            // אם אין מדיה, אתה יכול להוסיף הודעה או להשאיר ריק
            // mediaContainer.textContent = 'אין תמונה/סרטון מצורף.';
        }

        // עדכון סטטוס ותגובת רשות
        document.getElementById('displayStatus').textContent = report.status || 'לא ידוע'; // נצטרך להוסיף ID ל-HTML
        document.getElementById('displayMunicipalityResponse').textContent = report.municipalityResponse || 'טרם התקבלה תגובה מהרשות המקומית.'; // נצטרך להוסיף ID ל-HTML


    } catch (error) {
        console.error('Error loading report details:', error);
        reportsTitleElement.textContent = 'שגיאה בטעינת דיווח';
        // הצג הודעת שגיאה למשתמש
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = `<p style="color: red; text-align: center;">${error.message}</p>`;
        }
    }

    // 5. טיפול בכפתור "עריכת דף"
    const editPageButton = document.querySelector('.footer-employee button');
    if (editPageButton) {
        editPageButton.addEventListener('click', () => {
           window.location.href = `/html/reportChangePage.html?id=${reportId}`;
            // כרגע נשתמש ב-alert כדי להדגים
            alert('כפתור עריכת דף נלחץ! (יש ליישם ניווט לדף עריכה)');
        });
    }

    // 6. טיפול בכפתור "חזור"
    if (backArrow) {
        backArrow.addEventListener('click', (event) => {
            event.preventDefault(); // מונע את התנהגות ברירת המחדל של הקישור
            window.history.back(); // חזרה לדף הקודם
        });
    }
});