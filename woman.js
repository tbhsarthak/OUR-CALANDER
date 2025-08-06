// ========================================
// WOMAN DASHBOARD FUNCTIONALITY
// ========================================

// Sample data - in real app this would come from database
let cycleData = {
    currentDay: 12,
    cycleLength: 28,
    periodLength: 5,
    phase: 'Luteal Phase'
};

let selectedMood = '';
let quickLogs = new Set();

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the woman dashboard page
    if (document.getElementById('cycleDay')) {
        initializeWomanDashboard();
    }
    
    // Check if we're on partner dashboard page
    if (document.querySelector('.mood-tip')) {
        initializePartnerDashboard();
    }
});

// Initialize woman dashboard
function initializeWomanDashboard() {
    updateCycleDisplay();
    updateProgressRing();
    loadDailyInsights();
}

// Update cycle display
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

// Update progress ring
function updateProgressRing() {
    const progressCircle = document.getElementById('progressCircle');
    if (!progressCircle) return;
    
    const circumference = 2 * Math.PI * 52;
    const progress = (cycleData.currentDay / cycleData.cycleLength) * circumference;
    progressCircle.style.strokeDasharray = `${progress} ${circumference}`;
}

// Toggle quick log buttons
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

// Save quick log
function saveQuickLog() {
    if (quickLogs.size === 0) {
        showNotification('Please select at least one item to log.', 'warning');
        return;
    }
    
    const loggedItems = Array.from(quickLogs).join(', ');
    showNotification(`Logged: ${loggedItems}`, 'success');
    
    // Clear selections
    quickLogs.clear();
    document.querySelectorAll('.log-btn').forEach(btn => btn.classList.remove('active'));
    
    // Update partner dashboard (simulate sync)
    notifyPartner('quick-log', Array.from(quickLogs));
    
    // Update sync status
    updateSyncStatus('Quick log synced with partner');
}

// Select mood
function selectMood(element) {
    document.querySelectorAll('.mood-emoji').forEach(emoji => emoji.classList.remove('selected'));
    element.classList.add('selected');
    selectedMood = element.dataset.mood;
}

// Save mood
function saveMood() {
    if (!selectedMood) {
        showNotification('Please select a mood first.', 'warning');
        return;
    }
    
    const notes = document.getElementById('moodNotes').value;
    const moodText = getMoodText(selectedMood);
    
    showNotification(`Mood saved: ${moodText}${notes ? '\nNotes: ' + notes : ''}`, 'success');
    
    // Sync with partner
    notifyPartner('mood-update', { mood: selectedMood, notes: notes });
    
    // Clear form
    document.getElementById('moodNotes').value = '';
    document.querySelectorAll('.mood-emoji').forEach(emoji => emoji.classList.remove('selected'));
    selectedMood = '';
    
    // Update sync status
    updateSyncStatus('Mood synced with partner');
}

// Get mood text from emoji
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

// AI Chat functionality
function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    const chatContainer = document.getElementById('aiChat');
    addChatMessage(chatContainer, message, 'user');

    // Simulate AI response
    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        addChatMessage(chatContainer, aiResponse, 'ai');
    }, 1000);

    input.value = '';
}

// Handle Enter key in AI chat
function handleAIEnter(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

// Add chat message to container
function addChatMessage(container, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// Generate AI response (simulate)
function generateAIResponse(message) {
    const responses = {
        'period': 'During your period, it\'s normal to experience some discomfort. Try gentle exercises, heat therapy, and staying hydrated. If pain is severe, consult your healthcare provider.',
        'cramps': 'For menstrual cramps, try heat pads, gentle massage, light exercise, or over-the-counter pain relievers. Magnesium supplements may also help.',
        'mood': 'Mood changes during your cycle are completely normal due to hormonal fluctuations. Try regular exercise, adequate sleep, and stress management techniques.',
        'bloating': 'To reduce bloating, try limiting salt intake, drinking plenty of water, eating smaller meals, and gentle exercises like walking or yoga.',
        'pregnancy': 'If you\'re trying to conceive, track your ovulation window (typically days 12-16 of a 28-day cycle). If you\'re not, use appropriate contraception consistently.',
        'exercise': 'Exercise during your period can actually help reduce cramps and boost mood. Try low-impact activities like walking, yoga, or swimming.',
        'default': 'I\'m here to help with any menstrual health questions! You can ask about symptoms, cycle tracking, wellness tips, or general reproductive health.'
    };

    // Simple keyword matching
    for (let keyword in responses) {
        if (message.toLowerCase().includes(keyword)) {
            return responses[keyword];
        }
    }
    
    return responses['default'];
}

// Send message to partner
function sendMessageToPartner() {
    const message = prompt('Send a message to your partner:');
    if (message && message.trim()) {
        showNotification('Message sent to your partner!', 'success');
        // In real app, this would send to partner's dashboard
        notifyPartner('message', { text: message, timestamp: new Date() });
    }
}

// Notify partner (simulate sync)
function notifyPartner(type, data) {
    // In real app, this would be an API call
    console.log('Syncing with partner:', type, data);
    
    // Simulate partner notification
    setTimeout(() => {
        updateSyncStatus(`${type} synced successfully`);
    }, 500);
}

// Update sync status
function updateSyncStatus(message) {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        syncStatus.textContent = `🔄 ${message}`;
        syncStatus.style.background = '#FF9800';
        
        // Revert to synced status after 2 seconds
        setTimeout(() => {
            syncStatus.textContent = '🔗 Synced with Alex';
            syncStatus.style.background = '#4CAF50';
        }, 2000);
    }
}

// Load daily insights
function loadDailyInsights() {
    // This would fetch from API in real app
    const insights = [
        "Pattern Detected: You tend to have higher energy levels during days 8-12 of your cycle. Perfect time for workouts!",
        "Reminder: Your period is expected in 4 days. Consider stocking up on essentials.",
        "Wellness Tip: Based on your luteal phase, try magnesium-rich foods to reduce bloating."
    ];
    
    // Update insights if container exists
    const insightsContainer = document.querySelector('.insights');
    if (insightsContainer) {
        // Insights are already in HTML, could make them dynamic here
        console.log('Daily insights loaded');
    }
}

// ========================================
// PARTNER DASHBOARD FUNCTIONALITY
// ========================================

// Initialize partner dashboard
function initializePartnerDashboard() {
    updateMoodTip();
    updateLearnSection();
}

// Update mood tip based on cycle day
function updateMoodTip() {
    const moodTip = document.querySelector('.mood-tip p');
    if (!moodTip) return;

    const tips = {
        'follicular': 'Sarah might be feeling energetic and optimistic! Great time for new activities or adventures together.',
        'ovulation': 'Sarah is likely feeling confident and social. Perfect time for date nights or social gatherings!',
        'luteal': 'Sarah might be feeling more sensitive or need extra comfort. Consider cozy nights in with her favorite treats.',
        'menstrual': 'Sarah might need extra care and comfort. Warm hugs, favorite snacks, and understanding go a long way.'
    };

    // Simple phase detection based on cycle day
    let phase = 'luteal'; // Default based on current day 12
    if (cycleData.currentDay <= 5) phase = 'menstrual';
    else if (cycleData.currentDay <= 13) phase = 'follicular';
    else if (cycleData.currentDay <= 15) phase = 'ovulation';

    moodTip.textContent = tips[phase];
}

// Update "Learn Something New" section
function updateLearnSection() {
    const learnSection = document.querySelector('.learn-fact');
    if (!learnSection) return;

    const facts = [
        "Did you know? The menstrual cycle is controlled by complex interactions between hormones produced by the hypothalamus, pituitary gland, and ovaries.",
        "Fun fact: Period blood isn't just blood - it's also tissue from the uterine lining, vaginal secretions, and bacteria.",
        "Health tip: Regular exercise can help reduce menstrual cramps by releasing endorphins, the body's natural painkillers.",
        "Interesting: The average woman will have about 400 periods during her lifetime.",
        "Did you know? Chocolate cravings during periods are real! The body craves magnesium, which chocolate contains.",
        "Science fact: Menstrual synchrony (periods syncing) among women living together is still debated by scientists.",
        "Health insight: Tracking mood and symptoms can help predict and prepare for cycle changes.",
        "Supportive tip: Simply asking 'How can I help?' can mean the world during difficult cycle days."
    ];

    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    if (learnSection.querySelector('p')) {
        learnSection.querySelector('p').textContent = randomFact;
    }
}

// ========================================
// SHARED UTILITY FUNCTIONS
// ========================================

// Show notification (creates temporary notification)
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    // Add notification styles
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

    // Add animation keyframes if not exist
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

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// Format date for display
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Calculate cycle phase
function calculatePhase(cycleDay, cycleLength = 28) {
    if (cycleDay <= 5) return 'Menstrual';
    if (cycleDay <= Math.floor(cycleLength / 2) - 2) return 'Follicular';
    if (cycleDay <= Math.floor(cycleLength / 2) + 2) return 'Ovulation';
    return 'Luteal';
}

// Calculate pregnancy risk
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

// Get days until next period
function getDaysUntilPeriod(cycleDay, cycleLength = 28) {
    return cycleLength - cycleDay;
}

// Simulate data sync (for development)
function simulateDataSync() {
    // Simulate receiving data from partner or updating cycle info
    const events = [
        { type: 'mood_update', data: { mood: 'happy', notes: 'Feeling great today!' } },
        { type: 'cycle_update', data: { day: cycleData.currentDay + 1 } },
        { type: 'partner_message', data: { message: 'Thinking of you! ❤️' } }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    console.log('Simulated sync event:', randomEvent);
    
    return randomEvent;
}

// ========================================
// LANDING PAGE FUNCTIONALITY (if needed)
// ========================================

// Handle navigation from landing page
function navigateToApp(userType) {
    if (userType === 'woman') {
        window.location.href = 'woman.html';
    } else if (userType === 'partner') {
        window.location.href = 'partner.html';
    }
}

// ========================================
// DATA PERSISTENCE (LOCAL STORAGE)
// ========================================

// Save data to local storage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(`paira_${key}`, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

// Load data from local storage
function loadFromStorage(key, defaultValue = null) {
    try {
        const stored = localStorage.getItem(`paira_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return defaultValue;
    }
}

// Initialize user data
function initializeUserData() {
    // Load saved cycle data
    const savedCycleData = loadFromStorage('cycle_data');
    if (savedCycleData) {
        cycleData = { ...cycleData, ...savedCycleData };
    }
    
    // Load user preferences
    const preferences = loadFromStorage('preferences', {
        notifications: true,
        partnerSync: true,
        theme: 'default'
    });
    
    return preferences;
}

// Save user data
function saveUserData() {
    saveToStorage('cycle_data', cycleData);
    // Save other user data as needed
}

// ========================================
// EXPORT FUNCTIONS (for testing/debugging)
// ========================================

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.PairaApp = {
        // Woman dashboard functions
        toggleLog,
        saveQuickLog,
        selectMood,
        saveMood,
        sendAIMessage,
        handleAIEnter,
        sendMessageToPartner,
        
        // Shared functions
        showNotification,
        calculatePhase,
        calculatePregnancyRisk,
        simulateDataSync,
        
        // Data functions
        saveToStorage,
        loadFromStorage,
        
        // Data
        cycleData,
        selectedMood,
        quickLogs
    };
}