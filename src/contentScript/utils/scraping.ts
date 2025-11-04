import { ProductCache } from '../types';
import { checkUserKey, sendProductCacheToAll, checkForSignUp } from './messageHandlers';
import { sanitizeProductCache } from './sanitization';
import { doAmazonScrape } from '../scrapers/amazonScraper';

export async function scrapeAfterLoad(productCache: ProductCache) {
    const currentUrl = window.location.href;

    await chrome.storage.local.set({
        lastUrlScraped: currentUrl
    });

    console.log("ON SITE");

    const validUser = await checkUserKey("xRayCertified");

    if (validUser) {
        setTimeout(() => {
            console.log("starting scrape");
            productCache.url = document.URL;

            // Since we only support Amazon now, always use Amazon scraper
            console.log("Amazon Product---");
            doAmazonScrape(productCache);

            // Avoid circular refs from HTMLElement in Shopify image objects
            const safeReplacer = (_key: string, value: any) => {
                if (value instanceof HTMLElement) return '[HTMLElement]';
                if (value && typeof value === 'object' && 'element' in value) {
                    const { element, ...rest } = value as any;
                    return { ...rest, element: '[HTMLElement]' };
                }
                return value;
            };
            console.log("RAW productCache BEFORE sanitization:", JSON.stringify(productCache as any, safeReplacer, 2));
            const sanitizedCache = sanitizeProductCache(productCache);
            console.log("SANITIZED productCache AFTER sanitization:", JSON.stringify(sanitizedCache, null, 2));
            sendProductCacheToAll(sanitizedCache);

        }, 2000);
    } else {
        checkForSignUp("Invalid Scan Attempt");
    }
}

export function findLikelyProductDiv(): HTMLElement | null {
    let likelyProductElement = null;
    const allElements = Array.from(document.querySelectorAll("div, section"));
    const minWidth = 700;
    const minHeight = 700;
    const maxWidth = 6000;
    const maxHeight = 6000;

    allElements.forEach(e => {
        if (e.clientWidth >= minWidth && e.clientHeight >= minHeight 
            && e.clientWidth < maxWidth && e.clientHeight < maxHeight) {
            if (!likelyProductElement) {
                likelyProductElement = e;
            } else {
                if (e.clientHeight > likelyProductElement.clientHeight) {
                    likelyProductElement = e;
                }
            }
        }
    });

    return likelyProductElement instanceof HTMLElement ? likelyProductElement : null;
}

export function setShopifyImageLink(image: any): string {
    let imageLink = '';
    
    if (image.src != '') {
        imageLink = image.src;
    } else if (image.currentSrc != '') {
        imageLink = image.currentSrc;
    } else if (image.lazySrc != '') {
        imageLink = image.lazySrc;
    } else {
        imageLink = "NO LINK";
    }

    return imageLink;
}

export function lazyLoadedImageScraper(productImages: any[]): any[] {
    productImages.forEach(img => {
        const srcset = img.element.getAttribute('data-src');
        const imgWidth = img.element.getAttribute('data-widths');

        if (!srcset || !imgWidth) {
            return productImages;
        }

        const queriedSize = "460";
        const imgSizeIndexStart = imgWidth.search(queriedSize);
        const imgSizeIndexEnd = imgSizeIndexStart + (queriedSize.length);
        const imgSize = imgWidth.slice(imgSizeIndexStart, imgSizeIndexEnd);

        let fullImgSrc = srcset.replace("{width}", imgSize);                 

        if (fullImgSrc.startsWith('//')) {
            fullImgSrc = 'https:' + fullImgSrc;
        }

        img.lazySrc = fullImgSrc;
    });

    return productImages;
}

export function productPriceScraper(productCache: ProductCache): void {
    const regex = /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/;

    // 1) Known price selectors for Amazon/Shopify/common
    const priceSelectors = [
        '#corePriceDisplay_desktop_feature_div .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '[data-product-price]',
        '[class*=price] .money',
        '[class*=price] .price',
        '.product__price',
        '.price-item',
        '.a-price .a-offscreen'
    ];

    for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        const txt = el?.textContent || '';
        const match = txt.match(regex);
        if (match) {
            const normalized = match[0].replace(/\$\s*(\d)/, '$$$1');
            if (!productCache.price.includes(normalized)) productCache.price.push(normalized);
        }
    }

    if (productCache.price.length) return;

    // 2) Fallback: traverse up from likely product area
    const start = findLikelyProductDiv() || document.body;
    let node: HTMLElement | null = start;
    let steps = 0;
    while (node && steps < 20 && productCache.price.length === 0) {
        const txt = node.textContent || '';
        const match = txt.match(regex);
        if (match) {
            const normalized = match[0].replace(/\$\s*(\d)/, '$$$1');
            productCache.price.push(normalized);
            break;
        }
        node = node.parentElement;
        steps++;
    }
}