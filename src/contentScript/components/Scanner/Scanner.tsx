import React, { useState } from 'react';
import { AnimateButton } from './AnimateButton';
import { injectFoundProduct } from '../../utils/ui';

interface ScannerProps {
    product: any;
    buttonID: string;
}

export const Scanner: React.FC<ScannerProps> = ({ product, buttonID }) => {
    const [scanStatus, setScanStatus] = useState('notScanning');
    const [buttonStatus, setButtonStatus] = useState(buttonID);

    // Scanning button click() handler
    const clickHandler = () => {
        chrome.storage.local.get('scanComplete').then((result) => {
            if (result && result.scanComplete === true) {
                chrome.storage.local.get('productCache').then((result) => {
                    if (!result || Object.keys(result).length === 0) {
                        console.log("Timeout");
                        setScanStatus('timeOut');
                    } else if (result.productCache.matched_product_title) {
                        console.log("Matched");
                        setScanStatus('match');
                    } else {
                        console.log("No Match");
                        setScanStatus('noMatch');
                    }
                });
                chrome.storage.local.remove('scanComplete');
            }
        });
    };

    const tryAgain = () => {
        injectFoundProduct(null, null, null);
        setScanStatus('notScanning');
    };

    let button;
    if (scanStatus === 'notScanning') {
        button = <AnimateButton 
            WORDS={TARGET_TEXT} 
            setScanStatus={setScanStatus} 
            setButtonStatus={setButtonStatus} 
            productCache={product} 
            buttonStyle={buttonStatus}
        />;
    } else if (scanStatus === 'scanning') {
        button = <div>
            <h1 id='stayOnPageBox'></h1>
            <span id='stayOnPageMessage'>Please Do Not Leave Page!!!</span>
            <div id='stayOnPageQuoteBox'></div>
            <button id={buttonStatus} className='productLoading' onClick={() => clickHandler()}>
                <span style={{fontSize: '1.2em'}}>X</span>
            </button>
        </div>;
    } else if (scanStatus === 'match') {
        button = <div>
            <button id='matchFoundScanner' className='Match'>MATCH!</button>
            <button id='tryAgain' onClick={() => tryAgain()}>Try Again</button>
        </div>;
    } else if (scanStatus === 'noMatch') {
        button = <div>
            <h1 id='matchNotFoundBox'></h1>
            <span id='matchNotFoundMessage'>Match Not Found</span>
            <div id='matchNotFoundQuoteBox'></div>
            <button id='matchNotFoundScanner' className='noMatch' onClick={() => setScanStatus('notScanning')}>Try Again</button>
        </div>;
    } else if(scanStatus === 'timeOut') {
        button = <div>
            <h1 id='timeOutBox'></h1>
            <span id='timeOutMessage'>Something Went Wrong</span>
            <div id='timeOutQuoteBox'></div>
            <button id='timeOutScanner' className='timeOut' onClick={() => setScanStatus('notScanning')}>Try Again</button>
        </div>;
    }

    return <>{button}</>;
};

export const TARGET_TEXT = "SCAN";