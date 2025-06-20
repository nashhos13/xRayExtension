import React from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    sendResponse("Message has been RECEIVED")
})

const App: React.FC<{}> = () => {
  return (
    <div>
      <img src="icon.png" alt="Icon" />
    </div>
  );
};

// Create and append the root element
// const rootElement = document.createElement('div');
// document.body.appendChild(rootElement);

// const root = ReactDOM.createRoot(rootElement);
// root.render(<App />);