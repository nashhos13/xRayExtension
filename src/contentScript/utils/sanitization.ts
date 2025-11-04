import { ProductCache } from '../types';

export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    let sanitized = input.trim();
    
    // Remove dangerous control characters and bidirectional text controls
    sanitized = sanitized
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/[\u202E\u202D\u202A\u202B\u202C\u2066-\u2069]/g, '');
    
    // Remove script tags and dangerous protocols but keep regular content
    sanitized = sanitized
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/(javascript:|data:|vbscript:)/gi, '')
        .replace(/[\r\n\t]/g, ' ')
        .replace(/\s{2,}/g, ' ');
    
    // Don't HTML encode or remove quotes for product descriptions
    // The backend expects raw text, not HTML-encoded text
    
    return sanitized;
}

export function sanitizeForHtml(input: string): string {
    const basic = sanitizeInput(input);
    return basic
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/["'`\\]/g, '');
}

export function sanitizeUrl(url: string): string {
    if (typeof url !== 'string') return '';
    
    let sanitized = url.trim();
    
    // Remove dangerous control characters but keep URL-safe characters
    sanitized = sanitized
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/[\u202E\u202D\u202A\u202B\u202C\u2066-\u2069]/g, '')
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/[\r\n\t]/g, '')
        .replace(/\s{2,}/g, '');
    
    // Don't HTML encode URLs - they need to remain functional
    return sanitized;
}

export function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url, location.href);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

export function sanitizeProductCache(raw: any): ProductCache {
    const type = sanitizeInput(raw.type || '');
    const isShopify = type.toLowerCase().includes('shopify');

    // Sanitize prices/titles/descriptions
    const userID = sanitizeInput(raw.userID || '');
    const url = isSafeUrl(raw.url || '') ? sanitizeUrl(raw.url) : '';
    const price = Array.isArray(raw.price) ? raw.price.map((p: string) => sanitizeInput(p)) : [];
    const title = sanitizeInput(raw.title || '');
    const descriptions = Array.isArray(raw.descriptions) ? raw.descriptions.map((d: string) => sanitizeInput(d)) : [];
    const techDetails = Array.isArray(raw.techDetails)
        ? raw.techDetails.map((d: any) => {
            if (typeof d === 'string') return sanitizeInput(d);
            if (d && typeof d === 'object') return d; // keep object rows as-is
            return '';
        })
        : [];
    // Handle both array and string inputs for techDescription
    let techDescription = "";
    if (Array.isArray(raw.techDescription)) {
        const techDescriptionArray = raw.techDescription.map((d: string) => sanitizeInput(d));
        techDescription = techDescriptionArray.length > 0 ? techDescriptionArray.join(" ") : "";
    } else if (typeof raw.techDescription === 'string') {
        techDescription = sanitizeInput(raw.techDescription);
    }

    // Helper to safely serialize an element to HTML
    const safeOuterHtml = (el: any): string => {
        try {
            if (el && typeof el.outerHTML === 'string') {
                // Basic strip of scripts and events, then return
                const html = el.outerHTML
                    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
                    .replace(/ on[a-z]+="[^"]*"/gi, '')
                    .replace(/ on[a-z]+='[^']*'/gi, '');
                return html;
            }
        } catch {}
        return '';
    };

    // Sanitize images while preserving format per site type
    let images: any[] = [];
    if (Array.isArray(raw.images)) {
        if (isShopify) {
            // Keep object format without the element field; sanitize URLs/alt
            images = raw.images
                .map((img: any) => {
                    if (img && typeof img === 'object') {
                        const src = typeof img.src === 'string' && isSafeUrl(img.src) ? sanitizeUrl(img.src) : '';
                        const currentSrc = typeof img.currentSrc === 'string' && isSafeUrl(img.currentSrc) ? sanitizeUrl(img.currentSrc) : '';
                        const lazySrc = typeof img.lazySrc === 'string' && isSafeUrl(img.lazySrc) ? sanitizeUrl(img.lazySrc) : '';
                        const alt = typeof img.alt === 'string' ? sanitizeInput(img.alt) : '';
                        const elementHtml = safeOuterHtml(img.element);
                        if (!src && !currentSrc && !lazySrc) return null;
                        return { src, currentSrc, lazySrc, alt, elementHtml };
                    }
                    if (typeof img === 'string') {
                        const urlStr = isSafeUrl(img) ? sanitizeUrl(img) : '';
                        if (!urlStr) return null;
                        // Normalize to object format for consistency on Shopify
                        return { src: urlStr, currentSrc: '', lazySrc: '', alt: '', elementHtml: '' };
                    }
                    return null;
                })
                .filter(Boolean) as any[];
        } else {
            // Amazon/others: keep as array of string URLs
            images = raw.images
                .map((img: any) => {
                    if (typeof img === 'string') {
                        return isSafeUrl(img) ? sanitizeUrl(img) : '';
                    } else if (img && typeof img === 'object') {
                        const urlStr = img.src || img.currentSrc || img.lazySrc || '';
                        return isSafeUrl(urlStr) ? sanitizeUrl(urlStr) : '';
                    }
                    return '';
                })
                .filter((u: string) => u !== '');
        }
    }

    return {
        userID,
        url,
        type,
        price,
        images: images as any,
        title,
        descriptions,
        techDetails,
        techDescription,
    } as ProductCache;
}