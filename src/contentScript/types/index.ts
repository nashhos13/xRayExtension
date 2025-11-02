export interface ProductImage {
    element?: HTMLImageElement;
    src: string;
    alt: string;
    currentSrc: string;
    lazySrc: string | null;
    // For sanitized payloads crossing the message boundary (no DOM nodes)
    elementHtml?: string;
}

export interface ProductVariant {
    id: string;
    label: string;
    image?: string;
    price: number;
    quantity?: number;
}

export interface ProductSKUs {
    variant_label_count: number;
    variant_labels: Record<string, {
        id: string;
        values: ProductVariant[];
    }>;
    sku_index: Record<string, {
        price: number;
        quantity: number;
    }>;
}

export interface MatchedProduct {
    matched_product_images: string[];
    matched_product_title: string;
    savings_amount: string;
    scan_run_id: string;
    skus: ProductSKUs;
    source_price: string;
    their_price: string;
    status: string;
}

export interface ProductCache {
    userID: string | null;
    url: string | null;
    type: string | null;
    price: string[];
    images: Array<string | ProductImage>;
    title: string | null;
    descriptions: string[];
    techDetails: any[];
    techDescription: string[];
}

export interface ScrapedProduct extends ProductCache {
    skus?: ProductSKUs;
    matched_product_title?: string;
    matched_product_images?: string[];
    savings_amount?: string;
    scan_run_id?: string;
    source_price?: string;
    their_price?: string;
    status?: string;
}

export interface ChromeMessage {
    status: string;
    message: string;
    payload?: any;
}

export interface OrderDetails {
    shipping_date: string;
    shipping_price: string;
    tax: string;
    xray_purchase_protection: string;
    total: string;
    xray_savings_amount: string;
    xray_savings_percent: string;
}

export interface ScannerProps {
    product: ScrapedProduct;
    buttonID: string;
}

// Note: AnimateButtonProps lives alongside the component to avoid cross-layer coupling