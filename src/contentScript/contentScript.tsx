// TODO: content script
import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ChromeApp } from '../popup/popup';
import './contentScript.css';

// Where scraped product is stored
var productCache = {
             userID: null,
                url: null,
               type: null,
              price: [],
             images: [],
              title: null,
       descriptions: [],
        techDetails: [],
    techDescription: []
}

// Constants for Injected Button -------|
const TARGET_TEXT       = "SCAN"
const CYCLES_PER_LETTER = 2
const SHUFFLE_TIME      = 100
const CHARS             = "!@#$%^&*():{};|,.<>/?" 

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        chrome.runtime.sendMessage({ message: 'Abort Fetch', payload: {} }, (res) => {
            console.log("ABORT?", res)
        });
    }
})

function isValidRequest(request: any): request is {status: string, message: string}  {

    const validStatus = new Set(["Success", "Failed"])
    // const validMessage = new Set(["Scan Complete", "Send To Xray", "Update Button", "User Activated", "User ID Not Received" ])

    return (
        request &&
        typeof request.status === 'string' &&
        typeof request.message === 'string' &&
        validStatus.has(request.status)
    )
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    (async () => {

        const activeButton = document.getElementById('activeScanner')
        const inactiveButton = document.getElementById('inactiveScanner')

        const validRequest = isValidRequest(request)

        if (!validRequest) {
            console.log("Unknown Request: ", request)
        }

        // Check Message 
        console.log("Action from background:", request)

        // Handle Messages from background script
        if (request.message === "Scan Complete") {

            console.log("GO HERE")

            await chrome.storage.local.set({
                scanComplete: true
            })

            if (activeButton) activeButton.click() // Trigger handler for scan button

            const { productCache, checkoutID, lastUrlScraped } = await chrome.storage.local.get([
                'productCache',
                'checkoutID',
                'lastUrlScraped'
            ]);

            injectFoundProduct(productCache, lastUrlScraped, checkoutID)

        } else if (request.message === 'Send To Xray') {

            injectFoundProduct(null, null, null)

        } else if (request.message === 'Update Button') {

            console.log("doing this")
            if (inactiveButton) inactiveButton.click()

        } else if (request.message === 'Timeout During Request') {
            
            if (activeButton) activeButton.click()

        } 

        sendResponse({message: "Acknowledged", payload: {}})

    })();

    return true

});

// -------------------------------------------------- Helper Functions --------------------------------------

// Protect from malicious strings
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  // Normalize input
  let sanitized = input.trim();

  // Remove dangerous characters and patterns
  sanitized = sanitized
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
    .replace(/[\u202E\u202D\u202A\u202B\u202C\u2066-\u2069]/g, '') // Unicode directionals
    .replace(/<script.*?>.*?<\/script>/gi, '') // Script tags
    .replace(/<\/?[^>]+(>|$)/g, '') // HTML tags
    .replace(/["'`\\]/g, '') // Quotes and escape characters
    .replace(/(javascript:|data:|vbscript:)/gi, '') // Dangerous protocols
    .replace(/[\r\n\t]/g, ' ') // Normalize whitespace
    .replace(/\s{2,}/g, ' '); // Collapse multiple spaces

  // Encode remaining special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return sanitized;
}

function isSafeUrl(url) {
  try {
    const parsed = new URL(url, location.href);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function santizeProductCache(raw) {
    return {
        userID: sanitizeInput(raw.userID || ''),
        url: isSafeUrl(raw.url || '') ? sanitizeInput(raw.url) : '',
        type: sanitizeInput(raw.type || ''),
        price: Array.isArray(raw.price)
        ? raw.price.map(p => sanitizeInput(p))
        : [],
        images: Array.isArray(raw.images)
        ? raw.images.map(img => {
            return {
                src: isSafeUrl(img?.src || '') ? sanitizeInput(img.src) : '',
                alt: sanitizeInput(img?.alt || ''),
                currentSrc: isSafeUrl(img?.currentSrc || '') ? sanitizeInput(img.currentSrc) : '',
                lazySrc: isSafeUrl(img?.lazySrc || '') ? sanitizeInput(img.lazySrc) : ''
            };
            })
        : [],
        title: sanitizeInput(raw.title || ''),
        descriptions: Array.isArray(raw.descriptions)
        ? raw.descriptions.map(d => sanitizeInput(d))
        : [],
        techDetails: Array.isArray(raw.techDetails)
        ? raw.techDetails.map(d => sanitizeInput(d))
        : [],
        techDescription: Array.isArray(raw.techDescription)
        ? raw.techDescription.map(d => sanitizeInput(d))
        : []
    };

}



// Handle Shopify Img objects (what attribute does the image come from)
function setShopifyImageLink(image) {
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

// Verify for element in local storage
function checkUserKey(key) {

    return chrome.storage.local.get([key]).then((result) => {
        return result[key] === true
    }) 

}

function injectFoundProduct(productCache, currentUrl, currentCheckoutID) {

    // Remove any previously injected product container
    const existing = document.getElementById('found-product');
    if (existing) {
        existing.remove(); // or existing.parentNode.removeChild(existing);
    }

    // Define location of injected product div --- used when a produt match is found

    console.log("product -> ", productCache)
    console.log("url -> ", currentUrl)
    console.log("session id -> ", currentCheckoutID)


        const container                 = document.createElement('div')
        container.id                    = 'found-product'
        container.style.position        = 'fixed'
        container.style.background      = 'radial-gradient(100% 60% at 50% 0%, rgb(231, 243, 255) 0%, rgb(227, 231, 255) 1124%, rgb(243, 235, 253) 90%, rgb(252, 253, 255) 100%) no-repeat fixed, linear-gradient(rgb(229, 242, 250) 0%, rgb(250, 249, 254) 100%)'
        container.style.top             = '185px'
        container.style.right           = '25px'
        container.style.zIndex          = '9999'
        container.style.backgroundColor = 'white'

        document.body.appendChild(container)
        const root = createRoot(container)

        // imported component from 'popup.tsx'
        root.render(<ChromeApp product={productCache} checkoutID={currentCheckoutID} url={currentUrl}/>)

}


// WILL NEED TO EXPAND
function lazyLoadedImageScraper(productImages) {

    // pulling images that don't originate from img.src
    productImages.forEach(img => {

        const srcset   = img.element.getAttribute('data-src')
        const imgWidth = img.element.getAttribute('data-widths')

        if (!srcset || !imgWidth ) {
            return productImages
        }

        // Very Specific product img profile (Not going to work for all shopify products)
        // URL's were formatted as 'https://domain.com/{width}' in the srcset
        const queriedSize       = "460"
        const imgSizeIndexStart = imgWidth.search(queriedSize)
        const imgSizeIndexEnd   = imgSizeIndexStart + (queriedSize.length)
        const imgSize           = imgWidth.slice(imgSizeIndexStart, imgSizeIndexEnd)

        var fullImgSrc = srcset.replace("{width}", imgSize)                 

        if (fullImgSrc.startsWith('//')) {
            fullImgSrc = 'https:' + fullImgSrc
        } else {
            console.log("---- EXPAND LAZY LOAD ----")
        }

        img.lazySrc = fullImgSrc
        // -------------------------------------------------------------------------
    })

    return productImages

}

// Base case price scraper (If other one doesn't work)
function productPriceScraper(productCache) {

    // Current Price Regex
    const regex              = /\$[0-9][0-9]*(\.[0-9]{2})?/
    // Query parent closest to product images
    var currentOldestElement = productCache.images[0]['element'].parentElement
    var priceMatch           = null
    var elementTraversal     = 0

    // while price isn't found, the current element is valid, and haven't done 20 iterations
    while (!priceMatch && currentOldestElement && elementTraversal < 20) {
        
        const match = currentOldestElement.textContent.match(regex)
        
        if (match) {
            priceMatch = match[0]
            break
        }
    
        // continue going up the DOM hierarchy until a price is found
        currentOldestElement = currentOldestElement.parentElement
        elementTraversal++

    }   

    productCache.price.push(priceMatch)

}

// Base case product div finder
function findLikelyProductDiv() {

    var likelyProductElement = null

    // Predicted size dimensions of product div
    const allElements        = Array.from(document.querySelectorAll("div, section"))
    const minWidth           = 700
    const minHeight          = 700
    const maxWidth           = 6000
    const maxHeight          = 6000

    // Find largest div / section on the page -- product is likely in there
    allElements.forEach(e => {
        if (e.clientWidth >= minWidth && e.clientHeight >= minHeight 
            && e.clientWidth < maxWidth && e.clientHeight < maxHeight) {
                if (!likelyProductElement) {
                    console.log("Initail: ", e)
                    likelyProductElement = e
                } else {
                    if (e.clientHeight > likelyProductElement) {
                        console.log("Different? ", e)
                        likelyProductElement = e
                    }
                }
        }
    })

    // Ensure it is a valid element
    if (likelyProductElement instanceof HTMLElement) return likelyProductElement
    else return null
}

// -------------------------------------------------- Shopify Functions --------------------------------------

// Find product section
function getShopifyProduct() {

    // list of product divs
    var possibleProducts = []

    // Attempt to climb the 'shopify' DOM architecture
    const mainTags = document.getElementsByTagName("main")

    // if 'main' is real, do shopify querying --> otherwise do findLikelyProductDiv()
    if (mainTags.length > 0) {

        // Find first shopify-section element, almost always contains product
        const mainElement     = mainTags[0]
        if (!(mainElement instanceof HTMLElement)) return findLikelyProductDiv();

        const shopifySections = mainElement.getElementsByClassName("shopify-section")

        // Ensure shopifySections isnt NULL
        if ( !shopifySections || !(shopifySections.length > 0) ) {

            const likelyProductSections = Array.from(mainElement.querySelectorAll("div, section"))
            console.log("DATA LABEL: ", likelyProductSections)

            // Find possible product based on attribute name OR size of the element
            likelyProductSections.forEach(section => {
                const label = section.getAttribute("data-label")
           
                if (label == "Product" || label == "product") {
                    possibleProducts.push(section)
                } else if (section.clientHeight >= 700 && section.clientWidth >= 700) {
                    console.log(`Element: ${section}`, `Width: ${section.clientWidth}`, `Height: ${section.clientHeight}`)
                    possibleProducts.push(section)
                }
            })

            if (possibleProducts.length > 0) {

                // Ensure that there is a valid html element
                if (possibleProducts[0] instanceof HTMLElement) {
                    console.log("Possibly??? ", possibleProducts[0])
                    return possibleProducts[0]
                }

            }

        }

        // If "shopify-section" Exists
        const sectionsArray = Array.from(shopifySections)
        var mainProduct     = sectionsArray[0] // Set base product

        // update mainProduct
        sectionsArray.forEach(section => {
            if (section.id && section.id.includes('main')) {
                mainProduct = section
            }
        })
        
        // Ensure valid html element
        if (mainProduct instanceof HTMLElement) {
            console.log("MAIN PRODUCT: ", mainProduct)
            return mainProduct
        }
    } // MAY ADD MORE CONDITIONS
    
    else {

       return findLikelyProductDiv()

    }
}

// Find product images
function shopifyProductImageScraper(productCache) {
    
    // Used found product section
    const mainProduct = getShopifyProduct() // Main product section found???

    if (mainProduct) {

        const sectionImages = Array.from(mainProduct.querySelectorAll("img"))
        var relevantImages  = []

        // Only scrap images larger than a certain size
        sectionImages.forEach(img => {
            if (img.height > 75 && img.width > 75) {

                const tooWide = (img.width / img.height >= 2)
                const tooTall = (img.height / img.width >= 2)

                if (!tooWide && !tooTall) { relevantImages.push(img) }

            }
        })

        // Set image objects for later development
        const productImages = relevantImages
        .filter(img => img instanceof HTMLImageElement)
        .map((img) => ({
               element: img,
                   src: img.src || '',
            currentSrc: img.currentSrc || '',
                   alt: img.alt || '',
               lazySrc: null
        }))
        

        // SET PRODUCT IMAGES

       let imagesToSend = []

       // Image Development
        let filteredImages = lazyLoadedImageScraper(productImages)

        filteredImages.forEach(img => {
            const finalImage = setShopifyImageLink(img)
            imagesToSend.push(finalImage)
        })

        productCache.images = imagesToSend
        
        

        for (var i = 0; i < productImages.length; i++) {

            // SET PRODUCT TITLE -- if in one of the img elements
            if (productImages[i].alt != '') {
                productCache.title = productImages[i].alt
                break
            }

        }

        // Query product title -- if not found yet
        if (!productCache.title || productCache.title === '') {
            
            productCache.title = '' // Safeguard

            const queriedTitleElements = Array.from(mainProduct.querySelectorAll('[class*="title"]')) 
           
            if ( queriedTitleElements && queriedTitleElements.length > 0) {
                queriedTitleElements.forEach(e => {

                    const rawText    = e.textContent || ''
                    const title      = sanitizeInput(rawText)
                    const match      = title.match(/^\s*([\w\s\-,&]+?)\s*$/m) // Check for title pattern
                    const foundTitle = match ? match[1].trim() : null

                    if (foundTitle && productCache.title === '') {
                        productCache.title = sanitizeInput(foundTitle)
                    }

                })
            }

        }

        return productCache 

    } else { // No main shopify section
        
        const allImages = Array.from(document.querySelectorAll("img"))
        var likelyProductImages = []

        allImages.forEach(img => {
            if (img.width >= 75 && img.height >= 75) {

                const tooWide = (img.width / img.height >= 2)
                const tooTall = (img.height / img.width >= 2)

                if (!tooWide && !tooTall) likelyProductImages.push(img)

            }
        })

        const cleanedProductImages = likelyProductImages.map((img) => ({
               element: img,
                   src: img.src,
            currentSrc: img.currentSrc,
                   alt: img.alt,
               lazySrc: null
        }))

        productCache.images = cleanedProductImages

        // Query title for entire page (rough attempt) ???

    }
}

// Find product description and title
function shopifyProductTextScraper(productCache) {

    const mainProduct = getShopifyProduct() // Main product section found???
    
    var allElements
    var descriptionArray = []
    
    if (mainProduct) {    
        allElements = Array.from(mainProduct.querySelectorAll('span, p')) // More narrow search
    } else {
        allElements = Array.from(document.querySelectorAll('span, p'))
    }

    for (var i = 0; i < allElements.length; i++) {

        const textContent = allElements[i].textContent
        const letterArray = textContent.match(/[a-zA-Z]/g) // Get all text matches from the div

        if (letterArray) {
            const letterCount = letterArray.length

            if (letterCount > 20) {
                descriptionArray.push(textContent) // Only want longer text strings (For descriptions)
            }
        }

    }

    productCache.descriptions = descriptionArray

}

// Find product price
function shopifyProductPriceScraper(productCache) {

    const mainProduct = getShopifyProduct() // Main product section found???

    if (mainProduct) {
        
        // Attempt to find accurate price div
        const productPrice = Array.from(mainProduct.querySelectorAll('[data-product-price]'))

        if (productPrice.length > 0) {

            for (var i = 0; i < productPrice.length; i++) {
                
                const foundPrice = productPrice[i].textContent.match(/\$\d+(?:\.\d{2})?/g)

                // Push all associated prices
                foundPrice.forEach((PRICE) => {
                    if ( !(productCache.price.includes(PRICE)) ) {
                            productCache.price.push(PRICE)
                        }
                })

            }

        } else {

            // Attempt to find LIKELY price div
            const productPrices = Array.from(mainProduct.querySelectorAll('[class*=price]'))

            for (var i = 0; i < productPrices.length; i++) {

                const priceItem  = productPrices[i].textContent
                const foundPrice = priceItem.match(/\$\s?\d+(?:\.\d{2})?/g)
                var trimmedPrice = null

                if (priceItem && foundPrice && foundPrice.length > 0) {

                    foundPrice.forEach((PRICE) => {
                        
                        // Remove extra spaces from each queried prices
                        trimmedPrice = PRICE.replace(/\$\s*(\d+(?:\.\d{2})?)/, "$$$1")
                        
                        if ( !(productCache.price.includes(trimmedPrice)) ) {
                            productCache.price.push(trimmedPrice)
                        }
        
                    })

                }
            }
        }
    } else { // Base scrape if no shopify section found

        productPriceScraper(productCache)

    }

}

// Scrape shopify product page
function doShopifyScrape(productCache) {

    shopifyProductImageScraper(productCache)
    shopifyProductTextScraper(productCache)
    shopifyProductPriceScraper(productCache)

}

// -------------------------------------------------- Amazon Functions --------------------------------------

function getAmazonProduct() {

    // Follow amazon hierarchy
    const amazonProduct = document.getElementById("ppd")

    if (amazonProduct instanceof HTMLElement) return amazonProduct
    else return null

}

function amazonProductImageScraper(productCache) {

    // Find all relevent product images
    const leftProductColumn = document.querySelector("#leftCol")
    const tempImages        = Array.from(leftProductColumn.querySelectorAll("img"))
    
    tempImages.forEach(img => {
    
        if (img.clientHeight > 20) {

            // May have to update -- For now most amazon product images follow this format
            let largerImg = img.src.replace(/AC_US\d+/g, "AC_US500")
            productCache.images.push(largerImg)

        }
    })

}

function amazonProductTextScraper(productCache) {

    const centerProductColumn = document.querySelector("#centerCol")

    // ----------------------------------------- Title Scrape ----------------------------------
    const titles = Array.from(document.querySelectorAll('span[id*=title], span[id*=Title]'))

    if (titles.length == 1) {

        productCache.title = titles[0].textContent.trim()

    } else if (titles.length > 1) {

        // Find the title div
        var largestText = titles[0]
        titles.forEach((t) => {

            if (t.id.includes("product") || t.id.includes("Product")) {

                if (!productCache.title) {
                    productCache.title = t.textContent.trim()
                }

            }

            if (t.clientHeight > largestText.clientHeight) {
                largestText = t
            }

        })

        // Choose largest font text as title if title still empty
        if (!productCache.title) {
            productCache.title = largestText.textContent.trim()
        }
    }
    // -----------------------------------------------------------------------------------------
    

    // ------------------------------------------ Description Scrape ---------------------------

    var descriptionArray     = []

    // All possible descriptor texts
    const conciseDescriptors = centerProductColumn.querySelectorAll("div[id*=bullets], div[id*=Bullets], div[id*=overview], div[id*=Overview], div[id*=facts], div[id*=Facts]")

    // if no descriptor elements --> query entire page 
    // Most (if not all) text on amazon pages are in 'span' elements
    if (conciseDescriptors.length == 0) {
 
        const allText = Array.from(centerProductColumn.querySelectorAll("span"))

        allText.forEach((text) => {
            const trimmedText = text.textContent.trim()
            if (!descriptionArray.includes(trimmedText)) {
                descriptionArray.push(trimmedText)
            }
        })

    } else {
        conciseDescriptors.forEach((section) => {
            const text = Array.from(section.querySelectorAll("span")) 
            text.forEach((t) => {
                const trimmedText = t.textContent.trim()
                if(!descriptionArray.includes(trimmedText)) {
                    descriptionArray.push(trimmedText)
                }
            })
        })
    }

    productCache.descriptions = descriptionArray

    // -------------------------------------------------------------------------------------------

    // ---------------------------------------- Product Technical Details --------------------
    
    var productTechnicalDetails = []

    // Not always present
    const technicalDetailsElement = document.querySelector("#productDetails_feature_div")
    
    if (technicalDetailsElement) {
        const detailElements = Array.from(technicalDetailsElement.querySelectorAll("tr"))

        // Table Elements to send to XRay
        detailElements.forEach(detail => {

            const key       = detail.querySelector("th").textContent
            const value     = detail.querySelector("td").textContent
            const newDetail = {[key]: value}

            if (key != "Customer Reviews") {
                productTechnicalDetails.push(newDetail)
            }

        })

        productCache.techDetails = productTechnicalDetails
    }
    // -------------------------------------------------------------------------------------------

    // ---------------------------------------- Product Technical Description -----------------

    var productTechnicalDescription = []

    // Not always present
    const technicalDescriptionElement = document.querySelector("#productDescription_feature_div")
   
    if (technicalDescriptionElement) {
        const technicalDescriptions = Array.from(technicalDescriptionElement.querySelectorAll("span"))

        technicalDescriptions.forEach(d => {
            productTechnicalDescription.push(d.textContent)
        })

        productCache.techDescription = productTechnicalDescription.join(" -- ")
    }
    // -------------------------------------------------------------------------------------------


}

function amazonProductPriceScraper(productCache) {

    var priceArray            = []
    
    // Find price div 
    const centerProductColumn = document.querySelector("#centerCol")
    const allPrices           = centerProductColumn.querySelectorAll("span[id*=price], span[id*=Price], span[id*=pricing], span[id*=pricing], span[class*=price], span[class*=Price], span[class*=pricing], span[class*=Pricing], span[class*=offscreen]")

    // All prices (current, old, bulk)
    allPrices.forEach((span) => {
        const price = span.textContent.match(/\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/);
        if (price && !(priceArray.includes(price[0]))) {
            priceArray.push(price[0])
        }
    })
    
    productCache.price = priceArray
    
}

function doAmazonScrape(productCache) {

    if (productCache.type == 'Amazon') {

        amazonProductImageScraper(productCache)
        amazonProductTextScraper(productCache)
        amazonProductPriceScraper(productCache)

    } else { 
        console.log("Error: Could not locate Amazon product")
    }

}

function sendProductCacheToAll(productCache) {
    console.log("Final Product HERE: ", productCache)
    
    // Send product to ALL chrome extension units
    chrome.runtime.sendMessage({message: "Product Request", payload: productCache}, (res) => {
        console.log("response from background: ", res)
    })

}

function checkForSignUp(userAction) {

    // See if user has access to resctricted URL -- If so, set local storage variable to allow use of extension
    const currentUrl = window.location.href;
    console.log("Current page URL: ", currentUrl)

    if (currentUrl === 'https://tryxray.ai/home') {
        console.log('TRUE')
        chrome.runtime.sendMessage({message: "Signed Up", payload: {}})

    } else {
        chrome.runtime.sendMessage({message: userAction, payload: {}})
    }
}

// Scrape the product page
async function scrapeAfterLoad(productCache) {

    const currentUrl = window.location.href

    chrome.storage.local.set({
        lastUrlScraped: currentUrl
    })

    console.log("ON SITE")

    const validUser = await checkUserKey("xRayCertified") // Set when user accesses restricted url above ^

    // Only scrape if valid user
    if (validUser) {
        setTimeout(() => {

            // Start Scrape for valid users ONLY
            console.log("starting scrape")
            productCache.url = document.URL

            if (productCache.type === 'Amazon') {
                
                console.log("Amazon Product---")
                doAmazonScrape(productCache)

                santizeProductCache(productCache)

                sendProductCacheToAll(productCache)

            } else {
 
                console.log("Shopify Product---")
                doShopifyScrape(productCache)

                santizeProductCache(productCache)

                sendProductCacheToAll(productCache)
                
            }


        }, 2000) // wait for page to load before scrape
    } else {

        checkForSignUp("Invalid Scan Attempt")

    }

} 



// Injected Scan button
function Scanner({ product, buttonID }) {
    const [scanStatus, setScanStatus] = useState('notScanning')
    const [buttonStatus, setButtonStatus] = useState(buttonID)

    // Scanning button click() handler
    const clickHandler = () => {
        
        chrome.storage.local.get('scanComplete').then((result) => {
            if (result && result.scanComplete === true) {

                chrome.storage.local.get('productCache').then((result) => {

                    if (!result || Object.keys(result).length === 0) {
                        console.log("Timeout")
                        setScanStatus('timeOut')
                    } else if (result.productCache.matched_product_title) {
                        console.log("Matched")
                        setScanStatus('match')
                    } else {
                        console.log("No Match")
                        setScanStatus('noMatch')
                    }
                })

                chrome.storage.local.remove('scanComplete')
            }
        })
        
    }

    const tryAgain = () => {
        injectFoundProduct(null, null, null)
        setScanStatus('notScanning')
    }

    let button;
    if (scanStatus === 'notScanning') {
        // Specific button style with animation
        button = <AnimateButton WORDS={TARGET_TEXT} setScanStatus={setScanStatus} setButtonStatus={setButtonStatus} productCache={product} buttonStyle={buttonStatus}/>

    } else if (scanStatus === 'scanning') {
        button = <div>
            <h1 id='stayOnPageBox'></h1>
            <span id='stayOnPageMessage'>Please Do Not Leave Page!!!</span>
            <div id='stayOnPageQuoteBox'></div>
            <button id={buttonStatus} className='productLoading' onClick={() => clickHandler()}>
                <span style={{fontSize: '1.2em'}}>X</span>
            </button>
        </div>

    } else if (scanStatus === 'match') {
        button = <div>
            <button id='matchFoundScanner' className='Match'>MATCH!</button>
            <button id='tryAgain' onClick={() =>{tryAgain()}}>Try Again</button>
        </div>

    } else if (scanStatus === 'noMatch') {
        button = <div>
            <h1 id='matchNotFoundBox'></h1>
            <span id='matchNotFoundMessage'>Match Not Found</span>
            <div id='matchNotFoundQuoteBox'></div>
            <button id='matchNotFoundScanner' className='noMatch' onClick={() => {setScanStatus('notScanning')}}>Try Again</button>
        </div>
    
    } else if(scanStatus === 'timeOut') {
        button = <div>
            <h1 id='timeOutBox'></h1>
            <span id='timeOutMessage'>Something Went Wrong</span>
            <div id='timeOutQuoteBox'></div>
            <button id='timeOutScanner' className='timeOut' onClick={() => {setScanStatus('notScanning')}}>Try Again</button>
        </div>

    }

    return <>{button}</>
}

// SCAN BUTTON LOGIC --------------------------------------------------------------------------------------   

function AnimateButton({WORDS, setScanStatus, setButtonStatus, productCache, buttonStyle}) {
    const interval = useRef(null)

    const [text, setText] = useState(TARGET_TEXT)

    // Word scramble animation on button hover
    const scramble = () => {
        let pos = 0;

        interval.current = setInterval(() => {
            const scrambled = WORDS.split("")
            .map((char, index) => {
                if (pos / CYCLES_PER_LETTER > index) {
                    return char
                } 

                const randomCharIndex = Math.floor(Math.random() * CHARS.length);
                const randomChar = CHARS[randomCharIndex];

                return randomChar

            })
            .join("")

            setText(scrambled)
            pos++

            if (pos >= TARGET_TEXT.length) {
                stopScramble()
            }

        }, SHUFFLE_TIME)

    }

    const stopScramble = () => {
        clearInterval(interval.current || undefined)
        setText(WORDS)
    }

    // Initiate Product Scan upon click (IF Certified User) --> change button status
    const waitForResponse = () => {

        console.log("Checking scan")

        chrome.storage.local.get('xRayCertified').then((result) => {
            if (result.xRayCertified === true) {

                setButtonStatus('activeScanner')

                if (productCache.type != null) {
                    setScanStatus('scanning')
                }
            }
        })
        scrapeAfterLoad(productCache)

    }

    return (
        <button 
            id={buttonStyle}
            onMouseEnter={scramble} 
            onMouseLeave={stopScramble}
            onClick={() => waitForResponse()}
        >
            <div>
                <span style={{justifyContent: 'center'}}>{text}</span>
            </div>

        </button>
    )

}

function renderScanner(productCache) {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = createRoot(container);

    chrome.storage.local.get('xRayCertified').then((result) => {
        if (!result.xRayCertified || result.xRayCertified === false) {
            root.render(<Scanner product={productCache} buttonID={'inactiveScanner'} />);
        } else {
            root.render(<Scanner product={productCache} buttonID={'activeScanner'} />);
        }
    })

    // chrome.storage.local.clear()
    
}

// --------------------------------------------------------------------------------------------------------------

// --------------------------- Scraping Hierarchy ---------------------
// Ensure Local Product Cache is NULL
chrome.storage.local.remove('productCache').then(() => {


    // Check For Amazon Domain
    const hasAmazonUrl = (window.location.href).includes("amazon")
    if (hasAmazonUrl) {
        productCache.type = 'Amazon'
    }

    // Check For Shopify Domain
    if (!productCache.type) {
        const hasShopifyId = [...document.querySelectorAll('[id]')].some(el => 
            el.id.includes('shopify')
        );

        if (hasShopifyId) {
            productCache.type = 'Shopify'
        }
    }

    const onXrayHomePage = window.location.href

    if (productCache.type != null) {
        renderScanner(productCache)

    } else if (onXrayHomePage.includes("tryxray.ai")) {
        renderScanner(productCache)
        checkForSignUp("Invalid User")

    }

})


