import { ProductCache } from '../types';
import { findLikelyProductDiv, lazyLoadedImageScraper, setShopifyImageLink } from '../utils/scraping';
import { sanitizeInput } from '../utils/sanitization';
import { shopifyVariantScraper } from './shopifyVariantScraper';
import { productPriceScraper } from '../utils/scraping';

export function getShopifyProduct(): HTMLElement | null {
    var possibleProducts = [];
    const mainTags = document.getElementsByTagName("main");

    if (mainTags.length > 0) {
        const mainElement = mainTags[0];
        if (!(mainElement instanceof HTMLElement)) return findLikelyProductDiv();

        const shopifySections = mainElement.getElementsByClassName("shopify-section");

        if ( !shopifySections || !(shopifySections.length > 0) ) {
            const likelyProductSections = Array.from(mainElement.querySelectorAll("div, section"));

            likelyProductSections.forEach(section => {
                const label = section.getAttribute("data-label");
           
                if (label == "Product" || label == "product") {
                    possibleProducts.push(section);
                } else if (section.clientHeight >= 700 && section.clientWidth >= 700) {
                    possibleProducts.push(section);
                }
            });

            if (possibleProducts.length > 0) {
                if (possibleProducts[0] instanceof HTMLElement) {
                    return possibleProducts[0];
                }
            }
        }

        const sectionsArray = Array.from(shopifySections);
        var mainProduct = sectionsArray[0];

        sectionsArray.forEach(section => {
            if (section.id && section.id.includes('main')) {
                mainProduct = section;
            }
        });
        
        if (mainProduct instanceof HTMLElement) {
            return mainProduct;
        }
    } else {
        return findLikelyProductDiv();
    }
}

export function shopifyProductImageScraper(productCache: ProductCache): void {
    const mainProduct = getShopifyProduct();

    if (mainProduct) {
        const sectionImages = Array.from(mainProduct.querySelectorAll("img"));
        var relevantImages = [];

        sectionImages.forEach(img => {
            if (img.height > 75 && img.width > 75) {
                const tooWide = (img.width / img.height >= 2);
                const tooTall = (img.height / img.width >= 2);
                if (!tooWide && !tooTall) { relevantImages.push(img); }
            }
        });

        const productImages = relevantImages
        .filter(img => img instanceof HTMLImageElement)
        .map((img) => ({
               element: img,
                   src: img.src || '',
            currentSrc: img.currentSrc || '',
                   alt: img.alt || '',
               lazySrc: null
        }));

        // Preserve original object-based image structure for Shopify
        // Resolve lazy-loaded src on each image object but keep full objects in cache
        let filteredImages = lazyLoadedImageScraper(productImages);
        productCache.images = filteredImages as any;

        for (var i = 0; i < productImages.length; i++) {
            if (productImages[i].alt != '') {
                productCache.title = productImages[i].alt;
                break;
            }
        }

        if (!productCache.title || productCache.title === '') {
            productCache.title = '';
            const queriedTitleElements = Array.from(mainProduct.querySelectorAll('[class*="title"]'));
           
            if ( queriedTitleElements && queriedTitleElements.length > 0) {
                queriedTitleElements.forEach(e => {
                    const rawText = e.textContent || '';
                    const title = sanitizeInput(rawText);
                    const match = title.match(/^\s*([\w\s\-,&]+?)\s*$/m);
                    const foundTitle = match ? match[1].trim() : null;

                    if (foundTitle && productCache.title === '') {
                        productCache.title = sanitizeInput(foundTitle);
                    }
                });
            }
        }

    } else {
        const allImages = Array.from(document.querySelectorAll("img"));
        var likelyProductImages = [];

        allImages.forEach(img => {
            if (img.width >= 75 && img.height >= 75) {
                const tooWide = (img.width / img.height >= 2);
                const tooTall = (img.height / img.width >= 2);
                if (!tooWide && !tooTall) likelyProductImages.push(img);
            }
        });

        const cleanedProductImages = likelyProductImages.map((img) => ({
               element: img,
                   src: img.src,
            currentSrc: img.currentSrc,
                   alt: img.alt,
               lazySrc: null
        }));
        // Keep object-based images even in fallback
        productCache.images = cleanedProductImages as any;
    }
}

export function shopifyProductTextScraper(productCache: ProductCache): void {
    const mainProduct = getShopifyProduct();
    
    var allElements;
    var descriptionArray = [];
    
    if (mainProduct) {    
        allElements = Array.from(mainProduct.querySelectorAll('span, p'));
    } else {
        allElements = Array.from(document.querySelectorAll('span, p'));
    }

    for (var i = 0; i < allElements.length; i++) {
        const textContent = allElements[i].textContent;
        const letterArray = textContent.match(/[a-zA-Z]/g);

        if (letterArray) {
            const letterCount = letterArray.length;
            if (letterCount > 20) {
                descriptionArray.push(textContent);
            }
        }
    }

    productCache.descriptions = descriptionArray;
}

export function shopifyProductPriceScraper(productCache: ProductCache): void {
    const mainProduct = getShopifyProduct();

    if (mainProduct) {
        const productPrice = Array.from(mainProduct.querySelectorAll('[data-product-price]'));

        if (productPrice.length > 0) {
            for (var i = 0; i < productPrice.length; i++) {
                const foundPrice = productPrice[i].textContent.match(/\$\d+(?:\.\d{2})?/g);
                if (foundPrice) {
                    foundPrice.forEach((PRICE) => {
                        if ( !(productCache.price.includes(PRICE)) ) {
                            productCache.price.push(PRICE);
                        }
                    });
                }
            }
        } else {
            const productPrices = Array.from(mainProduct.querySelectorAll('[class*=price]'));

            for (var i = 0; i < productPrices.length; i++) {
                const priceItem = productPrices[i].textContent;
                const foundPrice = priceItem.match(/\$\s?\d+(?:\.\d{2})?/g);
                var trimmedPrice = null;

                if (priceItem && foundPrice && foundPrice.length > 0) {
                    foundPrice.forEach((PRICE) => {
                        trimmedPrice = PRICE.replace(/\$\s*(\d+(?:\.\d{2})?)/, "$$$1");
                        if ( !(productCache.price.includes(trimmedPrice)) ) {
                            productCache.price.push(trimmedPrice);
                        }
                    });
                }
            }
        }
    } else {
        // No Shopify main product found for price scraping
    }
}

export function doShopifyScrape(productCache: ProductCache): void {
    shopifyProductImageScraper(productCache);
    shopifyProductTextScraper(productCache);
    shopifyProductPriceScraper(productCache);
    shopifyVariantScraper(productCache);
    // Fallback: if no price found yet, use the generic price scraper with wider selectors
    if (!productCache.price || productCache.price.length === 0) {
        productPriceScraper(productCache);
    }
}
