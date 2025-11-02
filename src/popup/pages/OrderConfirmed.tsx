import React, { useState } from 'react';

interface OrderConfirmedProps {
    product: any;
    setView: (view: string) => void;
}

export function OrderConfirmed({ product, setView }: OrderConfirmedProps) {
    const [order, setOrder] = useState<any>(null);

    chrome.storage.local.get('latestOrderInfo').then((result) => {
        if (result.latestOrderInfo) {
            setOrder(result.latestOrderInfo);
        }
    });

    return order ? (
        <div id='OrderConfirmedPage' style={{ width: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div id='topArrow' style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                <button 
                    id='previous' 
                    style={{ width: '10%', backgroundColor: '#42aff5', color: 'white' }} 
                    onClick={() => setView('checkout')}
                >
                    &larr;
                </button>
            </div>
            <div id='ThankYouSector' style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ margin: '0' }}>Order Confirmed!!!</h1>
                <h3>
                    Thank you for letting us help you save! <br />
                    A receipt will be sent to your inbox shortly.
                </h3>
            </div>
            <div id='ProductSummarySector' style={{ border: '1px solid black', borderRadius: '5%', width: '80%' }}>
                <div id='ImageAndTitleViewAndDOD' style={{ display: 'flex', margin: '5px 7.5%' }}>
                    <div id='ItemTitle' style={{
                        flex: 1, textAlign: 'center', alignItems: 'center',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        marginLeft: '5%'
                    }}>
                        <h1 style={{ fontSize: '1.25em', margin: '10px' }}>{product.matched_product_title}</h1>
                        <h3>
                            XRAYED ON: <br />
                            Website.com
                        </h3>
                        <h2>Total: {order.total}</h2>
                    </div>
                </div>
                <div id='DeliveryInfo' style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <b style={{ margin: '1% 0' }}>Order Number: 832befw4he2</b>
                    <b style={{ margin: '1% 0' }}>Est. Delivery: September 26, 2025</b>
                </div>
            </div>

            <div id='CongratulationsSector' style={{ display: 'inline-block', padding: '0.5rem', textAlign: 'center', marginTop: '5%', border: '1px solid black', borderRadius: '10%' }}>
                <h1 style={{ paddingRight: '10px' }}>Congratulations!</h1>
                <h3>You just saved</h3>
                <h2 style={{ color: 'green' }}>$25.00</h2>
                <h3>In 40 seconds with xRay!</h3>
            </div>

            <h3 style={{ textAlign: 'center' }}>
                Help your friends save and <br />
                <b>get $5 off your next checkout!</b>
            </h3>

            <button id='ShareButton' style={{ fontSize: '2em', color: 'white', backgroundColor: 'black', marginBottom: '5px' }}>Share</button>
            <button id='DismissButton' style={{ fontSize: '2em', color: 'white', backgroundColor: 'skyblue', marginTop: '5px' }}>Dismiss xRay</button>
        </div>
    ) : <div>Loading...</div>;
}
