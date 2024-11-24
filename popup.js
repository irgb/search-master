// Default settings
const DEFAULT_SETTINGS = {
  chatgptTriggers: ['chat ', 'chatgpt ', '解释', '讲讲'],
  googleTriggers: ['google ', 'g ', '搜索'],
  wordThreshold: 6
};

// DOM elements
const chatgptTriggersInput = document.getElementById('chatgptTriggers');
const googleTriggersInput = document.getElementById('googleTriggers');
const wordThresholdInput = document.getElementById('wordThreshold');

// Debounce function to avoid frequent saves
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Save settings function
async function saveSettings() {
  // Parse and validate input
  const chatgptTriggers = chatgptTriggersInput.value
    .split('\n')
    .filter(t => t.length > 0);
  
  const googleTriggers = googleTriggersInput.value
    .split('\n')
    .filter(t => t.length > 0);
  
  const wordThreshold = parseInt(wordThresholdInput.value, 10);
  
  if (isNaN(wordThreshold) || wordThreshold < 1) {
    wordThresholdInput.value = DEFAULT_SETTINGS.wordThreshold;
    return;
  }
  
  // Save to storage
  const settings = {
    chatgptTriggers,
    googleTriggers,
    wordThreshold
  };
  
  await chrome.storage.sync.set({ settings });
}

// Create debounced save function
const debouncedSave = debounce(saveSettings, 500);

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get('settings');
  const settings = result.settings || DEFAULT_SETTINGS;
  
  // Populate input fields
  chatgptTriggersInput.value = settings.chatgptTriggers.join('\n');
  googleTriggersInput.value = settings.googleTriggers.join('\n');
  wordThresholdInput.value = settings.wordThreshold;
});

// Add auto-save listeners
chatgptTriggersInput.addEventListener('input', debouncedSave);
googleTriggersInput.addEventListener('input', debouncedSave);
wordThresholdInput.addEventListener('input', debouncedSave);
wordThresholdInput.addEventListener('change', debouncedSave);
