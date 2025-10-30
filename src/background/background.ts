import { is } from 'cheerio/dist/commonjs/api/traversing';
import React from 'react';
import ReactDOM from 'react-dom/client';

let userController = null;

chrome.contextMenus.create({
  title: "xRay Scan",
  id: "XRS1",
  contexts: ["page"]
})

export function isValidMessage(request: any): request is { message: string, payload: object } {

  const allowedMessages = new Set(["Signed Up", "Invalid Scan Attempt", "Invalid User", "ODR", "COR", "Product Request", "Abort Fetch", "Acknowledged"])

  // SAFEGUARD
  return (
    request && 
    typeof request === 'object' && 
    typeof request.message === 'string' &&
    typeof request.payload === 'object' &&
    allowedMessages.has(request.message)
  );
}

// Message Content Script
function sendToCS(messageObject) {

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    chrome.tabs.sendMessage(tabs[0].id, messageObject, (res) => {
      if (chrome.runtime.lastError) {
        console.error("Message failed:", chrome.runtime.lastError.message);
      } else {
        console.log("Response from content script:", res);
      }
    });

  })
  
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  console.log("RAW MESSAGE: ", request)

  // Handle the message here
  const validMessage = isValidMessage(request)

  if (!validMessage) {

    console.log("Message not accepted")
    return false

  }

  // If content script is activated on tryxray.ai/home
  else if (request.message === 'Signed Up') {

    (async () => {
      try {
        
        const userInfo = await fetchUserActivationFromXray(request)

        if (userInfo && checkForUserActivation(userInfo)) {
          console.log("USER INFO: ", userInfo)
          // Set user as valid user
          await chrome.storage.local.set({
            xRayId: userInfo.user_id,
            xRayCertified: true
          })

          // Add color to button (Inidicating ready for use)
          sendToCS({status: "Success", message: "Update Button"})

        }


        sendResponse({status: "Success", message: "User Activated"})
       

      } catch (err) {
        console.error("Error in fetching User ID:", err);
        sendResponse({ status: "Failed", message: "User ID Not Received" });
      }

    })();

    return true

  } else if (request.message === 'Invalid Scan Attempt') { // Pressing the button before they are signed up
    
    console.log("Attempted Scan --> ", request)

    sendToCS({status: "Success", message: "Send To Xray"})

    return true

  } else if (request.message == 'Invalid User') {

    sendResponse({status: "Success", message: "Nothing Done"})
    return true // Don't send anything if user doesn't click button, and isn't signed up

  } else if (request.message === 'ODR') { // Requesting order details from xRay api

    console.log("Order Details requested --> ", request);

    (async () => {
      try {
        const details = await fetch("https://api.tryxray.ai/sku-selection", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({ MESSAGE: request.payload })
                    });

        const response = await details.json()

        sendResponse({status: "Success", message: response})

      } catch (err) {

        console.error("Error in ODR request:", err)
        sendResponse({status: "Failed", message: 'Could not fetch order details'})

      }
      
    })();

    return true

  } else if (request.message === 'COR') { // Requesting checkout session from stripe

    console.log("Checkout Requested --> ", request);

    (async () => {
      try {
        const res = await fetch("https://api.tryxray.ai/ext-create-checkout-session", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({message: request.payload})
                    })

        const url_payload = await res.json()

        console.log("Response Payload Updated: ", url_payload)

        if (url_payload) {
                  
            chrome.storage.local.set({
                checkoutID: url_payload['checkout_session_id']
            })

            console.log("Attempt URL switch")
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.update(tabs[0].id, { url: url_payload['checkout_url']})
            })
        } else {

            console.error('No URL returned from backend');
            throw new Error('No URL returned from backend')

        }

        sendResponse({status: "Success", message: url_payload})

      } catch (err) {

        console.error("Error in retrieving Stripe Checkout Session: ", err)
        sendResponse({status: "Failed", message: "Could Not Receive Stripe Checkout"})

      }

    })();

    return true

  } else if (request.message === 'Product Request') {

    console.log("Requesting Product: ", request )
    const product = request

    // Set as a promise that resolves to productFound = true || false
    retrieveProduct(product).then((productFound) => {
      chrome.storage.local.set({
        scanComplete: true
      }).then(() => {
        if (productFound) {
          sendResponse({ status: "Success", message: "Product Found" });
        } else {
          sendResponse({ status: "Failed", message: "Product Search Failed" })
        }
      })

    })
    .catch((err) => {

      console.error("Error retrieving product:", err);
      sendResponse({ status: "Failed", message: "Error in retrieveProduct" });

    })

    // sendToCS({status: "Success", message: "Scan Complete"})

    return true

  } else if (request.message === 'Abort Fetch') {

    if (userController) {
      userController.abort()
      console.log("Fetch aborted due to tab switch")
      sendResponse({status: 'Success', message: 'Fetch Aborted'})
    }

    return true

  } else {

    sendResponse({ status: "Failed", message: "Unknown message type" });
    return true;

  }

});


function retrieveProduct(product) {

  console.log("USING NEW RETRIEVAL")

  // Ensure product being requested is attached to a valid userID
  return chrome.storage.local.get('xRayId').then(async (result) => {
    console.log("User ID: ", result.xRayId)

    if (result.xRayId) {
      product.payload.userID = result.xRayId
    } else {
      throw new Error('Do not have valid user ID attached to product request')
    }

    try {

      // Send Scraped Product to xRay API
      const foundProduct = await fetchProductFromXray(product) // wait for API to return product (good or bad)
      console.log("What is found? --> ", foundProduct)

      // Set Local Product Cache before sending message
      if (foundProduct && checkForProperProduct(foundProduct)) {
        await chrome.storage.local.set({
          productCache: foundProduct
        }) 
        
        sendToCS({status: "Success", message: "Scan Complete"})
        
        console.log("Sending product")
        return true

      } else if (foundProduct === 'Error') {

        sendToCS({status: 'Failed', message: 'Timeout During Request'})
        throw new Error("Not proper returned Product from Xray")

      } else if (foundProduct === 'No Match') {
        await chrome.storage.local.set({
          productCache: foundProduct
        }) 

        sendToCS({status: 'Success', message: 'Scan Complete'})
        throw new Error("Error During Request to xRay")
      }
    
      return false

    } catch (error) {

      console.error("Error in sendToXray: ", error)
      return false
    
    }

  })

}

// Check for xRay response formats

function checkForUserActivation(object: any): object is {code: string, expires_in: number, user_id: string} {
 
  return (
    object &&
    typeof object.code === 'string' &&
    typeof object.expires_in === 'number' &&
    typeof object.user_id === 'string'
  )

}

function checkForProperProduct(object: any): object is {
    matched_product_images: any,
    matched_product_title: string,
    savings_amount: string,
    scan_run_id: string,
    skus: any,
    source_price: string,
    their_price: string,
    status: string
  } {

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
  )

}

function mergeAbortSignals(...signals) {
  const controller = new AbortController();

  signals.forEach(signal => {
    if (!signal) return;
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  });

  return controller.signal;
}


async function fetchUserActivationFromXray(request) {

  userController = new AbortController();
 
  const timeOutController = new AbortController();
  setTimeout(() => timeOutController.abort(), 20000)

  const mergedSignal = mergeAbortSignals(timeOutController.signal, userController.signal)

  try {
    // Handle request for user info --> used to locally set userID for xRay in .onMessage() handler
    if (request.message === 'Signed Up') {

      console.log("User Id Request:", request);

      const postResponse = await fetch("https://api.tryxray.ai/ext/handshake/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ MESSAGE: request.message }),
        // signal: mergedSignal
      });

      if (!postResponse.ok) {
        throw new Error(`HTTPS error ${postResponse.status}: ${postResponse.statusText}`)
      }

      const postData = await postResponse.json();
      console.log("POST response:", postData);

      if (!checkForUserActivation(postData)) {
        throw new Error('Invalid userDetails response from xRay API')
      }

      return postData

    } else {
      throw new Error('Faulty User Activation Request')
    }

  } catch (err) {

    console.error("Error communicating with Xray User Activation API: ", err);
    return null;

  } finally {

    userController = null
    
  }
}

async function fetchProductFromXray(request) {

  userController = new AbortController();

  const timeOutController = new AbortController();
  setTimeout(() => timeOutController.abort(), 20000);

  const mergedSignal = mergeAbortSignals(timeOutController.signal, userController.signal)

  try {

    if (request.message === 'Product Request') { // Handle request for actual product match from xRay in .onMessage() handler

      console.log("Product Requested: ", request)

      const postResponse = await fetch("https://api.tryxray.ai/scan-from-product-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ MESSAGE: request.payload }),
        // signal: mergedSignal
      });

      console.log("POST RESPONSE:" , postResponse)


      const postData = await postResponse.json();
      console.log("POST response:", postData);

      if (!checkForProperProduct(postData)) {
        return "No Match"
        // throw new Error('Invalid Product Returned From xRay API')
      }

      return postData

    } 

    return "improper request"

  } catch (err) {

    console.error("Error communicating with Xray API:", err);
    return "Error";

  } finally {

    userController = null

  }
}




