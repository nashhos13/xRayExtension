import { ProductCache } from '../types';

export function getAmazonProduct(): HTMLElement | null {
    const amazonProduct = document.getElementById("ppd");
    if (amazonProduct instanceof HTMLElement) return amazonProduct;
    else return null;
}

export function amazonProductImageScraper(productCache: ProductCache): void {
    const leftProductColumn = document.querySelector("#leftCol");
    const tempImages = Array.from(leftProductColumn.querySelectorAll("img"));
    
    tempImages.forEach(img => {
        if (img.clientHeight > 20) {
            let largerImg = img.src.replace(/AC_US\d+/g, "AC_US500");
            productCache.images.push(largerImg);
        }
    });
}

export function amazonProductTextScraper(productCache: ProductCache): void {
    const centerProductColumn = document.querySelector("#centerCol");

    // Title Scraping
    const titles = Array.from(document.querySelectorAll('span[id*=title], span[id*=Title]'));

    if (titles.length == 1) {
        productCache.title = titles[0].textContent.trim();
    } else if (titles.length > 1) {
        var largestText = titles[0];
        titles.forEach((t) => {
            if (t.id.includes("product") || t.id.includes("Product")) {
                if (!productCache.title) {
                    productCache.title = t.textContent.trim();
                }
            }
            if (t.clientHeight > largestText.clientHeight) {
                largestText = t;
            }
        });
        if (!productCache.title) {
            productCache.title = largestText.textContent.trim();
        }
    }

    // Description Scraping
    var descriptionArray = [];
    const conciseDescriptors = centerProductColumn.querySelectorAll("div[id*=bullets], div[id*=Bullets], div[id*=overview], div[id*=Overview], div[id*=facts], div[id*=Facts]");

    if (conciseDescriptors.length == 0) {
        const allText = Array.from(centerProductColumn.querySelectorAll("span"));
        allText.forEach((text) => {
            const trimmedText = text.textContent.trim();
            if (!descriptionArray.includes(trimmedText)) {
                descriptionArray.push(trimmedText);
            }
        });
    } else {
        conciseDescriptors.forEach((section) => {
            const text = Array.from(section.querySelectorAll("span"));
            text.forEach((t) => {
                const trimmedText = t.textContent.trim();
                if(!descriptionArray.includes(trimmedText)) {
                    descriptionArray.push(trimmedText);
                }
            });
        });
    }

    productCache.descriptions = descriptionArray;

    // Product Technical Details
    var productTechnicalDetails = [];
    const technicalDetailsElement = document.querySelector("#productDetails_feature_div");
    
    if (technicalDetailsElement) {
        const detailElements = Array.from(technicalDetailsElement.querySelectorAll("tr"));
        detailElements.forEach(detail => {
            const key = detail.querySelector("th").textContent;
            const value = detail.querySelector("td").textContent;
            const newDetail = {[key]: value};
            if (key != "Customer Reviews") {
                productTechnicalDetails.push(newDetail);
            }
        });
        productCache.techDetails = productTechnicalDetails;
    }

    // Product Technical Description
    var productTechnicalDescription = [];
    const technicalDescriptionElement = document.querySelector("#productDescription_feature_div");
   
    if (technicalDescriptionElement) {
        const technicalDescriptions = Array.from(technicalDescriptionElement.querySelectorAll("span"));
        technicalDescriptions.forEach(d => {
            productTechnicalDescription.push(d.textContent);
        });
        // Join the array into a string for the final payload
        productCache.techDescription = productTechnicalDescription.join(" ");
    }
}

export function amazonProductPriceScraper(productCache: ProductCache): void {
    var priceArray = [];
    const centerProductColumn = document.querySelector("#centerCol");
    const allPrices = centerProductColumn.querySelectorAll("span[id*=price], span[id*=Price], span[id*=pricing], span[id*=pricing], span[class*=price], span[class*=Price], span[class*=pricing], span[class*=Pricing], span[class*=offscreen]");

    allPrices.forEach((span) => {
        const price = span.textContent.match(/\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/);
        if (price && !(priceArray.includes(price[0]))) {
            priceArray.push(price[0]);
        }
    });
    
    productCache.price = priceArray;
}

export function doAmazonScrape(productCache: ProductCache): void {
    if (productCache.type == 'Amazon') {
        amazonProductImageScraper(productCache);
        amazonProductTextScraper(productCache);
        amazonProductPriceScraper(productCache);
    } else { 
        console.log("Error: Could not locate Amazon product");
    }
}