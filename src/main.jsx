import React from 'react';
import ReactDOM from 'react-dom/client';
import 'chart.js/auto'; // Automatically registers all Chart.js components, controllers, scales, and plugins
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
