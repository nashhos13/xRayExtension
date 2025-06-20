// TODO: content script
import React from 'react';
import ReactDOM from 'react-dom/client';
import './contentScript.css';

const images = Array.from(document.getElementsByTagName("img")).map(i => i.src)

console.log(images)

chrome.runtime.sendMessage(images, (res) => {
    console.log("response from background: ", res)
})

// chrome.runtime.sendMessage({ greeting: "hello" }, (response) => {
//   console.log("Background replied:", response);
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   // Handle the message here
//   console.log("Message received:", request);

//   // Send a response back if needed
//   sendResponse({ status: "Message received successfully" });
// });

// console.log('Injected')