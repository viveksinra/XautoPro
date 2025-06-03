class TwitterAutoLiker {
    constructor() {
        this.isRunning = false;
        this.settings = {
            autoLike: false,
            autoScroll: false,
            waitForNew: false,
            minDelay: 2,
            maxDelay: 10
        };
        this.intervalId = null;
        this.scrollIntervalId = null;
        this.waitForNewIntervalId = null;
        this.likedTweets = new Set();
        this.lastScrollPosition = 0;
        this.scrollDirection = 'down';
        this.noNewContentCount = 0;
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.detectPageType();
        console.log('Twitter Auto Liker content script loaded');
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'START_AUTO_LIKER':
                    this.start(message.settings);
                    break;
                case 'STOP_AUTO_LIKER':
                    this.stop();
                    break;
            }
        });
    }

    detectPageType() {
        const url = window.location.href;
        this.isNotificationsPage = url.includes('/notifications');
        
        if (this.isNotificationsPage) {
            this.sendMessage('STATUS_UPDATE', { message: 'Notifications page detected', type: 'info' });
        }
    }

    start(settings) {
        if (this.isRunning) return;
        
        this.settings = settings;
        this.isRunning = true;
        
        this.sendMessage('STATUS_UPDATE', { message: 'Auto liker started', type: 'success' });
        
        if (settings.autoLike) {
            this.startAutoLiking();
        }
        
        if (settings.autoScroll) {
            this.startAutoScrolling();
        }
        
        if (settings.waitForNew) {
            this.startWaitingForNew();
        }
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.scrollIntervalId) {
            clearInterval(this.scrollIntervalId);
            this.scrollIntervalId = null;
        }
        
        if (this.waitForNewIntervalId) {
            clearInterval(this.waitForNewIntervalId);
            this.waitForNewIntervalId = null;
        }
        
        this.sendMessage('STOPPED');
    }

    startAutoLiking() {
        const processLikes = () => {
            if (!this.isRunning) return;
            
            try {
                const likeButtons = this.findLikeButtons();
                
                if (likeButtons.length === 0) {
                    this.sendMessage('STATUS_UPDATE', { message: 'No like buttons found', type: 'info' });
                    return;
                }
                
                // Process one like button at a time
                const button = likeButtons[0];
                this.processLikeButton(button);
                
            } catch (error) {
                this.sendMessage('ERROR', { error: error.message });
            }
        };
        
        // Start immediately, then repeat with random delays
        processLikes();
        
        const scheduleNext = () => {
            if (!this.isRunning) return;
            
            const delay = this.getRandomDelay();
            this.sendMessage('STATUS_UPDATE', { 
                message: `Next action in ${delay}s`, 
                type: 'info' 
            });
            
            setTimeout(() => {
                processLikes();
                scheduleNext();
            }, delay * 1000);
        };
        
        scheduleNext();
    }

    startAutoScrolling() {
        this.lastScrollPosition = window.scrollY;
        this.scrollDirection = 'down';
        this.noNewContentCount = 0;
        
        this.scrollIntervalId = setInterval(() => {
            if (!this.isRunning) return;
            
            const currentPosition = window.scrollY;
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            
            // Check if we've found any like buttons in current view
            const likeButtons = this.findLikeButtons();
            
            if (likeButtons.length > 0) {
                // Found content to like, pause scrolling briefly
                this.sendMessage('STATUS_UPDATE', { 
                    message: `Found ${likeButtons.length} items to like, pausing scroll`, 
                    type: 'info' 
                });
                return;
            }
            
            if (this.scrollDirection === 'down') {
                // Scroll down to find more content
                if (currentPosition + windowHeight >= documentHeight - 100) {
                    // Reached bottom, check if we found anything new
                    this.noNewContentCount++;
                    if (this.noNewContentCount >= 3) {
                        // No new content found after several attempts, scroll back to top
                        this.sendMessage('STATUS_UPDATE', { 
                            message: 'Reached bottom, scrolling back to top', 
                            type: 'info' 
                        });
                        this.scrollDirection = 'up';
                        this.noNewContentCount = 0;
                    } else {
                        // Wait a bit for new content to load
                        this.sendMessage('STATUS_UPDATE', { 
                            message: 'Waiting for new content to load...', 
                            type: 'info' 
                        });
                    }
                } else {
                    // Continue scrolling down
                    window.scrollBy({
                        top: 400,
                        behavior: 'smooth'
                    });
                    this.sendMessage('STATUS_UPDATE', { 
                        message: 'Scrolling down to find more notifications', 
                        type: 'info' 
                    });
                }
            } else {
                // Scrolling back up to top
                if (currentPosition <= 100) {
                    // Reached top, start scrolling down again
                    this.scrollDirection = 'down';
                    this.noNewContentCount = 0;
                    this.sendMessage('STATUS_UPDATE', { 
                        message: 'Back at top, starting new scroll cycle', 
                        type: 'info' 
                    });
                } else {
                    window.scrollBy({
                        top: -400,
                        behavior: 'smooth'
                    });
                }
            }
            
            this.lastScrollPosition = currentPosition;
            
        }, 2000); // Check every 2 seconds
    }

    startWaitingForNew() {
        // Stay at the top and periodically check for new notifications
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.waitForNewIntervalId = setInterval(() => {
            if (!this.isRunning) return;
            
            // Keep at top of page
            if (window.scrollY > 100) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            // Check for new notifications at the top
            const likeButtons = this.findLikeButtons();
            if (likeButtons.length > 0) {
                this.sendMessage('STATUS_UPDATE', { 
                    message: `Found ${likeButtons.length} new notifications to like`, 
                    type: 'success' 
                });
            } else {
                this.sendMessage('STATUS_UPDATE', { 
                    message: 'Waiting for new notifications...', 
                    type: 'info' 
                });
            }
        }, 5000); // Check every 5 seconds
    }

    findLikeButtons() {
        // Multiple selectors for different Twitter layouts and versions
        const selectors = [
            // Standard like buttons
            '[data-testid="like"]',
            '[aria-label*="Like"]',
            '[aria-label*="like"]',
            // Alternative selectors for different layouts
            'div[role="button"][aria-label*="Like"]',
            'button[aria-label*="Like"]',
            // Heart icon containers
            'div[data-testid="like"] svg',
            // Backup selectors
            '[data-testid="unlike"]', // Sometimes the testid changes when liked
        ];
        
        const buttons = [];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                // Find the clickable parent if this is an SVG or inner element
                const button = this.findClickableParent(element);
                if (button && this.isValidLikeButton(button)) {
                    buttons.push(button);
                }
            }
        }
        
        // Remove duplicates and already processed tweets
        const uniqueButtons = this.removeDuplicates(buttons);
        
        // Filter out already liked tweets
        return uniqueButtons.filter(button => !this.isAlreadyLiked(button));
    }

    findClickableParent(element) {
        let current = element;
        let depth = 0;
        
        while (current && depth < 5) {
            if (current.tagName === 'BUTTON' || 
                current.getAttribute('role') === 'button' ||
                current.hasAttribute('data-testid')) {
                return current;
            }
            current = current.parentElement;
            depth++;
        }
        
        return element;
    }

    isValidLikeButton(button) {
        if (!button) return false;
        
        // Check if it's visible
        const rect = button.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        
        // Check if it's in the viewport
        if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
        
        // Check for like-related attributes
        const ariaLabel = button.getAttribute('aria-label') || '';
        const testId = button.getAttribute('data-testid') || '';
        
        return (
            ariaLabel.toLowerCase().includes('like') ||
            testId.includes('like') ||
            testId.includes('unlike')
        );
    }

    isAlreadyLiked(button) {
        // Check multiple indicators that a tweet is already liked
        
        // 1. Check aria-label for "Unlike" or similar
        const ariaLabel = button.getAttribute('aria-label') || '';
        if (ariaLabel.toLowerCase().includes('unlike') || 
            ariaLabel.toLowerCase().includes('liked')) {
            return true;
        }
        
        // 2. Check data-testid
        const testId = button.getAttribute('data-testid') || '';
        if (testId === 'unlike') {
            return true;
        }
        
        // 3. Check for filled heart icon (liked state)
        const svg = button.querySelector('svg');
        if (svg) {
            const path = svg.querySelector('path');
            if (path) {
                const fill = path.getAttribute('fill');
                const pathData = path.getAttribute('d');
                // Filled heart usually has fill color or specific path
                if (fill && fill !== 'none' && fill !== 'transparent' && fill !== 'currentColor') {
                    return true;
                }
                // Check for filled heart path pattern
                if (pathData && pathData.includes('21.35')) { // Filled heart path signature
                    return true;
                }
            }
        }
        
        // 4. Check for red/pink color indicating liked state
        const computedStyle = window.getComputedStyle(button);
        const color = computedStyle.color;
        if (color.includes('rgb(224, 36, 94)') || // Twitter red
            color.includes('rgb(249, 24, 128)') || // Pink
            color.includes('#e0245e')) { // Hex red
            return true;
        }
        
        // 5. Check parent tweet container for unique identifier
        const tweetContainer = this.findTweetContainer(button);
        if (tweetContainer) {
            const tweetId = this.getTweetId(tweetContainer);
            if (tweetId && this.likedTweets.has(tweetId)) {
                return true;
            }
        }
        
        return false;
    }

    findTweetContainer(button) {
        let current = button;
        let depth = 0;
        
        while (current && depth < 10) {
            // Look for tweet article container
            if (current.tagName === 'ARTICLE' ||
                current.getAttribute('data-testid') === 'tweet' ||
                current.getAttribute('role') === 'article') {
                return current;
            }
            current = current.parentElement;
            depth++;
        }
        
        return null;
    }

    getTweetId(tweetContainer) {
        // Try to extract tweet ID from various sources
        const links = tweetContainer.querySelectorAll('a[href*="/status/"]');
        for (const link of links) {
            const href = link.getAttribute('href');
            const match = href.match(/\/status\/(\d+)/);
            if (match) {
                return match[1];
            }
        }
        
        // Fallback: use text content hash
        const textContent = tweetContainer.textContent;
        return this.hashCode(textContent);
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    removeDuplicates(buttons) {
        const seen = new Set();
        return buttons.filter(button => {
            const rect = button.getBoundingClientRect();
            const key = `${rect.top}-${rect.left}-${rect.width}-${rect.height}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    processLikeButton(button) {
        if (!button || this.isAlreadyLiked(button)) {
            this.sendMessage('LIKE_SKIPPED');
            return;
        }
        
        try {
            // Mark tweet as liked before clicking to prevent double-clicking
            const tweetContainer = this.findTweetContainer(button);
            if (tweetContainer) {
                const tweetId = this.getTweetId(tweetContainer);
                if (tweetId) {
                    this.likedTweets.add(tweetId);
                }
            }
            
            // Scroll the button into view
            button.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Wait a moment for scroll to complete
            setTimeout(() => {
                // Simulate human-like click
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                
                // Create and dispatch mouse events
                const mouseDown = new MouseEvent('mousedown', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y
                });
                
                const mouseUp = new MouseEvent('mouseup', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y
                });
                
                const click = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y
                });
                
                button.dispatchEvent(mouseDown);
                setTimeout(() => {
                    button.dispatchEvent(mouseUp);
                    button.dispatchEvent(click);
                    
                    this.sendMessage('LIKE_SUCCESS');
                }, 50);
                
            }, 500);
            
        } catch (error) {
            this.sendMessage('ERROR', { error: error.message });
        }
    }

    getRandomDelay() {
        const min = this.settings.minDelay;
        const max = this.settings.maxDelay;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    sendMessage(action, data = {}) {
        chrome.runtime.sendMessage({
            action,
            ...data
        });
    }
}

// Initialize when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TwitterAutoLiker();
    });
} else {
    new TwitterAutoLiker();
}

// Also handle navigation changes (SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => {
            new TwitterAutoLiker();
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true }); 