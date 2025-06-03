class TwitterAutoLikerPopup {
    constructor() {
        this.settings = {
            autoLike: false,
            autoScroll: false,
            waitForNew: false,
            minDelay: 2,
            maxDelay: 10,
            totalLikes: 0,
            sessionLikes: 0
        };
        
        this.isActive = false;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.bindEvents();
        this.updateUI();
        this.addLog('Extension initialized', 'info');
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
            this.addLog('Settings saved', 'success');
        } catch (error) {
            this.addLog('Failed to save settings', 'error');
        }
    }

    bindEvents() {
        // Toggle switches
        document.getElementById('autoLikeToggle').addEventListener('change', (e) => {
            this.settings.autoLike = e.target.checked;
            this.saveSettings();
            this.addLog(`Auto like ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('autoScrollToggle').addEventListener('change', (e) => {
            this.settings.autoScroll = e.target.checked;
            this.saveSettings();
            this.addLog(`Auto scroll ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        document.getElementById('waitForNewToggle').addEventListener('change', (e) => {
            this.settings.waitForNew = e.target.checked;
            this.saveSettings();
            this.addLog(`Wait for new notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        // Delay inputs
        document.getElementById('minDelay').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 60) {
                this.settings.minDelay = value;
                // Ensure min is not greater than max
                if (value > this.settings.maxDelay) {
                    this.settings.maxDelay = value;
                    document.getElementById('maxDelay').value = value;
                }
                this.saveSettings();
                this.addLog(`Min delay set to ${value}s`, 'info');
            }
        });

        document.getElementById('maxDelay').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 60) {
                this.settings.maxDelay = value;
                // Ensure max is not less than min
                if (value < this.settings.minDelay) {
                    this.settings.minDelay = value;
                    document.getElementById('minDelay').value = value;
                }
                this.saveSettings();
                this.addLog(`Max delay set to ${value}s`, 'info');
            }
        });

        // Action buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startAutoLiker();
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopAutoLiker();
        });

        document.getElementById('resetStatsBtn').addEventListener('click', () => {
            this.resetStats();
        });

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
        });
    }

    async startAutoLiker() {
        if (!this.settings.autoLike && !this.settings.autoScroll && !this.settings.waitForNew) {
            this.addLog('Please enable at least one feature', 'warning');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                this.addLog('Please navigate to Twitter/X first', 'warning');
                return;
            }

            // Send start message to content script
            await chrome.tabs.sendMessage(tab.id, {
                action: 'START_AUTO_LIKER',
                settings: this.settings
            });

            this.isActive = true;
            this.updateUI();
            this.addLog('Auto liker started', 'success');

        } catch (error) {
            this.addLog('Failed to start auto liker', 'error');
            console.error(error);
        }
    }

    async stopAutoLiker() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'STOP_AUTO_LIKER'
            });

            this.isActive = false;
            this.updateUI();
            this.addLog('Auto liker stopped', 'info');

        } catch (error) {
            this.addLog('Failed to stop auto liker', 'error');
        }
    }

    async resetStats() {
        this.settings.totalLikes = 0;
        this.settings.sessionLikes = 0;
        await this.saveSettings();
        this.updateUI();
        this.addLog('Statistics reset', 'info');
    }

    handleMessage(message) {
        switch (message.action) {
            case 'LIKE_SUCCESS':
                this.settings.sessionLikes++;
                this.settings.totalLikes++;
                this.saveSettings();
                this.updateUI();
                this.addLog(`Liked tweet (Total: ${this.settings.totalLikes})`, 'success');
                break;
                
            case 'LIKE_SKIPPED':
                this.addLog('Tweet already liked, skipped', 'info');
                break;
                
            case 'ERROR':
                this.addLog(message.error || 'An error occurred', 'error');
                break;
                
            case 'STATUS_UPDATE':
                this.addLog(message.message, message.type || 'info');
                break;
                
            case 'STOPPED':
                this.isActive = false;
                this.updateUI();
                this.addLog('Auto liker stopped', 'info');
                break;
        }
    }

    updateUI() {
        // Update toggles
        document.getElementById('autoLikeToggle').checked = this.settings.autoLike;
        document.getElementById('autoScrollToggle').checked = this.settings.autoScroll;
        document.getElementById('waitForNewToggle').checked = this.settings.waitForNew;
        
        // Update delays
        document.getElementById('minDelay').value = this.settings.minDelay;
        document.getElementById('maxDelay').value = this.settings.maxDelay;
        
        // Update stats
        document.getElementById('totalLikes').textContent = this.settings.totalLikes;
        document.getElementById('sessionLikes').textContent = this.settings.sessionLikes;
        
        // Update status
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (this.isActive) {
            statusIndicator.classList.add('active');
            statusText.textContent = 'Active';
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            statusIndicator.classList.remove('active');
            statusText.textContent = 'Ready';
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    addLog(message, type = 'info') {
        const logsContainer = document.getElementById('logsContainer');
        const logItem = document.createElement('div');
        logItem.className = `log-item ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logItem.textContent = `[${timestamp}] ${message}`;
        
        logsContainer.appendChild(logItem);
        
        // Keep only last 50 logs
        while (logsContainer.children.length > 50) {
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