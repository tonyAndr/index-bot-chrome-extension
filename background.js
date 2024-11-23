chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const host = 'https://link-indexing-bot.ru/api'
    if (request.action === 'any') {
        fetch(host + request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body
        })
            .then(response => response.json())
            .then(data => sendResponse(data))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Will respond asynchronously
    }
});