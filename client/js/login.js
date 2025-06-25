document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    // Important: Assume selectedUserType is stored in localStorage on the previous page (e.g., the user type selection page)
    const selectedUserType = localStorage.getItem('selectedUserType');

    const API_BASE_LOGIN = 'https://webfinalproject-j4tc.onrender.com/api/login'; // Changed this line

    console.log('Selected user type on the previous page (login page):', selectedUserType);

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                alert('Please enter username and password.');
                return;
            }

            // Ensure selectedUserType exists
            if (!selectedUserType) {
                alert('Error: User type not selected. Please return to the selection page.');
                console.error('Error: selectedUserType is null or undefined.');
                return;
            }

            try {
                const res = await fetch(API_BASE_LOGIN, { // Use API_BASE_LOGIN
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, userType: selectedUserType })
                });

                const data = await res.json(); // Read JSON from the response

                if (res.ok) {
                    console.log('Login successful:', data.message);
                    console.log('User data from server:', data.user);

                    // **Store user details in sessionStorage**
                    // The server should return a `user` object with `username`, `userType`
                    if (data.user && data.user.username && data.user._id && data.user.userType) {
                        sessionStorage.setItem('loggedInUser', JSON.stringify({
                            username: data.user.username,
                            userId: data.user._id,
                            userType: data.user.userType
                        }));
                        console.log('User data saved to sessionStorage.');
                        alert('Login successful!');
                    } else {
                        console.warn('Server response missing expected user data (username, _id, userType).');
                        // Although login was successful, if data is missing, it's better to warn.
                    }

                    // Redirect according to user type (absolute paths)
                    setTimeout(() => {
                        if (selectedUserType === 'citizen') {
                            window.location.href = '/html/homePageCitizen.html'; // Absolute path
                        } else if (selectedUserType === 'employee') {
                            window.location.href = '/html/homePageEmployee.html'; // Absolute path
                        } else {
                            console.warn('Unknown user type, redirecting to general home page.');
                            window.location.href = '/html/homePageGeneral.html'; // Absolute path
                        }
                    }, 500); // Short delay for the alert message to appear
                } else {
                    // If res.ok is false (e.g., status 401 or 500)
                    alert(data.error || 'Login error: Incorrect username or password.');
                    console.error('Login failed from server:', data.error || 'Unknown error');
                }
            } catch (err) {
                // Network errors or issues with the fetch API itself
                alert('An error occurred connecting to the server. Please try again later.');
                console.error('Fetch error:', err);
            }
        });
    } else {
        console.warn("Login form not found. Ensure element with class 'login-form' exists.");
    }
});