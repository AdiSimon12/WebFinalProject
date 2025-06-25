document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'https://webfinalproject-j4tc.onrender.com/api';
    // --- אלמנטים מה-HTML שיש לעדכן ---
    const backButton = document.querySelector('.reports-title .back-arrow').closest('a'); // כפתור חזור
    const homeButton = document.querySelector('.thank-you-footer button'); // כפתור חזרה לעמוד הבית

    const displayFaultType = document.getElementById('displayFaultType');
    const displayLocation = document.getElementById('displayLocation');
    const displayDate = document.getElementById('displayDate');
    const displayTime = document.getElementById('displayTime');
    const displayDescription = document.getElementById('displayDescription');
    const mediaContainer = document.getElementById('displayMedia'); 
    const displayStatus = document.getElementById('displayStatus'); 
    const displayResponse = document.getElementById('displayMunicipalityResponse'); 

    // --- פונקציות עזר ---

    // פונקציה לקבלת פרמטר מה-URL
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // פונקציה לאחזור דיווח ספציפי מהשרת
    async function fetchReportDetails(reportId) {
        try {
            const url = `${API_BASE_URL}/reports/${reportId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'כשל באחזור פרטי הדיווח.');
            }

            const report = await res.json();
            console.log('פרטי דיווח נטענו בהצלחה:', report);
            return report;

        } catch (error) {
            console.error('שגיאה באחזור פרטי דיווח:', error);
            alert('אירעה שגיאה באחזור פרטי הדיווח. אנא נסה שוב מאוחר יותר.');
            return null; // החזר null במקרה של שגיאה
        }
    }

    // פונקציה להצגת פרטי הדיווח בדף
    function displayReportDetails(report) {
        if (!report) {
            console.warn('לא נמצאו פרטים עבור דיווח זה.');
            // ניתן להציג הודעה למשתמש
            return;
        }

        // עדכון פרטי הטקסט
        displayFaultType.textContent = report.faultType || 'לא זמין';
        displayDescription.textContent = report.description || 'אין תיאור';

        // מיקום
        if (report.location) {
            if (report.location.city && report.location.street) {
                displayLocation.textContent = `${report.location.street}, ${report.location.city}`;
            } else if (report.location.type === 'current') {
                displayLocation.textContent = 'מיקום נוכחי';
            } else {
                displayLocation.textContent = 'מיקום לא ידוע';
            }
        } else {
            displayLocation.textContent = 'מיקום לא ידוע';
        }

        // תאריך ושעה
        const timestamp = report.timestamp ? new Date(report.timestamp) : null;
        displayDate.textContent = timestamp ? timestamp.toLocaleDateString('he-IL') : 'לא ידוע';
        displayTime.textContent = timestamp ? timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : 'לא ידוע';

        // סטטוס
        let statusText = '';
        let statusClass = ''; // אופציונלי: קלאס לצבע סטטוס אם תרצה להוסיף CSS
        switch (report.status) {
            case 'in-progress':
                statusText = 'בטיפול';
                statusClass = 'status-in-progress';
                break;
            case 'completed':
                statusText = 'טופל';
                statusClass = 'status-completed';
                break;
            case 'rejected':
                statusText = 'נדחה';
                statusClass = 'status-rejected';
                break;
            default:
                statusText = report.status || 'לא ידוע';
                statusClass = 'status-in-progress';  /////////////////////////?
                break;
        }
        displayStatus.textContent = statusText;
        displayStatus.classList.add(statusClass); // הוסף קלאס לצורך עיצוב ב-CSS

        // תגובת הרשות המקומית
        displayResponse.textContent = report.municipalityResponse || 'טרם התקבלה תגובה';

        // הצגת מדיה (תמונה/וידאו)
        if (report.media) {
            const mediaUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${report.media}`; // נתיב לקובץ המדיה
            const fileExtension = report.media.split('.').pop().toLowerCase();

            let mediaElement;
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                mediaElement = document.createElement('img');
                mediaElement.src = mediaUrl;
                mediaElement.alt = 'תמונת דיווח';
                mediaElement.classList.add('detail-media'); // קלאס חדש לעיצוב המדיה
            } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                mediaElement = document.createElement('video');
                mediaElement.src = mediaUrl;
                mediaElement.controls = true; // הצג כפתורי שליטה
                mediaElement.classList.add('detail-media'); // קלאס חדש לעיצוב המדיה
            }

            if (mediaElement) {
                mediaContainer.innerHTML = ''; // נקה תוכן קיים
                mediaContainer.appendChild(mediaElement);
            }
        } else {
            mediaContainer.textContent = 'אין מדיה מצורפת';
        }
    }

    // --- אירועים וטעינה ראשונית ---

    // קבלת ה-reportId מה-URL
    const reportId = getUrlParameter('id');
    if (reportId) {
        const reportDetails = await fetchReportDetails(reportId);
        displayReportDetails(reportDetails);
    } else {
        console.error('Report ID לא נמצא ב-URL.');
        alert('שגיאה: מזהה דיווח חסר. אנא חזור לדף הדיווחים.');
    }

    // אירוע לחיצה על כפתור חזור (חץ אחורה)
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.history.back(); // חזרה לדף הקודם
        });
    }

    // אירוע לחיצה על כפתור חזרה לעמוד הבית
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.location.href = '/html/homePageCitizen.html'; 
        });
    }

    console.log('reportingDetailsPage.js נטען במלואו.');
});