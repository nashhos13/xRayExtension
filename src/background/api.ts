// API communication utilities

import { checkForUserActivation, checkForProperProduct } from './validators';
import { UserActivationResponse, ProductFetchResult } from './types';

// Shared abort controller for fetch operations
let userController: AbortController | null = null;

export function abortCurrentFetch() {
    if (userController) {
        
        userController.abort();
        console.log("Fetch aborted due to tab switch");
        userController = null;
        
        // Disable UI on all content scripts
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        status: "Success",
                        message: "Disable UI"
                    }).catch(() => {
                        // Ignore errors for tabs that don't have content script
                    });
                }
            });
        });
    }
}

function mergeAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
    const controller = new AbortController();

    signals.forEach(signal => {
        if (!signal) return;
        if (signal.aborted) controller.abort();
        else signal.addEventListener('abort', () => controller.abort(), { once: true });
    });

    return controller.signal;
}

export async function fetchUserActivationFromXray(request: any): Promise<UserActivationResponse | null> {
    userController = new AbortController();
    const timeOutController = new AbortController();
    setTimeout(() => timeOutController.abort(), 20000);

    const mergedSignal = mergeAbortSignals(timeOutController.signal, userController.signal);

    try {
        if (request.message === 'Signed Up') {
            console.log("User Id Request:", request);

            const postResponse = await fetch("https://api.tryxray.ai/ext/handshake/start", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ MESSAGE: request.message }),
                signal: mergedSignal
            });

            if (!postResponse.ok) {
                throw new Error(`HTTPS error ${postResponse.status}: ${postResponse.statusText}`);
            }

            const postData = await postResponse.json();
            console.log("POST response:", postData);

            if (!checkForUserActivation(postData)) {
                throw new Error('Invalid userDetails response from xRay API');
            }

            return postData;
        } else {
            throw new Error('Faulty User Activation Request');
        }
    } catch (err) {
        console.error("Error communicating with Xray User Activation API: ", err);
        return null;
    } finally {
        userController = null;
    }
}

export async function fetchProductFromXray(request: any): Promise<ProductFetchResult> {
    userController = new AbortController();
    const timeOutController = new AbortController();
    setTimeout(() => timeOutController.abort(), 20000);

    const mergedSignal = mergeAbortSignals(timeOutController.signal, userController.signal);

    try {
        if (request.message === 'Product Request') {
            console.log("Product Requested: ", request);

            const postResponse = await fetch("https://api.tryxray.ai/scan-from-product-json", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ MESSAGE: request.payload }),
                signal: mergedSignal
            });

            console.log("POST RESPONSE:", postResponse);

            const postData = await postResponse.json();
            console.log("POST response:", postData);

            if (!checkForProperProduct(postData)) {
                return "No Match";
            }

            return postData;
        }

        return "improper request" as any;
    } catch (err) {
        console.error("Error communicating with Xray API:", err);
        return "Error";
    } finally {
        userController = null;
    }
}

export async function fetchOrderDetails(payload: any): Promise<any> {
    const details = await fetch("https://api.tryxray.ai/sku-selection", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ MESSAGE: payload })
    });

    return await details.json();
}

export async function fetchCheckoutSession(payload: any): Promise<any> {
    const res = await fetch("https://api.tryxray.ai/ext-create-checkout-session", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "Accept": "application/json"
        },
        body: JSON.stringify({ message: payload })
    });

    return await res.json();
}
