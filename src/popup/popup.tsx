import React from 'react';
import ReactDOM from 'react-dom/client';
import Carousel from 'react-material-ui-carousel';
import * as Mui from '@mui/material'
import './popup.css';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    sendResponse("Message has been RECEIVED")
})

function ImageSlide( {productImages} ) {
    return (

            <Carousel 
                indicators={true}
                interval={1500}
                navButtonsAlwaysInvisible={true}
                sx={{width: '30%'}}
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
                            <img src={img} style={{
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

function ProductProfile({title, price}) {

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '50%', width: '40%'}}>
            <h1>{title}</h1>
            <h2>Price Variations: {price.join(", ")}</h2>
        </div>
    )
}

function ProductDescription({description}) {
    return (
        <div style={{width: 'auto', margin: '0 10%'}}>
            <h3>{description}</h3>
        </div>
    )
}

function PurchaseButton() {
    return (
            <Mui.Button href='/options.html'
            sx={{width: '250px', height: '85px'}} variant='contained'>
            <span style={{fontSize: '3em', fontFamily: 'Verdana'}}>Purchase</span>
            </Mui.Button>
    )
}

function cleanImgArray(images) {
    var cleanImgArray = []
    
    images.forEach((img) => {

        const imageLink = setImageLink(img)
        if (imageLink != 'NO LINK' && !cleanImgArray.includes(imageLink)) {
            cleanImgArray.push(imageLink)
        }

    })

    return cleanImgArray
}

function setImageLink(image) {
    var imageLink = ''
    
    if (image.src != '') {
        imageLink = image.src
    } else if (image.currentSrc != '') {
        imageLink = image.currentSrc
    } else {
        imageLink = "NO LINK"
    }

    return imageLink
}

chrome.storage.local.get('product').then((result) => {
    console.log("PRODUCT: ", result.product.images)

    const productImages = result.product.images
    const newImageArray = cleanImgArray(productImages)

    console.log("Prices: ", result.product.price)

    const rootElement = document.createElement('div')
    rootElement.style.height = '450px'
    rootElement.style.display = 'flex'
    rootElement.style.flexWrap = 'wrap'
    rootElement.style.alignItems = 'center';
    rootElement.style.justifyContent = 'center';
    rootElement.style.gap = '15px';
    document.body.appendChild(rootElement)
    const root = ReactDOM.createRoot(rootElement)   
    
    root.render(<>
    <ImageSlide productImages={newImageArray}/>
    <ProductProfile title={result.product.title} price={result.product.price}/>
    <ProductDescription description={result.product.description}/>
    <PurchaseButton />
    </>)


    // for (var i = 0; i < newImageArray.length; i++) {

    //     const rootElement = document.createElement('div')
    //     document.body.appendChild(rootElement)
    //     const root = ReactDOM.createRoot(rootElement)

    //     root.render(<Product
    //     image={newImageArray[i]}
    //     price="0.00"
    //     />)        
    
    // }
})
