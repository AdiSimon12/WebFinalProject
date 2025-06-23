document.addEventListener('DOMContentLoaded', () => {
    const profileOptions = document.querySelectorAll('.userBlock');
    const continueButton = document.querySelector('.continue-button');

    let selectedProfile = null;

    profileOptions.forEach(option => {
        option.addEventListener('click', () => {
            // הסר את הסימון (V) ואת קלאס ה-selected מכל האופציות
            profileOptions.forEach(opt => {
                opt.classList.remove('selected');
                const checkIcon = opt.querySelector('.check-icon');
                if (checkIcon) {
                    checkIcon.classList.add('hidden'); // מסתיר את ה-V
                }
            });
            // הוסף את הסימון (V) ואת קלאס ה-selected לאופציה שנלחצה
            option.classList.add('selected');
            const selectedCheckIcon = option.querySelector('.check-icon');
            if (selectedCheckIcon) {
                selectedCheckIcon.classList.remove('hidden'); // מציג את ה-V
            }
            // שמור את הפרופיל הנבחר
            selectedProfile = option.dataset.profile;
            console.log('פרופיל נבחר:', selectedProfile);
            localStorage.setItem('selectedUserType', selectedProfile); // שמור את סוג המשתמש ב-localStorage
        });
    });
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            if (selectedProfile) {
                window.location.href = '/html/loginPage.html'; 
            } else {
                alert('אנא בחר פרופיל כדי להמשיך.');
            }
        });
    }
});

    
