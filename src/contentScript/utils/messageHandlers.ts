import { ProductCache } from '../types';

export function sendProductCacheToAll(productCache: ProductCache) {
    console.log("Final Product HERE: ", productCache);
    chrome.runtime.sendMessage({message: "Product Request", payload: productCache}, (res) => {
        console.log("response from background: ", res);
    });
}

export function checkForSignUp(userAction: string) {
    const currentUrl = window.location.href;
    console.log("Current page URL: ", currentUrl);

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