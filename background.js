// Default settings
const DEFAULT_SETTINGS = {
  chatgptTriggers: ['chat ', '讲讲', '解释'],
  googleTriggers: ['g ', '搜索'],
  perplexityTriggers: ['p ', 'pplx '],
  bingTriggers: ['b '],
  wordThreshold: 20,
  defaultAISearchEngine: 'ChatGPT',
  defaultSearchEngine: 'Google'
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

// Process query to determine search engine and clean query text
async function processQuery(query) {
  const settings = await getSettings();
  const trimmedQuery = query.trim();

  // Check for triggers
  let cleanQuery = trimmedQuery;
  let hasChatGPTTrigger = false;
  let hasPerplexityTrigger = false;
  let hasBingTrigger = false;
  let hasGoogleTrigger = false;

  // Check ChatGPT triggers
  const chatgptTriggers = settings.chatgptTriggers || DEFAULT_SETTINGS.chatgptTriggers;
  const trigger = chatgptTriggers.find(t => trimmedQuery.startsWith(t));
  if (trigger) {
    hasChatGPTTrigger = true;
    cleanQuery = trimmedQuery.slice(trigger.length).trim();
    console.log('Removed ChatGPT trigger:', { originalQuery: trimmedQuery, cleanQuery, trigger });
  }

  // Check Perplexity triggers
  const perplexityTriggers = settings.perplexityTriggers || DEFAULT_SETTINGS.perplexityTriggers;
  const pplxTrigger = perplexityTriggers.find(t => trimmedQuery.startsWith(t));
  if (pplxTrigger) {
    hasPerplexityTrigger = true;
    cleanQuery = trimmedQuery.slice(pplxTrigger.length).trim();
    console.log('Removed Perplexity trigger:', { originalQuery: trimmedQuery, cleanQuery, trigger: pplxTrigger });
  }

  // Check Google triggers
  const googleTriggers = settings.googleTriggers || DEFAULT_SETTINGS.googleTriggers;
  const gTrigger = googleTriggers.find(t => trimmedQuery.startsWith(t));
  if (gTrigger) {
    hasGoogleTrigger = true;
    cleanQuery = trimmedQuery.slice(gTrigger.length).trim();
    console.log('Removed Google trigger:', { originalQuery: trimmedQuery, cleanQuery, trigger: gTrigger });
  }

  // Check Bing triggers
  const bingTriggers = settings.bingTriggers || DEFAULT_SETTINGS.bingTriggers;
  const bTrigger = bingTriggers.find(t => trimmedQuery.startsWith(t));
  if (bTrigger) {
    hasBingTrigger = true;
    cleanQuery = trimmedQuery.slice(bTrigger.length).trim();
    console.log('Removed Bing trigger:', { originalQuery: trimmedQuery, cleanQuery, trigger: bTrigger });
  }

  // Determine search engine based on rules
  let searchEngine = settings.defaultAISearchEngine || DEFAULT_SETTINGS.defaultAISearchEngine;
  
  if (hasChatGPTTrigger) {
    searchEngine = 'ChatGPT';
  } else if (hasPerplexityTrigger) {
    searchEngine = 'Perplexity';
  } else if (hasBingTrigger) {
    searchEngine = 'Bing';
  } else if (hasGoogleTrigger) {
    searchEngine = 'Google';
  } else {
    // Check word count - support all Unicode scripts
    const wordCount = countWords(cleanQuery);
    searchEngine = wordCount >= settings.wordThreshold ? searchEngine : (settings.defaultSearchEngine || DEFAULT_SETTINGS.defaultSearchEngine);
    console.log('Word count analysis:', { 
      wordCount, 
      threshold: settings.wordThreshold, 
      searchEngine,
      defaultAIEngine: settings.defaultAISearchEngine,
      text: cleanQuery 
    });
  }

  console.log('Decision:', { searchEngine, cleanQuery });
  return { searchEngine, cleanQuery };
}

// Handle URL changes
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    
    // Skip if already processed
    if (url.searchParams.get('redirected_by_search_master')) return;

    // Only handle Google searches
    if (url.hostname !== 'www.google.com' || !url.pathname.startsWith('/search')) return;

    // Skip if from Google homepage or Chrome's search box
    if (url.searchParams.get('source') === 'hp' || 
        url.searchParams.get('spell') === '1' ||
        url.searchParams.has('sxsrf') ||
        url.searchParams.has('ved')) return;

    const query = url.searchParams.get('q');
    if (!query) return;

    const { searchEngine, cleanQuery } = await processQuery(query);
    
    let redirectUrl;
    if (searchEngine === 'ChatGPT') {
      redirectUrl = `https://chatgpt.com/?q=${encodeURIComponent(cleanQuery)}&hints=search&ref=ext`;
    } else if (searchEngine === 'Perplexity') {
      redirectUrl = `https://www.perplexity.ai/search/new?q=${encodeURIComponent(cleanQuery)}&copilot=false&s=d`;
    } else if (searchEngine === 'Bing') {
      redirectUrl = `https://www.bing.com/search?q=${encodeURIComponent(cleanQuery)}`;
    } else {
      // Use Google search
      redirectUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}&redirected_by_search_master=true`;
    }
    
    chrome.tabs.update(details.tabId, { url: redirectUrl });
  } catch (error) {
    console.error('Error in Search Master:', error);
  }
});
