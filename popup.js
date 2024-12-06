// Default settings
const DEFAULT_SETTINGS = {
  chatgptTriggers: ['chat ', '解释', '讲讲'],
  googleTriggers: ['g ', '搜索'],
  perplexityTriggers: ['p ', 'pplx '],
  wordThreshold: 20,
  defaultSearchEngine: 'chatgpt'
};

// DOM elements
const chatgptTriggersInput = document.getElementById('chatgptTriggers');
const googleTriggersInput = document.getElementById('googleTriggers');
const perplexityTriggersInput = document.getElementById('perplexityTriggers');
const wordThresholdInput = document.getElementById('wordThreshold');
const defaultSearchEngineSelect = document.getElementById('defaultSearchEngine');

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
    
  const perplexityTriggers = perplexityTriggersInput.value
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
    perplexityTriggers,
    wordThreshold,
    defaultSearchEngine: defaultSearchEngineSelect.value
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
  perplexityTriggersInput.value = settings.perplexityTriggers.join('\n');
  wordThresholdInput.value = settings.wordThreshold;
  defaultSearchEngineSelect.value = settings.defaultSearchEngine || DEFAULT_SETTINGS.defaultSearchEngine;
});

// Add auto-save listeners
chatgptTriggersInput.addEventListener('input', debouncedSave);
googleTriggersInput.addEventListener('input', debouncedSave);
perplexityTriggersInput.addEventListener('input', debouncedSave);
wordThresholdInput.addEventListener('input', debouncedSave);
wordThresholdInput.addEventListener('change', debouncedSave);
defaultSearchEngineSelect.addEventListener('change', debouncedSave);
