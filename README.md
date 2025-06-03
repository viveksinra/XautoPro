# 🐦❤️ Twitter Auto Liker Pro

A powerful Chrome extension that automatically likes replies in your Twitter notifications with smart detection and customizable delays.

## ✨ Features

### 🎯 Core Features
- **Auto Like Notifications**: Automatically like replies in your Twitter notifications
- **Smart Detection**: Prevents unliking already liked tweets
- **Auto Scroll**: Automatically scroll through notifications to find new content
- **Random Delays**: Configurable random delays between likes (2-10 seconds default)
- **Real-time Statistics**: Track total likes and session likes
- **Beautiful UI**: Modern, responsive interface with smooth animations

### 🛡️ Safety Features
- **Duplicate Prevention**: Won't like the same tweet twice
- **Already Liked Detection**: Multiple methods to detect already liked tweets
- **Human-like Behavior**: Random delays and smooth scrolling to avoid detection
- **Easy Stop/Start**: Quick controls to start and stop the automation

## 🚀 Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download/Clone the Extension**
   ```bash
   git clone https://github.com/yourusername/twitter-auto-liker-pro.git
   cd twitter-auto-liker-pro
   ```

2. **Create Icon Files**
   You need to convert the SVG icon to PNG files. You can:
   - Use an online SVG to PNG converter
   - Use ImageMagick: `convert icon.svg -resize 16x16 icon16.png`
   - Use any graphics editor like GIMP, Photoshop, or Figma

   Required icon files:
   - `icons/icon16.png` (16x16 pixels)
   - `icons/icon32.png` (32x32 pixels)
   - `icons/icon48.png` (48x48 pixels)
   - `icons/icon128.png` (128x128 pixels)

3. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the extensions puzzle icon in Chrome toolbar
   - Find "Twitter Auto Liker Pro" and click the pin icon

## 📖 Usage Guide

### Initial Setup

1. **Navigate to Twitter**
   - Go to [twitter.com](https://twitter.com) or [x.com](https://x.com)
   - Make sure you're logged in

2. **Open Notifications**
   - Click on the "Notifications" tab in Twitter
   - This is where the extension will work

3. **Configure Settings**
   - Click the extension icon in Chrome toolbar
   - Configure your preferences:
     - **Auto Like**: Enable/disable automatic liking
     - **Auto Scroll**: Enable/disable automatic scrolling
     - **Min/Max Delay**: Set delay range (default: 2-10 seconds)

### Using the Extension

1. **Start Auto Liking**
   - Ensure you're on the Twitter notifications page
   - Enable "Auto Like" and/or "Auto Scroll" toggles
   - Click "Start Auto Liking"
   - Watch the activity log for real-time updates

2. **Monitor Activity**
   - The extension popup shows:
     - Current status (Ready/Active)
     - Statistics (Total likes, Session likes)
     - Real-time activity log
     - Next action countdown

3. **Stop When Needed**
   - Click "Stop" button to halt all automation
   - Extension will finish current action and stop safely

## ⚙️ Settings

### Delay Configuration
- **Min Delay**: Minimum time between actions (1-60 seconds)
- **Max Delay**: Maximum time between actions (1-60 seconds)
- **Random Range**: Extension picks random delay within your range

### Safety Features
- Extension validates min ≤ max delays automatically
- Prevents operation on non-Twitter sites
- Smart detection of already liked content

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
