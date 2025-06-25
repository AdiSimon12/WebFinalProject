document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Defining HTML elements ---
    const backButton = document.getElementById('backButton');
    const reportForm = document.querySelector('.report-form');

    // Fault type elements
    const faultTypeSelect = document.getElementById('fault-type');
    const faultDescriptionTextarea = document.getElementById('fault-description');
    const faultDescriptionOptionalIndicator = document.querySelector('label[for="fault-description"] .optional-indicator');
    const faultDescriptionRequiredIndicator = document.querySelector('label[for="fault-description"] .required-indicator');
    const faultDescriptionValidationIconContainer = document.querySelector('label[for="fault-description"] .validation-icon-container');
    const faultTypeStatusIcon = faultTypeSelect.closest('.input-container').querySelector('.asterisk');
    const faultDescriptionStatusIcon = faultDescriptionTextarea.closest('.frame-textarea').querySelector('.validation-icon');


    // Location elements
    const locationSelect = document.getElementById('location');
    const manualAddressSection = document.getElementById('manualAddressSection');
    const cityInput = document.getElementById('cityInput');
    const streetInput = document.getElementById('streetInput');
    const houseNumberInput = document.getElementById('houseNumberInput'); // Corrected typo here
    const locationStatusIcon = locationSelect.closest('.input-container').querySelector('.asterisk');
    const cityStatusIcon = cityInput.closest('.input-container').querySelector('.asterisk');
    const streetStatusIcon = streetInput.closest('.input-container').querySelector('.asterisk');


    // Media upload elements
    const uploadSelect = document.getElementById('upload');
    const mediaUploadSection = document.getElementById('mediaUploadSection');
    const mediaFileInput = document.getElementById('media-file');
    const uploadStatusIcon = uploadSelect.closest('.input-container').querySelector('.asterisk');
    // **New:** Reference to the asterisk icon for media file input
    const mediaFileStatusIcon = mediaFileInput.closest('.input-container').querySelector('.asterisk');


    // Camera elements
    const video = document.getElementById('cameraPreview');
    const captureButton = document.getElementById('capture');
    const canvas = document.getElementById('canvas');
    let capturedBlob = null;
    let stream = null;

    // Variables for location and address
    let currentLat = null;
    let currentLon = null;
    let locationString = ''; // Full address from geocoding

    // User info from sessionStorage
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    let currentUsername = 'Anonymous';
    let currentUserId = 'anonymous';

    if (loggedInUser) {
        currentUsername = loggedInUser.username;
        currentUserId = loggedInUser.userId;
        console.log('Logged-in user:', currentUsername, 'ID:', currentUserId);
    } else {
        console.warn('No user logged in to sessionStorage.');
        alert('שגיאה: משתמש לא מחובר. אנא התחבר שוב.');
        window.location.href = '../index.html';
    }

    // Back button handler
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '/html/homePageCitizen.html';
        });
    }

    // --- Path constants for icons ---
    const V_ICON_PATH = '../images/v_icon.svg'; // Path to the checkmark icon
    const ASTERISK_ICON_PATH = '../images/asterisk.svg'; // Path to the asterisk icon

    // --- Function to update icon based on input/selection ---
    function updateStatusIcon(inputElement, iconElement) {
        if (!iconElement) return; // Add a check to ensure the icon element exists

        if (inputElement.tagName === 'SELECT') {
            if (inputElement.value !== '') {
                iconElement.src = V_ICON_PATH;
            } else {
                iconElement.src = ASTERISK_ICON_PATH;
            }
        } else if (inputElement.type === 'file') { // **New:** Special handling for file input
            if (inputElement.files.length > 0) {
                iconElement.src = V_ICON_PATH;
            } else {
                iconElement.src = ASTERISK_ICON_PATH;
            }
        }
        else { // Assumes textarea or text input
            if (inputElement.value.trim() !== '') {
                iconElement.src = V_ICON_PATH;
            } else {
                iconElement.src = ASTERISK_ICON_PATH;
            }
        }
    }

    // Update fault description requirement and icon
    function updateFaultDescriptionRequirement() {
        const selectedFaultType = faultTypeSelect.value;
        if (selectedFaultType === 'type4') {
            faultDescriptionTextarea.setAttribute('required', 'true');
            if (faultDescriptionOptionalIndicator) faultDescriptionOptionalIndicator.style.display = 'none';
            if (faultDescriptionRequiredIndicator) faultDescriptionRequiredIndicator.style.display = 'inline';
            if (faultDescriptionValidationIconContainer) faultDescriptionValidationIconContainer.style.display = 'inline-block';
        } else {
            faultDescriptionTextarea.removeAttribute('required');
            if (faultDescriptionOptionalIndicator) faultDescriptionOptionalIndicator.style.display = 'inline';
            if (faultDescriptionRequiredIndicator) faultDescriptionRequiredIndicator.style.display = 'none';
            if (faultDescriptionValidationIconContainer) faultDescriptionValidationIconContainer.style.display = 'none';
            faultDescriptionTextarea.value = '';
        }
        updateStatusIcon(faultTypeSelect, faultTypeStatusIcon); // Update fault type icon
        updateStatusIcon(faultDescriptionTextarea, faultDescriptionStatusIcon); // Update fault description icon
    }

    // Handle location selection and related icons
    function handleLocationSelection() {
        const selectedLocationType = locationSelect.value;

        if (selectedLocationType === 'loc2') { // Manual location entry
            manualAddressSection.style.display = 'block';
            cityInput.setAttribute('required', 'true');
            streetInput.setAttribute('required', 'true');

            // Set initial asterisk for city and street when section opens
            updateStatusIcon(cityInput, cityStatusIcon);
            updateStatusIcon(streetInput, streetStatusIcon);

            currentLat = null;
            currentLon = null;
            locationString = '';
        } else if (selectedLocationType === 'loc1') { // Current location
            manualAddressSection.style.display = 'none';
            cityInput.removeAttribute('required');
            cityInput.value = '';
            streetInput.removeAttribute('required');
            streetInput.value = '';
            houseNumberInput.value = '';

            // Reset icons for city and street when manual section hides
            if (cityStatusIcon) cityStatusIcon.src = ASTERISK_ICON_PATH;
            if (streetStatusIcon) streetStatusIcon.src = ASTERISK_ICON_PATH;

            getCurrentLocation();
        } else { // Default (nothing selected)
            manualAddressSection.style.display = 'none';
            cityInput.removeAttribute('required');
            cityInput.value = '';
            streetInput.removeAttribute('required');
            streetInput.value = '';
            houseNumberInput.value = '';

            // Reset icons for city and street
            if (cityStatusIcon) cityStatusIcon.src = ASTERISK_ICON_PATH;
            if (streetStatusIcon) streetStatusIcon.src = ASTERISK_ICON_PATH;

            currentLat = null;
            currentLon = null;
            locationString = '';
        }
        updateStatusIcon(locationSelect, locationStatusIcon); // Update location select icon
    }

    // Get current location and convert to address using Google Geocoding API
    async function getCurrentLocation() {
        if (!navigator.geolocation) {
            alert("Your browser does not support Geolocation. Please use the 'Manual location entry' option.");
            locationSelect.value = 'loc2';
            handleLocationSelection();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                console.log(`Current Location: Lat ${currentLat}, Lon ${currentLon}`);

                try {
                    const apiKey = 'AIzaSyBnRHLdYCyHCyCZA30LeDv468lFXEvgbvA';
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${currentLat},${currentLon}&key=${apiKey}`);
                    const data = await response.json();

                    if (data.status === 'OK' && data.results.length > 0) {
                        locationString = data.results[0].formatted_address;
                        console.log("Resolved address:", locationString);
                        alert(`Location detected: ${locationString}`);
                    } else {
                        locationString = `Lat: ${currentLat}, Lon: ${currentLon}`;
                        alert("Location detected, but could not convert to full address.");
                    }
                } catch (err) {
                    console.error("Geocoding error:", err);
                    locationString = `Lat: ${currentLat}, Lon: ${currentLon}`;
                    alert("Location detected, but failed to get full address.");
                }
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
                locationSelect.value = '';
                handleLocationSelection(); // This will reset location data and icons
                currentLat = null;
                currentLon = null;
                locationString = '';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // Media upload handling and camera code
    function updateMediaUploadVisibility() {
        const selectedUploadOption = uploadSelect.value;
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

        // Hide the captured image preview
        const existingPreview = document.getElementById('capturedImagePreview');
        if (existingPreview) {
            existingPreview.remove();
        }
        capturedBlob = null; // Also reset the captured blob
        // **New:** Reset media file icon when hiding the section or changing option
        updateStatusIcon(mediaFileInput, mediaFileStatusIcon); // Ensure the asterisk is shown


        if (selectedUploadOption === 'option1') { // If "Camera" is selected
            mediaUploadSection.style.display = 'none'; // Hide file input field
            mediaFileInput.removeAttribute('required'); // Ensure file field is not required

            video.style.display = 'block';
            captureButton.style.display = 'inline-block'; // Note inline-block
            startCamera(); // Start the camera

        } else if (selectedUploadOption === 'option2') { // If "Photo library" is selected
            mediaUploadSection.style.display = 'block';
            mediaFileInput.setAttribute('required', 'true');
            mediaFileInput.setAttribute('accept', 'image/*,video/*'); // Accept images and videos
            mediaFileInput.removeAttribute('capture'); // Do not hint for camera, allow file selection
            mediaFileInput.value = ''; // Clear previous selection if any
            // Initial call for the file input icon when the section becomes visible
            updateStatusIcon(mediaFileInput, mediaFileStatusIcon); // **New**

        } else { // Default (or nothing selected)
            // Already handled by hiding everything and turning off the camera at the beginning of the function
        }
        console.log('Media file field required:', mediaFileInput.hasAttribute('required'));
        updateStatusIcon(uploadSelect, uploadStatusIcon); // Update upload icon
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

    // --- Handle capture button ---
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
                const img = document.createElement('img');
                img.src = URL.createObjectURL(blob);
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.marginTop = '10px';
                const existingPreview = document.getElementById('capturedImagePreview');
                if (existingPreview) {
                    existingPreview.src = img.src;
                } else {
                    img.id = 'capturedImagePreview';
                    captureButton.parentNode.insertBefore(img, captureButton.nextSibling);
                }
                stopCamera();
                video.style.display = 'none';
                captureButton.style.display = 'none';
                // **New:** When an image is captured, treat it as a valid selection for the media file input
                // This will make the mediaFileStatusIcon change to V_ICON_PATH
                updateStatusIcon({ type: 'file', files: [capturedBlob] }, mediaFileStatusIcon); // Simulate a file selection
            }, 'image/jpeg');
        });
    }

    // --- Event listeners ---
    if (faultTypeSelect) {
        faultTypeSelect.addEventListener('change', updateFaultDescriptionRequirement);
        updateFaultDescriptionRequirement(); // Initial call
    }
    // New: Event listener for fault description textarea
    if (faultDescriptionTextarea) {
        faultDescriptionTextarea.addEventListener('input', () => {
            updateStatusIcon(faultDescriptionTextarea, faultDescriptionStatusIcon);
        });
        updateStatusIcon(faultDescriptionTextarea, faultDescriptionStatusIcon); // Initial call
    }

    if (locationSelect) {
        locationSelect.addEventListener('change', handleLocationSelection);
        handleLocationSelection(); // Initial call
    }
    // New: Event listeners for city and street inputs
    if (cityInput) {
        cityInput.addEventListener('input', () => {
            updateStatusIcon(cityInput, cityStatusIcon);
        });
        // Initial call only if manualAddressSection is visible on load (unlikely, but for consistency)
        // This will be handled by handleLocationSelection() when loc2 is chosen.
    }
    if (streetInput) {
        streetInput.addEventListener('input', () => {
            updateStatusIcon(streetInput, streetStatusIcon);
        });
        // Initial call similar to cityInput
    }

    if (uploadSelect) {
        uploadSelect.addEventListener('change', updateMediaUploadVisibility);
        updateMediaUploadVisibility(); // Initial call
    }
    // **New:** Event listener for mediaFileInput
    if (mediaFileInput) {
        mediaFileInput.addEventListener('change', () => {
            updateStatusIcon(mediaFileInput, mediaFileStatusIcon);
        });
        // Initial call for file input, ensuring asterisk is there if no file is selected
        updateStatusIcon(mediaFileInput, mediaFileStatusIcon);
    }


    if (reportForm) {
        reportForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!reportForm.checkValidity()) {
                alert('Please fill in all required fields.');
                reportForm.reportValidity();
                return;
            }

            const faultType = faultTypeSelect.options[faultTypeSelect.selectedIndex].text;
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
                    longitude: currentLon,
                    address: locationString || ''
                };
            } else {
                alert('Please select a location type.');
                return;
            }

            const uploadOption = uploadSelect.value;
            let mediaToUpload = null;

            if (uploadOption === 'option1') {
                if (capturedBlob) {
                    mediaToUpload = new File([capturedBlob], 'captured_image.jpeg', { type: 'image/jpeg' });
                } else {
                    alert('לא צולמה תמונה. אנא צלם תמונה או בחר באפשרות אחרת.');
                    return;
                }
            } else if (uploadOption === 'option2') {
                if (mediaFileInput.files.length > 0) {
                    mediaToUpload = mediaFileInput.files[0];
                } else {
                    alert('אנא בחר קובץ תמונה/וידאו מספריית המדיה שלך.');
                    return;
                }
            } else {
                alert('אנא בחר אפשרות להעלאת מדיה (מצלמה או ספריית תמונות).');
                return;
            }

            const formData = new FormData();
            formData.append('faultType', faultType);
            formData.append('faultDescription', faultDescription);
            formData.append('locationType', locationType);
            formData.append('locationDetails', JSON.stringify(locationData));
            formData.append('uploadOption', uploadOption);
            if (mediaToUpload) {
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
                const res = await fetch('https://webfinalproject-j4tc.onrender.com/api/reports', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (res.ok) {
                    console.log('Report submitted successfully:', data.message);

                    let displayLocation = '';
                    if (locationType === 'loc1') {
                        displayLocation = locationString || `Your current location (lat: ${currentLat}, lon: ${currentLon})`;
                    } else if (locationType === 'loc2') {
                        displayLocation = `עיר: ${cityInput.value}, רחוב: ${streetInput.value},`;
                        if (houseNumberInput.value) {
                            displayLocation += `מספר בית: ${houseNumberInput.value}`;
                        }
                    }

                    sessionStorage.setItem('lastReportDetails', JSON.stringify({
                        faultType: faultTypeSelect.options[faultTypeSelect.selectedIndex].text,
                        faultDescription,
                        location: displayLocation,
                        mediaFileName: data.mediaFileNameOnServer || 'No file',
                        reportId: data.reportId || 'N/A',
                        timestamp: new Date().toISOString(),
                    }));

                    alert('Report submitted successfully!');
                    window.location.href = '/html/reportReceivedPage.html';
                } else {
                    alert(data.message || 'Error submitting report: ' + (data.error || 'An error occurred.'));
                    console.error('Report submission failed:', data.error || 'Unknown error');
                }
            } catch (err) {
                alert('An error occurred connecting to the server when submitting the report. Please try again later.');
                console.error('Fetch error:', err);
            }
        });
    }

    // Cleanup camera on unload
    window.addEventListener('beforeunload', () => {
        stopCamera();
    });
});