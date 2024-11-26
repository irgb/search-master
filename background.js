// Default settings
const DEFAULT_SETTINGS = {
  chatgptTriggers: ['chat ', 'chatgpt ', '讲讲', '解释'],
  googleTriggers: ['google ', 'g ', '搜索'],
  wordThreshold: 10
};

// Load settings from storage or use defaults
async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  return result.settings || DEFAULT_SETTINGS;
}

// Check if text starts with any of the triggers
function matchesTrigger(text, triggers) {
  return triggers.some(trigger => text.startsWith(trigger));
}

// Count words in text - support all languages including CJK
function countWords(text) {
  if (!text) return 0;
  
  // For CJK (Chinese, Japanese, Korean)
  const cjkMatch = text.match(/[\u4e00-\u9fff]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uac00-\ud7af]/g);
  const cjkCount = cjkMatch ? cjkMatch.length : 0;
  
  // For other languages that use spaces
  const nonCjkText = text.replace(/[\u4e00-\u9fff]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uac00-\ud7af]/g, '');
  const nonCjkCount = nonCjkText.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  return cjkCount + nonCjkCount;
}

// Process query and determine target URL
async function processQuery(query) {
  console.log('Processing query:', query);
  const settings = await getSettings();
  
  // Remove any leading/trailing whitespace but preserve internal spaces
  const trimmedQuery = query.trim();
  const lowerQuery = trimmedQuery.toLowerCase();
  
  // Check for triggers
  const hasChatGPTTrigger = matchesTrigger(lowerQuery, settings.chatgptTriggers);
  const hasGoogleTrigger = matchesTrigger(lowerQuery, settings.googleTriggers);
  console.log('Trigger detection:', { hasChatGPTTrigger, hasGoogleTrigger });

  // Remove trigger prefix if present
  let cleanQuery = trimmedQuery;
  if (hasChatGPTTrigger) {
    const trigger = settings.chatgptTriggers.find(t => 
      lowerQuery.startsWith(t.toLowerCase())
    );
    cleanQuery = trimmedQuery.slice(trigger.length).trim();
    console.log('Removed ChatGPT trigger:', { originalQuery: trimmedQuery, cleanQuery, trigger });
  } else if (hasGoogleTrigger) {
    const trigger = settings.googleTriggers.find(t => 
      lowerQuery.startsWith(t.toLowerCase())
    );
    cleanQuery = trimmedQuery.slice(trigger.length).trim();
    console.log('Removed Google trigger:', { originalQuery: trimmedQuery, cleanQuery, trigger });
  }

  // Determine search engine based on rules
  let useChatGPT = false;
  
  if (hasChatGPTTrigger) {
    useChatGPT = true;
  } else if (hasGoogleTrigger) {
    useChatGPT = false;
  } else {
    // Check word count - support all Unicode scripts
    const wordCount = countWords(cleanQuery);
    useChatGPT = wordCount >= settings.wordThreshold;
    console.log('Word count analysis:', { 
      wordCount, 
      threshold: settings.wordThreshold, 
      useChatGPT,
      text: cleanQuery 
    });
  }

  console.log('Decision:', { useChatGPT, cleanQuery });
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
    if (url.searchParams.get('redirected_by_smart_search')) return;

    // If query comes from Google homepage (source=hp), has spell correction (spell=1),
    // or comes from Chrome's search box (sxsrf present), continue using Google
    if (url.searchParams.get('source') === 'hp' || 
        url.searchParams.get('spell') === '1' ||
        url.searchParams.has('sxsrf') ||
        url.searchParams.has('ved')) return;

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
      url.searchParams.set('redirected_by_smart_search', 'true');
      chrome.tabs.update(details.tabId, { url: url.toString() });
    }
  } catch (error) {
    console.error('Error in Smart Search:', error);
  }
});
