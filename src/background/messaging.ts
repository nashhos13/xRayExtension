// Messaging utilities for communicating with content scripts

export function sendToCS(messageObject: any) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Guard: Check if we have an active tab
        if (!tabs || tabs.length === 0 || !tabs[0]) {
            console.warn("sendToCS: No active tab found, cannot send message:", messageObject);
            return;
        }

        chrome.tabs.sendMessage(tabs[0].id, messageObject, (res) => {
            if (chrome.runtime.lastError) {
                console.error("Message failed:", chrome.runtime.lastError.message);
            } else {
                console.log("Response from content script:", res);
            }
        });
    });
}
