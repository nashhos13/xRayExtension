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
    const interval = useRef<NodeJS.Timeout | null>(null);
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

        chrome.storage.local.get('xRayCertified').then((result) => {
            if (result.xRayCertified === true) {
                setButtonStatus('activeScanner');
                if (productCache.type != null) {
                    setScanStatus('scanning');
                }
            }
        });
        scrapeAfterLoad(productCache);
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