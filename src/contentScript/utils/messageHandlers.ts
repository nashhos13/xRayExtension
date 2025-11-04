import { ProductCache } from '../types';

export function sendProductCacheToAll(productCache: ProductCache) {
    chrome.runtime.sendMessage({message: "Product Request", payload: productCache}, (res) => {
        // Response received from background
    });
}

export function checkForSignUp(userAction: string) {
    const currentUrl = window.location.href;

    if (currentUrl === 'https://tryxray.ai/home') {
        chrome.runtime.sendMessage({message: "Signed Up", payload: {}});
    } else {
        chrome.runtime.sendMessage({message: userAction, payload: {}});
    }
}

export function checkUserKey(key: string): Promise<boolean> {
    return chrome.storage.local.get([key]).then((result) => {
        return result[key] === true;
    });
}