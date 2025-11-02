// Main background script - orchestrates message handling and API communication
import { isValidMessage } from './validators';
import {
    handleSignUp,
    handleInvalidScanAttempt,
    handleInvalidUser,
    handleOrderDetailsRequest,
    handleCheckoutRequest,
    handleProductRequest,
    handleAbortFetch
} from './handlers';

// Create context menu item
chrome.contextMenus.create({
    title: "xRay Scan",
    id: "XRS1",
    contexts: ["page"]
});

// Message listener - routes messages to appropriate handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("RAW MESSAGE: ", request);

    const validMessage = isValidMessage(request);

    if (!validMessage) {
        console.log("Message not accepted");
        return false;
    }

    // Route to appropriate handler based on message type
    if (request.message === 'Signed Up') {
        handleSignUp(request, sendResponse);
        return true;
    }

    if (request.message === 'Invalid Scan Attempt') {
        handleInvalidScanAttempt();
        return true;
    }

    if (request.message === 'Invalid User') {
        handleInvalidUser(sendResponse);
        return true;
    }

    if (request.message === 'ODR') {
        handleOrderDetailsRequest(request, sendResponse);
        return true;
    }

    if (request.message === 'COR') {
        handleCheckoutRequest(request, sendResponse);
        return true;
    }

    if (request.message === 'Product Request') {
        handleProductRequest(request, sendResponse);
        return true;
    }

    if (request.message === 'Abort Fetch') {
        handleAbortFetch(sendResponse);
        return true;
    }

    sendResponse({ status: "Failed", message: "Unknown message type" });
    return true;
});




