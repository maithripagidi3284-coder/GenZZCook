/**
 * InstantChef Full-Stack App Engine Core
 * Powered via Browser Native IndexedDB Storage Framework Matrix
 */

const DB_NAME = "InstantChefDatabase";
const DB_VERSION = 3; // Version 3 handles structural upgrades flawlessly
let dbInstance = null;

// --- INITIALIZE REAL-TIME INDEXEDDB STORAGE ON RUNTIME LAUNCH ---
function initApplicationDatabase() {
    return new Promise((resolve, reject) => {
        const dbOpenRequest = indexedDB.open(DB_NAME, DB_VERSION);

        dbOpenRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create tables cleanly if they don't exist yet
            if (!db.objectStoreNames.contains("chefs")) {
                db.createObjectStore("chefs", { keyPath: "email" });
            }
            if (!db.objectStoreNames.contains("orders")) {
                db.createObjectStore("orders", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("complaints")) {
                db.createObjectStore("complaints", { keyPath: "id", autoIncrement: true });
            }
        };

        dbOpenRequest.onsuccess = (event) => {
            dbInstance = event.target.result;
            seedDatabaseMockDataFiles().then(() => resolve(dbInstance));
        };

        dbOpenRequest.onerror = (event) => {
            console.error("Database Engine initialization faulted:", event.target.error);
            reject(event.target.error);
        };
    });
}

async function seedDatabaseMockDataFiles() {
    const activeOrdersCount = await getRecordCountFromTable("orders");
    if (activeOrdersCount === 0) {
        const sampleOrders = [
            { clientName: "Anita Sharma", location: "Jubilee Hills, Road No 36", hours: 4, rate: 450, menuNotes: "Family gathering party. Needs authentic South Indian lunch meals combo setup, specifically traditional sambar and live crispy dosas." },
            { clientName: "Vikram Malhotra", location: "DLF Cyber City, Phase 3", hours: 6, rate: 500, menuNotes: "North Indian dinner party request. Needs butter chicken, paneer tikka starters, and garlic naan live tandoor preparation." },
            { clientName: "Priya Reddy", location: "Gachibowli Financial District", hours: 3, rate: 600, menuNotes: "Gourmet Italian theme cooking. Requesting hand-tossed thin crust pizzas, pasta arrabbiata, and dynamic live presentation." }
        ];
        for (let order of sampleOrders) { await addRecordToTable("orders", order); }
    }

    const complaintsCount = await getRecordCountFromTable("complaints");
    if (complaintsCount === 0) {
        const sampleComplaints = [
            { date: "May 14, 2026", user: "Rahul J.", text: "Chef arrived 20 minutes behind scheduled shift runtime boundary. Food quality was exceptional, but scheduling parameters were delayed." },
            { date: "April 28, 2026", user: "Sneha M.", text: "Reported kitchen workspace counters were not fully wiped clean post-catering session event footprint." }
        ];
        for (let issue of sampleComplaints) { await addRecordToTable("complaints", issue); }
    }
}

// --- ENGINE REUSABLE UTILITY CONTROLLERS ---
function addRecordToTable(storeName, recordData) {
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.put(recordData);
        tx.oncomplete = () => resolve(true);
    });
}

function getAllRecordsFromTable(storeName) {
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
    });
}

function getRecordCountFromTable(storeName) {
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
    });
}

function deleteRecordFromTable(storeName, idKey) {
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.delete(idKey);
        tx.oncomplete = () => resolve(true);
    });
}

// --- INITIALIZE ROUTER ROUTINES ---
document.addEventListener("DOMContentLoaded", () => {
    initApplicationDatabase().then(() => {
        
        // Intercept landing page CTA buttons
        const earnCookBtn = document.querySelector('.btn-earn');
        if (earnCookBtn) {
            earnCookBtn.addEventListener('click', (event) => {
                event.preventDefault();
                window.location.href = "login.html";
            });
        }

        // Run setup setups depending on what elements exist on the live page template
        if (document.getElementById('interactive-signup-form')) {
            setupSignupEngineController();
        }
        if (document.getElementById('interactive-login-form')) {
            setupLoginEngineController();
        }
        if (document.querySelector('.dashboard-body-workspace')) {
            setupDashboardWorkspaceEngine();
        }
    });
});

// ==================================================
// SYSTEM SEGMENT 1: DATABASE SIGNUP REGISTER HANDLER
// ==================================================
function setupSignupEngineController() {
    const signupForm = document.getElementById('interactive-signup-form');
    const signupSubmitBtn = document.getElementById('signup-btn-lock');
    const successOverlay = document.getElementById('success-card-overlay');
    const dismissCardBtn = document.getElementById('success-card-dismiss-btn');
    const countdownLabel = document.getElementById('auto-redirect-counter');

    // --- FILE UPLOADER INDICATOR ---
    const fileInput = document.getElementById('chef-avatar');
    const fileText = document.getElementById('file-chosen-text');
    if (fileInput && fileText) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                fileText.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#10b981"></i> ${this.files[0].name.substring(0, 16)}`;
            }
        });
    }

    // --- BIO CHARACTER TRACKER ---
    const bioTextarea = document.getElementById('chef-bio');
    const charCounter = document.getElementById('char-counter-label');
    if (bioTextarea && charCounter) {
        bioTextarea.addEventListener('input', function() {
            charCounter.textContent = `${this.value.length} / 450`;
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevents layout clearing refresh loops
            if (signupSubmitBtn) signupSubmitBtn.classList.add('processing');

            const chefEmail = document.getElementById('chef-email').value.trim().toLowerCase();
            const chefCuisineSelect = document.getElementById('chef-cuisine');
            const chefCuisineText = chefCuisineSelect.options[chefCuisineSelect.selectedIndex].text;

            // Package the data exactly how our Node server expects it
            const chefPayloadData = {
                name: document.getElementById('chef-name').value.trim(),
                email: chefEmail,
                phone: document.getElementById('chef-phone').value.trim(),
                password: document.getElementById('chef-password').value,
                cuisine: chefCuisineText,
                rate: document.getElementById('chef-rate').value,
                commitment: document.querySelector('input[name="job-commitment"]:checked')?.value || 'part-time'
            };

            try {
                // TRANSMIT TO CLOUD BACKEND SERVER
                const response = await fetch('http://localhost:5000/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(chefPayloadData)
                });

                const data = await response.json();
                if (signupSubmitBtn) signupSubmitBtn.classList.remove('processing');

                if (data.success) {
                    sessionStorage.setItem("activeChefSessionEmail", chefEmail);

                    // Inject values into the success modal card elements
                    if (document.getElementById('card-chef-name')) document.getElementById('card-chef-name').textContent = chefPayloadData.name;
                    if (document.getElementById('card-chef-cuisine')) document.getElementById('card-chef-cuisine').textContent = chefPayloadData.cuisine;
                    if (document.getElementById('card-chef-rate')) document.getElementById('card-chef-rate').textContent = `₹${chefPayloadData.rate}/hr`;
                    if (document.getElementById('card-chef-email')) document.getElementById('card-chef-email').textContent = chefPayloadData.email;

                    if (successOverlay) successOverlay.classList.add('reveal-card');

                    let countdownTime = 5;
                    const timerInterval = setInterval(() => {
                        countdownTime--;
                        if (countdownLabel) countdownLabel.textContent = `AUTOMATIC ROUTING IN ${countdownTime}S...`;
                        if (countdownTime <= 0) {
                            clearInterval(timerInterval);
                            window.location.href = "dashboard.html";
                        }
                    }, 1000);

                    if (dismissCardBtn) {
                        dismissCardBtn.addEventListener('click', () => {
                            clearInterval(timerInterval);
                            window.location.href = "dashboard.html";
                        });
                    }
                } else {
                    alert(data.message); // Server warnings like "Email already registered!"
                }
            } catch (err) {
                if (signupSubmitBtn) signupSubmitBtn.classList.remove('processing');
                console.error("Transmission breakdown:", err);
                alert("Server unreachable. Make sure you ran 'node server.js' in the terminal!");
            }
        });
    }
}
// ==================================================
// SYSTEM SEGMENT 2: REAL-TIME VERIFICATION LOGIN DESK
// ==================================================
function setupLoginEngineController() {
    const loginForm = document.getElementById('interactive-login-form');
    const loginSubmitBtn = document.getElementById('submit-btn-lock');

    if (loginForm && loginSubmitBtn) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginSubmitBtn.classList.add('processing');

            const credentialId = document.getElementById('login-identifier').value.trim().toLowerCase();
            const passwordId = document.getElementById('login-password').value;
            const allRegisteredChefs = await getAllRecordsFromTable("chefs");
            
            setTimeout(() => {
                loginSubmitBtn.classList.remove('processing');
                const validChefFound = allRegisteredChefs.find(chef => 
                    (chef.email === credentialId || chef.phone === credentialId) && chef.password === passwordId
                );

                if (validChefFound) {
                    sessionStorage.setItem("activeChefSessionEmail", validChefFound.email);
                    alert(`Welcome Back, Chef ${validChefFound.name}!\nYour verification parameters are complete.`);
                    loginForm.reset();
                    window.location.href = "dashboard.html";
                } else {
                    alert("Authentication Failed: Credentials do not match our system files.");
                }
            }, 1400);
        });
    }
}

// ==================================================
// SYSTEM SEGMENT 3: OPERATIONS SYSTEM COMMAND DASHBOARD
// ==================================================
async function setupDashboardWorkspaceEngine() {
    const userSessionToken = sessionStorage.getItem("activeChefSessionEmail");
    if (!userSessionToken) {
        window.location.href = "login.html";
        return;
    }

    const chefsList = await getAllRecordsFromTable("chefs");
    const activeChefProfile = chefsList.find(c => c.email === userSessionToken) || {
        name: "Partner Cook Account", email: userSessionToken, phone: "9988776655", cuisine: "General Kitchen Specialty", commitment: "part-time"
    };

    if (document.getElementById('dash-display-name')) document.getElementById('dash-display-name').textContent = activeChefProfile.name;
    if (document.getElementById('dash-display-email')) document.getElementById('dash-display-email').textContent = activeChefProfile.email;
    if (document.getElementById('dash-display-phone')) document.getElementById('dash-display-phone').textContent = activeChefProfile.phone;
    if (document.getElementById('dash-display-cuisine')) document.getElementById('dash-display-cuisine').textContent = activeChefProfile.cuisine.toUpperCase();
    
    const commitmentBadge = document.getElementById('dash-display-commitment');
    if (commitmentBadge) commitmentBadge.textContent = activeChefProfile.commitment;

    const ordersListTarget = document.getElementById('incoming-orders-list-target');
    const ordersCountBadge = document.getElementById('order-count-badge');
    const detailModal = document.getElementById('order-detail-modal-overlay');
    let currentlySelectedOrderTicketId = null;

    async function renderLiveOrdersWorkspace() {
        if (!ordersListTarget) return;
        const activeOrdersData = await getAllRecordsFromTable("orders");
        ordersListTarget.innerHTML = "";
        if (ordersCountBadge) ordersCountBadge.textContent = `${activeOrdersData.length} Active Requests`;

        if (activeOrdersData.length === 0) {
            ordersListTarget.innerHTML = `<div class="order-item-strip-row" style="cursor:default; text-align:center; justify-content:center; color:#94a3b8;">No active kitchen shifts nearby.</div>`;
            return;
        }

        activeOrdersData.forEach(order => {
            const strip = document.createElement('div');
            strip.className = "order-item-strip-row";
            strip.innerHTML = `
                <div class="strip-main-info">
                    <h5>${order.clientName}</h5>
                    <div class="strip-sub-details">
                        <span><i class="fa-solid fa-location-dot"></i> ${order.location.substring(0, 22)}...</span>
                        <span><i class="fa-solid fa-clock"></i> ${order.hours} Hours Shift</span>
                    </div>
                </div>
                <button class="btn-open-order-ticket">View Spec Details</button>
            `;

            strip.addEventListener('click', () => {
                currentlySelectedOrderTicketId = order.id;
                if (document.getElementById('modal-client-name')) document.getElementById('modal-client-name').textContent = order.clientName;
                if (document.getElementById('modal-client-location')) document.getElementById('modal-client-location').textContent = order.location;
                if (document.getElementById('modal-client-hours')) document.getElementById('modal-client-hours').textContent = `${order.hours} Hours Shift`;
                if (document.getElementById('modal-client-payout')) document.getElementById('modal-client-payout').textContent = `₹${order.hours * (parseInt(activeChefProfile.rate) || order.rate)}`;
                if (document.getElementById('modal-client-notes')) document.getElementById('modal-client-notes').textContent = order.menuNotes;
                if (detailModal) detailModal.classList.add('active-modal');
            });

            ordersListTarget.appendChild(strip);
        });
    }

    if (document.getElementById('close-detail-modal-x')) {
        document.getElementById('close-detail-modal-x').addEventListener('click', () => detailModal.classList.remove('active-modal'));
    }
    if (document.getElementById('modal-decline-action-btn')) {
        document.getElementById('modal-decline-action-btn').addEventListener('click', () => detailModal.classList.remove('active-modal'));
    }
    if (document.getElementById('modal-accept-action-btn')) {
        document.getElementById('modal-accept-action-btn').addEventListener('click', async () => {
            if (currentlySelectedOrderTicketId !== null) {
                await deleteRecordFromTable("orders", currentlySelectedOrderTicketId);
                if (detailModal) detailModal.classList.remove('active-modal');
                alert("Booking Contract Locked!\nClient dispatch metrics transmitted.");
                renderLiveOrdersWorkspace();
            }
        });
    }

    const complaintsTarget = document.getElementById('complaints-list-target');
    const complaintsBadge = document.getElementById('complaints-count-badge');
    if (complaintsTarget) {
        const internalComplaintsDataList = await getAllRecordsFromTable("complaints");
        if (complaintsBadge) complaintsBadge.textContent = `${internalComplaintsDataList.length} Issues`;
        complaintsTarget.innerHTML = "";

        internalComplaintsDataList.forEach(log => {
            const box = document.createElement('div');
            box.className = "complaint-item-strip";
            box.innerHTML = `
                <div class="complaint-meta-header"><span>Incident Ref Case Log</span><span>${log.date}</span></div>
                <p class="complaint-text-string"><strong>Host Reporting:</strong> "${log.text}"</p>
            `;
            complaintsTarget.appendChild(box);
        });
    }

    const chartCanvasElement = document.getElementById('earningsMetricsChart');
    if (chartCanvasElement) {
        const ctxCanvas = chartCanvasElement.getContext('2d');
        const operationalDataSets = {
            weeklyLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            weeklyData: [1800, 2400, 0, 3200, 1500, 5800, 6400],
            monthlyLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            monthlyData: [12000, 18500, 14200, 21000]
        };

        let revenueLineChartInstance = new Chart(ctxCanvas, {
            type: 'line',
            data: {
                labels: operationalDataSets.weeklyLabels,
                datasets: [{
                    label: 'Gross Revenue Earnings (₹)',
                    data: operationalDataSets.weeklyData,
                    borderColor: '#ff4e50',
                    backgroundColor: 'rgba(255, 78, 80, 0.08)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const weekToggleBtn = document.getElementById('toggle-weekly-btn');
        const monthToggleBtn = document.getElementById('toggle-monthly-btn');
        if (weekToggleBtn && monthToggleBtn) {
            weekToggleBtn.addEventListener('click', () => {
                weekToggleBtn.classList.add('active');
                monthToggleBtn.classList.remove('active');
                revenueLineChartInstance.data.labels = operationalDataSets.weeklyLabels;
                revenueLineChartInstance.data.datasets[0].data = operationalDataSets.weeklyData;
                revenueLineChartInstance.update();
            });
            monthToggleBtn.addEventListener('click', () => {
                monthToggleBtn.classList.add('active');
                weekToggleBtn.classList.remove('active');
                revenueLineChartInstance.data.labels = operationalDataSets.monthlyLabels;
                revenueLineChartInstance.data.datasets[0].data = operationalDataSets.monthlyData;
                revenueLineChartInstance.update();
            });
        }
    }

    const logoutBtn = document.getElementById('dash-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem("activeChefSessionEmail");
            window.location.href = "login.html";
        });
    }

    renderLiveOrdersWorkspace();
}