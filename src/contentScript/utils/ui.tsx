import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChromeApp } from '../../popup/popup';
import { ProductCache } from '../types';
import { Scanner } from '../components/Scanner';

export function injectFoundProduct(productCache: ProductCache | null, currentUrl: string | null, currentCheckoutID: string | null) {
    // BRUTE FORCE: Block all product injection if page is hidden
    if (document.visibilityState === 'hidden') {
        console.log("xRay: BLOCKING product injection - page is hidden");
        return;
    }

    const existing = document.getElementById('found-product');
    if (existing) {
        existing.remove();
    }

    console.log("product -> ", productCache);
    console.log("url -> ", currentUrl);
    console.log("session id -> ", currentCheckoutID);

    const container = document.createElement('div');
    container.id = 'found-product';
    container.style.position = 'fixed';
    container.style.background = 'radial-gradient(100% 60% at 50% 0%, rgb(231, 243, 255) 0%, rgb(227, 231, 255) 1124%, rgb(243, 235, 253) 90%, rgb(252, 253, 255) 100%) no-repeat fixed, linear-gradient(rgb(229, 242, 250) 0%, rgb(250, 249, 254) 100%)';
    container.style.top = '185px';
    container.style.right = '25px';
    container.style.zIndex = '9999';
    container.style.backgroundColor = 'white';

    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<ChromeApp product={productCache} checkoutID={currentCheckoutID} url={currentUrl}/>);
}

export function renderScanner(productCache: ProductCache) {
    // BRUTE FORCE: Block scanner rendering if page is hidden
    if (document.visibilityState === 'hidden') {
        console.log("xRay: BLOCKING scanner render - page is hidden");
        return;
    }

    console.log("xRay: renderScanner called with", productCache);
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = createRoot(container);

    chrome.storage.local.get('xRayCertified').then((result) => {
        const buttonID = !result.xRayCertified || result.xRayCertified === false ? 'inactiveScanner' : 'activeScanner';
        console.log("xRay: Rendering scanner with buttonID:", buttonID);
        root.render(<Scanner product={productCache} buttonID={buttonID} />);
    });
}