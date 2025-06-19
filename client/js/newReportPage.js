document.addEventListener('DOMContentLoaded', () => {
    // --- 1. הגדרת אלמנטים ב-HTML ---
    const backButton = document.getElementById('backButton');
    const reportForm = document.querySelector('.report-form');

    // שדות קשורים לסוג התקלה
    const faultTypeSelect = document.getElementById('fault-type');
    const faultDescriptionTextarea = document.getElementById('fault-description');
    const faultDescriptionLabelOptional = document.querySelector('label[for="fault-description"] .optional');
    const faultDescriptionLabelRequired = document.querySelector('label[for="fault-description"] .required');

    // שדות קשורים למיקום
    const locationSelect = document.getElementById('location');
    const manualAddressSection = document.getElementById('manualAddressSection');
    const manualAddressInput = document.getElementById('manual-address');

    // שדות קשורים להעלאת מדיה
    const uploadSelect = document.getElementById('upload');
    const mediaUploadSection = document.getElementById('mediaUploadSection');
    const mediaFileInput = document.getElementById('media-file');

    // משתנים לשמירת נתונים זמניים
    let selectedFaultType = '';
    let selectedLocationType = '';
    let selectedUploadOption = '';

    // קבלת פרטי המשתמש מה-sessionStorage
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    let currentUsername = 'אנונימי'; // ברירת מחדל
    let currentUserId = 'anonymous'; // ברירת מחדל

    if (loggedInUser) {
        currentUsername = loggedInUser.username;
        currentUserId = loggedInUser.userId;
        console.log('משתמש מחובר:', currentUsername, 'ID:', currentUserId);
    } else {
        console.warn('אין משתמש מחובר ב-sessionStorage.');
    }


    // --- 2. טיפול בכפתור החץ חזרה ---
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '../html/homePageCitizen.html'; // נתיב מוחלט
        });
    } else {
        console.warn("Element with ID 'backButton' not found. Cannot attach click listener.");
    }

    // --- 3. פונקציה לעדכון מצב שדה "תיאור תקלה" ---
    function updateFaultDescriptionRequirement() {
        selectedFaultType = faultTypeSelect.value;

        if (selectedFaultType === 'type4') { // אם נבחרה האופציה "אחר"
            faultDescriptionTextarea.setAttribute('required', 'true');
            if (faultDescriptionLabelOptional) {
                faultDescriptionLabelOptional.style.display = 'none'; // הסתר "לא חובה"
            }
            if (faultDescriptionLabelRequired) {
                faultDescriptionLabelRequired.style.display = 'inline'; // הצג "חובה"
            }
        } else {
            faultDescriptionTextarea.removeAttribute('required');
            if (faultDescriptionLabelOptional) {
                faultDescriptionLabelOptional.style.display = 'inline'; // הצג "לא חובה"
            }
            if (faultDescriptionLabelRequired) {
                faultDescriptionLabelRequired.style.display = 'none'; // הסתר "חובה"
            }
        }
        console.log('סוג תקלה נבחר:', selectedFaultType);
        console.log('תיאור תקלה הוא חובה:', faultDescriptionTextarea.hasAttribute('required'));
    }

    // --- 4. פונקציה לעדכון מצב שדה "כתובת ידנית" ---
    function updateManualAddressVisibility() {
        selectedLocationType = locationSelect.value;
        if (selectedLocationType === 'loc2') { // אם נבחר "הקלדת מיקום ידני"
            manualAddressSection.style.display = 'block';
            manualAddressInput.setAttribute('required', 'true');
        } else {
            manualAddressSection.style.display = 'none';
            manualAddressInput.removeAttribute('required');
            manualAddressInput.value = ''; // נקה את השדה אם הוא הוסתר
        }
        console.log('סוג מיקום נבחר:', selectedLocationType);
    }

    // --- 5. פונקציה לעדכון מצב שדה "בחירת קובץ" ---
    function updateMediaUploadVisibility() {
        selectedUploadOption = uploadSelect.value;
        if (selectedUploadOption === 'option1' || selectedUploadOption === 'option2') { // אם נבחרו "מצלמה" או "ספריית תמונות"
            mediaUploadSection.style.display = 'block';
            mediaFileInput.setAttribute('required', 'true');
        } else {
            mediaUploadSection.style.display = 'none';
            mediaFileInput.removeAttribute('required');
            mediaFileInput.value = ''; // נקה את השדה אם הוא הוסתר
        }
        console.log('אפשרות העלאה נבחרה:', selectedUploadOption);
    }

    // --- 6. הוספת מאזיני אירועים לשינויים בבחירות ---
    if (faultTypeSelect) {
        faultTypeSelect.addEventListener('change', updateFaultDescriptionRequirement);
        // הפעלה ראשונית למקרה של רענון דף
        updateFaultDescriptionRequirement();
    }
    if (locationSelect) {
        locationSelect.addEventListener('change', updateManualAddressVisibility);
        // הפעלה ראשונית למקרה של רענון דף
        updateManualAddressVisibility();
    }
    if (uploadSelect) {
        uploadSelect.addEventListener('change', updateMediaUploadVisibility);
        // הפעלה ראשונית למקרה של רענון דף
        updateMediaUploadVisibility();
    }

    // --- 7. טיפול בשליחת הטופס ---
    if (reportForm) {
        reportForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // מונע שליחה רגילה של הטופס

            // וודא שכל שדות החובה מולאו לפני שליחה
            if (!reportForm.checkValidity()) {
                alert('אנא מלא את כל השדות הנדרשים.');
                return;
            }

            // אוספים את הנתונים מהטופס
            const faultType = faultTypeSelect.value;
            const faultDescription = faultDescriptionTextarea.value.trim();
            const locationType = locationSelect.value;
            const manualAddress = (locationType === 'loc2') ? manualAddressInput.value.trim() : '';
            const uploadOption = uploadSelect.value;
            const mediaFile = mediaFileInput.files[0]; // קובץ בודד

            // יצירת FormData אובייקט לשליחת קבצים ונתונים יחד
            const formData = new FormData();
            formData.append('faultType', faultType);
            formData.append('faultDescription', faultDescription);
            formData.append('locationType', locationType);
            if (locationType === 'loc2') {
                formData.append('manualAddress', manualAddress);
            }
            formData.append('uploadOption', uploadOption);
            if (mediaFile) {
                formData.append('mediaFile', mediaFile);
            }
            formData.append('createdBy', currentUsername);
            formData.append('creatorId', currentUserId);


            console.log('נתוני דיווח מוכנים לשליחה:', {
                faultType,
                faultDescription,
                locationType,
                manualAddress,
                uploadOption,
                mediaFile: mediaFile ? mediaFile.name : 'אין קובץ',
                createdBy: currentUsername,
                creatorId: currentUserId
            });


            try {
                const res = await fetch('http://localhost:3000/api/reports', {
                    method: 'POST',
                    body: formData // חשוב: אין להגדיר Content-Type ידנית עבור FormData, הדפדפן עושה זאת אוטומטית עם Boundary
                });

                const data = await res.json(); // קריאת ה-JSON מהתגובה

                if (res.ok) {
                    console.log('Report submitted successfully:', data.message);
                    // שמירת פרטי הדיווח ב-sessionStorage כדי להציג אותם בדף האישור
                    sessionStorage.setItem('lastReportDetails', JSON.stringify({
                        faultType: faultTypeSelect.options[faultTypeSelect.selectedIndex].text, // טקסט התקלה
                        faultDescription: faultDescription,
                        location: (locationType === 'loc1') ? 'מיקומך הנוכחי' : manualAddress,
                        mediaFileName: mediaFile ? mediaFile.name : 'אין קובץ',
                        reportId: data.reportId || 'N/A' // ID שהשרת מחזיר
                    }));

                    alert('הדיווח נשלח בהצלחה!');
                    // ניתוב לדף אישור הדיווח
                    window.location.href = '/html/reportReceivedPage.html';
                } else {
                    // אם res.ok הוא false (לדוגמה, סטטוס 400, 500)
                    alert(data.message || 'שגיאה בשליחת הדיווח: ' + (data.error || 'אירעה שגיאה.'));
                    console.error('Report submission failed from server:', data.error || 'Unknown error');
                }
            } catch (err) {
                // שגיאות רשת או בעיות ב-fetch API עצמו
                alert('אירעה שגיאה בחיבור לשרת בעת שליחת הדיווח. אנא נסה שנית מאוחר יותר.');
                console.error('Fetch error during report submission:', err);
            }
        });
    } else {
        console.warn("Report form not found. Ensure element with class 'report-form' exists.");
    }
});