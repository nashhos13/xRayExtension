// Validation utilities for background script

import { ValidMessage, UserActivationResponse, ProperProductResponse } from './types';

export function isValidMessage(request: any): request is ValidMessage {
    const allowedMessages = new Set([
        "Signed Up",
        "Invalid Scan Attempt",
        "Invalid User",
        "ODR",
        "COR",
        "Product Request",
        "Abort Fetch",
        "Acknowledged"
    ]);

    return (
        request &&
        typeof request === 'object' &&
        typeof request.message === 'string' &&
        typeof request.payload === 'object' &&
        allowedMessages.has(request.message)
    );
}

export function checkForUserActivation(object: any): object is UserActivationResponse {
    return (
        object &&
        typeof object.code === 'string' &&
        typeof object.expires_in === 'number' &&
        typeof object.user_id === 'string'
    );
}

export function checkForProperProduct(object: any): object is ProperProductResponse {
    return (
        object &&
        object.matched_product_images &&
        object.matched_product_title &&
        object.savings_amount &&
        object.scan_run_id &&
        object.skus &&
        object.source_price &&
        object.their_price &&
        object.status
    );
}
