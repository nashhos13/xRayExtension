import React, { useState, useRef } from 'react';
import { scrapeAfterLoad } from '../../utils/scraping';

const CYCLES_PER_LETTER = 2;
const SHUFFLE_TIME = 100;
const CHARS = "!@#$%^&*():{};|,.<>/?";

interface AnimateButtonProps {
    WORDS: string;
    setScanStatus: (status: string) => void;
    setButtonStatus: (status: string) => void;
    productCache: any;
    buttonStyle: string;
}

export const AnimateButton: React.FC<AnimateButtonProps> = ({
    WORDS,
    setScanStatus,
    setButtonStatus,
    productCache,
    buttonStyle
}) => {
    const interval = useRef<ReturnType<typeof setInterval> | null>(null);
    const [text, setText] = useState(WORDS);

    // Word scramble animation on button hover
    const scramble = () => {
        let pos = 0;

        interval.current = setInterval(() => {
            const scrambled = WORDS.split("")
                .map((char, index) => {
                    if (pos / CYCLES_PER_LETTER > index) {
                        return char;
                    }
                    const randomCharIndex = Math.floor(Math.random() * CHARS.length);
                    const randomChar = CHARS[randomCharIndex];
                    return randomChar;
                })
                .join("");

            setText(scrambled);
            pos++;

            if (pos >= WORDS.length) {
                stopScramble();
            }
        }, SHUFFLE_TIME);
    };

    const stopScramble = () => {
        if (interval.current) {
            clearInterval(interval.current);
        }
        setText(WORDS);
    };

    // Initiate Product Scan upon click (IF Certified User) --> change button status
    const waitForResponse = () => {
        console.log("Checking scan");

        chrome.storage.local.get('xRayCertified').then(async (result) => {
            try {
                if (result.xRayCertified === true) {
                    setButtonStatus('activeScanner');
                    if (productCache.type != null) {
                        // Store the current URL where scan is starting and reset tab changed flag
                        await chrome.storage.local.set({ 
                            scanStartedUrl: window.location.href 
                        });
                        await chrome.storage.local.remove('tabChanged');
                        setScanStatus('scanning');
                        
                        // Lock tab during scan
                        (window as any).lockTab?.();
                    }
                }
            } catch (error) {
                console.error("Error starting scan:", error);
            }
        });
        scrapeAfterLoad(productCache); // ---------------------------------------------------------------- THIS IS WHERE THE PRODUCT SCRAPE BEGINS !!!!!!!
    };

    return (
        <button 
            id={buttonStyle}
            onMouseEnter={scramble} 
            onMouseLeave={stopScramble}
            onClick={() => waitForResponse()}
        >
            <div>
                <span style={{justifyContent: 'center'}}>{text}</span>
            </div>
        </button>
    );
};