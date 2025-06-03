class TwitterAutoLikerPro {
    constructor() {
        this.isRunning = false;
        this.currentMode = null;
        this.pageType = 'unknown';
        this.settings = {
            // Default settings
            minDelay: 2,
            maxDelay: 10,
            scrollDelay: 3,
            actionDelay: 500
        };
        
        // Automation intervals
        this.intervalId = null;
        this.scrollIntervalId = null;
        this.waitIntervalId = null;
        
        // Tracking sets
        this.likedTweets = new Set();
        this.retweetedTweets = new Set();
        this.bookmarkedTweets = new Set();
        this.repliedTweets = new Set();
        
        // Scroll tracking
        this.lastScrollPosition = 0;
        this.scrollDirection = 'down';
        this.noNewContentCount = 0;
        this.scrollAttempts = 0;
        
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.detectPageType();
        console.log('Twitter Auto Liker Pro content script loaded');
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'START_AUTOMATION':
                    this.start(message.mode, message.settings, message.pageType);
                    break;
                case 'STOP_AUTOMATION':
                    this.stop();
                    break;
            }
        });
    }

    detectPageType() {
        const url = window.location.href;
        
        if (url.includes('/notifications')) {
            this.pageType = 'notifications';
        } else if (url.includes('/home') || url === 'https://x.com/' || url === 'https://twitter.com/') {
            this.pageType = 'home';
        } else if (url.includes('/status/')) {
            this.pageType = 'single-post';
        } else {
            this.pageType = 'other';
        }
        
        this.sendMessage('STATUS_UPDATE', { 
            message: `Page type detected: ${this.pageType}`, 
            type: 'info' 
        });
    }

    start(mode, settings, pageType) {
        if (this.isRunning) return;
        
        this.currentMode = mode;
        this.settings = settings;
        this.pageType = pageType;
        this.isRunning = true;
        
        this.sendMessage('STATUS_UPDATE', { 
            message: `Starting ${mode} automation`, 
            type: 'success' 
        });
        
        // Start appropriate automation based on mode
        switch (mode) {
            case 'notifications':
                this.startNotificationsAutomation();
                break;
            case 'home':
                this.startHomeAutomation();
                break;
            case 'single-post':
                this.startSinglePostAutomation();
                break;
        }
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.currentMode = null;
        
        // Clear all intervals
        [this.intervalId, this.scrollIntervalId, this.waitIntervalId].forEach(id => {
            if (id) clearInterval(id);
        });
        
        this.intervalId = null;
        this.scrollIntervalId = null;
        this.waitIntervalId = null;
        
        this.sendMessage('STOPPED');
    }

    // ==================== NOTIFICATIONS AUTOMATION ====================
    startNotificationsAutomation() {
        if (this.settings.notifAutoLike) {
            this.startNotificationLiking();
        }
        
        // Handle scroll mode based on the setting
        if (this.settings.notifScrollMode === 'scroll' || this.settings.notifAutoScroll) {
            this.startNotificationScrolling();
        }
        
        if (this.settings.notifScrollMode === 'wait' || this.settings.notifWaitForNew) {
            this.startWaitingForNewNotifications();
        }
    }

    startNotificationLiking() {
        const processLikes = () => {
            if (!this.isRunning) return;
            
            try {
                const likeButtons = this.findNotificationLikeButtons();
                
                if (likeButtons.length === 0) {
                    this.sendMessage('STATUS_UPDATE', { 
                        message: 'No new notifications to like found - looking for more content', 
                        type: 'info' 
                    });
                } else {
                    this.sendMessage('STATUS_UPDATE', { 
                        message: `Found ${likeButtons.length} notifications to like`, 
                        type: 'success' 
                    });
                    
                    const button = likeButtons[0];
                    this.processLikeButton(button);
                }
                
            } catch (error) {
                this.sendMessage('ERROR', { error: error.message });
            }
        };
        
        // Start immediately
        processLikes();
        
        // Schedule next action
        this.scheduleNextAction(processLikes);
    }

    startNotificationScrolling() {
        this.scrollIntervalId = setInterval(() => {
            if (!this.isRunning) return;
            this.performIntelligentScroll('notifications');
        }, this.settings.scrollDelay * 1000);
    }

    startWaitingForNewNotifications() {
        // Keep at top and wait for new content
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.waitIntervalId = setInterval(() => {
            if (!this.isRunning) return;
            
            if (window.scrollY > 100) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            const likeButtons = this.findNotificationLikeButtons();
            if (likeButtons.length > 0) {
                this.sendMessage('STATUS_UPDATE', { 
                    message: `Found ${likeButtons.length} new notifications at top`, 
                    type: 'success' 
                });
            } else {
                this.sendMessage('STATUS_UPDATE', { 
                    message: 'Waiting for new notifications...', 
                    type: 'info' 
                });
            }
        }, 5000);
    }

    // ==================== HOME FEED AUTOMATION ====================
    startHomeAutomation() {
        if (this.settings.homeAutoLike || this.settings.homeAutoRetweet || this.settings.homeAutoBookmark) {
            this.startHomeFeedActions();
        }
        
        if (this.settings.homeAutoScroll) {
            this.startHomeFeedScrolling();
        }
    }

    startHomeFeedActions() {
        const processHomeFeed = () => {
            if (!this.isRunning) return;
            
            try {
                const posts = this.findHomeFeedPosts();
                
                if (posts.length === 0) {
                    this.sendMessage('STATUS_UPDATE', { 
                        message: 'No new posts found in home feed - continuing to scroll', 
                        type: 'info' 
                    });
                } else {
                    this.sendMessage('STATUS_UPDATE', { 
                        message: `Processing ${posts.length} posts in home feed`, 
                        type: 'success' 
                    });
                    
                    // Process multiple posts in current view
                    let processedCount = 0;
                    for (const post of posts.slice(0, 3)) { // Process up to 3 posts at once
                        const actions = this.getPostActions(post);
                        if (actions.length > 0) {
                            this.performPostActions(actions, post);
                            processedCount++;
                        }
                    }
                    
                    if (processedCount > 0) {
                        this.sendMessage('STATUS_UPDATE', { 
                            message: `Successfully processed ${processedCount} posts`, 
                            type: 'success' 
                        });
                    } else {
                        this.sendMessage('STATUS_UPDATE', { 
                            message: 'No actionable posts found - all may be already processed', 
                            type: 'info' 
                        });
                    }
                }
                
            } catch (error) {
                this.sendMessage('ERROR', { error: error.message });
            }
        };
        
        // Start immediately
        processHomeFeed();
        
        // Schedule next action
        this.scheduleNextAction(processHomeFeed);
    }

    startHomeFeedScrolling() {
        this.scrollIntervalId = setInterval(() => {
            if (!this.isRunning) return;
            this.performIntelligentScroll('home');
        }, this.settings.scrollDelay * 1000);
    }

    findHomeFeedPosts() {
        const posts = document.querySelectorAll('article[data-testid="tweet"]');
        
        // Step 1: All posts
        this.sendMessage('STATUS_UPDATE', { 
            message: `Step 1: Found ${posts.length} total posts on page`, 
            type: 'info' 
        });
        
        // Step 2: Visible posts (more lenient - just needs to be rendered)
        const visiblePosts = Array.from(posts).filter(post => this.isVisibleElement(post));
        this.sendMessage('STATUS_UPDATE', { 
            message: `Step 2: ${visiblePosts.length} posts are visible (rendered)`, 
            type: 'info' 
        });
        
        // Step 3: Posts in or near viewport (more lenient than strict viewport)
        const nearViewportPosts = visiblePosts.filter(post => this.isNearViewport(post));
        this.sendMessage('STATUS_UPDATE', { 
            message: `Step 3: ${nearViewportPosts.length} posts are in/near viewport`, 
            type: 'info' 
        });
        
        // Step 4: Posts with actionable content
        const actionablePosts = nearViewportPosts.filter(post => this.hasActionableContent(post));
        this.sendMessage('STATUS_UPDATE', { 
            message: `Step 4: ${actionablePosts.length} posts have actionable content`, 
            type: 'info' 
        });
        
        return actionablePosts;
    }

    hasActionableContent(post) {
        // Check if this post has any actions we can take
        let hasActions = false;
        
        if (this.settings.homeAutoLike) {
            const likeButton = this.findLikeButtonInPost(post);
            if (likeButton && !this.isAlreadyLiked(likeButton)) {
                hasActions = true;
            }
        }
        
        if (this.settings.homeAutoRetweet) {
            const retweetButton = this.findRetweetButtonInPost(post);
            if (retweetButton && !this.isAlreadyRetweeted(retweetButton)) {
                hasActions = true;
            }
        }
        
        if (this.settings.homeAutoBookmark) {
            const bookmarkButton = this.findBookmarkButtonInPost(post);
            if (bookmarkButton && !this.isAlreadyBookmarked(bookmarkButton)) {
                hasActions = true;
            }
        }
        
        return hasActions;
    }

    isNearViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const buffer = windowHeight * 0.5; // 50% buffer above and below viewport
        
        // Element is near viewport if it's within the buffer zone
        return rect.bottom >= -buffer && rect.top <= windowHeight + buffer;
    }

    getPostActions(post) {
        const actions = [];
        
        if (this.settings.homeAutoLike) {
            const likeButton = this.findLikeButtonInPost(post);
            if (likeButton && !this.isAlreadyLiked(likeButton)) {
                actions.push({ type: 'like', button: likeButton });
            }
        }
        
        if (this.settings.homeAutoRetweet) {
            const retweetButton = this.findRetweetButtonInPost(post);
            if (retweetButton && !this.isAlreadyRetweeted(retweetButton)) {
                actions.push({ type: 'retweet', button: retweetButton });
            }
        }
        
        if (this.settings.homeAutoBookmark) {
            const bookmarkButton = this.findBookmarkButtonInPost(post);
            if (bookmarkButton && !this.isAlreadyBookmarked(bookmarkButton)) {
                actions.push({ type: 'bookmark', button: bookmarkButton });
            }
        }
        
        return actions;
    }

    performPostActions(actions, post) {
        let actionIndex = 0;
        
        const performNextAction = () => {
            if (actionIndex >= actions.length || !this.isRunning) return;
            
            const action = actions[actionIndex];
            this.performSingleAction(action.type, action.button, post);
            
            actionIndex++;
            
            if (actionIndex < actions.length) {
                setTimeout(performNextAction, this.settings.actionDelay || 500);
            }
        };
        
        performNextAction();
    }

    // ==================== SINGLE POST AUTOMATION ====================
    startSinglePostAutomation() {
        if (this.settings.postLikeOriginal) {
            this.likeOriginalPost();
        }
        
        if (this.settings.postAutoLike || this.settings.postAutoReply) {
            this.startSinglePostActions();
        }
        
        if (this.settings.postAutoScroll) {
            this.startSinglePostScrolling();
        }
    }

    likeOriginalPost() {
        setTimeout(() => {
            const mainPost = this.findMainPost();
            if (mainPost) {
                const likeButton = this.findLikeButtonInPost(mainPost);
                if (likeButton && !this.isAlreadyLiked(likeButton)) {
                    this.processLikeButton(likeButton);
                    this.sendMessage('STATUS_UPDATE', { 
                        message: 'Liked original post', 
                        type: 'success' 
                    });
                }
            }
        }, 1000);
    }

    startSinglePostActions() {
        const processComments = () => {
            if (!this.isRunning) return;
            
            try {
                const comments = this.findPostComments();
                
                if (comments.length === 0) {
                    this.sendMessage('STATUS_UPDATE', { 
                        message: 'No new comments found - scrolling for more', 
                        type: 'info' 
                    });
                } else {
                    this.sendMessage('STATUS_UPDATE', { 
                        message: `Processing ${comments.length} comments`, 
                        type: 'success' 
                    });
                    
                    // Process multiple comments in current view
                    let processedCount = 0;
                    for (const comment of comments.slice(0, 5)) { // Process up to 5 comments at once
                        if (this.processComment(comment)) {
                            processedCount++;
                        }
                    }
                    
                    if (processedCount > 0) {
                        this.sendMessage('STATUS_UPDATE', { 
                            message: `Processed ${processedCount} comments`, 
                            type: 'success' 
                        });
                    }
                }
                
            } catch (error) {
                this.sendMessage('ERROR', { error: error.message });
            }
        };
        
        // Start immediately
        processComments();
        
        // Schedule next action
        this.scheduleNextAction(processComments);
    }

    startSinglePostScrolling() {
        this.scrollIntervalId = setInterval(() => {
            if (!this.isRunning) return;
            this.performIntelligentScroll('single-post');
        }, this.settings.scrollDelay * 1000);
    }

    processComment(comment) {
        let actionTaken = false;
        
        if (this.settings.postAutoLike) {
            const likeButton = this.findLikeButtonInPost(comment);
            if (likeButton && !this.isAlreadyLiked(likeButton)) {
                this.processLikeButton(likeButton);
                actionTaken = true;
            }
        }
        
        if (this.settings.postAutoReply) {
            const replyButton = this.findReplyButtonInPost(comment);
            if (replyButton && !this.isAlreadyReplied(comment)) {
                this.processReplyButton(replyButton, comment);
                actionTaken = true;
            }
        }
        
        return actionTaken;
    }

    // ==================== ELEMENT FINDING METHODS ====================
    findNotificationLikeButtons() {
        const selectors = [
            '[data-testid="like"]',
            '[aria-label*="Like"]',
            'div[role="button"][aria-label*="Like"]',
            'button[aria-label*="Like"]'
        ];
        
        // First, get all like buttons
        const allButtons = this.findButtonsWithSelectors(selectors);
        this.sendMessage('STATUS_UPDATE', { 
            message: `Step 1: Found ${allButtons.length} total like buttons`, 
            type: 'info' 
        });
        
        // Filter by notification context (more flexible for notifications page)
        const contextButtons = this.pageType === 'notifications' ? 
            allButtons.filter(button => this.isInNotificationContextFlexible(button)) :
            allButtons.filter(button => this.isInNotificationContext(button));
        
        this.sendMessage('STATUS_UPDATE', { 
            message: `Step 2: ${contextButtons.length} buttons in notification context`, 
            type: 'info' 
        });
        
        // Filter out already liked
        const unlikedButtons = contextButtons.filter(button => !this.isAlreadyLiked(button));
        this.sendMessage('STATUS_UPDATE', { 
            message: `Step 3: ${unlikedButtons.length} buttons not already liked`, 
            type: 'info' 
        });
        
        // Filter by viewport (more lenient for notifications)
        const visibleButtons = unlikedButtons.filter(button => this.isVisibleElement(button));
        this.sendMessage('STATUS_UPDATE', { 
            message: `Step 4: ${visibleButtons.length} visible buttons to process`, 
            type: 'info' 
        });
        
        return visibleButtons;
    }

    findPostComments() {
        const comments = document.querySelectorAll('article[data-testid="tweet"]');
        const mainPost = this.findMainPost();
        
        const visibleComments = Array.from(comments)
            .filter(comment => comment !== mainPost)
            .filter(comment => this.isVisibleElement(comment))
            .filter(comment => this.isInViewport(comment)); // Only process visible comments
        
        // Debug logging
        this.sendMessage('STATUS_UPDATE', { 
            message: `Found ${visibleComments.length} visible comments`, 
            type: 'info' 
        });
        
        return visibleComments;
    }

    findMainPost() {
        // The main post is usually the first article in a single post page
        const articles = document.querySelectorAll('article[data-testid="tweet"]');
        return articles.length > 0 ? articles[0] : null;
    }

    findLikeButtonInPost(post) {
        const selectors = [
            '[data-testid="like"]',
            '[aria-label*="Like"]'
        ];
        
        for (const selector of selectors) {
            const button = post.querySelector(selector);
            if (button && this.isValidLikeButton(button)) {
                return button;
            }
        }
        return null;
    }

    findRetweetButtonInPost(post) {
        const selectors = [
            '[data-testid="retweet"]',
            '[aria-label*="Retweet"]',
            '[aria-label*="Repost"]'
        ];
        
        for (const selector of selectors) {
            const button = post.querySelector(selector);
            if (button && this.isValidRetweetButton(button)) {
                return button;
            }
        }
        return null;
    }

    findBookmarkButtonInPost(post) {
        const selectors = [
            '[data-testid="bookmark"]',
            '[aria-label*="Bookmark"]',
            '[aria-label*="Add Tweet to Bookmarks"]'
        ];
        
        for (const selector of selectors) {
            const button = post.querySelector(selector);
            if (button && this.isValidBookmarkButton(button)) {
                return button;
            }
        }
        return null;
    }

    findReplyButtonInPost(post) {
        const selectors = [
            '[data-testid="reply"]',
            '[aria-label*="Reply"]'
        ];
        
        for (const selector of selectors) {
            const button = post.querySelector(selector);
            if (button && this.isValidReplyButton(button)) {
                return button;
            }
        }
        return null;
    }

    findButtonsWithSelectors(selectors) {
        const buttons = [];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const button = this.findClickableParent(element);
                if (button && this.isVisibleElement(button)) {
                    buttons.push(button);
                }
            }
        }
        
        return this.removeDuplicateButtons(buttons);
    }

    // ==================== VALIDATION METHODS ====================
    isValidLikeButton(button) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const testId = button.getAttribute('data-testid') || '';
        
        return (
            ariaLabel.toLowerCase().includes('like') ||
            testId.includes('like')
        ) && this.isVisibleElement(button);
    }

    isValidRetweetButton(button) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const testId = button.getAttribute('data-testid') || '';
        
        return (
            ariaLabel.toLowerCase().includes('retweet') ||
            ariaLabel.toLowerCase().includes('repost') ||
            testId.includes('retweet')
        ) && this.isVisibleElement(button);
    }

    isValidBookmarkButton(button) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const testId = button.getAttribute('data-testid') || '';
        
        return (
            ariaLabel.toLowerCase().includes('bookmark') ||
            testId.includes('bookmark')
        ) && this.isVisibleElement(button);
    }

    isValidReplyButton(button) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const testId = button.getAttribute('data-testid') || '';
        
        return (
            ariaLabel.toLowerCase().includes('reply') ||
            testId.includes('reply')
        ) && this.isVisibleElement(button);
    }

    isVisibleElement(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    isInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.left >= 0 && 
               rect.right <= window.innerWidth;
    }

    isInNotificationContext(button) {
        // Check if the button is within a notification item
        let current = button;
        let depth = 0;
        
        while (current && depth < 10) {
            if (current.getAttribute && 
                (current.getAttribute('data-testid') === 'cellInnerDiv' ||
                 current.classList.contains('notification'))) {
                return true;
            }
            current = current.parentElement;
            depth++;
        }
        
        return false;
    }

    isInNotificationContextFlexible(button) {
        // More flexible detection for notifications page
        if (this.pageType !== 'notifications') {
            return this.isInNotificationContext(button);
        }
        
        // On notifications page, be more lenient
        let current = button;
        let depth = 0;
        
        while (current && depth < 15) {
            if (current.getAttribute) {
                const testId = current.getAttribute('data-testid');
                const role = current.getAttribute('role');
                const className = current.className || '';
                
                // Look for various notification indicators
                if (testId === 'cellInnerDiv' ||
                    testId === 'tweet' ||
                    role === 'article' ||
                    className.includes('notification') ||
                    className.includes('timeline') ||
                    current.tagName === 'ARTICLE') {
                    return true;
                }
            }
            current = current.parentElement;
            depth++;
        }
        
        // If we're on notifications page and couldn't find specific context,
        // assume it's valid (since we're already on the right page)
        return true;
    }

    // ==================== ALREADY ACTIONED CHECKS ====================
    isAlreadyLiked(button) {
        // Enhanced like detection
        const ariaLabel = button.getAttribute('aria-label') || '';
        const testId = button.getAttribute('data-testid') || '';
        
        if (ariaLabel.toLowerCase().includes('unlike') || 
            ariaLabel.toLowerCase().includes('liked') ||
            testId === 'unlike') {
            return true;
        }
        
        // Check for filled heart icon
        const svg = button.querySelector('svg');
        if (svg) {
            const path = svg.querySelector('path');
            if (path) {
                const fill = path.getAttribute('fill');
                if (fill && fill !== 'none' && fill !== 'transparent' && fill !== 'currentColor') {
                    return true;
                }
            }
        }
        
        // Check color
        const computedStyle = window.getComputedStyle(button);
        const color = computedStyle.color;
        if (color.includes('rgb(224, 36, 94)') || color.includes('rgb(249, 24, 128)')) {
            return true;
        }
        
        // Check if we've already processed this
        const tweetId = this.getTweetIdFromButton(button);
        return tweetId && this.likedTweets.has(tweetId);
    }

    isAlreadyRetweeted(button) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const testId = button.getAttribute('data-testid') || '';
        
        if (ariaLabel.toLowerCase().includes('undo retweet') || 
            ariaLabel.toLowerCase().includes('undo repost') ||
            testId === 'unretweet') {
            return true;
        }
        
        const tweetId = this.getTweetIdFromButton(button);
        return tweetId && this.retweetedTweets.has(tweetId);
    }

    isAlreadyBookmarked(button) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const testId = button.getAttribute('data-testid') || '';
        
        if (ariaLabel.toLowerCase().includes('remove') && ariaLabel.toLowerCase().includes('bookmark')) {
            return true;
        }
        
        const tweetId = this.getTweetIdFromButton(button);
        return tweetId && this.bookmarkedTweets.has(tweetId);
    }

    isAlreadyReplied(comment) {
        const tweetId = this.getTweetIdFromElement(comment);
        return tweetId && this.repliedTweets.has(tweetId);
    }

    // ==================== ACTION PROCESSING ====================
    performSingleAction(type, button, context) {
        switch (type) {
            case 'like':
                this.processLikeButton(button);
                break;
            case 'retweet':
                this.processRetweetButton(button);
                break;
            case 'bookmark':
                this.processBookmarkButton(button);
                break;
            case 'reply':
                this.processReplyButton(button, context);
                break;
        }
    }

    processLikeButton(button) {
        if (!button || this.isAlreadyLiked(button)) {
            this.sendMessage('LIKE_SKIPPED', { reason: 'Already liked or invalid button' });
            return false;
        }
        
        const tweetId = this.getTweetIdFromButton(button);
        if (tweetId) {
            // Mark as processed before clicking to prevent double-processing
            this.likedTweets.add(tweetId);
        }
        
        this.sendMessage('STATUS_UPDATE', { 
            message: `Clicking like button for tweet ${tweetId || 'unknown'}`, 
            type: 'info' 
        });
        
        this.simulateHumanClick(button, () => {
            this.sendMessage('LIKE_SUCCESS');
        });
        
        return true;
    }

    processRetweetButton(button) {
        if (!button || this.isAlreadyRetweeted(button)) {
            return false;
        }
        
        const tweetId = this.getTweetIdFromButton(button);
        if (tweetId) {
            this.retweetedTweets.add(tweetId);
        }
        
        this.sendMessage('STATUS_UPDATE', { 
            message: `Clicking retweet button for tweet ${tweetId || 'unknown'}`, 
            type: 'info' 
        });
        
        this.simulateHumanClick(button, () => {
            // Handle retweet confirmation if it appears
            setTimeout(() => {
                const confirmButton = document.querySelector('[data-testid="retweetConfirm"]');
                if (confirmButton) {
                    this.simulateHumanClick(confirmButton, () => {
                        this.sendMessage('RETWEET_SUCCESS');
                    });
                } else {
                    this.sendMessage('RETWEET_SUCCESS');
                }
            }, 500);
        });
        
        return true;
    }

    processBookmarkButton(button) {
        if (!button || this.isAlreadyBookmarked(button)) {
            return false;
        }
        
        const tweetId = this.getTweetIdFromButton(button);
        if (tweetId) {
            this.bookmarkedTweets.add(tweetId);
        }
        
        this.sendMessage('STATUS_UPDATE', { 
            message: `Clicking bookmark button for tweet ${tweetId || 'unknown'}`, 
            type: 'info' 
        });
        
        this.simulateHumanClick(button, () => {
            this.sendMessage('BOOKMARK_SUCCESS');
        });
        
        return true;
    }

    processReplyButton(button, context) {
        if (!button || this.isAlreadyReplied(context)) {
            return false;
        }
        
        const tweetId = this.getTweetIdFromElement(context);
        if (tweetId) {
            this.repliedTweets.add(tweetId);
        }
        
        this.sendMessage('STATUS_UPDATE', { 
            message: `Opening reply dialog for tweet ${tweetId || 'unknown'}`, 
            type: 'info' 
        });
        
        // Simple implementation - just click reply button
        this.simulateHumanClick(button, () => {
            this.sendMessage('STATUS_UPDATE', { 
                message: 'Opened reply dialog', 
                type: 'info' 
            });
        });
        
        return true;
    }

    // ==================== UTILITY METHODS ====================
    simulateHumanClick(button, callback) {
        try {
            // Scroll button into view first
            button.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
            
            setTimeout(() => {
                try {
                    // Check if button is still valid after scroll
                    if (!button || !button.isConnected) {
                        this.sendMessage('ERROR', { error: 'Button no longer exists after scroll' });
                        return;
                    }
                    
                    const rect = button.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    // Create mouse events with proper coordinates
                    const mouseEvents = [
                        new MouseEvent('mousedown', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: x,
                            clientY: y
                        }),
                        new MouseEvent('mouseup', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: x,
                            clientY: y
                        }),
                        new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: x,
                            clientY: y
                        })
                    ];
                    
                    // Dispatch events with small delays
                    mouseEvents.forEach((event, index) => {
                        setTimeout(() => {
                            try {
                                button.dispatchEvent(event);
                                
                                // Call callback after the last event
                                if (index === mouseEvents.length - 1 && callback) {
                                    setTimeout(callback, 100);
                                }
                            } catch (error) {
                                this.sendMessage('ERROR', { error: `Failed to dispatch ${event.type}: ${error.message}` });
                            }
                        }, index * 50);
                    });
                    
                } catch (error) {
                    this.sendMessage('ERROR', { error: `Click simulation failed: ${error.message}` });
                }
            }, this.settings.actionDelay || 500);
            
        } catch (error) {
            this.sendMessage('ERROR', { error: `Button scroll failed: ${error.message}` });
        }
    }

    performIntelligentScroll(mode) {
        const currentPosition = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        
        // Check if we have actionable content in current view
        let hasContent = false;
        let contentCount = 0;
        
        switch (mode) {
            case 'notifications':
                const notifButtons = this.findNotificationLikeButtons();
                hasContent = notifButtons.length > 0;
                contentCount = notifButtons.length;
                break;
            case 'home':
                const posts = this.findHomeFeedPosts();
                hasContent = posts.length > 0;
                contentCount = posts.length;
                this.sendMessage('STATUS_UPDATE', { 
                    message: `Scroll check: Found ${posts.length} actionable posts`, 
                    type: 'info' 
                });
                break;
            case 'single-post':
                const comments = this.findPostComments();
                hasContent = comments.length > 0;
                contentCount = comments.length;
                break;
        }
        
        if (hasContent) {
            this.sendMessage('STATUS_UPDATE', { 
                message: `Scroll paused: Found ${contentCount} items in view`, 
                type: 'success' 
            });
            // Reset no content counter when we find content
            this.noNewContentCount = 0;
            return;
        }
        
        // Continue scrolling logic - be more aggressive for home feed
        const scrollMultiplier = mode === 'home' ? 1.5 : 1.0; // Scroll more for home feed
        
        if (this.scrollDirection === 'down') {
            if (currentPosition + windowHeight >= documentHeight - 200) {
                this.noNewContentCount++;
                this.sendMessage('STATUS_UPDATE', { 
                    message: `Reached bottom (attempt ${this.noNewContentCount}/4)`, 
                    type: 'info' 
                });
                
                if (this.noNewContentCount >= 4) { // More attempts for home feed
                    this.scrollDirection = 'up';
                    this.noNewContentCount = 0;
                    this.sendMessage('STATUS_UPDATE', { 
                        message: 'Switching to scroll up direction', 
                        type: 'info' 
                    });
                }
            } else {
                const baseScroll = 350 + Math.random() * 250;
                const scrollAmount = baseScroll * scrollMultiplier;
                window.scrollBy({
                    top: scrollAmount,
                    behavior: 'smooth'
                });
                this.sendMessage('STATUS_UPDATE', { 
                    message: `Scrolling down ${Math.round(scrollAmount)}px to find new content`, 
                    type: 'info' 
                });
            }
        } else {
            if (currentPosition <= 100) {
                this.scrollDirection = 'down';
                this.noNewContentCount = 0;
                this.sendMessage('STATUS_UPDATE', { 
                    message: 'Back at top, switching to scroll down', 
                    type: 'info' 
                });
            } else {
                const baseScroll = -(200 + Math.random() * 150);
                const scrollAmount = baseScroll * scrollMultiplier;
                window.scrollBy({
                    top: scrollAmount,
                    behavior: 'smooth'
                });
                this.sendMessage('STATUS_UPDATE', { 
                    message: `Scrolling up ${Math.abs(Math.round(scrollAmount))}px`, 
                    type: 'info' 
                });
            }
        }
    }

    scheduleNextAction(callback) {
        if (!this.isRunning) return;
        
        const delay = this.getRandomDelay();
        this.sendMessage('STATUS_UPDATE', { 
            message: `Next scan in ${delay}s`, 
            type: 'info' 
        });
        
        setTimeout(() => {
            if (this.isRunning) {
                this.sendMessage('STATUS_UPDATE', { 
                    message: 'Starting next scan cycle', 
                    type: 'info' 
                });
                callback();
                // Continue the loop
                this.scheduleNextAction(callback);
            }
        }, delay * 1000);
    }

    getRandomDelay() {
        const min = this.settings.minDelay;
        const max = this.settings.maxDelay;
        return Math.floor(Math.random() * (max - min + 1)) + min;
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

    removeDuplicateButtons(buttons) {
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

    getTweetIdFromButton(button) {
        const container = this.findTweetContainer(button);
        return container ? this.getTweetIdFromElement(container) : null;
    }

    getTweetIdFromElement(element) {
        const links = element.querySelectorAll('a[href*="/status/"]');
        for (const link of links) {
            const href = link.getAttribute('href');
            const match = href.match(/\/status\/(\d+)/);
            if (match) {
                return match[1];
            }
        }
        
        // Fallback: use text content hash
        return this.hashCode(element.textContent);
    }

    findTweetContainer(button) {
        let current = button;
        let depth = 0;
        
        while (current && depth < 10) {
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

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
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
        new TwitterAutoLikerPro();
    });
} else {
    new TwitterAutoLikerPro();
}

// Handle navigation changes (SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => {
            new TwitterAutoLikerPro();
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true }); 