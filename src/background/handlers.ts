// Message handler implementations

import { sendToCS } from './messaging';
import {
    fetchUserActivationFromXray,
    fetchProductFromXray,
    fetchOrderDetails,
    fetchCheckoutSession,
    abortCurrentFetch
} from './api';
import { checkForUserActivation, checkForProperProduct } from './validators';

export async function handleSignUp(request: any, sendResponse: (response: any) => void) {
    try {
        const userInfo = await fetchUserActivationFromXray(request);

        if (userInfo && checkForUserActivation(userInfo)) {
            // Set user as valid user
            await chrome.storage.local.set({
                xRayId: userInfo.user_id,
                xRayCertified: true,
                productQueue: 0
            });

            // Add color to button (Indicating ready for use)
            sendToCS({ status: "Success", message: "Update Button" });
        }

        sendResponse({ status: "Success", message: "User Activated" });
    } catch (err) {
        console.error("Error in fetching User ID:", err);
        sendResponse({ status: "Failed", message: "User ID Not Received" });
    }
}

export function handleInvalidScanAttempt() {
    sendToCS({ status: "Success", message: "Send To Xray" });
}

export function handleInvalidUser(sendResponse: (response: any) => void) {
    sendResponse({ status: "Success", message: "Nothing Done" });
}

export async function handleOrderDetailsRequest(request: any, sendResponse: (response: any) => void) {
    try {
        const response = await fetchOrderDetails(request.payload);
        sendResponse({ status: "Success", message: response });
    } catch (err) {
        console.error("Error in ODR request:", err);
        sendResponse({ status: "Failed", message: 'Could not fetch order details' });
    }
}

export async function handleCheckoutRequest(request: any, sendResponse: (response: any) => void) {
    try {
        const url_payload = await fetchCheckoutSession(request.payload);

        if (url_payload) {
            chrome.storage.local.set({
                checkoutID: url_payload['checkout_session_id']
            });

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (!tabs || tabs.length === 0 || !tabs[0]) {
                    console.error("No active tab found for checkout redirect");
                    return;
                }
                chrome.tabs.update(tabs[0].id, { url: url_payload['checkout_url'] });
            });
        } else {
            console.error('No URL returned from backend');
            throw new Error('No URL returned from backend');
        }

        sendResponse({ status: "Success", message: url_payload });
    } catch (err) {
        console.error("Error in retrieving Stripe Checkout Session: ", err);
        sendResponse({ status: "Failed", message: "Could Not Receive Stripe Checkout" });
    }
}

export async function handleProductRequest(request: any, sendResponse: (response: any) => void) {
    try {
        const productFound = await retrieveProduct(request);
        await chrome.storage.local.set({ scanComplete: true });
        await chrome.storage.local.get('productQueue').then((result) => {
            let queue = result.productQueue
            if (queue > 0) {
                queue--;
                chrome.storage.local.set({ productQueue: queue });
            }
        })

        if (productFound) {
            chrome.storage.local.get('productQueue').then((result) => {
                const queuePosition = result.productQueue;
                if (queuePosition === 0) {
                    sendToCS({ status: "Success", message: "Scan Complete" });
                }
            })
            sendResponse({ status: "Success", message: "Product Found" });
        } else {
            sendResponse({ status: "Failed", message: "Product Search Failed" });
        }
    } catch (err) {
        console.error("Error retrieving product:", err);
        sendResponse({ status: "Failed", message: "Error in retrieveProduct" });
    }
}

export function handleAbortFetch(sendResponse: (response: any) => void) {
    abortCurrentFetch();
    sendResponse({ status: 'Success', message: 'Fetch Aborted' });
}

async function retrieveProduct(product: any): Promise<boolean> {
    // Ensure product being requested is attached to a valid userID
    const result = await chrome.storage.local.get('xRayId');

    if (result.xRayId) {
        product.payload.userID = result.xRayId;
    } else {
        throw new Error('Do not have valid user ID attached to product request');
    }

    

    try {
        // Send Scraped Product to xRay API
        const foundProduct = await fetchProductFromXray(product);

        // Set Local Product Cache before sending message
        if (foundProduct && checkForProperProduct(foundProduct)) {
            await chrome.storage.local.set({ productCache: foundProduct });
            return true;
        } else if (foundProduct === 'Error') {
            sendToCS({ status: 'Failed', message: 'Timeout During Request' });
            throw new Error("Not proper returned Product from Xray");
        } else if (foundProduct === 'No Match') {
            await chrome.storage.local.set({ productCache: foundProduct });
            sendToCS({ status: 'Success', message: 'Scan Complete' });
            throw new Error("Error During Request to xRay");
        }

        return false;
    } catch (error) {
        console.error("Error in sendToXray: ", error);
        return false;
    }
}
