document.addEventListener('DOMContentLoaded', () => {
    // --- 1. הגדרת אלמנטים ב-HTML ---
    const backButton = document.getElementById('backButton');
    const reportForm = document.querySelector('.report-form');

    // שדות קשורים לסוג התקלה
    const faultTypeSelect = document.getElementById('fault-type');
    const faultDescriptionTextarea = document.getElementById('fault-description');
    const faultDescriptionLabelOptional = document.querySelector('label[for="fault-description"] .optional');
    // --- שינוי: התייחסות ל-container של הכוכבית (הימנע מ-required הישן) ---
    const faultDescriptionAsteriskContainer = document.querySelector('label[for="fault-description"] .required-asterisk-container');


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

    // --- תוספת: אלמנטים חדשים הקשורים למצלמה ---
    const video = document.getElementById('cameraPreview');
    const captureButton = document.getElementById('capture');
    const canvas = document.getElementById('canvas');
    let capturedBlob = null; // ישמור את קובץ התמונה שצולם מהמצלמה
    let stream = null; // ישמור את זרם המצלמה הפעיל


    // משתנים לשמירת נתונים זמניים
    let selectedFaultType = '';
    let selectedLocationType = '';
    let selectedUploadOption = '';

    // משתנים לשמירת מיקום נוכחי (קו רוחב וקו אורך)
    let currentLat = null;
    let currentLon = null;

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
            // הנתיב: מהשורש הסטטי (client/) לתיקיית html/ ואז לקובץ homePageCitizen.html
            window.location.href = '/html/homePageCitizen.html';
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
                faultDescriptionLabelOptional.style.display = 'none';
            }
            // --- שינוי: הצג את ה-container של הכוכבית ---
            if (faultDescriptionAsteriskContainer) {
                faultDescriptionAsteriskContainer.style.display = 'inline-block';
            }
        } else {
            faultDescriptionTextarea.removeAttribute('required');
            if (faultDescriptionLabelOptional) {
                faultDescriptionLabelOptional.style.display = 'inline';
            }
            // --- שינוי: הסתר את ה-container של הכוכבית ---
            if (faultDescriptionAsteriskContainer) {
                faultDescriptionAsteriskContainer.style.display = 'none';
            }
            faultDescriptionTextarea.value = '';
        }
        console.log('סוג תקלה נבחר:', selectedFaultType);
        console.log('תיאור תקלה הוא חובה:', faultDescriptionTextarea.hasAttribute('required'));
    }

    // --- 4. פונקציה לטיפול בבחירת מיקום ---
    function handleLocationSelection() {
        selectedLocationType = locationSelect.value;
        console.log('סוג מיקום נבחר:', selectedLocationType);

        if (selectedLocationType === 'loc2') { // אם נבחר "הקלדת מיקום ידני"
            manualAddressSection.style.display = 'block';
            cityInput.setAttribute('required', 'true');
            streetInput.setAttribute('required', 'true');
            // --- שינוי: מספר בית נשאר לא חובה, אין צורך להסיר required שכן הוא לא נוסף ב-HTML ---
            // houseNumberInput.removeAttribute('required'); 

            // וודא שנתוני מיקום נוכחי מאופסים כשעוברים לידני
            currentLat = null;
            currentLon = null;

        } else if (selectedLocationType === 'loc1') { // אם נבחר "מיקומך הנוכחי"
            manualAddressSection.style.display = 'none'; // הסתר שדות כתובת ידנית
            // נקה את שדות הכתובת הידנית
            cityInput.removeAttribute('required');
            cityInput.value = '';
            streetInput.removeAttribute('required');
            streetInput.value = '';
            // --- שינוי: מספר בית נשאר לא חובה, אין צורך להסיר required שכן הוא לא נוסף ב-HTML ---
            // houseNumberInput.removeAttribute('required');
            houseNumberInput.value = '';

            // **קרא לפונקציה לזיהוי מיקום נוכחי**
            getCurrentLocation();

        } else { // ברירת מחדל או בחירה ריקה
            manualAddressSection.style.display = 'none';
            cityInput.removeAttribute('required');
            cityInput.value = '';
            streetInput.removeAttribute('required');
            streetInput.value = '';
            // --- שינוי: מספר בית נשאר לא חובה, אין צורך להסיר required שכן הוא לא נוסף ב-HTML ---
            // houseNumberInput.removeAttribute('required');
            houseNumberInput.value = '';
            currentLat = null; // אצפס גם כאן
            currentLon = null;
        }
    }

    // **פונקציה: זיהוי מיקום נוכחי באמצעות Geolocation API (ללא שירות חיצוני)**
    function getCurrentLocation() {
        if (navigator.geolocation) {
            console.log("Geolocation is supported by this browser.");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentLat = position.coords.latitude;
                    currentLon = position.coords.longitude;
                    console.log(`Current Location: Lat ${currentLat}, Lon ${currentLon}`);
                    alert(`המיקום זוהה בהצלחה. המערכת תמיר אותו לכתובת מלאה.`);
                },
                (error) => {
                    console.error("Error getting current location:", error);
                    let errorMessage = "אירעה שגיאה בזיהוי המיקום.";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "המשתמש סירב לבקשת המיקום. אנא אפשר גישה למיקום בהגדרות הדפדפן.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "פרטי מיקום אינם זמינים.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "פסק זמן לבקשת המיקום עבר.";
                            break;
                        case error.UNKNOWN_ERROR:
                            errorMessage = "שגיאה לא ידועה בזיהוי מיקום.";
                            break;
                    }
                    alert(errorMessage);
                    // במקרה של שגיאה, נחזיר את הבחירה במיקום ללא בחירה או למיקום ידני
                    locationSelect.value = '';
                    handleLocationSelection(); // קורא שוב כדי לאפס את המצב החזותי והדרישות
                    currentLat = null;
                    currentLon = null;
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            alert("הדפדפן שלך אינו תומך בזיהוי מיקום. אנא השתמש באפשרות 'הקלדת מיקום ידני'.");
            locationSelect.value = 'loc2';
            handleLocationSelection();
        }
    }

    // --- 5. פונקציה לטיפול בבחירת העלאת מדיה (מעודכן למצלמה) ---
    function updateMediaUploadVisibility() {
        selectedUploadOption = uploadSelect.value;
        console.log('אפשרות העלאה נבחרה:', selectedUploadOption);

        // הסתר הכל תחילה
        mediaUploadSection.style.display = 'none';
        mediaFileInput.removeAttribute('required');
        mediaFileInput.removeAttribute('accept');
        mediaFileInput.removeAttribute('capture');
        mediaFileInput.value = ''; // נקה בחירה קודמת
        video.style.display = 'none';
        captureButton.style.display = 'none';
        stopCamera(); // ודא שהמצלמה כבויה
        // --- תוספת: הסתר את התצוגה המקדימה של התמונה שצולמה ---
        const existingPreview = document.getElementById('capturedImagePreview');
        if (existingPreview) {
            existingPreview.remove();
        }
        capturedBlob = null; // אצפס גם את ה-blob שצולם

        if (selectedUploadOption === 'option1') { // אם נבחר "מצלמה"
            if (isDesktop()) { // עבור דסקטופ, נשתמש באלמנט <video> וכפתור צילום
                mediaUploadSection.style.display = 'none'; // הסתר את שדה בחירת הקובץ
                mediaFileInput.removeAttribute('required'); // וודא ששדה הקובץ לא חובה
                video.style.display = 'block';
                captureButton.style.display = 'inline-block'; // שים לב ל-inline-block
                startCamera(); // הפעל את המצלמה
            } else { // עבור מובייל, נשתמש ב-input type="file" עם capture
                mediaUploadSection.style.display = 'block';
                mediaFileInput.setAttribute('required', 'true');
                mediaFileInput.setAttribute('accept', 'image/*,video/*'); // קבל תמונות ווידאו
                mediaFileInput.setAttribute('capture', 'environment'); // רמז לפתיחת מצלמה אחורית
                mediaFileInput.value = ''; // נקה בחירה קודמת אם הייתה
            }

        } else if (selectedUploadOption === 'option2') { // אם נבחר "ספריית תמונות"
            mediaUploadSection.style.display = 'block';
            mediaFileInput.setAttribute('required', 'true');
            mediaFileInput.setAttribute('accept', 'image/*,video/*'); // קבל תמונות ווידאו
            mediaFileInput.removeAttribute('capture'); // אל תרמוז למצלמה, תן לבחור קובץ
            mediaFileInput.value = ''; // נקה בחירה קודמת אם הייתה

        } else { // ברירת מחדל (או לא נבחר כלום)
            // כבר טופל בהסתרת הכל וכיבוי המצלמה בתחילת הפונקציה
            // capturedBlob = null; // כבר מאופס למעלה בפונקציה
        }
        console.log('שדה קובץ מדיה חובה:', mediaFileInput.hasAttribute('required'));
    }

    // --- תוספת: פונקציות עזר למצלמה ---
    function isDesktop() {
        return !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    }

    async function startCamera() {
        try {
            // וודא שאין זרם פעיל לפני שמתחילים חדש
            stopCamera();
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play(); // התחל לנגן את הוידאו
            console.log("Camera started successfully.");
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('לא ניתן להפעיל מצלמה: ' + err.message + '\nאנא ודא שיש לך מצלמה מחוברת ואפשר גישה אליה בדפדפן.');
            // במקרה של שגיאה, אולי כדאי לאפס את הבחירה או להעביר לאפשרות אחרת
            uploadSelect.value = ''; // אולי לאפס את הבחירה
            updateMediaUploadVisibility(); // ולעדכן את התצוגה
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log("Camera track stopped.");
            });
            stream = null;
        }
        video.srcObject = null;
        video.pause(); // ודא שהוידאו נעצר
        console.log("Camera stopped.");
    }

    // --- תוספת: טיפול בכפתור הצילום ---
    if (captureButton) {
        captureButton.addEventListener('click', () => {
            if (!stream) {
                alert('אין זרם מצלמה פעיל לצילום תמונה.');
                return;
            }
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                capturedBlob = blob;
                alert("תמונה צולמה בהצלחה ונשמרה לדיווח.");
                // אולי נציג את התמונה שצולמה למשתמש
                const img = document.createElement('img');
                img.src = URL.createObjectURL(blob);
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.marginTop = '10px';
                // נחליף את כפתור הצילום בתצוגה מקדימה, או נוסיף אותה
                // למשל, נוסיף ליד הכפתור או מעל הוידאו
                const existingPreview = document.getElementById('capturedImagePreview');
                if (existingPreview) {
                    existingPreview.src = img.src;
                } else {
                    img.id = 'capturedImagePreview';
                    captureButton.parentNode.insertBefore(img, captureButton.nextSibling);
                }

                // ניתן גם לכבות את המצלמה או לשנות את התצוגה
                stopCamera();
                video.style.display = 'none';
                captureButton.style.display = 'none';

            }, 'image/jpeg');
        });
    }


    // --- 6. הוספת מאזיני אירועים לשינויים בבחירות ---
    if (faultTypeSelect) {
        faultTypeSelect.addEventListener('change', updateFaultDescriptionRequirement);
        updateFaultDescriptionRequirement(); // הפעלה ראשונית
    }
    if (locationSelect) {
        locationSelect.addEventListener('change', handleLocationSelection);
        handleLocationSelection(); // הפעלה ראשונית
    }
    if (uploadSelect) {
        uploadSelect.addEventListener('change', updateMediaUploadVisibility);
        updateMediaUploadVisibility(); // הפעלה ראשונית של הפונקציה בעת טעינת הדף
    }

    // --- 7. טיפול בשליחת הטופס ---
    if (reportForm) {
        reportForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!reportForm.checkValidity()) {
                alert('אנא מלא את כל השדות הנדרשים.');
                // הוספת לוגיקה שתציג את השגיאות למשתמש בצורה ברורה יותר
                reportForm.reportValidity(); // מציג את הודעות השגיאה המובנות של הדפדפן
                return;
            }

            const faultType = faultTypeSelect.value;
            const faultDescription = faultDescriptionTextarea.value.trim();
            const locationType = locationSelect.value;

            let locationData = {};

            if (locationType === 'loc2') {
                locationData = {
                    type: 'manual',
                    city: cityInput.value.trim(),
                    street: streetInput.value.trim(),
                    houseNumber: houseNumberInput.value.trim()
                };
            } else if (locationType === 'loc1') {
                if (currentLat === null || currentLon === null) {
                    alert('לא ניתן לשלוח את הדיווח. המיקום הנוכחי לא זוהה. אנא נסה שוב או בחר במיקום ידני.');
                    return;
                }
                locationData = {
                    type: 'current',
                    latitude: currentLat,
                    longitude: currentLon
                };
            } else {
                alert('אנא בחר סוג מיקום.');
                return;
            }

            const uploadOption = uploadSelect.value;
            let mediaToUpload = null;

            // --- שינוי: טיפול בקובץ המדיה לפי אפשרות העלאה ---
            if (uploadOption === 'option1' && isDesktop()) { // אם נבחרה מצלמה ובדסקטופ
                if (capturedBlob) {
                    mediaToUpload = new File([capturedBlob], 'captured_image.jpeg', { type: 'image/jpeg' });
                    console.log("Captured blob will be uploaded.");
                } else {
                    alert('לא צולמה תמונה. אנא צלם תמונה או בחר באפשרות אחרת.');
                    return;
                }
            } else if (uploadOption === 'option1' || uploadOption === 'option2') { // אם נבחרה מצלמה במובייל או ספריית תמונות
                if (mediaFileInput.files.length > 0) {
                    mediaToUpload = mediaFileInput.files[0];
                    console.log("Selected media file will be uploaded:", mediaToUpload.name);
                } else {
                    alert('אנא בחר קובץ תמונה/וידאו.');
                    return;
                }
            }


            const formData = new FormData();
            formData.append('faultType', faultType);
            formData.append('faultDescription', faultDescription);
            formData.append('locationType', locationType);
            formData.append('locationDetails', JSON.stringify(locationData));

            formData.append('uploadOption', uploadOption);
            if (mediaToUpload) { // וודא ש-mediaToUpload אינו null
                formData.append('mediaFile', mediaToUpload);
            }
            formData.append('createdBy', currentUsername);
            formData.append('creatorId', currentUserId);


            console.log('נתוני דיווח מוכנים לשליחה מהלקוח:', {
                faultType,
                faultDescription,
                locationType,
                locationDetails: locationData,
                uploadOption,
                mediaFile: mediaToUpload ? mediaToUpload.name : 'אין קובץ',
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
                        // הלקוח עדיין לא יודע את הכתובת המלאה, אז נציג הודעה כללית
                        displayLocation = `מיקומך הנוכחי (הכתובת תעודכן לאחר קבלת הדיווח)`;
                    } else if (locationType === 'loc2') {
                        displayLocation = `עיר: ${cityInput.value}, רחוב: ${streetInput.value}`;
                        if (houseNumberInput.value) {
                            displayLocation += `, מס' בית: ${houseNumberInput.value}`;
                        }
                    }

                    sessionStorage.setItem('lastReportDetails', JSON.stringify({
                        faultType: faultTypeSelect.options[faultTypeSelect.selectedIndex].text,
                        faultDescription: faultDescription,
                        location: displayLocation,
                        mediaFileName: mediaToUpload ? mediaToUpload.name : 'אין קובץ', // שימוש ב-mediaToUpload
                        reportId: data.reportId || 'N/A',
                        timestamp: new Date().toISOString(),
                    }));

                    alert('הדיווח נשלח בהצלחה!');
                    // הנתיב: מהשורש הסטטי (client/) לתיקיית html/ ואז לקובץ reportReceivedPage.html
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

    // --- Cleanup: Ensure camera is stopped if user navigates away or closes tab ---
    window.addEventListener('beforeunload', () => {
        stopCamera();
    });
});