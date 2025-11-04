import { setShopifyImageLink } from '../contentScript/utils/scraping';

// Helper to format prices to exactly 2 decimal places with $ prefix
export function formatPrice(price: any): string {
    if (typeof price === 'string') {
        // Remove $ and any whitespace, parse, format
        const numStr = price.replace(/[$\s]/g, '');
        const num = parseFloat(numStr);
        if (isNaN(num)) return '$0.00';
        return '$' + num.toFixed(2);
    }
    if (typeof price === 'number') {
        return '$' + price.toFixed(2);
    }
    return '$0.00';
}

// Send message to background script and return response as promise
export function sendMessageToBackground(object: any): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(object, (res) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(res);
            }
        });
    });
}

// Clean and deduplicate image array based on product type
export function cleanImgArray(productCache: any): string[] {
    const cleanImgArray: string[] = [];
    const images = productCache.images;
    const type = productCache.type;

    if (type === 'shopify') {
        images.forEach((img: any) => {
            const imageLink = setShopifyImageLink(img);
            if (imageLink !== 'NO LINK' && !cleanImgArray.includes(imageLink)) {
                cleanImgArray.push(imageLink);
            }
        });

        return cleanImgArray;

    } else if (type === 'amazon') {
        images.forEach((img: string) => {
            let imageLink = img;
            if (img.includes("US40")) {
                imageLink = img.replace("US40", "US460");
            }
            if (!cleanImgArray.includes(imageLink)) {
                cleanImgArray.push(imageLink);
            }
        });

        return cleanImgArray;
    }

    return cleanImgArray;
}

// Clean and deduplicate description array
export function cleanDescriptionArray(descriptions: string[]): string[] {
    const cleanDescriptionArray: string[] = [];

    descriptions.forEach((d) => {
        if (!cleanDescriptionArray.includes(d)) {
            cleanDescriptionArray.push(d);
        }
    });

    return cleanDescriptionArray;
}

// Initialize product variant state from product data
export function setInitialProduct(product: any): Record<string, any> {
    const productState: Record<string, any> = {};

    // Guard: handle missing or malformed skus
    if (!product || !product.skus || !product.skus.variant_labels) {
        return {};
    }

    const VARIANTS = product.skus.variant_labels;

    for (const key in VARIANTS) {
        const newKey = VARIANTS[key].id;
        const baseValue = VARIANTS[key].values[0];

        productState[newKey] = baseValue;
    }

    return productState;
}
