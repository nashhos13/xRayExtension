import React, { useState, useEffect } from 'react';
import { ImageSlide } from '../components/ImageSlide';
import { formatPrice, sendMessageToBackground, setInitialProduct } from '../utils';

interface CheckoutProps {
    product: any;
    setView: (view: string) => void;
    variantIndex: any;
    setVariant: (variant: Record<string, any>) => void;
    renderedVariant: Record<string, any> | null;
}

export function Checkout({ product, setView, variantIndex, setVariant, renderedVariant }: CheckoutProps) {
    const [orderInfo, setOrderInfo] = useState<any>(null);
    const selectedVariant = product['selectedVariantID'];

    console.log("Transferred Product:", product);

    let imgDisplayed;
    if (renderedVariant) {
        for (const key in renderedVariant) {
            if ((renderedVariant[key] as any).hasOwnProperty('image')) {
                imgDisplayed = (renderedVariant[key] as any).image;
            }
        }
    }

    useEffect(() => {
        async function fetchOrderDetails() {
            try {
                const result = await chrome.storage.local.get('xRayId');
                if (result.xRayId) {
                    const customerInfo = {
                        user_id: result.xRayId,
                        scan_id: product.scan_run_id,
                        selected_sku: selectedVariant
                    };

                    console.log("Customer Info: ", customerInfo);

                    const orderInfo = await sendMessageToBackground({ message: "ODR", payload: customerInfo });
                    console.log("Order Details found --> ", orderInfo);

                    setOrderInfo(orderInfo['message']);

                    chrome.storage.local.set({
                        latestOrderInfo: orderInfo['message']
                    });
                }
            } catch (error) {
                console.error("Failed to receive valid order details: ", error);
            }
        }

        fetchOrderDetails();
    }, []);

    const sendToCheckout = async () => {
        const user_ID = await chrome.storage.local.get('xRayId');
        const scan_ID = product.scan_run_id;

        const scanInfo = {
            userID: user_ID['xRayId'],
            scanID: scan_ID
        };

        console.log("payload: ", scanInfo);

        try {
            const url_payload = await sendMessageToBackground({ message: "COR", payload: scanInfo });
        } catch (error) {
            console.error('Checkout request failed:', error);
        }
    };

    if (!orderInfo) {
        return <div>Loading Order Details...</div>;
    }

    if (!orderInfo.shipping_date) {
        return (
            <div
                id="ShippingDateError"
                style={{
                    margin: '40px auto',
                    padding: '20px',
                    width: '80%',
                    backgroundColor: '#fff3f3',
                    border: '1px solid #f5c2c2',
                    borderRadius: '10px',
                    textAlign: 'center',
                    color: '#b00020',
                    fontWeight: '600',
                    boxShadow: '0 0 10px rgba(0,0,0,0.05)',
                }}
            >
                ⚠️ Sorry — delivery isn't available to your address for this option
                <br />
                Please try again later or contact support if the issue persists.
                <br />
                <button
                    onClick={() => { setView('matchfound'); }}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        backgroundColor: '#f5c2c2',
                        color: '#b00020',
                        border: 'none',
                        borderRadius: '5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                    }}
                >
                    ← Go Back
                </button>
            </div>
        );
    }

    const restoreProduct = (product: any) => {
        setVariant(setInitialProduct(product));
        setView('matchfound');
    };

    let priceToDisplay;

    if (product.skus.variant_label_count > 0) {
        priceToDisplay = formatPrice(product.skus.sku_index[selectedVariant]['price']);
    } else {
        priceToDisplay = formatPrice(product.source_price);
    }

    return (
        <div id='CheckoutPage' style={{ width: '500px' }}>
            <div id='topArrow' style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button 
                    id='previous' 
                    style={{ width: '10%', backgroundColor: '#42aff5', color: 'white' }} 
                    onClick={() => { restoreProduct(product); }}
                >
                    &larr;
                </button>
            </div>
            <div id='ImageAndTitleView' style={{ display: 'flex', margin: '5px 7.5%' }}>
                <div id="ImageSlideTwo" style={{ flex: 1 }}>
                    {imgDisplayed ? (
                        <img src={imgDisplayed} style={{ width: '100%', border: 'solid', alignItems: 'center' }} alt="Product" />
                    ) : (
                        <ImageSlide productImages={product.matched_product_images} indicators={false} navButtonsVisible={false} />
                    )}
                </div>
                <div id='ItemTitle' style={{
                    flex: 1, textAlign: 'center', alignItems: 'center',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center'
                }}>
                    <h1 style={{ fontSize: '1.25em', maxHeight: '250px', overflow: 'scroll', scrollbarWidth: 'none' }}>{product.matched_product_title}</h1>
                </div>
            </div>
            <h3 style={{ fontSize: '.75em', width: "80%", whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 10%', justifyContent: 'center' }}>
                XRAYED ON: <span style={{ overflow: 'scroll' }}>{window.location.href}</span>
            </h3>
            <div id='OrderSummary' style={{ display: 'flex', flexDirection: 'column', margin: '0 5%', border: '1px solid gray', borderRadius: '10%' }}>
                <h1 style={{ textAlign: 'center' }}>Order Summary</h1>
                <div id='MarketPrice' style={{ display: 'flex' }}>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%' }}>Market Price:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%' }}>{formatPrice(product.their_price)}</span>
                </div>
                <div id='OurSourcePrice' style={{ display: 'flex' }}>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%' }}>Source Price:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%' }}>{priceToDisplay}</span>
                </div>
                <div id='ShippingDetails' style={{ display: 'flex' }}>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%' }}>Shipping (Est. Delivery; {orderInfo.shipping_date}):</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%' }}>{orderInfo.shipping_price}</span>
                </div>
                <div id='TaxPrice' style={{ display: 'flex' }}>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%' }}>Tax:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%' }}>{orderInfo.tax}</span>
                </div>
                <div id='PurchaseProtection' style={{ display: 'flex' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%' }}>Purchase Protection:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%' }}>{orderInfo.xray_purchase_protection}</span>
                </div>
                <button id='PurchaseProtectionDetails' style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    marginLeft: '15%',
                    width: '50%',
                    textAlign: 'left',
                    color: 'gray',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                }}>
                    What is This?
                </button>
                <p style={{ textAlign: 'center' }}>_____________________________________</p>

                <div id='TotalCost' style={{ display: 'flex', margin: '5%' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '2.25em', textAlign: 'left', width: '50%', marginLeft: '15%' }}>Total:</span>
                    <span style={{ fontWeight: '600', fontSize: '2.25em', textAlign: 'right', width: '50%', marginRight: '15%' }}>{orderInfo.total}</span>
                </div>
            </div>
            <div id='SavingsAndPurchase' style={{ display: 'flex', margin: '5px 15%' }}>
                <button id="Savings" style={{ flex: 1, borderRadius: '20%', color: 'white', textAlign: 'center', backgroundColor: 'green', marginRight: '5%' }}>
                    You Saved {orderInfo.xray_savings_amount} ({orderInfo.xray_savings_percent})!!!
                </button>
                <button id='Checkout' style={{ flex: 1, borderRadius: '20%', color: 'black', textAlign: 'center', backgroundColor: 'skyblue', marginLeft: '5%' }} onClick={sendToCheckout}>
                    Stripe <br /> Secure Checkout
                </button>
            </div>
        </div>
    );
}
