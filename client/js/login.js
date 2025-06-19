document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    // חשוב: נניח ש-selectedUserType נשמר ב-localStorage בדף הקודם (לדוגמה, דף הבחירה בין אזרח לעובד)
    const selectedUserType = localStorage.getItem('selectedUserType'); 

    // הגדרת ה-API BASE לנקודת הקצה של הלוגין בשרת
    const API_BASE_LOGIN = 'http://localhost:3000/login';

    console.log('סוג משתמש שנבחר בדף הקודם (בדף לוגין):', selectedUserType); 

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                alert('אנא הכנס שם משתמש וסיסמה.');
                return;
            }

            // לוודא ש-selectedUserType אכן קיים
            if (!selectedUserType) {
                alert('שגיאה: סוג משתמש לא נבחר. אנא חזור לדף הבחירה.');
                console.error('Error: selectedUserType is null or undefined.');
                return;
            }

            try {
                const res = await fetch(API_BASE_LOGIN, { // שימוש ב-API_BASE_LOGIN
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, userType: selectedUserType }) 
                });

                const data = await res.json(); // קריאת ה-JSON מהתגובה

                if (res.ok) { 
                    console.log('Login successful:', data.message);
                    console.log('User data from server:', data.user);

                    // **שמירת פרטי המשתמש ב-sessionStorage**
                    // השרת אמור להחזיר אובייקט `user` עם `username`, `userType`, ו-`userId`.
                    if (data.user && data.user.username && data.user.userId && data.user.userType) {
                        sessionStorage.setItem('loggedInUser', JSON.stringify({
                            username: data.user.username,
                            userId: data.user.userId,
                            userType: data.user.userType
                        }));
                        console.log('User data saved to sessionStorage.');
                    } else {
                        console.warn('Server response missing expected user data (username, userId, userType).');
                        // למרות שהלוגין הצליח, אם חסרים נתונים, עדיף להתריע.
                    }
                    

                    // ניתוב לפי סוג המשתמש (נתיבים מוחלטים)
                    // ייתכן שתרצה להוסיף setTimeout כדי לאפשר למשתמש לראות את ה-alert
                    setTimeout(() => {
                        if (selectedUserType === 'citizen') {
                            window.location.href = '/html/homePageCitizen.html'; // נתיב מוחלט
                        } else if (selectedUserType === 'employee') {
                            window.location.href = '/html/homePageEmployee.html'; // נתיב מוחלט
                        } else {
                            console.warn('Unknown user type, redirecting to general home page.');
                            window.location.href = '/html/homePageGeneral.html'; // נתיב מוחלט
                        }
                    }, 500); // השהייה קצרה כדי שהודעת ה-alert תופיע
                } else {
                    // אם res.ok הוא false (לדוגמה, סטטוס 401 או 500)
                    alert(data.error || 'שגיאה בהתחברות: שם משתמש או סיסמה שגויים.'); 
                    console.error('Login failed from server:', data.error || 'Unknown error');
                }
            } catch (err) {
                // שגיאות רשת או בעיות ב-fetch API עצמו
                alert('אירעה שגיאה בחיבור לשרת. אנא נסה שנית מאוחר יותר.'); 
                console.error('Fetch error:', err);
            }
        });
    } else {
        console.warn("Login form not found. Ensure element with class 'login-form' exists.");
    }
});