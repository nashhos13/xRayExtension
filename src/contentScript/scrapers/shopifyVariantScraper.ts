import { ProductCache, ProductSKUs, ProductVariant } from '../types';
import { sanitizeInput } from '../utils/sanitization';

interface ShopifyVariant {
    id: number;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    sku: string;
    requires_shipping: boolean;
    taxable: boolean;
    featured_image: {
        id: number;
        product_id: number;
        position: number;
        created_at: string;
        updated_at: string;
        alt: string | null;
        width: number;
        height: number;
        src: string;
        variant_ids: number[];
    } | null;
    available: boolean;
    price: number;
    grams: number;
    compare_at_price: number | null;
    position: number;
    product_id: number;
    created_at: string;
    updated_at: string;
}

export function shopifyVariantScraper(productCache: ProductCache): void {
    // Try to find Shopify's variant data in window object
    const scriptElements = document.querySelectorAll('script[type="application/json"]');
    let variantData: ShopifyVariant[] | null = null;

    // Look for variant data in script tags
    scriptElements.forEach(script => {
        try {
            const jsonContent = JSON.parse(script.textContent || '');
            if (jsonContent.variants) {
                variantData = jsonContent.variants;
            }
        } catch (e) {
            // Skip invalid JSON
        }
    });

    if (!variantData) {
        return;
    }

    // Build SKUs structure
    const skus: ProductSKUs = {
        variant_label_count: 0,
        variant_labels: {},
        sku_index: {}
    };

    // Get unique option names
    const optionNames = new Set<string>();
    variantData.forEach(variant => {
        if (variant.option1) optionNames.add('option1');
        if (variant.option2) optionNames.add('option2');
        if (variant.option3) optionNames.add('option3');
    });

    skus.variant_label_count = optionNames.size;

    // Build variant labels
    optionNames.forEach((optionName, index) => {
        const values = new Set<string>();
        variantData.forEach(variant => {
            const value = variant[optionName as keyof ShopifyVariant];
            if (typeof value === 'string') {
                values.add(value);
            }
        });

        const variantValues: ProductVariant[] = Array.from(values).map(value => ({
            id: sanitizeInput(value),
            label: value,
            price: variantData.find(v => v[optionName as keyof ShopifyVariant] === value)?.price || 0
        }));

        // Add images if available
        variantValues.forEach(value => {
            const variantWithImage = variantData.find(v => 
                v[optionName as keyof ShopifyVariant] === value.label && 
                v.featured_image
            );
            if (variantWithImage?.featured_image) {
                value.image = variantWithImage.featured_image.src;
            }
        });

        skus.variant_labels[`Option ${index + 1}`] = {
            id: optionName,
            values: variantValues
        };
    });

    // Build SKU index
    variantData.forEach(variant => {
        const key = [variant.option1, variant.option2, variant.option3]
            .filter(Boolean)
            .map(opt => sanitizeInput(opt || ''))
            .join(':');

        skus.sku_index[key] = {
            price: variant.price,
            quantity: variant.available ? 1 : 0
        };
    });

    // Add SKUs to product cache
    (productCache as any).skus = skus;
}