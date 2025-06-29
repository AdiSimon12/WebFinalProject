document.addEventListener('DOMContentLoaded', async () => {
    const reportsDisplayArea = document.getElementById('reports-display-area');
    const filterButtons = document.querySelectorAll('.filter-button');
    const sortDropdown = document.getElementById('sort-reports-dropdown');
    const backButton = document.getElementById('backButton');

    let allReports = [];
    let currentFilter = 'all';
    let currentSort = 'date-default';

    function getLoggedInUser() {
        const user = localStorage.getItem('loggedInUser');
        return user ? JSON.parse(user) : null;
    }

    async function fetchReports(city, status = 'all') {
        try {
            const BASE_URL = 'https://webfinalproject-j4tc.onrender.com';
            let url = `${BASE_URL}/api/employee-reports?city=${encodeURIComponent(city)}`;
            if (status !== 'all') {
                url += `&status=${encodeURIComponent(status)}`;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch reports');
            return res.json();
        } catch (err) {
            console.error('Error fetching reports:', err);
            alert('אירעה שגיאה בטעינת הדיווחים.');
            return [];
        }
    }

    function sortReports(reportsArr) {
        const arr = [...reportsArr];
        if (currentSort === 'alphabetical') {
            arr.sort((a, b) => a.faultType.localeCompare(b.faultType, 'he'));
        }
        return arr;
    }

    function createReportCard(report, index) {
        const card = document.createElement('section');
        card.classList.add('report-summary-card');

        const seqNum = (index + 1).toString().padStart(3, '0');
        card.innerHTML = `
            <section class="report-info">
                <span class="report-id-type">דיווח #${seqNum}
                <span class="report-type-name">${report.faultType}</span></span>
            </section>
            <a href="/html/reportEditPage.html?id=${report._id}&seq=${seqNum}" class="view-details-link">צפייה בפרטים</a>        `;
        return card;
    }

    function displayReports(reportsArr) {
        reportsDisplayArea.innerHTML = '';
        const sorted = sortReports(reportsArr);
        if (!sorted.length) {
            const p = document.createElement('p');
            p.textContent = 'אין דיווחים רלוונטיים להצגה.';
            p.style.textAlign = 'center';
            p.style.marginTop = '20px';
            reportsDisplayArea.appendChild(p);
            return;
        }
        sorted.forEach((r, idx) => reportsDisplayArea.appendChild(createReportCard(r, idx)));
    }

    async function handleFilterChange(evt) {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        evt.target.classList.add('active');
        currentFilter = evt.target.dataset.filter || 'all';

        const user = getLoggedInUser();
        if (!user || !user.city) {
            console.error('User city missing – cannot fetch reports.');
            return;
        }
        allReports = await fetchReports(user.city, currentFilter);
        displayReports(allReports);
    }

    function handleSortChange() {
        currentSort = sortDropdown.value;
        displayReports(allReports);
    }

    const user = getLoggedInUser();
    if (!user || user.userType !== 'employee' || !user.city) {
        alert('עליך להיות מחובר כעובד עם עיר כדי לצפות בדיווחים.');
        window.location.href = '../html/login.html';
        return;
    }

    allReports = await fetchReports(user.city, currentFilter);
    displayReports(allReports);

    filterButtons.forEach(btn => btn.addEventListener('click', handleFilterChange));
    sortDropdown.addEventListener('change', handleSortChange);

    if (backButton) {
        backButton.addEventListener('click', e => {
            e.preventDefault();
            window.history.back();
        });
    }
});