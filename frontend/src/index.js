import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global styles, including font definitions or imports
import App from './App';
// import reportWebVitals from './reportWebVitals'; // Removed import as per project decision
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Fatal Error: The root element with ID 'root' was not found in the DOM. Ensure public/index.html contains <div id='root'></div>.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(); // Removed call as per project decision
