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
    const reportNumberDisplay = document.getElementById('reportNumberDisplay'); // אלמנט ה-span עבור המספר
    const backArrow = document.querySelector('.back-arrow');

    // אלמנטים להצגה
    const displayFaultType = document.getElementById('displayFaultType');
    const displayLocation = document.getElementById('displayLocation');
    const displayDate = document.getElementById('displayDate');
    const displayTime = document.getElementById('displayTime');
    const displayDescription = document.getElementById('displayDescription');
    const mediaContainer = document.getElementById('mediaContainer');
    const displayStatus = document.getElementById('displayStatus'); // אלמנט להצגת סטטוס
    const displayMunicipalityResponse = document.getElementById('displayMunicipalityResponse'); // אלמנט להצגת תגובת רשות

    // אלמנטים לעריכה (אם זה דף עריכה)
    const editStatus = document.getElementById('editStatus'); // אם קיים בדף
    const editMunicipalityResponse = document.getElementById('editMunicipalityResponse'); // אם קיים בדף
    const saveChangesButton = document.getElementById('saveChangesButton'); // אם קיים בדף
    const cancelChangesButton = document.getElementById('cancelChangesButton'); // אם קיים בדף
    const backToHomeButton = document.getElementById('backToHomeButton'); // כפתור חזרה לדף הבית

    let currentReport = null; // ישמור את הדיווח הנוכחי לצרכי ביטול שינויים או עדכון

    // מיפוי סטטוסים באנגלית לעברית
    const statusTranslations = {
        'in-progress': 'בטיפול',
        'completed': 'הושלם',
        'rejected': 'נדחה',
        // הוסף כאן סטטוסים נוספים במידה ויש
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

            // *** שינוי קריטי זה: ננסה לקרוא את התגובה JSON גם אם היא לא OK ***
            let errorData = null;
            let responseText = null; // הוסף משתנה לטקסט הגולמי

            try {
                // קרא את גוף התגובה כטקסט קודם
                responseText = await response.text();
                // נסה לנתח כ-JSON
                errorData = JSON.parse(responseText);
            } catch (jsonError) {
                console.warn('Could not parse error response as JSON or response was empty:', jsonError);
                console.warn('Raw response text received:', responseText); // הצג את הטקסט הגולמי
                // אם אי אפשר לפענח כ-JSON, נגדיר הודעה כללית
                errorData = { message: `Server responded with status ${response.status} but no valid JSON error.` };
            }
            // *** סוף שינוי ***

            if (!response.ok) {
                // נשתמש ב-errorData.message אם קיים, אחרת ב-response.statusText
                throw new Error(errorData.message || `Failed to update report: ${response.statusText}`);
            }
            // אם ה-response.ok הוא true, נחזיר את ה-JSON שקיבלנו (שהוא כבר ב-errorData)
            return errorData;
        } catch (error) {
            // כאן ה-error.message יכיל את ההודעה המשופרת
            console.error('Error updating report in fetch (client-side):', error);
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
                img.style.height = 'auto';
                mediaContainer.appendChild(img);
            } else if (/\.(mp4|webm|ogg)$/i.test(report.media)) {
                const video = document.createElement('video');
                video.src = mediaUrl;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.height = 'auto';
                mediaContainer.appendChild(video);
            } else {
                mediaContainer.textContent = 'קובץ מדיה לא נתמך.';
            }
        }

        // סטטוס ותגובת רשות - כאן מציגים את הסטטוס בעברית ומוסיפים מחלקת צבע מתאימה
        let normalizedStatus = (report.status || '').toLowerCase().replace(/_/g, '-');
        const statusHebrew = statusTranslations[normalizedStatus] || 'לא ידוע';

        if (displayStatus) {
            displayStatus.textContent = statusHebrew;

            displayStatus.classList.remove('status-paid', 'status-rejected', 'status-in-progress');

            if (normalizedStatus === 'completed') {
                displayStatus.classList.add('status-paid');
            } else if (normalizedStatus === 'rejected') {
                displayStatus.classList.add('status-rejected');
            } else if (normalizedStatus === 'in-progress') {
                displayStatus.classList.add('status-in-progress');
            }
        }

        if (displayMunicipalityResponse) {
            displayMunicipalityResponse.textContent = report.municipalityResponse || 'טרם התקבלה תגובה מהרשות המקומית.';
        }

        // מילוי שדות העריכה אם הם קיימים בדף
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

    // הצגת הכותרת עם 4 ספרות אחרונות של ה-ID
    // *** בלוק ה-if/else עבור reportSeq הוסר לחלוטין. רק שימוש ב-reportId.slice(-4) ***
    if (reportNumberDisplay) {
        reportNumberDisplay.textContent = reportId.slice(-4);
    } else {
        reportsTitleElement.textContent = `דיווח #${reportId.slice(-4)}`;
    }

    // בדיקת הרשאת משתמש אם זה דף עריכה
    if (saveChangesButton) {
        const user = getLoggedInUser();
        if (!user || user.userType !== 'employee') {
            alert('אין לך הרשאה לערוך דיווחים.');
            window.location.href = '../html/login.html';
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
        // הסתרת כפתורים אם הדיווח לא נמצא
        if (saveChangesButton) saveChangesButton.style.display = 'none';
        if (cancelChangesButton) cancelChangesButton.style.display = 'none';
        if (backToHomeButton) backToHomeButton.style.display = 'none';
    }

    // ------------------ הגדרת מאזיני אירועים ------------------

    // כפתור חזור (חץ)
    if (backArrow) {
        backArrow.addEventListener('click', evt => {
            evt.preventDefault();
            window.history.back();
        });
    }

    // כפתור חזרה לעמוד הבית (אם קיים)
    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', () => {
            window.location.href = '../html/homePageEmployee.html';
        });
    }

    // כפתור "עריכת דף" (אם קיים - לרוב ב-finalReportPage.html, אבל אם גם כאן, אז...)
    const editPageButton = document.querySelector('.footer-employee button');
    if (editPageButton) {
        editPageButton.addEventListener('click', () => {
            // *** העברה לדף העריכה ללא פרמטר ה-seq ***
            window.location.href = `/html/reportChangePage.html?id=${reportId}`;
        });
    }

    // כפתורי שמירה וביטול (אם קיימים - ב-reportChangePage.html)
    if (saveChangesButton) {
        saveChangesButton.addEventListener('click', async () => {
            const updatedData = {
                status: editStatus.value,
                municipalityResponse: editMunicipalityResponse.value
            };
            console.log('Updating report:', updatedData);
            const result = await updateReport(reportId, updatedData);
            if (result) {
                alert('השינויים נשמרו בהצלחה!');
                // *** חזרה לדף התצוגה הסופי ללא פרמטר ה-seq ***
                window.location.href = `/html/finalReportPage.html?id=${reportId}`;
            }
        });
    }

    if (cancelChangesButton) {
        cancelChangesButton.addEventListener('click', () => {
            if (currentReport) {
                populateReportData(currentReport);
            }
            alert('השינויים בוטלו.');
        });
    }
});