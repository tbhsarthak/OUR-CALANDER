let userProfile = {
    name: '',
    partnerName: '',
    isPaired: false,
    cycleLength: 28,
    periodLength: 5,
    lastPeriodDate: null,
    lastPeriodEndDate: null
};

let cycleData = {
    currentDay: 12,
    cycleLength: 31,
    periodLength: 7,
    phase: 'Luteal Phase',
    currentMonth: 'August 2025',
    days: Array.from({ length: 31 }, (_, i) => ({
        date: i + 1,
        type: '',
        symptoms: {}
    })),
    history: {
        avgPeriodLength: 7,
        avgCycleLength: 31,
        lastSync: '06:43 PM IST, Aug 06, 2025'
    },
    notes: {}
};

let selectedMood = '';
let quickLogs = new Set();

document.addEventListener('DOMContentLoaded', function () {
    loadUserProfile();
    
    if (document.getElementById('cycleDay')) {
        initializeWomanDashboard();
        checkPartnerConnection();
    }

    // Initialize "Start Partner Sync" button with retry
    function initializeSyncButton() {
        const startPartnerSyncBtn = document.getElementById('startPartnerSync');
        if (startPartnerSyncBtn) {
            startPartnerSyncBtn.addEventListener('click', showSyncOptions);
            console.log('Start Partner Sync button initialized successfully');
        } else {
            console.warn('Start Partner Sync button not found in DOM. Retrying in 1s...');
            setTimeout(initializeSyncButton, 1000); // Retry after 1 second
        }
    }
    initializeSyncButton();

    const header = document.querySelector('.header');
    if (header) {
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'btn btn-secondary';
        settingsBtn.textContent = '⚙️ Settings';
        settingsBtn.style.marginTop = '10px';
        settingsBtn.onclick = showUserSettings;
        header.appendChild(settingsBtn);
    }

    const editBtn = document.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', handleEditClick);
    }
    
    if (!userProfile.name) {
        setTimeout(showUserSetup, 500);
    }
});

function showSyncOptions() {
    const syncModal = document.getElementById('syncModal');
    if (syncModal) {
        syncModal.classList.remove('hidden');
        generateNewSyncCode();
        checkPartnerConnection();
        console.log('Sync modal opened successfully');
    } else {
        console.error('Sync modal not found in DOM. Ensure <div id="syncModal"> exists in woman.html.');
        showNotification('Sync modal not available. Please check the page structure.', 'warning');
    }
}

// USER SETUP AND PROFILE MANAGEMENT
function showUserSetup() {
    const modal = createModal('Welcome to Paira! 🌸', `
        <div style="text-align: left;">
            <p style="margin-bottom: 20px; color: #666;">Let's personalize your experience:</p>
            
            <div class="input-group">
                <label>Your Name:</label>
                <input type="text" id="userName" placeholder="Enter your name" required>
            </div>
            
            <div class="input-group">
                <label>Partner's Name (optional):</label>
                <input type="text" id="partnerName" placeholder="Enter partner's name">
            </div>
            
            <div class="input-group">
                <label>Average Cycle Length:</label>
                <select id="cycleLength">
                    <option value="21">21 days</option>
                    <option value="24">24 days</option>
                    <option value="26">26 days</option>
                    <option value="28" selected>28 days</option>
                    <option value="30">30 days</option>
                    <option value="32">32 days</option>
                    <option value="35">35 days</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Period Duration:</label>
                <select id="periodLength">
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5" selected>5 days</option>
                    <option value="6">6 days</option>
                    <option value="7">7 days</option>
                    <option value="8">8 days</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Last Period Started:</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="date" id="lastPeriodDate">
                    <button class="btn btn-secondary" onclick="clearLastPeriodDate('userSetup')" style="padding: 8px 15px;">Clear Date</button>
                </div>
            </div>
        </div>
    `, 'saveUserSetup()');
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lastPeriodDate').value = today;
}

function createModal(title, content, onSave) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    modalContent.innerHTML = `
        <h3 style="margin-bottom: 20px; color: #764ba2;">${title}</h3>
        ${content}
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="closeModal()" style="width: auto; padding: 10px 20px;">Cancel</button>
            <button class="btn" onclick="${onSave}" style="width: auto; padding: 10px 20px;">Save</button>
        </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    window.currentModal = modalOverlay;
}

function closeModal() {
    if (window.currentModal) {
        window.currentModal.remove();
        window.currentModal = null;
    }
}

function clearLastPeriodDate(context) {
    const dateInputId = context === 'userSetup' ? 'lastPeriodDate' : 'settingsLastPeriodDate';
    document.getElementById(dateInputId).value = '';
    if (context === 'settings') {
        userProfile.lastPeriodDate = null;
        userProfile.lastPeriodEndDate = null;
        cycleData.currentDay = 1;
        cycleData.phase = 'Unknown';
        updateCycleData();
        saveUserData();
        updatePersonalizedUI();
        showNotification('Last period date cleared.', 'success');
    }
}

function saveUserSetup() {
    const name = document.getElementById('userName').value.trim();
    const partnerName = document.getElementById('partnerName').value.trim();
    const cycleLength = parseInt(document.getElementById('cycleLength').value);
    const periodLength = parseInt(document.getElementById('periodLength').value);
    const lastPeriodDate = document.getElementById('lastPeriodDate').value;
    
    if (!name) {
        showNotification('Please enter your name', 'warning');
        return;
    }
    
    userProfile = {
        name: name,
        partnerName: partnerName,
        isPaired: !!partnerName,
        cycleLength: cycleLength,
        periodLength: periodLength,
        lastPeriodDate: lastPeriodDate || null,
        lastPeriodEndDate: null
    };
    
    if (lastPeriodDate) {
        const lastPeriod = new Date(lastPeriodDate);
        const today = new Date();
        const daysDiff = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
        cycleData.currentDay = Math.max(1, daysDiff + 1);
        cycleData.phase = calculatePhase(cycleData.currentDay, cycleLength);
    } else {
        cycleData.currentDay = 1;
        cycleData.phase = 'Unknown';
    }
    
    cycleData.cycleLength = cycleLength;
    cycleData.periodLength = periodLength;
    updateCycleData();
    
    saveToStorage('user_profile', userProfile);
    saveToStorage('cycle_data', cycleData);
    
    closeModal();
    updatePersonalizedUI();
    showNotification(`Welcome ${name}! Your profile has been saved.`, 'success');
}

function loadUserProfile() {

    checkPartnerConnection();
    const saved = loadFromStorage('user_profile');
    if (saved) {
        userProfile = { ...userProfile, ...saved };
    }
    
    const savedCycle = loadFromStorage('cycle_data');
    if (savedCycle) {
        cycleData = { ...cycleData, ...savedCycle };
    }
    
    updateCycleData();
    
    if (userProfile.name) {
        updatePersonalizedUI();
    }
}

function updatePersonalizedUI() {
    const welcomeMessage = document.querySelector('.header h1');
    if (welcomeMessage) {
        welcomeMessage.textContent = `👋 Welcome back, ${userProfile.name || 'User'}!`;
    }
    
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        if (userProfile.isPaired) {
            syncStatus.textContent = `🔗 Synced with ${userProfile.partnerName}`;
            syncStatus.style.background = '#4CAF50';
        } else {
            syncStatus.textContent = '👤 Solo mode';
            syncStatus.style.background = '#FF9800';
        }
    }
    
    updatePartnerReferences();
    updateAnalysisData();
    
    if (document.getElementById('cycleDay')) {
        updateCycleDisplay();
        updateProgressRing();
        generatePersonalizedInsights();
    }
}

function updatePartnerReferences() {
    const partnerMessages = document.getElementById('partnerMessages');
    if (partnerMessages && !userProfile.isPaired) {
        partnerMessages.innerHTML = `
            <h3>💝 From Your Partner</h3>
            <div class="no-messages" style="text-align: center; color: #666; padding: 20px;">
                <p>👤 Solo Mode</p>
                <p style="font-size: 14px;">Add a partner in settings to enable sync features!</p>
                <button class="btn btn-secondary" onclick="showPartnerSetup()" style="margin-top: 10px; width: auto; padding: 8px 20px;">Add Partner</button>
            </div>
        `;
    }
    
    const messageButton = document.querySelector('button[onclick="sendMessageToPartner()"]');
    if (messageButton) {
        if (userProfile.isPaired) {
            messageButton.textContent = `Send Message to ${userProfile.partnerName}`;
            messageButton.style.display = 'block';
        } else {
            messageButton.style.display = 'none';
        }
    }
}

function showPartnerSetup() {
    const modal = createModal('Add Your Partner 💕', `
        <div style="text-align: left;">
            <p style="margin-bottom: 20px; color: #666;">Connect with your partner to share cycle updates and receive support!</p>
            
            <div class="input-group">
                <label>Partner's Name:</label>
                <input type="text" id="newPartnerName" placeholder="Enter partner's name" required>
            </div>
            
            <div class="input-group">
                <label>Partner's Email (optional):</label>
                <input type="email" id="partnerEmail" placeholder="For sending invite link">
            </div>
        </div>
    `, 'savePartnerInfo()');
}

function savePartnerInfo() {
    const partnerName = document.getElementById('newPartnerName').value.trim();
    const partnerEmail = document.getElementById('partnerEmail').value.trim();
    
    if (!partnerName) {
        showNotification('Please enter your partner\'s name', 'warning');
        return;
    }
    
    userProfile.partnerName = partnerName;
    userProfile.isPaired = true;
    
    saveToStorage('user_profile', userProfile);
    
    closeModal();
    updatePersonalizedUI();
    
    let message = `${partnerName} has been added as your partner!`;
    if (partnerEmail) {
        message += ` We'll send them an invite to ${partnerEmail}.`;
    }
    
    showNotification(message, 'success');
}

function generatePersonalizedInsights() {
    const userName = userProfile.name || 'User';
    const partnerName = userProfile.partnerName || 'your partner';
    
    const insightItems = document.querySelectorAll('.insight-item');
    
    const personalizedInsights = [
        `${userName}, you're on day ${cycleData.currentDay} of your cycle. Great job tracking!`,
        `Reminder: Your period is expected in ${cycleData.cycleLength - cycleData.currentDay} days.`,
        `Based on your ${cycleData.phase.toLowerCase()}, try gentle exercises and stay hydrated.`,
        `${partnerName} can see your updates and send supportive messages!`,
        `Tip: Consistent tracking helps predict your cycle more accurately.`
    ];
    
    insightItems.forEach((item, index) => {
        if (index < personalizedInsights.length) {
            item.innerHTML = `<strong>${['Personal', 'Reminder', 'Wellness'][index]}:</strong> ${personalizedInsights[index]}`;
        }
    });
}

// Sample array to store partner messages (in a real app, this could come from a backend)
let partnerMessages = [
    {
        text: "Hey love, just wanted to check in and see how you're feeling today! 💕",
        timestamp: "Aug 06, 2025, 06:37 PM IST",
        sender: "Sarthak"
    }
];

// Function to display partner messages
function displayPartnerMessages() {
    const messageContainer = document.getElementById("messageContainer");
    const noMessagesDiv = document.getElementById("noMessages");

    // Clear current messages
    messageContainer.innerHTML = "";

    if (partnerMessages.length === 0) {
        noMessagesDiv.style.display = "block";
        messageContainer.appendChild(noMessagesDiv);
    } else {
        noMessagesDiv.style.display = "none";
        partnerMessages.forEach(message => {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message-item");
            messageDiv.innerHTML = `
                <p><strong>${message.sender}:</strong> ${message.text}</p>
                <div class="message-timestamp">${message.timestamp}</div>
            `;
            messageContainer.appendChild(messageDiv);
        });
    }
}

// Function to send a new partner message
function sendPartnerMessage() {
    const input = document.getElementById("partnerMessageInput");
    const messageText = input.value.trim();

    if (messageText) {
        const newMessage = {
            text: messageText,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            sender: "You"
        };
        partnerMessages.push(newMessage);
        input.value = ""; // Clear input
        displayPartnerMessages(); // Refresh message display
    }
}

// Initialize messages on page load
document.addEventListener("DOMContentLoaded", () => {
    displayPartnerMessages();
});

// WOMAN DASHBOARD FUNCTIONALITY
function initializeWomanDashboard() {
    updateCycleData();
    updateCycleDisplay();
    updateProgressRing();
    loadDailyInsights();
    renderCalendar();
    updateAnalysisData();
    renderTimeline();
    generatePersonalizedInsights();
}

function updateCycleData() {
    cycleData.days.forEach(day => {
        day.type = '';
        day.symptoms = {};
    });

    if (userProfile.lastPeriodDate) {
        const lastPeriod = new Date(userProfile.lastPeriodDate);
        const today = new Date();
        const daysDiff = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
        cycleData.currentDay = Math.max(1, daysDiff + 1);
        cycleData.phase = calculatePhase(cycleData.currentDay, userProfile.cycleLength);

        const periodStartDay = (daysDiff % userProfile.cycleLength) + 1;
        for (let i = 0; i < userProfile.periodLength; i++) {
            const dayIndex = (periodStartDay + i - 1) % 31;
            if (dayIndex >= 0 && dayIndex < cycleData.days.length) {
                cycleData.days[dayIndex].type = 'period';
            }
        }

        const expectedPeriodStart = new Date(lastPeriod);
        expectedPeriodStart.setDate(lastPeriod.getDate() + userProfile.cycleLength);
        const expectedStartDay = expectedPeriodStart.getDate();
        for (let i = 0; i < userProfile.periodLength; i++) {
            const dayIndex = expectedStartDay + i - 1;
            if (dayIndex >= 1 && dayIndex <= 31) {
                cycleData.days[dayIndex - 1].type = 'expected-period';
            }
        }

        const fertileStart = Math.floor(userProfile.cycleLength / 2) - 5;
        const fertileEnd = Math.floor(userProfile.cycleLength / 2) + 2;
        for (let i = fertileStart; i <= fertileEnd; i++) {
            if (i >= 1 && i <= 31) {
                cycleData.days[i - 1].type = cycleData.days[i - 1].type || 'fertile';
            }
        }

        cycleData.days[cycleData.currentDay - 1].type = 'today';
    }
}

function updateCycleDisplay() {
    const cycleDay = document.getElementById('cycleDay');
    const cyclePhase = document.getElementById('cyclePhase');
    const nextPeriod = document.getElementById('nextPeriod');

    if (cycleDay) cycleDay.textContent = cycleData.currentDay;
    if (cyclePhase) cyclePhase.textContent = cycleData.phase;

    if (nextPeriod) {
        const daysUntilPeriod = cycleData.cycleLength - cycleData.currentDay;
        nextPeriod.textContent = `${daysUntilPeriod} days`;
    }
}

function updateProgressRing() {
    const progressCircle = document.getElementById('progressCircle');
    if (!progressCircle) return;

    const circumference = 2 * Math.PI * 52;
    const progress = (cycleData.currentDay / cycleData.cycleLength) * circumference;
    progressCircle.style.strokeDasharray = `${progress} ${circumference}`;
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    calendarGrid.innerHTML = '';
    cycleData.days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day.date;
        if (day.type === 'period') dayElement.classList.add('period');
        if (day.type === 'fertile') dayElement.classList.add('fertile');
        if (day.type === 'today') dayElement.classList.add('today');
        if (day.type === 'expected-period') dayElement.classList.add('expected-period');
        dayElement.addEventListener('click', () => handleDayClick(day.date));
        calendarGrid.appendChild(dayElement);
    });
}

function handleDayClick(day) {
    const selectedDay = cycleData.days.find(d => d.date === day);
    if (!selectedDay) return;

    const newType = prompt('Set status for day ' + day + ' (period/fertile/leave blank):');
    if (newType !== null) {
        selectedDay.type = newType.toLowerCase() === 'period' || newType.toLowerCase() === 'fertile' ? newType.toLowerCase() : '';
        renderCalendar();
        saveUserData();
        showNotification(`Day ${day} updated to ${newType || 'normal'}.`, 'success');
        renderTimeline();
    }
}

function handleEditClick() {
    showNotification('Click a day on the calendar to edit its status (period, fertile, or normal).', 'info');
}

function updateAnalysisData() {
    const avgPeriodLength = document.getElementById('avgPeriodLength');
    const avgCycleLength = document.getElementById('avgCycleLength');
    const syncInfo = document.getElementById('syncInfo');

    if (avgPeriodLength) avgPeriodLength.textContent = `${cycleData.history.avgPeriodLength} days`;
    if (avgCycleLength) avgCycleLength.textContent = `${cycleData.history.avgCycleLength} days`;
    
    if (syncInfo) {
        const partnerName = userProfile.partnerName || 'Partner';
        const syncMessage = userProfile.isPaired ? 
            `Synced with ${partnerName} at ${cycleData.history.lastSync}` : 
            'Not synced - Add a partner to enable sync';
        syncInfo.textContent = syncMessage;
    }
}

function renderTimeline() {
    const timelineLog = document.getElementById('timelineLog');
    if (!timelineLog) return;

    timelineLog.innerHTML = '';
    cycleData.days.forEach(day => {
        if (day.type === 'period' || day.type === 'expected-period' || Object.keys(day.symptoms).length > 0) {
            const entry = document.createElement('div');
            entry.className = 'timeline-entry';
            let content = `<strong>Day ${day.date}</strong>: `;
            if (day.type === 'period') content += 'Period';
            if (day.type === 'expected-period') content += 'Expected Period';
            const symptoms = Object.entries(day.symptoms).map(([symptom, intensity]) => `${symptom.charAt(0).toUpperCase() + symptom.slice(1)}: ${intensity}`).join(', ');
            if (symptoms) content += ` - Symptoms: ${symptoms}`;
            entry.innerHTML = content;
            timelineLog.appendChild(entry);
        }
    });
}

function saveEditOptions() {
    const editPeriodStartDate = document.getElementById('editPeriodStartDate').value;
    const editPeriodEndDate = document.getElementById('editPeriodEndDate').value;
    const editNote = document.getElementById('editNote').value;

    if (editPeriodStartDate) {
        userProfile.lastPeriodDate = editPeriodStartDate;
        const lastPeriod = new Date(editPeriodStartDate);
        const today = new Date();
        const daysDiff = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
        cycleData.currentDay = Math.max(1, daysDiff + 1);
        cycleData.phase = calculatePhase(cycleData.currentDay, userProfile.cycleLength);
        updateCycleData();
        renderCalendar();
        renderTimeline();
        showNotification(`Period start updated to ${editPeriodStartDate}.`, 'success');
    }

    if (editPeriodEndDate) {
        userProfile.lastPeriodEndDate = editPeriodEndDate;
        const startDate = new Date(userProfile.lastPeriodDate);
        const endDate = new Date(editPeriodEndDate);
        const periodLength = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        if (periodLength > 0 && periodLength <= 10) {
            userProfile.periodLength = periodLength;
            cycleData.periodLength = periodLength;
            cycleData.history.avgPeriodLength = periodLength;
            updateCycleData();
            renderCalendar();
            renderTimeline();
            showNotification(`Period end updated to ${editPeriodEndDate}. Period length set to ${periodLength} days.`, 'success');
        } else {
            showNotification('Invalid period end date. Ensure it is after the start date and within 10 days.', 'warning');
        }
    }

    if (editNote) {
        cycleData.notes[cycleData.currentDay] = editNote;
        showNotification(`Note added for Day ${cycleData.currentDay}.`, 'success');
    }

    document.getElementById('editPeriodStartDate').value = '';
    document.getElementById('editPeriodEndDate').value = '';
    document.getElementById('editNote').value = '';
    saveUserData();
}

function toggleLog(element) {
    const type = element.dataset.type;
    if (quickLogs.has(type)) {
        quickLogs.delete(type);
        element.classList.remove('active');
    } else {
        quickLogs.add(type);
        element.classList.add('active');
    }
}

function saveQuickLog() {
    if (quickLogs.size === 0) {
        showNotification('Please select at least one item to log.', 'warning');
        return;
    }

    const loggedItems = {};
    quickLogs.forEach(type => {
        const intensity = prompt(`Enter intensity for ${type} (e.g., +, ++, +++):`);
        if (intensity && ['+', '++', '+++'].includes(intensity)) {
            loggedItems[type] = intensity;
        }
    });

    if (Object.keys(loggedItems).length > 0) {
        cycleData.days.find(d => d.date === cycleData.currentDay).symptoms = loggedItems;
        showNotification(`Logged: ${Object.entries(loggedItems).map(([k, v]) => `${k}: ${v}`).join(', ')}`, 'success');
        renderTimeline();
    }

    quickLogs.clear();
    document.querySelectorAll('.log-btn').forEach(btn => btn.classList.remove('active'));
    notifyPartner('quick-log', Array.from(quickLogs));
    updateSyncStatus('Quick log synced with partner');
    saveUserData();
}

function selectMood(element) {
    document.querySelectorAll('.mood-emoji').forEach(emoji => emoji.classList.remove('selected'));
    element.classList.add('selected');
    selectedMood = element.dataset.mood;
}

function saveMood() {
    if (!selectedMood) {
        showNotification('Please select a mood first.', 'warning');
        return;
    }

    const notes = document.getElementById('moodNotes').value;
    const moodText = getMoodText(selectedMood);

    showNotification(`Mood saved: ${moodText}${notes ? '\nNotes: ' + notes : ''}`, 'success');
    notifyPartner('mood-update', { mood: selectedMood, notes: notes });

    document.getElementById('moodNotes').value = '';
    document.querySelectorAll('.mood-emoji').forEach(emoji => emoji.classList.remove('selected'));
    selectedMood = '';

    updateSyncStatus('Mood synced with partner');
}

function getMoodText(mood) {
    const moodMap = {
        'amazing': 'Amazing',
        'happy': 'Happy',
        'neutral': 'Neutral',
        'low': 'Feeling Low',
        'irritated': 'Irritated'
    };
    return moodMap[mood] || mood;
}

// AI CHAT FUNCTIONALITY
function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;

    const chatContainer = document.getElementById('aiChat');
    addChatMessage(chatContainer, message, 'user');

    input.value = '';

    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        addChatMessage(chatContainer, aiResponse, 'ai');
    }, 1000);
}

function handleAIEnter(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

function addChatMessage(container, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function generateAIResponse(message) {
    const userName = userProfile.name || 'there';
    
    const responses = {
        'period': `Hi ${userName}! During your period, it's normal to experience discomfort. Try rest, hydration, and heating pads. 💙`,
        'cramps': `${userName}, menstrual cramps can be eased with warm compresses, light movement, or pain relievers. Stay cozy! 🌸`,
        'mood': `Hey ${userName}! Mood swings are common due to hormones. Journaling or gentle exercise may help! 💆‍♀️`,
        'bloating': `${userName}, reduce bloating by drinking water, limiting salt, and eating small meals. 🥒`,
        'pregnancy': `${userName}, tracking ovulation can help if you're trying to conceive. Ovulation usually happens mid-cycle. 💡`,
        'exercise': `Light exercise like yoga or walking can ease symptoms during your cycle, ${userName}! 🚶‍♀️`,
        'default': `Hi ${userName}! I'm here to help with any menstrual health questions. Try asking about cramps, mood, or cycle tracking! 🤗`
    };

    for (let keyword in responses) {
        if (message.toLowerCase().includes(keyword)) {
            return responses[keyword];
        }
    }

    return responses['default'];
}

// MESSAGING AND SYNC
function sendMessageToPartner() {
    const partnerName = userProfile.partnerName || 'your partner';
    const message = prompt(`Send a message to ${partnerName}:`);
    if (message && message.trim()) {
        showNotification(`Message sent to ${partnerName}!`, 'success');
        notifyPartner('message', { text: message, timestamp: new Date() });
    }
}

function notifyPartner(type, data) {
    console.log('Syncing with partner:', type, data);
    setTimeout(() => {
        updateSyncStatus(`${type} synced successfully`);
    }, 500);
}

function updateSyncStatus(message) {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        syncStatus.textContent = `🔄 ${message}`;
        syncStatus.style.background = '#FF9800';
        setTimeout(() => {
            const partnerName = userProfile.partnerName || 'Partner';
            syncStatus.textContent = userProfile.isPaired ? 
                `🔗 Synced with ${partnerName}` : 
                '👤 Solo mode';
            syncStatus.style.background = userProfile.isPaired ? '#4CAF50' : '#FF9800';
        }, 2000);
    }
}

function loadDailyInsights() {
    console.log('Daily insights loaded for', userProfile.name || 'User');
}

// SETTINGS AND PROFILE MANAGEMENT
function showUserSettings() {
    const modal = createModal(`${userProfile.name}'s Settings ⚙️`, `
        <div style="text-align: left;">
            <div class="input-group">
                <label>Your Name:</label>
                <input type="text" id="settingsUserName" value="${userProfile.name}" placeholder="Your name">
            </div>
            
            <div class="input-group">
                <label>Partner's Name:</label>
                <input type="text" id="settingsPartnerName" value="${userProfile.partnerName || ''}" placeholder="Partner's name">
            </div>
            
            <div class="input-group">
                <label>Cycle Length:</label>
                <select id="settingsCycleLength">
                    <option value="21" ${userProfile.cycleLength === 21 ? 'selected' : ''}>21 days</option>
                    <option value="24" ${userProfile.cycleLength === 24 ? 'selected' : ''}>24 days</option>
                    <option value="26" ${userProfile.cycleLength === 26 ? 'selected' : ''}>26 days</option>
                    <option value="28" ${userProfile.cycleLength === 28 ? 'selected' : ''}>28 days</option>
                    <option value="30" ${userProfile.cycleLength === 30 ? 'selected' : ''}>30 days</option>
                    <option value="32" ${userProfile.cycleLength === 32 ? 'selected' : ''}>32 days</option>
                    <option value="35" ${userProfile.cycleLength === 35 ? 'selected' : ''}>35 days</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Period Duration:</label>
                <select id="settingsPeriodLength">
                    <option value="3" ${userProfile.periodLength === 3 ? 'selected' : ''}>3 days</option>
                    <option value="4" ${userProfile.periodLength === 4 ? 'selected' : ''}>4 days</option>
                    <option value="5" ${userProfile.periodLength === 5 ? 'selected' : ''}>5 days</option>
                    <option value="6" ${userProfile.periodLength === 6 ? 'selected' : ''}>6 days</option>
                    <option value="7" ${userProfile.periodLength === 7 ? 'selected' : ''}>7 days</option>
                    <option value="8" ${userProfile.periodLength === 8 ? 'selected' : ''}>8 days</option>
                </select>
            </div>
            
            <div class="input-group">
                <label>Last Period Started:</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="date" id="settingsLastPeriodDate" value="${userProfile.lastPeriodDate || ''}">
                    <button class="btn btn-secondary" onclick="clearLastPeriodDate('settings')" style="padding: 8px 15px;">Clear Date</button>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <button class="btn btn-secondary" onclick="logoutUser()" style="width: 100%; background: #ff4444; color: white; margin-bottom: 10px;">Logout</button>
                <button class="btn btn-secondary" onclick="clearAllData()" style="width: 100%; background: #ff4444; color: white;">Clear All Data</button>
            </div>
        </div>
    `, 'saveUserSettings()');
}

function saveUserSettings() {
    const name = document.getElementById('settingsUserName').value.trim();
    const partnerName = document.getElementById('settingsPartnerName').value.trim();
    const cycleLength = parseInt(document.getElementById('settingsCycleLength').value);
    const periodLength = parseInt(document.getElementById('settingsPeriodLength').value);
    const lastPeriodDate = document.getElementById('settingsLastPeriodDate').value;
    
    if (!name) {
        showNotification('Please enter your name', 'warning');
        return;
    }
    
    userProfile.name = name;
    userProfile.partnerName = partnerName;
    userProfile.isPaired = !!partnerName;
    userProfile.cycleLength = cycleLength;
    userProfile.periodLength = periodLength;
    userProfile.lastPeriodDate = lastPeriodDate || null;
    
    cycleData.cycleLength = cycleLength;
    cycleData.periodLength = periodLength;
    
    if (lastPeriodDate) {
        const lastPeriod = new Date(lastPeriodDate);
        const today = new Date();
        const daysDiff = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
        cycleData.currentDay = Math.max(1, daysDiff + 1);
        cycleData.phase = calculatePhase(cycleData.currentDay, cycleLength);
    } else {
        cycleData.currentDay = 1;
        cycleData.phase = 'Unknown';
    }
    
    updateCycleData();
    saveUserData();
    
    closeModal();
    updatePersonalizedUI();
    showNotification('Settings saved successfully!', 'success');
}

function logoutUser() {
    const userName = userProfile.name || 'User';
    if (confirm(`${userName}, are you sure you want to log out? This will clear your session data.`)) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('paira_')) {
                localStorage.removeItem(key);
            }
        });
        
        userProfile = {
            name: '',
            partnerName: '',
            isPaired: false,
            cycleLength: 28,
            periodLength: 5,
            lastPeriodDate: null,
            lastPeriodEndDate: null
        };
        cycleData.currentDay = 1;
        cycleData.phase = 'Unknown';
        cycleData.days = cycleData.days.map(day => ({
            ...day,
            type: '',
            symptoms: {}
        }));
        cycleData.notes = {};
        selectedMood = '';
        quickLogs.clear();
        
        saveUserData();
        
        closeModal();
        showNotification('Logged out successfully. Refreshing page...', 'info');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

function clearAllData() {
    const userName = userProfile.name || 'User';
    if (confirm(`${userName}, are you sure you want to clear all your data? This cannot be undone.`)) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('paira_')) {
                localStorage.removeItem(key);
            }
        });
        
        userProfile = { name: '', partnerName: '', isPaired: false, cycleLength: 28, periodLength: 5, lastPeriodDate: null, lastPeriodEndDate: null };
        cycleData.currentDay = 1;
        cycleData.phase = 'Unknown';
        cycleData.days = cycleData.days.map(day => ({
            ...day,
            type: '',
            symptoms: {}
        }));
        cycleData.notes = {};
        selectedMood = '';
        quickLogs.clear();
        
        saveUserData();
        
        closeModal();
        showNotification('All data cleared. Refreshing page...', 'info');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

// UTILITY FUNCTIONS
function calculatePhase(cycleDay, cycleLength = 28) {
    if (cycleDay <= 5) return 'Menstrual';
    if (cycleDay <= Math.floor(cycleLength / 2) - 2) return 'Follicular';
    if (cycleDay <= Math.floor(cycleLength / 2) + 2) return 'Ovulation';
    return 'Luteal';
}

function calculatePregnancyRisk(cycleDay, cycleLength = 28) {
    const ovulationDay = Math.floor(cycleLength / 2);
    const fertileStart = ovulationDay - 5;
    const fertileEnd = ovulationDay + 2;
    
    if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
        if (Math.abs(cycleDay - ovulationDay) <= 1) return 'high';
        return 'medium';
    }
    return 'low';
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        white-space: pre-line;
    `;

    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 15px;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// DATA PERSISTENCE AND STORAGE
function saveToStorage(key, data) {
    try {
        localStorage.setItem(`paira_${key}`, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const stored = localStorage.getItem(`paira_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return defaultValue;
    }
}

function saveUserData() {
    saveToStorage('cycle_data', cycleData);
    saveToStorage('user_profile', userProfile);
}

// GLOBAL FUNCTIONS FOR DEBUGGING
if (typeof window !== 'undefined') {
    window.PairaApp = {
        showUserSetup,
        showUserSettings,
        saveUserSetup,
        saveUserSettings,
        showPartnerSetup,
        savePartnerInfo,
        logoutUser,
        clearLastPeriodDate,
        toggleLog,
        saveQuickLog,
        selectMood,
        saveMood,
        sendAIMessage,
        handleAIEnter,
        sendMessageToPartner,
        showNotification,
        calculatePhase,
        calculatePregnancyRisk,
        saveToStorage,
        loadFromStorage,
        saveUserData,
        clearAllData,
        showSyncOptions,
        closeSyncModal,
        generateNewSyncCode,
        copySyncCodeToClipboard,
        activateSync,
        refreshPartnerSync,
        disconnectPartner,
        updatePartnerSyncUI,
        checkPartnerConnection,
        cycleData,
        userProfile,
        selectedMood,
        quickLogs
    };
}

console.log(`
Paira Color Guide:
- Pink (#ff6b6b): Period days (menstrual phase)
- Light Pink (#ffb6c1): Expected period days
- Yellow (#ffeb3b): Fertile days (ovulation window)  
- Green (#4CAF50): Current day indicator
- Gray: Normal cycle days
- Blue gradient: App theme colors
`);

console.log('Paira app initialized with personalized user data support');


// Add these functions to your existing woman.js file

// PARTNER SYNC FUNCTIONALITY
function showSyncOptions() {
    const syncModal = document.getElementById('syncModal');
    if (syncModal) {
        syncModal.classList.remove('hidden');
        generateNewSyncCode();
        checkPartnerConnection();
    } else {
        console.error('Sync modal not found in DOM');
        showNotification('Sync modal not available. Please check the page structure.', 'warning');
    }
}
function closeSyncModal() {
    const syncModal = document.getElementById('syncModal');
    if (syncModal) {
        syncModal.classList.add('hidden');
    }
}

function generateNewSyncCode() {
    const syncCode = Math.floor(100000 + Math.random() * 900000).toString();
    const syncCodeElement = document.getElementById('generatedSyncCode');
    if (syncCodeElement) {
        syncCodeElement.textContent = syncCode;
    }
    
    // Save the sync code to localStorage
    saveToStorage('sync_code', syncCode);
    saveToStorage('sync_timestamp', Date.now().toString());
    
    return syncCode;
}

function copySyncCodeToClipboard() {
    const syncCodeElement = document.getElementById('generatedSyncCode');
    if (syncCodeElement) {
        const syncCode = syncCodeElement.textContent;
        navigator.clipboard.writeText(syncCode).then(function() {
            showNotification('Sync code copied to clipboard!', 'success');
        }).catch(function(err) {
            console.error('Could not copy text: ', err);
            showNotification('Could not copy code. Please copy manually.', 'warning');
        });
    }
}

function activateSync() {
    const syncCodeElement = document.getElementById('generatedSyncCode');
    if (syncCodeElement) {
        const syncCode = syncCodeElement.textContent;
        
        // Save sync activation
        const syncData = {
            code: syncCode,
            isActive: true,
            activatedAt: new Date().toISOString(),
            userName: userProfile.name
        };
        
        saveToStorage('sync_active', syncData);
        
        // Update UI to show sync is active
        updatePartnerSyncUI(true);
        
        showNotification('Partner sync activated! Share the code with your partner.', 'success');
        closeSyncModal();
        
        // Update sync status
        updateSyncStatus('Partner sync activated - waiting for connection');
    }
}

function refreshPartnerSync() {
    // Check for partner connection
    const partnerConnection = loadFromStorage('partner_connection');
    if (partnerConnection) {
        const partnerData = {
            cycleDay: cycleData.currentDay,
            phase: cycleData.phase,
            nextPeriodDays: cycleData.cycleLength - cycleData.currentDay,
            pregnancyRisk: calculatePregnancyRisk(cycleData.currentDay, cycleData.cycleLength),
            mood: selectedMood || 'neutral',
            symptoms: getCurrentSymptoms(),
            lastUpdated: new Date().toISOString()
        };
        
        saveToStorage('partner_data', partnerData);
        showNotification('Sync data refreshed!', 'success');
        updateSyncStatus('Data synced with partner');
    } else {
        showNotification('No partner connection found.', 'warning');
    }
}

function disconnectPartner() {
    if (confirm('Are you sure you want to disconnect from your partner? They will need a new sync code to reconnect.')) {
        // Clear partner sync data
        localStorage.removeItem('paira_partner_connection');
        localStorage.removeItem('paira_partner_data');
        localStorage.removeItem('paira_sync_active');
        localStorage.removeItem('paira_sync_code');
        localStorage.removeItem('paira_support_messages');
        
        // Update UI
        updatePartnerSyncUI(false);
        updateSyncStatus('Partner disconnected');
        showNotification('Partner sync disconnected.', 'info');
        
        // Reset partner info in profile
        userProfile.isPaired = false;
        saveUserData();
        updatePersonalizedUI();
    }
}

function updatePartnerSyncUI(isConnected) {
    const syncConnectedView = document.getElementById('syncConnectedView');
    const syncDisconnectedView = document.getElementById('syncDisconnectedView');
    const connectedPartnerName = document.getElementById('connectedPartnerName');
    
    if (isConnected) {
        if (syncConnectedView) syncConnectedView.classList.remove('hidden');
        if (syncDisconnectedView) syncDisconnectedView.classList.add('hidden');
        if (connectedPartnerName) connectedPartnerName.textContent = userProfile.partnerName || 'Your Partner';
    } else {
        if (syncConnectedView) syncConnectedView.classList.add('hidden');
        if (syncDisconnectedView) syncDisconnectedView.classList.remove('hidden');
    }
}

function checkPartnerConnection() {
    const partnerConnection = loadFromStorage('partner_connection');
    const syncActive = loadFromStorage('sync_active');
    
    if (partnerConnection) {
        updatePartnerSyncUI(true);
        userProfile.isPaired = true;
        if (partnerConnection.name) {
            userProfile.partnerName = partnerConnection.name;
        }
        saveUserData();
        updatePersonalizedUI();
    } else if (syncActive && syncActive.isActive) {
        // Sync is active but no partner connected yet
        updatePartnerSyncUI(false);
    } else {
        updatePartnerSyncUI(false);
    }
}

function getCurrentSymptoms() {
    const currentDay = cycleData.days.find(day => day.date === cycleData.currentDay);
    if (currentDay && currentDay.symptoms) {
        return Object.entries(currentDay.symptoms)
            .map(([symptom, intensity]) => `${symptom}: ${intensity}`)
            .join(', ');
    }
    return 'None reported';
}

// Update the existing initializeWomanDashboard function to include sync check
// Add this line to your existing initializeWomanDashboard function:
// checkPartnerConnection();

// Update the loadUserProfile function to include sync check
// Add this line to your existing loadUserProfile function after loading data:
// checkPartnerConnection();

// Override the existing notifyPartner function to include sync data
function notifyPartner(type, data) {
    console.log('Syncing with partner:', type, data);
    
    // Update partner data for sync
    const partnerData = {
        cycleDay: cycleData.currentDay,
        phase: cycleData.phase,
        nextPeriodDays: Math.max(0, cycleData.cycleLength - cycleData.currentDay),
        pregnancyRisk: calculatePregnancyRisk(cycleData.currentDay, cycleData.cycleLength),
        mood: selectedMood || getMoodFromData(),
        symptoms: getCurrentSymptoms(),
        lastUpdated: new Date().toISOString(),
        syncType: type,
        syncData: data
    };
    
    saveToStorage('partner_data', partnerData);
    
    setTimeout(() => {
        updateSyncStatus(`${type} synced with partner`);
    }, 500);
}

function getMoodFromData() {
    // Try to get the most recent mood or return neutral
    return selectedMood || 'neutral';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const syncModal = document.getElementById('syncModal');
    if (syncModal && !syncModal.classList.contains('hidden')) {
        const modalContent = syncModal.querySelector('.sync-modal-content');
        if (modalContent && !modalContent.contains(event.target)) {
            closeSyncModal();
        }
    }
});

// Add these functions to the global PairaApp object
// In woman.js, replace the existing PairaApp assignment
if (typeof window !== 'undefined') {
    window.PairaApp = window.PairaApp || {};
    window.PairaApp = {
        ...window.PairaApp,
        showSyncOptions,
        closeSyncModal,
        generateNewSyncCode,
        copySyncCodeToClipboard,
        activateSync,
        refreshPartnerSync,
        disconnectPartner,
        updatePartnerSyncUI,
        checkPartnerConnection
    };
    console.log('PairaApp initialized:', window.PairaApp);
}