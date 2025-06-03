class TwitterAutoLikerPopup {
    constructor() {
        this.settings = {
            // Notifications settings
            notifAutoLike: false,
            notifScrollMode: 'none', // 'none', 'scroll', 'wait'
            
            // Home feed settings
            homeAutoLike: false,
            homeAutoRetweet: false,
            homeAutoBookmark: false,
            homeAutoScroll: false,
            
            // Single post settings
            postAutoLike: false,
            postAutoReply: false,
            postAutoScroll: false,
            postLikeOriginal: false,
            
            // Common settings
            minDelay: 2,
            maxDelay: 10,
            scrollDelay: 3,
            actionDelay: 500,
            automationDuration: 30, // minutes
            
            // Statistics (consolidated)
            totalActions: 0,
            sessionActions: 0
        };
        
        this.isActive = false;
        this.currentTab = 'notifications';
        this.currentUrl = '';
        this.pageType = 'unknown';
        
        // Timer management
        this.automationTimer = null;
        this.timeRemaining = 0;
        this.startTime = null;
        this.actionsAtStart = 0;
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.bindEvents();
        this.updateUI();
        this.detectCurrentPage();
        this.addLog('Extension initialized with compact interface', 'info');
    }

    async loadSettings() {
        try {
            const stored = await chrome.storage.sync.get(this.settings);
            this.settings = { ...this.settings, ...stored };
        } catch (error) {
            this.addLog('Failed to load settings', 'error');
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set(this.settings);
        } catch (error) {
            this.addLog('Failed to save settings', 'error');
        }
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Page navigation buttons
        document.getElementById('goToNotifications').addEventListener('click', () => {
            this.navigateToPage('https://x.com/notifications');
        });

        document.getElementById('goToHome').addEventListener('click', () => {
            this.navigateToPage('https://x.com/home');
        });

        // Radio button scroll mode
        document.querySelectorAll('input[name="scrollMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.settings.notifScrollMode = e.target.value;
                    this.saveSettings();
                    this.addLog(`Scroll mode: ${e.target.value}`, 'info');
                }
            });
        });

        // Notifications toggles
        document.getElementById('notifAutoLikeToggle').addEventListener('change', (e) => {
            this.settings.notifAutoLike = e.target.checked;
            this.saveSettings();
            this.addLog(`Notifications auto like ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        // Home feed toggles
        document.getElementById('homeAutoLikeToggle').addEventListener('change', (e) => {
            this.settings.homeAutoLike = e.target.checked;
            this.saveSettings();
            this.addLog(`Home feed auto like ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('homeAutoRetweetToggle').addEventListener('change', (e) => {
            this.settings.homeAutoRetweet = e.target.checked;
            this.saveSettings();
            this.addLog(`Home feed auto retweet ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('homeAutoBookmarkToggle').addEventListener('change', (e) => {
            this.settings.homeAutoBookmark = e.target.checked;
            this.saveSettings();
            this.addLog(`Home feed auto bookmark ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('homeAutoScrollToggle').addEventListener('change', (e) => {
            this.settings.homeAutoScroll = e.target.checked;
            this.saveSettings();
            this.addLog(`Home feed auto scroll ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        // Single post toggles
        document.getElementById('postLikeOriginalToggle').addEventListener('change', (e) => {
            this.settings.postLikeOriginal = e.target.checked;
            this.saveSettings();
            this.addLog(`Auto like original post ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('postAutoLikeToggle').addEventListener('change', (e) => {
            this.settings.postAutoLike = e.target.checked;
            this.saveSettings();
            this.addLog(`Post comments auto like ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('postAutoReplyToggle').addEventListener('change', (e) => {
            this.settings.postAutoReply = e.target.checked;
            this.saveSettings();
            this.addLog(`Post auto reply ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('postAutoScrollToggle').addEventListener('change', (e) => {
            this.settings.postAutoScroll = e.target.checked;
            this.saveSettings();
            this.addLog(`Post auto scroll ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        // Settings edit buttons
        document.getElementById('editSettingsBtn').addEventListener('click', () => {
            this.toggleSettingsPanel();
        });

        document.getElementById('editDurationBtn').addEventListener('click', () => {
            this.toggleDurationPanel();
        });

        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.closeSettingsPanel();
        });

        document.getElementById('closeDurationBtn').addEventListener('click', () => {
            this.closeDurationPanel();
        });

        // Delay inputs
        document.getElementById('minDelay').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 60) {
                this.settings.minDelay = value;
                if (value > this.settings.maxDelay) {
                    this.settings.maxDelay = value;
                    document.getElementById('maxDelay').value = value;
                }
                this.saveSettings();
                this.updateDelayDisplay();
                this.addLog(`Min delay set to ${value}s`, 'info');
            }
        });

        document.getElementById('maxDelay').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 60) {
                this.settings.maxDelay = value;
                if (value < this.settings.minDelay) {
                    this.settings.minDelay = value;
                    document.getElementById('minDelay').value = value;
                }
                this.saveSettings();
                this.updateDelayDisplay();
                this.addLog(`Max delay set to ${value}s`, 'info');
            }
        });

        document.getElementById('scrollDelay').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 30) {
                this.settings.scrollDelay = value;
                this.saveSettings();
                this.updateDelayDisplay();
                this.addLog(`Scroll delay set to ${value}s`, 'info');
            }
        });

        document.getElementById('actionDelay').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 100 && value <= 2000) {
                this.settings.actionDelay = value;
                this.saveSettings();
                this.updateDelayDisplay();
                this.addLog(`Action delay set to ${value}ms`, 'info');
            }
        });

        // Duration input
        document.getElementById('automationDuration').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 480) {
                this.settings.automationDuration = value;
                this.saveSettings();
                this.updateDurationDisplay();
                this.addLog(`Automation duration set to ${value} minutes`, 'info');
            }
        });

        // Action buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startAutomation();
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopAutomation();
        });

        document.getElementById('resetStatsBtn').addEventListener('click', () => {
            this.resetStats();
        });

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
        });

        // Check page changes
        setInterval(() => {
            this.detectCurrentPage();
        }, 2000);
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-panel`).classList.add('active');
        
        this.addLog(`Switched to ${tabName} tab`, 'info');
        this.updatePageDetection();
    }

    async navigateToPage(url) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.update(tab.id, { url: url });
            this.addLog(`Navigating to ${url}`, 'info');
            
            setTimeout(() => {
                this.detectCurrentPage();
            }, 2000);
        } catch (error) {
            this.addLog('Failed to navigate to page', 'error');
        }
    }

    async detectCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || (!tab.url.includes('twitter.com') && !tab.url.includes('x.com'))) {
                this.pageType = 'unknown';
                this.currentUrl = '';
                this.updatePageDetection();
                return;
            }

            this.currentUrl = tab.url;
            
            if (tab.url.includes('/notifications')) {
                this.pageType = 'notifications';
            } else if (tab.url.includes('/home') || tab.url === 'https://x.com/' || tab.url === 'https://twitter.com/') {
                this.pageType = 'home';
            } else if (tab.url.includes('/status/')) {
                this.pageType = 'single-post';
            } else {
                this.pageType = 'other';
            }
            
            this.updatePageDetection();
        } catch (error) {
            this.pageType = 'unknown';
            this.updatePageDetection();
        }
    }

    updatePageDetection() {
        const postDetectionStatus = document.getElementById('postDetectionStatus');
        const postDetectionText = document.getElementById('postDetectionText');
        
        if (this.currentTab === 'single-post' && postDetectionStatus && postDetectionText) {
            if (this.pageType === 'single-post') {
                postDetectionStatus.className = 'detection-status detected';
                postDetectionText.textContent = '✅ Single post detected - Automation ready!';
            } else if (this.pageType === 'unknown') {
                postDetectionStatus.className = 'detection-status error';
                postDetectionText.textContent = '❌ Not on Twitter/X - Please navigate to a post';
            } else {
                postDetectionStatus.className = 'detection-status';
                postDetectionText.textContent = '⚠️ Navigate to a single post to enable automation';
            }
        }
    }

    toggleSettingsPanel() {
        const panel = document.getElementById('settingsPanel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }

    toggleDurationPanel() {
        const panel = document.getElementById('durationPanel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }

    closeSettingsPanel() {
        document.getElementById('settingsPanel').style.display = 'none';
    }

    closeDurationPanel() {
        document.getElementById('durationPanel').style.display = 'none';
    }

    updateDelayDisplay() {
        const delayDisplay = document.getElementById('delayDisplay');
        if (delayDisplay) {
            delayDisplay.textContent = `${this.settings.minDelay}-${this.settings.maxDelay}s`;
        }
    }

    updateDurationDisplay() {
        const durationDisplay = document.getElementById('durationDisplay');
        if (durationDisplay) {
            durationDisplay.textContent = `${this.settings.automationDuration} min`;
        }
    }

    async startAutomation() {
        const mode = this.currentTab;
        let hasEnabledFeatures = false;
        
        // Check if any features are enabled for current mode
        if (mode === 'notifications') {
            hasEnabledFeatures = this.settings.notifAutoLike;
            if (!hasEnabledFeatures) {
                this.addLog('Please enable auto like for notifications', 'warning');
                return;
            }
        } else if (mode === 'home') {
            hasEnabledFeatures = this.settings.homeAutoLike || this.settings.homeAutoRetweet || this.settings.homeAutoBookmark;
            if (!hasEnabledFeatures) {
                this.addLog('Please enable at least one home feed action', 'warning');
                return;
            }
        } else if (mode === 'single-post') {
            hasEnabledFeatures = this.settings.postAutoLike || this.settings.postAutoReply || this.settings.postLikeOriginal;
            if (!hasEnabledFeatures) {
                this.addLog('Please enable at least one post action', 'warning');
                return;
            }
            if (this.pageType !== 'single-post') {
                this.addLog('Please navigate to a single post first', 'warning');
                return;
            }
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                this.addLog('Please navigate to Twitter/X first', 'warning');
                return;
            }

            // Update settings based on scroll mode for notifications
            if (mode === 'notifications') {
                this.settings.notifAutoScroll = this.settings.notifScrollMode === 'scroll';
                this.settings.notifWaitForNew = this.settings.notifScrollMode === 'wait';
            }

            // Send start message to content script
            await chrome.tabs.sendMessage(tab.id, {
                action: 'START_AUTOMATION',
                mode: mode,
                settings: this.settings,
                pageType: this.pageType
            });

            this.isActive = true;
            this.startTimer();
            this.switchToActiveMode();
            this.addLog(`${mode} automation started for ${this.settings.automationDuration} minutes`, 'success');

        } catch (error) {
            this.addLog('Failed to start automation', 'error');
            console.error(error);
        }
    }

    async stopAutomation() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'STOP_AUTOMATION'
            });

            this.isActive = false;
            this.stopTimer();
            this.switchToConfigMode();
            this.addLog('Automation stopped', 'info');

        } catch (error) {
            this.addLog('Failed to stop automation', 'error');
        }
    }

    startTimer() {
        this.timeRemaining = this.settings.automationDuration * 60; // Convert to seconds
        this.startTime = Date.now();
        this.actionsAtStart = this.settings.totalActions;
        
        this.automationTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            this.updateActionsPerMinute();
            
            if (this.timeRemaining <= 0) {
                this.stopAutomation();
                this.addLog('Automation stopped - time limit reached', 'info');
            }
        }, 1000);
    }

    stopTimer() {
        if (this.automationTimer) {
            clearInterval(this.automationTimer);
            this.automationTimer = null;
        }
    }

    updateTimerDisplay() {
        const timeRemainingEl = document.getElementById('timeRemaining');
        if (timeRemainingEl) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            timeRemainingEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateActionsPerMinute() {
        const actionsPerMinuteEl = document.getElementById('actionsPerMinute');
        if (actionsPerMinuteEl && this.startTime) {
            const elapsedMinutes = (Date.now() - this.startTime) / (1000 * 60);
            const actionsSinceStart = this.settings.totalActions - this.actionsAtStart;
            const actionsPerMinute = elapsedMinutes > 0 ? Math.round(actionsSinceStart / elapsedMinutes) : 0;
            actionsPerMinuteEl.textContent = actionsPerMinute;
        }
    }

    switchToActiveMode() {
        document.getElementById('configMode').style.display = 'none';
        document.getElementById('activeMode').style.display = 'block';
        this.updateActiveStats();
    }

    switchToConfigMode() {
        document.getElementById('configMode').style.display = 'block';
        document.getElementById('activeMode').style.display = 'none';
        this.updateUI();
    }

    updateActiveStats() {
        document.getElementById('activeTotalActions').textContent = this.settings.totalActions;
        document.getElementById('activeSessionActions').textContent = this.settings.sessionActions;
    }

    async resetStats() {
        this.settings.totalActions = 0;
        this.settings.sessionActions = 0;
        await this.saveSettings();
        this.updateUI();
        this.addLog('Statistics reset', 'info');
    }

    handleMessage(message) {
        switch (message.action) {
            case 'LIKE_SUCCESS':
            case 'RETWEET_SUCCESS':
            case 'BOOKMARK_SUCCESS':
                this.settings.sessionActions++;
                this.settings.totalActions++;
                this.saveSettings();
                this.updateUI();
                this.updateActiveStats();
                
                const actionType = message.action.replace('_SUCCESS', '').toLowerCase();
                this.addLog(`${actionType} action completed (Total: ${this.settings.totalActions})`, 'success');
                this.addActiveLog(`${actionType} action completed (Total: ${this.settings.totalActions})`, 'success');
                break;
                
            case 'LIKE_SKIPPED':
                this.addLog('Content already liked, skipped', 'info');
                this.addActiveLog('Content already liked, skipped', 'info');
                break;
                
            case 'ERROR':
                this.addLog(message.error || 'An error occurred', 'error');
                this.addActiveLog(message.error || 'An error occurred', 'error');
                break;
                
            case 'STATUS_UPDATE':
                this.addLog(message.message, message.type || 'info');
                this.addActiveLog(message.message, message.type || 'info');
                break;
                
            case 'STOPPED':
                this.isActive = false;
                this.stopTimer();
                this.switchToConfigMode();
                this.addLog('Automation stopped', 'info');
                break;
        }
    }

    updateUI() {
        // Update notification settings
        document.getElementById('notifAutoLikeToggle').checked = this.settings.notifAutoLike;
        
        // Update scroll mode radio buttons
        document.querySelector(`input[name="scrollMode"][value="${this.settings.notifScrollMode}"]`).checked = true;
        
        // Update home feed toggles
        document.getElementById('homeAutoLikeToggle').checked = this.settings.homeAutoLike;
        document.getElementById('homeAutoRetweetToggle').checked = this.settings.homeAutoRetweet;
        document.getElementById('homeAutoBookmarkToggle').checked = this.settings.homeAutoBookmark;
        document.getElementById('homeAutoScrollToggle').checked = this.settings.homeAutoScroll;
        
        // Update single post toggles
        document.getElementById('postLikeOriginalToggle').checked = this.settings.postLikeOriginal;
        document.getElementById('postAutoLikeToggle').checked = this.settings.postAutoLike;
        document.getElementById('postAutoReplyToggle').checked = this.settings.postAutoReply;
        document.getElementById('postAutoScrollToggle').checked = this.settings.postAutoScroll;
        
        // Update delay inputs
        document.getElementById('minDelay').value = this.settings.minDelay;
        document.getElementById('maxDelay').value = this.settings.maxDelay;
        document.getElementById('scrollDelay').value = this.settings.scrollDelay;
        document.getElementById('actionDelay').value = this.settings.actionDelay;
        document.getElementById('automationDuration').value = this.settings.automationDuration;
        
        // Update displays
        this.updateDelayDisplay();
        this.updateDurationDisplay();
        
        // Update stats
        document.getElementById('totalActions').textContent = this.settings.totalActions;
        document.getElementById('sessionActions').textContent = this.settings.sessionActions;
        
        // Update status
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (this.isActive) {
            statusIndicator.classList.add('active');
            statusText.textContent = `${this.currentTab} automation active`;
        } else {
            statusIndicator.classList.remove('active');
            statusText.textContent = 'Ready';
        }
    }

    addLog(message, type = 'info') {
        // Only add to config mode logs when in config mode
        if (!this.isActive) {
            console.log(`[Twitter Auto Liker Pro] ${message}`);
        }
    }

    addActiveLog(message, type = 'info') {
        const logsContainer = document.getElementById('activeLogsContainer');
        if (!logsContainer) return;
        
        const logItem = document.createElement('div');
        logItem.className = `log-item ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logItem.textContent = `[${timestamp}] ${message}`;
        
        logsContainer.appendChild(logItem);
        
        // Keep only last 100 logs
        while (logsContainer.children.length > 100) {
            logsContainer.removeChild(logsContainer.firstChild);
        }
        
        // Scroll to bottom
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TwitterAutoLikerPopup();
}); 