import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChromeMessage, ProductCache } from './types';
import { productCache } from './productCache';
import { ChromeApp } from '../popup/popup';
import { renderScanner, injectFoundProduct } from './utils/ui';
import { sanitizeInput, isSafeUrl, sanitizeProductCache } from './utils/sanitization';
import { setShopifyImageLink, lazyLoadedImageScraper, productPriceScraper, findLikelyProductDiv, scrapeAfterLoad } from './utils/scraping';
import { doShopifyScrape } from './scrapers/shopifyScraper';
import { doAmazonScrape } from './scrapers/amazonScraper';
import { sendProductCacheToAll, checkForSignUp, checkUserKey } from './utils/messageHandlers';
import './contentScript.css';

console.log("xRay Extension: Content script loaded!");

// Using shared productCache from productCache.ts

// BRUTE FORCE: Block all functionality when user leaves page
let contentScriptDisabled = false;

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        console.log("xRay: Page hidden - DISABLING ALL FUNCTIONALITY");
        contentScriptDisabled = true;
        
        chrome.runtime.sendMessage({ message: 'Abort Fetch', payload: {} }, (res) => {
            console.log("ABORT?", res)
        });
    }
})

function isValidRequest(request: any): request is {status: string, message: string}  {

    const validStatus = new Set(["Success", "Failed"])
    // const validMessage = new Set(["Scan Complete", "Send To Xray", "Update Button", "User Activated", "User ID Not Received" ])

    return (
        request &&
        typeof request.status === 'string' &&
        typeof request.message === 'string' &&
        validStatus.has(request.status)
    )
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    (async () => {

        // BRUTE FORCE: Block all messages if content script is disabled
        if (contentScriptDisabled) {
            console.log("xRay: Content script disabled - blocking message:", request.message);
            sendResponse({message: "Content Script Disabled", payload: {}});
            return;
        }

        const activeButton = document.getElementById('activeScanner')
        const inactiveButton = document.getElementById('inactiveScanner')

        const validRequest = isValidRequest(request)

        if (!validRequest) {
            console.log("Unknown Request: ", request)
        }

        // Check Message 
        console.log("Action from background:", request)

        // Handle Messages from background script
        if (request.message === "Scan Complete") {

            console.log("GO HERE")

            await chrome.storage.local.set({
                scanComplete: true
            })

            if (activeButton) activeButton.click() // Trigger handler for scan button

            const { productCache, checkoutID, lastUrlScraped } = await chrome.storage.local.get([
                'productCache',
                'checkoutID',
                'lastUrlScraped'
            ]);

            injectFoundProduct(productCache, lastUrlScraped, checkoutID)

        } else if (request.message === 'Send To Xray') {

            injectFoundProduct(null, null, null)

        } else if (request.message === 'Update Button') {

            console.log("doing this")
            if (inactiveButton) inactiveButton.click()

        } else if (request.message === 'Timeout During Request') {
            
            if (activeButton) activeButton.click()

        } 

        sendResponse({message: "Acknowledged", payload: {}})

    })();

    return true

});

// --- use canonical helpers from utils and scrapers (imports above)

// chrome.storage.local.clear()

// --------------------------------------------------------------------------------------------------------------

// --------------------------- Scraping Hierarchy ---------------------
// Ensure Local Product Cache is NULL
chrome.storage.local.remove('productCache').then(() => {

    console.log("xRay: Starting detection. Current URL:", window.location.href);

    const onXrayHomePage = window.location.href.includes("tryxray.ai");

    if (onXrayHomePage) {
        console.log("xRay: On tryxray.ai homepage");
        renderScanner(productCache);
        checkForSignUp("Invalid User");
    } else {
        // Since manifest restricts to Amazon domains, we know this is Amazon
        productCache.type = 'Amazon';
        console.log("xRay: Detected Amazon site");
        console.log("xRay: Calling renderScanner");
        renderScanner(productCache);
    }

})


