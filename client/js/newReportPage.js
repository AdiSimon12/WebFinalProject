document.addEventListener('DOMContentLoaded', () => {
    // --- 1. הגדרת אלמנטים ב-HTML ---
    const backButton = document.getElementById('backButton');
    const reportForm = document.querySelector('.report-form');

    // שדות קשורים לסוג התקלה
    const faultTypeSelect = document.getElementById('fault-type');
    const faultDescriptionTextarea = document.getElementById('fault-description');
    // **שינוי כאן: קבלת הפניות לשני ה-span-ים של ה-label**
    const faultDescriptionLabelOptional = document.querySelector('label[for="fault-description"] .optional');
    const faultDescriptionLabelRequired = document.querySelector('label[for="fault-description"] .required');

    // שדות קשורים למיקום
    const locationSelect = document.getElementById('location');
    const manualAddressSection = document.getElementById('manualAddressSection');
    const cityInput = document.getElementById('cityInput');
    const streetInput = document.getElementById('streetInput');
    const houseNumberInput = document.getElementById('houseNumberInput');

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
            // **שינוי כאן: הצגה והסתרה של ה-span-ים**
            if (faultDescriptionLabelOptional) {
                faultDescriptionLabelOptional.style.display = 'none'; // הסתר "(לא חובה)"
            }
            if (faultDescriptionLabelRequired) {
                faultDescriptionLabelRequired.style.display = 'inline'; // הצג "(חובה)"
            }
        } else {
            faultDescriptionTextarea.removeAttribute('required');
            // **שינוי כאן: הצגה והסתרה של ה-span-ים**
            if (faultDescriptionLabelOptional) {
                faultDescriptionLabelOptional.style.display = 'inline'; // הצג "(לא חובה)"
            }
            if (faultDescriptionLabelRequired) {
                faultDescriptionLabelRequired.style.display = 'none'; // הסתר "(חובה)"
            }
            faultDescriptionTextarea.value = ''; // נקה את השדה כשלא חובה
        }
        console.log('סוג תקלה נבחר:', selectedFaultType);
        console.log('תיאור תקלה הוא חובה:', faultDescriptionTextarea.hasAttribute('required'));
    }

    // --- 4. פונקציה לעדכון מצב שדות "כתובת ידנית" ---
    function updateManualAddressVisibility() {
        selectedLocationType = locationSelect.value;
        if (selectedLocationType === 'loc2') { // אם נבחר "הקלדת מיקום ידני"
            manualAddressSection.style.display = 'block';
            cityInput.setAttribute('required', 'true');
            streetInput.setAttribute('required', 'true');
            houseNumberInput.removeAttribute('required'); 

        } else {
            manualAddressSection.style.display = 'none';
            cityInput.removeAttribute('required');
            cityInput.value = '';

            streetInput.removeAttribute('required');
            streetInput.value = '';

            houseNumberInput.removeAttribute('required'); 
            houseNumberInput.value = '';
        }
        console.log('סוג מיקום נבחר:', selectedLocationType);
    }

    // --- 5. פונקציה לעדכון מצב שדה "בחירת קובץ" ---
    function updateMediaUploadVisibility() {
        selectedUploadOption = uploadSelect.value;
        if (selectedUploadOption === 'option1' || selectedUploadOption === 'option2') { 
            mediaUploadSection.style.display = 'block';
            mediaFileInput.setAttribute('required', 'true');
        } else {
            mediaUploadSection.style.display = 'none';
            mediaFileInput.removeAttribute('required');
            mediaFileInput.value = ''; 
        }
        console.log('אפשרות העלאה נבחרה:', selectedUploadOption);
    }

    // --- 6. הוספת מאזיני אירועים לשינויים בבחירות ---
    if (faultTypeSelect) {
        faultTypeSelect.addEventListener('change', updateFaultDescriptionRequirement);
        updateFaultDescriptionRequirement(); 
    }
    if (locationSelect) {
        locationSelect.addEventListener('change', updateManualAddressVisibility);
        updateManualAddressVisibility(); 
    }
    if (uploadSelect) {
        uploadSelect.addEventListener('change', updateMediaUploadVisibility);
        updateMediaUploadVisibility(); 
    }

    // --- 7. טיפול בשליחת הטופס ---
    if (reportForm) {
        reportForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 

            if (!reportForm.checkValidity()) {
                alert('אנא מלא את כל השדות הנדרשים.');
                return;
            }

            const faultType = faultTypeSelect.value;
            const faultDescription = faultDescriptionTextarea.value.trim();
            const locationType = locationSelect.value;
            const city = cityInput.value.trim();
            const street = streetInput.value.trim();
            const houseNumber = houseNumberInput.value.trim(); 

            const uploadOption = uploadSelect.value;
            const mediaFile = mediaFileInput.files[0]; 

            const formData = new FormData();
            formData.append('faultType', faultType);
            formData.append('faultDescription', faultDescription);
            formData.append('locationType', locationType);
            
            if (locationType === 'loc2') {
                formData.append('city', city);
                formData.append('street', street);
                if (houseNumber) { 
                    formData.append('houseNumber', houseNumber);
                }
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
                city: (locationType === 'loc2') ? city : 'N/A',
                street: (locationType === 'loc2') ? street : 'N/A',
                houseNumber: (locationType === 'loc2') ? houseNumber : 'N/A',
                uploadOption,
                mediaFile: mediaFile ? mediaFile.name : 'אין קובץ',
                createdBy: currentUsername,
                creatorId: currentUserId
            });


            try {
                const res = await fetch('http://localhost:3000/api/reports', {
                    method: 'POST',
                    body: formData 
                });

                const data = await res.json(); 

                if (res.ok) {
                    console.log('Report submitted successfully:', data.message);
                    
                    let displayLocation = '';
                    if (locationType === 'loc1') {
                        displayLocation = 'מיקומך הנוכחי';
                    } else {
                        displayLocation = `עיר: ${city}, רחוב: ${street}`;
                        if (houseNumber) {
                            displayLocation += `, מס' בית: ${houseNumber}`;
                        }
                    }

                    sessionStorage.setItem('lastReportDetails', JSON.stringify({
                        faultType: faultTypeSelect.options[faultTypeSelect.selectedIndex].text,
                        faultDescription: faultDescription,
                        location: displayLocation, 
                        mediaFileName: mediaFile ? mediaFile.name : 'אין קובץ',
                        reportId: data.reportId || 'N/A' 
                    }));

                    alert('הדיווח נשלח בהצלחה!');
                    window.location.href = '/html/reportReceivedPage.html';
                } else {
                    alert(data.message || 'שגיאה בשליחת הדיווח: ' + (data.error || 'אירעה שגיאה.'));
                    console.error('Report submission failed from server:', data.error || 'Unknown error');
                }
            } catch (err) {
                alert('אירעה שגיאה בחיבור לשרת בעת שליחת הדיווח. אנא נסה שנית מאוחר יותר.');
                console.error('Fetch error during report submission:', err);
            }
        });
    } else {
        console.warn("Report form not found. Ensure element with class 'report-form' exists.");
    }
});