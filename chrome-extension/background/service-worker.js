// UfuqLink Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open welcome page on install
    chrome.tabs.create({ url: "https://ufuqaudit.app/features" });
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkUrlStatus") {
    // In a real implementation, this would make HTTP HEAD requests
    // to verify link status. Chrome extensions can use fetch() for this.
    checkUrlStatus(message.url)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message, status: 0 }));
    return true; // Keep channel open for async response
  }
});

async function checkUrlStatus(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    return {
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url,
    };
  } catch (err) {
    // HEAD not supported — try GET
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      return {
        status: response.status,
        redirected: response.redirected,
        finalUrl: response.url,
      };
    } catch (err2) {
      return { status: 0, error: err2.message };
    }
  }
}
