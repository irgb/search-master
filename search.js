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

    const encodedQuery = encodeURIComponent(cleanQuery);
    return useChatGPT
        ? `https://chatgpt.com/?q=${encodedQuery}&hints=search&ref=ext`
        : `https://www.google.com/search?q=${encodedQuery}`;
}

// Handle the search
async function handleSearch() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (!query) {
            window.location.href = 'https://www.google.com';
            return;
        }

        const targetUrl = await processQuery(query);
        window.location.href = targetUrl;
    } catch (error) {
        console.error('Error in Smart Search:', error);
        // Fallback to Google if there's an error
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
}

// Start processing as soon as the page loads
handleSearch();
