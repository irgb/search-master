// Default settings
const DEFAULT_SETTINGS = {
  chatgptTriggers: ['gpt ', 'chatgpt ', 'chat '],
  googleTriggers: ['google ', 'g '],
  wordThreshold: 6
};

// Load settings from storage or use defaults
async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  return result.settings || DEFAULT_SETTINGS;
}

// Process query and determine target URL
async function processQuery(query) {
  const settings = await getSettings();
  
  // Check for triggers
  const hasChatGPTTrigger = settings.chatgptTriggers.some(trigger => 
    query.toLowerCase().startsWith(trigger.toLowerCase())
  );
  const hasGoogleTrigger = settings.googleTriggers.some(trigger => 
    query.toLowerCase().startsWith(trigger.toLowerCase())
  );

  // Remove trigger prefix if present
  let cleanQuery = query;
  if (hasChatGPTTrigger) {
    const trigger = settings.chatgptTriggers.find(t => 
      query.toLowerCase().startsWith(t.toLowerCase())
    );
    cleanQuery = query.slice(trigger.length);
  } else if (hasGoogleTrigger) {
    const trigger = settings.googleTriggers.find(t => 
      query.toLowerCase().startsWith(t.toLowerCase())
    );
    cleanQuery = query.slice(trigger.length);
  }

  // Determine search engine based on rules
  let useChatGPT = false;
  
  if (hasChatGPTTrigger) {
    useChatGPT = true;
  } else if (hasGoogleTrigger) {
    useChatGPT = false;
  } else {
    // Check word count
    const wordCount = cleanQuery.trim().split(/\s+/).length;
    useChatGPT = wordCount >= settings.wordThreshold;
  }

  return { cleanQuery, useChatGPT };
}

// Handle URL changes
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigation to Google search
  if (details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    
    // Only handle Google searches and avoid processing ChatGPT URLs
    if (url.hostname !== 'www.google.com' || !url.pathname.startsWith('/search')) return;
    
    // Skip if already processed
    if (url.searchParams.get('ext_processed')) return;

    const query = url.searchParams.get('q');
    if (!query) return;

    const { cleanQuery, useChatGPT } = await processQuery(query);
    
    if (useChatGPT) {
      // Redirect to ChatGPT
      const chatgptUrl = `https://chatgpt.com/?q=${encodeURIComponent(cleanQuery)}&hints=search&ref=ext`;
      chrome.tabs.update(details.tabId, { url: chatgptUrl });
    } else {
      // Add processed flag to prevent loops
      url.searchParams.set('q', cleanQuery);
      url.searchParams.set('ext_processed', 'true');
      chrome.tabs.update(details.tabId, { url: url.toString() });
    }
  } catch (error) {
    console.error('Error in Smart Search:', error);
  }
});
