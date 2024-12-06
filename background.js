// Default settings
const DEFAULT_SETTINGS = {
  chatgptTriggers: ['chat ', '讲讲', '解释'],
  googleTriggers: ['g ', '搜索'],
  perplexityTriggers: ['p ', 'pplx '],
  bingTriggers: ['b '],
  wordThreshold: 20,
  defaultSearchEngine: 'chatgpt'
};

// Load settings from storage or use defaults
async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  return result.settings || DEFAULT_SETTINGS;
}

// Check if text starts with any of the triggers
function matchesTrigger(text, triggers) {
  const lowerText = text.toLowerCase();
  return triggers.some(trigger => lowerText.startsWith(trigger.toLowerCase()));
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
  const hasPerplexityTrigger = matchesTrigger(lowerQuery, settings.perplexityTriggers);
  const hasBingTrigger = matchesTrigger(lowerQuery, settings.bingTriggers);
  console.log('Trigger detection:', { hasChatGPTTrigger, hasGoogleTrigger, hasPerplexityTrigger, hasBingTrigger });

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
  } else if (hasPerplexityTrigger) {
    const trigger = settings.perplexityTriggers.find(t => 
      lowerQuery.startsWith(t.toLowerCase())
    );
    cleanQuery = trimmedQuery.slice(trigger.length).trim();
    console.log('Removed Perplexity trigger:', { originalQuery: trimmedQuery, cleanQuery, trigger });
  } else if (hasBingTrigger) {
    const trigger = settings.bingTriggers.find(t => 
      lowerQuery.startsWith(t.toLowerCase())
    );
    cleanQuery = trimmedQuery.slice(trigger.length).trim();
    console.log('Removed Bing trigger:', { originalQuery: trimmedQuery, cleanQuery, trigger });
  }

  // Determine search engine based on rules
  let searchEngine = settings.defaultSearchEngine || DEFAULT_SETTINGS.defaultSearchEngine;
  
  if (hasChatGPTTrigger) {
    searchEngine = 'chatgpt';
  } else if (hasPerplexityTrigger) {
    searchEngine = 'perplexity';
  } else if (hasBingTrigger) {
    searchEngine = 'bing';
  } else if (hasGoogleTrigger) {
    searchEngine = 'google';
  } else {
    // Check word count - support all Unicode scripts
    const wordCount = countWords(cleanQuery);
    searchEngine = wordCount >= settings.wordThreshold ? searchEngine : 'google';
    console.log('Word count analysis:', { 
      wordCount, 
      threshold: settings.wordThreshold, 
      searchEngine,
      defaultEngine: settings.defaultSearchEngine,
      text: cleanQuery 
    });
  }

  console.log('Decision:', { searchEngine, cleanQuery });
  return { cleanQuery, searchEngine };
}

// Handle URL changes
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    
    // Skip if already processed
    if (url.searchParams.get('redirected_by_smart_search')) return;

    // Only handle Google searches
    if (url.hostname !== 'www.google.com' || !url.pathname.startsWith('/search')) return;

    // Skip if from Google homepage or Chrome's search box
    if (url.searchParams.get('source') === 'hp' || 
        url.searchParams.get('spell') === '1' ||
        url.searchParams.has('sxsrf') ||
        url.searchParams.has('ved')) return;

    const query = url.searchParams.get('q');
    if (!query) return;

    const { cleanQuery, searchEngine } = await processQuery(query);
    
    let redirectUrl;
    if (searchEngine === 'chatgpt') {
      redirectUrl = `https://chatgpt.com/?q=${encodeURIComponent(cleanQuery)}&hints=search&ref=ext`;
    } else if (searchEngine === 'perplexity') {
      redirectUrl = `https://www.perplexity.ai/search/new?q=${encodeURIComponent(cleanQuery)}&copilot=false&s=d`;
    } else if (searchEngine === 'bing') {
      redirectUrl = `https://www.bing.com/search?q=${encodeURIComponent(cleanQuery)}`;
    } else {
      // Use Google search
      redirectUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}&redirected_by_smart_search=true`;
    }
    
    chrome.tabs.update(details.tabId, { url: redirectUrl });
  } catch (error) {
    console.error('Error in Smart Search:', error);
  }
});
