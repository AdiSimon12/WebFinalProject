document.addEventListener('DOMContentLoaded', () => {
    // Get HTML elements where report details will be displayed
    const displayFaultType = document.getElementById('displayFaultType');
    const displayLocation = document.getElementById('displayLocation');
    const displayDate = document.getElementById('displayDate');
    const displayTime = document.getElementById('displayTime');
    const displayDescription = document.getElementById('displayDescription');
    const displayMedia = document.getElementById('displayMedia');
    const mediaPreview = document.getElementById('mediaPreview');

    // Get buttons
    const goToMyReportsBtn = document.getElementById('goToMyReportsBtn');
    const goToHomeBtn = document.getElementById('goToHomeBtn');

    // Load report details from sessionStorage
    const lastReportDetails = JSON.parse(sessionStorage.getItem('lastReportDetails'));

    if (lastReportDetails) {
        console.log('Last report details found:', lastReportDetails);

        // Display fault type
        displayFaultType.textContent = lastReportDetails.faultType || 'לא ידוע';

        // Display location
        displayLocation.textContent = lastReportDetails.location || 'לא ידוע';

        // Parse date and time
        if (lastReportDetails.timestamp) {
            const date = new Date(lastReportDetails.timestamp);

            // Populate date and time within "Report Details"
            displayDate.textContent = date.toLocaleDateString('he-IL'); // Israeli date format
            displayTime.textContent = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }); // Israeli time format

        } else {
            displayDate.textContent = 'לא ידוע';
            displayTime.textContent = 'לא ידוע';
        }

        // Display fault description (if exists)
        displayDescription.textContent = lastReportDetails.faultDescription || 'אין תיאור';

        // Display media file
        if (lastReportDetails.mediaFileName && lastReportDetails.mediaFileName !== 'אין קובץ') {
            displayMedia.textContent = lastReportDetails.mediaFileName;

            // *** IMPORTANT: Replace 'https://your-backend-app-name.railway.app' with the actual public URL of your Backend on Railway ***
            const mediaUrl = `https://webfinalproject-j4tc.onrender.com/uploads/${lastReportDetails.mediaFileName}`; // Changed this line to use the Railway backend URL
            const fileExtension = lastReportDetails.mediaFileName.split('.').pop().toLowerCase();

            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                mediaPreview.src = mediaUrl;
                mediaPreview.style.display = 'block'; // Show the image
            } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                const videoElement = document.createElement('video');
                videoElement.controls = true;
                videoElement.src = mediaUrl;
                videoElement.classList.add('uploaded-media-preview');
                displayMedia.appendChild(videoElement);
                mediaPreview.style.display = 'none'; // Hide the <img> element
            } else {
                mediaPreview.style.display = 'none';
            }
        } else {
            displayMedia.textContent = 'אין קובץ מצורף';
            mediaPreview.style.display = 'none';
        }

    } else {
        // If no data in sessionStorage (e.g., user navigated directly to the page)
        console.warn('No recent report details found in sessionStorage.');
        displayFaultType.textContent = 'אין נתונים';
        displayLocation.textContent = 'אין נתונים';
        displayDate.textContent = 'אין נתונים';
        displayTime.textContent = 'אין נתונים';
        displayDescription.textContent = 'אין נתונים';
        displayMedia.textContent = 'אין נתונים';
        mediaPreview.style.display = 'none';
    }

    // --- Button handling ---
    if (goToMyReportsBtn) {
        goToMyReportsBtn.addEventListener('click', () => {
            window.location.href = '/html/myReportsPage.html';
        });
    }

    if (goToHomeBtn) {
        goToHomeBtn.addEventListener('click', () => {
            window.location.href = '/html/homePageCitizen.html';
        });
    }
});