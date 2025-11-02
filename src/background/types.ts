// Type definitions for background script

export interface ValidMessage {
    message: string;
    payload: object;
}

export interface UserActivationResponse {
    code: string;
    expires_in: number;
    user_id: string;
}

export interface ProperProductResponse {
    matched_product_images: any;
    matched_product_title: string;
    savings_amount: string;
    scan_run_id: string;
    skus: any;
    source_price: string;
    their_price: string;
    status: string;
}

export type ProductFetchResult = ProperProductResponse | 'Error' | 'No Match';
