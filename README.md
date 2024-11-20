# Smart Search Chrome Extension

A Chrome extension that intelligently routes your searches between ChatGPT and Google based on configurable rules.

## Features

- Automatically routes searches to either ChatGPT or Google based on:
  - Trigger keywords (e.g., "gpt", "chatgpt", "google")
  - Query length threshold
- User-friendly settings panel
- Settings take effect immediately without browser restart
- Customizable trigger keywords and word count threshold

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the extension directory

## Usage

### Default Behavior

- Queries starting with "gpt", "chatgpt", or "chat" go to ChatGPT
- Queries starting with "google" or "g" go to Google
- Queries with 6 or more words go to ChatGPT
- Shorter queries go to Google

### Customizing Settings

1. Click the extension icon in your Chrome toolbar
2. Adjust the trigger keywords and word count threshold
3. Click "Save Settings"

## Examples

- "gpt explain quantum computing" → ChatGPT
- "g weather today" → Google
- "what is the meaning of life the universe and everything" → ChatGPT (> 6 words)
- "pizza near me" → Google (< 6 words)
