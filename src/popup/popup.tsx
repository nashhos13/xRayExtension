import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';
import { checkUserKey } from '../contentScript/utils/messageHandlers';
import { setInitialProduct } from './utils';
import { SignUpRequired } from './components/SharedComponents';
import { MatchFound } from './pages/MatchFound';
import { Checkout } from './pages/Checkout';
import { OrderConfirmed } from './pages/OrderConfirmed';

// Most components are going to be used in the Content Script. The Popup is no longer active

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    sendResponse("Message has been RECEIVED");
});

export function ChromeApp({ product, checkoutID, url }: { product: any; checkoutID: string; url: string }) {

    const [validUser, setValidUser] = useState<boolean | null>(null);
    const [view, setView] = useState<string>('matchfound');
    const [variant, setVariant] = useState<Record<string, any> | null>(null);

    // Initialize variant state only when matched product with skus is present
    useEffect(() => {
        try {
            if (product && typeof product === 'object' && product.skus && product.skus.variant_labels) {
                setVariant(setInitialProduct(product));
            } else {
                setVariant(null);
            }
        } catch (e) {
            console.warn('Failed to initialize variants:', e);
            setVariant(null);
        }
    }, [product]);

    useEffect(() => {
        checkUserKey("xRayCertified").then(setValidUser);
    }, []);

    if (validUser === null) return <SignUpRequired />;
    if (!validUser) return <SignUpRequired />;

    let page;

    if (product && product.matched_product_title) {
        if (checkoutID && url.includes('success?session_id=' + checkoutID)) {
            page = <OrderConfirmed product={product} setView={setView} />;
        } else if (view === 'checkout') {
            page = <Checkout product={product} setView={setView} renderedVariant={variant} setVariant={setVariant} variantIndex={variant} />;
        } else if (view === 'matchfound') {
            page = <MatchFound product={product} setView={setView} renderedVariant={variant} setVariant={setVariant} variantIndex={variant} />;
        }

        return <>{page}</>;
    }

    return null;
}

/*
------------------------------ ONLY USED IF WE WANT TO IMPLEMENT POPUP --------------------------------

chrome.storage.local.get('productCache').then(async (result) => {
    let finalProduct;

    const checkoutSessionID = await chrome.storage.local.get('checkoutID')
    const currentUrl = await chrome.storage.local.get('lastUrlScraped')

    if (result.productCache != undefined) {
        finalProduct = result.productCache
    }

    const rootElement = document.createElement('div')

    document.body.appendChild(rootElement)
    const root = ReactDOM.createRoot(rootElement)   
    
    root.render(<><ChromeApp product={finalProduct} checkoutID={checkoutSessionID['checkoutID']} url={currentUrl['lastUrlScraped']}/></>)
    chrome.storage.local.remove('productCache')
})
*/
