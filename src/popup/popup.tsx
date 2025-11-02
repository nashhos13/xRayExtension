import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Carousel from 'react-material-ui-carousel';
import * as Mui from '@mui/material'
import './popup.css';
import { number } from 'framer-motion';

// Most components are going to be used in the Content Script. The Popup is no longer active

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    sendResponse("Message has been RECEIVED")
})

export function sendMessageToBackground(object) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(object, (res) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
            } else {
                resolve(res)
            }
        })
    })
}

export function ImageSlide( {productImages, indicators = false, navButtonsVisible = false} ) {
    return (

            <Carousel 
                indicators={indicators}
                interval={1500}
                navButtonsAlwaysInvisible={navButtonsVisible}
                sx={{
                    width: {xs: '100%', sm: '90%', md: '80%'},
                    mx: 'auto'
                }}
            >
                {
                    productImages.map(img => <Mui.Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '100%',
                                overflow: 'hidden',
                            }}
                         >
                            <img className='receipt-image' src={img} style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}/>
                         </Mui.Box>)
                }
            </Carousel>
    )
}

export function ProductProfile({title, price}) {

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '50%', width: '40%'}}>
            <h1>{title}</h1>
            <h2>Price Variations: {price.join(", ")}</h2>
        </div>
    )
}

export function ProductDescription({description}) {
    return (
        <div style={{width: 'auto', margin: '0 10%'}}>
            <ul>
                {description.map((d) => (
                    <li>{d}</li>
                ))}
            </ul>
        </div>
    )
}

export function ProductFinePrint({details, descriptions}) {
    if (details.length > 0) {
        return (
            <div style={{width: 'auto', margin: '0 10%'}}>
                <h1 style={{textAlign: 'center'}}>Fine Print</h1>
                <ul>
                    {details.map((detail, index) => {
                        const [key, value] = Object.entries(detail)[0];
                        return <li key={index}>{key}: {String(value)}</li>;
                    })}
                </ul>

                <p> {descriptions} </p>
            </div>
        )
    }
}

export function PurchaseButton() {
    return (
            <Mui.Button href='/product.html'
            sx={{width: '250px', height: '85px'}} variant='contained'>
            <span style={{fontSize: '3em', fontFamily: 'Verdana'}}>Purchase</span>
            </Mui.Button>
    )
}

export function LoadingPage() {
    return (
        <div>
             <h1> Still Loading Product</h1>
        </div>
    )
}

export function SignUpRequired() {
    return (
        <div id='SignUp_div' style={{position: 'fixed', width: '200px', top: '165px', right: '25px', height: '200px', justifyContent: 'center', background: 'radial-gradient(100% 60% at 50% 0%, rgb(231, 243, 255) 0%, rgb(227, 231, 255) 1124%, rgb(243, 235, 253) 90%, rgb(252, 253, 255) 100%) no-repeat fixed, linear-gradient(rgb(229, 242, 250) 0%, rgb(250, 249, 254) 100%)'}}>
            <h1>Sorry!!! You Must Sign Up Here!!!!!: <br /></h1>
            <a href='https://tryxray.ai'>Join xRay</a>
        </div>
    )
}



export function cleanImgArray(productCache) {
    var cleanImgArray = []
    const images = productCache.images
    const type = productCache.type


    if (type == 'shopify') {
        
        images.forEach((img) => {
            const imageLink = setShopifyImageLink(img)
            if (imageLink != 'NO LINK' && !cleanImgArray.includes(imageLink)) {
                cleanImgArray.push(imageLink)
            }
        })

        return cleanImgArray

    } else if (type == 'amazon') {

        images.forEach((img) => {
            var imageLink = img
            if (img.includes("US40")) {
                imageLink = img.replace("US40", "US460")  // NEEDS WORK !!!!!!!!!!!!!!!!!!!!!!!!!!!
            }
            
            if (!cleanImgArray.includes(imageLink)) {
                cleanImgArray.push(imageLink)
            }
        })

        return cleanImgArray

    }

}

export function cleanDescriptionArray(descriptions) {
    var cleanDescriptionArray = []

    console.log("TYPE?? ", descriptions)

    descriptions.forEach((d) => {

        if (!cleanDescriptionArray.includes(d)) {
            cleanDescriptionArray.push(d)
        }

    })

    return cleanDescriptionArray

}

export function setShopifyImageLink(image) {
    var imageLink = ''
    
    if (image.src != '') {
        imageLink = image.src
    } else if (image.currentSrc != '') {
        imageLink = image.currentSrc
    } else if (image.lazySrc != '') {
        imageLink = image.lazySrc
    } else {
        imageLink = "NO LINK"
    }

    return imageLink
} 

export function checkUserKey(key) {

    return chrome.storage.local.get([key]).then((result) => {
        console.log("Uer Valid?? --> ", result[key])
        return result[key] === true
    }) 

}

// ---------------------------------------------------- "Match Found" page ---------------------------------------
// xRay AI logo sector
// Product Image Carousel 
// You Save!!!! - sector
// Product Title and variant
// Price Sector
// Specifications
// Buttons - Exact Match, Not Match but Buy Anyway, Try Again
 
export function MatchFound({ product, setView,  renderedVariant, setVariant, variantIndex }) {

    console.log("PRODUCT INFO: ", product)
     // Product Variant array --> used to set product info for backend request
    console.log("Current variant ++ ", renderedVariant)
    let productState = renderedVariant
    let masterKey = '';

    Object.entries(renderedVariant).map(([key, value]) => {
        const masterKeySnippet = key + ':' + value['id'] + ';'
        masterKey += masterKeySnippet
    })

    const finalKey = masterKey.slice(0, -1)

    console.log("MASTER KEY: ", finalKey)
    console.log("TOTAL VARIANTS:", product.skus['variant_label_count'])

    // const rawSourcePrice = product.their_price.replace('$', '')
    // const rawNewPrice = product.skus[variantIndex]['sku_price'].replace('$', '')
    // const savings = (Number(rawSourcePrice) - Number(rawNewPrice)).toFixed(2)
    // const percent = ((Number(savings) / Number(rawSourcePrice)) * 100).toFixed(2)

    const changeVariant = (event) => {
        console.log("Variant Change:", event.target.id)
        const selectedVariant = Number(event.target.value)
        setVariant(selectedVariant)
    }

    let VARIANTS
    let productIndex
    let theirPrice
    let sourcePrice 
    let diff


    if (product.skus.variant_label_count > 0) {

        console.log("Variants ARe there")
        VARIANTS = product.skus.variant_labels
        productIndex = product.skus.sku_index
        theirPrice = Number(product.their_price.slice(1))
        sourcePrice = (Number(productIndex[finalKey]['price']).toFixed(2)) 
        diff = (theirPrice - sourcePrice).toFixed(2)

    } else {

        theirPrice = Number(product.their_price.slice(1))
        sourcePrice = (Number(product.source_price.slice(1))).toFixed(2)

    }

    // console.log("typeOf : ", typeof theirPrice)
    // console.log("Variant to send: ", productIndex[finalKey] )
    // console.log("Their Price:" , theirPrice)

    const updateProductState = (select) => {

        console.log("Option selected: ", select.target)
        console.log("Value selected: ", select.target.value)

        const variantChanged = select.target.id
        const newVariant = select.target.value

        const updatedProductState = {...productState}
        

        // Update productState with new value object of selected value.id
        for (const key in VARIANTS) {
            if (VARIANTS[key].id === variantChanged) {
                VARIANTS[key].values.forEach((value) => {
                    if (value.id === newVariant) {
                        updatedProductState[variantChanged] = value
                    }
                })
            }
        }

        setVariant(updatedProductState)

        console.log("New Product State: ", updatedProductState)
    } 

    // Check which variant contains img:
    let imgDisplayed; 
    for (const key in renderedVariant) {
        if (renderedVariant[key].hasOwnProperty('image')) {
            imgDisplayed = renderedVariant[key].image
        }
    }

    // Object.entries(VARIANTS).map(([key, value]) => {
    //     console.log(`Key: ${key['id']} -- Values:`)
    //     value['values'].forEach((label) => {
    //         console.log(`Value: ${label.label} -- ${label.id}`)
    //     })
    // })

    product['selectedVariantID'] = finalKey

    console.log("Current Variant info -----> ", product.skus.sku_index[finalKey])

    if (product.skus.variant_label_count === 0) {
       return (
        <div id='MatchFoundPage' style={{ textAlign: 'center', width: '300px', background: 'radial-gradient(100% 60% at 50% 0%, rgb(231, 243, 255) 0%, rgb(227, 231, 255) 1124%, rgb(243, 235, 253) 90%, rgb(252, 253, 255) 100%) no-repeat fixed, linear-gradient(rgb(229, 242, 250) 0%, rgb(250, 249, 254) 100%)' }}>
    
            <h1 id="MatchFoundDisplay" style={{ marginBottom: '20px' }}>Potential Match Found!!!</h1>
            <div id="ImageSlideOne" style={{ display: 'flex', justifyContent: 'center', width: '80%', marginLeft: '10%' }}>
                <ImageSlide productImages={product.matched_product_images} />
            </div>
            <div id='InfoSection' style={{
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '5px',
                marginTop: '5%',
                marginBottom: '5%'
            }}>
                <div id="ProductTitle" style={{ display: 'flex', alignItems: 'center', gap: '20px'}}>
                    <h2 style={{fontSize: '1.25em'}}>{product.matched_product_title}</h2>

                </div>
                <div id="PriceSector" style={{display: 'flex'}}>
                    <div id='TheirPrice'>
                        <p>Their Price</p>
                        <h3>${theirPrice}</h3>
                    </div>
                    <div id='SourcePrice' style={{marginLeft: 'auto'}}>
                        <p>Source Price</p>
                        <h3>${sourcePrice}</h3>
                    </div>
                </div>
                <h3 id="Savings">You Save --- <span style={{color: 'green'}}>${(theirPrice - sourcePrice)}</span> </h3>
                <div id='ItemDetails' className='leftAlign'>
                    <ul>
                        <li>Detail 1</li>
                        <li>Detail 2</li>
                        <li>Detail 3</li>
                    </ul>
                </div>
            </div>
            <div id='NextStepButtons'>
                (
                    <>
                        <button id='MatchButton' style={{color: 'white', backgroundColor: 'skyblue'}} onClick={() => setView('checkout')}>Match</button>
                        <button id='BuyAnywayButton' style={{backgroundColor: '#616161'}} onClick={() => setView('checkout')}>Buy Anyway</button>
                    </>
                ) 
            </div>
        </div> 
       )               
    }

    return (
        <div id='MatchFoundPage' style={{ textAlign: 'center', width: '300px', background: 'radial-gradient(100% 60% at 50% 0%, rgb(231, 243, 255) 0%, rgb(227, 231, 255) 1124%, rgb(243, 235, 253) 90%, rgb(252, 253, 255) 100%) no-repeat fixed, linear-gradient(rgb(229, 242, 250) 0%, rgb(250, 249, 254) 100%)' }}>
    
            <h1 id="MatchFoundDisplay" style={{ marginBottom: '20px' }}>Potential Match Found!!!</h1>
            <div id="ImageSlideOne" style={{ display: 'flex', justifyContent: 'center', width: '80%', marginLeft: '10%' }}>
                {/* <ImageSlide productImages={product.matched_product_images} /> */}
                <img src={imgDisplayed} style={{width: '80%'}}/>
            </div>
            <div id='InfoSection' style={{
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '5px',
                marginTop: '5%',
                marginBottom: '5%'
            }}>
                <div id="ProductTitle" style={{ display: 'flex', alignItems: 'center', gap: '20px'}}>
                    <h2 style={{fontSize: '1.25em'}}>{product.matched_product_title}</h2>

                    {product.skus['variant_label_count'] > 0 ? (
                    <div>
                        {Object.entries(VARIANTS).map(([variant, labels]) => (
                        <div>
                            <span>{variant}:</span>
                            <select id={labels['id']} onChange={updateProductState}>
                                {labels['values'].map((value) => (
                                <option value={value.id}>
                                    {value.label}
                                </option>
                                ))}
                            </select>
                        </div>
                        ))}
        
                    </div>
                    ) : null}

                </div>
                <div id="PriceSector" style={{display: 'flex'}}>
                    <div id='TheirPrice'>
                        <p>Their Price</p>
                        <h3>{product.their_price}</h3>
                    </div>
                    <div id='SourcePrice' style={{marginLeft: 'auto'}}>
                        <p>Source Price</p>
                        <h3>${sourcePrice}</h3>
                    </div>
                </div>
                <h3 id="Savings">You Save --- <span style={{color: 'green'}}>${diff}</span> </h3>
                <div id='ItemDetails' className='leftAlign'>
                    <ul>
                        <li>Detail 1</li>
                        <li>Detail 2</li>
                        <li>Detail 3</li>
                    </ul>
                </div>
            </div>
            <div id='NextStepButtons'>
                {product.skus.sku_index[finalKey]['quantity'] > 0 ? (
                    <>
                        <button id='MatchButton' style={{color: 'white', backgroundColor: 'skyblue'}} onClick={() => setView('checkout')}>Match</button>
                        <button id='BuyAnywayButton' style={{backgroundColor: '#616161'}} onClick={() => setView('checkout')}>Buy Anyway</button>
                    </>
                ) : <button style={{background: 'red', color: 'white', marginBottom: '10px'}}> OUT OF STOCK </button> }
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------------------------


// -------------------------------------------------------- Checkout Page ----------------------------------------
export function Checkout({ product, setView, variantIndex, setVariant, renderedVariant }) {
    const [orderInfo, setOrderInfo] = useState(null)
    const selectedVariant = product['selectedVariantID']


    console.log("Transferred Product:", product)

    let imgDisplayed; 
    for (const key in renderedVariant) {
        if (renderedVariant[key].hasOwnProperty('image')) {
            imgDisplayed = renderedVariant[key].image
        }
    }

    useEffect(() => {
        async function fetchOrderDetails() {

            try {
                chrome.storage.local.get('xRayId').then(async (result) => {
                    if (result.xRayId) {

                        // GET PRODUCT VARIANT

                        const customerInfo = {
                            user_id: result.xRayId,
                            scan_id: product.scan_run_id,
                            selected_sku: selectedVariant
                        }

                        console.log("Customer Info: ", customerInfo)

                        const orderInfo = await sendMessageToBackground({message: "ODR", payload: customerInfo})
                        console.log("Order Details found --> ", orderInfo)

                        setOrderInfo(orderInfo['message'])

                        chrome.storage.local.set({
                            latestOrderInfo: orderInfo['message']
                        })

                    }
                })
            
            } catch (error) {
                console.error("Failed to receive valid order details: ", error)
            }
        }

        fetchOrderDetails();
    }, [])

    const sendToCheckout = async () => {
        const user_ID = await chrome.storage.local.get('xRayId')
        const scan_ID = product.scan_run_id

        const scanInfo = {
            userID: user_ID['xRayId'],
            scanID: scan_ID
        }

        console.log("payload: ", scanInfo)

        try {

            const url_payload = await sendMessageToBackground({message: "COR", payload: scanInfo})

        } catch (error) {
            console.error('Checkout request failed:', error)
        }

        
    }

    if (!orderInfo) {
        return <div> Loading Order Details... </div>
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
                ⚠️ Sorry — delivery isn’t available to your address for this option
                <br />
                Please try again later or contact support if the issue persists.
                <br />
                <button
                    onClick={() => {setView('matchfound')}}
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
        )
    }

    const restoreProduct = (product) => {
        setVariant(setInitialProduct(product))
        setView('matchfound')
    }

    let priceToDisplay;

    if (product.skus.variant_label_count > 0) {
        priceToDisplay = product.skus.sku_index[selectedVariant]['price'].toFixed(2)
    } else {
        priceToDisplay = product.source_price
    }

    if (!priceToDisplay.includes('$')) {
        priceToDisplay = '$' + priceToDisplay
    }
    


    // Different Full HTML
    return (
        <div id='CheckoutPage' style={{width: '500px'}}>
            <div id='topArrow' style={{display: 'flex', justifyContent: 'flex-start'}}>
                <button id='previous' style={{width: '10%', backgroundColor: '#42aff5', color: 'white'}} onClick={() => {restoreProduct(product)}}>&larr;</button>   
            </div>
            <div id='ImageAndTitleView' style={{display: 'flex', margin: '5px 7.5%'}}>
                <div id="ImageSlideTwo" style={{flex: 1}}>
                    
                    {imgDisplayed ? (
                        <img src={imgDisplayed} style={{width: '100%', border: 'solid', alignItems: 'center'}}/>
                    ) : <ImageSlide productImages={product.matched_product_images} indicators={false} navButtonsVisible={false}/>}
                     
                </div>
                <div id='ItemTitle' style={{
                    flex: 1, textAlign: 'center', alignItems: 'center',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center'
                }}>
                    <h1 style={{fontSize: '1.25em', maxHeight: '250px', overflow: 'scroll', scrollbarWidth: 'none'}}>{product.matched_product_title}</h1>
                </div>
            </div>
            <h3 style={{fontSize: '.75em', width: "80%", whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 10%', justifyContent: 'center'}}>
                    XRAYED ON: <span style={{overflow: 'scroll'}}>{window.location.href}</span>
            </h3>
            <div id='OrderSummary' style={{display: 'flex', flexDirection: 'column', margin: '0 5%', border: '1px solid gray', borderRadius: '10%'}}>
                <h1 style={{textAlign: 'center'}}>Order Summary</h1>
                <div id='MarketPrice' style={{display: 'flex'}}>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%'}}>Market Price:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%'}}>{product.their_price}</span>
                </div>
                <div id='OurSourcePrice' style={{display: 'flex'}}>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%'}}>Source Price:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%'}}>{priceToDisplay}</span>
                </div>
                <div id='ShippingDetails' style={{display: 'flex'}}>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%'}}>Shipping (Est. Delivery; {orderInfo.shipping_date}):</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%'}}>{orderInfo.shipping_price} </span>
                </div>
                <div id='TaxPrice' style={{display: 'flex'}}>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%'}}>Tax:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%'}}>{orderInfo.tax}</span>
                </div>
                <div id='PurchaseProtection' style={{display: 'flex'}}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.25em', textAlign: 'left', width: '50%', marginLeft: '15%'}}>Purchase Protection:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25em', textAlign: 'right', width: '50%', marginRight: '15%'}}>{orderInfo.xray_purchase_protection}</span>
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
                <p style={{textAlign: 'center'}}>_____________________________________</p>

                <div id='TotalCost' style={{display: 'flex', margin: '5%'}}>
                    <span style={{ fontWeight: 'bold', fontSize: '2.25em', textAlign: 'left', width: '50%', marginLeft: '15%'}}>Total:</span>
                    <span style={{ fontWeight: '600', fontSize: '2.25em', textAlign: 'right', width: '50%', marginRight: '15%'}}>{orderInfo.total}</span>
                </div>
            </div>
            <div id='SavingsAndPurchase' style={{display: 'flex', margin: '5px 15%'}}>
                <button id="Savings" style={{flex: 1, borderRadius: '20%', color: 'white', textAlign: 'center', backgroundColor: 'green', marginRight: '5%'}}>You Saved {orderInfo.xray_savings_amount} ({orderInfo.xray_savings_percent})!!!</button>
                <button id='Checkout' style={{flex: 1, borderRadius: '20%', color: 'black', textAlign: 'center', backgroundColor: 'skyblue', marginLeft: '5%'}} onClick={sendToCheckout}>Stripe <br/> Secure Checkout</button>
            </div>
        </div>
    )
}

// --------------------------------------------------------------------------------------------------------------------------------

// ----------------------------------------------- Order Confirmed Page -----------------------------------------------------------
export function OrderConfirmed({ product, setView }) {

    const [order, setOrder] = useState(null)

    chrome.storage.local.get('latestOrderInfo').then((result) => {
        if (result.latestOrderInfo) {
            setOrder(result.latestOrderInfo)
        }
    })

    return order ? (
        <div id='OrderConfirmedPage' style={{width: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div id='topArrow' style={{display: 'flex', justifyContent: 'flex-start', width: '100%'}}>
                <button id='previous' style={{width: '10%', backgroundColor: '#42aff5', color: 'white'}} onClick={() => setView('checkout')}>&larr;</button>   
            </div>
            <div id='ThankYouSector' style={{textAlign: 'center', display: 'flex', flexDirection: 'column'}}>
                <h1 style={{margin: '0'}}>Order Confirmed!!!</h1>
                <h3>Thank you for letting us help you save! <br/>
                A receipt will be sent to your inbox shortly.</h3>
            </div>
            <div id='ProductSummarySector' style={{border: '1px solid black', borderRadius: '5%', width: '80%'}}>
                <div id='ImageAndTitleViewAndDOD' style={{display: 'flex', margin: '5px 7.5%'}}>
                    {/* <div id="ImageSlideTwo" style={{flex: 1, marginTop: '25%'}}><ImageSlide productImages={product.images} indicators={false} navButtonsVisible={false}/></div> */}
                    <div id='ItemTitle' style={{
                        flex: 1, textAlign: 'center', alignItems: 'center',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        marginLeft: '5%'
                    }}>
                        <h1 style={{fontSize: '1.25em', margin: '10px'}}>{product.matched_product_title}</h1>
                        <h3>
                            XRAYED ON: <br />
                            Website.com
                        </h3>
                        <h2>Total: {order.total}</h2>
                    </div>
                </div>
                <div id='DeliveryInfo' style={{textAlign: 'center', display: 'flex', flexDirection: 'column'}}>
                    <b style={{margin: '1% 0'}}>Order Number: 832befw4he2</b>
                    <b style={{margin: '1% 0'}}>Est. Delivery: September 26, 2025</b>
                </div>
            </div>

            <div id='CongratulationsSector' style={{display: 'inline-block', padding: '0.5rem', textAlign: 'center', marginTop: '5%', border: '1px solid black', borderRadius: '10%'}}>
                <h1 style={{paddingRight: '10px'}}>Congratulations!</h1>
                <h3>You just saved</h3>
                <h2 style={{color: 'green'}}>$25.00</h2>
                <h3>In 40 seconds with xRay!</h3>
            </div>

            <h3 style={{textAlign: 'center'}}>Help your friends save and <br/>
                <b>get $5 off your next checkout!</b>
            </h3>

            <button id='ShareButton' style={{fontSize: '2em', color: 'white', backgroundColor: 'black', marginBottom: '5px'}}>Share</button>
            <button id='DismissButton' style={{fontSize: '2em', color: 'white', backgroundColor: 'skyblue', marginTop: '5px'}}>Dismiss xRay</button>
        </div>
    ) : <div>Loading ...</div>
}
// --------------------------------------------------------------------------------------------------------------------------------


export function ChromeApp({ product, checkoutID, url }) {

    console.log("Checkout id IN APP", "((", checkoutID, "))")
    console.log("Url IN APP", url)

    const [validUser, setValidUser] = useState(null);
    const [view, setView] = useState('matchfound');
    const [variant, setVariant] = useState(() => {
        return product ? setInitialProduct(product) : null;
    });


    useEffect(() => {
        checkUserKey("xRayCertified").then(setValidUser);
    }, []);

    if (validUser === null) return <SignUpRequired />;
    if (!validUser) return <SignUpRequired />;
    
 
    console.log("IDK?? --> ", view)

    let page;
 
    if (product.matched_product_title) {

        if (checkoutID && url.includes('success?session_id=' + checkoutID)) {
            console.log("ORDERED")
            page = <OrderConfirmed product={product} setView={setView} />;
        } else if (view === 'checkout') {
            console.log("CHECKOUT")
            page = <Checkout product={product} setView={setView} renderedVariant={variant} setVariant={setVariant} variantIndex={variant} />;
        } else if (view === 'matchfound' ) {
            console.log("MATCH FOUND -- ", variant)
            page = <MatchFound product={product} setView={setView} renderedVariant={variant} setVariant={setVariant} variantIndex={variant} />;
        }

        return <>{page}</>;
        
    }


}

function setInitialProduct(product) {

    let productState = {}

    const VARIANTS = product.skus.variant_labels

    for (const key in VARIANTS) {
        const newKey = VARIANTS[key].id
        const baseValue = VARIANTS[key].values[0]

        console.log(`Key: ${newKey} ---- Value: ${baseValue}`)

        // if (baseValue.hasOwnProperty("image")) {
        //     console.log(`${newKey} decides render`)
        // }

        productState[newKey] = baseValue
    }
    
    console.log("Variants: ", VARIANTS)

    console.log("Product State --> ", productState)

    return productState
}

/*
------------------------------ ONLY USED IF WE WANT TO IMPLEMENT POPUP --------------------------------

chrome.storage.local.get('productCache').then(async (result) => {
    console.log("PRODUCT: ", result.productCache)
    let finalProduct;

    const checkoutSessionID = await chrome.storage.local.get('checkoutID')
    const currentUrl = await chrome.storage.local.get('lastUrlScraped')

    console.log("currentUrl", currentUrl)
    console.log("chekoutID", checkoutSessionID)

    if (result.productCache != undefined) {
        

        finalProduct = result.productCache

    }

    const rootElement = document.createElement('div')

    document.body.appendChild(rootElement)
    const root = ReactDOM.createRoot(rootElement)   
    

    root.render(<><ChromeApp product={finalProduct} checkoutID={checkoutSessionID['checkoutID']} url={currentUrl['lastUrlScraped']}/></>)
    chrome.storage.local.remove('productCache')


})
*/
