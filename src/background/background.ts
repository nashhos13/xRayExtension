import React from 'react';
import ReactDOM from 'react-dom/client';

chrome.contextMenus.create({
  title: "xRay Scan",
  id: "XRS1",
  contexts: ["page"]
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle the message here
  console.log("Message received:", request);
  const product = request;
  console.log(product)

  chrome.storage.local.set({
    product,
  })


  // Send a response back if needed
  sendResponse({ status: "Message received successfully" });
});

chrome.runtime.sendMessage("Hello!!", (res) => {
  console.log("response from listener: ", res);
})

// chrome.contextMenus.onClicked.addListener((event) => {
//   chrome.scripting
//     .executeScript({
//       target: {tabId : getTabId()},
//       files: ["contentScript.js"]
//     })
// })

