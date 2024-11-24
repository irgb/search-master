# Smart Search

A Chrome extension that intelligently routes your searches between ChatGPT and Google based on your preferences, making web searches more efficient.

## Demo

Here's how Smart Search works:

Easily customize triggers and word threshold
![Settings](./assets/screenshot-20241124-230051.png)

Watch our demo video to see Smart Search in action:

[![Smart Search Demo](./assets/smart%20search.png)](https://www.youtube.com/watch?v=ELfigx8GHqU)

## Features

- Intelligent Search Routing: Automatically directs your queries to either ChatGPT or Google based on the nature of your search
- Multi-Language Support: Properly handles queries in various languages, including Chinese, Japanese, and Korean (CJK)
- Auto-Save Settings: Settings are automatically saved as you type, no manual save required
- Customizable Triggers: Set your own trigger keywords for both ChatGPT and Google searches
- Seamless Integration: Works directly from your browser's search bar
- Privacy-Focused: No data collection or tracking - all processing happens locally

## Installation

You can install Smart Search in two ways:

### Option 1: Chrome Web Store (Recommended)

1. Visit the [Smart Search page](https://chrome.google.com/webstore/detail/smart-search/XXXXXXX) on the Chrome Web Store
2. Click "Add to Chrome" to install the extension
3. The extension will be automatically installed and ready to use

### Option 2: Manual Installation

For developers or users who want to install from source:

1. Go to the [Releases](https://github.com/irgb/smart-search/tags) page
2. Download the source code (zip) from the latest release
3. Extract the zip file to a folder on your computer
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode" by toggling the switch in the top right corner
6. Click "Load unpacked" and select the folder where you extracted the zip file

## Usage

1. After installation, type query in your Chrome address bar as usual
2. The extension will automatically route your search to either ChatGPT or Google based on:
   - Trigger keywords at the start of your query (e.g., "chat ", "google ", "讲讲", "搜索")
   - Word count threshold for queries without triggers (default: 10 words)

### Setting Up Triggers

1. Click the extension icon in your toolbar to access settings
2. You'll see two sections for triggers:
   - ChatGPT Search Triggers
   - Google Search Triggers

Each trigger should be on a new line. Default triggers are:

ChatGPT triggers:
```
chat 
chatgpt 
讲讲
解释
```

Google triggers:
```
google 
g 
搜索
```

Note: 
- Some triggers (like "chat ") include a space at the end, which is important for English queries
- Chinese triggers typically don't need spaces
- Settings are automatically saved as you type
- Word count for non-English languages (like Chinese) is handled properly - each character is counted as a word
- Queries from Google homepage or with spell corrections will stay on Google

## Privacy

- All data processing happens locally in your browser
- No user data is collected or stored except for your preferences
- No analytics or tracking

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/irgb/smart-search/issues) on GitHub.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
