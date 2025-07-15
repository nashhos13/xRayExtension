// TODO: content script
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as cheerio from 'cheerio'
import './contentScript.css';


function imageScraper() {
    var products = []

    // Query all Product Images
    const images = Array.from(document.querySelectorAll('img'))
    .filter(img => {
    const { width, height } = img.getBoundingClientRect();
    return width > 100 && height > 100 && img.offsetParent !== null;
    })
    
    .map(img => img);

    images.forEach((img) => {
        const product = {
            element: img, // HTML IMG RAW ELEMENT
            image: img.src, // image link
            name: null, // product name
            price: null, // product price
            description: null, // product description
        }

        products.push(product)
    })
    
    return products // Array of products

}

function getShopifyProduct() {
    var possibleProducts = []
    const mainTags = document.getElementsByTagName("main")

    if (mainTags.length > 0) {
        const mainElement = mainTags[0]

        const mainSections = mainElement.getElementsByClassName("shopify-section")

        // SAFEGUARD 1
        if (!mainSections || !(mainSections.length > 0)) {
            const likelyProductSections = Array.from(mainElement.querySelectorAll("div, section"))
            console.log("DATA LABEL: ", likelyProductSections)

            likelyProductSections.forEach(section => {
                const label = section.getAttribute("data-label")
                if (label == "Product" || label == "product") {
                    possibleProducts.push(section)
                }
            })

            if (possibleProducts.length > 0) {
                if (possibleProducts[0] instanceof HTMLElement) {
                    console.log("Possibly??? ", possibleProducts[0])
                    return possibleProducts[0]
                }
            }
        }

        // BASE CASE
        const sectionsArray = Array.from(mainSections)
        var mainProduct = sectionsArray[0]
        sectionsArray.forEach(section => {
            if (section.id.includes('main')) {
                mainProduct = section
            }
        })
        
        // console.log("USED: ", mainProduct)
        if (mainProduct instanceof HTMLElement) {
            return mainProduct
        }
    }
}

function shopifyProductImageScraper(product) {
    
    const mainProduct = getShopifyProduct() // Main product section found???

    if (mainProduct) {
        // console.log("MAIN: ", mainProduct)

        const productImagesFULL = Array.from(mainProduct.querySelectorAll("img"))

        const sectionImages = Array.from(mainProduct.querySelectorAll("img"))
        var relevantImages = []

        sectionImages.forEach(img => {
            if (img.height > 100 && img.width > 100) {
                relevantImages.push(img)
            }
        })

        const productImages = relevantImages.map((img) => ({
            element: img,
            src: img.src,
            currentSrc: img.currentSrc,
            alt: img.alt
        }))

        product.images = productImages // SET PRODUCT IMAGES
        for (var i = 0; i < productImages.length; i++) {
            if (productImages[i].alt != '') {
                product.title = productImages[i].alt
                break
            }
        }

        console.log("Product Images", product.images)

        // Query title for MAIN ELEMENT

        if (!product.title || product.title == '') {
            
            product.title = '' // Safeguard

            const queriedTitleElements = Array.from(mainProduct.querySelectorAll('[class*="title"]')) 
            console.log("Image TITLES: ", queriedTitleElements)
            if ( queriedTitleElements && queriedTitleElements.length > 0) {
                queriedTitleElements.forEach(e => {
                    const title = e.textContent
                    const match = title.match(/^\s*([\w\s\-,&]+?)\s*$/m) 
                    const foundTitle = match ? match[1].trim() : null

                    if (foundTitle && product.title == '') {
                        product.title = foundTitle
                        console.log("TITLE FOUND: ", foundTitle)
                    }

                })
            }

        }

        return product
    } else {
        const allImages = Array.from(document.querySelectorAll("img"))
        var likelyProductImages = []

        allImages.forEach(img => {
            if (img.width >= 200 && img.height >= 200){
                likelyProductImages.push(img)
            }
        })

        const cleanedProductImages = likelyProductImages.map((img) => ({
            element: img,
            src: img.src,
            currentSrc: img.currentSrc,
            alt: img.alt
        }))

        // console.log("Product IMages? ", cleanedProductImages)

        product.images = cleanedProductImages

        // Query title for entire page (rough attempt) ???

    }
}

function shopifyProductDescriptionScraper(product) {

    const mainProduct = getShopifyProduct() // Main product section found???

    if (mainProduct) {
        var descriptionArray = []
        const allProductElements = Array.from(mainProduct.querySelectorAll('span, p'))

        for (var i = 0; i < allProductElements.length; i++) {
            const textContent = allProductElements[i].textContent
            const letterArray = textContent.match(/[a-zA-Z]/g)

            if (letterArray) {
                const letterCount = letterArray.length

                if (letterCount > 75) {
                    // console.log("error")
                    // console.log(textContent)
                    descriptionArray.push(textContent)
                }
            }

        }

        product.description = descriptionArray[0]

    }

}

function shopifyProductPriceScraper(product) {

    const mainProduct = getShopifyProduct() // Main product section found???

    if (mainProduct) {
        const productPrice = Array.from(mainProduct.querySelectorAll('[data-product-price]'))
        if (productPrice.length > 0) {
            for (var i = 0; i < productPrice.length; i++) {
                
                const foundPrice = productPrice[i].textContent.match(/\$\d+(?:\.\d{2})?/g)
                foundPrice.forEach((PRICE) => {
                    if ( !(product.price.includes(PRICE)) ) {
                            product.price.push(PRICE)
                        }
                })
            }
        } else {

            console.log("Main? ", mainProduct)

            const productPrices = Array.from(mainProduct.querySelectorAll('[class*="price"]'))
            console.log("Prices found?? ", productPrices)
            for (var i = 0; i < productPrices.length; i++) {

                const priceItem = productPrices[i].textContent
                const foundPrice = priceItem.match(/\$\d+(?:\.\d{2})?/g)

                // console.log("found price: ", foundPrice, " AND ", foundPrice.length)
                // console.log("price item: ", priceItem,  " AND ", priceItem.length )

                if (priceItem && foundPrice && foundPrice.length > 0) {

                    console.log(foundPrice)
                    foundPrice.forEach((PRICE) => {
                        // console.log("Price?  --> ", PRICE)
                        if ( !(product.price.includes(PRICE)) ) {
                            product.price.push(PRICE)
                        }
        
                    })

                }
            }
        }
    } else productPriceScraper(product)

}

function productNameScraper(product) {
    
    if (product.element.alt && product.element.alt != '') {
        product.name = product.element.alt
    } else {

        // Query Product Names
        var currentOldestElement = product.element.parentElement
        var nameMatch = null
        const regex = /\b(?:[A-Z][\w']+|\d{2,4})(?:\s+(?:[A-Z][\w']+|\d{2,4})){1,9}/g
        const maxDepth = 100;
        let depth = 0;

        while (!nameMatch && currentOldestElement && depth < maxDepth) {

            // console.log(currentOldestElement?.textContent)

            if (isVisible(currentOldestElement)) {

                const cleanedText = currentOldestElement.textContent.replace(/([a-z])([A-Z])/g, '$1 $2');

                const matches = [...cleanedText.matchAll(regex)];
                const matchedTitles = matches.map(m => m[0]); // array of match strings
            
                if (matchedTitles.length > 0) {
                    nameMatch = matchedTitles
                    break
                }
            
                currentOldestElement = currentOldestElement.parentElement
            }

            depth++
        }  

        product.name = nameMatch
    }

}

function productPriceScraper(product) {
    const regex = /\$[0-9][0-9]*(\.[0-9]{2})?/
    // Query Product prices
    var currentOldestElement = product.images[0]['element'].parentElement
    var priceMatch = null
    var elementTraversal = 0

    while (!priceMatch && currentOldestElement && elementTraversal < 5) {

        // const allMatches = [...currentOldestElement.textContent.matchAll(regex)]
        // const allPrices = allMatches.map(p => p[0])
        
        const match = currentOldestElement.textContent.match(regex)
    
        if (match) {
            priceMatch = match[0]
            break
        }
    
        currentOldestElement = currentOldestElement.parentElement
        elementTraversal++

    }   

    product.price.push(priceMatch)

}

function productDescriptionScraper(product) {

}

export default function productScraper(product /* html 'img' element */) {

}

function isVisible(element) {
  const style = window.getComputedStyle(element);
  
  return (
    style &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetHeight > 0 &&
    element.offsetWidth > 0
  );
}

/* -------------------------------------------------------------- */
chrome.runtime.onMessage.addListener((message) => {
    console.log("Message received: ", message)
})

var products = imageScraper()
// products.forEach((product) => {
//     productPriceScraper(product)
//     productNameScraper(product)
// })

// console.log(products)
var product = {
    price: [],
    images: [],
    title: null,
    description: null,
}

shopifyProductImageScraper(product)
shopifyProductDescriptionScraper(product)
shopifyProductPriceScraper(product)
console.log("Final Product: ", product)


chrome.runtime.sendMessage(product, (res) => {
    console.log("response from background: ", res)
})
