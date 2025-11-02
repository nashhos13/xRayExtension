import { ProductCache } from '../types';

export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    let sanitized = input.trim();
    
    sanitized = sanitized
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/[\u202E\u202D\u202A\u202B\u202C\u2066-\u2069]/g, '')
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/["'`\\]/g, '')
        .replace(/(javascript:|data:|vbscript:)/gi, '')
        .replace(/[\r\n\t]/g, ' ')
        .replace(/\s{2,}/g, ' ');
    
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
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
    const url = isSafeUrl(raw.url || '') ? sanitizeInput(raw.url) : '';
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
    const techDescription = Array.isArray(raw.techDescription) ? raw.techDescription.map((d: string) => sanitizeInput(d)) : [];

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
                        const src = typeof img.src === 'string' && isSafeUrl(img.src) ? sanitizeInput(img.src) : '';
                        const currentSrc = typeof img.currentSrc === 'string' && isSafeUrl(img.currentSrc) ? sanitizeInput(img.currentSrc) : '';
                        const lazySrc = typeof img.lazySrc === 'string' && isSafeUrl(img.lazySrc) ? sanitizeInput(img.lazySrc) : '';
                        const alt = typeof img.alt === 'string' ? sanitizeInput(img.alt) : '';
                        const elementHtml = safeOuterHtml(img.element);
                        if (!src && !currentSrc && !lazySrc) return null;
                        return { src, currentSrc, lazySrc, alt, elementHtml };
                    }
                    if (typeof img === 'string') {
                        const urlStr = isSafeUrl(img) ? sanitizeInput(img) : '';
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
                        return isSafeUrl(img) ? sanitizeInput(img) : '';
                    } else if (img && typeof img === 'object') {
                        const urlStr = img.src || img.currentSrc || img.lazySrc || '';
                        return isSafeUrl(urlStr) ? sanitizeInput(urlStr) : '';
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