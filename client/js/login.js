document.addEventListener('DOMContentLoaded', () => {
  const loginForm     = document.querySelector('.login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const selectedUserType = localStorage.getItem('selectedUserType');

  const API_BASE_LOGIN = 'https://webfinalproject-j4tc.onrender.com/api/login';

  console.log('Selected user type on the login page:', selectedUserType);

  if (!loginForm) {
    console.warn("טופס התחברות לא נמצא. וודא שקיים אלמנט עם class 'login-form'.");
    return;
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      alert('אנא הזן שם משתמש וסיסמה.');
      return;
    }
    if (!selectedUserType) {
      alert('שגיאה: סוג משתמש לא נבחר. אנא חזור לדף הבחירה.');
      console.error('selectedUserType הוא null או undefined.');
      return;
    }

    try {
      const res  = await fetch(API_BASE_LOGIN, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ username, password, userType: selectedUserType })
      });
      const data = await res.json();
      console.log('Full server response:', data);

      if (!res.ok) {
        alert(data.error || 'שגיאת התחברות: שם משתמש או סיסמה שגויים.');
        console.error('התחברות נכשלה מהשרת:', data.error || 'שגיאה לא ידועה');
        return;
      }

      console.log('Login successful:', data.message);
      console.log('User data from server:', data.user);

      // --- בדיקת השדות ---
      if (!data.user) {
        console.warn('התשובה מהשרת חסרה עטיפה user.');
      } else {
        const { username, userId, userType, city } = data.user;

        const hasCoreFields = username && userId && userType;
        const needsCity     = (userType || '').toLowerCase() === 'employee';
        const hasCity       = city !== undefined && city !== null && city !== '';

        if (hasCoreFields && (!needsCity || hasCity)) {
          // שמירה בלוקל סטורג'
          localStorage.setItem('loggedInUser', JSON.stringify({
            username,
            userId,
            userType,
            city: city || null
          }));
          console.log('User data saved to localStorage:', localStorage.getItem('loggedInUser'));
        } else {
          console.warn('התשובה מהשרת חסרה נתוני משתמש צפויים.');
        }
      }

      alert('התחברת בהצלחה!');
      setTimeout(() => {
        if (selectedUserType === 'citizen') {
          window.location.href = '/html/homePageCitizen.html';
        } else if (selectedUserType === 'employee') {
          window.location.href = '/html/homePageEmployee.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 500);

    } catch (err) {
      alert('אירעה שגיאה בחיבור לשרת. אנא נסה שוב מאוחר יותר.');
      console.error('שגיאת Fetch:', err);
    }
  });
});
