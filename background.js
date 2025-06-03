class TwitterAutoLikerBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupInstallListener();
        this.setupMessageListener();
        this.setupTabListener();
        console.log('Twitter Auto Liker background script loaded');
    }

    setupInstallListener() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.setDefaultSettings();
                this.openWelcomePage();
            } else if (details.reason === 'update') {
                this.handleUpdate();
            }
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });
    }

    setupTabListener() {
        // Listen for tab updates to detect Twitter navigation
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && 
                (tab.url?.includes('twitter.com') || tab.url?.includes('x.com'))) {
                // Inject content script if not already injected
                this.ensureContentScriptInjected(tabId);
            }
        });
    }

    async setDefaultSettings() {
        const defaultSettings = {
            autoLike: false,
            autoScroll: false,
            waitForNew: false,
            minDelay: 2,
            maxDelay: 10,
            totalLikes: 0,
            sessionLikes: 0
        };

        try {
            await chrome.storage.sync.set(defaultSettings);
            console.log('Default settings set');
        } catch (error) {
            console.error('Failed to set default settings:', error);
        }
    }

    openWelcomePage() {
        // Open a welcome tab with instructions
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html')
        });
    }

    handleUpdate() {
        console.log('Extension updated');
        // Handle any migration logic here
    }

    async ensureContentScriptInjected(tabId) {
        try {
            // Try to ping the content script
            await chrome.tabs.sendMessage(tabId, { action: 'PING' });
        } catch (error) {
            // Content script not injected, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
                console.log('Content script injected into tab:', tabId);
            } catch (injectionError) {
                console.error('Failed to inject content script:', injectionError);
            }
        }
    }

    async handleMessage(message, sender, sendResponse) {
        switch (message.action) {
            case 'GET_SETTINGS':
                try {
                    const settings = await chrome.storage.sync.get();
                    sendResponse({ success: true, settings });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'SAVE_SETTINGS':
                try {
                    await chrome.storage.sync.set(message.settings);
                    sendResponse({ success: true });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'UPDATE_STATS':
                try {
                    const current = await chrome.storage.sync.get(['totalLikes', 'sessionLikes']);
                    const updated = {
                        totalLikes: (current.totalLikes || 0) + (message.totalLikes || 0),
                        sessionLikes: (current.sessionLikes || 0) + (message.sessionLikes || 0)
                    };
                    await chrome.storage.sync.set(updated);
                    sendResponse({ success: true, stats: updated });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'RESET_STATS':
                try {
                    await chrome.storage.sync.set({
                        totalLikes: 0,
                        sessionLikes: 0
                    });
                    sendResponse({ success: true });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }
}

// Initialize background script
new TwitterAutoLikerBackground(); 