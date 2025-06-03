# 🐦❤️ Twitter Auto Liker Pro - Enhanced Multi-Mode Automation

A powerful Chrome extension that provides comprehensive Twitter/X automation with three specialized modes: Notifications, Home Feed, and Single Post automation.

## ✨ Features Overview

### 🎯 Three Automation Modes
- **📔 Notifications Mode**: Auto-like replies and mentions in notifications
- **🏠 Home Feed Mode**: Auto-like, retweet, and bookmark posts in your timeline
- **💬 Single Post Mode**: Auto-like comments and replies in specific post threads

### 🛡️ Advanced Safety Features
- **Smart Detection**: Multiple algorithms to prevent double-actions
- **Human-like Behavior**: Random delays and realistic mouse movements
- **URL-based Navigation**: One-click navigation to correct pages
- **Page Detection**: Automatic detection of current page type
- **Error Recovery**: Graceful handling of UI changes and errors

## 🚀 Core Features by Mode

### 📔 Notifications Mode (`https://x.com/notifications`)
- ✅ **Auto Like Notifications**: Automatically like replies and mentions
- ✅ **Auto Scroll Notifications**: Scroll through all notifications
- ✅ **Wait for New Mode**: Stay at top and like new incoming notifications
- ✅ **Smart Filtering**: Only process notification-context content

### 🏠 Home Feed Mode (`https://x.com/home`)
- ✅ **Auto Like Posts**: Automatically like posts in your timeline
- ✅ **Auto Retweet**: Automatically retweet interesting content
- ✅ **Auto Bookmark**: Save posts to bookmarks automatically
- ✅ **Continuous Scrolling**: Endless feed automation
- ✅ **Multi-Action Support**: Perform multiple actions per post

### 💬 Single Post Mode (`https://x.com/*/status/*`)
- ✅ **Auto Like Comments**: Like all comments and replies
- ✅ **Auto Reply**: Open reply dialogs for engagement
- ✅ **Like Original Post**: Automatically like the main post
- ✅ **Comment Scrolling**: Scroll through all comments
- ✅ **Thread Navigation**: Handle nested comment threads

## 🎨 Enhanced User Interface

### 🔄 Tab-Based Navigation
- **Modern Design**: Beautiful tab interface with smooth animations
- **Context-Aware**: Different options based on current page
- **Visual Indicators**: Real-time status and page detection
- **One-Click Navigation**: Direct links to Twitter pages

### ⚙️ Advanced Settings
- **Min/Max Delays**: Customizable action delays (1-60 seconds)
- **Scroll Timing**: Configurable scroll delays (1-30 seconds)
- **Action Delays**: Fine-tune interaction timing (100-2000ms)
- **Real-time Validation**: Automatic settings validation

### 📊 Comprehensive Statistics
- **Total Likes**: All-time like count across all modes
- **Session Likes**: Current session statistics
- **Retweets**: Total retweet count
- **Bookmarks**: Total bookmark count
- **Reset Option**: Clear all statistics

## 🚀 Installation

### Method 1: Load Unpacked Extension (Recommended)

1. **Download/Clone the Extension**
   ```bash
   git clone https://github.com/yourusername/twitter-auto-liker-pro.git
   cd twitter-auto-liker-pro
   ```

2. **Create Icon Files**
   Convert the SVG icon to PNG files:
   ```bash
   # Using ImageMagick (if available)
   convert icons/icon.svg -resize 16x16 icons/icon16.png
   convert icons/icon.svg -resize 32x32 icons/icon32.png
   convert icons/icon.svg -resize 48x48 icons/icon48.png
   convert icons/icon.svg -resize 128x128 icons/icon128.png
   ```
   
   Or use online converters like:
   - [CloudConvert](https://cloudconvert.com/svg-to-png)
   - [Convertio](https://convertio.co/svg-png/)
   - Any graphics editor (GIMP, Photoshop, Figma)

3. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder

4. **Pin the Extension**
   - Click the extensions puzzle icon in Chrome toolbar
   - Find "Twitter Auto Liker Pro" and click the pin icon

## 📖 Usage Guide

### Initial Setup

1. **Navigate to Twitter/X**
   - Go to [x.com](https://x.com) and log in
   - The extension works on both twitter.com and x.com

2. **Choose Your Mode**
   - Click the extension icon to open the popup
   - Select the appropriate tab:
     - **Notifications**: For notification automation
     - **Home Feed**: For timeline automation  
     - **Single Post**: For comment thread automation

3. **Navigate to Correct Page**
   - Use the "Go to..." buttons for automatic navigation
   - Or manually navigate to the desired page

### Mode-Specific Usage

#### 📔 Notifications Mode
1. Click "📔 Go to Notifications" or navigate to `/notifications`
2. Enable desired features:
   - **Auto Like**: Like all notification replies
   - **Auto Scroll**: Scroll through all notifications
   - **Wait for New**: Stay at top for new notifications
3. Click "▶️ Start Automation"

#### 🏠 Home Feed Mode
1. Click "🏠 Go to Home Feed" or navigate to `/home`
2. Enable desired features:
   - **Auto Like**: Like posts in timeline
   - **Auto Retweet**: Retweet posts automatically
   - **Auto Bookmark**: Save posts to bookmarks
   - **Auto Scroll**: Continuous timeline scrolling
3. Click "▶️ Start Automation"

#### 💬 Single Post Mode
1. Navigate to any tweet (URL like `/status/123456789`)
2. The extension will automatically detect the page
3. Enable desired features:
   - **Auto Like Comments**: Like all comments
   - **Auto Reply**: Open reply dialogs
   - **Auto Scroll**: Scroll through comments
   - **Like Original**: Like the main post
4. Click "▶️ Start Automation"

## ⚙️ Advanced Configuration

### Delay Settings
- **Min Delay (1-60s)**: Minimum time between actions
- **Max Delay (1-60s)**: Maximum time between actions
- **Scroll Delay (1-30s)**: Time between scroll actions
- **Action Delay (100-2000ms)**: Delay for click animations

### Safety Recommendations
- **Use realistic delays**: 2-10 seconds minimum
- **Take breaks**: Don't run 24/7
- **Monitor your account**: Watch for any restrictions
- **Start slow**: Begin with conservative settings

## 📊 Statistics

Track your automation performance:
- **Total Likes**: All-time like count
- **Session Likes**: Likes in current session
- **Reset Option**: Clear statistics anytime

## 🐛 Troubleshooting

### Common Issues

**Extension not working:**
- Ensure you're on twitter.com or x.com
- Refresh the page and try again
- Check that the extension is enabled

**No likes happening:**
- Make sure you're on the notifications page
- Enable "Auto Like" toggle
- Check if there are new notifications to like

**Extension popup not opening:**
- Reload the extension in chrome://extensions/
- Refresh the Twitter page

### Debug Mode
- Open Chrome DevTools (F12)
- Check Console for error messages
- Look for "Twitter Auto Liker" log messages

## ⚠️ Important Notes

### Responsible Usage
- **Use at your own risk**: Automated liking may violate Twitter's Terms of Service
- **Rate limiting**: Extension includes delays to mimic human behavior
- **Account safety**: Monitor your account for any restrictions

### Recommendations
- Use moderate delay settings (2-10 seconds minimum)
- Don't run 24/7 - take breaks
- Monitor your account regularly
- Stop if you receive any warnings from Twitter

## 🔧 Development

### File Structure
```
twitter-auto-liker-pro/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup UI
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Twitter page interaction
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon.svg          # Source SVG icon
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

### Key Technologies
- **Manifest V3**: Latest Chrome extension standard
- **Content Scripts**: DOM interaction with Twitter
- **Chrome Storage API**: Settings persistence
- **Modern JavaScript**: ES6+ features

## 📄 License

This project is for educational purposes. Use responsibly and in accordance with Twitter's Terms of Service.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Look at browser console for errors
3. Create an issue with detailed information

## ⭐ Features Coming Soon

- Support for other social media platforms
- Advanced filtering options
- Scheduled automation
- Export statistics
- Dark mode theme

---

**⚠️ Disclaimer**: This extension is for educational and personal use. Automated interaction with social media platforms may violate their terms of service. Use at your own discretion and responsibility. "# XautoPro" 
