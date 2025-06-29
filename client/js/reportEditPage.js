// reportEditPage.js
// --------------------------------------------------------
// טוען את פרטי הדיווח ומציג אותם בדף העריכה / צפייה לעובד
// --------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // ------------------ קבלת פרמטרים מה‑URL ------------------
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');   // מזהה MongoDB
    // const reportSeq = urlParams.get('seq'); // *** שורה זו הוסרה ***

    // אלמנטים בדף
    const reportsTitleElement = document.querySelector('.reports-title h1');
    const backArrow = document.querySelector('.back-arrow');

    // בדיקת תקינות ID
    if (!reportId) {
        reportsTitleElement.textContent = 'שגיאה: ID דיווח חסר';
        console.error('Report ID is missing from the URL.');
        return;
    }

    // ------------------ כותרת הדף ------------------
    // *** בלוק ה-if/else עבור reportSeq הוחלף בשימוש ישיר ב-reportId.slice(-4) ***
    reportsTitleElement.textContent = `דיווח #${reportId.slice(-4)}`;

    // מיפוי סטטוסים באנגלית לעברית
    const statusTranslations = {
        'in-progress': 'בטיפול',
        'completed': 'הושלם',
        'rejected': 'נדחה',
        // הוסף כאן סטטוסים נוספים במידה ויש
    };

    // ------------------ שליפת פרטי הדיווח מהשרת ------------------
    try {
        const response = await fetch(`/api/reports/${reportId}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error('דיווח לא נמצא.');
            throw new Error(`שגיאה בשליפת דיווח: ${response.statusText}`);
        }
        const report = await response.json();
        console.log('Report details fetched:', report);

        // ------------------ מילוי הנתונים בדף ------------------
        document.getElementById('displayFaultType').textContent = report.faultType || 'לא ידוע';

        // מיקום
        if (report.location) {
            let locationText = '';
            if (report.location.city)        locationText += report.location.city;
            if (report.location.street)      locationText += `, ${report.location.street}`;
            if (report.location.houseNumber) locationText += ` ${report.location.houseNumber}`;
            document.getElementById('displayLocation').textContent = locationText || 'לא הוזן מיקום';
        } else {
            document.getElementById('displayLocation').textContent = 'לא הוזן מיקום';
        }

        // תאריך ושעה
        if (report.timestamp) {
            const dateObj = new Date(report.timestamp);
            document.getElementById('displayDate').textContent =
                dateObj.toLocaleDateString('he-IL');
            document.getElementById('displayTime').textContent =
                dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        } else {
            document.getElementById('displayDate').textContent  = 'לא ידוע';
            document.getElementById('displayTime').textContent  = 'לא ידוע';
        }

        // תיאור
        document.getElementById('displayDescription').textContent =
            report.description || 'אין תיאור.';

        // ------------------ הצגת מדיה ------------------
        const mediaContainer = document.getElementById('mediaContainer');
        if (report.media) {
            const mediaUrl = `/uploads/${report.media}`;
            if (/\.(jpeg|jpg|gif|png)$/i.test(report.media)) {
                const img = document.createElement('img');
                img.src = mediaUrl;
                img.alt = 'תמונה מצורפת לדיווח';
                img.style.maxWidth = '100%';
                mediaContainer.appendChild(img);
            } else if (/\.(mp4|webm|ogg)$/i.test(report.media)) {
                const video = document.createElement('video');
                video.src = mediaUrl;
                video.controls = true;
                video.style.maxWidth = '100%';
                mediaContainer.appendChild(video);
            } else {
                mediaContainer.textContent = 'קובץ מדיה לא נתמך.';
            }
        }

        // סטטוס + תגובת רשות - כאן מציגים את הסטטוס בעברית ומוסיפים מחלקת צבע מתאימה
        let normalizedStatus = (report.status || '').toLowerCase().replace(/_/g, '-');

        // *** שונה: ודא שהגיבוי הוא רק "לא ידוע" ולא report.status ***
        const statusHebrew = statusTranslations[normalizedStatus] || 'לא ידוע';

        const statusElement = document.getElementById('displayStatus');
        statusElement.textContent = statusHebrew;

        // הסרת כל מחלקות הסטטוס לפני הוספה
        statusElement.classList.remove('status-paid', 'status-rejected', 'status-in-progress');

        // הוספת מחלקה לפי סטטוס
        if (normalizedStatus === 'completed') {
            statusElement.classList.add('status-paid');
        } else if (normalizedStatus === 'rejected') {
            statusElement.classList.add('status-rejected');
        } else if (normalizedStatus === 'in-progress') {
            statusElement.classList.add('status-in-progress');
        }

        document.getElementById('displayMunicipalityResponse').textContent =
            report.municipalityResponse || 'טרם התקבלה תגובה מהרשות המקומית.';

    } catch (error) {
        console.error('Error loading report details:', error);
        reportsTitleElement.textContent = 'שגיאה בטעינת דיווח';
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML =
                `<p style="color:red;text-align:center;">${error.message}</p>`;
        }
    }

    // ------------------ כפתור "עריכת דף" ------------------
    const editPageButton = document.querySelector('.footer-employee button');
    if (editPageButton) {
        editPageButton.addEventListener('click', () => {
            // *** הפרמטר &seq הוסר מה-URL בעת המעבר לדף העריכה ***
            window.location.href = `/html/reportChangePage.html?id=${reportId}`;
        });
    }

    // ------------------ כפתור חזור ------------------
    if (backArrow) {
        backArrow.addEventListener('click', evt => {
            evt.preventDefault();
            window.history.back();
        });
    }
});