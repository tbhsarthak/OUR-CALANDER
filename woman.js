// ========================================
// WOMAN DASHBOARD FUNCTIONALITY
// ========================================

// Sample data - in real app this would come from database
let cycleData = {
    currentDay: 12,
    cycleLength: 31,
    periodLength: 7,
    phase: 'Luteal Phase',
    currentMonth: 'August 2025',
    days: [
        { date: 1, type: 'period' },
        { date: 2, type: 'period' },
        { date: 3, type: 'period' },
        { date: 4, type: 'period' },
        { date: 5, type: 'period' },
        { date: 6, type: 'period' },
        { date: 7, type: 'period' },
        { date: 8, type: 'today' },
        { date: 9, type: '' },
        { date: 10, type: '' },
        { date: 11, type: 'fertile' },
        { date: 12, type: 'fertile' },
        { date: 13, type: '' },
        { date: 14, type: '' },
        { date: 15, type: '' },
        { date: 16, type: '' },
        { date: 17, type: '' },
        { date: 18, type: '' },
        { date: 19, type: '' },
        { date: 20, type: '' },
        { date: 21, type: '' },
        { date: 22, type: '' },
        { date: 23, type: '' },
        { date: 24, type: '' },
        { date: 25, type: '' },
        { date: 26, type: '' },
        { date: 27, type: '' },
        { date: 28, type: '' },
        { date: 29, type: '' },
        { date: 30, type: '' },
        { date: 31, type: '' }
    ],
    history: {
        avgPeriodLength: 7,
        avgCycleLength: 31,
        lastSync: '06:28 PM IST, Aug 06, 2025'
    }
};

let selectedMood = '';
let quickLogs = new Set();

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('cycleDay')) {
        initializeWomanDashboard();
    }

    if (document.querySelector('.mood-tip')) {
        initializePartnerDashboard();
    }

    // Add edit button event listener
    const editBtn = document.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', handleEditClick);
    }
});

function initializeWomanDashboard() {
    updateCycleDisplay();
    updateProgressRing();
    loadDailyInsights();
    renderCalendar();
    updateAnalysisData();
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
        dayElement.addEventListener('click', () => handleDayClick(day.date));
        calendarGrid.appendChild(dayElement);
    });
}

function handleDayClick(day) {
    const selectedDay = cycleData.days.find(d => d.date === day);
    if (!selectedDay) return;

    const newType = prompt('Set status for day ' + day + ' (period/fertile/leave blank):');
    if (newType) {
        selectedDay.type = newType.toLowerCase() === 'period' || newType.toLowerCase() === 'fertile' ? newType.toLowerCase() : '';
        renderCalendar(); // Re-render to reflect changes
        saveUserData();
        showNotification(`Day ${day} updated to ${newType || 'normal'}.`, 'success');
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
    if (syncInfo) syncInfo.textContent = `Synced with Alex at ${cycleData.history.lastSync}`;
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

    const loggedItems = Array.from(quickLogs).join(', ');
    showNotification(`Logged: ${loggedItems}`, 'success');

    quickLogs.clear();
    document.querySelectorAll('.log-btn').forEach(btn => btn.classList.remove('active'));
    notifyPartner('quick-log', Array.from(quickLogs));
    updateSyncStatus('Quick log synced with partner');
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

// =======================
// OFFLINE AI CHAT (DEMO)
// =======================

function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;

    const chatContainer = document.getElementById('aiChat');
    addChatMessage(chatContainer, message, 'user');

    input.value = '';

    // Simulate AI response
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
    const responses = {
        'period': 'During your period, it\'s normal to experience discomfort. Try rest, hydration, and heating pads. 💙',
        'cramps': 'Menstrual cramps can be eased with warm compresses, light movement, or pain relievers. Stay cozy! 🌸',
        'mood': 'Mood swings are common due to hormones. Journaling or gentle exercise may help! 💆‍♀️',
        'bloating': 'Reduce bloating by drinking water, limiting salt, and eating small meals. 🥒',
        'pregnancy': 'Tracking ovulation can help if you’re trying to conceive. Ovulation usually happens mid-cycle. 💡',
        'exercise': 'Light exercise like yoga or walking can ease symptoms during your cycle. 🚶‍♀️',
        'default': 'I\'m here to help with any menstrual health questions. Try asking about cramps, mood, or cycle tracking! 🤗'
    };

    for (let keyword in responses) {
        if (message.toLowerCase().includes(keyword)) {
            return responses[keyword];
        }
    }

    return responses['default'];
}

// =====================
// OTHER FUNCTIONS BELOW
// =====================

function sendMessageToPartner() {
    const message = prompt('Send a message to your partner:');
    if (message && message.trim()) {
        showNotification('Message sent to your partner!', 'success');
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
            syncStatus.textContent = '🔗 Synced with Alex';
            syncStatus.style.background = '#4CAF50';
        }, 2000);
    }
}

function loadDailyInsights() {
    const insights = [
        "Pattern Detected: You tend to have higher energy levels during days 8-12 of your cycle. Perfect time for workouts!",
        "Reminder: Your period is expected in 4 days. Consider stocking up on essentials.",
        "Wellness Tip: Based on your luteal phase, try magnesium-rich foods to reduce bloating."
    ];
    const insightsContainer = document.querySelector('.insights');
    if (insightsContainer) {
        console.log('Daily insights loaded');
    }
}

// ========================================
// PARTNER DASHBOARD FUNCTIONALITY
// ========================================

function initializePartnerDashboard() {
    updateMoodTip();
    updateLearnSection();
}

function updateMoodTip() {
    const moodTip = document.querySelector('.mood-tip p');
    if (!moodTip) return;

    const tips = {
        'follicular': 'Sarah might be feeling energetic and optimistic! Great time for new activities or adventures together.',
        'ovulation': 'Sarah is likely feeling confident and social. Perfect time for date nights or social gatherings!',
        'luteal': 'Sarah might be feeling more sensitive or need extra comfort. Consider cozy nights in with her favorite treats.',
        'menstrual': 'Sarah might need extra care and comfort. Warm hugs, favorite snacks, and understanding go a long way.'
    };

    let phase = 'luteal';
    if (cycleData.currentDay <= 7) phase = 'menstrual';
    else if (cycleData.currentDay <= 13) phase = 'follicular';
    else if (cycleData.currentDay <= 15) phase = 'ovulation';

    moodTip.textContent = tips[phase];
}

function updateLearnSection() {
    const learnSection = document.querySelector('.learn-fact');
    if (!learnSection) return;

    const facts = [
        "Did you know? The menstrual cycle is controlled by complex hormonal interactions.",
        "Period blood is not just blood – it also contains tissue and secretions.",
        "Exercise helps reduce menstrual cramps by releasing endorphins.",
        "The average woman has around 400 periods in her lifetime.",
        "Chocolate cravings are linked to magnesium deficiency during periods.",
        "Menstrual syncing among women is still debated by science.",
        "Tracking symptoms helps prepare for cycle changes.",
        "Asking 'How can I help?' can be powerful during tough days."
    ];

    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    if (learnSection.querySelector('p')) {
        learnSection.querySelector('p').textContent = randomFact;
    }
}

// ========================================
// UTILITIES, STORAGE, EXPORT
// ========================================

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

function initializeUserData() {
    const savedCycleData = loadFromStorage('cycle_data');
    if (savedCycleData) {
        cycleData = { ...cycleData, ...savedCycleData };
    }

    const preferences = loadFromStorage('preferences', {
        notifications: true,
        partnerSync: true,
        theme: 'default'
    });

    return preferences;
}

function saveUserData() {
    saveToStorage('cycle_data', cycleData);
}

if (typeof window !== 'undefined') {
    window.PairaApp = {
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
        simulateDataSync,
        saveToStorage,
        loadFromStorage,
        cycleData,
        selectedMood,
        quickLogs
    };
}

// Color Representation Explanation (for UI reference)
const colorInfo = `
- **Pink (#ff6b6b)**: Represents period days, indicating the menstrual phase.
- **Yellow (#ffeb3b)**: Represents fertile days, highlighting the ovulation window.
- **Green (#4CAF50)**: Indicates the current day for easy reference.
- **Gray (default)**: Represents normal days with no specific cycle event.
`;
console.log(colorInfo); // This can be logged or displayed in a tooltip/info section if desired