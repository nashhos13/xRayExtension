import React from 'react';
import ReactDOM from 'react-dom/client';
import './options.css';

const App: React.FC<{}> = () => {
  return (
    <div>
      <img src="icon.png" alt="Icon" />
    </div>
  );
};

// Create and append the root element
const rootElement = document.createElement('div');
document.body.appendChild(rootElement);

// Use React 18's createRoot API
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

