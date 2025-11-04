// Messaging utilities for communicating with content scripts

export function sendToCS(messageObject: any) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Guard: Check if we have an active tab
        if (!tabs || tabs.length === 0 || !tabs[0]) {
            return;
        }

        chrome.tabs.sendMessage(tabs[0].id, messageObject, (res) => {
            if (chrome.runtime.lastError) {
                // Message failed - tab doesn't have content script or is not accessible
            }
        });
    });
}
