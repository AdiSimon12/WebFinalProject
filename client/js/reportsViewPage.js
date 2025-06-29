document.addEventListener('DOMContentLoaded', async () => {
    const reportsListContainer = document.querySelector('.reports-filters-container'); // המיכל הראשי לדיווחים
    const filterButtons = document.querySelectorAll('.filter-button');
    const sortDropdown = document.getElementById('sort-reports-dropdown');
    const backArrow = document.querySelector('.back-arrow');

    let allReports = []; // מערך שיאחסן את כל הדיווחים שנטענו
    let currentFilter = 'all'; // 'all', 'open', 'in-progress', 'closed'
    let currentSort = 'date-default'; // 'date-default', 'alphabetical'

    // פונקציית עזר לשליפת פרטי משתמש מה-localStorage
    function getLoggedInUser() {
        const user = localStorage.getItem('loggedInUser');
        return user ? JSON.parse(user) : null;
    }

    // פונקציה לטעינת דיווחים מהשרת
    async function fetchReports(city, status = 'all') {
        try {
            const baseUrl = 'https://webfinalproject-j4tc.onrender.com'; // ודא שזו הכתובת הנכונה של השרת שלך
            let url = `${baseUrl}/api/employee-reports?city=${encodeURIComponent(city)}`;
            
            if (status !== 'all') {
                url += `&status=${encodeURIComponent(status)}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch reports');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching reports:', error);
            alert('אירעה שגיאה בטעינת הדיווחים. אנא נסה שוב מאוחר יותר.');
            return []; // החזר מערך ריק במקרה של שגיאה
        }
    }

    // פונקציה ליצירת כרטיס דיווח HTML
    function createReportCard(report) {
        const card = document.createElement('section');
        card.classList.add('report-summary-card');

        // עיצוב תאריך ושעה
        const timestamp = report.timestamp ? new Date(report.timestamp) : null;
        const formattedDate = timestamp ? timestamp.toLocaleDateString('he-IL') : 'תאריך לא ידוע';
        const formattedTime = timestamp ? timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';

        // סטטוס לטקסט בעברית
        let statusText = '';
        switch (report.status) {
            case 'in-progress':
                statusText = 'בטיפול';
                break;
            case 'open':
                statusText = 'פתוח';
                break;
            case 'closed':
                statusText = 'נסגר';
                break;
            default:
                statusText = report.status;
        }

        card.innerHTML = `
            <section class="report-info">
                <span class="report-id-type">דיווח #${report.id.substring(report.id.length - 4)}
                <span class="report-type-name">${report.faultType}</span></span>
                <p class="report-status">סטטוס: ${statusText}</p>
                <p class="report-timestamp">תאריך: ${formattedDate} (${formattedTime})</p>
                <p class="report-location">עיר: ${report.location.city}</p>
                ${report.location.street ? `<p class="report-street">רחוב: ${report.location.street}</p>` : ''}
            </section>
            <a href="reportDetails.html?id=${report.id}" class="view-details-link">צפייה בפרטים</a>
        `;
        return card;
    }

    // פונקציה למיון דיווחים
    function sortReports(reports, sortMethod) {
        switch (sortMethod) {
            case 'date-default':
                return [...reports].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // מהחדש לישן
            case 'alphabetical':
                return [...reports].sort((a, b) => a.faultType.localeCompare(b.faultType, 'he', { sensitivity: 'base' })); // מיון אלפביתי לפי סוג תקלה
            default:
                return reports;
        }
    }

    // פונקציה להצגת הדיווחים בדף
    function displayReports(reportsToDisplay) {
        reportsListContainer.innerHTML = ''; // נקה את הרשימה הקיימת
        if (reportsToDisplay.length === 0) {
            const noReportsMessage = document.createElement('p');
            noReportsMessage.textContent = 'אין דיווחים רלוונטיים להצגה.';
            noReportsMessage.style.textAlign = 'center';
            noReportsMessage.style.marginTop = '20px';
            reportsListContainer.appendChild(noReportsMessage);
            return;
        }

        // תחילה, מיינו את הדיווחים
        const sorted = sortReports(reportsToDisplay, currentSort);

        // ואז הציגו אותם
        sorted.forEach(report => {
            const card = createReportCard(report);
            reportsListContainer.appendChild(card);
        });
    }

    // פונקציה לטיפול בשינוי פילטר (כפתורים)
    function handleFilterChange(event) {
        filterButtons.forEach(button => button.classList.remove('active'));
        event.target.classList.add('active');
        currentFilter = event.target.dataset.filter; // הוסף data-filter לאלמנט הכפתור ב-HTML
        
        // טען מחדש את הדיווחים מהשרת עם הפילטר החדש
        const user = getLoggedInUser();
        if (user && user.city) {
            fetchReports(user.city, currentFilter)
                .then(reports => {
                    allReports = reports; // שמור את הדיווחים המסוננים החדשים
                    displayReports(allReports); // הצג אותם
                });
        } else {
            console.error('User city not found in localStorage. Cannot fetch reports.');
            alert('שגיאה: פרטי העיר של העובד אינם זמינים.');
        }
    }

    // פונקציה לטיפול בשינוי מיון (דרופדאון)
    function handleSortChange() {
        currentSort = sortDropdown.value;
        displayReports(allReports); // מיינו והציגו מחדש את הדיווחים שכבר נטענו
    }


    // --- אירועים והפעלה ראשונית ---

    // כפתורי סינון
    filterButtons.forEach(button => {
        // חשוב: הגדר את data-filter עבור כל כפתור ב-HTML שלך
        // לדוגמה: <button class="filter-button active" data-filter="all">כל הדיווחים</button>
        // <button class="filter-button" data-filter="open">דיווחים פתוחים</button>
        // <button class="filter-button" data-filter="in-progress">דיווחים בטיפול</button>
        // <button class="filter-button" data-filter="closed">דיווחים שנסגרו</button>
        button.addEventListener('click', handleFilterChange);
    });

    // דרופדאון מיון
    sortDropdown.addEventListener('change', handleSortChange);

    // חץ חזרה
    if (backArrow) {
        backArrow.addEventListener('click', () => {
            window.history.back(); // חזרה לדף הקודם
        });
    }

    // טעינת דיווחים ראשונית
    const user = getLoggedInUser();
    if (user && user.userType === 'employee' && user.city) {
        fetchReports(user.city, currentFilter)
            .then(reports => {
                allReports = reports; // שמור את כל הדיווחים שנטענו
                displayReports(allReports);
            });
    } else {
        // אם המשתמש לא מחובר כעובד או אין לו עיר, הפנה לדף לוגין
        alert('עליך להיות מחובר כעובד עם עיר משויכת כדי לצפות בדיווחים אלו.');
        window.location.href = '../html/login.html'; // או לדף הרשמה/הודעת שגיאה אחרת
    }
});