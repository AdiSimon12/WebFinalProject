document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    const reportSeq = urlParams.get('seq'); // המספר הסידורי שהועבר מהעמוד הקודם (אם יש)

    const reportsTitleElement = document.querySelector('.reports-title h1');
    const reportNumberDisplay = document.getElementById('reportNumberDisplay');
    const backButton = document.getElementById('backButton');

    const displayFaultType = document.getElementById('displayFaultType');
    const displayLocation = document.getElementById('displayLocation');
    const displayDate = document.getElementById('displayDate');
    const displayTime = document.getElementById('displayTime');
    const displayDescription = document.getElementById('displayDescription');
    const mediaContainer = document.getElementById('mediaContainer');

    const editStatus = document.getElementById('editStatus');
    const editMunicipalityResponse = document.getElementById('editMunicipalityResponse');

    const saveChangesButton = document.getElementById('saveChangesButton');
    const cancelChangesButton = document.getElementById('cancelChangesButton');

    let currentReport = null;

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

        let locationText = '';
        if (report.location) {
            if (report.location.city) locationText += report.location.city;
            if (report.location.street) locationText += `, ${report.location.street}`;
            if (report.location.houseNumber) locationText += ` ${report.location.houseNumber}`;
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

        editStatus.value = report.status || 'in-progress';
        editMunicipalityResponse.value = report.municipalityResponse || '';
    }

    if (!reportId) {
        reportsTitleElement.textContent = 'שגיאה: ID דיווח חסר';
        console.error('Report ID is missing from the URL.');
        return;
    }

    // הצגת הכותרת עם מספר סידורי או 4 ספרות אחרונות של ה-ID
    if (reportSeq) {
        reportsTitleElement.textContent = `דיווח #${reportSeq}`;
        if (reportNumberDisplay) reportNumberDisplay.textContent = reportSeq;
    } else {
        reportsTitleElement.textContent = `דיווח #${reportId.slice(-4)}`;
        if (reportNumberDisplay) reportNumberDisplay.textContent = reportId.slice(-4);
    }

    const user = getLoggedInUser();
    if (!user || user.userType !== 'employee') {
        alert('אין לך הרשאה לערוך דיווחים.');
        window.location.href = '../html/login.html';
        return;
    }

    currentReport = await fetchReportDetails(reportId);
    if (currentReport) {
        populateReportData(currentReport);
    } else {
        reportsTitleElement.textContent = 'שגיאה בטעינת דיווח';
        document.querySelector('main').innerHTML = '<p style="color: red; text-align: center;">הדיווח לא נמצא או אירעה שגיאה בטעינה.</p>';
        saveChangesButton.style.display = 'none';
        cancelChangesButton.style.display = 'none';
    }

    saveChangesButton.addEventListener('click', async () => {
        const updatedData = {
            status: editStatus.value,
            municipalityResponse: editMunicipalityResponse.value
        };

        const result = await updateReport(reportId, updatedData);
        if (result) {
            alert('השינויים נשמרו בהצלחה!');
            window.location.href = '/html/finalReportPage.html';
        }
    });

    cancelChangesButton.addEventListener('click', () => {
        if (currentReport) {
            populateReportData(currentReport);
        }
        alert('השינויים בוטלו.');
    });

    if (backButton) {
        backButton.addEventListener('click', e => {
            e.preventDefault();
            window.history.back();
        });
    }
});
