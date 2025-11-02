
// // Old Product Retrieval
// function retrieveProduct(product) {


//   if (product.type === 'amazon') {

//     sendProductToServer(product) // Asynchronous

//     const socketToLocal = new WebSocket('ws://localhost:3000/products')
//     let pingInterval
//     let productReceived = false

//     socketToLocal.onopen = () => {

//       pingInterval = setInterval(() => {
        
//         console.log("sending Request...")
//         socketToLocal.send(JSON.stringify({
//           action: 'getProduct',
//           productUrl: product.url
//         }))

//       }, 1000)
//     }

//     socketToLocal.onerror = (event) => {
//       console.log("Connectioner Error: ", event)
//     }

//     socketToLocal.onmessage = (event) => {
//       const productData = JSON.parse(event.data)
//       // console.log("FULL Product: ", productData.action, " --- ", productData.message)
//       if (productData.action === 'productFound') {

//         PRODUCT = productData.message
//         clearInterval(pingInterval)
//         console.log("FOUND PRODUCT: ", PRODUCT)

//         // GET LOCAL USER ID
//         let xRayID;
        
//         chrome.storage.local.get(['xRayId']).then(async (result) => {
//           console.log("USER ID?? --> ", result)
//           PRODUCT.userID = result.xRayId
//           try {
//             const foundProduct = await sendToXray(PRODUCT)
//             console.log("What is found? --> ", foundProduct)
//             // Send message to content script
//             if (foundProduct.matched_product_title) {
//               console.log("Match Found!!!!!")
//               await new Promise((resolve) => {
//                 chrome.storage.local.set({productCache: foundProduct }, () => {
//                   resolve("doneSetting");
//                 })
//               })

//               chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//                 chrome.tabs.sendMessage(tabs[0].id, {message: "Scan Complete"}, (res) => {
//                   if (chrome.runtime.lastError) {
//                     console.error("Message failed:", chrome.runtime.lastError.message);
//                   } else {
//                     console.log("Response from content script:", res);
//                   }
//                 });
//               });
              
//             }

//             console.log("Sending message")

//             // Send message back to content script --> SCAN COMPLETE
            

            

//             // ------------------------------
//           } catch (error) {
//             console.error("Error in sendToXray: ", error)
//           }
//         })
//         // Send product to POPUP
        
//         // const cleanProduct = JSON.parse(JSON.stringify(product))
//         // chrome.storage.local.set({              
//         //   productCache: PRODUCT // Needs Changed for LLM!!!
//         // }) 

//         socketToLocal.close(1000, "Product received, closing connection")
//       }
//     }

//   } else {

//     // Send product to popup
//     sendToXray(product)
//     console.log("Product before clean: ", product)
//     const cleanProduct = JSON.parse(JSON.stringify(product))
//     console.log("shopify product: ", cleanProduct)

//     /*
//     url: '',
//     type: '',
//     price: [],
//     images: [],
//     title: null,
//     descriptions: [],
//     techDetails: [],
//     techDescription: []
//     */

//     const newProduct = {
//       images: product.images,
//       descriptions: product.descriptions,
//       prices: product.price,
//       title: product.title,
//       url: product.url,
//       type: product.type,
//       techDetails: product.techDetails,
//       techDescription: product.techDescription
//     }

//     console.log("New Product: ", newProduct)

//     chrome.storage.local.set({
//       productCache: newProduct // Needs Changed for LLM!!!
//     })

//   }


// }

// // Used for isolated server puppeteer logic
// function sendProductToServer(productCache) {
//     console.log("Sending")

//     fetch("http://localhost:3000/receive-url", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Accept": "application/json"
//         }, 
//         body: JSON.stringify({product: productCache})
//     })
//     .then(res => res.json())
//     .then(data => console.log("Server response:", data))
//     .catch(err => console.error("Error sending URL:", err));
// }

// // Maybe separate into different functions with different Guards ???
// async function sendToXray(request) {

//   try {

//     // Handle request for user info --> used to locally set userID for xRay in .onMessage() handler
//     if (request.message === 'Signed Up') {

//       console.log("User Id Request:", request);

//       const postResponse = await fetch("https://api.tryxray.ai/ext/handshake/start", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Accept": "application/json"
//         },
//         body: JSON.stringify({ MESSAGE: request.message })
//       });

//       if (!postResponse.ok) {
//         throw new Error(`HTTPS error ${postResponse.status}: ${postResponse.statusText}`)
//       }

//       const postData = await postResponse.json();
//       console.log("POST response:", postData);

//       if (!checkForUserActivation(postData)) {
//         throw new Error('Invalid userDetails response from xRay API')
//       }

//       return postData

//     } else { // Handle request for actual product match from xRay in .onMessage() handler

//       console.log("Product Requested: ", request)

//       const postResponse = await fetch("https://api.tryxray.ai/scan-from-product-json", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Accept": "application/json"
//         },
//         body: JSON.stringify({ MESSAGE: request.payload })
//       });

//       console.log("POST RESPONSE:" , postResponse)

//       if (!postResponse.ok) {
//         throw new Error(`HTTPS error ${postResponse.status}: ${postResponse.statusText}`)
//       }

//       const postData = await postResponse.json();
//       console.log("POST response:", postData);

//       return postData
//     }

//   } catch (err) {

//     console.error("Error communicating with Xray API:", err);
//     return null;

//   }

// }