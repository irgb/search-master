// Default settings
const DEFAULT_SETTINGS = {
  chatgptTriggers: ['chat ', '解释', '讲讲'],
  googleTriggers: ['g ', '搜索'],
  perplexityTriggers: ['p ', 'pplx '],
  bingTriggers: ['b '],
  wordThreshold: 10,
  defaultAISearchEngine: 'ChatGPT',
  defaultSearchEngine: 'Google'
};

// DOM elements
const chatgptTriggersInput = document.getElementById('chatgptTriggers');
const googleTriggersInput = document.getElementById('googleTriggers');
const perplexityTriggersInput = document.getElementById('perplexityTriggers');
const bingTriggersInput = document.getElementById('bingTriggers');
const wordThresholdInput = document.getElementById('wordThreshold');
const defaultAISearchEngineSelect = document.getElementById('defaultAISearchEngine');
const defaultSearchEngineSelect = document.getElementById('defaultSearchEngine');
const wordThresholdHelp = document.getElementById('wordThresholdHelp');
const defaultSearchEngineHelp = document.getElementById('defaultSearchEngineHelp');

// Function to update help text
function updateWordThresholdHelpText() {
  const selectedEngine = defaultAISearchEngineSelect.value;
  const threshold = wordThresholdInput.value || DEFAULT_SETTINGS.wordThreshold;
  wordThresholdHelp.textContent = `For queries having more than ${threshold} words, use ${selectedEngine}.`;
}

function updateDefaultSearchEngineHelpText() {
  const selectedEngine = defaultSearchEngineSelect.value;
  defaultSearchEngineHelp.textContent = `for short queries, use ${selectedEngine}.`;
}

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
    
  const bingTriggers = bingTriggersInput.value
    .split('\n')
    .filter(t => t.length > 0);
  
  const wordThreshold = wordThresholdInput.value === '' ? '' : parseInt(wordThresholdInput.value, 10);
  
  // Only validate if there's a value
  if (wordThreshold !== '' && (isNaN(wordThreshold) || wordThreshold < 1)) {
    wordThresholdInput.value = DEFAULT_SETTINGS.wordThreshold;
    return;
  }
  
  // Save to storage
  const settings = {
    chatgptTriggers,
    googleTriggers,
    perplexityTriggers,
    bingTriggers,
    wordThreshold: wordThreshold === '' ? DEFAULT_SETTINGS.wordThreshold : wordThreshold,
    defaultAISearchEngine: defaultAISearchEngineSelect.value,
    defaultSearchEngine: defaultSearchEngineSelect.value
  };
  
  await chrome.storage.sync.set({ settings });
}

// Create debounced save function
const debouncedSave = debounce(saveSettings, 500);

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get('settings');
  const settings = result.settings || {};
  
  // Populate input fields with settings, falling back to defaults if not set
  chatgptTriggersInput.value = (settings.chatgptTriggers || DEFAULT_SETTINGS.chatgptTriggers).join('\n');
  googleTriggersInput.value = (settings.googleTriggers || DEFAULT_SETTINGS.googleTriggers).join('\n');
  perplexityTriggersInput.value = (settings.perplexityTriggers || DEFAULT_SETTINGS.perplexityTriggers).join('\n');
  bingTriggersInput.value = (settings.bingTriggers || DEFAULT_SETTINGS.bingTriggers).join('\n');
  wordThresholdInput.value = settings.wordThreshold || DEFAULT_SETTINGS.wordThreshold;
  defaultAISearchEngineSelect.value = settings.defaultAISearchEngine || DEFAULT_SETTINGS.defaultAISearchEngine;
  defaultSearchEngineSelect.value = settings.defaultSearchEngine || DEFAULT_SETTINGS.defaultSearchEngine;
  
  // Update help text with initial values
  updateWordThresholdHelpText();
  updateDefaultSearchEngineHelpText();
});

// Add auto-save listeners
chatgptTriggersInput.addEventListener('input', debouncedSave);
googleTriggersInput.addEventListener('input', debouncedSave);
perplexityTriggersInput.addEventListener('input', debouncedSave);
bingTriggersInput.addEventListener('input', debouncedSave);
wordThresholdInput.addEventListener('input', () => {
  debouncedSave();
  updateWordThresholdHelpText();
});
wordThresholdInput.addEventListener('change', () => {
  debouncedSave();
  updateWordThresholdHelpText();
});
defaultAISearchEngineSelect.addEventListener('change', () => {
  debouncedSave();
  updateWordThresholdHelpText();
});
defaultSearchEngineSelect.addEventListener('change', () => {
  debouncedSave();
  updateDefaultSearchEngineHelpText();
});
