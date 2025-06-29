// reportEditPage.js (או reportChangePage.js)
// --------------------------------------------------------
// טוען את פרטי הדיווח ומציג אותם בדף העריכה / צפייה לעובד
// --------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // ------------------ קבלת פרמטרים מה‑URL ------------------
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');   // מזהה MongoDB
    // const reportSeq = urlParams.get('seq'); // *** שורה זו הוסרה/הועברה להערה ***

    // אלמנטים בדף
    const reportsTitleElement = document.querySelector('.reports-title h1');
    const reportNumberDisplay = document.getElementById('reportNumberDisplay'); // זהו ה-span בתוך ה-h1
    const backButton = document.getElementById('backButton');

    // אלמנטים להצגה
    const displayFaultType = document.getElementById('displayFaultType');
    const displayLocation = document.getElementById('displayLocation');
    const displayDate = document.getElementById('displayDate');
    const displayTime = document.getElementById('displayTime');
    const displayDescription = document.getElementById('displayDescription');
    const mediaContainer = document.getElementById('mediaContainer');

    // אלמנטים לעריכה (אם זה דף עריכה)
    const editStatus = document.getElementById('editStatus');
    const editMunicipalityResponse = document.getElementById('editMunicipalityResponse');

    // כפתורי שמירה וביטול
    const saveChangesButton = document.getElementById('saveChangesButton');
    const cancelChangesButton = document.getElementById('cancelChangesButton');

    let currentReport = null; // ישמור את הדיווח הנוכחי לצרכי ביטול שינויים או עדכון

    // מיפוי סטטוסים באנגלית לעברית
    const statusTranslations = {
        'in-progress': 'בטיפול',
        'completed': 'הושלם',
        'rejected': 'נדחה',
    };

    // ------------------ פונקציות עזר ------------------

    function getLoggedInUser() {
        const user = localStorage.getItem('loggedInUser');
        return user ? JSON.parse(user) : null;
    }

    async function fetchReportDetails(id) {
        try {
            const BASE_URL = 'https://webfinalproject-j4tc.onrender.com';
            const response = await fetch(`${BASE_URL}/api/reports/${id}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('דיווח לא נמצא.');
                throw new Error(`שגיאה בשליפת דיווח: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching report:', error);
            alert('אירעה שגיאה בטעינת פרטי הדיווח.');
            return null;
        }
    }

    async function updateReport(id, updatedData) {
        try {
            const BASE_URL = 'https://webfinalproject-j4tc.onrender.com';
            const response = await fetch(`${BASE_URL}/api/reports/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (!response.ok) {
                throw new Error((await response.json()).message || `Failed to update report: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating report:', error);
            alert('אירעה שגיאה בשמירת השינויים: ' + error.message);
            return null;
        }
    }

    function populateReportData(report) {
        displayFaultType.textContent = report.faultType || 'לא ידוע';

        // מיקום
        let locationText = '';
        if (report.location) {
            if (report.location.city) locationText += report.location.city;
            if (report.location.street) locationText += `, ${report.location.street}`;
            if (report.location.houseNumber) locationText += ` ${report.location.houseNumber}`;
        }
        displayLocation.textContent = locationText || 'לא הוזן מיקום';

        // תאריך ושעה
        if (report.timestamp) {
            const date = new Date(report.timestamp);
            displayDate.textContent = date.toLocaleDateString('he-IL');
            displayTime.textContent = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        } else {
            displayDate.textContent = 'לא ידוע';
            displayTime.textContent = 'לא ידוע';
        }

        // תיאור - ודא שזה report.description ולא report.faultDescription
        displayDescription.textContent = report.description || 'אין תיאור.';

        // הצגת מדיה
        mediaContainer.innerHTML = '';
        if (report.media) {
            const mediaUrl = `/uploads/${report.media}`;
            if (/\.(jpeg|jpg|gif|png)$/i.test(report.media)) {
                const img = document.createElement('img');
                img.src = mediaUrl;
                img.alt = 'תמונה מצורפת לדיווח';
                img.style.maxWidth = '100%';
                img.style.height = 'auto'; // נוסף לוודא פרופורציות
                mediaContainer.appendChild(img);
            } else if (/\.(mp4|webm|ogg)$/i.test(report.media)) {
                const video = document.createElement('video');
                video.src = mediaUrl;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.height = 'auto'; // נוסף לוודא פרופורציות
                mediaContainer.appendChild(video);
            } else {
                mediaContainer.textContent = 'קובץ מדיה לא נתמך.';
            }
        }

        // סטטוס ותגובת רשות - כאן מציגים את הסטטוס בעברית ומוסיפים מחלקת צבע מתאימה
        let normalizedStatus = (report.status || '').toLowerCase().replace(/_/g, '-');
        const statusHebrew = statusTranslations[normalizedStatus] || 'לא ידוע';

        // ודא שהאלמנט displayStatus קיים לפני שאתה מנסה לגשת אליו (אם זה דף עריכה, הוא לא תמיד קיים)
        const displayStatus = document.getElementById('displayStatus');
        if (displayStatus) {
            displayStatus.textContent = statusHebrew;

            // הסרת כל מחלקות הסטטוס לפני הוספה
            displayStatus.classList.remove('status-paid', 'status-rejected', 'status-in-progress');

            // הוספת מחלקה לפי סטטוס
            if (normalizedStatus === 'completed') {
                displayStatus.classList.add('status-paid');
            } else if (normalizedStatus === 'rejected') {
                displayStatus.classList.add('status-rejected');
            } else if (normalizedStatus === 'in-progress') {
                displayStatus.classList.add('status-in-progress');
            }
        }

        const displayMunicipalityResponse = document.getElementById('displayMunicipalityResponse');
        if (displayMunicipalityResponse) { // ודא שהאלמנט קיים
            displayMunicipalityResponse.textContent = report.municipalityResponse || 'טרם התקבלה תגובה מהרשות המקומית.';
        }

        // מילוי שדות העריכה אם הם קיימים בדף (בדף reportChangePage.html)
        if (editStatus) {
            editStatus.value = report.status || 'in-progress';
        }
        if (editMunicipalityResponse) {
            editMunicipalityResponse.value = report.municipalityResponse || '';
        }
    }

    // ------------------ תחילת לוגיקת הדף ------------------

    // בדיקת תקינות ID
    if (!reportId) {
        reportsTitleElement.textContent = 'שגיאה: ID דיווח חסר';
        console.error('Report ID is missing from the URL.');
        return;
    }
    
    if (reportNumberDisplay) {
         reportsTitleElement.textContent = `דיווח #${reportId.slice(-4)}`;
    }


    // בדיקת הרשאת משתמש (רלוונטי לדף עריכה)
    const user = getLoggedInUser();
    // אם זה דף עריכה (נזהה ע"י קיום כפתור שמירה), נבדוק הרשאות
    if (saveChangesButton) {
        if (!user || user.userType !== 'employee') {
            alert('אין לך הרשאה לערוך דיווחים.');
            window.location.href = '../html/login.html'; // מפנה לדף ההתחברות
            return;
        }
    }


    currentReport = await fetchReportDetails(reportId);
    if (currentReport) {
        populateReportData(currentReport);
    } else {
        reportsTitleElement.textContent = 'שגיאה בטעינת דיווח';
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = '<p style="color: red; text-align: center;">הדיווח לא נמצא או אירעה שגיאה בטעינה.</p>';
        }
        // הסתרת כפתורי שמירה וביטול אם הדיווח לא נמצא (בדף עריכה)
        if (saveChangesButton) saveChangesButton.style.display = 'none';
        if (cancelChangesButton) cancelChangesButton.style.display = 'none';
    }

    // ------------------ הגדרת מאזיני אירועים ------------------

    // כפתורי שמירה וביטול (אם קיימים - ב-reportChangePage.html)
    if (saveChangesButton) {
        saveChangesButton.addEventListener('click', async () => {
            const updatedData = {
                status: editStatus.value,
                municipalityResponse: editMunicipalityResponse.value
            };

            const result = await updateReport(reportId, updatedData);
            if (result) {
                alert('השינויים נשמרו בהצלחה!');
                // חזרה לדף התצוגה לאחר שמירה, מעבירים רק את ה-ID
                window.location.href = `/html/finalReportPage.html?id=${reportId}`;
            }
        });
    }

    if (cancelChangesButton) {
        cancelChangesButton.addEventListener('click', () => {
            if (currentReport) {
                populateReportData(currentReport); // חזרה לנתונים המקוריים
            }
            alert('השינויים בוטלו.');
        });
    }

    // כפתור חזור (חץ או כפתור חזרה)
    if (backButton) { // זה יכול להיות גם ה-backArrow שצוין למעלה
        backButton.addEventListener('click', e => {
            e.preventDefault();
            window.history.back();
        });
    }

    // כפתור "עריכת דף" (אם קיים - ב-finalReportPage.html)
    // שים לב: הקובץ הזה הוא reportEditPage/ChangePage, אז כפתור כזה יהיה רק ב-finalReportPage.js
    // אבל אם במקרה הכפתור הזה נמצא כאן (בדף העריכה עצמו), הלוגיקה הבאה מתאימה:
    const editPageButton = document.querySelector('.footer-employee button'); // כפתור עריכה מתוך דף תצוגה
    if (editPageButton) {
        editPageButton.addEventListener('click', () => {
            // מעבר לדף העריכה עם ה-ID
            window.location.href = `/html/reportChangePage.html?id=${reportId}`;
        });
    }
});