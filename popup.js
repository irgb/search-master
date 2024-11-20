// Default settings
const DEFAULT_SETTINGS = {
  chatgptTriggers: ['gpt ', 'chatgpt ', 'chat '],
  googleTriggers: ['google ', 'g '],
  wordThreshold: 6
};

// DOM elements
const chatgptTriggersInput = document.getElementById('chatgptTriggers');
const googleTriggersInput = document.getElementById('googleTriggers');
const wordThresholdInput = document.getElementById('wordThreshold');
const saveButton = document.querySelector('.save-button');
const statusMessage = document.querySelector('.status');

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get('settings');
  const settings = result.settings || DEFAULT_SETTINGS;
  
  // Populate input fields
  chatgptTriggersInput.value = settings.chatgptTriggers
    .map(t => t.trim())
    .join(', ');
  googleTriggersInput.value = settings.googleTriggers
    .map(t => t.trim())
    .join(', ');
  wordThresholdInput.value = settings.wordThreshold;
});

// Save settings
saveButton.addEventListener('click', async () => {
  // Parse and validate input
  const chatgptTriggers = chatgptTriggersInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t)
    .map(t => t.endsWith(' ') ? t : t + ' ');
  
  const googleTriggers = googleTriggersInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t)
    .map(t => t.endsWith(' ') ? t : t + ' ');
  
  const wordThreshold = parseInt(wordThresholdInput.value, 10);
  
  if (isNaN(wordThreshold) || wordThreshold < 1) {
    alert('Please enter a valid word threshold (minimum 1)');
    return;
  }
  
  // Save to storage
  const settings = {
    chatgptTriggers,
    googleTriggers,
    wordThreshold
  };
  
  await chrome.storage.sync.set({ settings });
  
  // Show success message
  statusMessage.style.display = 'block';
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 2000);
});
