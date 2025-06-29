document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    const reportsTitleElement = document.querySelector('.reports-title h1');
    const reportNumberDisplay = document.getElementById('reportNumberDisplay');
    const backButton = document.getElementById('backButton'); // כפתור חזור
    const backToHomeButton = document.getElementById('backToHomeButton'); // כפתור "חזרה לעמוד הבית"

    // שדות תצוגה
    const displayFaultType = document.getElementById('displayFaultType');
    const displayLocation = document.getElementById('displayLocation');
    const displayDate = document.getElementById('displayDate');
    const displayTime = document.getElementById('displayTime');
    const displayDescription = document.getElementById('displayDescription');
    const mediaContainer = document.getElementById('mediaContainer');
    const displayStatus = document.getElementById('displayStatus');
    const displayMunicipalityResponse = document.getElementById('displayMunicipalityResponse');

    // --- פונקציות עזר ---
    async function fetchReportDetails(id) {
        try {
            const BASE_URL = 'https://webfinalproject-j4tc.onrender.com';
            const response = await fetch(`${BASE_URL}/api/reports/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('דיווח לא נמצא.');
                }
                throw new Error(`שגיאה בשליפת דיווח: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching report:', error);
            alert('אירעה שגיאה בטעינת פרטי הדיווח.');
            return null;
        }
    }

    function populateReportData(report) {
        displayFaultType.textContent = report.faultType || 'לא ידוע';
        
        let locationText = '';
        if (report.location) {
            if (report.location.city) {
                locationText += report.location.city;
            }
            if (report.location.street) {
                locationText += `, ${report.location.street}`;
            }
            if (report.location.houseNumber) {
                locationText += ` ${report.location.houseNumber}`;
            }
        }
        displayLocation.textContent = locationText || 'לא הוזן מיקום';

        if (report.timestamp) {
            const date = new Date(report.timestamp);
            displayDate.textContent = date.toLocaleDateString('he-IL');
            displayTime.textContent = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        } else {
            displayDate.textContent = 'לא ידוע';
            displayTime.textContent = 'לא ידוע';
        }
        
        displayDescription.textContent = report.faultDescription || 'אין תיאור.';

        // הצגת מדיה
        mediaContainer.innerHTML = ''; // נקה תוכן קודם
        if (report.media) {
            const mediaUrl = `/uploads/${report.media}`;
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
            // mediaContainer.textContent = 'אין תמונה/סרטון מצורף.';
        }

        // מילוי שדות סטטוס ותגובה
        displayStatus.textContent = report.status || 'לא ידוע';
        displayMunicipalityResponse.textContent = report.municipalityResponse || 'טרם התקבלה תגובה מהרשות המקומית.';
    }

    // --- טעינת הדיווח ---
    if (!reportId) {
        reportsTitleElement.textContent = 'שגיאה: ID דיווח חסר';
        console.error('Report ID is missing from the URL.');
        // אולי להפנות לדף שגיאה או לדף הדיווחים הראשי
        return;
    }

    const currentReport = await fetchReportDetails(reportId);
    if (currentReport) {
        reportNumberDisplay.textContent = reportId.substring(reportId.length - 4); // מציג את 4 התווים האחרונים של ה-ID
        populateReportData(currentReport);
    } else {
        // הדיווח לא נמצא או הייתה שגיאה
        reportsTitleElement.textContent = 'שגיאה בטעינת דיווח';
        document.querySelector('main').innerHTML = `<p style="color: red; text-align: center;">הדיווח לא נמצא או אירעה שגיאה בטעינה.</p>`;
        // הסתר כפתורים
        if(backToHomeButton) backToHomeButton.style.display = 'none';
    }

    // --- Event Listeners ---
    if (backButton) {
        backButton.addEventListener('click', e => {
            e.preventDefault();
            window.history.back(); // חזרה לדף הקודם
        });
    }

    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', () => {
            // כפי שביקשת, חזרה ל-homePageEmployee
            window.location.href = '../html/homePageEmployee.html'; 
        });
    }
});