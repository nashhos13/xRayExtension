import React from 'react';
import ReactDOM from 'react-dom/client';

// chrome.runtime.sendMessage({ greeting: "hello" }, (response) => {
//   console.log("Background replied:", response);
// });


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle the message here
  console.log("Message received:", request);

  // Send a response back if needed
  sendResponse({ status: "Message received successfully" });
});

chrome.runtime.sendMessage("Hello!!", (res) => {
  console.log("response from listener: ", res);
})
