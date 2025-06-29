document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const selectedUserType = localStorage.getItem('selectedUserType');
    const API_BASE_LOGIN = 'https://webfinalproject-j4tc.onrender.com/api/login';
    console.log('Selected user type on the login page:', selectedUserType);
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (!username || !password) {
                alert('אנא הזן שם משתמש וסיסמה.');
                return;
            }
            if (!selectedUserType) {
                alert('שגיאה: סוג משתמש לא נבחר. אנא חזור לדף הבחירה.');
                console.error('שגיאה: selectedUserType הוא null או undefined.');
                return;
            }
            try {
                const res = await fetch(API_BASE_LOGIN, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, userType: selectedUserType })
                });
                const data = await res.json(); 
                console.log('Full server response:', data); 
                if (res.ok) { 
                    console.log('Login successful:', data.message);
                    console.log('User data from server:', data.user);         
                    if (data.user && data.user.username && data.user.userId && data.user.userType && data.user.city) {
                        localStorage.setItem('loggedInUser', JSON.stringify({
                            username: data.user.username,
                            userId: data.user.userId,
                            userType: data.user.userType,
                            city: data.user.city 
                        }));
                        console.log('User data saved to localStorage:', localStorage.getItem('loggedInUser'));
                    } else {
                        console.warn('התשובה מהשרת חסרה נתוני משתמש צפויים (שם משתמש, userId, userType, או city).');
                    }
                    alert('התחברת בהצלחה!');
                    setTimeout(() => {
                        if (selectedUserType === 'citizen') {
                            window.location.href = '/html/homePageCitizen.html';
                        } else if (selectedUserType === 'employee') {
                            // ודא הפניה לדף שבו תרצה להציג את הדיווחים הרלוונטיים לעובד
                            window.location.href = '/html/homePageEmployee.html'; 
                        } else {
                            console.warn('סוג משתמש לא ידוע, מפנה לדף הבית הכללי.');
                            window.location.href = 'index.html';
                        }
                    }, 500);
                } else {
                    alert(data.error || 'שגיאת התחברות: שם משתמש או סיסמה שגויים.');
                    console.error('התחברות נכשלה מהשרת:', data.error || 'שגיאה לא ידועה');
                }
            } catch (err) {
                alert('אירעה שגיאה בחיבור לשרת. אנא נסה שוב מאוחר יותר.');
                console.error('שגיאת Fetch:', err);
            }
        });
    } else {
        console.warn("טופס התחברות לא נמצא. וודא שקיים אלמנט עם class 'login-form'.");
    }
});