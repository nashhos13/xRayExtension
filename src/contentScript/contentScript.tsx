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

// Using shared productCache from productCache.ts

chrome.storage.local.set({
    tabChanged: false
})

document.addEventListener('visibilitychange', async () => {

    if (document.visibilityState === 'hidden') {

        await chrome.storage.local.set({ tabChanged: true });

        chrome.runtime.sendMessage({ message: 'Abort Fetch', payload: {} }, (res) => {
            // Fetch aborted
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

        const activeButton = document.getElementById('activeScanner')
        const inactiveButton = document.getElementById('inactiveScanner')

        const validRequest = isValidRequest(request)

        if (!validRequest) {
            // Unknown request type
        }

        // Handle Messages from background script
        if (request.message === "Scan Complete") {

            await chrome.storage.local.set({
                scanComplete: true
            })

            const { tabChanged } = await chrome.storage.local.get('tabChanged');

            if (activeButton && !tabChanged) {
                
                activeButton.click() // Trigger handler for scan button

                const { productCache, checkoutID, lastUrlScraped } = await chrome.storage.local.get([
                    'productCache',
                    'checkoutID',
                    'lastUrlScraped'
                ]);

                injectFoundProduct(productCache, lastUrlScraped, checkoutID)
            }

        } else if (request.message === 'Send To Xray') {

            injectFoundProduct(null, null, null)

        } else if (request.message === 'Update Button') {

            if (inactiveButton) inactiveButton.click()

        } // else if (request.message === 'Timeout During Request') {
            
        //     if (activeButton) activeButton.click()

        // } 

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

    const onXrayHomePage = window.location.href.includes("tryxray.ai");

    if (onXrayHomePage) {
        renderScanner(productCache);
        checkForSignUp("Invalid User");
    } else {
        // Since manifest restricts to Amazon domains, we know this is Amazon
        productCache.type = 'Amazon';
        renderScanner(productCache);
    }

})


