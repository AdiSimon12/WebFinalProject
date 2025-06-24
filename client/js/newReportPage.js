document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Defining HTML elements ---
    const backButton = document.getElementById('backButton');
    const reportForm = document.querySelector('.report-form');

    // Fields related to fault type
    const faultTypeSelect = document.getElementById('fault-type');
    const faultDescriptionTextarea = document.getElementById('fault-description');
    const faultDescriptionLabelOptional = document.querySelector('label[for="fault-description"] .optional');
    // --- Change: Reference to the asterisk container (avoid the old required) ---
    const faultDescriptionAsteriskContainer = document.querySelector('label[for="fault-description"] .required-asterisk-container');


    // Fields related to location
    const locationSelect = document.getElementById('location');
    const manualAddressSection = document.getElementById('manualAddressSection');
    const cityInput = document.getElementById('cityInput');
    const streetInput = document.getElementById('streetInput');
    const houseNumberInput = document.getElementById('houseNumberInput');

    // Fields related to media upload
    const uploadSelect = document.getElementById('upload');
    const mediaUploadSection = document.getElementById('mediaUploadSection');
    const mediaFileInput = document.getElementById('media-file');

    // --- Addition: New elements related to the camera ---
    const video = document.getElementById('cameraPreview');
    const captureButton = document.getElementById('capture');
    const canvas = document.getElementById('canvas');
    let capturedBlob = null; // Will store the image file captured from the camera
    let stream = null; // Will store the active camera stream


    // Variables for temporary data storage
    let selectedFaultType = '';
    let selectedLocationType = '';
    let selectedUploadOption = '';

    // Variables for storing current location (latitude and longitude)
    let currentLat = null;
    let currentLon = null;

    // Get user details from sessionStorage
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    let currentUsername = 'Anonymous'; // Default
    let currentUserId = 'anonymous'; // Default

    if (loggedInUser) {
        currentUsername = loggedInUser.username;
        currentUserId = loggedInUser.userId;
        console.log('Logged-in user:', currentUsername, 'ID:', currentUserId);
    } else {
        console.warn('No user logged in to sessionStorage.');
    }

    // --- 2. Handle back arrow button ---
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            // Path: from the static root (client/) to the html/ folder and then to homePageCitizen.html
            window.location.href = '/html/homePageCitizen.html';
        });
    } else {
        console.warn("Element with ID 'backButton' not found. Cannot attach click listener.");
    }

    // --- 3. Function to update the status of the "Fault Description" field ---
    function updateFaultDescriptionRequirement() {
        selectedFaultType = faultTypeSelect.value;

        if (selectedFaultType === 'type4') { // If "Other" option is selected
            faultDescriptionTextarea.setAttribute('required', 'true');
            if (faultDescriptionLabelOptional) {
                faultDescriptionLabelOptional.style.display = 'none';
            }
            // --- Change: Show the asterisk container ---
            if (faultDescriptionAsteriskContainer) {
                faultDescriptionAsteriskContainer.style.display = 'inline-block';
            }
        } else {
            faultDescriptionTextarea.removeAttribute('required');
            if (faultDescriptionLabelOptional) {
                faultDescriptionLabelOptional.style.display = 'inline';
            }
            // --- Change: Hide the asterisk container ---
            if (faultDescriptionAsteriskContainer) {
                faultDescriptionAsteriskContainer.style.display = 'none';
            }
            faultDescriptionTextarea.value = '';
        }
        console.log('Selected fault type:', selectedFaultType);
        console.log('Fault description is required:', faultDescriptionTextarea.hasAttribute('required'));
    }

    // --- 4. Function to handle location selection ---
    function handleLocationSelection() {
        selectedLocationType = locationSelect.value;
        console.log('Selected location type:', selectedLocationType);

        if (selectedLocationType === 'loc2') { // If "Manual location entry" is selected
            manualAddressSection.style.display = 'block';
            cityInput.setAttribute('required', 'true');
            streetInput.setAttribute('required', 'true');
            // --- Change: House number remains optional, no need to remove required as it wasn't added in HTML ---
            // houseNumberInput.removeAttribute('required'); 

            // Ensure current location data is reset when switching to manual
            currentLat = null;
            currentLon = null;

        } else if (selectedLocationType === 'loc1') { // If "Current location" is selected
            manualAddressSection.style.display = 'none'; // Hide manual address fields
            // Clear manual address fields
            cityInput.removeAttribute('required');
            cityInput.value = '';
            streetInput.removeAttribute('required');
            streetInput.value = '';
            // --- Change: House number remains optional, no need to remove required as it wasn't added in HTML ---
            // houseNumberInput.removeAttribute('required');
            houseNumberInput.value = '';

            // **Call the function to detect current location**
            getCurrentLocation();

        } else { // Default or empty selection
            manualAddressSection.style.display = 'none';
            cityInput.removeAttribute('required');
            cityInput.value = '';
            streetInput.removeAttribute('required');
            streetInput.value = '';
            // --- Change: House number remains optional, no need to remove required as it wasn't added in HTML ---
            // houseNumberInput.removeAttribute('required');
            houseNumberInput.value = '';
            currentLat = null; // Also reset here
            currentLon = null;
        }
    }

    // **Function: Detect current location using Geolocation API (without external service)**
    function getCurrentLocation() {
        if (navigator.geolocation) {
            console.log("Geolocation is supported by this browser.");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentLat = position.coords.latitude;
                    currentLon = position.coords.longitude;
                    console.log(`Current Location: Lat ${currentLat}, Lon ${currentLon}`);
                    alert(`Location successfully detected. The system will convert it to a full address.`);
                },
                (error) => {
                    console.error("Error getting current location:", error);
                    let errorMessage = "An error occurred while detecting the location.";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "User denied the request for Geolocation. Please allow access to location in browser settings.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "The request to get location timed out.";
                            break;
                        case error.UNKNOWN_ERROR:
                            errorMessage = "An unknown error occurred while detecting location.";
                            break;
                    }
                    alert(errorMessage);
                    // In case of an error, reset the location selection to empty or manual location
                    locationSelect.value = '';
                    handleLocationSelection(); // Call again to reset visual state and requirements
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
            alert("Your browser does not support Geolocation. Please use the 'Manual location entry' option.");
            locationSelect.value = 'loc2';
            handleLocationSelection();
        }
    }

    // --- 5. Function to handle media upload selection (updated for camera) ---
    function updateMediaUploadVisibility() {
        selectedUploadOption = uploadSelect.value;
        console.log('Upload option selected:', selectedUploadOption);

        // Hide everything first
        mediaUploadSection.style.display = 'none';
        mediaFileInput.removeAttribute('required');
        mediaFileInput.removeAttribute('accept');
        mediaFileInput.removeAttribute('capture');
        mediaFileInput.value = ''; // Clear previous selection
        video.style.display = 'none';
        captureButton.style.display = 'none';
        stopCamera(); // Ensure camera is off
        // --- Addition: Hide the captured image preview ---
        const existingPreview = document.getElementById('capturedImagePreview');
        if (existingPreview) {
            existingPreview.remove();
        }
        capturedBlob = null; // Also reset the captured blob

        if (selectedUploadOption === 'option1') { // If "Camera" is selected
            if (isDesktop()) { // For desktop, use <video> element and capture button
                mediaUploadSection.style.display = 'none'; // Hide file input field
                mediaFileInput.removeAttribute('required'); // Ensure file field is not required
                video.style.display = 'block';
                captureButton.style.display = 'inline-block'; // Note inline-block
                startCamera(); // Start the camera
            } else { // For mobile, use input type="file" with capture
                mediaUploadSection.style.display = 'block';
                mediaFileInput.setAttribute('required', 'true');
                mediaFileInput.setAttribute('accept', 'image/*,video/*'); // Accept images and videos
                mediaFileInput.setAttribute('capture', 'environment'); // Hint to open rear camera
                mediaFileInput.value = ''; // Clear previous selection if any
            }

        } else if (selectedUploadOption === 'option2') { // If "Photo library" is selected
            mediaUploadSection.style.display = 'block';
            mediaFileInput.setAttribute('required', 'true');
            mediaFileInput.setAttribute('accept', 'image/*,video/*'); // Accept images and videos
            mediaFileInput.removeAttribute('capture'); // Do not hint for camera, allow file selection
            mediaFileInput.value = ''; // Clear previous selection if any

        } else { // Default (or nothing selected)
            // Already handled by hiding everything and turning off the camera at the beginning of the function
            // capturedBlob = null; // Already reset above in the function
        }
        console.log('Media file field required:', mediaFileInput.hasAttribute('required'));
    }

    // --- Addition: Camera helper functions ---
    function isDesktop() {
        return !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    }

    async function startCamera() {
        try {
            // Ensure no active stream before starting a new one
            stopCamera();
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play(); // Start playing the video
            console.log("Camera started successfully.");
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Cannot enable camera: ' + err.message + '\nPlease ensure you have a camera connected and allow access to it in your browser settings.');
            // In case of an error, perhaps reset the selection or switch to another option
            uploadSelect.value = ''; // Perhaps reset the selection
            updateMediaUploadVisibility(); // And update the display
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
        video.pause(); // Ensure video is stopped
        console.log("Camera stopped.");
    }

    // --- Addition: Handle capture button ---
    if (captureButton) {
        captureButton.addEventListener('click', () => {
            if (!stream) {
                alert('No active camera stream to capture image.');
                return;
            }
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                capturedBlob = blob;
                alert("Image successfully captured and saved for the report.");
                // Perhaps display the captured image to the user
                const img = document.createElement('img');
                img.src = URL.createObjectURL(blob);
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.marginTop = '10px';
                // Replace the capture button with a preview, or add it
                // For example, add it next to the button or above the video
                const existingPreview = document.getElementById('capturedImagePreview');
                if (existingPreview) {
                    existingPreview.src = img.src;
                } else {
                    img.id = 'capturedImagePreview';
                    captureButton.parentNode.insertBefore(img, captureButton.nextSibling);
                }

                // Can also turn off the camera or change the display
                stopCamera();
                video.style.display = 'none';
                captureButton.style.display = 'none';

            }, 'image/jpeg');
        });
    }


    // --- 6. Add event listeners for selection changes ---
    if (faultTypeSelect) {
        faultTypeSelect.addEventListener('change', updateFaultDescriptionRequirement);
        updateFaultDescriptionRequirement(); // Initial call
    }
    if (locationSelect) {
        locationSelect.addEventListener('change', handleLocationSelection);
        handleLocationSelection(); // Initial call
    }
    if (uploadSelect) {
        uploadSelect.addEventListener('change', updateMediaUploadVisibility);
        updateMediaUploadVisibility(); // Initial call of the function on page load
    }

    // --- 7. Handle form submission ---
    if (reportForm) {
        reportForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!reportForm.checkValidity()) {
                alert('Please fill in all required fields.');
                // Add logic to display errors to the user more clearly
                reportForm.reportValidity(); // Displays built-in browser error messages
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
                    alert('Cannot submit the report. Current location was not detected. Please try again or choose manual location.');
                    return;
                }
                locationData = {
                    type: 'current',
                    latitude: currentLat,
                    longitude: currentLon
                };
            } else {
                alert('Please select a location type.');
                return;
            }

            const uploadOption = uploadSelect.value;
            let mediaToUpload = null;

            // --- Change: Handle media file based on upload option ---
            if (uploadOption === 'option1' && isDesktop()) { // If camera selected and on desktop
                if (capturedBlob) {
                    mediaToUpload = new File([capturedBlob], 'captured_image.jpeg', { type: 'image/jpeg' });
                    console.log("Captured blob will be uploaded.");
                } else {
                    alert('No image captured. Please capture an image or choose another option.');
                    return;
                }
            } else if (uploadOption === 'option1' || uploadOption === 'option2') { // If camera selected on mobile or photo library
                if (mediaFileInput.files.length > 0) {
                    mediaToUpload = mediaFileInput.files[0];
                    console.log("Selected media file will be uploaded:", mediaToUpload.name);
                } else {
                    alert('Please select an image/video file.');
                    return;
                }
            }


            const formData = new FormData();
            formData.append('faultType', faultType);
            formData.append('faultDescription', faultDescription);
            formData.append('locationType', locationType);
            formData.append('locationDetails', JSON.stringify(locationData));

            formData.append('uploadOption', uploadOption);
            if (mediaToUpload) { // Ensure mediaToUpload is not null
                formData.append('mediaFile', mediaToUpload);
            }
            formData.append('createdBy', currentUsername);
            formData.append('creatorId', currentUserId);


            console.log('Report data ready for client submission:', {
                faultType,
                faultDescription,
                locationType,
                locationDetails: locationData,
                uploadOption,
                mediaFile: mediaToUpload ? mediaToUpload.name : 'No file',
                createdBy: currentUsername,
                creatorId: currentUserId
            });


            try {
                // *** IMPORTANT: Replace 'https://your-backend-app-name.railway.app' with the actual public URL of your Backend on Railway ***
                const res = await fetch('https://webfinalproject-j4tc.onrender.com/api/reports', { // Changed this line
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (res.ok) {
                    console.log('Report submitted successfully:', data.message);

                    let displayLocation = '';
                    if (locationType === 'loc1') {
                        // The client still doesn't know the full address, so display a general message
                        displayLocation = `Your current location (address will be updated after report reception)`;
                    } else if (locationType === 'loc2') {
                        displayLocation = `City: ${cityInput.value}, Street: ${streetInput.value}`;
                        if (houseNumberInput.value) {
                            displayLocation += `, House No: ${houseNumberInput.value}`;
                        }
                    }

                    // *** IMPORTANT: Use data.reportId as the reportId received from the server ***
                    // *** IMPORTANT: Use data.mediaFileNameOnServer for the mediaFileName, as this is the name assigned by the server ***
                    sessionStorage.setItem('lastReportDetails', JSON.stringify({
                        faultType: faultTypeSelect.options[faultTypeSelect.selectedIndex].text,
                        faultDescription: faultDescription,
                        location: displayLocation,
                        mediaFileName: data.mediaFileNameOnServer || 'No file', // Changed this line
                        reportId: data.reportId || 'N/A', // Changed this line
                        timestamp: new Date().toISOString(),
                    }));

                    alert('Report submitted successfully!');
                    // Path: from the static root (client/) to the html/ folder and then to reportReceivedPage.html
                    window.location.href = '/html/reportReceivedPage.html';
                } else {
                    alert(data.message || 'Error submitting report: ' + (data.error || 'An error occurred.'));
                    console.error('Report submission failed from server:', data.error || 'Unknown error');
                }
            } catch (err) {
                alert('An error occurred connecting to the server when submitting the report. Please try again later.');
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